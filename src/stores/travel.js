import { defineStore } from "pinia";
/**
 * 여행 계획 관리를 위한 Pinia 스토어
 * pinia-plugin-persistedstate를 사용하여 자동 저장/복원
 */
export const useTravelStore = defineStore("travel", {
  state: () => ({
    // 여행 계획 기본 정보
    tripInfo: {
      title: "",
      region: null, // { provinceId, provinceName, districtId, districtName }
      startDate: null,
      endDate: null,
      memo: "",
    },

    centerCoord: { x: null, y: null },

    // 일차 별 장소 정보 (2차원 배열)
    // itinerary[0]은 1일차 장소 배열, itinerary[1]은 2일차 장소 배열...
    itinerary: [],

    // 일차 별 숙소 정보 (1차원 배열)
    // hotels[0]은 1일차 숙소, hotels[1]은 2일차 숙소...
    // 각 요소는 장소 객체 또는 null
    hotels: [],

    // 현재 선택 중인 일차
    currentDay: 0,

    // 임시 저장된 선택 장소 (아직 추가되지 않은) - 저장하지 않음
    selectedPlace: null,

    // 장소 검색 모드 ('place' | 'hotel') - 저장하지 않음
    searchMode: "place",

    // 경로 API 호출 관련 상태
    routeApiCallCount: 0, // API 호출 횟수
    hasRouteOptimization: false, // 경로 최적화 여부
    lastRouteApiCall: null, // 마지막 API 호출 시간

    // 데이터 로드 상태 관리
    isDataLoaded: false,
    lastSavedAt: null, // 마지막 저장 시간
  }),

  // pinia-plugin-persistedstate 설정
  persist: {
    key: "savedTrip", // localStorage 키 (기존과 동일)
    storage: localStorage,

    // 저장할 state 선택 (임시 데이터는 제외)
    paths: [
      "tripInfo",
      "itinerary",
      "hotels",
      "currentDay",
      "routeApiCallCount",
      "hasRouteOptimization",
      "lastRouteApiCall",
      "lastSavedAt",
    ],

    // 커스텀 serializer (기존 데이터 구조와 호환성 유지)
    serializer: {
      serialize: (state) => {
        const dataToSave = {
          tripInfo: state.tripInfo,
          itinerary: state.itinerary,
          hotels: state.hotels,
          currentDay: state.currentDay,
          routeApiCallCount: state.routeApiCallCount,
          hasRouteOptimization: state.hasRouteOptimization,
          lastRouteApiCall: state.lastRouteApiCall,
          lastSavedAt: new Date().toISOString(),
          // 버전 정보 추가 (향후 마이그레이션용)
          version: "2.0.0",
          savedBy: "pinia-plugin-persistedstate",
        };
        return JSON.stringify(dataToSave);
      },

      deserialize: (data) => {
        try {
          const parsed = JSON.parse(data);

          // 기존 데이터 구조 호환성 처리
          if (!parsed.version) {
            // 구버전 데이터인 경우 기본 구조로 변환
            return {
              tripInfo: parsed.tripInfo || {},
              itinerary: parsed.itinerary || [],
              hotels: parsed.hotels || [],
              currentDay: parsed.currentDay || 0,
              routeApiCallCount: parsed.routeApiCallCount || 0,
              hasRouteOptimization: parsed.hasRouteOptimization || false,
              lastRouteApiCall: parsed.lastRouteApiCall || null,
              lastSavedAt: new Date().toISOString(),
            };
          }

          return parsed;
        } catch (error) {
          return {};
        }
      },
    },

    // 저장 전 후 훅
    beforeRestore: (context) => {
      // 복원 시작
    },

    afterRestore: (context) => {
      context.store.isDataLoaded = true;
      // 데이터 정합성 검사 및 조정
      context.store.validateAndAdjustData();
    },
  },

  getters: {
    /**
     * 데이터 로드 여부
     */
    isDataReady: (state) => {
      return state.isDataLoaded;
    },

    /**
     * 경로 표시 여부 결정
     */
    shouldShowRoutes: (state) => {
      return state.routeApiCallCount > 0 && state.hasRouteOptimization;
    },

    /**
     * 첫 번째 경로 요청 여부
     */
    isFirstRouteRequest: (state) => {
      return state.routeApiCallCount === 0;
    },

    /**
     * 전체 여행 기간(일)
     */
    tripDuration: (state) => {
      if (!state.tripInfo.startDate || !state.tripInfo.endDate) return 0;

      const start = new Date(state.tripInfo.startDate);
      const end = new Date(state.tripInfo.endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return diffDays + 1; // 출발일과 도착일 포함
    },

    /**
     * 현재 일차의 장소 목록
     */
    currentDayPlaces: (state) => {
      // 현재 일차에 해당하는 장소 목록이 없으면 빈 배열 반환
      if (!state.itinerary[state.currentDay]) return [];

      return state.itinerary[state.currentDay];
    },

    /**
     * 현재 일차의 숙소
     */
    currentDayHotel: (state) => {
      return state.hotels[state.currentDay] || null;
    },

    /**
     * 일차 별 장소 개수
     */
    placesCountByDay: (state) => {
      return state.itinerary.map((day) => (day ? day.length : 0));
    },

    /**
     * 일차 별 숙소 유무
     */
    hotelsCountByDay: (state) => {
      return state.hotels.map((hotel) => (hotel ? 1 : 0));
    },

    /**
     * 전체 장소 개수
     */
    totalPlacesCount: (state) => {
      return state.itinerary.reduce(
        (sum, day) => sum + (day ? day.length : 0),
        0
      );
    },

    /**
     * 전체 숙소 개수
     */
    totalHotelsCount: (state) => {
      return state.hotels.reduce((sum, hotel) => sum + (hotel ? 1 : 0), 0);
    },

    /**
     * 여행 날짜 배열
     */
    tripDates: (state) => {
      if (!state.tripInfo.startDate || !state.tripInfo.endDate) return [];

      const dates = [];
      const startDate = new Date(state.tripInfo.startDate);
      const endDate = new Date(state.tripInfo.endDate);

      // 시작일부터 종료일까지의 모든 날짜 생성
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return dates;
    },

    /**
     * 특정 일차의 날짜
     */
    getDayDate: (state) => (day) => {
      if (!state.tripInfo.startDate) return null;

      const startDate = new Date(state.tripInfo.startDate);
      const dayDate = new Date(startDate);
      dayDate.setDate(startDate.getDate() + day);

      return dayDate;
    },

    /**
     * 포맷된 날짜 문자열 반환
     */
    formatDate: () => (date) => {
      if (!date) return "";

      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const dayOfWeek = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];

      return `${month}월 ${day}일 (${dayOfWeek})`;
    },

    /**
     * 전체 여행 일정을 API 형식으로 반환
     */
    apiFormat: (state) => {
      return state.itinerary.map((dayPlaces, index) => {
        const hotel = state.hotels[index];
        return {
          day: index + 1,
          startPlaceId: hotel ? hotel.id : null, // 숙소를 출발지로 사용
          placeIds: dayPlaces ? dayPlaces.map((place) => place.id) : [],
        };
      });
    },

    /**
     * 특정 일차의 일정을 API 형식으로 반환
     */
    getDayApiFormat: (state) => (day) => {
      if (day < 0 || day >= state.itinerary.length) return null;

      const dayPlaces = state.itinerary[day];
      const hotel = state.hotels[day];

      return {
        day: day + 1,
        startPlaceId: hotel ? hotel.id : null,
        placeIds: dayPlaces ? dayPlaces.map((place) => place.id) : [],
      };
    },

    /**
     * 현재 일차의 일정을 API 형식으로 반환
     */
    currentDayApiFormat: (state) => {
      const dayPlaces = state.itinerary[state.currentDay];
      const hotel = state.hotels[state.currentDay];

      return {
        day: state.currentDay + 1,
        startPlaceId: hotel ? hotel.id : null,
        placeIds: dayPlaces ? dayPlaces.map((place) => place.id) : [],
      };
    },
  },

  actions: {
    /**
     * 데이터 정합성 검사 및 조정
     */
    validateAndAdjustData() {
      // 여행 기간에 맞게 배열 조정
      this.adjustItinerary();
      this.adjustHotels();

      // 현재 일차 범위 검증
      if (this.currentDay >= this.tripDuration || this.currentDay < 0) {
        this.currentDay = 0;
      }
    },

    /**
     * 여행 데이터 저장 (기존 메서드명 유지)
     * pinia-plugin-persistedstate가 자동으로 처리하지만,
     * 호환성을 위해 메서드 유지
     */
    saveAllTripData() {
      try {
        // 마지막 저장 시간 업데이트 (plugin이 자동으로 저장함)
        this.lastSavedAt = new Date().toISOString();

        // 성공 결과 반환 (기존 호환성)
        return {
          success: true,
          message: "여행 데이터가 저장되었습니다.",
          timestamp: this.lastSavedAt,
        };
      } catch (error) {
        return {
          success: false,
          message: "저장 중 오류가 발생했습니다.",
          error: error.message,
        };
      }
    },

    /**
     * 수동 저장 트리거 (즉시 저장이 필요한 경우)
     */
    forceSave() {
      this.saveAllTripData();
    },

    /**
     * 경로 API 호출 횟수 증가
     */
    incrementRouteApiCall() {
      this.routeApiCallCount++;
      this.lastRouteApiCall = new Date().toISOString();
    },

    /**
     * 경로 최적화 상태 설정
     */
    setRouteOptimization(hasOptimization) {
      this.hasRouteOptimization = hasOptimization;
    },

    /**
     * 경로 관련 상태 초기화
     */
    resetRouteState() {
      this.routeApiCallCount = 0;
      this.hasRouteOptimization = false;
      this.lastRouteApiCall = null;
    },

    /**
     * 여행 기본 정보 설정
     */
    setTripInfo({ title, region, startDate, endDate, memo }) {
      this.tripInfo = {
        ...this.tripInfo,
        ...(title !== undefined && { title }),
        ...(region !== undefined && { region }),
        ...(startDate !== undefined && { startDate }),
        ...(endDate !== undefined && { endDate }),
        ...(memo !== undefined && { memo }),
      };

      // 여행 기간이 변경되면 itinerary와 hotels 배열도 조정
      if (startDate !== undefined || endDate !== undefined) {
        this.adjustItinerary();
        this.adjustHotels();
      }
    },

    /**
     * 여행 기간에 맞게 itinerary 배열 조정
     */
    adjustItinerary() {
      const duration = this.tripDuration;

      // 여행 기간이 0이하면 초기화
      if (duration <= 0) {
        this.itinerary = [];
        this.currentDay = 0;
        return;
      }

      // 기존 itinerary 보존하면서 새 기간에 맞게 조정
      const newItinerary = Array(duration)
        .fill()
        .map((_, index) => {
          // 기존 일차 데이터가 있으면 유지, 없으면 빈 배열
          return this.itinerary[index] || [];
        });

      this.itinerary = newItinerary;

      // 현재 일차가 유효한 범위를 벗어나면 초기화
      if (this.currentDay >= duration) {
        this.currentDay = 0;
      }
    },

    /**
     * 여행 기간에 맞게 hotels 배열 조정
     */
    adjustHotels() {
      const duration = this.tripDuration;

      // 여행 기간이 0이하면 초기화
      if (duration <= 0) {
        this.hotels = [];
        return;
      }

      // 기존 hotels 보존하면서 새 기간에 맞게 조정
      const newHotels = Array(duration)
        .fill()
        .map((_, index) => {
          // 기존 일차 숙소 데이터가 있으면 유지, 없으면 null
          return this.hotels[index] || null;
        });

      this.hotels = newHotels;
    },

    /**
     * 현재 일차 변경
     */
    setCurrentDay(day) {
      if (day >= 0 && day < this.tripDuration) {
        this.currentDay = day;
      }
    },

    /**
     * 선택한 장소 저장 (임시) - 저장되지 않음
     */
    selectPlace(place) {
      this.selectedPlace = place;
    },

    /**
     * 장소를 현재 일차에 추가
     */
    addPlace(place) {
      // place가 없으면 현재 선택된 장소 사용
      const placeToAdd = place || this.selectedPlace;

      if (!placeToAdd) return false;

      // 해당 일차의 장소 배열이 없으면 생성
      if (!this.itinerary[this.currentDay]) {
        this.itinerary[this.currentDay] = [];
      }

      // 장소에 메모와 방문 시간 정보 추가
      const placeWithDetails = {
        ...placeToAdd,
        memo: "",
        visitTime: null,
        addedAt: new Date().toISOString(),
      };

      // 장소 추가
      this.itinerary[this.currentDay].push(placeWithDetails);

      // 선택된 장소 초기화
      this.selectedPlace = null;

      return true;
    },

    /**
     * 숙소를 특정 일차에 추가
     */
    addHotel(place, day = null) {
      // place가 없으면 현재 선택된 장소 사용
      const hotelToAdd = place || this.selectedPlace;
      const targetDay = day !== null ? day : this.currentDay;

      if (!hotelToAdd) return false;

      // 유효한 일차인지 확인
      if (targetDay < 0 || targetDay >= this.tripDuration) return false;

      // 숙소에 기본 정보 추가
      const hotelWithDetails = {
        ...hotelToAdd,
        memo: "",
        addedAt: new Date().toISOString(),
      };

      // 숙소 설정 (기존 숙소가 있으면 교체)
      this.hotels[targetDay] = hotelWithDetails;

      // 선택된 장소 초기화
      this.selectedPlace = null;

      return true;
    },

    /**
     * 현재 일차에 숙소 추가
     */
    addCurrentDayHotel(place) {
      return this.addHotel(place, this.currentDay);
    },

    /**
     * 장소 제거
     */
    removePlace(day, index) {
      if (this.itinerary[day] && this.itinerary[day][index]) {
        this.itinerary[day].splice(index, 1);
      }
    },

    /**
     * 숙소 제거
     */
    removeHotel(day) {
      if (day >= 0 && day < this.hotels.length) {
        this.hotels[day] = null;
      }
    },

    /**
     * 현재 일차에서 장소 제거
     */
    removeCurrentDayPlace(index) {
      this.removePlace(this.currentDay, index);
    },

    /**
     * 현재 일차에서 숙소 제거
     */
    removeCurrentDayHotel() {
      this.removeHotel(this.currentDay);
    },

    /**
     * 장소를 다른 일차로 이동
     */
    movePlaceToAnotherDay(fromDay, fromIndex, toDay) {
      if (
        !this.itinerary[fromDay] ||
        fromIndex < 0 ||
        fromIndex >= this.itinerary[fromDay].length ||
        toDay < 0 ||
        toDay >= this.tripDuration
      ) {
        return;
      }

      // 목적지 일차의 장소 배열이 없으면 생성
      if (!this.itinerary[toDay]) {
        this.itinerary[toDay] = [];
      }

      // 장소 이동
      const place = this.itinerary[fromDay][fromIndex];
      this.itinerary[fromDay].splice(fromIndex, 1);
      this.itinerary[toDay].push(place);
    },

    /**
     * 숙소를 다른 일차로 이동
     */
    moveHotelToAnotherDay(fromDay, toDay) {
      if (
        fromDay < 0 ||
        fromDay >= this.tripDuration ||
        toDay < 0 ||
        toDay >= this.tripDuration ||
        !this.hotels[fromDay]
      ) {
        return false;
      }

      // 숙소 이동
      const hotel = this.hotels[fromDay];
      this.hotels[fromDay] = null;
      this.hotels[toDay] = hotel;

      return true;
    },

    /**
     * 숙소 정보 업데이트
     */
    updateHotel(day, hotelData) {
      if (day >= 0 && day < this.hotels.length && this.hotels[day]) {
        this.hotels[day] = {
          ...this.hotels[day],
          ...hotelData,
        };
        return true;
      }
      return false;
    },

    /**
     * 현재 일차 숙소 정보 업데이트
     */
    updateCurrentDayHotel(hotelData) {
      return this.updateHotel(this.currentDay, hotelData);
    },

    /**
     * 특정 일차에 숙소가 있는지 확인
     */
    hasHotelOnDay(day) {
      return day >= 0 && day < this.hotels.length && this.hotels[day] !== null;
    },

    /**
     * 현재 일차에 숙소가 있는지 확인
     */
    hasCurrentDayHotel() {
      return this.hasHotelOnDay(this.currentDay);
    },

    /**
     * 검색 모드 설정 (장소 또는 숙소) - 저장되지 않음
     */
    setSearchMode(mode) {
      if (mode === "place" || mode === "hotel") {
        this.searchMode = mode;
      }
    },

    /**
     * 장소 검색 모드로 설정
     */
    setPlaceSearchMode() {
      this.searchMode = "place";
    },

    /**
     * 숙소 검색 모드로 설정
     */
    setHotelSearchMode() {
      this.searchMode = "hotel";
    },

    /**
     * 최적화된 경로 응답을 기반으로 일차별 방문지 순서 재정렬
     * @param {Object} routeResponse - API 응답 객체 (전체 response 또는 response.data)
     * @returns {Object} 성공/실패 결과와 메시지
     */
    reorderPlacesByOptimizedRoutes(routeResponse) {
      try {
        if (!routeResponse) {
          return { success: false, message: "API 응답이 없습니다." };
        }

        // 실제 데이터 위치 찾기
        let actualData = null;

        // Case 1: 이미 data.data 형태로 전달된 경우
        if (routeResponse.data && routeResponse.data.paths) {
          actualData = routeResponse.data;
        }
        // Case 2: 중첩된 data.data.data 형태인 경우 (axios 응답)
        else if (
          routeResponse.data &&
          routeResponse.data.data &&
          routeResponse.data.data.paths
        ) {
          actualData = routeResponse.data.data;
        }
        // Case 3: 직접 paths가 있는 경우
        else if (routeResponse.paths) {
          actualData = routeResponse;
        } else {
          return {
            success: false,
            message: "paths 데이터를 찾을 수 없습니다.",
          };
        }

        if (!Array.isArray(actualData.paths)) {
          return { success: false, message: "paths가 배열이 아닙니다." };
        }

        let reorderedCount = 0;
        const results = [];

        // 각 일차별로 경로 처리
        actualData.paths.forEach((dayPath) => {
          const dayIndex = dayPath.day - 1; // 1일차 = index 0

          // 유효한 일차인지 확인
          if (dayIndex < 0 || dayIndex >= this.itinerary.length) {
            results.push({
              day: dayPath.day,
              success: false,
              message: `${dayPath.day}일차는 존재하지 않습니다.`,
            });
            return;
          }

          // 현재 일차의 장소들
          const currentDayPlaces = this.itinerary[dayIndex] || [];

          if (currentDayPlaces.length === 0) {
            results.push({
              day: dayPath.day,
              success: true,
              message: `${dayPath.day}일차에 장소가 없습니다.`,
            });
            return;
          }

          // path 배열 확인
          if (!dayPath.path || !Array.isArray(dayPath.path)) {
            results.push({
              day: dayPath.day,
              success: false,
              message: `${dayPath.day}일차의 경로 데이터가 올바르지 않습니다.`,
            });
            return;
          }

          // 경로에서 방문지 순서 추출
          const optimizedOrder = [];

          if (dayPath.path.length > 0) {
            // 첫 번째 세그먼트의 destinationId (첫 번째 방문지)
            if (dayPath.path[0] && dayPath.path[0].destinationId) {
              const firstDestinationId = dayPath.path[0].destinationId;

              const firstDestination = currentDayPlaces.find(
                (place) => place.id === firstDestinationId
              );
              if (firstDestination) {
                optimizedOrder.push({
                  id: firstDestination.id,
                  placeName: firstDestination.placeName,
                });
              }
            }

            // 두 번째 세그먼트부터의 origin들 처리
            dayPath.path.forEach((pathSegment, segmentIndex) => {
              if (segmentIndex > 0 && pathSegment.origin) {
                const placeId = pathSegment.origin.id;
                const placeName = pathSegment.origin.placeName;

                // 현재 일차 장소 목록에서 해당 장소가 있는지 확인
                const foundPlace = currentDayPlaces.find(
                  (place) => place.id === placeId
                );

                if (foundPlace) {
                  // 이미 추가된 장소인지 확인
                  const alreadyAdded = optimizedOrder.find(
                    (item) => item.id === placeId
                  );
                  if (!alreadyAdded) {
                    optimizedOrder.push({
                      id: placeId,
                      placeName: placeName,
                    });
                  }
                }
              }
            });
          }

          if (optimizedOrder.length === 0) {
            results.push({
              day: dayPath.day,
              success: false,
              message: `${dayPath.day}일차의 최적화 경로를 찾을 수 없습니다.`,
            });
            return;
          }

          // 현재 장소들을 최적화된 순서로 재정렬
          const reorderedPlaces = [];
          const usedPlaces = new Set();

          // 최적화된 순서대로 장소 찾기
          optimizedOrder.forEach((optimizedPlace) => {
            const foundPlace = currentDayPlaces.find(
              (place) =>
                place.id === optimizedPlace.id && !usedPlaces.has(place.id)
            );

            if (foundPlace) {
              reorderedPlaces.push(foundPlace);
              usedPlaces.add(foundPlace.id);
            }
          });

          // 최적화 순서에 없는 나머지 장소들 추가
          currentDayPlaces.forEach((place) => {
            if (!usedPlaces.has(place.id)) {
              reorderedPlaces.push(place);
            }
          });

          // 순서가 실제로 변경되었는지 확인
          const hasChanged = !currentDayPlaces.every(
            (place, index) =>
              reorderedPlaces[index] && place.id === reorderedPlaces[index].id
          );

          if (hasChanged) {
            // 일차별 장소 순서 업데이트
            this.itinerary[dayIndex] = reorderedPlaces;
            reorderedCount++;

            results.push({
              day: dayPath.day,
              success: true,
              message: `${dayPath.day}일차 순서가 최적화되었습니다. (${reorderedPlaces.length}개 장소)`,
              placesCount: reorderedPlaces.length,
              reordered: true,
            });
          } else {
            results.push({
              day: dayPath.day,
              success: true,
              message: `${dayPath.day}일차는 이미 최적 순서입니다.`,
              placesCount: reorderedPlaces.length,
              reordered: false,
            });
          }
        });

        // 경로 최적화 완료 상태 설정
        this.setRouteOptimization(true);

        const finalResult = {
          success: true,
          message: `총 ${reorderedCount}개 일차의 순서가 최적화되었습니다.`,
          reorderedDays: reorderedCount,
          totalDays: actualData.paths.length,
          details: results,
        };

        return finalResult;
      } catch (error) {
        this.setRouteOptimization(false);
        return {
          success: false,
          message: "경로 최적화 처리 중 오류가 발생했습니다.",
          error: error.message,
        };
      }
    },

    /**
     * 특정 일차의 장소 순서를 수동으로 재정렬
     * @param {number} day - 일차 (0부터 시작)
     * @param {Array} newOrder - 새로운 순서의 장소 ID 배열
     * @returns {boolean} 성공 여부
     */
    reorderPlacesInDay(day, newOrder) {
      if (day < 0 || day >= this.itinerary.length || !this.itinerary[day]) {
        return false;
      }

      const currentPlaces = this.itinerary[day];
      const reorderedPlaces = [];

      // 새로운 순서대로 장소 배치
      newOrder.forEach((placeId) => {
        const place = currentPlaces.find((p) => p.id === placeId);
        if (place) {
          reorderedPlaces.push(place);
        }
      });

      // 순서에 없는 나머지 장소들 추가
      currentPlaces.forEach((place) => {
        if (!newOrder.includes(place.id)) {
          reorderedPlaces.push(place);
        }
      });

      this.itinerary[day] = reorderedPlaces;

      return true;
    },

    /**
     * 여행 계획 초기화
     */
    resetTrip() {
      this.tripInfo = {
        title: "",
        region: null,
        startDate: null,
        endDate: null,
        memo: "",
      };
      this.itinerary = [];
      this.hotels = [];
      this.currentDay = 0;
      this.selectedPlace = null;
      this.searchMode = "place";
      this.resetRouteState(); // 경로 상태도 초기화
      this.lastSavedAt = null;
    },

    /**
     * 여행 계획 데이터 불러오기 (기존 메서드명 유지)
     * plugin이 자동으로 복원하지만, 수동 로드가 필요한 경우 사용
     */
    loadTrip(tripData) {
      if (!tripData) return;

      // 여행 기본 정보 불러오기
      this.tripInfo = tripData.tripInfo || this.tripInfo;

      // 일정 정보 불러오기
      this.itinerary = tripData.itinerary || [];

      // 숙소 정보 불러오기
      this.hotels = tripData.hotels || [];

      // 경로 상태 불러오기
      this.routeApiCallCount = tripData.routeApiCallCount || 0;
      this.hasRouteOptimization = tripData.hasRouteOptimization || false;

      // 기간에 맞게 일정 배열 조정
      this.adjustItinerary();
      this.adjustHotels();

      // 현재 일차 초기화
      this.currentDay = 0;

      // 데이터 로드 상태 설정
      this.isDataLoaded = true;
    },

    /**
     * 여행 계획 저장용 데이터 생성 (기존 메서드명 유지)
     */
    getSaveData() {
      return {
        tripInfo: this.tripInfo,
        itinerary: this.itinerary,
        hotels: this.hotels,
        routeApiCallCount: this.routeApiCallCount,
        hasRouteOptimization: this.hasRouteOptimization,
        lastSavedAt: this.lastSavedAt,
        version: "2.0.0",
      };
    },

    /**
     * 장소 순서 변경 (같은 일차 내에서)
     */
    movePlaceInDay(day, fromIndex, toIndex) {
      if (!this.itinerary[day]) return;

      // 범위 체크
      if (
        fromIndex < 0 ||
        fromIndex >= this.itinerary[day].length ||
        toIndex < 0 ||
        toIndex >= this.itinerary[day].length
      ) {
        return;
      }

      // 장소 순서 변경
      const place = this.itinerary[day][fromIndex];
      this.itinerary[day].splice(fromIndex, 1);
      this.itinerary[day].splice(toIndex, 0, place);
    },

    /**
     * 저장된 데이터 존재 여부 확인
     */
    hasSavedData() {
      try {
        const saved = localStorage.getItem("savedTrip");
        return !!saved;
      } catch (error) {
        return false;
      }
    },

    /**
     * 저장된 데이터 삭제
     */
    clearSavedData() {
      try {
        localStorage.removeItem("savedTrip");
        this.resetTrip();
        return true;
      } catch (error) {
        return false;
      }
    },
  },
});

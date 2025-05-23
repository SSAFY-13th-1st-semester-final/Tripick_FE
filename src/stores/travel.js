import { defineStore } from "pinia";

/**
 * 여행 계획 관리를 위한 Pinia 스토어
 * sessionStorage와 localStorage를 분리하여 관리
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
    itinerary: [],

    // 일차 별 숙소 정보 (1차원 배열)
    hotels: [],

    // 현재 선택 중인 일차
    currentDay: 0,

    // 임시 저장된 선택 장소 (저장하지 않음)
    selectedPlace: null,

    // 장소 검색 모드 ('place' | 'hotel') (저장하지 않음)
    searchMode: "place",

    // 경로 API 호출 관련 상태
    routeApiCallCount: 0,
    hasRouteOptimization: false,
    lastRouteApiCall: null,

    // 데이터 로드 상태 관리
    isDataLoaded: false,
    lastSavedAt: null,

    // 저장 모드 플래그
    isTemporarySaved: false, // localStorage에 저장된 상태인지
  }),

  getters: {
    /**
     * 데이터 로드 여부
     */
    isDataReady: (state) => {
      return state.isDataLoaded;
    },

    /**
     * 여행 데이터가 있는지 확인
     */
    hasTripData: (state) => {
      return Boolean(
        state.tripInfo.title && 
        state.tripInfo.startDate && 
        state.tripInfo.endDate
      );
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

      return diffDays + 1;
    },

    /**
     * 현재 일차의 장소 목록
     */
    currentDayPlaces: (state) => {
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
          startPlaceId: hotel ? hotel.id : null,
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
     * TripPlanner에서 여행 정보를 sessionStorage에 임시 저장
     */
    saveNewTripToSession(tripData) {
      try {
        const dataToSave = {
          tripInfo: tripData,
          timestamp: new Date().toISOString(),
          version: "2.0.0",
        };
        sessionStorage.setItem('newTripInfo', JSON.stringify(dataToSave));
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },

    /**
     * sessionStorage에서 신규 여행 정보 불러오기
     */
    loadNewTripFromSession() {
      try {
        const data = sessionStorage.getItem('newTripInfo');
        if (!data) return null;

        const parsed = JSON.parse(data);
        
        // 날짜 문자열을 Date 객체로 변환
        if (parsed.tripInfo) {
          if (parsed.tripInfo.startDate) {
            parsed.tripInfo.startDate = new Date(parsed.tripInfo.startDate);
          }
          if (parsed.tripInfo.endDate) {
            parsed.tripInfo.endDate = new Date(parsed.tripInfo.endDate);
          }
        }

        return parsed.tripInfo;
      } catch (error) {
        return null;
      }
    },

    /**
     * localStorage에 여행 데이터가 있는지 확인
     */
    hasLocalStorageTrip() {
      try {
        const data = localStorage.getItem('savedTrip');
        return !!data;
      } catch (error) {
        return false;
      }
    },

    /**
     * localStorage에서 여행 데이터 불러오기
     */
    loadTripFromLocalStorage() {
      try {
        const data = localStorage.getItem('savedTrip');
        if (!data) return null;

        const parsed = JSON.parse(data);

        // 날짜 문자열을 Date 객체로 변환
        if (parsed.tripInfo) {
          if (parsed.tripInfo.startDate) {
            parsed.tripInfo.startDate = new Date(parsed.tripInfo.startDate);
          }
          if (parsed.tripInfo.endDate) {
            parsed.tripInfo.endDate = new Date(parsed.tripInfo.endDate);
          }
        }

        return parsed;
      } catch (error) {
        return null;
      }
    },

    /**
     * localStorage에 여행 데이터 저장 (임시저장)
     */
    saveTripToLocalStorage() {
      try {
        const dataToSave = {
          tripInfo: this.tripInfo,
          itinerary: this.itinerary,
          hotels: this.hotels,
          currentDay: this.currentDay,
          routeApiCallCount: this.routeApiCallCount,
          hasRouteOptimization: this.hasRouteOptimization,
          lastRouteApiCall: this.lastRouteApiCall,
          lastSavedAt: new Date().toISOString(),
          version: "2.0.0",
        };

        localStorage.setItem('savedTrip', JSON.stringify(dataToSave));
        this.isTemporarySaved = true;
        this.lastSavedAt = new Date().toISOString();

        return {
          success: true,
          message: "여행 데이터가 임시 저장되었습니다.",
          timestamp: this.lastSavedAt,
        };
      } catch (error) {
        return {
          success: false,
          message: "임시 저장 중 오류가 발생했습니다.",
          error: error.message,
        };
      }
    },

    /**
     * TripPlannerView 초기화 - localStorage vs sessionStorage 처리
     */
    async initializeTripPlannerView() {
      try {
        // 1. localStorage에 저장된 여행이 있는지 확인
        const hasLocalTrip = this.hasLocalStorageTrip();
        
        // 2. sessionStorage에 새 여행 정보가 있는지 확인
        const sessionTripInfo = this.loadNewTripFromSession();

        if (hasLocalTrip && sessionTripInfo) {
          // 둘 다 있는 경우 사용자에게 선택 받기
          const useExisting = await this.askUserChoice();
          
          if (useExisting) {
            // 기존 여행 불러오기
            const localTripData = this.loadTripFromLocalStorage();
            if (localTripData) {
              this.loadTripData(localTripData);
              this.isTemporarySaved = true;
              // sessionStorage 정리
              sessionStorage.removeItem('newTripInfo');
              return 'existing';
            }
          } else {
            // 새 여행으로 시작
            this.resetTrip();
            this.setTripInfo(sessionTripInfo);
            this.isTemporarySaved = false;
            return 'new';
          }
        } else if (hasLocalTrip) {
          // localStorage만 있는 경우
          const localTripData = this.loadTripFromLocalStorage();
          if (localTripData) {
            this.loadTripData(localTripData);
            this.isTemporarySaved = true;
            return 'existing';
          }
        } else if (sessionTripInfo) {
          // sessionStorage만 있는 경우
          this.setTripInfo(sessionTripInfo);
          this.isTemporarySaved = false;
          return 'new';
        }

        // 아무것도 없는 경우
        return 'empty';
      } catch (error) {
        return 'error';
      }
    },

    /**
     * 사용자 선택 다이얼로그
     */
    askUserChoice() {
      return new Promise((resolve) => {
        const result = confirm(
          '기존에 저장된 여행 계획이 있습니다.\n어떻게 하시겠습니까?\n\n' +
          '확인: 기존 여행 계속 진행\n' +
          '취소: 새로 입력한 여행으로 시작'
        );
        resolve(result);
      });
    },

    /**
     * 여행 데이터 전체 로드
     */
    loadTripData(tripData) {
      if (!tripData) return;

      this.tripInfo = tripData.tripInfo || this.tripInfo;
      this.itinerary = tripData.itinerary || [];
      this.hotels = tripData.hotels || [];
      this.currentDay = tripData.currentDay || 0;
      this.routeApiCallCount = tripData.routeApiCallCount || 0;
      this.hasRouteOptimization = tripData.hasRouteOptimization || false;
      this.lastRouteApiCall = tripData.lastRouteApiCall || null;
      this.lastSavedAt = tripData.lastSavedAt || null;

      this.adjustItinerary();
      this.adjustHotels();
      this.isDataLoaded = true;
    },

    /**
     * 데이터 정합성 검사 및 조정
     */
    validateAndAdjustData() {
      this.adjustItinerary();
      this.adjustHotels();

      if (this.currentDay >= this.tripDuration || this.currentDay < 0) {
        this.currentDay = 0;
      }
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

      if (duration <= 0) {
        this.itinerary = [];
        this.currentDay = 0;
        return;
      }

      const newItinerary = Array(duration)
        .fill()
        .map((_, index) => {
          return this.itinerary[index] || [];
        });

      this.itinerary = newItinerary;

      if (this.currentDay >= duration) {
        this.currentDay = 0;
      }
    },

    /**
     * 여행 기간에 맞게 hotels 배열 조정
     */
    adjustHotels() {
      const duration = this.tripDuration;

      if (duration <= 0) {
        this.hotels = [];
        return;
      }

      const newHotels = Array(duration)
        .fill()
        .map((_, index) => {
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
     * 선택한 장소 저장 (임시)
     */
    selectPlace(place) {
      this.selectedPlace = place;
    },

    /**
     * 장소를 현재 일차에 추가
     */
    addPlace(place) {
      const placeToAdd = place || this.selectedPlace;

      if (!placeToAdd) return false;

      if (!this.itinerary[this.currentDay]) {
        this.itinerary[this.currentDay] = [];
      }

      const placeWithDetails = {
        ...placeToAdd,
        memo: "",
        visitTime: null,
        addedAt: new Date().toISOString(),
      };

      this.itinerary[this.currentDay].push(placeWithDetails);
      this.selectedPlace = null;

      return true;
    },

    /**
     * 숙소를 특정 일차에 추가
     */
    addHotel(place, day = null) {
      const hotelToAdd = place || this.selectedPlace;
      const targetDay = day !== null ? day : this.currentDay;

      if (!hotelToAdd) return false;

      if (targetDay < 0 || targetDay >= this.tripDuration) return false;

      const hotelWithDetails = {
        ...hotelToAdd,
        memo: "",
        addedAt: new Date().toISOString(),
      };

      this.hotels[targetDay] = hotelWithDetails;
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

      if (!this.itinerary[toDay]) {
        this.itinerary[toDay] = [];
      }

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
     * 검색 모드 설정 (장소 또는 숙소)
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
     */
    reorderPlacesByOptimizedRoutes(routeResponse) {
      try {
        if (!routeResponse) {
          return { success: false, message: "API 응답이 없습니다." };
        }

        let actualData = null;

        if (routeResponse.data && routeResponse.data.paths) {
          actualData = routeResponse.data;
        } else if (
          routeResponse.data &&
          routeResponse.data.data &&
          routeResponse.data.data.paths
        ) {
          actualData = routeResponse.data.data;
        } else if (routeResponse.paths) {
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

        actualData.paths.forEach((dayPath) => {
          const dayIndex = dayPath.day - 1;

          if (dayIndex < 0 || dayIndex >= this.itinerary.length) {
            results.push({
              day: dayPath.day,
              success: false,
              message: `${dayPath.day}일차는 존재하지 않습니다.`,
            });
            return;
          }

          const currentDayPlaces = this.itinerary[dayIndex] || [];

          if (currentDayPlaces.length === 0) {
            results.push({
              day: dayPath.day,
              success: true,
              message: `${dayPath.day}일차에 장소가 없습니다.`,
            });
            return;
          }

          if (!dayPath.path || !Array.isArray(dayPath.path)) {
            results.push({
              day: dayPath.day,
              success: false,
              message: `${dayPath.day}일차의 경로 데이터가 올바르지 않습니다.`,
            });
            return;
          }

          const optimizedOrder = [];

          if (dayPath.path.length > 0) {
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

            dayPath.path.forEach((pathSegment, segmentIndex) => {
              if (segmentIndex > 0 && pathSegment.origin) {
                const placeId = pathSegment.origin.id;
                const placeName = pathSegment.origin.placeName;

                const foundPlace = currentDayPlaces.find(
                  (place) => place.id === placeId
                );

                if (foundPlace) {
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

          const reorderedPlaces = [];
          const usedPlaces = new Set();

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

          currentDayPlaces.forEach((place) => {
            if (!usedPlaces.has(place.id)) {
              reorderedPlaces.push(place);
            }
          });

          const hasChanged = !currentDayPlaces.every(
            (place, index) =>
              reorderedPlaces[index] && place.id === reorderedPlaces[index].id
          );

          if (hasChanged) {
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
     */
    reorderPlacesInDay(day, newOrder) {
      if (day < 0 || day >= this.itinerary.length || !this.itinerary[day]) {
        return false;
      }

      const currentPlaces = this.itinerary[day];
      const reorderedPlaces = [];

      newOrder.forEach((placeId) => {
        const place = currentPlaces.find((p) => p.id === placeId);
        if (place) {
          reorderedPlaces.push(place);
        }
      });

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
      this.resetRouteState();
      this.lastSavedAt = null;
      this.isTemporarySaved = false;
    },

    /**
     * 여행 계획 저장용 데이터 생성
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

      if (
        fromIndex < 0 ||
        fromIndex >= this.itinerary[day].length ||
        toIndex < 0 ||
        toIndex >= this.itinerary[day].length
      ) {
        return;
      }

      const place = this.itinerary[day][fromIndex];
      this.itinerary[day].splice(fromIndex, 1);
      this.itinerary[day].splice(toIndex, 0, place);
    },

    /**
     * sessionStorage 정리
     */
    clearSessionStorage() {
      try {
        sessionStorage.removeItem('newTripInfo');
        return true;
      } catch (error) {
        return false;
      }
    },

    /**
     * localStorage 정리
     */
    clearLocalStorage() {
      try {
        localStorage.removeItem('savedTrip');
        return true;
      } catch (error) {
        return false;
      }
    },

    /**
     * 모든 저장된 데이터 삭제
     */
    clearAllSavedData() {
      this.clearSessionStorage();
      this.clearLocalStorage();
      this.resetTrip();
    },
  },
});
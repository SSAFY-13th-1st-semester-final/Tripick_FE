import { defineStore } from "pinia";

/**
 * 여행 계획 관리를 위한 Pinia 스토어
 * sessionStorage(newTripInfo)와 localStorage(savedTrip)를 활용하여 여행 데이터 관리
 */
export const useTravelStore = defineStore("travel", {
  state: () => ({
    // 여행 계획 기본 정보
    tripInfo: {
      title: "",
      region: null,
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
    isTemporarySaved: false, // localStorage에 임시저장된 상태인지

    // API에서 로드된 여행 ID (필요시)
    apiTripId: null,
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
    // ===== sessionStorage 관련 메서드들 (새 여행 정보) =====

    saveNewTripToSession(newTripSetupData) {
      try {
        // 파라미터로 받은 데이터가 있으면 스토어 상태 업데이트
        if (newTripSetupData) {
          
          // 전달된 데이터를 tripInfo로 직접 업데이트
          const updatedTripInfo = { ...this.tripInfo, ...newTripSetupData };
          
          // region을 문자열로 변환
          if (updatedTripInfo.region && typeof updatedTripInfo.region === 'object') {
            const selectedRegion = updatedTripInfo.region;
            updatedTripInfo.region = selectedRegion.districtName
              ? selectedRegion.provinceName + " " + selectedRegion.districtName
              : selectedRegion.provinceName;
          }
          
          this.tripInfo = updatedTripInfo;
          
          // 데이터 로드 상태 설정
          this.isDataLoaded = true;
        }
        
        // 업데이트된 스토어 상태를 세션스토리지에 저장
        const dataToSave = {
          tripInfo: this.tripInfo,
          itinerary: this.itinerary,
          hotels: this.hotels,
          currentDay: this.currentDay,
          routeApiCallCount: this.routeApiCallCount,
          hasRouteOptimization: this.hasRouteOptimization,
          lastRouteApiCall: this.lastRouteApiCall,
          timestamp: new Date().toISOString(),
          version: "2.0.0",
        };
        
        sessionStorage.setItem('newTripInfo', JSON.stringify(dataToSave));
        
        return { 
          success: true, 
          message: "스토어 상태가 업데이트되고 세션에 저장되었습니다.",
          dataUpdated: !!newTripSetupData
        };
      } catch (error) {
        return { 
          success: false, 
          error: error.message,
          message: "스토어 업데이트 또는 세션 저장 중 오류가 발생했습니다."
        };
      }
    },

    /**
     * sessionStorage에서 새 여행 정보 불러오기
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

        // 전체 데이터 반환
        return parsed;
      } catch (error) {
        return null;
      }
    },

    /**
     * sessionStorage에 새 여행 정보가 있는지 확인
     */
    hasNewTripInSession() {
      try {
        const data = sessionStorage.getItem('newTripInfo');
        return !!data;
      } catch (error) {
        return false;
      }
    },

    /**
     * sessionStorage에서 새 여행 정보 삭제
     */
    clearNewTripFromSession() {
      try {
        sessionStorage.removeItem('newTripInfo');
        return true;
      } catch (error) {
        return false;
      }
    },

    // ===== localStorage 관련 메서드들 (임시저장된 여행 계획) =====

    /**
     * 현재 여행 계획을 localStorage에 임시저장
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
     * localStorage에서 임시저장된 여행 계획 불러오기
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
     * localStorage에 임시저장된 여행 계획이 있는지 확인
     */
    hasSavedTripInLocalStorage() {
      try {
        const data = localStorage.getItem('savedTrip');
        return !!data;
      } catch (error) {
        return false;
      }
    },

    /**
     * localStorage에서 임시저장된 여행 계획 삭제
     */
    clearSavedTripFromLocalStorage() {
      try {
        localStorage.removeItem('savedTrip');
        return true;
      } catch (error) {
        return false;
      }
    },

    /**
     * sessionStorage의 newTripInfo를 localStorage의 savedTrip으로 이동
     * (임시저장 시 사용)
     */
    moveNewTripToLocalStorage() {
      try {
        // 현재 store 상태를 localStorage에 저장
        const saveResult = this.saveTripToLocalStorage();
        
        if (saveResult.success) {
          // sessionStorage의 newTripInfo 삭제
          this.clearNewTripFromSession();
          return { success: true, message: "새 여행 정보가 임시저장으로 이동되었습니다." };
        }
        
        return saveResult;
      } catch (error) {
        return {
          success: false,
          message: "데이터 이동 중 오류가 발생했습니다.",
          error: error.message
        };
      }
    },

    // ===== TripPlannerView 전용 세션 관리 메서드들 =====

    /**
     * TripPlannerView 진입 시 호출 - 세션 데이터 초기화
     */
    initializeTripPlannerSession() {
      
      // 기존 초기화 로직 실행
      return this.initializeTripPlannerView();
    },

    /**
     * TripPlannerView 종료 시 호출 - 세션 정리 및 선택적 저장
     * @param {boolean} autoSave - 자동 저장 여부
     * @returns {Object} 정리 결과
     */
    cleanupTripPlannerSession(autoSave = false) {
      try {
        const result = {
          success: true,
          hasData: this.hasTripData,
          saved: false,
          message: ''
        };
        
        // 현재 여행 데이터가 있는 경우
        if (this.hasTripData) {
          if (autoSave) {
            // 자동 저장
            const saveResult = this.saveTripToLocalStorage();
            result.saved = saveResult.success;
            result.message = saveResult.message || '자동 저장 완료';
            
            if (!saveResult.success) {
              result.success = false;
              result.message = '자동 저장 실패: ' + saveResult.error;
            }
          } else {
            result.message = '저장하지 않고 세션 정리됨';
          }
        } else {
          result.message = '저장할 데이터 없음';
        }
        
        // 세션 스토리지의 newTripInfo 삭제
        const clearResult = this.clearNewTripFromSession();
        if (!clearResult) {
          result.success = false;
          result.message += ' (세션 정리 실패)';
        }
        
        return result;
        
      } catch (error) {
        return {
          success: false,
          hasData: false,
          saved: false,
          message: '세션 정리 중 오류 발생: ' + error.message,
          error: error.message
        };
      }
    },

    /**
     * 사용자에게 저장 여부 확인 후 세션 정리
     * @returns {Promise<Object>} 사용자 선택 및 정리 결과
     */
    async askAndCleanupSession() {
      try {
        // 현재 여행 데이터가 없으면 바로 정리
        if (!this.hasTripData) {
          return this.cleanupTripPlannerSession(false);
        }
        
        // 사용자에게 저장 여부 확인
        const userChoice = await this.askSaveBeforeLeave();
        
        if (userChoice === 'save') {
          // 저장하고 정리
          return this.cleanupTripPlannerSession(true);
        } else if (userChoice === 'discard') {
          // 저장하지 않고 정리
          return this.cleanupTripPlannerSession(false);
        } else {
          // 취소 (정리하지 않음)
          return {
            success: false,
            cancelled: true,
            message: '사용자가 취소함'
          };
        }
        
      } catch (error) {
        return {
          success: false,
          message: '확인 과정 중 오류 발생: ' + error.message,
          error: error.message
        };
      }
    },

    /**
     * 페이지 종료 전 사용자 확인 다이얼로그
     * @returns {Promise<string>} 'save' | 'discard' | 'cancel'
     */
    askSaveBeforeLeave() {
      return new Promise((resolve) => {
        // 3가지 선택지를 제공하는 확인 창
        const message = 
          '현재 작업 중인 여행 계획이 있습니다.\n\n' +
          '어떻게 하시겠습니까?\n\n' +
          '확인: 임시 저장하고 나가기\n' +
          '취소: 저장하지 않고 나가기';
        
        const result = confirm(message);
        
        if (result) {
          resolve('save');
        } else {
          // 두 번째 확인 - 정말 저장하지 않을 것인지
          const discardConfirm = confirm(
            '정말 저장하지 않고 나가시겠습니까?\n\n' +
            '현재 작업한 내용이 모두 삭제됩니다.'
          );
          
          if (discardConfirm) {
            resolve('discard');
          } else {
            resolve('cancel');
          }
        }
      });
    },

    /**
     * 브라우저 종료/새로고침 시 자동 처리
     */
    handleBrowserExit() {
      // 데이터가 있으면 자동으로 localStorage에 저장
      if (this.hasTripData) {
        const saveResult = this.saveTripToLocalStorage();
      }
      
      // 세션 스토리지 정리
      this.clearNewTripFromSession();
    },

    // ===== 초기화 및 통합 관리 =====

    /**
     * TripPlannerView 초기화 로직
     * 우선순위: sessionStorage(새 여행) > localStorage(임시저장) > 빈 상태
     */
    async initializeTripPlannerView() {
      try {
        // 1. sessionStorage에 새 여행 정보 확인
        const hasNewTrip = this.hasNewTripInSession();
        const newTripData = hasNewTrip ? this.loadNewTripFromSession() : null;
        
        // 2. localStorage에 임시저장된 여행 확인
        const hasSavedTrip = this.hasSavedTripInLocalStorage();
        const savedTripData = hasSavedTrip ? this.loadTripFromLocalStorage() : null;

        if (hasNewTrip && hasSavedTrip) {
          // 둘 다 있는 경우: 사용자 선택
          const useExisting = await this.askUserChoice();
          
          if (useExisting) {
            // 기존 임시저장된 여행 계속 진행
            this.loadTripData(savedTripData);
            this.isTemporarySaved = true;
            return 'existing';
          } else {

            // 새 여행으로 시작 (기존 임시저장 삭제)
            this.clearSavedTripFromLocalStorage();
            this.resetTrip();
            this.loadTripData(newTripData);
            this.isTemporarySaved = false;
            
            return 'new';
          }
        } else if (hasNewTrip) {
          // 새 여행 정보만 있는 경우
          this.resetTrip();
          this.loadTripData(newTripData);
          this.isTemporarySaved = false;
          return 'new';
        } else if (hasSavedTrip) {
          // 임시저장된 여행만 있는 경우
          this.loadTripData(savedTripData);
          this.isTemporarySaved = true;
          return 'existing';
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
          '이전에 임시 저장된 여행 계획이 있습니다.\n어떻게 하시겠습니까?\n\n' +
          '확인: 기존 임시저장된 여행 계속 진행\n' +
          '취소: 새로운 여행으로 시작 (기존 데이터 삭제)'
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

      // 기존 데이터를 그대로 유지 (길이 조정 없음)
      this.isDataLoaded = true;
    },

    /**
     * 모든 저장된 데이터 삭제
     */
    clearAllSavedData() {
      this.clearNewTripFromSession();
      this.clearSavedTripFromLocalStorage();
      this.resetTrip();
    },

    // ===== 기존 메서드들 =====

    /**
     * 데이터 정합성 검사 및 조정
     */
    validateAndAdjustData() {
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
     * 여행 기간에 맞게 itinerary 배열 조정 (기존 데이터 유지)
     */
    adjustItinerary() {
      // 단순히 기존 데이터 유지 (길이 조정 없음)
      if (this.currentDay >= this.itinerary.length && this.itinerary.length > 0) {
        this.currentDay = 0;
      }
    },

    /**
     * 여행 기간에 맞게 hotels 배열 조정 (기존 데이터 유지)
     */
    adjustHotels() {
      // 단순히 기존 데이터 유지 (길이 조정 없음)
      // 아무것도 하지 않음
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
      this.apiTripId = null;
      this.isDataLoaded = false;
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
     * API 응답 데이터를 store 데이터 구조로 변환
     * @param {Object} apiResponse - API 응답 전체 객체
     * @returns {Object} 변환된 데이터 또는 에러 정보
     */
    convertApiResponseToStoreData(apiResponse) {
      try {
        if (!apiResponse || !apiResponse.data) {
          return {
            success: false,
            message: "API 응답 데이터가 올바르지 않습니다.",
          };
        }

        const apiData = apiResponse.data.data;

        // 날짜 문자열을 Date 객체로 변환하는 헬퍼 함수
        const parseDate = (dateStr) => {
          if (!dateStr) return null;
          try {
            return new Date(dateStr);
          } catch (error) {
            return null;
          }
        };

        // 1. tripInfo 변환
        const convertedTripInfo = {
          title: apiData.title || "",
          region: apiData.region,
          startDate: parseDate(apiData.startDate),
          endDate: parseDate(apiData.endDate),
          memo: apiData.description || "",
        };

        // 2. dailyTripPlaces를 itinerary로 변환
        const startDate = parseDate(apiData.startDate);
        const endDate = parseDate(apiData.endDate);

        if (!startDate || !endDate) {
          return {
            success: false,
            message: "여행 날짜 정보가 올바르지 않습니다.",
          };
        }

        // 여행 기간 계산
        const diffTime = Math.abs(endDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        const convertedItinerary = [];
        const convertedHotels = [];

        // 각 일차별로 데이터 변환
        for (let dayIndex = 0; dayIndex < diffDays; dayIndex++) {
          const currentDate = new Date(startDate);
          currentDate.setDate(startDate.getDate() + dayIndex);
          const dateKey = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD 형식
          const dayPlaces = apiData.dailyTripPlaces[dateKey] || [];
          
          // sequence로 정렬
          const sortedPlaces = dayPlaces.sort((a, b) => (a.sequence || 0) - (b.sequence || 0));

          // 장소 데이터 변환 함수
          const convertPlace = (place) => ({
            id: place.placeId,
            placeName: place.placeName || "",
            x: place.x || 0,
            y: place.y || 0,
            address: place.address || "", // API에 있다면 추가
            category: place.category || "", // API에 있다면 추가
            memo: "", // 기본값
            visitTime: null, // 기본값
            addedAt: new Date().toISOString(),
            // API의 추가 필드들 보존
            sequence: place.sequence,
            date: place.date,
          });

          // 첫 번째 장소는 호텔로, 나머지는 일반 장소로 분류
          if (sortedPlaces.length > 0) {
            // 첫 번째 장소를 호텔로 설정
            const hotelPlace = convertPlace(sortedPlaces[0]);
            convertedHotels.push(hotelPlace);

            // 나머지 장소들을 일반 장소로 설정
            const remainingPlaces = sortedPlaces.slice(1).map(convertPlace);
            convertedItinerary.push(remainingPlaces);
          } else {
            // 해당 일차에 장소가 없는 경우
            convertedHotels.push(null);
            convertedItinerary.push([]);
          }
        }

        // 3. 변환된 데이터 반환
        return {
          success: true,
          message: "API 데이터 변환이 완료되었습니다.",
          data: {
            tripInfo: convertedTripInfo,
            itinerary: convertedItinerary,
            hotels: convertedHotels,
            currentDay: 0,
            // API에서 가져온 추가 정보
            tripId: apiData.tripId,
            originalApiData: apiData, // 원본 데이터 보존 (필요시 참조용)
          },
        };
      } catch (error) {
        return {
          success: false,
          message: "API 데이터 변환 중 오류가 발생했습니다.",
          error: error.message,
        };
      }
    },

    /**
     * 변환된 API 데이터를 store에 로드하고 sessionStorage에 저장
     * @param {Object} apiResponse - API 응답 전체 객체
     * @returns {Object} 로드 결과
     */
    loadTripFromApiResponse(apiResponse) {
      try {
        const conversionResult = this.convertApiResponseToStoreData(apiResponse);
        
        if (!conversionResult.success) {
          return conversionResult;
        }

        // const { tripInfo, itinerary, hotels, currentDay, tripId } = conversionResult.data;

        // // store 상태 업데이트
        // this.tripInfo = tripInfo;
        // this.itinerary = itinerary;
        // this.hotels = hotels;
        // this.currentDay = currentDay;

        // // 추가 정보 저장 (필요시)
        // this.apiTripId = tripId;

        // // 데이터 정합성 검증
        // this.validateAndAdjustData();
        // this.isDataLoaded = true;

        // API에서 변환된 데이터를 sessionStorage에 직접 저장
        const { tripInfo, itinerary, hotels, currentDay, tripId } = conversionResult.data;
        
        const dataToSave = {
          tripInfo: tripInfo,
          itinerary: itinerary,
          hotels: hotels,
          currentDay: currentDay,
          routeApiCallCount: 0,
          hasRouteOptimization: false,
          lastRouteApiCall: null,
          timestamp: new Date().toISOString(),
          version: "2.0.0",
        };
        
        let saveResult;
        try {
          sessionStorage.setItem('newTripInfo', JSON.stringify(dataToSave));
          saveResult = { success: true };
        } catch (error) {
          saveResult = { success: false, error: error.message };
        }
        
        if (!saveResult.success) {
          return {
            success: true,
            message: "여행 데이터가 변환되었으나 임시 저장에 실패했습니다.",
            tripId: tripId,
            saveWarning: saveResult.error,
          };
        }

        return {
          success: true,
          message: "여행 데이터가 성공적으로 변환되고 저장되었습니다.",
          tripId: tripId,
        };
      } catch (error) {
        return {
          success: false,
          message: "여행 데이터 로드 중 오류가 발생했습니다.",
          error: error.message,
        };
      }
    },


  },
});
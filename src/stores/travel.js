import { defineStore } from 'pinia';

/**
 * 여행 계획 관리를 위한 Pinia 스토어
 */
export const useTravelStore = defineStore('travel', {
  state: () => ({
    // 여행 계획 기본 정보
    tripInfo: {
      title: '',
      region: null, // { provinceId, provinceName, districtId, districtName }
      startDate: null,
      endDate: null,
      memo: ''
    },
    
    // 일차 별 장소 정보 (2차원 배열)
    // itinerary[0]은 1일차 장소 배열, itinerary[1]은 2일차 장소 배열...
    itinerary: [],

    // 일차 별 숙소 정보 (1차원 배열)
    // hotels[0]은 1일차 숙소, hotels[1]은 2일차 숙소...
    // 각 요소는 장소 객체 또는 null
    hotels: [],
    
    // 현재 선택 중인 일차
    currentDay: 0,
    
    // 임시 저장된 선택 장소 (아직 추가되지 않은)
    selectedPlace: null,
    
    // 장소 검색 모드 ('place' | 'hotel')
    searchMode: 'place',
  }),
  
  getters: {
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
      return state.itinerary.map(day => day ? day.length : 0);
    },
    
    /**
     * 일차 별 숙소 유무
     */
    hotelsCountByDay: (state) => {
      return state.hotels.map(hotel => hotel ? 1 : 0);
    },
    
    /**
     * 전체 장소 개수
     */
    totalPlacesCount: (state) => {
      return state.itinerary.reduce((sum, day) => sum + (day ? day.length : 0), 0);
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
      if (!date) return '';
      
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
      
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
          placeIds: dayPlaces ? dayPlaces.map(place => place.id) : []
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
        placeIds: dayPlaces ? dayPlaces.map(place => place.id) : []
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
        placeIds: dayPlaces ? dayPlaces.map(place => place.id) : []
      };
    }
  },
  
  actions: {
    saveAllTripData() {
      const tripData = {
        tripInfo: this.tripInfo,
        itinerary: this.itinerary,
        hotels: this.hotels,
        currentDay: this.currentDay,
        selectedPlace: this.selectedPlace,
      };
      console.log(tripData);
      localStorage.setItem("savedTrip", JSON.stringify(tripData));
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
        ...(memo !== undefined && { memo })
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
      const newItinerary = Array(duration).fill().map((_, index) => {
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
      const newHotels = Array(duration).fill().map((_, index) => {
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
     * 선택한 장소 저장 (임시)
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
        memo: '',
        visitTime: null,
        addedAt: new Date().toISOString()
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
        memo: '',
        addedAt: new Date().toISOString()
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
          ...hotelData
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
      if (mode === 'place' || mode === 'hotel') {
        this.searchMode = mode;
      }
    },
    
    /**
     * 장소 검색 모드로 설정
     */
    setPlaceSearchMode() {
      this.searchMode = 'place';
    },
    
    /**
     * 숙소 검색 모드로 설정
     */
    setHotelSearchMode() {
      this.searchMode = 'hotel';
      console.log(">>>>>", this.searchMode);
    },
    
    /**
     * 여행 계획 초기화
     */
    resetTrip() {
      this.tripInfo = {
        title: '',
        region: null,
        startDate: null,
        endDate: null,
        memo: ''
      };
      this.itinerary = [];
      this.hotels = [];
      this.currentDay = 0;
      this.selectedPlace = null;
      this.searchMode = 'place';
    },
    
    /**
     * 여행 계획 데이터 불러오기
     */
    loadTrip(tripData) {
      if (!tripData) return;
      
      // 여행 기본 정보 불러오기
      this.tripInfo = tripData.tripInfo || this.tripInfo;
      
      // 일정 정보 불러오기
      this.itinerary = tripData.itinerary || [];
      
      // 숙소 정보 불러오기
      this.hotels = tripData.hotels || [];
      
      // 기간에 맞게 일정 배열 조정
      this.adjustItinerary();
      this.adjustHotels();
      
      // 현재 일차 초기화
      this.currentDay = 0;
    },
    
    /**
     * 여행 계획 저장용 데이터 생성
     */
    getSaveData() {
      return {
        tripInfo: this.tripInfo,
        itinerary: this.itinerary,
        hotels: this.hotels
      };
    }
  }
});
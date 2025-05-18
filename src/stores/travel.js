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
    
    // 현재 선택 중인 일차
    currentDay: 0,
    
    // 임시 저장된 선택 장소 (아직 추가되지 않은)
    selectedPlace: null,
    
    // 장소 수정 모드 플래그
    isEditMode: false,
    
    // 수정 중인 장소 인덱스
    editingPlaceIndex: -1
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
     * 일차 별 장소 개수
     */
    placesCountByDay: (state) => {
      return state.itinerary.map(day => day ? day.length : 0);
    },
    
    /**
     * 전체 장소 개수
     */
    totalPlacesCount: (state) => {
      return state.itinerary.reduce((sum, day) => sum + (day ? day.length : 0), 0);
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
    }
  },
  
  actions: {
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
      
      // 여행 기간이 변경되면 itinerary 배열도 조정
      if (startDate !== undefined || endDate !== undefined) {
        this.adjustItinerary();
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
     * 장소 제거
     */
    removePlace(day, index) {
      if (this.itinerary[day] && this.itinerary[day][index]) {
        this.itinerary[day].splice(index, 1);
      }
    },
    
    /**
     * 현재 일차에서 장소 제거
     */
    removeCurrentDayPlace(index) {
      this.removePlace(this.currentDay, index);
    },
    
    /**
     * 장소 수정 모드 시작
     */
    startEditPlace(day, index) {
      if (this.itinerary[day] && this.itinerary[day][index]) {
        this.isEditMode = true;
        this.editingPlaceIndex = index;
        this.currentDay = day;
        this.selectedPlace = { ...this.itinerary[day][index] };
      }
    },
    
    /**
     * 장소 수정 적용
     */
    updatePlace(placeData) {
      if (this.isEditMode && this.editingPlaceIndex >= 0) {
        // 수정할 장소 데이터가 있으면
        if (placeData) {
          this.itinerary[this.currentDay][this.editingPlaceIndex] = {
            ...this.itinerary[this.currentDay][this.editingPlaceIndex],
            ...placeData
          };
        }
        // 수정 모드 종료
        this.isEditMode = false;
        this.editingPlaceIndex = -1;
        this.selectedPlace = null;
      }
    },
    
    /**
     * 장소 수정 취소
     */
    cancelEditPlace() {
      this.isEditMode = false;
      this.editingPlaceIndex = -1;
      this.selectedPlace = null;
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
      this.currentDay = 0;
      this.selectedPlace = null;
      this.isEditMode = false;
      this.editingPlaceIndex = -1;
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
      
      // 기간에 맞게 일정 배열 조정
      this.adjustItinerary();
      
      // 현재 일차 초기화
      this.currentDay = 0;
    }
  }
});
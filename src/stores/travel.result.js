
import { defineStore } from 'pinia';

/**
 * 여행 경로 최적화 결과 관리를 위한 Pinia 스토어
 */
export const useTravelResultStore = defineStore('travelResult', {
  state: () => ({
    // 최적화 결과 원본 데이터
    rawResult: null,
    
    // 일차별 최적화된 경로 정보
    // optimizedPaths[0]은 1일차, optimizedPaths[1]은 2일차...
    // 각 요소는 { day, hotel, places, totalDistance, totalDuration } 형태
    optimizedPaths: [],
    
    // 로딩 상태
    isLoading: false,
    
    // 에러 상태
    error: null,
    
    // 마지막 업데이트 시간
    lastUpdated: null
  }),
  
  getters: {
    /**
     * 전체 여행 기간
     */
    totalDays: (state) => {
      return state.optimizedPaths.length;
    },
    
    /**
     * 특정 일차의 최적화된 경로 정보
     */
    getDayPath: (state) => (day) => {
      return state.optimizedPaths[day] || null;
    },
    
    /**
     * 전체 여행의 총 거리 (미터)
     */
    totalDistance: (state) => {
      return state.optimizedPaths.reduce((sum, dayPath) => {
        return sum + (dayPath.totalDistance || 0);
      }, 0);
    },
    
    /**
     * 전체 여행의 총 소요 시간 (초)
     */
    totalDuration: (state) => {
      return state.optimizedPaths.reduce((sum, dayPath) => {
        return sum + (dayPath.totalDuration || 0);
      }, 0);
    },
    
    /**
     * 일차별 방문 장소 개수
     */
    placesCountByDay: (state) => {
      return state.optimizedPaths.map(dayPath => {
        let count = 0;
        if (dayPath.hotel) count++;
        if (dayPath.places) count += dayPath.places.length;
        return count;
      });
    },
    
    /**
     * 최적화 결과가 있는지 확인
     */
    hasResult: (state) => {
      return state.optimizedPaths.length > 0;
    },
    
    /**
     * 포맷된 총 거리 (km)
     */
    formattedTotalDistance: (state) => {
      const km = state.optimizedPaths.reduce((sum, dayPath) => {
        return sum + (dayPath.totalDistance || 0);
      }, 0) / 1000;
      return `${km.toFixed(1)}km`;
    },
    
    /**
     * 포맷된 총 소요 시간
     */
    formattedTotalDuration: (state) => {
      const totalSeconds = state.optimizedPaths.reduce((sum, dayPath) => {
        return sum + (dayPath.totalDuration || 0);
      }, 0);
      
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      
      if (hours > 0) {
        return `${hours}시간 ${minutes}분`;
      } else {
        return `${minutes}분`;
      }
    }
  },
  
  actions: {
    /**
     * 최적화 결과 데이터 설정
     */
    setOptimalResult(resultData) {
      try {
        this.isLoading = false;
        this.error = null;
        this.rawResult = resultData;
        this.lastUpdated = new Date().toISOString();
        
        // 결과 데이터 변환
        this.optimizedPaths = this.transformResultData(resultData);
        
      } catch (error) {
        this.error = error.message;
        console.error('최적화 결과 설정 오류:', error);
      }
    },
    
    /**
     * API 응답 데이터를 내부 형식으로 변환
     */
    transformResultData(resultData) {
      if (!resultData?.data?.paths) {
        return [];
      }
      
      return resultData.data.paths.map(dayData => {
        const { day, path } = dayData;
        
        // 호텔과 방문 장소 분리
        const places = [];
        let hotel = null;
        let totalDistance = 0;
        let totalDuration = 0;
        
        // 첫 번째 origin을 호텔(출발지)로 설정
        if (path.length > 0) {
          hotel = {
            id: path[0].origin.id,
            placeName: path[0].origin.placeName,
            y: path[0].origin.y,
            x: path[0].origin.x,
            type: 'hotel'
          };
        }
        
        // 경로에서 방문 장소들과 이동 정보 추출
        path.forEach((segment, index) => {
          // destination이 있는 경우 방문 장소로 추가
          if (segment.destinationId) {
            // 다음 segment에서 origin 정보 찾기
            const nextSegment = path[index + 1];
            if (nextSegment && nextSegment.origin.id === segment.destinationId) {
              places.push({
                id: nextSegment.origin.id,
                placeName: nextSegment.origin.placeName,
                y: nextSegment.origin.y,
                x: nextSegment.origin.x,
                type: 'place',
                fromHotel: {
                  distance: segment.leg.distance,
                  duration: segment.leg.duration
                }
              });
            }
          }
          
          // 총 거리와 시간 누적
          totalDistance += segment.leg.distance;
          totalDuration += segment.leg.duration;
        });
        

        console.log("travle.result.js???");
        return {
          day,
          hotel,
          places,
          totalDistance,
          totalDuration,
          originalPath: path // 원본 경로 정보 보관
        };
      });
    },
    
    /**
     * 로딩 상태 설정
     */
    setLoading(loading) {
      this.isLoading = loading;
    },
    
    /**
     * 에러 설정
     */
    setError(error) {
      this.error = error;
      this.isLoading = false;
    },
    
    /**
     * 특정 일차에 장소 추가
     */
    addPlaceToDay(day, place) {
      if (this.optimizedPaths[day]) {
        this.optimizedPaths[day].places.push({
          ...place,
          type: 'place',
          addedManually: true
        });
      }
    },
    
    /**
     * 특정 일차에서 장소 제거
     */
    removePlaceFromDay(day, placeIndex) {
      if (this.optimizedPaths[day] && this.optimizedPaths[day].places[placeIndex]) {
        this.optimizedPaths[day].places.splice(placeIndex, 1);
      }
    },
    
    /**
     * 특정 일차의 호텔 변경
     */
    updateDayHotel(day, hotel) {
      if (this.optimizedPaths[day]) {
        this.optimizedPaths[day].hotel = {
          ...hotel,
          type: 'hotel'
        };
      }
    },
    
    /**
     * 특정 일차 내에서 장소 순서 변경
     */
    reorderPlacesInDay(day, fromIndex, toIndex) {
      if (this.optimizedPaths[day] && this.optimizedPaths[day].places) {
        const places = this.optimizedPaths[day].places;
        const [movedPlace] = places.splice(fromIndex, 1);
        places.splice(toIndex, 0, movedPlace);
      }
    },
    
    /**
     * 장소를 다른 일차로 이동
     */
    movePlaceToAnotherDay(fromDay, placeIndex, toDay) {
      if (this.optimizedPaths[fromDay] && 
          this.optimizedPaths[toDay] && 
          this.optimizedPaths[fromDay].places[placeIndex]) {
        
        const place = this.optimizedPaths[fromDay].places.splice(placeIndex, 1)[0];
        this.optimizedPaths[toDay].places.push(place);
      }
    },
    
    /**
     * 특정 일차의 경로 정보 조회
     */
    getDayRoute(day) {
      return this.optimizedPaths[day] || null;
    },
    
    /**
     * 결과 초기화
     */
    clearResult() {
      this.rawResult = null;
      this.optimizedPaths = [];
      this.isLoading = false;
      this.error = null;
      this.lastUpdated = null;
    },
    
    /**
     * 결과 데이터를 travel.js 형식으로 변환하여 반환
     */
    exportToTravelFormat() {
      return {
        itinerary: this.optimizedPaths.map(dayPath => dayPath.places || []),
        hotels: this.optimizedPaths.map(dayPath => dayPath.hotel || null)
      };
    },
    
    /**
     * 최적화 결과를 travel.js 스토어에 적용
     */
    applyToTravelStore(travelStore) {
      const exportData = this.exportToTravelFormat();
      
      // travel.js의 데이터 업데이트
      travelStore.itinerary = exportData.itinerary;
      travelStore.hotels = exportData.hotels;
    }
  }
});
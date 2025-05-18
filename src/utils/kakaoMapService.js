// src/utils/kakaoMapService.js

/**
 * 카카오맵 API 관련 유틸리티 함수들
 */
class KakaoMapService {
  constructor() {
    this.map = null;
    this.markers = [];
    this.infowindows = [];
    this.bounds = null;
    this.openedInfowindow = null;
    this.isMouseOnInfowindow = false;
    
    this.dayColors = [
        '#0064FF', // 1일차: 파란색 (Toss Blue)
        '#FF3B30', // 2일차: 빨간색
        '#4CD964', // 3일차: 초록색
        '#FF9500', // 4일차: 주황색
        '#5856D6', // 5일차: 보라색
        '#FF2D55', // 6일차: 분홍색
        '#FFCC00', // 7일차: 노란색
        '#5AC8FA', // 8일차: 하늘색
        '#8E8E93', // 9일차: 다크 그레이
        '#34C759', // 10일차: 밝은 연두색
        '#AF52DE', // 11일차: 라벤더 보라
        '#FFD60A', // 12일차: 레몬 옐로우
        '#FF9F0A', // 13일차: 딥 오렌지
        '#00C7BE', // 14일차: 민트
        '#BF5AF2'  // 15일차: 연보라
    ];

    
    // 마커 이미지 캐시
    this.markerImageCache = {};
  }

  /**
   * 카카오맵 스크립트 로드
   * @returns {Promise} 스크립트 로드 완료 Promise
   */
  loadScript() {
    return new Promise((resolve, reject) => {
      if (window.kakao && window.kakao.maps) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      const apiKey = import.meta.env.VITE_KAKAO_MAP_API_KEY || 'e275d3ecdc79f7233649e9ee24d2e982';
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&autoload=false&libraries=services,clusterer`;
      script.async = true;
      script.onload = () => {
        window.kakao.maps.load(() => {
          resolve();
        });
      };
      script.onerror = (e) => {
        reject(e);
      };
      
      document.head.appendChild(script);
    });
  }

  /**
   * 지도 초기화
   * @param {HTMLElement} container 지도를 표시할 DOM 엘리먼트
   * @param {Object} options 지도 초기화 옵션
   * @returns {Object} 생성된 지도 객체
   */
  initMap(container, options = {}) {
    const defaultOptions = {
      center: new window.kakao.maps.LatLng(37.566826, 126.9786567), // 서울시청 기본값
      level: 5 // 기본 확대 레벨
    };

    const mapOptions = { ...defaultOptions, ...options };
    this.map = new window.kakao.maps.Map(container, mapOptions);
    this.bounds = new window.kakao.maps.LatLngBounds();
    
    return this.map;
  }
  
  /**
   * 좌표 변환 (주소 -> 좌표)
   * @param {string} address 주소
   * @returns {Promise} 좌표 변환 결과 Promise
   */
  convertAddressToCoord(address) {
    return new Promise((resolve, reject) => {
      const geocoder = new window.kakao.maps.services.Geocoder();
      
      geocoder.addressSearch(address, (result, status) => {
        if (status === window.kakao.maps.services.Status.OK) {
          resolve({
            lat: result[0].y,
            lng: result[0].x,
            address: result[0].address_name
          });
        } else {
          reject(new Error('주소 변환에 실패했습니다.'));
        }
      });
    });
  }

  /**
   * 일차별 마커 색상 가져오기
   * @param {number} day 일차
   * @returns {string} 색상 코드
   */
  getDayColor(day) {
    // 일차에 해당하는 색상 반환, 7일 이상인 경우 반복 사용
    return this.dayColors[(day - 1) % this.dayColors.length];
  }
  
  /**
   * 컬러 마커 이미지 생성
   * @param {string} color 색상 코드
   * @returns {Object} 마커 이미지 객체
   */
  createMarkerImage(color) {
    // 캐시에 있는 경우 반환
    if (this.markerImageCache[color]) {
      return this.markerImageCache[color];
    }
    
    // SVG 마커 생성
    const svgMarker = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="36" viewBox="0 0 24 36">
        <path fill="${color}" d="M12 0C5.4 0 0 5.4 0 12c0 2.2.6 4.2 1.6 6l10.4 18 10.4-18c1-1.8 1.6-3.8 1.6-6 0-6.6-5.4-12-12-12zm0 16c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z"/>
      </svg>
    `;
    
    // SVG를 Data URL로 변환
    const svgDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgMarker);
    
    // 마커 이미지 생성
    const markerImage = new window.kakao.maps.MarkerImage(
      svgDataUrl,
      new window.kakao.maps.Size(24, 36),
      { offset: new window.kakao.maps.Point(12, 36) }
    );
    
    // 캐시에 저장
    this.markerImageCache[color] = markerImage;
    
    return markerImage;
  }

  /**
   * 지도에 마커 추가 - 일차별 색상 적용 (호버 시 인포윈도우 표시)
   * @param {Array} places 장소 데이터 배열
   * @param {number|null} day 일차 (설정 시 해당 색상 적용)
   */
  addMarkers(places, day = null) {
    // 기존 마커 제거
    this.clearMarkers();
    
    // 새 마커 및 인포윈도우 추가
    places.forEach((place, index) => {
      if (!place.latitude || !place.longitude) return;
      
      const position = new window.kakao.maps.LatLng(place.latitude, place.longitude);
      
      // 마커 옵션
      const markerOptions = {
        map: this.map,
        position: position,
        title: place.placeName,
        zIndex: index
      };
      
      // 일차 정보가 있으면 해당 색상의 마커 사용
      // 장소에 day 속성이 있거나, 파라미터로 전달된 경우
      const placeDay = place.day || day;
      if (placeDay) {
        markerOptions.image = this.createMarkerImage(this.getDayColor(placeDay));
      }
      
      // 마커 생성
      const marker = new window.kakao.maps.Marker(markerOptions);
      
      // 인포윈도우 내용
      let content = `
        <div class="map-infowindow" data-marker-index="${index}">
      `;
      
      // 일차 정보가 있으면 표시
      if (placeDay) {
        content += `<div class="infowindow-day" style="color: ${this.getDayColor(placeDay)};">${placeDay}일차</div>`;
      }
      
      content += `
          <div class="infowindow-title">${place.placeName}</div>
          <div class="infowindow-address">${place.roadAddressName || place.addressName || ''}</div>
          ${place.phone ? `<div class="infowindow-phone">${place.phone}</div>` : ''}
          <div class="infowindow-link"><a href="${place.placeUrl}" target="_blank">상세보기</a></div>
        </div>
      `;
      
      // 인포윈도우 생성
      const infowindow = new window.kakao.maps.InfoWindow({
        content: content,
        removable: false,  // 닫기 버튼 제거 (호버로 제어)
        zIndex: 100
      });
      
      // 호버 이벤트 (mouseover, mouseout) 추가
      this.addMarkerHoverEvents(marker, infowindow, index);
      
      // 마커와 인포윈도우 저장
      this.markers.push(marker);
      this.infowindows.push(infowindow);
      
      // 지도 범위 확장
      this.bounds.extend(position);
    });
    
    // 모든 마커가 보이도록 지도 범위 조정
    if (this.markers.length > 0) {
      this.map.setBounds(this.bounds);
      
      // 마커가 하나만 있는 경우 확대 수준 조정
      if (this.markers.length === 1) {
        this.map.setLevel(3);
      }
    }
    
    // 인포윈도우 호버 이벤트 처리를 위한 글로벌 이벤트 리스너 등록
    this.setupInfowindowHoverEvents();
  }
  
  /**
   * 마커에 호버 이벤트 추가
   * @param {Object} marker 마커 객체
   * @param {Object} infowindow 인포윈도우 객체
   * @param {number} index 마커 인덱스
   */
  addMarkerHoverEvents(marker, infowindow, index) {
    // 마커에 마우스 올렸을 때 인포윈도우 표시
    window.kakao.maps.event.addListener(marker, 'mouseover', () => {
      this.openInfowindow(infowindow, marker);
    });
    
    // 마커에서 마우스가 나갔을 때 타이머 설정 (인포윈도우 영역 확인 후 닫기)
    window.kakao.maps.event.addListener(marker, 'mouseout', () => {
      // 약간의 딜레이를 두고 인포윈도우 영역 확인 후 닫기
      setTimeout(() => {
        if (!this.isMouseOnInfowindow) {
          infowindow.close();
        }
      }, 100);
    });
    
    // 마커 클릭 이벤트 - 인포윈도우 토글
    window.kakao.maps.event.addListener(marker, 'click', () => {
      // 이미 열려있으면 닫고, 닫혀있으면 열기
      if (this.openedInfowindow === infowindow) {
        infowindow.close();
        this.openedInfowindow = null;
      } else {
        this.closeAllInfowindows();
        this.openInfowindow(infowindow, marker);
      }
    });
  }
  
  /**
   * 인포윈도우 열기
   * @param {Object} infowindow 인포윈도우 객체
   * @param {Object} marker 마커 객체
   */
  openInfowindow(infowindow, marker) {
    // 이미 열린 다른 인포윈도우 닫기
    if (this.openedInfowindow && this.openedInfowindow !== infowindow) {
      this.openedInfowindow.close();
    }
    
    // 인포윈도우 열기
    infowindow.open(this.map, marker);
    this.openedInfowindow = infowindow;
    
    // 인포윈도우가 열린 후 이벤트 리스너 등록을 위한 약간의 딜레이
    setTimeout(() => {
      this.setupInfowindowHoverEvents();
    }, 100);
  }
  
  /**
   * 인포윈도우 호버 이벤트 설정
   */
  setupInfowindowHoverEvents() {
    // 모든 인포윈도우 요소 찾기
    const infowindowElements = document.querySelectorAll('.map-infowindow');
    
    // 각 인포윈도우에 마우스 이벤트 추가
    infowindowElements.forEach(element => {
      // 이미 이벤트가 등록되어 있으면 중복 등록 방지
      if (element.getAttribute('data-hover-events-added')) return;
      
      // 마우스가 인포윈도우 위에 있을 때
      element.addEventListener('mouseenter', () => {
        this.isMouseOnInfowindow = true;
      });
      
      // 마우스가 인포윈도우를 벗어났을 때
      element.addEventListener('mouseleave', () => {
        this.isMouseOnInfowindow = false;
        
        // 인포윈도우 닫기
        setTimeout(() => {
          if (!this.isMouseOnInfowindow) {
            const index = element.getAttribute('data-marker-index');
            if (index !== null && this.infowindows[index]) {
              this.infowindows[index].close();
              if (this.openedInfowindow === this.infowindows[index]) {
                this.openedInfowindow = null;
              }
            }
          }
        }, 100);
      });
      
      // 이벤트 등록 표시
      element.setAttribute('data-hover-events-added', 'true');
    });
  }
  
  /**
   * 지도에 여행 일정의 모든 마커 추가 (일차별 색상)
   * @param {Object} itinerary 여행 일정 객체
   */
  addAllDaysMarkers(itinerary) {
    // 기존 마커 제거
    this.clearMarkers();
    
    // 각 일차별로 장소 수집
    const allPlaces = [];
    
    // itinerary가 배열인 경우 (travel.js의 구조)
    if (Array.isArray(itinerary)) {
      itinerary.forEach((dayPlaces, index) => {
        if (dayPlaces && dayPlaces.length > 0) {
          // 각 장소에 일차 정보 추가 (index + 1 = 일차)
          const placesWithDay = dayPlaces.map(place => ({
            ...place,
            day: index + 1
          }));
          
          allPlaces.push(...placesWithDay);
        }
      });
    } 
    // itinerary가 객체인 경우 (예: {day1: [...], day2: [...]} 구조)
    else {
      Object.keys(itinerary).forEach(dayKey => {
        const day = parseInt(dayKey.replace('day', ''));
        const placesForDay = itinerary[dayKey];
        
        // 각 장소에 일차 정보 추가
        const placesWithDay = placesForDay.map(place => ({
          ...place,
          day: day
        }));
        
        allPlaces.push(...placesWithDay);
      });
    }
    
    // 통합된 마커 표시
    this.addMarkers(allPlaces);
  }
  
  /**
   * 특정 위치로 지도 중심 이동
   * @param {number} lat 위도
   * @param {number} lng 경도
   * @param {number} level 확대 레벨 (선택사항)
   */
  moveToLocation(lat, lng, level = null) {
    const position = new window.kakao.maps.LatLng(lat, lng);
    this.map.setCenter(position);
    
    if (level !== null) {
      this.map.setLevel(level);
    }
  }
  
  /**
   * 특정 인덱스의 마커로 포커스 이동
   * @param {number} index 마커 인덱스
   */
  focusMarker(index) {
    if (index >= 0 && index < this.markers.length) {
      const marker = this.markers[index];
      this.map.setCenter(marker.getPosition());
      this.map.setLevel(3);
      
      // 기존 인포윈도우 닫고 선택된 마커 인포윈도우 열기
      this.closeAllInfowindows();
      this.infowindows[index].open(this.map, marker);
      this.openedInfowindow = this.infowindows[index];
    }
  }
  
  /**
   * 모든 인포윈도우 닫기
   */
  closeAllInfowindows() {
    this.infowindows.forEach(infowindow => {
      infowindow.close();
    });
    this.openedInfowindow = null;
  }

  /**
   * 모든 마커 제거
   */
  clearMarkers() {
    this.closeAllInfowindows();
    
    this.markers.forEach(marker => {
      marker.setMap(null);
    });
    
    this.markers = [];
    this.infowindows = [];
    this.bounds = new window.kakao.maps.LatLngBounds();
    this.openedInfowindow = null;
  }
  
  /**
   * 지도 이벤트 리스너 추가
   * @param {string} eventName 이벤트 이름
   * @param {Function} callback 콜백 함수
   */
  addMapEventListener(eventName, callback) {
    if (this.map) {
      window.kakao.maps.event.addListener(this.map, eventName, callback);
    }
  }
  
  /**
   * 지도에 컨트롤 추가
   * @param {boolean} useZoomControl 줌 컨트롤 사용 여부
   * @param {boolean} useTypeControl 지도 타입 컨트롤 사용 여부
   */
  addMapControls(useZoomControl = true, useTypeControl = true) {
    if (!this.map) return;
    
    // 줌 컨트롤 추가
    if (useZoomControl) {
      const zoomControl = new window.kakao.maps.ZoomControl();
      this.map.addControl(zoomControl, window.kakao.maps.ControlPosition.RIGHT);
    }
    
    // 지도 타입 컨트롤 추가
    if (useTypeControl) {
      const typeControl = new window.kakao.maps.MapTypeControl();
      this.map.addControl(typeControl, window.kakao.maps.ControlPosition.TOPRIGHT);
    }
  }
  
  /**
   * 지도 크기 변경 시 리사이즈 처리
   */
  resizeMap() {
    if (this.map) {
      this.map.relayout();
    }
  }
  
  /**
   * 경로 표시하기
   * @param {Array} places 장소 데이터 배열 (순서대로 표시됨)
   * @param {Object} options 경로 표시 옵션
   */
  drawRoute(places, options = {}) {
    if (!this.map || places.length < 2) return;
    
    const defaultOptions = {
      strokeWeight: 4,
      strokeColor: '#0064FF', // 기본 파란색
      strokeOpacity: 0.7,
      strokeStyle: 'solid'
    };
    
    const polylineOptions = { ...defaultOptions, ...options };
    const path = [];
    
    // 유효한 좌표를 가진 장소들만 경로에 추가
    places.forEach(place => {
      if (place.latitude && place.longitude) {
        path.push(new window.kakao.maps.LatLng(place.latitude, place.longitude));
      }
    });
    
    // 경로가 2개 이상의 포인트를 가질 때만 그리기
    if (path.length >= 2) {
      const polyline = new window.kakao.maps.Polyline({
        map: this.map,
        path: path,
        strokeWeight: polylineOptions.strokeWeight,
        strokeColor: polylineOptions.strokeColor,
        strokeOpacity: polylineOptions.strokeOpacity,
        strokeStyle: polylineOptions.strokeStyle
      });
      
      // 경로까지 모두 포함하는 범위로 지도 조정
      const bounds = new window.kakao.maps.LatLngBounds();
      path.forEach(point => {
        bounds.extend(point);
      });
      
      this.map.setBounds(bounds);
    }
  }
  
  /**
   * 커스텀 오버레이 생성 및 추가
   * @param {Object} place 장소 데이터
   * @param {String} content 오버레이 HTML 콘텐츠
   * @returns {Object} 생성된 커스텀 오버레이 객체
   */
  addCustomOverlay(place, content) {
    if (!this.map || !place.latitude || !place.longitude) return null;
    
    const position = new window.kakao.maps.LatLng(place.latitude, place.longitude);
    
    const customOverlay = new window.kakao.maps.CustomOverlay({
      map: this.map,
      position: position,
      content: content,
      yAnchor: 1
    });
    
    return customOverlay;
  }
  
  /**
   * 지도 스타일 변경
   * @param {Array} mapTypes 적용할 지도 타입 배열 (예: ['terrain', 'traffic'])
   */
  setMapTypes(mapTypes = []) {
    if (!this.map) return;
    
    const mapTypeIds = {
      terrain: window.kakao.maps.MapTypeId.TERRAIN,
      traffic: window.kakao.maps.MapTypeId.TRAFFIC,
      bicycle: window.kakao.maps.MapTypeId.BICYCLE,
      useDistrict: window.kakao.maps.MapTypeId.USE_DISTRICT
    };
    
    // 모든 지도 타입 제거
    this.map.removeOverlayMapTypeId(mapTypeIds.terrain);
    this.map.removeOverlayMapTypeId(mapTypeIds.traffic);
    this.map.removeOverlayMapTypeId(mapTypeIds.bicycle);
    this.map.removeOverlayMapTypeId(mapTypeIds.useDistrict);
    
    // 선택한 지도 타입 추가
    mapTypes.forEach(type => {
      if (mapTypeIds[type]) {
        this.map.addOverlayMapTypeId(mapTypeIds[type]);
      }
    });
  }
}

// 서비스 인스턴스 생성
const kakaoMapService = new KakaoMapService();

export default kakaoMapService;
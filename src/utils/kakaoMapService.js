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

    // 경로 관련 저장소
    this.routes = new Map();
    this.routeOverlays = new Map();
    
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
    return this.dayColors[(day - 1) % this.dayColors.length];
  }
  
  /**
   * 컬러 마커 이미지 생성
   * @param {string} color 색상 코드
   * @returns {Object} 마커 이미지 객체
   */
  createMarkerImage(color) {
    if (this.markerImageCache[color]) {
      return this.markerImageCache[color];
    }
    
    const svgMarker = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="36" viewBox="0 0 24 36">
        <path fill="${color}" d="M12 0C5.4 0 0 5.4 0 12c0 2.2.6 4.2 1.6 6l10.4 18 10.4-18c1-1.8 1.6-3.8 1.6-6 0-6.6-5.4-12-12-12zm0 16c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z"/>
      </svg>
    `;
    
    const svgDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgMarker);
    const markerImage = new window.kakao.maps.MarkerImage(
      svgDataUrl,
      new window.kakao.maps.Size(24, 36),
      { offset: new window.kakao.maps.Point(12, 36) }
    );
    
    this.markerImageCache[color] = markerImage;
    return markerImage;
  }

  /**
   * 지도에 마커 추가 - 일차별 색상 적용 (호버 시 인포윈도우 표시)
   * @param {Array} places 장소 데이터 배열
   * @param {number|null} day 일차 (설정 시 해당 색상 적용)
   */
  addMarkers(places, day = null) {
    this.clearMarkers();
    
    places.forEach((place, index) => {
      if (!place.latitude || !place.longitude) return;
      
      const position = new window.kakao.maps.LatLng(place.latitude, place.longitude);
      
      const markerOptions = {
        map: this.map,
        position: position,
        title: place.placeName,
        zIndex: index
      };
      
      const placeDay = place.day || day;
      if (placeDay) {
        markerOptions.image = this.createMarkerImage(this.getDayColor(placeDay));
      }
      
      const marker = new window.kakao.maps.Marker(markerOptions);
      
      let content = `<div class="map-infowindow" data-marker-index="${index}">`;
      
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
      
      const infowindow = new window.kakao.maps.InfoWindow({
        content: content,
        removable: false,
        zIndex: 100
      });
      
      this.addMarkerHoverEvents(marker, infowindow, index);
      
      this.markers.push(marker);
      this.infowindows.push(infowindow);
      this.bounds.extend(position);
    });
    
    if (this.markers.length > 0) {
      this.map.setBounds(this.bounds);
      
      if (this.markers.length === 1) {
        this.map.setLevel(3);
      }
    }
    
    this.setupInfowindowHoverEvents();
  }
  
  /**
   * 마커에 호버 이벤트 추가
   * @param {Object} marker 마커 객체
   * @param {Object} infowindow 인포윈도우 객체
   * @param {number} index 마커 인덱스
   */
  addMarkerHoverEvents(marker, infowindow, index) {
    window.kakao.maps.event.addListener(marker, 'mouseover', () => {
      this.openInfowindow(infowindow, marker);
    });
    
    window.kakao.maps.event.addListener(marker, 'mouseout', () => {
      setTimeout(() => {
        if (!this.isMouseOnInfowindow) {
          infowindow.close();
        }
      }, 100);
    });
    
    window.kakao.maps.event.addListener(marker, 'click', () => {
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
    if (this.openedInfowindow && this.openedInfowindow !== infowindow) {
      this.openedInfowindow.close();
    }
    
    infowindow.open(this.map, marker);
    this.openedInfowindow = infowindow;
    
    setTimeout(() => {
      this.setupInfowindowHoverEvents();
    }, 100);
  }
  
  /**
   * 인포윈도우 호버 이벤트 설정
   */
  setupInfowindowHoverEvents() {
    const infowindowElements = document.querySelectorAll('.map-infowindow');
    
    infowindowElements.forEach(element => {
      if (element.getAttribute('data-hover-events-added')) return;
      
      element.addEventListener('mouseenter', () => {
        this.isMouseOnInfowindow = true;
      });
      
      element.addEventListener('mouseleave', () => {
        this.isMouseOnInfowindow = false;
        
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
      
      element.setAttribute('data-hover-events-added', 'true');
    });
  }
  
  /**
   * 지도에 여행 일정의 모든 마커 추가 (일차별 색상)
   * @param {Object} itinerary 여행 일정 객체
   */
  addAllDaysMarkers(itinerary) {
    this.clearMarkers();
    
    const allPlaces = [];
    
    if (Array.isArray(itinerary)) {
      itinerary.forEach((dayPlaces, index) => {
        if (dayPlaces && dayPlaces.length > 0) {
          const placesWithDay = dayPlaces.map(place => ({
            ...place,
            day: index + 1
          }));
          
          allPlaces.push(...placesWithDay);
        }
      });
    } else {
      Object.keys(itinerary).forEach(dayKey => {
        const day = parseInt(dayKey.replace('day', ''));
        const placesForDay = itinerary[dayKey];
        
        const placesWithDay = placesForDay.map(place => ({
          ...place,
          day: day
        }));
        
        allPlaces.push(...placesWithDay);
      });
    }
    
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
    
    if (useZoomControl) {
      const zoomControl = new window.kakao.maps.ZoomControl();
      this.map.addControl(zoomControl, window.kakao.maps.ControlPosition.RIGHT);
    }
    
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
 * @param {number} day 일차 번호 (선택사항, 기본값 1)
 */
drawRoute(places, options = {}, day = 1) {
  if (!this.map || places.length < 2) return;
  
  const defaultOptions = {
    strokeWeight: 4,
    strokeColor: '#0064FF',
    strokeOpacity: 0.7,
    strokeStyle: 'solid'
  };
  
  const polylineOptions = { ...defaultOptions, ...options };
  const path = [];
  
  places.forEach(place => {
    if (place.latitude && place.longitude) {
      path.push(new window.kakao.maps.LatLng(place.latitude, place.longitude));
    }
  });
  
  if (path.length >= 2) {
    const polyline = new window.kakao.maps.Polyline({
      map: this.map,
      path: path,
      strokeWeight: polylineOptions.strokeWeight,
      strokeColor: polylineOptions.strokeColor,
      strokeOpacity: polylineOptions.strokeOpacity,
      strokeStyle: polylineOptions.strokeStyle
    });
    
    // routeOverlays에 저장 (중요! 이 부분이 누락되어 있었음)
    if (!this.routeOverlays.has(day)) {
      this.routeOverlays.set(day, []);
    }
    this.routeOverlays.get(day).push(polyline);
    
    // routes에도 경로 데이터 저장
    if (!this.routes.has(day)) {
      this.routes.set(day, []);
    }
    this.routes.get(day).push(places);
    
    console.log(`${day}일차 경로 추가됨. 현재 총 오버레이: ${this.routeOverlays.get(day).length}`);
    
    const bounds = new window.kakao.maps.LatLngBounds();
    path.forEach(point => {
      bounds.extend(point);
    });
    
    this.map.setBounds(bounds);
    
    return polyline;
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

  // ===== 경로 관련 메서드들 =====
  
  /**
   * 특정 일차의 경로를 지도에 표시
   * @param {number} day - 일차 (0부터 시작)
   * @param {Object} pathData - optimizedPaths[day] 데이터
   * @param {Object} options - 경로 스타일 옵션
   */
  drawDayRoute(day, pathData, options = {}) {
    if (!this.map || !pathData) return;

    // 기존 경로 제거
    this.clearDayRoute(day);

    const {
      strokeColor = this.dayColors[day % this.dayColors.length],
      strokeWeight = 4,
      strokeOpacity = 0.8,
      strokeStyle = 'solid'
    } = options;

    try {
      const routeCoordinates = [];
      
      // 호텔(출발지) 추가
      if (pathData.hotel) {
        routeCoordinates.push(new window.kakao.maps.LatLng(pathData.hotel.y, pathData.hotel.x));
      }
      
      // 방문 장소들 순서대로 추가
      if (pathData.places && pathData.places.length > 0) {
        pathData.places.forEach(place => {
          routeCoordinates.push(new window.kakao.maps.LatLng(place.y, place.x));
        });
      }
      
      // 마지막에 호텔로 돌아가기 (원형 경로)
      if (pathData.hotel && routeCoordinates.length > 1) {
        routeCoordinates.push(new window.kakao.maps.LatLng(pathData.hotel.y, pathData.hotel.x));
      }

      // 폴리라인 생성
      const polyline = new window.kakao.maps.Polyline({
        path: routeCoordinates,
        strokeWeight: strokeWeight,
        strokeColor: strokeColor,
        strokeOpacity: strokeOpacity,
        strokeStyle: strokeStyle
      });

      // 지도에 표시
      polyline.setMap(this.map);

      // 저장소에 저장
      if (!this.routeOverlays.has(day)) {
        this.routeOverlays.set(day, []);
      }
      this.routeOverlays.get(day).push(polyline);

      // 방향 화살표 추가 (선택사항)
      if (options.showArrows) {
        this.addRouteArrows(day, routeCoordinates, options);
      }

      // 거리/시간 정보 표시 (선택사항)
      if (options.showInfo) {
        this.addRouteInfo(day, pathData, routeCoordinates);
      }

      console.log(`${day + 1}일차 경로가 지도에 표시되었습니다.`);
      
    } catch (error) {
      console.error(`${day + 1}일차 경로 표시 중 오류:`, error);
    }
  }

  /**
   * 전체 여행 경로를 지도에 표시
   * @param {Array} optimizedPaths - 전체 optimizedPaths 데이터
   * @param {Object} options - 스타일 옵션
   */
  drawAllRoutes(optimizedPaths, options = {}) {
    if (!optimizedPaths || optimizedPaths.length === 0) return;

    optimizedPaths.forEach((dayPath, index) => {
      const dayOptions = {
        strokeColor: this.dayColors[index % this.dayColors.length],
        strokeWeight: 4,
        strokeOpacity: 0.7,
        ...options
      };
      
      this.drawDayRoute(index, dayPath, dayOptions);
    });

    // 전체 경로가 보이도록 지도 범위 조정
    this.fitMapToBounds(optimizedPaths);
  }

  /**
   * 특정 일차의 경로 제거
   * @param {number} day - 일차 (0부터 시작)
   */
  clearDayRoute(day) {
    if (this.routeOverlays.has(day)) {
      this.routeOverlays.get(day).forEach(overlay => {
        overlay.setMap(null);
      });
      this.routeOverlays.set(day, []);
    }
  }

  /**
   * 모든 경로 제거
   */
  clearAllRoutes() {
    console.log('routeOverlays 크기:', this.routeOverlays?.size || 0);
console.log('routes 크기:', this.routes?.size || 0);
console.log('routeOverlays 내용:', this.routeOverlays);

    this.routeOverlays.forEach((overlays, day) => {
      overlays.forEach(overlay => {
        overlay.setMap(null);
      });
    });
    this.routeOverlays.clear();
    this.routes.clear();
  }

  /**
   * 경로에 방향 화살표 추가
   * @param {number} day - 일차
   * @param {Array} coordinates - 좌표 배열
   * @param {Object} options - 스타일 옵션
   */
  addRouteArrows(day, coordinates, options = {}) {
    if (coordinates.length < 2) return;

    const arrowSize = options.arrowSize || 15;
    const arrowColor = options.strokeColor || this.dayColors[day % this.dayColors.length];

    for (let i = 0; i < coordinates.length - 1; i++) {
      const start = coordinates[i];
      const end = coordinates[i + 1];
      
      const midLat = (start.getLat() + end.getLat()) / 2;
      const midLng = (start.getLng() + end.getLng()) / 2;
      
      const angle = Math.atan2(
        end.getLng() - start.getLng(),
        end.getLat() - start.getLat()
      ) * 180 / Math.PI;

      const arrowContent = `
        <div style="
          width: ${arrowSize}px; 
          height: ${arrowSize}px; 
          transform: rotate(${angle}deg);
          color: ${arrowColor};
          font-size: ${arrowSize}px;
          line-height: 1;
        ">▲</div>
      `;

      const customOverlay = new window.kakao.maps.CustomOverlay({
        position: new window.kakao.maps.LatLng(midLat, midLng),
        content: arrowContent,
        xAnchor: 0.5,
        yAnchor: 0.5
      });

      customOverlay.setMap(this.map);

      if (!this.routeOverlays.has(day)) {
        this.routeOverlays.set(day, []);
      }
      this.routeOverlays.get(day).push(customOverlay);
    }
  }

  /**
   * 경로에 거리/시간 정보 표시
   * @param {number} day - 일차
   * @param {Object} pathData - 경로 데이터
   * @param {Array} coordinates - 좌표 배열
   */
  addRouteInfo(day, pathData, coordinates) {
    if (!pathData.places || pathData.places.length === 0) return;

    pathData.places.forEach((place, index) => {
      if (place.fromHotel && coordinates[index + 1]) {
        const distance = (place.fromHotel.distance / 1000).toFixed(1);
        const duration = Math.round(place.fromHotel.duration / 60);
        
        const infoContent = `
          <div style="
            background: rgba(255, 255, 255, 0.9);
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            color: #333;
            border: 1px solid #ddd;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          ">
            ${distance}km · ${duration}분
          </div>
        `;

        const infoOverlay = new window.kakao.maps.CustomOverlay({
          position: coordinates[index + 1],
          content: infoContent,
          xAnchor: 0.5,
          yAnchor: -0.1
        });

        infoOverlay.setMap(this.map);

        if (!this.routeOverlays.has(day)) {
          this.routeOverlays.set(day, []);
        }
        this.routeOverlays.get(day).push(infoOverlay);
      }
    });
  }

  /**
   * 전체 경로가 보이도록 지도 범위 조정
   * @param {Array} optimizedPaths - 전체 경로 데이터
   */
  fitMapToBounds(optimizedPaths) {
    if (!optimizedPaths || optimizedPaths.length === 0) return;

    const bounds = new window.kakao.maps.LatLngBounds();

    optimizedPaths.forEach(dayPath => {
      // 호텔 좌표 추가
      if (dayPath.hotel) {
        bounds.extend(new window.kakao.maps.LatLng(dayPath.hotel.y, dayPath.hotel.x));
      }
      
      // 방문 장소 좌표들 추가
      if (dayPath.places) {
        dayPath.places.forEach(place => {
          bounds.extend(new window.kakao.maps.LatLng(place.y, place.x));
        });
      }
    });

    // 지도 범위 설정
    this.map.setBounds(bounds);
  }

  /**
   * 특정 일차 경로의 가시성 토글
   * @param {number} day - 일차
   * @param {boolean} visible - 표시 여부
   */
  toggleDayRouteVisibility(day, visible) {
    if (this.routeOverlays.has(day)) {
      this.routeOverlays.get(day).forEach(overlay => {
        overlay.setMap(visible ? this.map : null);
      });
    }
  }

  /**
   * 경로 스타일 업데이트
   * @param {number} day - 일차
   * @param {Object} newOptions - 새로운 스타일 옵션
   */
  updateRouteStyle(day, newOptions) {
    if (!this.routeOverlays.has(day)) return;

    this.routeOverlays.get(day).forEach(overlay => {
      if (overlay instanceof window.kakao.maps.Polyline) {
        if (newOptions.strokeColor) overlay.setOptions({ strokeColor: newOptions.strokeColor });
        if (newOptions.strokeWeight) overlay.setOptions({ strokeWeight: newOptions.strokeWeight });
        if (newOptions.strokeOpacity) overlay.setOptions({ strokeOpacity: newOptions.strokeOpacity });
      }
    });
  }

  /**
   * 경로 위의 특정 지점으로 지도 이동
   * @param {number} day - 일차
   * @param {number} placeIndex - 장소 인덱스 (호텔은 -1)
   * @param {Object} pathData - 경로 데이터 (선택사항)
   */
  panToRoutePoint(day, placeIndex = -1, pathData = null) {
    if (!pathData) return;

    let targetCoords;
    
    if (placeIndex === -1 && pathData.hotel) {
      // 호텔로 이동
      targetCoords = new window.kakao.maps.LatLng(pathData.hotel.y, pathData.hotel.x);
    } else if (pathData.places && pathData.places[placeIndex]) {
      // 특정 장소로 이동
      const place = pathData.places[placeIndex];
      targetCoords = new window.kakao.maps.LatLng(place.y, place.x);
    }

    if (targetCoords) {
      this.map.panTo(targetCoords);
    }
  }

  /**
   * 경로 거리 정보 계산
   * @param {Object} pathData - 경로 데이터
   * @returns {Object} 거리 및 소요시간 정보
   */
  calculateRouteInfo(pathData) {
    if (!pathData || !pathData.places) return { totalDistance: 0, totalDuration: 0 };

    let totalDistance = 0;
    let totalDuration = 0;

    pathData.places.forEach(place => {
      if (place.fromHotel) {
        totalDistance += place.fromHotel.distance || 0;
        totalDuration += place.fromHotel.duration || 0;
      }
    });

    return {
      totalDistance: Math.round(totalDistance / 1000 * 10) / 10, // km, 소수점 1자리
      totalDuration: Math.round(totalDuration / 60) // 분
    };
  }

  /**
   * 경로 상태 확인
   * @param {number} day - 일차
   * @returns {boolean} 경로 표시 여부
   */
  isRouteVisible(day) {
    return this.routeOverlays.has(day) && this.routeOverlays.get(day).length > 0;
  }

  /**
   * 모든 마커와 경로 제거
   */
  clearAll() {
    this.clearMarkers();
    this.clearAllRoutes();
  }

  /**
   * 지도 정보 가져오기
   * @returns {Object} 지도 정보
   */
  getMapInfo() {
    if (!this.map) return null;
    
    return {
      center: this.map.getCenter(),
      level: this.map.getLevel(),
      bounds: this.map.getBounds()
    };
  }

  /**
   * 현재 보이는 마커 개수 가져오기
   * @returns {number} 마커 개수
   */
  getVisibleMarkersCount() {
    return this.markers.length;
  }

  /**
   * 현재 활성화된 경로 개수 가져오기
   * @returns {number} 경로 개수
   */
  getActiveRoutesCount() {
    let count = 0;
    this.routeOverlays.forEach((overlays) => {
      if (overlays.length > 0) count++;
    });
    return count;
  }

  /**
   * 지도 범위 내 마커 필터링
   * @returns {Array} 현재 보이는 영역 내의 마커들
   */
  getMarkersInBounds() {
    if (!this.map || this.markers.length === 0) return [];
    
    const bounds = this.map.getBounds();
    return this.markers.filter(marker => {
      return bounds.contain(marker.getPosition());
    });
  }

  /**
   * 특정 좌표가 지도 영역 내에 있는지 확인
   * @param {number} lat - 위도
   * @param {number} lng - 경도
   * @returns {boolean} 영역 내 포함 여부
   */
  isLocationInBounds(lat, lng) {
    if (!this.map) return false;
    
    const position = new window.kakao.maps.LatLng(lat, lng);
    const bounds = this.map.getBounds();
    return bounds.contain(position);
  }

  /**
   * 두 지점 간 거리 계산 (미터 단위)
   * @param {number} lat1 - 첫 번째 지점 위도
   * @param {number} lng1 - 첫 번째 지점 경도
   * @param {number} lat2 - 두 번째 지점 위도
   * @param {number} lng2 - 두 번째 지점 경도
   * @returns {number} 거리 (미터)
   */
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000; // 지구 반지름 (미터)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * 마커 클러스터링 설정
   * @param {boolean} enable - 클러스터링 활성화 여부
   * @param {Object} options - 클러스터 옵션
   */
  setMarkerClustering(enable = true, options = {}) {
    if (!this.map || !window.kakao.maps.MarkerClusterer) return;

    if (this.clusterer) {
      this.clusterer.clear();
      this.clusterer = null;
    }

    if (enable && this.markers.length > 0) {
      const defaultOptions = {
        map: this.map,
        averageCenter: true,
        minLevel: 6,
        disableClickZoom: false,
        ...options
      };

      this.clusterer = new window.kakao.maps.MarkerClusterer(defaultOptions);
      this.clusterer.addMarkers(this.markers);
    }
  }

  /**
   * 서비스 정리 (메모리 정리용)
   */
  destroy() {
    this.clearAll();
    
    if (this.clusterer) {
      this.clusterer.clear();
      this.clusterer = null;
    }
    
    this.map = null;
    this.markers = [];
    this.infowindows = [];
    this.bounds = null;
    this.openedInfowindow = null;
    this.routes.clear();
    this.routeOverlays.clear();
    this.markerImageCache = {};
  }
}

// 서비스 인스턴스 생성
const kakaoMapService = new KakaoMapService();

export default kakaoMapService;
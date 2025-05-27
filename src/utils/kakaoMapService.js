// src/utils/kakaoMapService.js

import infoWindowRenderer from "./InfoWindowRenderer.js";

/**
 * 카카오맵 API 관련 유틸리티 함수들 (WebsiteModal 제거 버전)
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
    this.routeOverlays = new Map();

    this.dayColors = [
      "#0066CC", // 1일차: 진한 파란색
      "#E53935", // 2일차: 진한 빨간색
      "#43A047", // 3일차: 진한 초록색
      "#F57C00", // 4일차: 진한 주황색
      "#8E24AA", // 5일차: 진한 보라색
      "#D81B60", // 6일차: 진한 분홍색
      "#00ACC1", // 7일차: 진한 청록색
      "#7CB342", // 8일차: 진한 라임그린
      "#C62828", // 9일차: 진한 크림슨
      "#5E35B1", // 10일차: 진한 인디고
      "#00838F", // 11일차: 진한 터쿼이즈
      "#6D4C41", // 12일차: 진한 브라운
      "#283593", // 13일차: 진한 네이비
      "#AD1457", // 14일차: 진한 마젠타
      "#558B2F", // 15일차: 진한 올리브그린
    ];

    // 마커 이미지 캐시
    this.markerImageCache = {};

    // WebsiteModal 초기화 제거 - InfoWindowRenderer에서 처리됨
  }

  /**
   * 카카오맵 스크립트 로드
   */
  loadScript() {
    return new Promise((resolve, reject) => {
      if (window.kakao && window.kakao.maps) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      const apiKey = import.meta.env.VITE_KAKAO_MAP_API_KEY;
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&autoload=false&libraries=services`;
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
   */
  initMap(container, options = {}) {
    const defaultOptions = {
      center: new window.kakao.maps.LatLng(37.566826, 126.9786567),
      level: 5,
    };

    const mapOptions = { ...defaultOptions, ...options };
    this.map = new window.kakao.maps.Map(container, mapOptions);
    this.bounds = new window.kakao.maps.LatLngBounds();

    return this.map;
  }

  /**
   * 좌표 변환 (주소 -> 좌표)
   */
  convertAddressToCoord(address) {
    return new Promise((resolve, reject) => {
      const geocoder = new window.kakao.maps.services.Geocoder();

      geocoder.addressSearch(address, (result, status) => {
        if (status === window.kakao.maps.services.Status.OK) {
          resolve({
            lat: result[0].y,
            lng: result[0].x,
            address: result[0].address_name,
          });
        } else {
          reject(new Error("주소 변환에 실패했습니다."));
        }
      });
    });
  }

  /**
   * 일차별 마커 색상 가져오기
   */
  getDayColor(day) {
    return this.dayColors[(day - 1) % this.dayColors.length];
  }

  /**
   * 숫자가 표시된 마커 이미지 생성
   * @param {number} number 표시할 숫자
   * @param {string} color 마커 색상
   * @param {boolean} isHotel 호텔 여부 (집 아이콘)
   */
  createNumberedMarkerImage(number, color, isHotel = false) {
    const cacheKey = `${number}-${color}-${isHotel}`;
    if (this.markerImageCache[cacheKey]) {
      return this.markerImageCache[cacheKey];
    }

    let svgMarker;

    if (isHotel) {
      // 호텔/숙소용 집 모양 핀 마커
      svgMarker = `
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
          <path fill="${color}" stroke="white" stroke-width="2" d="M16 2C10.5 2 6 6.5 6 12c0 2 0.5 4 1.5 5.5L16 36l8.5-18.5C25.5 16 26 14 26 12c0-5.5-4.5-10-10-10z"/>
          <rect x="9" y="8" width="14" height="10" fill="white" rx="1"/>
          <path fill="${color}" d="M11 11h2v1h-2v-1zm4 0h2v1h-2v-1zm4 0h2v1h-2v-1z"/>
          <path fill="${color}" d="M16 6L11 10v6h2v-4h6v4h2V10L16 6z"/>
          <text x="16" y="26" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="8" font-weight="bold">H</text>
        </svg>
      `;
    } else {
      // 방문지용 핀 모양 마커 (정확한 위치 표시)
      svgMarker = `
        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="40" viewBox="0 0 30 40">
          <path fill="${color}" stroke="white" stroke-width="2" d="M15 2C9.5 2 5 6.5 5 12c0 5.5 10 26 10 26s10-20.5 10-26c0-5.5-4.5-10-10-10z"/>
          <circle cx="15" cy="12" r="8" fill="white"/>
          <text x="15" y="17" text-anchor="middle" fill="${color}" font-family="Arial, sans-serif" font-size="11" font-weight="bold">${number}</text>
        </svg>
      `;
    }

    const svgDataUrl =
      "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgMarker);
    const markerImage = new window.kakao.maps.MarkerImage(
      svgDataUrl,
      new window.kakao.maps.Size(isHotel ? 32 : 30, 40),
      { offset: new window.kakao.maps.Point(isHotel ? 16 : 15, 40) }
    );

    this.markerImageCache[cacheKey] = markerImage;
    return markerImage;
  }

  /**
   * 여행 일정에 맞는 통합 마커 및 경로 표시
   * @param {Array} itinerary 여행 일정 배열
   * @param {Array} hotels 숙소 배열
   * @param {boolean} showRoutes 경로 표시 여부
   * @param {Array} routeData 각 일차별 경로 데이터 (거리/소요시간)
   */
  addTravelItinerary(itinerary, hotels, showRoutes = true, routeData = []) {
    this.clearAll();

    if (!itinerary || itinerary.length === 0) return;

    // 각 일차별로 처리
    itinerary.forEach((dayPlaces, dayIndex) => {
      const day = dayIndex + 1;
      const dayColor = this.getDayColor(day);
      const hotel = hotels[dayIndex];

      // showRoutes가 true이고 routeData가 있을 때만 경로 데이터 사용
      const dayRouteData =
        showRoutes && routeData && routeData[dayIndex]
          ? routeData[dayIndex]
          : [];

      // 해당 일차의 전체 장소 목록 생성 (숙소-방문지들-숙소)
      const dayRoute = this.createDayRoute(hotel, dayPlaces, day);

      if (dayRoute.length > 0) {
        // 마커 추가 (showRoutes에 따라 경로 정보 포함 여부 결정)
        this.addDayMarkers(dayRoute, dayColor, dayRouteData, showRoutes);

        // 경로 표시 (showRoutes가 true이고 경로 데이터가 있을 때만)
        if (showRoutes && dayRouteData.length > 0) {
          this.addDayRoute(dayRoute, dayColor, day, dayRouteData);
        }
      }
    });

    // 전체 마커가 보이도록 지도 범위 조정
    if (this.markers.length > 0) {
      this.fitMapToMarkers();
    }
  }

  /**
   * 일차별 경로 생성 (숙소 -> 방문지들 -> 숙소)
   * @param {Object} hotel 숙소 정보
   * @param {Array} places 해당 일차의 방문지 목록
   * @param {number} day 일차
   * @returns {Array} 경로 배열
   */
  createDayRoute(hotel, places, day) {
    const route = [];

    // places가 undefined이거나 배열이 아닌 경우 방어 코드
    const safePlaces = Array.isArray(places) ? places : [];

    // 시작점: 숙소
    if (hotel && hotel.y && hotel.x) {
      route.push({
        ...hotel,
        type: "hotel_start",
        day: day,
        routeIndex: 0,
      });
    }

    // 중간점들: 방문지들
    safePlaces.forEach((place, index) => {
      if (place && place.y && place.x) {
        route.push({
          ...place,
          type: "place",
          day: day,
          routeIndex: route.length,
        });
      }
    });

    // 종료점: 숙소 복귀 (방문지가 있을 때만)
    if (hotel && hotel.y && hotel.x && safePlaces.length > 0) {
      route.push({
        ...hotel,
        type: "hotel_end",
        day: day,
        routeIndex: route.length,
        placeName: hotel.placeName + " (복귀)",
      });
    }

    return route;
  }

  /**
   * 일차별 마커 추가
   */
  addDayMarkers(route, color, routeData = []) {
    route.forEach((place, index) => {
      const position = new window.kakao.maps.LatLng(place.y, place.x);

      let markerImage;
      let markerNumber;

      if (place.type === "hotel_start" || place.type === "hotel_end") {
        markerImage = this.createNumberedMarkerImage(null, color, true);
        markerNumber = place.type === "hotel_start" ? "출발" : "도착";
      } else {
        // 방문지는 1부터 순서대로 번호 매기기 (호텔 제외)
        const placeIndex = route.filter(
          (r, i) => i <= index && r.type === "place"
        ).length;
        markerImage = this.createNumberedMarkerImage(placeIndex, color, false);
        markerNumber = placeIndex;
      }

      const marker = new window.kakao.maps.Marker({
        map: this.map,
        position: position,
        image: markerImage,
        title: place.placeName,
        zIndex: index + 1,
      });

      // 해당 장소의 leg 데이터 찾기
      const legData = infoWindowRenderer.findLegDataForPlace(
        place,
        routeData,
        index
      );

      // 인포윈도우 생성
      const content = infoWindowRenderer.createInfoWindowContent(
        place,
        markerNumber,
        legData
      );
      const infowindow = new window.kakao.maps.InfoWindow({
        content: content,
        removable: false,
        zIndex: 100,
      });

      this.addMarkerEvents(marker, infowindow, index);

      this.markers.push(marker);
      this.infowindows.push(infowindow);
      this.bounds.extend(position);
    });

    // 스타일 추가
    infoWindowRenderer.addInfoWindowStyles();
  }

  /**
   * 마커들이 잘 보이도록 지도 범위 조정 (여유있게)
   */
  fitMapToMarkers() {
    if (this.markers.length === 0) return;

    if (this.markers.length === 1) {
      // 마커가 하나면 적절한 레벨로 설정
      this.map.setCenter(this.markers[0].getPosition());
      this.map.setLevel(4);
    } else {
      // 여러 마커가 있으면 bounds 설정 후 여유 공간 추가
      this.map.setBounds(this.bounds);

      // 현재 레벨에서 1단계 더 넓게 조정 (시각적 여유 공간)
      const currentLevel = this.map.getLevel();
      const newLevel = Math.min(currentLevel + 1, 10); // 최대 레벨 10으로 제한
      this.map.setLevel(newLevel);
    }
  }

  /**
   * 일차별 경로 라인 추가 (점선 + 화살표 + 호버 정보)
   * @param {Array} route 경로 배열
   * @param {string} color 색상
   * @param {number} day 일차
   * @param {Array} routeData 경로 leg 데이터 (거리/소요시간)
   */
  addDayRoute(route, color, day, routeData = []) {
    if (route.length < 2) return;

    const path = route.map(
      (place) => new window.kakao.maps.LatLng(place.y, place.x)
    );

    // 경로별 구간 라인 생성 (개별 구간으로 분리)
    for (let i = 0; i < path.length - 1; i++) {
      const startPoint = path[i];
      const endPoint = path[i + 1];
      const segmentPath = [startPoint, endPoint];

      // 해당 구간의 leg 데이터 찾기
      const legData = routeData[i] || null;

      // 개별 구간 라인 생성
      const polyline = new window.kakao.maps.Polyline({
        map: this.map,
        path: segmentPath,
        strokeWeight: 3,
        strokeColor: color,
        strokeOpacity: 0.8,
        strokeStyle: "shortdash",
        zIndex: 1,
      });

      // 방향 화살표 추가
      this.addDirectionArrow(startPoint, endPoint, color, day);

      // 경로 저장
      if (!this.routeOverlays.has(day)) {
        this.routeOverlays.set(day, []);
      }
      this.routeOverlays.get(day).push(polyline);
    }
  }

  /**
   * 두 지점 간의 bearing(방위각) 계산
   * @param {Object} start 시작점 (lat, lng)
   * @param {Object} end 끝점 (lat, lng)
   * @returns {number} bearing (0-360도)
   */
  calculateBearing(start, end) {
    const startLat = start.getLat() * (Math.PI / 180);
    const startLng = start.getLng() * (Math.PI / 180);
    const endLat = end.getLat() * (Math.PI / 180);
    const endLng = end.getLng() * (Math.PI / 180);

    const deltaLng = endLng - startLng;

    const y = Math.sin(deltaLng) * Math.cos(endLat);
    const x =
      Math.cos(startLat) * Math.sin(endLat) -
      Math.sin(startLat) * Math.cos(endLat) * Math.cos(deltaLng);

    let bearing = Math.atan2(y, x) * (180 / Math.PI);

    // 0-360도로 정규화
    bearing = (bearing + 360) % 360;

    return bearing;
  }

  /**
   * 두 지점 간의 거리 계산 (미터)
   * @param {Object} start 시작점
   * @param {Object} end 끝점
   * @returns {number} 거리 (미터)
   */
  calculateDistance(start, end) {
    const R = 6371000; // 지구 반지름 (미터)
    const lat1 = start.getLat() * (Math.PI / 180);
    const lat2 = end.getLat() * (Math.PI / 180);
    const deltaLat = (end.getLat() - start.getLat()) * (Math.PI / 180);
    const deltaLng = (end.getLng() - start.getLng()) * (Math.PI / 180);

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1) *
        Math.cos(lat2) *
        Math.sin(deltaLng / 2) *
        Math.sin(deltaLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * 회전된 심플한 화살표 SVG 생성 (꼬리없는 삼각형 화살표)
   * @param {number} angle 회전 각도 (도)
   * @param {string} color 색상
   * @returns {string} 회전된 SVG 문자열
   */
  createRotatedArrowSVG(angle, color) {
    const centerX = 15;
    const centerY = 15;
    const radian = (angle * Math.PI) / 180;

    // 심플한 삼각형 화살표 점들 (위쪽을 향하는 화살표)
    const originalPoints = [
      [15, 5], // 화살표 끝 (위)
      [22, 15], // 오른쪽 끝
      [18, 15], // 오른쪽 안쪽
      [18, 20], // 오른쪽 아래 (약간의 꼬리)
      [12, 20], // 왼쪽 아래 (약간의 꼬리)
      [12, 15], // 왼쪽 안쪽
      [8, 15], // 왼쪽 끝
    ];

    // 각 점을 회전
    const rotatedPoints = originalPoints.map(([x, y]) => {
      const dx = x - centerX;
      const dy = y - centerY;
      const rotatedX =
        centerX + (dx * Math.cos(radian) - dy * Math.sin(radian));
      const rotatedY =
        centerY + (dx * Math.sin(radian) + dy * Math.cos(radian));
      return [rotatedX.toFixed(2), rotatedY.toFixed(2)];
    });

    // SVG path 생성
    const pathData = `M ${rotatedPoints[0].join(" ")} L ${rotatedPoints
      .slice(1)
      .map((p) => p.join(" "))
      .join(" L ")} Z`;

    return `
      <svg width="45" height="45" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
        <path d="${pathData}" 
              fill="${color}" 
              stroke="white" 
              stroke-width="2"
              stroke-linejoin="round"/>
      </svg>
    `;
  }

  /**
   * 개별 경로 구간에 방향 화살표 추가 (수학적 회전 방식)
   */
  addDirectionArrow(start, end, color, day) {
    // 두 지점 간의 실제 거리 계산
    const distance = this.calculateDistance(start, end);

    // 거리가 너무 짧으면 화살표 생략 (100미터 미만)
    if (distance < 100) return;

    // bearing(방위각) 계산
    const bearing = this.calculateBearing(start, end);

    // 중점 계산
    const midLat = (start.getLat() + end.getLat()) / 2;
    const midLng = (start.getLng() + end.getLng()) / 2;

    // 수학적으로 회전된 심플한 화살표 SVG 생성
    const rotatedArrowSVG = this.createRotatedArrowSVG(bearing, color);

    const arrowContent = `
      <div style="
        width: 32px; 
        height: 32px; 
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
        filter: drop-shadow(0 3px 6px rgba(0,0,0,0.4));
      ">
        ${rotatedArrowSVG}
      </div>
    `;

    const customOverlay = new window.kakao.maps.CustomOverlay({
      map: this.map,
      position: new window.kakao.maps.LatLng(midLat, midLng),
      content: arrowContent,
      xAnchor: 0.5,
      yAnchor: 0.5,
      zIndex: 2,
    });

    if (!this.routeOverlays.has(day)) {
      this.routeOverlays.set(day, []);
    }
    this.routeOverlays.get(day).push(customOverlay);
  }

  /**
   * 마커 이벤트 추가
   */
  addMarkerEvents(marker, infowindow, index) {
    // 마우스 오버 시 인포윈도우 표시
    window.kakao.maps.event.addListener(marker, "mouseover", () => {
      this.openInfowindow(infowindow, marker);
    });

    // 마우스 아웃 시 인포윈도우 숨김 (약간의 지연)
    window.kakao.maps.event.addListener(marker, "mouseout", () => {
      setTimeout(() => {
        if (!this.isMouseOnInfowindow) {
          infowindow.close();
        }
      }, 100);
    });

    // 클릭 시 인포윈도우 토글
    window.kakao.maps.event.addListener(marker, "click", () => {
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
    const infowindowElements = document.querySelectorAll(".map-infowindow");

    infowindowElements.forEach((element) => {
      if (element.getAttribute("data-hover-events-added")) return;

      element.addEventListener("mouseenter", () => {
        this.isMouseOnInfowindow = true;
      });

      element.addEventListener("mouseleave", () => {
        this.isMouseOnInfowindow = false;

        setTimeout(() => {
          if (!this.isMouseOnInfowindow) {
            const index = element.getAttribute("data-marker-index");
            if (index !== null && this.infowindows[index]) {
              this.infowindows[index].close();
              if (this.openedInfowindow === this.infowindows[index]) {
                this.openedInfowindow = null;
              }
            }
          }
        }, 100);
      });

      element.setAttribute("data-hover-events-added", "true");
    });
  }

  /**
   * 특정 인덱스의 마커로 포커스 이동
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
    this.infowindows.forEach((infowindow) => {
      infowindow.close();
    });
    this.openedInfowindow = null;
  }

  /**
   * 모든 마커 제거
   */
  clearMarkers() {
    this.closeAllInfowindows();

    this.markers.forEach((marker) => {
      marker.setMap(null);
    });

    this.markers = [];
    this.infowindows = [];
    this.bounds = new window.kakao.maps.LatLngBounds();
    this.openedInfowindow = null;
  }

  /**
   * 모든 경로 제거
   */
  clearAllRoutes() {
    this.routeOverlays.forEach((overlays) => {
      overlays.forEach((overlay) => {
        overlay.setMap(null);
      });
    });
    this.routeOverlays.clear();
  }

  /**
   * 모든 마커와 경로 제거
   */
  clearAll() {
    this.clearMarkers();
    this.clearAllRoutes();
  }

  /**
   * 지도에 컨트롤 추가
   */
  addMapControls(useZoomControl = true, useTypeControl = true) {
    if (!this.map) return;

    if (useZoomControl) {
      const zoomControl = new window.kakao.maps.ZoomControl();
      this.map.addControl(zoomControl, window.kakao.maps.ControlPosition.RIGHT);
    }

    if (useTypeControl) {
      const typeControl = new window.kakao.maps.MapTypeControl();
      this.map.addControl(
        typeControl,
        window.kakao.maps.ControlPosition.TOPRIGHT
      );
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
   * 서비스 정리 (메모리 정리용)
   */
  destroy() {
    this.clearAll();
    // WebsiteModal 제거 - InfoWindowRenderer에서 처리됨
    this.map = null;
    this.markerImageCache = {};
  }
}

// 서비스 인스턴스 생성
const kakaoMapService = new KakaoMapService();

export default kakaoMapService;

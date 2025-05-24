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
    this.routeOverlays = new Map();

    // 웹사이트 모달 관련
    this.websiteModal = null;

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

    // 웹사이트 모달 생성
    this.createWebsiteModal();
  }

  /**
   * 웹사이트 모달 생성
   */
  createWebsiteModal() {
    // 기존 모달이 있으면 제거
    if (this.websiteModal) {
      document.body.removeChild(this.websiteModal);
    }

    // 모달 HTML 생성
    this.websiteModal = document.createElement("div");
    this.websiteModal.className = "website-modal-overlay";
    this.websiteModal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(5px);
      -webkit-backdrop-filter: blur(5px);
      z-index: 10000;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 20px;
      box-sizing: border-box;
    `;

    this.websiteModal.innerHTML = `
      <div class="website-modal-content" style="
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(15px);
        -webkit-backdrop-filter: blur(15px);
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 16px;
        width: 90%;
        max-width: 1200px;
        height: 85%;
        max-height: 800px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        position: relative;
      ">
        <div class="modal-header" style="
          padding: 20px 24px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
          display: flex;
          justify-content: between;
          align-items: center;
          background: rgba(255, 255, 255, 0.8);
        ">
          <div class="modal-title" style="
            font-size: 18px;
            font-weight: 600;
            color: #2d3748;
            margin-right: auto;
          "></div>
          <button class="modal-close-btn" style="
            background: rgba(239, 68, 68, 0.1);
            border: none;
            border-radius: 50%;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            color: #ef4444;
            font-size: 18px;
            font-weight: bold;
            transition: all 0.2s ease;
          " onmouseover="this.style.background='rgba(239, 68, 68, 0.2)'" 
             onmouseout="this.style.background='rgba(239, 68, 68, 0.1)'">×</button>
        </div>
        <div class="modal-body" style="
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        ">
          <div class="loading-indicator" style="
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            font-size: 16px;
            color: #718096;
          ">
            <div style="
              width: 40px;
              height: 40px;
              border: 3px solid #e2e8f0;
              border-top: 3px solid #0064FF;
              border-radius: 50%;
              animation: spin 1s linear infinite;
              margin-right: 12px;
            "></div>
            웹사이트를 불러오는 중...
          </div>
          <iframe class="website-iframe" style="
            width: 100%;
            height: 100%;
            border: none;
            border-radius: 0 0 16px 16px;
            display: none;
          "></iframe>
          <div class="error-message" style="
            display: none;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            padding: 40px;
            text-align: center;
          ">
            <div style="font-size: 48px; margin-bottom: 16px;">🚫</div>
            <div style="font-size: 18px; font-weight: 600; color: #2d3748; margin-bottom: 8px;">
              웹사이트를 불러올 수 없습니다
            </div>
            <div style="font-size: 14px; color: #718096; margin-bottom: 20px;">
              이 웹사이트는 보안 정책으로 인해 미리보기가 제한됩니다.
            </div>
            <button class="open-new-tab-btn" style="
              background: linear-gradient(135deg, #0064FF, #0051CC);
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 8px;
              font-size: 14px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s ease;
              box-shadow: 0 4px 12px rgba(0, 100, 255, 0.3);
            " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(0, 100, 255, 0.4)'"
               onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(0, 100, 255, 0.3)'">
              새 탭에서 열기 →
            </button>
          </div>
        </div>
      </div>
    `;

    // CSS 애니메이션 추가
    const style = document.createElement("style");
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .website-modal-overlay {
        animation: modalFadeIn 0.3s ease-out;
      }
      
      @keyframes modalFadeIn {
        from {
          opacity: 0;
          backdrop-filter: blur(0px);
        }
        to {
          opacity: 1;
          backdrop-filter: blur(5px);
        }
      }
      
      .website-modal-content {
        animation: modalSlideIn 0.3s ease-out;
      }
      
      @keyframes modalSlideIn {
        from {
          opacity: 0;
          transform: translateY(20px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
    `;
    document.head.appendChild(style);

    // 이벤트 리스너 추가
    this.setupModalEvents();

    document.body.appendChild(this.websiteModal);
  }

  /**
   * 모달 이벤트 설정
   */
  setupModalEvents() {
    // 닫기 버튼
    const closeBtn = this.websiteModal.querySelector(".modal-close-btn");
    closeBtn.addEventListener("click", () => this.closeWebsiteModal());

    // 배경 클릭 시 닫기
    this.websiteModal.addEventListener("click", (e) => {
      if (e.target === this.websiteModal) {
        this.closeWebsiteModal();
      }
    });

    // ESC 키로 닫기
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.websiteModal.style.display === "flex") {
        this.closeWebsiteModal();
      }
    });
  }

  /**
   * 웹사이트 모달 열기
   */
  openWebsiteModal(url, placeName) {
    const iframe = this.websiteModal.querySelector(".website-iframe");
    const loadingIndicator =
      this.websiteModal.querySelector(".loading-indicator");
    const errorMessage = this.websiteModal.querySelector(".error-message");
    const modalTitle = this.websiteModal.querySelector(".modal-title");
    const newTabBtn = this.websiteModal.querySelector(".open-new-tab-btn");

    // 초기화
    iframe.style.display = "none";
    loadingIndicator.style.display = "flex";
    errorMessage.style.display = "none";
    modalTitle.textContent = placeName;
    iframe.src = "";

    // 모달 표시
    this.websiteModal.style.display = "flex";

    // iframe 로드 이벤트
    const onLoad = () => {
      loadingIndicator.style.display = "none";
      iframe.style.display = "block";
    };

    const onError = () => {
      loadingIndicator.style.display = "none";
      errorMessage.style.display = "flex";

      // 새 탭에서 열기 버튼 이벤트
      newTabBtn.onclick = () => {
        window.open(url, "_blank");
        this.closeWebsiteModal();
      };
    };

    iframe.onload = onLoad;
    iframe.onerror = onError;

    // 타이머로 로딩 실패 감지 (10초)
    const timeoutId = setTimeout(() => {
      if (loadingIndicator.style.display !== "none") {
        onError();
      }
    }, 10000);

    // iframe src 설정
    try {
      iframe.src = url;
    } catch (error) {
      onError();
    }

    // 성공적으로 로드되면 타이머 클리어
    iframe.addEventListener(
      "load",
      () => {
        clearTimeout(timeoutId);
      },
      { once: true }
    );
  }

  /**
   * 웹사이트 모달 닫기
   */
  closeWebsiteModal() {
    if (this.websiteModal) {
      this.websiteModal.style.display = "none";

      // iframe 정리
      const iframe = this.websiteModal.querySelector(".website-iframe");
      iframe.src = "";
    }
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
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&autoload=false&libraries=services`;
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
   */
  addTravelItinerary(itinerary, hotels, showRoutes = true) {
    this.clearAll();

    if (!itinerary || itinerary.length === 0) return;

    // 각 일차별로 처리
    itinerary.forEach((dayPlaces, dayIndex) => {
      const day = dayIndex + 1;
      const dayColor = this.getDayColor(day);
      const hotel = hotels[dayIndex];

      // 해당 일차의 전체 장소 목록 생성 (숙소-방문지들-숙소)
      const dayRoute = this.createDayRoute(hotel, dayPlaces, day);

      if (dayRoute.length > 0) {
        // 마커 추가
        this.addDayMarkers(dayRoute, dayColor);

        // 경로 표시
        if (showRoutes) {
          this.addDayRoute(dayRoute, dayColor, day);
        }
      }
    });

    // 전체 마커가 보이도록 지도 범위 조정
    if (this.markers.length > 0) {
      this.fitMapToMarkers();
    }
  }

  /**
   * 일차별 경로 데이터 생성 (숙소-방문지들-숙소)
   */
  createDayRoute(hotel, places, day) {
    const route = [];

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
    places.forEach((place, index) => {
      if (place.y && place.x) {
        route.push({
          ...place,
          type: "place",
          day: day,
          routeIndex: route.length,
        });
      }
    });

    // 종료점: 숙소 복귀 (방문지가 있을 때만)
    if (hotel && hotel.y && hotel.x && places.length > 0) {
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
  addDayMarkers(route, color) {
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

      // 인포윈도우 생성
      const content = this.createInfoWindowContent(place, markerNumber);
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
  }

  /**
   * 인포윈도우 콘텐츠 생성
   */
  createInfoWindowContent(place, markerNumber) {
    const isHotel = place.type === "hotel_start" || place.type === "hotel_end";
    const dayColor = this.getDayColor(place.day);

    return `
      <div class="map-infowindow glass-infowindow" data-marker-index="${
        place.routeIndex
      }" style="
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 12px;
        padding: 12px;
        min-width: 180px;
        max-width: 280px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <div class="infowindow-day" style="
          color: ${dayColor};
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        ">
          ${place.day}일차 ${isHotel ? "(숙소)" : `- ${markerNumber}번째`}
        </div>
        <div class="infowindow-title" style="
          font-weight: 600;
          font-size: 15px;
          margin-bottom: 6px;
          color: #2d3748;
          line-height: 1.3;
        ">${place.placeName}</div>
        <div class="infowindow-address" style="
          font-size: 12px;
          margin-bottom: 8px;
          color: #718096;
          line-height: 1.4;
        ">${place.roadAddressName || place.addressName || ""}</div>
        ${
          place.phone
            ? `
          <div class="infowindow-phone" style="
            font-size: 12px;
            margin-bottom: 8px;
            color: #4a5568;
            display: flex;
            align-items: center;
            gap: 4px;
          ">
            <span style="font-size: 10px;">📞</span> ${place.phone}
          </div>
        `
            : ""
        }
        ${
          place.placeUrl
            ? `
          <div class="infowindow-link" style="margin-top: 10px;">
            <button class="place-detail-btn" data-url="${
              place.placeUrl
            }" data-place-name="${place.placeName}" style="
              color: white;
              background: linear-gradient(135deg, ${dayColor}, ${this.darkenColor(
                dayColor,
                0.2
              )});
              text-decoration: none;
              font-size: 12px;
              font-weight: 600;
              padding: 8px 12px;
              border: none;
              border-radius: 8px;
              display: inline-block;
              transition: all 0.2s ease;
              cursor: pointer;
              box-shadow: 0 2px 8px rgba(${this.hexToRgb(dayColor)}, 0.3);
            " onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 12px rgba(${this.hexToRgb(
              dayColor
            )}, 0.4)'" 
               onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(${this.hexToRgb(
                 dayColor
               )}, 0.3)'">
              🌐 장소 정보 보기
            </button>
          </div>
        `
            : ""
        }
      </div>
    `;
  }

  /**
   * 색상을 어둡게 만드는 함수
   */
  darkenColor(hex, amount) {
    const num = parseInt(hex.replace("#", ""), 16);
    const amt = Math.round(2.55 * amount * 100);
    const R = (num >> 16) - amt;
    const G = ((num >> 8) & 0x00ff) - amt;
    const B = (num & 0x0000ff) - amt;
    return (
      "#" +
      (
        0x1000000 +
        (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
        (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
        (B < 255 ? (B < 1 ? 0 : B) : 255)
      )
        .toString(16)
        .slice(1)
    );
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
   * hex 색상을 rgb로 변환 (rgba 사용을 위해)
   */
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(
          result[3],
          16
        )}`
      : "0, 100, 255";
  }

  /**
   * 일차별 경로 라인 추가 (점선 + 화살표)
   */
  addDayRoute(route, color, day) {
    if (route.length < 2) return;

    const path = route.map(
      (place) => new window.kakao.maps.LatLng(place.y, place.x)
    );

    // 점선 경로 생성
    const polyline = new window.kakao.maps.Polyline({
      map: this.map,
      path: path,
      strokeWeight: 3,
      strokeColor: color,
      strokeOpacity: 0.8,
      strokeStyle: "shortdash", // 점선 스타일
    });

    // 방향 화살표 추가
    this.addDirectionArrows(path, color, day);

    // 경로 저장
    if (!this.routeOverlays.has(day)) {
      this.routeOverlays.set(day, []);
    }
    this.routeOverlays.get(day).push(polyline);
  }

  /**
   * 경로에 방향 화살표 추가
   */
  addDirectionArrows(path, color, day) {
    for (let i = 0; i < path.length - 1; i++) {
      const start = path[i];
      const end = path[i + 1];

      // 중점 계산
      const midLat = (start.getLat() + end.getLat()) / 2;
      const midLng = (start.getLng() + end.getLng()) / 2;

      // 방향 각도 계산
      const angle =
        (Math.atan2(
          end.getLng() - start.getLng(),
          end.getLat() - start.getLat()
        ) *
          180) /
        Math.PI;

      // 화살표 커스텀 오버레이
      const arrowContent = `
        <div style="
          width: 24px; 
          height: 24px; 
          transform: rotate(${angle}deg);
          display: flex;
          align-items: center;
          justify-content: center;
          color: ${color};
          font-size: 18px;
          font-weight: bold;
          text-shadow: 2px 2px 4px rgba(255,255,255,0.9), -1px -1px 2px rgba(0,0,0,0.3);
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
        ">▲</div>
      `;

      const customOverlay = new window.kakao.maps.CustomOverlay({
        map: this.map,
        position: new window.kakao.maps.LatLng(midLat, midLng),
        content: arrowContent,
        xAnchor: 0.5,
        yAnchor: 0.5,
      });

      if (!this.routeOverlays.has(day)) {
        this.routeOverlays.set(day, []);
      }
      this.routeOverlays.get(day).push(customOverlay);
    }
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
      this.setupDetailButtonEvents();
    }, 100);
  }

  /**
   * 상세보기 버튼 이벤트 설정
   */
  setupDetailButtonEvents() {
    const detailButtons = document.querySelectorAll(".place-detail-btn");

    detailButtons.forEach((button) => {
      if (button.getAttribute("data-events-added")) return;

      button.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const url = button.getAttribute("data-url");
        const placeName = button.getAttribute("data-place-name");

        if (url) {
          this.openWebsiteModal(url, placeName);
        }
      });

      button.setAttribute("data-events-added", "true");
    });
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
    this.closeWebsiteModal();

    if (this.websiteModal && this.websiteModal.parentNode) {
      this.websiteModal.parentNode.removeChild(this.websiteModal);
    }

    this.map = null;
    this.markerImageCache = {};
    this.websiteModal = null;
  }
}

// 서비스 인스턴스 생성
const kakaoMapService = new KakaoMapService();

export default kakaoMapService;

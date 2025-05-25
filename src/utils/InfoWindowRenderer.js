// src/utils/InfoWindowRenderer.js

/**
 * 카카오맵 인포윈도우 렌더링 클래스
 */
export class InfoWindowRenderer {
  constructor() {
    this.dayColors = [
      "#0066CC",
      "#E53935",
      "#43A047",
      "#F57C00",
      "#8E24AA",
      "#D81B60",
      "#00ACC1",
      "#7CB342",
      "#C62828",
      "#5E35B1",
      "#00838F",
      "#6D4C41",
      "#283593",
      "#AD1457",
      "#558B2F",
    ];
  }

  /**
   * 일차별 색상 가져오기
   */
  getDayColor(day) {
    return this.dayColors[(day - 1) % this.dayColors.length];
  }

  /**
   * 거리 포맷팅 (미터 -> 킬로미터/미터)
   */
  formatDistance(meters) {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)}km`;
    }
    return `${meters}m`;
  }

  /**
   * 소요시간 포맷팅 (초 -> 분/시간)
   */
  formatDuration(seconds) {
    if (seconds >= 3600) {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}시간 ${minutes}분`;
    } else if (seconds >= 60) {
      const minutes = Math.floor(seconds / 60);
      return `${minutes}분`;
    }
    return `${seconds}초`;
  }

  /**
   * 특정 장소에 대한 leg 데이터 찾기
   */
  findLegDataForPlace(place, routeData, routeIndex) {
    if (!routeData || routeData.length === 0) return null;

    // 호텔(출발지)는 leg 데이터 없음
    if (place.type === "hotel_start") return null;

    // 목적지 ID로 leg 데이터 찾기
    const legInfo = routeData.find((segment) => segment.toPlaceId === place.id);

    return legInfo || null;
  }

  /**
   * 메인 인포윈도우 콘텐츠 생성
   */
  createInfoWindowContent(place, markerNumber, legData = null) {
    const isHotel = place.type === "hotel_start" || place.type === "hotel_end";
    const dayColor = this.getDayColor(place.day);
    const hasWebsite = place.placeUrl && place.placeUrl.trim() !== "";

    return `
      <div class="map-infowindow glass-infowindow" data-marker-index="${
        place.routeIndex
      }">
        ${this.createBackgroundDecoration(dayColor)}
        <div class="infowindow-content">
          ${this.createDayBadge(place.day, isHotel, markerNumber, dayColor)}
          ${this.createPlaceTitle(
            place.placeName,
            hasWebsite,
            place.placeUrl,
            dayColor
          )}
          ${this.createAddressPhone(place)}
          ${this.createLegDataSection(legData, dayColor)}
        </div>
      </div>
    `;
  }

  /**
   * 배경 장식 생성
   */
  createBackgroundDecoration(dayColor) {
    return `
      <div class="infowindow-bg-decoration" style="
        position: absolute;
        top: -50%;
        right: -50%;
        width: 100px;
        height: 100px;
        background: linear-gradient(135deg, ${dayColor}15, ${dayColor}08);
        border-radius: 50%;
        z-index: 0;
      "></div>
    `;
  }

  /**
   * 일차 뱃지 생성
   */
  createDayBadge(day, isHotel, markerNumber, dayColor) {
    const badgeText = isHotel ? "(숙소)" : `${markerNumber}번째 장소`;

    return `
      <div class="infowindow-day" style="
        color: ${dayColor};
        font-size: 13px;
        font-weight: 700;
        margin-bottom: 12px;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        display: flex;
        align-items: center;
        gap: 8px;
      ">
        <span class="day-badge" style="
          background: ${dayColor};
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
        ">${day}일차</span>
        <span style="color: #718096; font-weight: 500;">
          ${badgeText}
        </span>
      </div>
    `;
  }

  /**
   * 장소명 제목 생성 (클릭 가능)
   */
  createPlaceTitle(placeName, hasWebsite, placeUrl, dayColor) {
    const clickHandler = hasWebsite
      ? `onclick="window.kakaoMapService_openWebsite('${placeUrl}', '${placeName}')"`
      : "";

    const hoverStyle = hasWebsite
      ? `onmouseover="this.style.color='${dayColor}'; this.style.transform='translateX(2px)'" 
       onmouseout="this.style.color='#2d3748'; this.style.transform='translateX(0)'"`
      : "";

    return `
      <div class="infowindow-title" style="
        font-weight: 700;
        font-size: 17px;
        margin-bottom: 10px;
        color: #2d3748;
        line-height: 1.3;
        cursor: ${hasWebsite ? "pointer" : "default"};
        display: flex;
        align-items: center;
        gap: 6px;
        transition: all 0.2s ease;
      " ${clickHandler} ${hoverStyle}>
        <span style="flex: 1;">${placeName}</span>
        ${
          hasWebsite
            ? `<span style="color: ${dayColor}; font-size: 14px;">🌐</span>`
            : ""
        }
      </div>
    `;
  }

  /**
   * 주소 및 전화번호 섹션 생성
   */
  createAddressPhone(place) {
    const addressAndPhone = [];

    if (place.roadAddressName || place.addressName) {
      addressAndPhone.push(place.roadAddressName || place.addressName);
    }

    if (place.phone) {
      addressAndPhone.push(`📞 ${place.phone}`);
    }

    const addressPhoneText = addressAndPhone.join(" • ");

    if (!addressPhoneText) return "";

    return `
      <div class="infowindow-address-phone" style="
        font-size: 13px;
        margin-bottom: 12px;
        color: #718096;
        line-height: 1.4;
        padding: 8px 12px;
        background: rgba(247, 250, 252, 0.6);
        border-radius: 8px;
        border-left: 3px solid ${this.getDayColor(place.day)};
      ">
        ${addressPhoneText}
      </div>
    `;
  }

  /**
   * Leg 데이터 섹션 생성 (이동 정보)
   */
  createLegDataSection(legData, dayColor) {
    if (!legData) return "";

    return `
      <div class="infowindow-leg-data" style="
        margin-top: 12px;
        padding: 10px 12px;
        background: linear-gradient(135deg, ${dayColor}10, ${dayColor}05);
        border-radius: 10px;
        border: 1px solid ${dayColor}20;
      ">
        <div style="
          color: ${dayColor};
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        ">이전 장소에서</div>
        <div style="
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <div style="
            display: flex;
            align-items: center;
            gap: 4px;
            color: #4a5568;
            font-size: 13px;
            font-weight: 600;
          ">
            <span style="color: ${dayColor};">📏</span>
            ${this.formatDistance(legData.distance)}
          </div>
          <div style="
            display: flex;
            align-items: center;
            gap: 4px;
            color: #4a5568;
            font-size: 13px;
            font-weight: 600;
          ">
            <span style="color: ${dayColor};">⏱️</span>
            ${this.formatDuration(legData.duration)}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 경로 호버 툴팁 콘텐츠 생성
   */
  createRouteHoverContent(legData, color, day, segmentIndex) {
    const distance = this.formatDistance(legData.distance);
    const duration = this.formatDuration(legData.duration);
    const fromPlace = legData.fromPlace
      ? legData.fromPlace.placeName
      : "출발지";

    return `
      <div class="route-hover-tooltip" style="
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 8px;
        padding: 8px 12px;
        font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        pointer-events: none;
        white-space: nowrap;
      ">
        <div style="
          color: ${color};
          font-weight: 700;
          font-size: 11px;
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        ">${day}일차 경로</div>
        <div style="
          color: #2d3748;
          font-weight: 600;
          margin-bottom: 2px;
        ">${fromPlace}에서</div>
        <div style="
          display: flex;
          gap: 12px;
          color: #4a5568;
          font-size: 11px;
        ">
          <span style="display: flex; align-items: center; gap: 3px;">
            <span style="color: ${color};">📏</span> ${distance}
          </span>
          <span style="display: flex; align-items: center; gap: 3px;">
            <span style="color: ${color};">⏱️</span> ${duration}
          </span>
        </div>
      </div>
    `;
  }

  /**
   * 인포윈도우 기본 스타일 추가
   */
  addInfoWindowStyles() {
    // 기본 스타일이 없으면 추가
    if (!document.getElementById("infowindow-styles")) {
      const style = document.createElement("style");
      style.id = "infowindow-styles";
      style.textContent = `
        .map-infowindow {
          background: rgba(255, 255, 255, 0.90) !important;
          backdrop-filter: blur(15px) !important;
          -webkit-backdrop-filter: blur(15px) !important;
          border: 1px solid rgba(255, 255, 255, 0.20) !important;
          border-radius: 16px !important;
          padding: 18px !important;
          min-width: 240px !important;
          max-width: 320px !important;
          box-shadow: 0 8px 32px rgba(31, 38, 135, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1) !important;
          font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          position: relative !important;
          overflow: hidden !important;
        }
        
        .infowindow-content {
          position: relative;
          z-index: 1;
        }
        
        .route-hover-tooltip {
          animation: tooltipFadeIn 0.2s ease-out;
        }
        
        @keyframes tooltipFadeIn {
          from {
            opacity: 0;
            transform: translateY(5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `;
      document.head.appendChild(style);
    }
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
const infoWindowRenderer = new InfoWindowRenderer();
export default infoWindowRenderer;

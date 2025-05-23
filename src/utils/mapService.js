// services/mapService.js
import { regionNameMapping, fallbackRegions } from "@/assets/data/travelData";

class MapService {
  constructor() {
    this.map = null;
    this.polygons = [];
    this.eventHandlers = {
      onRegionHovered: null,
      onRegionSelected: null,
      onNotification: null,
    };
  }

  // 이벤트 핸들러 설정
  setEventHandlers(handlers) {
    this.eventHandlers = { ...this.eventHandlers, ...handlers };
  }

  // 카카오맵 스크립트 로드
  loadKakaoMapScript() {
    return new Promise((resolve, reject) => {
      // 이미 로드된 경우
      if (window.kakao && window.kakao.maps) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.async = true;
      script.src =
        "https://dapi.kakao.com/v2/maps/sdk.js?appkey=e275d3ecdc79f7233649e9ee24d2e982&autoload=false";

      script.onload = () => {
        window.kakao.maps.load(() => {
          resolve();
        });
      };

      script.onerror = () => {
        reject(new Error("카카오맵 스크립트 로드 실패"));
      };

      document.head.appendChild(script);
    });
  }

  // 지도 초기화
  initializeMap(container) {
    if (!container) return null;

    const options = {
      center: new window.kakao.maps.LatLng(36.5, 127.5), // 대한민국 중심 좌표
      level: 13, // 전국이 보이는 레벨
      draggable: true,
      scrollwheel: true,
      disableDoubleClick: false,
      disableDoubleClickZoom: false,
      keyboardShortcuts: true,
    };

    this.map = new window.kakao.maps.Map(container, options);
    return this.map;
  }

  // GeoJSON 데이터 로드 및 폴리곤 생성
  async loadGeoJsonData() {
    try {
      const response = await fetch(
        "/data/korea-administrative-divisions.geojson.json"
      );

      const contentType = response.headers.get("content-type");
      if (!response.ok || !contentType?.includes("application/json")) {
        throw new Error(
          `GeoJSON 파일을 찾을 수 없습니다. (${response.status})`
        );
      }

      const geoJsonData = await response.json();

      if (!geoJsonData.features || !Array.isArray(geoJsonData.features)) {
        throw new Error("올바르지 않은 GeoJSON 형식입니다.");
      }

      let totalPolygons = 0;

      // GeoJSON 데이터를 기반으로 폴리곤 생성
      geoJsonData.features.forEach((feature, index) => {
        const regionName =
          regionNameMapping[feature.properties.CTP_ENG_NM] ||
          feature.properties.CTP_KOR_NM ||
          feature.properties.CTP_ENG_NM;

        if (!regionName) {
          return;
        }

        const coordinates = feature.geometry.coordinates;

        // MultiPolygon 처리
        if (feature.geometry.type === "MultiPolygon") {
          coordinates.forEach((polygonCoords, polyIndex) => {
            if (polygonCoords[0].length > 3) {
              // 최소 좌표 개수 체크
              this.createPolygon(polygonCoords[0], regionName, polyIndex);
              totalPolygons++;
            }
          });
        } else if (feature.geometry.type === "Polygon") {
          // ⭐ 수정: 모든 좌표 배열을 처리 (본토 + 섬들)
          coordinates.forEach((coordArray, polyIndex) => {
            if (coordArray.length > 3) {
              this.createPolygon(coordArray, regionName, polyIndex);
              totalPolygons++;
            }
          });
        }
      });

      // 디버깅을 위한 지역별 폴리곤 개수 확인
      this.checkPolygonCounts();

      // 생성된 폴리곤이 있다면 지도 범위 조정
      if (totalPolygons > 0) {
        setTimeout(() => {
          this.adjustMapBounds();
        }, 500);
      }
    } catch (error) {
      // 대체 데이터로 주요 도시만 표시
      this.createFallbackData();
    }
  }

  // 폴리곤 생성 함수
  createPolygon(coords, regionName, partIndex = 0) {
    try {
      // 좌표 유효성 검사
      if (!coords || !Array.isArray(coords) || coords.length === 0) {
        return;
      }

      // 좌표 변환 시 에러 체크 (범위 검사 완화)
      const path = coords
        .filter((coord) => Array.isArray(coord) && coord.length >= 2)
        .map((coord, index) => {
          const lat = parseFloat(coord[1]);
          const lng = parseFloat(coord[0]);

          // NaN 체크
          if (isNaN(lat) || isNaN(lng)) {
            return null;
          }

          // ⭐ 수정: 좌표 범위를 더 넓게 설정 (제주도, 울릉도 등 포함)
          if (lat < 32.5 || lat > 39.5 || lng < 123.5 || lng > 132.5) {
            return null;
          }

          return new window.kakao.maps.LatLng(lat, lng);
        })
        .filter((latLng) => latLng !== null);

      if (path.length < 3) {
        return;
      }

      const polygon = new window.kakao.maps.Polygon({
        map: this.map,
        path: path,
        strokeWeight: 3, // 두께 증가로 더 잘 보이게
        strokeColor: "#0064FF",
        strokeOpacity: 1, // 완전 불투명
        fillColor: "#0064FF",
        fillOpacity: 0.3, // 채우기 불투명도 증가
      });

      // 폴리곤 저장 (나중에 정리용)
      this.polygons.push(polygon);

      // 폴리곤 경계 영역 계산 및 로그
      const bounds = new window.kakao.maps.LatLngBounds();
      path.forEach((point) => bounds.extend(point));

      // ⭐ 수정: 동일한 지역의 모든 파트에 동일한 이벤트 적용
      // 마우스 호버 이벤트
      window.kakao.maps.event.addListener(polygon, "mouseover", () => {
        // 같은 지역의 모든 폴리곤 하이라이트
        this.highlightRegion(regionName, true);
        this.eventHandlers.onRegionHovered?.(regionName);
      });

      window.kakao.maps.event.addListener(polygon, "mouseout", () => {
        // 같은 지역의 모든 폴리곤 원래 상태로
        this.highlightRegion(regionName, false);
        this.eventHandlers.onRegionHovered?.(null);
      });

      // 클릭 이벤트
      window.kakao.maps.event.addListener(polygon, "click", () => {
        this.eventHandlers.onRegionSelected?.(regionName);
      });

      // ⭐ 추가: 지역별 폴리곤 관리를 위해 regionName을 저장
      polygon._regionName = regionName;
    } catch (error) {
      return null;
    }
  }

  // ⭐ 추가: 지역별 하이라이트 함수
  highlightRegion(regionName, highlight) {
    this.polygons.forEach((polygon) => {
      if (polygon._regionName === regionName) {
        polygon.setOptions({
          fillColor: highlight ? "#FF6B6B" : "#0064FF",
          fillOpacity: highlight ? 0.5 : 0.3,
          strokeOpacity: highlight ? 1 : 1,
          strokeColor: highlight ? "#FF6B6B" : "#0064FF",
        });
      }
    });
  }

  // 대체 데이터 생성 (GeoJSON 로드 실패 시)
  createFallbackData() {
    fallbackRegions.forEach((region) => {
      const circle = new window.kakao.maps.Circle({
        center: new window.kakao.maps.LatLng(region.lat, region.lng),
        radius: region.radius,
        strokeWeight: 2,
        strokeColor: "#0064FF",
        strokeOpacity: 0.8,
        fillColor: "#0064FF",
        fillOpacity: 0.2,
      });

      circle.setMap(this.map);

      // 마커 추가
      const marker = new window.kakao.maps.Marker({
        position: new window.kakao.maps.LatLng(region.lat, region.lng),
        map: this.map,
      });

      // 마커 클릭 이벤트
      window.kakao.maps.event.addListener(marker, "click", () => {
        this.eventHandlers.onRegionSelected?.(region.name);
      });

      // 마커 호버 이벤트
      window.kakao.maps.event.addListener(marker, "mouseover", () => {
        this.eventHandlers.onRegionHovered?.(region.name);
      });

      window.kakao.maps.event.addListener(marker, "mouseout", () => {
        this.eventHandlers.onRegionHovered?.(null);
      });
    });
  }

  // 지도 범위 조정 함수
  adjustMapBounds() {
    if (this.polygons.length === 0) return;

    const bounds = new window.kakao.maps.LatLngBounds();
    let pointCount = 0;

    this.polygons.forEach((polygon) => {
      const path = polygon.getPath();
      if (path && path.length > 0) {
        path.forEach((point) => {
          bounds.extend(point);
          pointCount++;
        });
      }
    });

    if (pointCount > 0) {
      this.map.setBounds(bounds);
    }
  }

  // ⭐ 추가: 디버깅을 위한 지역별 폴리곤 개수 확인 함수
  checkPolygonCounts() {
    const regionCounts = {};
    this.polygons.forEach((polygon) => {
      const regionName = polygon._regionName;
      regionCounts[regionName] = (regionCounts[regionName] || 0) + 1;
    });

    return regionCounts;
  }

  // 폴리곤 정보 표시
  showPolygonInfo() {
    const counts = this.checkPolygonCounts();
    const totalRegions = Object.keys(counts).length;
    const totalPolygons = this.polygons.length;

    return { totalRegions, totalPolygons, counts };
  }

  // 지도 초기 뷰로 리셋
  resetMapView() {
    if (this.map) {
      const center = new window.kakao.maps.LatLng(36.5, 127.5);
      this.map.setCenter(center);
      this.map.setLevel(13);
    }
  }

  // 모든 폴리곤에 맞춰 지도 범위 조정
  fitToBounds() {
    this.adjustMapBounds();
  }

  // 리소스 정리
  cleanup() {
    if (this.map) {
      // 이벤트 리스너 정리
      this.polygons.forEach((polygon) => {
        polygon.setMap(null);
      });
      this.polygons = [];
    }
  }

  // Getter 메서드들
  getMap() {
    return this.map;
  }

  getPolygons() {
    return this.polygons;
  }

  getPolygonCount() {
    return this.polygons.length;
  }
}

// 싱글톤 인스턴스 생성
const mapService = new MapService();

export default mapService;

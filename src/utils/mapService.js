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
    
    // 지역 우선순위 정의 (높을수록 우선)
    this.regionPriority = {
      // 특별시/광역시 (최고 우선순위)
      '서울': 100,
      '부산': 100,
      '대구': 100,
      '인천': 100,
      '광주': 100,
      '대전': 100,
      '울산': 100,
      '세종': 100,
      
      // 특별자치시/도 (중간 우선순위)
      '제주': 50,
      
      // 일반 도 (낮은 우선순위)
      '경기': 10,
      '강원': 10,
      '충북': 10,
      '충남': 10,
      '전북': 10,
      '전남': 10,
      '경북': 10,
      '경남': 10
    };
  }

  // 이벤트 핸들러 설정
  setEventHandlers(handlers) {
    this.eventHandlers = { ...this.eventHandlers, ...handlers };
  }

  // 카카오맵 스크립트 로드
  loadKakaoMapScript() {
    return new Promise((resolve, reject) => {
      if (window.kakao && window.kakao.maps) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.async = true;
      script.src =
        `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${import.meta.env.VITE_KAKAO_MAP_API_KEY}&autoload=false`;

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
      center: new window.kakao.maps.LatLng(36.5, 127.5),
      level: 13,
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
      const regionPolygons = [];

      // 1단계: 모든 폴리곤 데이터 수집
      geoJsonData.features.forEach((feature, index) => {
        const regionName =
          regionNameMapping[feature.properties.CTP_ENG_NM] ||
          feature.properties.CTP_KOR_NM ||
          feature.properties.CTP_ENG_NM;

        if (!regionName) {
          return;
        }

        const coordinates = feature.geometry.coordinates;

        if (feature.geometry.type === "MultiPolygon") {
          coordinates.forEach((polygonCoords, polyIndex) => {
            if (polygonCoords[0].length > 3) {
              regionPolygons.push({
                coords: polygonCoords[0],
                regionName,
                partIndex: polyIndex,
                priority: this.regionPriority[regionName] || 1
              });
              totalPolygons++;
            }
          });
        } else if (feature.geometry.type === "Polygon") {
          coordinates.forEach((coordArray, polyIndex) => {
            if (coordArray.length > 3) {
              regionPolygons.push({
                coords: coordArray,
                regionName,
                partIndex: polyIndex,
                priority: this.regionPriority[regionName] || 1
              });
              totalPolygons++;
            }
          });
        }
      });

      // 2단계: 우선순위별로 정렬하여 생성 (우선순위 높은 것이 나중에 생성되어 위에 표시)
      regionPolygons
        .sort((a, b) => a.priority - b.priority)
        .forEach(polygonData => {
          this.createPolygon(
            polygonData.coords, 
            polygonData.regionName, 
            polygonData.partIndex,
            polygonData.priority
          );
        });

      if (totalPolygons > 0) {
        setTimeout(() => {
          this.adjustMapBounds();
        }, 500);
      }
    } catch (error) {
      this.createFallbackData();
    }
  }

  // 폴리곤 생성 함수
  createPolygon(coords, regionName, partIndex = 0, priority = 1) {
    try {
      if (!coords || !Array.isArray(coords) || coords.length === 0) {
        return;
      }

      const path = coords
        .filter((coord) => Array.isArray(coord) && coord.length >= 2)
        .map((coord, index) => {
          const lat = parseFloat(coord[1]);
          const lng = parseFloat(coord[0]);

          if (isNaN(lat) || isNaN(lng)) {
            return null;
          }

          if (lat < 32.5 || lat > 39.5 || lng < 123.5 || lng > 132.5) {
            return null;
          }

          return new window.kakao.maps.LatLng(lat, lng);
        })
        .filter((latLng) => latLng !== null);

      if (path.length < 3) {
        return;
      }

      // 우선순위에 따른 z-index 설정 (색상은 모두 동일)
      const zIndex = priority;
      
      const polygon = new window.kakao.maps.Polygon({
        map: this.map,
        path: path,
        strokeWeight: 1, // 얇은 테두리
        strokeColor: "#0064FF", // 모든 지역 동일한 색상
        strokeOpacity: 1,
        fillColor: "#0064FF", // 모든 지역 동일한 색상
        fillOpacity: 0.3, // 모든 지역 동일한 투명도
        zIndex: zIndex, // 우선순위에 따른 z-index만 차별화
      });

      this.polygons.push(polygon);

      // 폴리곤에 메타데이터 저장
      polygon._regionName = regionName;
      polygon._priority = priority;

      // 이벤트 리스너
      window.kakao.maps.event.addListener(polygon, "mouseover", (mouseEvent) => {
        const overlappingRegions = this.getOverlappingRegions(mouseEvent.latLng);
        const topPriorityRegion = this.getTopPriorityRegion(overlappingRegions);
        
        if (topPriorityRegion === regionName) {
          this.highlightRegion(regionName, true);
          this.eventHandlers.onRegionHovered?.(regionName);
        }
      });

      window.kakao.maps.event.addListener(polygon, "mouseout", () => {
        this.highlightRegion(regionName, false);
        this.eventHandlers.onRegionHovered?.(null);
      });

      window.kakao.maps.event.addListener(polygon, "click", (mouseEvent) => {
        const overlappingRegions = this.getOverlappingRegions(mouseEvent.latLng);
        const topPriorityRegion = this.getTopPriorityRegion(overlappingRegions);
        
        this.eventHandlers.onRegionSelected?.(topPriorityRegion);
      });

    } catch (error) {
      return null;
    }
  }

  // 특정 좌표에서 겹치는 지역들 찾기
  getOverlappingRegions(latLng) {
    const overlapping = [];
    
    this.polygons.forEach(polygon => {
      const path = polygon.getPath();
      if (this.isPointInPolygon(latLng, path)) {
        overlapping.push({
          name: polygon._regionName,
          priority: polygon._priority
        });
      }
    });
    
    return overlapping;
  }

  // 가장 높은 우선순위 지역 반환
  getTopPriorityRegion(overlappingRegions) {
    if (overlappingRegions.length === 0) return null;
    
    return overlappingRegions.reduce((top, current) => 
      current.priority > top.priority ? current : top
    ).name;
  }

  // 점이 폴리곤 내부에 있는지 확인 (Ray Casting 알고리즘)
  isPointInPolygon(point, path) {
    const lat = point.getLat();
    const lng = point.getLng();
    let inside = false;

    for (let i = 0, j = path.length - 1; i < path.length; j = i++) {
      const xi = path[i].getLng();
      const yi = path[i].getLat();
      const xj = path[j].getLng();
      const yj = path[j].getLat();

      if (((yi > lat) !== (yj > lat)) &&
          (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }

    return inside;
  }

  // 지역별 하이라이트 함수
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

      const marker = new window.kakao.maps.Marker({
        position: new window.kakao.maps.LatLng(region.lat, region.lng),
        map: this.map,
      });

      window.kakao.maps.event.addListener(marker, "click", () => {
        this.eventHandlers.onRegionSelected?.(region.name);
      });

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

  // 지역별 폴리곤 개수 확인
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
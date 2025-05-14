<template>
    <div ref="mapContainer" class="h-full" />
</template>

<script>
import { mapState } from 'vuex';

export default {
  name: "MapContainer",

  data() {
    return {
      map: null,
      markers: [],
      infoWindow: null
    };
  },

  computed: {
    ...mapState('places', ['selectedPlaces']),
  },

  mounted() {
    if (window.kakao && window.kakao.maps) {
      this.loadMap();
    } else {
      this.loadScript();
    }
  },

  watch: {
    selectedPlaces: {
      handler(newPlaces) {
        this.clearMarkers();
        this.renderMarkers(newPlaces);
      },
      immediate: true,
      deep: true
    }
  },
  
  methods: {
    triggerMapResize() {
      if (!this.map) return;
      setTimeout(() => {
        window.kakao.maps.event.trigger(this.map, 'resize');
        this.recalculateMapBounds(); 
      }, 100); 
    },

    loadScript() {
      const script = document.createElement("script");
      script.src = "//dapi.kakao.com/v2/maps/sdk.js?appkey=e275d3ecdc79f7233649e9ee24d2e982&autoload=false";
      script.onload = () => window.kakao.maps.load(this.loadMap);
      document.head.appendChild(script);
    },
    loadMap() {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.initMap(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          this.initMap(33.450701, 126.570667); // fallback
        }
      );
    },
    initMap(lat, lng) {
      const container = this.$refs.mapContainer;
      const options = {
        center: new window.kakao.maps.LatLng(lat, lng),
        level: 3
      };
      this.map = new window.kakao.maps.Map(container, options);
      this.infoWindow = new window.kakao.maps.InfoWindow({ zIndex: 3 });

      // 마커 최초 렌더링
      this.renderMarkers(this.selectedPlaces);
    },

    recalculateMapBounds() {
      if (!this.markers.length) return;
      const bounds = new window.kakao.maps.LatLngBounds();
      this.markers.forEach(marker => bounds.extend(marker.getPosition()));
      this.map.setBounds(bounds);
    },

    renderMarkers(places) {
      if (!this.map || !window.kakao) return;
      const bounds = new window.kakao.maps.LatLngBounds();

      places.forEach((place) => {
        const position = new window.kakao.maps.LatLng(place.y, place.x);
        const marker = new window.kakao.maps.Marker({
          position,
          title: place.placeName
        });

        marker.setMap(this.map);
        this.markers.push(marker);
        bounds.extend(position);

        const content = `
          <div style="padding:15px; font-size:16px;">
            <strong style="font-size:18px;">${place.placeName}</strong><br/>
            <span>${place.addressName || ''}</span><br/>
            <span>${place.phone || ''}</span>
          </div>
        `;
        window.kakao.maps.event.addListener(marker, 'mouseover', () => {
          this.infoWindow.setContent(content);
          this.infoWindow.open(this.map, marker);
        });
        window.kakao.maps.event.addListener(marker, 'mouseout', () => {
          this.infoWindow.close();
        });
      });

      this.recalculateMapBounds();
    },

    // 마커를 모두 삭제하는 메소드
    clearMarkers() {
      this.markers.forEach(marker => marker.setMap(null));
      this.markers = [];
      if (this.infoWindow) {
        this.infoWindow.close();
      }
    },
  }
};
</script>

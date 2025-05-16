<template>
  <KakaoMap
    :lat="center.lat"
    :lng="center.lng"
    :level="3"
    @onLoadKakaoMap="onLoadKakaoMap"
    style="height: 100%; width: 100%"
  >
    <KakaoMapMarker
      v-for="(place, index) in parsedPlaces"
      :key="index"
      :lat="place.y"
      :lng="place.x"
      :clickable="true"
      @mouseover="() => showInfoWindow(index)"
      @mouseout="hideInfoWindow"
    />

    <KakaoMapInfoWindow
      v-if="infoWindowIndex !== null && parsedPlaces.length > infoWindowIndex"
      :lat="parsedPlaces[infoWindowIndex].y"
      :lng="parsedPlaces[infoWindowIndex].x"
      :z-index="3"
    >
      <div style="padding: 15px; font-size: 16px">
        <strong style="font-size: 18px">
          {{ parsedPlaces[infoWindowIndex].placeName }} </strong
        ><br />
        <span>{{ parsedPlaces[infoWindowIndex].addressName || "" }}</span
        ><br />
        <span>{{ parsedPlaces[infoWindowIndex].phone || "" }}</span>
      </div>
    </KakaoMapInfoWindow>
  </KakaoMap>
</template>

<script>
import { KakaoMap, KakaoMapMarker, KakaoMapInfoWindow } from "vue3-kakao-maps";
import { mapState } from "vuex";

export default {
  name: "MapContainer",

  props: {
    sidePanelExpanded: Boolean,
  },

  components: {
    KakaoMap,
    KakaoMapMarker,
    KakaoMapInfoWindow,
  },

  data() {
    return {
      center: { lat: 33.450701, lng: 126.570667 },
      mapInstance: null,
      infoWindowIndex: null,
      isMapLoaded: false,
    };
  },

  computed: {
    ...mapState("places", ["selectedPlaces"]),
    parsedPlaces() {
      return this.selectedPlaces.map((place) => ({
        ...place,
        x: Number(place.x),
        y: Number(place.y),
      }));
    },
  },
  watch: {
    selectedPlaces: {
      handler(newPlaces) {
        if (this.isMapLoaded && newPlaces.length > 0) {
          this.$nextTick(() => {
            this.fitMapToMarkers();
          });
        }
      },
      deep: true,
    },

    sidePanelExpanded() {
      console.log("!!");
      this.fitMapToMarkers();
    },
  },
  methods: {
    relayoutMap() {
      this.$nextTick(() => {
        if (this.mapInstance && window.kakao?.maps) {
          this.mapInstance.relayout();
          console.log(this.mapInstance.relayout());
        }
      });
    },
    onLoadKakaoMap(map) {
      console.log("지도 로드 완료:", map);
      this.mapInstance = map;
      this.isMapLoaded = true;

      if (this.parsedPlaces.length > 0) {
        this.$nextTick(() => {
          this.fitMapToMarkers();
        });
      } else {
        this.setUserLocation();
      }
    },
    setUserLocation() {
      if (!navigator.geolocation) return;

      if (this.selectedPlaces.length > 0) return;

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.center = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          if (this.mapInstance) {
            this.mapInstance.setCenter(
              new window.kakao.maps.LatLng(this.center.lat, this.center.lng)
            );
          }
        },
        () => {}
      );
    },
    showInfoWindow(index) {
      this.infoWindowIndex = index;
    },
    hideInfoWindow() {
      this.infoWindowIndex = null;
    },
    fitMapToMarkers() {
      if (!this.mapInstance || this.parsedPlaces.length === 0) return;

      const bounds = new window.kakao.maps.LatLngBounds();

      this.parsedPlaces.forEach((place) => {
        bounds.extend(new window.kakao.maps.LatLng(place.y, place.x));
      });

      // bounds가 빈 경우도 방지
      if (!bounds.isEmpty()) {
        this.mapInstance.setBounds(bounds);
      }
    },
  },
};
</script>

<template>
  <div class="trip-schedule">
    <!-- 일정 기본 정보 요약 -->
    <div class="trip-info-summary">
      <!-- 편집 가능한 제목 -->
      <h2 class="trip-title" v-if="!isEditingTitle" @click="startEditTitle">
        {{ tripInfo.title || "여행 일정" }}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="edit-icon"
        >
          <path
            d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
          ></path>
          <path
            d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
          ></path>
        </svg>
      </h2>

      <div v-else class="title-edit-container">
        <input
          ref="titleInput"
          v-model="editingTitle"
          @keyup.enter="saveTitle"
          @blur="saveTitle"
          @keyup.esc="cancelEditTitle"
          class="title-input"
          placeholder="여행 제목을 입력하세요"
        />
        <div class="edit-buttons">
          <button @click="saveTitle" class="save-btn">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </button>
          <button @click="cancelEditTitle" class="cancel-btn">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      <div class="trip-details">
        <!-- 편집 가능한 날짜 -->
        <div class="trip-detail-item">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>

          <div
            v-if="!isEditingDates"
            @click="startEditDates"
            class="date-display clickable"
          >
            <span v-if="tripInfo.startDate && tripInfo.endDate">
              {{ formatDateRange(tripInfo.startDate, tripInfo.endDate) }}
            </span>
            <span v-else class="no-date">날짜를 설정하세요</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="edit-icon small"
            >
              <path
                d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
              ></path>
              <path
                d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
              ></path>
            </svg>
          </div>

          <div v-else class="date-edit-container">
            <div class="date-inputs">
              <input
                ref="startDateInput"
                v-model="editingStartDate"
                type="date"
                class="date-input"
                @change="validateDates"
              />
              <span class="date-separator">~</span>
              <input
                v-model="editingEndDate"
                type="date"
                class="date-input"
                :min="editingStartDate"
                @change="validateDates"
              />
            </div>
            <div class="edit-buttons">
              <button
                @click="saveDates"
                class="save-btn"
                :disabled="!areDatesValid"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="3"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </button>
              <button @click="cancelEditDates" class="cancel-btn">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="3"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div v-if="tripInfo.region" class="trip-detail-item">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <span>{{ getRegionName(tripInfo.region) }}</span>
        </div>
      </div>

      <div v-if="tripInfo.memo" class="trip-memo">
        <p>{{ tripInfo.memo }}</p>
      </div>
    </div>

    <!-- 일차 탭 네비게이션 -->
    <div class="day-tabs">
      <button
        v-for="day in tripDuration"
        :key="`day-${day - 1}`"
        class="day-tab"
        :class="{ active: currentDay === day - 1 }"
        @click="selectDay(day - 1)"
      >
        Day {{ day }}
      </button>
    </div>

    <!-- 현재 일차 일정 -->
    <div class="day-schedule-container">
      <!-- 숙소 섹션 -->
      <div class="hotel-section">
        <h3 class="section-title">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M2 20h20"></path>
            <path d="M7 12V6"></path>
            <path d="M7 12h10v8H7z"></path>
            <path d="M7 16h10"></path>
            <path d="M11 6V2a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v4"></path>
          </svg>
          숙소
        </h3>

        <!-- 숙소가 있는 경우 -->
        <div v-if="currentDayHotel" class="hotel-item glass-card">
          <div class="hotel-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M2 20h20"></path>
              <path d="M7 12V6"></path>
              <path d="M7 12h10v8H7z"></path>
              <path d="M7 16h10"></path>
              <path d="M11 6V2a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v4"></path>
            </svg>
          </div>

          <div class="hotel-content">
            <h4 class="hotel-name">{{ currentDayHotel.placeName }}</h4>
            <div class="hotel-category">{{ currentDayHotel.categoryName }}</div>
            <div class="hotel-address">
              {{
                currentDayHotel.roadAddressName || currentDayHotel.addressName
              }}
            </div>

            <div v-if="currentDayHotel.memo" class="hotel-memo">
              <p>{{ currentDayHotel.memo }}</p>
            </div>
          </div>

          <div class="hotel-actions">
            <div v-if="currentDayHotel.checkInTime" class="check-time">
              <span>체크인: {{ formatTime(currentDayHotel.checkInTime) }}</span>
            </div>
            <div v-if="currentDayHotel.checkOutTime" class="check-time">
              <span
                >체크아웃: {{ formatTime(currentDayHotel.checkOutTime) }}</span
              >
            </div>

            <div class="hotel-buttons">
              <button class="hotel-btn edit-btn" @click="editHotel">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path
                    d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                  ></path>
                  <path
                    d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                  ></path>
                </svg>
              </button>
              <button class="hotel-btn delete-btn" @click="removeHotel">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path
                    d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                  ></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- 숙소가 없는 경우 - 추가 버튼 -->
        <div v-else class="hotel-placeholder glass-card" @click="addHotel">
          <div class="placeholder-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="16"></line>
              <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
          </div>
          <span>숙소 추가</span>
        </div>
      </div>

      <!-- 방문 장소 섹션 -->
      <div class="places-section">
        <h3 class="section-title">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          방문 장소
        </h3>

        <div
          v-if="!currentDayPlaces || currentDayPlaces.length === 0"
          class="empty-places"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="16"></line>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
          <p>아직 추가된 장소가 없습니다.</p>
          <p class="sub-message">왼쪽 패널에서 장소를 검색하고 추가해보세요.</p>
        </div>

        <div v-else class="place-list">
          <div
            v-for="(place, index) in currentDayPlaces"
            :key="`place-${place.id}`"
            class="place-item glass-card"
            :class="{ 'drag-active': isDragging }"
            draggable="true"
            @dragstart="dragStart($event, index)"
            @dragover.prevent="dragOver($event, index)"
            @dragenter.prevent
            @dragleave="dragLeave($event)"
            @drop="drop($event, index)"
            @dragend="dragEnd"
          >
            <div class="place-order">{{ index + 1 }}</div>

            <div class="place-content">
              <h4 class="place-name">{{ place.placeName }}</h4>
              <div class="place-category">{{ place.categoryName }}</div>
              <div class="place-address">
                {{ place.roadAddressName || place.addressName }}
              </div>
              <div v-if="place.phone" class="place-phone">
                {{ place.phone }}
              </div>

              <div v-if="place.memo" class="place-memo">
                <p>{{ place.memo }}</p>
              </div>
            </div>

            <div class="place-actions">
              <div class="visit-time" v-if="place.visitTime">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span>{{ formatTime(place.visitTime) }}</span>
              </div>

              <div class="place-buttons">
                <button
                  class="place-btn edit-btn"
                  @click="editPlace(place, index)"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path
                      d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                    ></path>
                    <path
                      d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                    ></path>
                  </svg>
                </button>
                <button
                  class="place-btn delete-btn"
                  @click="removePlace(index)"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path
                      d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                    ></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from "vue";
import { useTravelStore } from "@/stores/travel";
import { useNotificationStore } from "@/stores/notification";
import { storeToRefs } from "pinia";

// 이벤트 정의
const emit = defineEmits(["edit-trip-info", "set-hotel-mode"]);

// 스토어
const travelStore = useTravelStore();
const notificationStore = useNotificationStore();

// 스토어에서 상태 가져오기
const {
  tripInfo,
  currentDay,
  currentDayPlaces,
  currentDayHotel,
  tripDuration,
} = storeToRefs(travelStore);

// 편집 상태 관리
const isEditingTitle = ref(false);
const isEditingDates = ref(false);
const editingTitle = ref("");
const editingStartDate = ref("");
const editingEndDate = ref("");
const areDatesValid = ref(false);

// 드래그 앤 드롭 상태
const isDragging = ref(false);
const draggedItemIndex = ref(-1);

// 템플릿 참조
const titleInput = ref(null);
const startDateInput = ref(null);

// 제목 편집 관련 메서드
const startEditTitle = async () => {
  isEditingTitle.value = true;
  editingTitle.value = tripInfo.value.title || "";

  await nextTick();
  if (titleInput.value) {
    titleInput.value.focus();
    titleInput.value.select();
  }
};

const saveTitle = () => {
  if (editingTitle.value.trim()) {
    travelStore.tripInfo.title = editingTitle.value.trim();
    notificationStore.showSuccess("여행 제목이 변경되었습니다.");
  }
  isEditingTitle.value = false;
};

const cancelEditTitle = () => {
  isEditingTitle.value = false;
  editingTitle.value = "";
};

// 날짜 편집 관련 메서드
const startEditDates = async () => {
  isEditingDates.value = true;

  // 현재 날짜를 YYYY-MM-DD 형식으로 변환
  if (tripInfo.value.startDate) {
    editingStartDate.value = formatDateForInput(tripInfo.value.startDate);
  }
  if (tripInfo.value.endDate) {
    editingEndDate.value = formatDateForInput(tripInfo.value.endDate);
  }

  validateDates();

  await nextTick();
  if (startDateInput.value) {
    startDateInput.value.focus();
  }
};

const formatDateForInput = (date) => {
  if (!date) return "";
  const d = new Date(date);
  return d.toISOString().split("T")[0];
};

const validateDates = () => {
  if (editingStartDate.value && editingEndDate.value) {
    const startDate = new Date(editingStartDate.value);
    const endDate = new Date(editingEndDate.value);
    areDatesValid.value = startDate <= endDate;
  } else {
    areDatesValid.value = false;
  }
};

const saveDates = () => {
  if (areDatesValid.value && editingStartDate.value && editingEndDate.value) {
    travelStore.tripInfo.startDate = new Date(editingStartDate.value);
    travelStore.tripInfo.endDate = new Date(editingEndDate.value);

    // 일정 배열도 새로운 기간에 맞게 조정
    travelStore.adjustItinerary();
    travelStore.adjustHotels();

    notificationStore.showSuccess("여행 날짜가 변경되었습니다.");
  }
  isEditingDates.value = false;
};

const cancelEditDates = () => {
  isEditingDates.value = false;
  editingStartDate.value = "";
  editingEndDate.value = "";
  areDatesValid.value = false;
};

// 기존 메서드들
const selectDay = (day) => {
  travelStore.setCurrentDay(day);
};

const formatDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return "";

  const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    return `${year}.${month}.${day}`;
  };

  return `${formatDate(startDate)} ~ ${formatDate(endDate)} (${
    tripDuration.value
  }일)`;
};

const getRegionName = (region) => {
  if (!region) return "";
  if (region.districtName) {
    return `${region.provinceName} ${region.districtName}`;
  }
  return region.provinceName;
};

const formatTime = (timeString) => {
  if (!timeString) return "";

  const match = timeString.match(/(\d{2}):(\d{2})/);

  if (match) {
    const hour = parseInt(match[1]);
    const minute = match[2];
    const period = hour < 12 ? "오전" : "오후";
    const displayHour = hour % 12 || 12;

    return `${period} ${displayHour}:${minute}`;
  }

  return timeString;
};

// 숙소 관련 메서드
const addHotel = () => {
  travelStore.setHotelSearchMode();
  notificationStore.showInfo("숙소를 검색하여 추가해주세요.");
};

const editHotel = () => {
  notificationStore.showInfo("숙소 편집 기능은 준비 중입니다.");
};

const removeHotel = () => {
  if (confirm("정말 이 숙소를 삭제하시겠습니까?")) {
    travelStore.removeCurrentDayHotel();
    notificationStore.showSuccess("숙소가 삭제되었습니다.");
  }
};

// 장소 관련 메서드
const editPlace = (place, index) => {
  notificationStore.showInfo("장소 편집 기능은 준비 중입니다.");
};

const removePlace = (index) => {
  travelStore.removeCurrentDayPlace(index);
  notificationStore.showSuccess("장소가 삭제되었습니다.");
};

// 드래그 앤 드롭 관련 함수
const dragStart = (event, index) => {
  isDragging.value = true;
  draggedItemIndex.value = index;
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", index);
};

const dragOver = (event, index) => {
  event.currentTarget.classList.add("drag-over");
};

const dragLeave = (event) => {
  event.currentTarget.classList.remove("drag-over");
};

const drop = (event, index) => {
  event.currentTarget.classList.remove("drag-over");

  if (draggedItemIndex.value !== index) {
    // 장소 순서 변경 (movePlaceInDay 메서드가 있다면 사용)
    if (travelStore.movePlaceInDay) {
      travelStore.movePlaceInDay(
        currentDay.value,
        draggedItemIndex.value,
        index
      );
      notificationStore.showSuccess("장소 순서가 변경되었습니다.");
    }
  }
};

const dragEnd = () => {
  isDragging.value = false;
  draggedItemIndex.value = -1;

  document.querySelectorAll(".drag-over").forEach((el) => {
    el.classList.remove("drag-over");
  });
};
</script>

<style lang="scss" scoped>
@use "@/assets/styles" as *;

.trip-schedule {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.trip-info-summary {
  margin-bottom: $spacing-lg;

  .trip-title {
    margin-top: 0;
    margin-bottom: $spacing-sm;
    font-size: 1.5rem;
    color: $primary-color;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    transition: all $transition-fast;
    padding: $spacing-xs;
    border-radius: 8px;

    &:hover {
      background-color: rgba($accent-color, 0.05);

      .edit-icon {
        opacity: 1;
      }
    }

    .edit-icon {
      opacity: 0;
      color: $accent-color;
      transition: opacity $transition-fast;
    }
  }

  .title-edit-container {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: $spacing-sm;

    .title-input {
      flex: 1;
      font-size: 14px;
      font-weight: $font-weight-medium;
      color: $primary-color;
      border: 1px solid rgba($accent-color, 0.3);
      padding: 6px 8px;
      min-height: 28px;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(5px);

      &:focus {
        border-color: $accent-color;
        outline: none;
        box-shadow: 0 0 0 2px rgba($accent-color, 0.1);
      }
    }
  }
}

.trip-details {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-md;
  margin-bottom: $spacing-sm;
}

.trip-detail-item {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  color: $dark-gray;
  font-size: 14px;

  svg {
    color: $accent-color;
  }

  .date-display {
    display: flex;
    align-items: center;
    gap: $spacing-xs;

    &.clickable {
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 6px;
      transition: all $transition-fast;

      &:hover {
        background-color: rgba($accent-color, 0.05);

        .edit-icon {
          opacity: 1;
        }
      }

      .edit-icon {
        opacity: 0;
        transition: opacity $transition-fast;

        &.small {
          width: 12px;
          height: 12px;
        }
      }
    }

    .no-date {
      color: $dark-gray;
      font-style: italic;
    }
  }

  .date-edit-container {
    display: flex;
    align-items: center;
    gap: 4px;

    .date-inputs {
      display: flex;
      align-items: center;
      gap: 2px;

      .date-input {
        font-size: 10px;
        border: 1px solid rgba($accent-color, 0.7);
        min-width: 80px;
        padding: 2px 4px;
        min-height: 24px;
        border-radius: 4px;
        background: rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(5px);

        &:focus {
          border-color: $accent-color;
          outline: none;
          box-shadow: 0 0 0 2px rgba($accent-color, 0.1);
        }
      }

      .date-separator {
        color: $dark-gray;
        font-weight: $font-weight-medium;
        font-size: 8px;
      }
    }
  }
}

.edit-buttons {
  display: flex;
  gap: 4px;

  .save-btn,
  .cancel-btn {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    cursor: pointer;
    border-radius: 3px;
    transition: all $transition-fast;
    padding: 0;

    svg {
      width: 12px;
      height: 12px;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  .save-btn {
    background-color: #0064ff; // PANTONE 2175 C (토스블루)
    color: white;

    &:not(:disabled):hover {
      background-color: rgba(#0064ff, 0.8);
      transform: scale(1.05);
    }

    svg {
      color: white;
    }
  }

  .cancel-btn {
    background-color: white;
    border: 1px solid rgba($dark-gray, 0.3);
    color: $dark-gray;

    &:hover {
      background-color: rgba($error-color, 0.05);
      border-color: $error-color;
      transform: scale(1.05);

      svg {
        color: $error-color;
      }
    }
  }
}

.trip-memo {
  background-color: rgba($primary-color, 0.05);
  border-left: 3px solid rgba($primary-color, 0.2);
  padding: $spacing-sm $spacing-md;
  border-radius: 0 8px 8px 0;
  margin-bottom: $spacing-md;

  p {
    margin: 0;
    font-size: 14px;
    color: $dark-gray;
    line-height: 1.5;
  }
}

.day-tabs {
  display: flex;
  overflow-x: auto;
  gap: $spacing-xs;
  padding-bottom: $spacing-sm;
  margin-bottom: $spacing-md;
  border-bottom: 1px solid rgba($medium-gray, 0.3);

  &::-webkit-scrollbar {
    height: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba($dark-gray, 0.3);
    border-radius: 4px;
  }
}

.day-tab {
  flex: 0 0 auto;
  background: transparent;
  border: none;
  padding: $spacing-xs $spacing-md;
  font-size: 12px;
  font-weight: $font-weight-medium;
  color: $dark-gray;
  border-radius: 16px;
  cursor: pointer;
  transition: all $transition-fast;

  &:hover {
    color: $primary-color;
    background-color: rgba($primary-color, 0.05);
  }

  &.active {
    color: $white;
    background-color: $accent-color;
  }
}

.day-schedule-container {
  flex: 1;
  overflow-y: auto;
  padding-right: $spacing-xs;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba($dark-gray, 0.3);
    border-radius: 4px;
  }
}

.section-title {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  margin: 0 0 $spacing-md;
  font-size: 16px;
  color: $primary-color;

  svg {
    color: $accent-color;
  }
}

.hotel-section {
  margin-bottom: $spacing-xl;
}

.hotel-item {
  display: flex;
  align-items: center;
  padding: $spacing-md;
  border-radius: 12px;

  .hotel-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background-color: rgba($accent-color, 0.1);
    border-radius: 8px;
    margin-right: $spacing-md;

    svg {
      color: $accent-color;
    }
  }

  .hotel-content {
    flex: 1;
    min-width: 0;

    .hotel-name {
      margin: 0 0 $spacing-xs;
      font-size: 14px;
      color: $primary-color;
    }

    .hotel-category {
      display: inline-block;
      background-color: rgba($success-color, 0.1);
      color: $success-color;
      font-size: 8px;
      padding: 2px 4px;
      border-radius: 4px;
      margin-bottom: $spacing-xs;
    }

    .hotel-address {
      color: $dark-gray;
      font-size: 10px;
      margin-bottom: $spacing-xs;
    }

    .hotel-memo {
      background-color: rgba($primary-color, 0.03);
      border-radius: 4px;
      padding: $spacing-xs;
      margin-top: $spacing-xs;

      p {
        margin: 0;
        font-size: 13px;
        color: $dark-gray;
        line-height: 1.4;
      }
    }
  }

  .hotel-actions {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    margin-left: $spacing-md;

    .check-time {
      font-size: 11px;
      color: $dark-gray;
      margin-bottom: $spacing-xs;
    }

    .hotel-buttons {
      display: flex;
      gap: $spacing-xs;
    }
  }
}

.hotel-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $spacing-lg;
  border: 2px dashed rgba($accent-color, 0.3);
  border-radius: 12px;
  cursor: pointer;
  transition: all $transition-fast;

  &:hover {
    border-color: $accent-color;
    background-color: rgba($accent-color, 0.05);
  }

  .placeholder-icon {
    margin-bottom: $spacing-sm;

    svg {
      color: $accent-color;
    }
  }

  span {
    color: $accent-color;
    font-weight: $font-weight-medium;
    font-size: 14px;
  }
}

.places-section {
  .empty-places {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: $spacing-2xl 0;
    color: $dark-gray;

    svg {
      color: rgba($dark-gray, 0.5);
      margin-bottom: $spacing-md;
    }

    p {
      margin: 0;
      font-size: 16px;
      color: $primary-color;
      font-weight: $font-weight-medium;
    }

    .sub-message {
      margin-top: $spacing-xs;
      font-size: 14px;
      color: $dark-gray;
      font-weight: normal;
    }
  }

  .place-list {
    display: flex;
    flex-direction: column;
    gap: $spacing-md;
  }

  .place-item {
    display: flex;
    align-items: center;
    padding: $spacing-md;
    border-radius: 12px;
    transition: all $transition-normal;
    cursor: grab;

    &:hover {
      transform: translateY(-2px);
      box-shadow: $shadow-sm;
    }

    &.drag-over {
      box-shadow: $shadow-md;
      border: 2px dashed $accent-color;
    }

    &.drag-active {
      opacity: 0.5;
    }

    .place-order {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      background-color: $accent-color;
      color: $white;
      font-size: 12px;
      font-weight: $font-weight-bold;
      border-radius: 50%;
      margin-right: $spacing-sm;
    }

    .place-content {
      flex: 1;
      min-width: 0;

      .place-name {
        margin: 0 0 $spacing-xs;
        font-size: 14px;
        color: $primary-color;
      }

      .place-category {
        display: inline-block;
        background-color: rgba($accent-color, 0.1);
        color: $accent-color;
        font-size: 8px;
        padding: 2px 4px;
        border-radius: 4px;
        margin-bottom: $spacing-xs;
      }

      .place-address {
        color: $dark-gray;
        font-size: 10px;
        margin-bottom: $spacing-xs;
      }

      .place-phone {
        color: $dark-gray;
        font-size: 8px;
      }

      .place-memo {
        background-color: rgba($primary-color, 0.03);
        border-radius: 4px;
        padding: $spacing-xs;
        margin-top: $spacing-xs;

        p {
          margin: 0;
          font-size: 13px;
          color: $dark-gray;
          line-height: 1.4;
        }
      }
    }

    .place-actions {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      margin-left: $spacing-md;

      .visit-time {
        display: flex;
        align-items: center;
        gap: $spacing-xs;
        font-size: 12px;
        color: $dark-gray;
        margin-bottom: $spacing-xs;

        svg {
          color: $accent-color;
        }
      }

      .place-buttons {
        display: flex;
        gap: $spacing-xs;
      }
    }
  }
}

.place-btn,
.hotel-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 4px;
  background-color: transparent;
  cursor: pointer;
  transition: all $transition-fast;

  svg {
    color: $dark-gray;
  }

  &.edit-btn:hover {
    background-color: rgba($accent-color, 0.1);

    svg {
      color: $accent-color;
    }
  }

  &.delete-btn:hover {
    background-color: rgba($error-color, 0.1);

    svg {
      color: $error-color;
    }
  }
}

// 반응형
@media (max-width: $breakpoint-md) {
  .title-edit-container {
    flex-direction: column;
    align-items: stretch;
    gap: $spacing-xs;

    .title-input {
      font-size: 14px;
    }

    .edit-buttons {
      align-self: flex-end;
    }
  }

  .date-edit-container {
    flex-direction: column;
    align-items: stretch;
    gap: $spacing-xs;

    .date-inputs {
      justify-content: center;

      .date-input {
        min-width: 75px;
        font-size: 10px;
      }
    }

    .edit-buttons {
      align-self: flex-end;
    }
  }

  .place-item,
  .hotel-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .place-order {
    position: absolute;
    top: $spacing-md;
    right: $spacing-md;
  }

  .place-content,
  .hotel-content {
    width: 100%;
    margin-bottom: $spacing-sm;
  }

  .place-actions,
  .hotel-actions {
    width: 100%;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    margin-left: 0;
    margin-top: $spacing-sm;
  }
}
</style>

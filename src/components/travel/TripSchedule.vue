<template>
  <div class="trip-schedule">
    <!-- 일정 기본 정보 요약 -->
    <div class="trip-info-summary">
      <h2 class="trip-title">{{ tripInfo.title || '여행 일정' }}</h2>
      <div class="trip-details">
        <div v-if="tripInfo.startDate && tripInfo.endDate" class="trip-detail-item">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <span>{{ formatDateRange(tripInfo.startDate, tripInfo.endDate) }}</span>
        </div>
        <div v-if="tripInfo.region" class="trip-detail-item">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
        :key="`day-${day-1}`"
        class="day-tab"
        :class="{ active: currentDay === day - 1 }"
        @click="selectDay(day - 1)"
      >
        Day {{ day }}
      </button>
    </div>
    
    <!-- 현재 일차 장소 목록 -->
    <div class="day-places-container">
      <div v-if="!currentDayPlaces || currentDayPlaces.length === 0" class="empty-places">
        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
          @dragend="dragEnd()"
        >
          <div class="place-order">{{ index + 1 }}</div>
          
          <div class="place-content">
            <h3 class="place-name">{{ place.placeName }}</h3>
            <div class="place-category">{{ place.categoryName }}</div>
            <div class="place-address">{{ place.roadAddressName || place.addressName }}</div>
            
            <div v-if="place.memo" class="place-memo">
              <p>{{ place.memo }}</p>
            </div>
          </div>
          
          <div class="place-actions">
            <div class="visit-time" v-if="place.visitTime">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span>{{ formatTime(place.visitTime) }}</span>
            </div>
            
            <div class="place-buttons">
              <button class="place-btn edit-btn" @click="editPlace(place, index)">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
              <button class="place-btn delete-btn" @click="removePlace(index)">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 편집 모달 -->
    <div v-if="showEditModal" class="modal-backdrop" @click="closeEditModal">
      <div class="modal-container glass-modal" @click.stop>
        <div class="modal-header">
          <h3>장소 정보 편집</h3>
          <button class="close-btn" @click="closeEditModal">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div class="modal-body">
          <div class="form-group">
            <label>장소명</label>
            <div class="place-name-display">{{ editPlaceData.placeName }}</div>
          </div>
          
          <div class="form-group">
            <label>방문 예정 시간</label>
            <input type="time" class="glass-input" v-model="editPlaceData.visitTime">
          </div>
          
          <div class="form-group">
            <label>메모</label>
            <textarea 
              class="glass-input" 
              v-model="editPlaceData.memo"
              placeholder="장소에 대한 메모를 입력하세요"
              rows="3"
            ></textarea>
          </div>
          
          <div class="form-group day-select-group" v-if="tripDuration > 1">
            <label>일자 변경</label>
            <select class="glass-input" v-model="editPlaceData.moveToDay">
              <option v-for="day in tripDuration" :key="`move-day-${day-1}`" :value="day-1">
                {{ day }}일차 ({{ formatDate(getDayDate(day-1)) }})
              </option>
            </select>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="glass-btn" @click="closeEditModal">취소</button>
          <button class="glass-btn primary" @click="saveEditPlace">저장</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, defineEmits } from 'vue';
import { useTravelStore } from '@/stores/travel';
import { useNotificationStore } from '@/stores/notification';
import { storeToRefs } from 'pinia';

// 이벤트 정의
const emit = defineEmits(['edit-trip-info']);

// 스토어
const travelStore = useTravelStore();
const notificationStore = useNotificationStore();

// 스토어에서 상태 가져오기
const { 
  tripInfo, 
  currentDay, 
  currentDayPlaces, 
  tripDuration, 
  getDayDate, 
  formatDate 
} = storeToRefs(travelStore);

// 드래그 앤 드롭 상태
const isDragging = ref(false);
const draggedItemIndex = ref(-1);

// 장소 편집 모달 상태
const showEditModal = ref(false);
const editingPlaceIndex = ref(-1);
const editPlaceData = ref({
  placeName: '',
  visitTime: '',
  memo: '',
  moveToDay: 0
});

// 메서드
const selectDay = (day) => {
  travelStore.setCurrentDay(day);
};

const formatDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return '';
  
  const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return `${year}.${month}.${day}`;
  };
  
  return `${formatDate(startDate)} ~ ${formatDate(endDate)} (${tripDuration.value}일)`;
};

const getRegionName = (region) => {
  if (!region) return '';
  if (region.districtName) {
    return `${region.provinceName} ${region.districtName}`;
  }
  return region.provinceName; // 시/도만 선택된 경우
};

const formatTime = (timeString) => {
  if (!timeString) return '';
  
  // 시간 문자열 포맷팅
  const match = timeString.match(/(\d{2}):(\d{2})/);
  
  if (match) {
    const hour = parseInt(match[1]);
    const minute = match[2];
    const period = hour < 12 ? '오전' : '오후';
    const displayHour = hour % 12 || 12;
    
    return `${period} ${displayHour}:${minute}`;
  }
  
  return timeString;
};

// 드래그 앤 드롭 관련 함수
const dragStart = (event, index) => {
  isDragging.value = true;
  draggedItemIndex.value = index;
  event.dataTransfer.effectAllowed = 'move';
  
  // Firefox에서 드래그를 위해 필요
  event.dataTransfer.setData('text/plain', index);
};

const dragOver = (event, index) => {
  event.currentTarget.classList.add('drag-over');
};

const dragLeave = (event) => {
  event.currentTarget.classList.remove('drag-over');
};

const drop = (event, index) => {
  event.currentTarget.classList.remove('drag-over');
  
  if (draggedItemIndex.value !== index) {
    // 같은 일차 내에서 장소 순서 변경
    travelStore.movePlaceInDay(currentDay.value, draggedItemIndex.value, index);
    notificationStore.showSuccess('장소 순서가 변경되었습니다.');
  }
};

const dragEnd = () => {
  isDragging.value = false;
  draggedItemIndex.value = -1;
  
  // 모든 drag-over 클래스 제거
  document.querySelectorAll('.drag-over').forEach(el => {
    el.classList.remove('drag-over');
  });
};

// 장소 편집 관련 함수
const editPlace = (place, index) => {
  editingPlaceIndex.value = index;
  editPlaceData.value = {
    placeName: place.placeName,
    visitTime: place.visitTime || '',
    memo: place.memo || '',
    moveToDay: currentDay.value
  };
  showEditModal.value = true;
};

const closeEditModal = () => {
  showEditModal.value = false;
  editingPlaceIndex.value = -1;
};

const saveEditPlace = () => {
  if (editingPlaceIndex.value < 0) return;
  
  const place = currentDayPlaces.value[editingPlaceIndex.value];
  
  // 일차 이동 여부 확인
  if (editPlaceData.value.moveToDay !== currentDay.value) {
    // 다른 일차로 이동
    travelStore.movePlaceToAnotherDay(
      currentDay.value, 
      editingPlaceIndex.value, 
      editPlaceData.value.moveToDay
    );
    
    notificationStore.showSuccess(`장소가 ${editPlaceData.value.moveToDay + 1}일차로 이동되었습니다.`);
  } else {
    // 같은 일차 내에서 정보 업데이트
    travelStore.updatePlace({
      id: place.id,
      visitTime: editPlaceData.value.visitTime,
      memo: editPlaceData.value.memo
    });
    
    notificationStore.showSuccess('장소 정보가 업데이트되었습니다.');
  }
  
  closeEditModal();
};

const removePlace = (index) => {
  if (confirm('정말 이 장소를 삭제하시겠습니까?')) {
    travelStore.removeCurrentDayPlace(index);
    notificationStore.showSuccess('장소가 삭제되었습니다.');
  }
};
</script>

<style lang="scss" scoped>
@use '@/assets/styles' as *;

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

.day-places-container {
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
  position: relative;
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
  min-width: 0; // 텍스트 오버플로 방지
}

.place-name {
  margin: 0 0 $spacing-xs;
  font-size: 14px;
  color: $primary-color;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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

.place-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  margin-left: $spacing-md;
}

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

.place-btn {
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

// 모달 스타일
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba($primary-color, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: $z-index-modal-backdrop;
}

.modal-container {
  width: 90%;
  max-width: 450px;
  z-index: $z-index-modal;
  border-radius: 12px;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-md $spacing-lg;
  border-bottom: 1px solid rgba($medium-gray, 0.3);
  
  h3 {
    margin: 0;
    font-size: 18px;
    color: $primary-color;
  }
  
  .close-btn {
    background: transparent;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: $spacing-xs;
    cursor: pointer;
    border-radius: 50%;
    transition: all $transition-fast;
    
    &:hover {
      background-color: rgba($primary-color, 0.05);
    }
    
    svg {
      color: $dark-gray;
    }
  }
}

.modal-body {
  padding: $spacing-lg;
  
  .form-group {
    margin-bottom: $spacing-md;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    label {
      display: block;
      font-weight: $font-weight-medium;
      margin-bottom: $spacing-xs;
      color: $primary-color;
      font-size: 14px;
    }
    
    .place-name-display {
      font-size: 16px;
      color: $dark-gray;
      padding: $spacing-xs 0;
    }
    
    .glass-input {
      width: 100%;
      padding: $spacing-sm $spacing-md;
    }
    
    textarea.glass-input {
      resize: vertical;
      min-height: 80px;
    }
  }
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: $spacing-sm;
  padding: $spacing-md $spacing-lg;
  border-top: 1px solid rgba($medium-gray, 0.3);
}

// 반응형
@media (max-width: $breakpoint-md) {
  .place-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .place-order {
    position: absolute;
    top: $spacing-md;
    right: $spacing-md;
  }
  
  .place-content {
    width: 100%;
    margin-bottom: $spacing-sm;
  }
  
  .place-actions {
    width: 100%;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    margin-left: 0;
    margin-top: $spacing-sm;
  }
}
</style>
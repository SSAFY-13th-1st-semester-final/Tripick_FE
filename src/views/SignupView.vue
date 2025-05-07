<template>
  <div class="p-6 max-w-xs mx-auto bg-white rounded shadow-lg">
    <!-- 프로필 이미지 영역 (중앙 정렬 추가) -->
    <div class="flex justify-center items-center w-full mb-4">
      <div class="w-24 h-24 rounded-full bg-gray-300 overflow-hidden">
        <img :src="profileImage" alt="Profile Image" class="w-full h-full object-cover" />
      </div>
    </div>

    <!-- 이름과 역할, 이메일 영역 -->
    <div class="text-center w-full">
      <!-- 이름과 역할을 수평 배치, 수평선 기준 bottom 정렬 -->
      <div class="flex justify-center items-end space-x-4 mb-4">
        <div class="text-2xl font-bold">{{ member.name }}</div>
        <div class="text-sm text-gray-400">{{ userRole }}</div>
      </div>

      <!-- 이메일: 수정 모드일 때는 이메일 수정 폼을 보여주고, 그렇지 않으면 기존 이메일을 보여주지 않음 -->
      <div v-if="!editMode" class="text-lg text-gray-600">{{ member.email }}</div>
      <div v-if="editMode">
        <transition name="fade">
          <div class="relative mb-4">
            <input 
              v-model="editedMember.email" 
              id="email" 
              class="peer w-full pt-6 pb-2 px-4 text-sm border border-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" 
              placeholder="이메일 수정"
            />
            <label
              :class="[
                'absolute left-4 text-sm text-gray-500 transition-all duration-200 pointer-events-none',
                editedMember.email || focused === 'email'
                  ? 'text-xs top-1 text-blue-800'
                  : 'top-3.5'
              ]"
            >이메일</label>
          </div>
        </transition>
      </div>
    </div>

    <!-- 수정 가능한 항목 (이름, 비밀번호) -->
    <div v-if="editMode" class="space-y-4 mt-4 w-full">
      <transition name="fade">
        <div class="relative mb-4">
          <input
            v-model="editedMember.name"
            id="name"
            @focus="focused = 'name'"
            @blur="focused = ''"
            class="peer w-full pt-6 pb-2 px-4 text-sm border border-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <label
            :class="[
              'absolute left-4 text-sm text-gray-500 transition-all duration-200 pointer-events-none',
              editedMember.name || focused === 'name'
                ? 'text-xs top-1 text-blue-800'
                : 'top-3.5'
            ]"
          >이름</label>
        </div>
      </transition>

      <transition name="fade">
        <div class="relative mb-4">
          <input
            v-model="editedMember.password"
            type="password"
            id="password"
            @focus="focused = 'password'"
            @blur="focused = ''"
            class="peer w-full pt-6 pb-2 px-4 text-sm border border-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="비밀번호 입력"
          />
          <label
            :class="[
              'absolute left-4 text-sm text-gray-500 transition-all duration-200 pointer-events-none',
              editedMember.password || focused === 'password'
                ? 'text-xs top-1 text-blue-800'
                : 'top-3.5'
            ]"
          >비밀번호</label>
        </div>
      </transition>
    </div>

    <!-- 수정/완료/취소 텍스트 -->
    <div class="mt-4 flex justify-end space-x-4">
      <span v-if="!editMode" @click="enableEdit" class="text-blue-500 cursor-pointer text-xs">수정</span>
      <span v-if="editMode" @click="submitEdit" class="text-blue-500 cursor-pointer text-xs">완료</span>
      <span v-if="editMode" @click="cancelEdit" class="text-gray-500 cursor-pointer text-xs">취소</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const member = ref({
  username: '',
  name: '',
  email: ''
})
const editedMember = ref({
  name: '',
  email: '',
  password: ''
})
const userRole = ref('')
const profileImage = ref('') // 프로필 이미지 경로
const editMode = ref(false)
const focused = ref('')

const fetchMemberInfo = async () => {
  try {
    const token = localStorage.getItem('access-token')
    const response = await axios.get('/v1/member', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    member.value = response.data
    profileImage.value = response.data.profileImage || '/default-profile.jpg'
    userRole.value = localStorage.getItem('role') || '사용자'

    editedMember.value.name = member.value.name
    editedMember.value.email = member.value.email
    editedMember.value.password = ''
  } catch (error) {
    console.error('회원 정보 요청 실패:', error)
  }
}

const enableEdit = () => {
  editMode.value = true
}

const cancelEdit = () => {
  editMode.value = false
  // 기존 값을 되돌리기
  editedMember.value.name = member.value.name
  editedMember.value.email = member.value.email
  editedMember.value.password = ''
}

const submitEdit = async () => {
  try {
    const token = localStorage.getItem('access-token')

    const payload = {}

    if (editedMember.value.name !== member.value.name) {
      payload.name = editedMember.value.name
    }

    if (editedMember.value.email !== member.value.email) {
      payload.email = editedMember.value.email
    }

    if (editedMember.value.password) {
      payload.password = editedMember.value.password
    }

    if (Object.keys(payload).length === 0) {
      console.log('변경된 내용이 없습니다.')
      editMode.value = false
      return
    }

    await axios.put('/v1/member', payload, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    // 수정된 정보 반영
    member.value = { ...member.value, ...payload }
    editMode.value = false
  } catch (error) {
    console.error('회원 정보 수정 실패:', error)
  }
}

onMounted(() => {
  fetchMemberInfo()
})
</script>

<style scoped>
/* 스타일 조정 */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}
</style>

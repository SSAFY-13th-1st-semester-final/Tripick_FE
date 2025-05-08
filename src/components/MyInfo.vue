<template>
  <div class="p-4 w-full mx-auto bg-white rounded shadow-lg flex flex-col justify-between flex-row justify-center">
    <div class="">
      <!-- 상단 내용 영역 -->
      <div>
        <!-- 프로필 이미지 영역 (중앙 정렬) -->
        <div class="flex justify-center items-center w-full mb-4">
          <div class="w-16 h-16 rounded-full bg-gray-300 overflow-hidden">
            <img :src="profileImage" alt="Profile Image" class="w-full h-full object-cover" />
          </div>
        </div>

        <!-- 이름과 역할, 이메일 영역 -->
        <div class="text-center w-full">
          <div class="flex justify-center items-end space-x-2 mb-2">
            <div class="text-xl font-bold">{{ member.name }}</div>
            <div class="text-xs text-gray-400">{{ userRole }}</div>
          </div>

          <!-- 이메일 텍스트 항상 표시 -->
          <div class="text-xs text-gray-400 mb-3">
            <span>{{ member.email }}</span>
          </div>

          <!-- 수정 버튼 -->
          <div class="mt-3 mb-3 flex justify-end space-x-3">
            <span v-if="!editMode" @click="enableEdit" class="text-blue-500 cursor-pointer text-xs">수정</span>
            <span v-if="editMode" @click="submitEdit" class="text-blue-500 cursor-pointer text-xs">완료</span>
            <span v-if="editMode" @click="cancelEdit" class="text-gray-500 cursor-pointer text-xs">취소</span>
          </div>
        </div>
      </div>

      <!-- 수정 폼이 펼쳐지는 영역 -->
      <div
        :style="{ height: dynamicHeight + 'vh' }"
        class="overflow-hidden transition-all duration-500 ease-in-out flex justify-center"
        ref="expandableDiv"
      >
        <div v-if="editMode" class="w-[95%]">
          <!-- 수정폼 -->
          <div class="relative mt-2 w-full">
            <input
              v-model="editedMember.email"
              id="email"
              placeholder=" "
              class="peer w-full pt-5 pb-1 px-3 text-xs border border-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 m-0"
            />
            <label
              :class="[ 
                'absolute left-4 text-xs text-gray-500 transition-all duration-200 pointer-events-none',
                editedMember.email ? 'text-xs top-1 text-blue-800' : 'top-3.5' 
              ]"
            >
              이메일
            </label>
          </div>

          <div class="relative mb-3 mt-2">
            <input
              v-model="editedMember.name"
              id="name"
              placeholder=" "
              class="peer w-full pt-5 pb-1 px-3 text-xs border border-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <label
              :class="[ 
                'absolute left-4 text-xs text-gray-500 transition-all duration-200 pointer-events-none',
                editedMember.name ? 'text-xs top-1 text-blue-800' : 'top-3.5' 
              ]"
            >
              이름
            </label>
          </div>

          <div class="relative mb-3 mt-2">
            <input
              v-model="editedMember.password"
              type="password"
              id="password"
              placeholder=" "
              class="peer w-full pt-5 pb-1 px-3 text-xs border border-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <label
              :class="[ 
                'absolute left-4 text-xs text-gray-500 transition-all duration-200 pointer-events-none',
                editedMember.password ? 'text-xs top-1 text-blue-800' : 'top-3.5' 
              ]"
            >
              비밀번호
            </label>
          </div>
        </div>
      </div>
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
const profileImage = ref('')
const editMode = ref(false)

const dynamicHeight = ref(0) // 초기 높이 0으로 설정

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

// 수정 버튼 클릭 시
const enableEdit = () => {
  editMode.value = true
  dynamicHeight.value = 14 // 예시로 20vh 만큼 늘어남
}

const cancelEdit = () => {
  editMode.value = false
  editedMember.value.name = member.value.name
  editedMember.value.email = member.value.email
  editedMember.value.password = ''
  dynamicHeight.value = 0 // 취소하면 다시 원래 크기로 돌아감
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

    member.value = { ...member.value, ...payload }
    editMode.value = false
    dynamicHeight.value = 0 // 완료 후 다시 원래 크기로
  } catch (error) {
    console.error('회원 정보 수정 실패:', error)
  }
}

onMounted(() => {
  fetchMemberInfo()
})
</script>

<style scoped>
/* Transition effect for the height change */
.overflow-hidden {
  overflow: hidden;
}
</style>

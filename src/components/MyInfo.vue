<template>
  <div class="p-4 w-full mx-auto bg-white rounded shadow-lg flex flex-col justify-between font-apple-sdgothic">
    <div>
      <!-- 프로필 이미지 영역 -->
      <div class="flex justify-center items-center w-full mb-4">
        <div class="w-16 h-16 rounded-full bg-gray-300 overflow-hidden">
          <img :src="member.profileImageUrl || '@assets/img/default_user_profile.png'" alt="Profile Image" class="w-full h-full object-cover" />
        </div>
      </div>

      <!-- 이름, 역할, 이메일 -->
      <div class="text-center w-full">
        <div class="flex justify-center items-end space-x-2 mb-2">
          <div class="text-lg font-bold">{{ member.nickname }}</div>
          <div class="text-xs text-gray-400">{{ member.role }}</div>
        </div>
        <div class="text-xs text-gray-400 mb-3">{{ member.email }}</div>

        <!-- 수정 버튼 -->
        <div class="mt-3 mb-3 flex justify-end space-x-3">
          <span v-if="!editMode" @click="enableEdit" class="text-blue-500 cursor-pointer text-xs">수정</span>
          <span v-if="editMode" @click="submitEdit" class="text-blue-500 cursor-pointer text-xs">완료</span>
          <span v-if="editMode" @click="cancelEdit" class="text-gray-500 cursor-pointer text-xs">취소</span>
        </div>
      </div>

      <!-- 수정 폼 영역 -->
      <div :style="{ height: dynamicHeight + 'vh' }"
           class="overflow-hidden transition-all duration-500 ease-in-out flex justify-center"
           ref="expandableDiv">
        <div v-if="editMode" class="w-[95%]">

          <!-- 이메일 입력 -->
          <div class="relative mt-2 w-full">
            <input
              v-model="editedMember.email"
              id="email"
              placeholder=" "
              class="peer w-full pt-5 pb-1 px-3 text-xs border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <label
              for="email"
              :class="[
                'absolute left-4 text-xs text-gray-500 transition-all duration-200 peer-focus:top-1 peer-focus:text-blue-800',
                editedMember.email ? 'top-1 text-blue-800' : 'top-3.5'
              ]"
            >
              이메일
            </label>
          </div>

          <!-- 닉네임 입력 -->
          <div class="relative mb-3 mt-2">
            <input
              v-model="editedMember.nickname"
              id="nickname"
              placeholder=" "
              class="peer w-full pt-5 pb-1 px-3 text-xs border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <label
              for="nickname"
              :class="[
                'absolute left-4 text-xs text-gray-500 transition-all duration-200 peer-focus:top-1 peer-focus:text-blue-800',
                editedMember.nickname ? 'top-1 text-blue-800' : 'top-3.5'
              ]"
            >
              닉네임
            </label>
          </div>

          <!-- 비밀번호 입력 -->
          <div class="relative mb-3 mt-2">
            <input
              v-model="editedMember.password"
              type="password"
              id="password"
              placeholder=" "
              class="peer w-full pt-5 pb-1 px-3 text-xs border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <label
              for="password"
              :class="[
                'absolute left-4 text-xs text-gray-500 transition-all duration-200 peer-focus:top-1 peer-focus:text-blue-800',
                editedMember.password ? 'top-1 text-blue-800' : 'top-3.5'
              ]"
            >
              비밀번호
            </label>
          </div>

          <!-- 전화번호 입력 -->
          <div class="mb-3 mt-2">
            <label class="text-xs text-gray-700 mb-1 block">전화번호</label>
            <div class="flex space-x-2">
              <input
                v-model="phone1"
                maxlength="3"
                type="text"
                inputmode="numeric"
                pattern="\d*"
                class="w-1/3 text-center py-1 px-2 border border-gray-500 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="000"
              />
              <input
                v-model="phone2"
                maxlength="4"
                type="text"
                inputmode="numeric"
                pattern="\d*"
                class="w-1/3 text-center py-1 px-2 border border-gray-500 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0000"
              />
              <input
                v-model="phone3"
                maxlength="4"
                type="text"
                inputmode="numeric"
                pattern="\d*"
                class="w-1/3 text-center py-1 px-2 border border-gray-500 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0000"
              />
            </div>
          </div>

          <!-- 탈퇴하기 링크 -->
          <div class="text-right mt-4">
            <span @click="withdraw" class="text-red-500 text-xs cursor-pointer hover:underline">탈퇴하기</span>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>


<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import TokenService from '@/services/token.service'

const member = ref({
  profileImageUrl: '',
  nickname: '',
  email: '',
  phoneNumber: '',
  role: '',
})

const editedMember = ref({
  nickname: '',
  email: '',
  password: ''
})

const phone1 = ref('')
const phone2 = ref('')
const phone3 = ref('')

const editMode = ref(false)
const dynamicHeight = ref(0)

const fetchMemberInfo = async () => {
  try {
    const token = localStorage.getItem('access-token')
    const response = await axios.get('/v1/member', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    const data = response.data

    member.value = {
      profileImageUrl: data.profileImageUrl,
      nickname: data.nickname,
      email: data.email,
      phoneNumber: data.phoneNumber,
      role: data.role
    }

    editedMember.value = {
      nickname: data.nickname || '',
      email: data.email || '',
      password: ''
    }

    const onlyNums = data.phoneNumber?.replace(/[^\d]/g, '') || ''
    phone1.value = onlyNums.slice(0, 3)
    phone2.value = onlyNums.slice(3, 7)
    phone3.value = onlyNums.slice(7, 11)
  } catch (error) {
    console.error('회원 정보 요청 실패:', error)
  }
}

const enableEdit = () => {
  editMode.value = true
  dynamicHeight.value = 30
}

const cancelEdit = () => {
  editMode.value = false
  editedMember.value.nickname = member.value.nickname
  editedMember.value.email = member.value.email
  editedMember.value.password = ''
  const onlyNums = member.value.phoneNumber?.replace(/[^\d]/g, '') || ''
  phone1.value = onlyNums.slice(0, 3)
  phone2.value = onlyNums.slice(3, 7)
  phone3.value = onlyNums.slice(7, 11)
  dynamicHeight.value = 0
}

const submitEdit = async () => {
  try {
    const token = localStorage.getItem('access-token')

    const trimmedPhone1 = phone1.value.trim().padStart(3, '0')
    const trimmedPhone2 = phone2.value.trim().padStart(4, '0')
    const trimmedPhone3 = phone3.value.trim().padStart(4, '0')
    const newPhoneNumber = `${trimmedPhone1}-${trimmedPhone2}-${trimmedPhone3}`

    const payload = {}

    if (editedMember.value.nickname !== member.value.nickname) {
      payload.nickname = editedMember.value.nickname
    }
    if (editedMember.value.email !== member.value.email) {
      payload.email = editedMember.value.email
    }
    if (newPhoneNumber !== member.value.phoneNumber) {
      payload.phoneNumber = newPhoneNumber
    }
    if (editedMember.value.password) {
      payload.password = editedMember.value.password
    }

    if (Object.keys(payload).length === 0) {
      console.log('변경된 내용이 없습니다.')
      editMode.value = false
      dynamicHeight.value = 0
      return
    }

    await axios.put('/v1/member', payload, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    member.value = { ...member.value, ...payload }
    editMode.value = false
    dynamicHeight.value = 0
  } catch (error) {
    console.error('회원 정보 수정 실패:', error)
  }
}

const withdraw = async () => {
  if (!confirm('정말 탈퇴하시겠습니까?')) return

  try {
    const token = localStorage.getItem('access-token')
    await axios.delete('/v1/member', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    TokenService.clear()
    window.location.href = '/'
  } catch (error) {
    console.error('회원 탈퇴 실패:', error)
    alert('탈퇴에 실패했습니다. 다시 시도해주세요.')
  }
}

onMounted(() => {
  fetchMemberInfo()
})
</script>

<style scoped>
.overflow-hidden {
  overflow: hidden;
}
</style>

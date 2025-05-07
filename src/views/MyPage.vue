<template>
    <div class="p-6 max-w-xl mx-auto bg-white rounded shadow">
      <h2 class="text-2xl font-bold mb-4">마이페이지</h2>
  
      <div v-if="member" class="space-y-4">
        <div>
          <strong>아이디 (username):</strong>
          {{ member.username }}
        </div>
  
        <div>
          <strong>이름:</strong>
          <template v-if="editMode">
            <input v-model="editedMember.name" class="border rounded px-2 py-1 w-full" />
          </template>
          <template v-else>
            {{ member.name }}
          </template>
        </div>
  
        <div>
          <strong>이메일:</strong>
          <template v-if="editMode">
            <input v-model="editedMember.email" class="border rounded px-2 py-1 w-full" />
          </template>
          <template v-else>
            {{ member.email }}
          </template>
        </div>
  
        <!-- 비밀번호 입력란을 수정 모드일 때만 표시 -->
        <div v-if="editMode">
          <strong>비밀번호:</strong>
          <input
            v-model="editedMember.password"
            type="password"
            class="border rounded px-2 py-1 w-full"
            placeholder="비밀번호 입력"
          />
        </div>
      </div>
  
      <div v-else class="text-gray-500">회원 정보를 불러오는 중...</div>
  
      <div class="mt-6 flex gap-2 justify-end">
        <button
          v-if="editMode"
          @click="submitEdit"
          class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          제출
        </button>
        <button
          v-else
          @click="enableEdit"
          class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          수정
        </button>
        <button
          v-if="editMode"
          @click="cancelEdit"
          class="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
        >
          취소
        </button>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue'
  import axios from 'axios'
  
  const member = ref(null)
  const editMode = ref(false)
  const editedMember = ref({
    name: '',
    email: '',
    password: ''
  })
  
  const fetchMemberInfo = async () => {
    try {
      const token = localStorage.getItem('access-token')
  
      const response = await axios.get('/v1/member', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
  
      member.value = response.data
      editedMember.value.name = response.data.name
      editedMember.value.email = response.data.email
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
    // 값 되돌리기
    editedMember.value.name = member.value.name
    editedMember.value.email = member.value.email
    editedMember.value.password = ''
  }
  
  const submitEdit = async () => {
    try {
      const token = localStorage.getItem('user')
  
      const payload = {}
  
      if (editedMember.value.name !== member.value.name) {
        payload.name = editedMember.value.name
      }
  
      if (editedMember.value.email !== member.value.email) {
        payload.email = editedMember.value.email
      }
  
      if (editedMember.value.password && editedMember.value.password.trim() !== '') {
        payload.password = editedMember.value.password
      }
  
      if (Object.keys(payload).length === 0) {
        console.log('변경된 내용이 없습니다.')
        editMode.value = false
        return
      }
  
      const response = await axios.put('/v1/member', payload, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
  
      // 반영된 데이터로 갱신
      member.value = response.data
      editMode.value = false
      editedMember.value.password = ''
  
      // 수정 후 회원 정보 갱신
      await fetchMemberInfo()  // 서버에서 갱신된 정보를 다시 받아옴
  
    } catch (error) {
      console.error('회원 정보 수정 실패:', error)
    }
  }
  
  onMounted(() => {
    fetchMemberInfo()
  })
  </script>
  
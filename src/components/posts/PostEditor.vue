<template>
  <div class="post-editor-container">
    <!-- 상단 에디터 툴바 -->
    <div v-if="editor" class="editor-toolbar">
      <!-- 텍스트 포맷팅 그룹 -->
      <div class="toolbar-group">
        <button
          @click="editor.chain().focus().toggleBold().run()"
          :class="{ 'is-active': editor.isActive('bold') }"
          class="toolbar-btn"
          title="굵게"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8"/>
          </svg>
        </button>
        
        <button
          @click="editor.chain().focus().toggleItalic().run()"
          :class="{ 'is-active': editor.isActive('italic') }"
          class="toolbar-btn"
          title="기울임"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="4" x2="10" y2="4"/>
            <line x1="14" y1="20" x2="5" y2="20"/>
            <line x1="15" y1="4" x2="9" y2="20"/>
          </svg>
        </button>
        
        <button
          @click="editor.chain().focus().toggleStrike().run()"
          :class="{ 'is-active': editor.isActive('strike') }"
          class="toolbar-btn"
          title="취소선"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 4H9a3 3 0 0 0-2.83 4"/>
            <path d="M14 12a4 4 0 0 1 0 8H6"/>
            <line x1="4" y1="12" x2="20" y2="12"/>
          </svg>
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <!-- 헤딩 그룹 -->
      <div class="toolbar-group">
        <button
          @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
          :class="{ 'is-active': editor.isActive('heading', { level: 1 }) }"
          class="toolbar-btn toolbar-btn--text"
          title="제목 1"
        >
          <span class="btn-text">H1</span>
        </button>
        
        <button
          @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
          :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }"
          class="toolbar-btn toolbar-btn--text"
          title="제목 2"
        >
          <span class="btn-text">H2</span>
        </button>
        
        <button
          @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
          :class="{ 'is-active': editor.isActive('heading', { level: 3 }) }"
          class="toolbar-btn toolbar-btn--text"
          title="제목 3"
        >
          <span class="btn-text">H3</span>
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <!-- 리스트 그룹 -->
      <div class="toolbar-group">
        <button
          @click="editor.chain().focus().toggleBulletList().run()"
          :class="{ 'is-active': editor.isActive('bulletList') }"
          class="toolbar-btn"
          title="글머리 기호"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="8" y1="6" x2="21" y2="6"/>
            <line x1="8" y1="12" x2="21" y2="12"/>
            <line x1="8" y1="18" x2="21" y2="18"/>
            <line x1="3" y1="6" x2="3.01" y2="6"/>
            <line x1="3" y1="12" x2="3.01" y2="12"/>
            <line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
        </button>
        
        <button
          @click="editor.chain().focus().toggleOrderedList().run()"
          :class="{ 'is-active': editor.isActive('orderedList') }"
          class="toolbar-btn"
          title="번호 매기기"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="10" y1="6" x2="21" y2="6"/>
            <line x1="10" y1="12" x2="21" y2="12"/>
            <line x1="10" y1="18" x2="21" y2="18"/>
            <path d="M4 6h1v4"/>
            <path d="M4 10h2"/>
            <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>
          </svg>
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <!-- 미디어 그룹 -->
      <div class="toolbar-group">
        <button
          @click="triggerImageUpload"
          class="toolbar-btn"
          title="이미지 추가"
          :disabled="isUploading"
        >
          <svg v-if="!isUploading" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="9" cy="9" r="2"/>
            <path d="M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="animate-spin">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
        </button>
        
        <input
          ref="imageInput"
          type="file"
          accept="image/*"
          multiple
          @change="handleImageUpload"
          @click.stop
          class="hidden-input"
        />
      </div>

      <div class="toolbar-divider"></div>

      <!-- 기타 그룹 -->
      <div class="toolbar-group">
        <button
          @click="editor.chain().focus().setHorizontalRule().run()"
          class="toolbar-btn"
          title="구분선"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"/>
          </svg>
        </button>
        
        <button
          @click="editor.chain().focus().undo().run()"
          :disabled="!editor.can().undo()"
          class="toolbar-btn"
          title="실행 취소"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 7v6h6"/>
            <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
          </svg>
        </button>
        
        <button
          @click="editor.chain().focus().redo().run()"
          :disabled="!editor.can().redo()"
          class="toolbar-btn"
          title="다시 실행"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 7v6h-6"/>
            <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- BubbleMenu - 텍스트 선택 시 나타나는 플로팅 메뉴 -->
    <BubbleMenu
      v-if="editor"
      :editor="editor"
      :tippy-options="{ duration: 100, placement: 'top' }"
      class="bubble-menu glass-card"
    >
      <div class="bubble-menu__content">
        <!-- 이미지가 선택된 경우 -->
        <template v-if="isImageSelected">
          <button
            @click="deleteSelectedImage"
            class="bubble-btn bubble-btn--danger glass-btn"
            title="이미지 삭제"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 6h18"/>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
              <line x1="10" y1="11" x2="10" y2="17"/>
              <line x1="14" y1="11" x2="14" y2="17"/>
            </svg>
          </button>
        </template>
        
        <!-- 텍스트가 선택된 경우 -->
        <template v-else>
          <button
            @click="editor.chain().focus().toggleBold().run()"
            :class="{ 'is-active': editor.isActive('bold') }"
            class="bubble-btn glass-btn"
            title="굵게"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8"/>
            </svg>
          </button>
          
          <button
            @click="editor.chain().focus().toggleItalic().run()"
            :class="{ 'is-active': editor.isActive('italic') }"
            class="bubble-btn glass-btn"
            title="기울임"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="19" y1="4" x2="10" y2="4"/>
              <line x1="14" y1="20" x2="5" y2="20"/>
              <line x1="15" y1="4" x2="9" y2="20"/>
            </svg>
          </button>
          
          <button
            @click="editor.chain().focus().toggleStrike().run()"
            :class="{ 'is-active': editor.isActive('strike') }"
            class="bubble-btn glass-btn"
            title="취소선"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M16 4H9a3 3 0 0 0-2.83 4"/>
              <path d="M14 12a4 4 0 0 1 0 8H6"/>
              <line x1="4" y1="12" x2="20" y2="12"/>
            </svg>
          </button>

          <div class="bubble-divider"></div>

          <button
            @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
            :class="{ 'is-active': editor.isActive('heading', { level: 1 }) }"
            class="bubble-btn bubble-btn--text glass-btn"
            title="제목 1"
          >
            <span class="btn-text">H1</span>
          </button>
          
          <button
            @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
            :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }"
            class="bubble-btn bubble-btn--text glass-btn"
            title="제목 2"
          >
            <span class="btn-text">H2</span>
          </button>
          
          <button
            @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
            :class="{ 'is-active': editor.isActive('heading', { level: 3 }) }"
            class="bubble-btn bubble-btn--text glass-btn"
            title="제목 3"
          >
            <span class="btn-text">H3</span>
          </button>
        </template>
      </div>
    </BubbleMenu>

    <!-- 에디터 영역 -->
    <div class="editor-wrapper">
      <editor-content 
        :editor="editor" 
        class="editor-content"
        @click="focusEditor"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, computed, nextTick } from 'vue'
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { PostService } from '@/services/post.service'
import { useNotificationStore } from '@/stores/notification'

// Props & Emits
const props = defineProps({
  initialContent: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: '여행 경험을 공유해주세요...'
  },
  maxLength: {
    type: Number,
    default: 10000
  }
})

const emit = defineEmits(['update:content'])

// State
const imageInput = ref(null)
const isUploading = ref(false)
const notificationStore = useNotificationStore()

// 이미지 선택 상태 확인
const isImageSelected = computed(() => {
  if (!editor.value) return false
  return editor.value.isActive('image')
})

// TipTap Editor 설정
const editor = useEditor({
  content: props.initialContent,
  extensions: [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3]
      }
    }),
    Image.configure({
      HTMLAttributes: {
        class: 'editor-image'
      },
      allowBase64: false
    }),
    Placeholder.configure({
      placeholder: props.placeholder
    })
  ],
  editorProps: {
    attributes: {
      class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[300px] p-4'
    },
    // 키보드 이벤트 처리
    handleKeyDown: (view, event) => {
      // Delete 또는 Backspace 키로 이미지 삭제
      if (event.key === 'Delete' || event.key === 'Backspace') {
        const { selection } = view.state
        const node = view.state.doc.nodeAt(selection.from)
        
        if (node && node.type.name === 'image') {
          event.preventDefault()
          deleteImageByUrl(node.attrs.src)
          return true
        }
      }
      return false
    }
  },
  onUpdate: ({ editor }) => {
    emit('update:content', editor.getHTML())
    // 이미지에 호버 이벤트 및 삭제 버튼 추가
    nextTick(() => {
      addImageDeleteButtons()
    })
  },
  onCreate: ({ editor }) => {
    // 에디터 생성 시 이미지 삭제 버튼 추가
    nextTick(() => {
      addImageDeleteButtons()
    })
  }
})

// Methods
const focusEditor = () => {
  editor.value?.commands.focus()
}

const triggerImageUpload = (event) => {
  event.preventDefault()
  event.stopPropagation()
  imageInput.value?.click()
}

// 선택된 이미지 삭제 (BubbleMenu에서)
const deleteSelectedImage = async () => {
  
  if (!editor.value || !isImageSelected.value) return
  
  const { selection } = editor.value.state
  const node = editor.value.state.doc.nodeAt(selection.from)
  
  if (node && node.type.name === 'image') {
    await deleteImageByUrl(node.attrs.src)
  }
}

// URL로 이미지 삭제
const deleteImageByUrl = async (imageUrl) => {
  if (!imageUrl) return
  
  try {
    // 서버에서 이미지 삭제
    await PostService.deleteImage(imageUrl)
    
    // 에디터에서 이미지 제거
    const { state } = editor.value
    const { doc } = state
    
    // 해당 이미지 노드를 찾아서 삭제
    doc.descendants((node, pos) => {
      if (node.type.name === 'image' && node.attrs.src === imageUrl) {
        const transaction = state.tr.delete(pos, pos + node.nodeSize)
        editor.value.view.dispatch(transaction)
        return false // 첫 번째 매칭 노드만 삭제
      }
    })
    
    notificationStore.showSuccess('이미지가 삭제되었습니다.')
  } catch (error) {
    console.error('이미지 삭제 실패:', error)
    notificationStore.showError('이미지 삭제에 실패했습니다.')
  }
}

// 이미지에 삭제 버튼 추가
const addImageDeleteButtons = () => {
  const editorElement = document.querySelector('.editor-content .ProseMirror')
  if (!editorElement) return
  
  // 기존 삭제 버튼 제거
  editorElement.querySelectorAll('.image-delete-btn').forEach(btn => btn.remove())
  
  // 모든 에디터 이미지에 삭제 버튼 추가
  const images = editorElement.querySelectorAll('.editor-image')
  
  images.forEach(img => {
    // 이미지 컨테이너 생성
    if (!img.parentElement.classList.contains('image-container')) {
      const container = document.createElement('div')
      container.className = 'image-container'
      img.parentNode.insertBefore(container, img)
      container.appendChild(img)
      
      // 삭제 버튼 생성
      const deleteBtn = document.createElement('button')
      deleteBtn.className = 'image-delete-btn'
      deleteBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `
      deleteBtn.title = '이미지 삭제'
      
      // 삭제 버튼 클릭 이벤트
      deleteBtn.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        deleteImageByUrl(img.src)
      })
      
      container.appendChild(deleteBtn)
    }
  })
}

const handleImageUpload = async (event) => {
  event.stopPropagation()
  const files = Array.from(event.target.files || [])
  if (!files.length) return

  // 최대 5개 파일 제한
  if (files.length > 5) {
    notificationStore.showWarning('최대 5개의 이미지만 동시에 업로드할 수 있습니다.')
    return
  }

  // 모든 파일이 이미지인지 확인
  const invalidFiles = files.filter(file => !file.type.startsWith('image/'))
  if (invalidFiles.length > 0) {
    notificationStore.showError('이미지 파일만 업로드할 수 있습니다.')
    return
  }

  // 파일 크기 확인 (각각 5MB 제한)
  const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024)
  if (oversizedFiles.length > 0) {
    notificationStore.showError('각 파일의 크기는 5MB 이하여야 합니다.')
    return
  }

  try {
    isUploading.value = true
    
    // 업로드 시작 알림
    notificationStore.showInfo(`${files.length}개의 이미지를 업로드하고 있습니다...`, { duration: 2000 })
    
    // 모든 파일을 병렬로 업로드
    const uploadPromises = files.map(async (file, index) => {
      try {
        console.log(`이미지 ${index + 1} 업로드 시작:`, file.name)
        
        const imageUrl = await PostService.uploadImage(file)
        
        if (!imageUrl) {
          throw new Error(`${file.name} 업로드에 실패했습니다.`)
        }
        
        console.log(`이미지 ${index + 1} 업로드 완료:`, imageUrl)
        
        return {
          url: imageUrl,
          name: file.name,
          index: index
        }
      } catch (error) {
        console.error(`이미지 ${index + 1} 업로드 실패:`, error)
        throw new Error(`${file.name}: ${error.message}`)
      }
    })
    
    // 모든 업로드 완료 대기
    const uploadResults = await Promise.allSettled(uploadPromises)
    
    // 성공한 이미지들을 에디터에 순차적으로 삽입
    const successfulUploads = []
    const failedUploads = []
    
    uploadResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successfulUploads.push(result.value)
      } else {
        failedUploads.push({
          name: files[index].name,
          error: result.reason.message
        })
      }
    })
    
    // 성공한 이미지들을 에디터에 삽입 (순서 보장)
    if (successfulUploads.length > 0) {
      // 업로드 순서대로 정렬
      successfulUploads.sort((a, b) => a.index - b.index)
      
      // 모든 이미지를 한 번에 HTML로 구성해서 삽입
      let imagesToInsert = ''
      
      successfulUploads.forEach((upload, index) => {
        imagesToInsert += `<img src="${upload.url}" alt="${upload.name}" title="${upload.name}" class="editor-image" style="display: block; margin: 16px 0;" />`
        // 마지막 이미지가 아니면 줄바꿈 추가
        if (index < successfulUploads.length - 1) {
          imagesToInsert += '<p><br></p>'
        }
      })
      
      console.log('삽입할 HTML:', imagesToInsert) // 디버깅용
      
      // 현재 커서 위치에 모든 이미지를 한 번에 삽입
      editor.value
        .chain()
        .focus()
        .insertContent(imagesToInsert)
        .run()
      
      console.log(`${successfulUploads.length}개 이미지 에디터에 삽입 완료`)
      
      // 성공 알림
      if (successfulUploads.length === files.length) {
        notificationStore.showSuccess(`${successfulUploads.length}개의 이미지가 모두 업로드되었습니다.`)
      } else {
        notificationStore.showSuccess(`${successfulUploads.length}개의 이미지가 업로드되었습니다.`)
      }
    }
    
    // 실패한 이미지들에 대한 알림
    if (failedUploads.length > 0) {
      const failedNames = failedUploads.map(f => f.name).join(', ')
      notificationStore.showError(`업로드 실패: ${failedNames}`)
      console.error('업로드 실패 상세:', failedUploads)
    }
    
  } catch (error) {
    console.error('이미지 업로드 전체 실패:', error)
    notificationStore.showError('이미지 업로드에 실패했습니다.')
  } finally {
    isUploading.value = false
    // 파일 입력 초기화
    if (imageInput.value) {
      imageInput.value.value = ''
    }
  }
}

// Lifecycle
onMounted(() => {
  focusEditor()
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})

// props.initialContent 변경 감지
watch(
  () => props.initialContent,
  (newContent) => {
    // 에디터가 존재하고, 현재 내용과 다를 때만 업데이트
    if (editor.value && newContent !== editor.value.getHTML()) {
      editor.value.commands.setContent(newContent, false)
      // 내용 변경 후 이미지 삭제 버튼 다시 추가
      nextTick(() => {
        addImageDeleteButtons()
      })
    }
  },
  { immediate: true }
)
</script>

<style lang="scss" scoped>
@use '@/assets/styles' as *;

.post-editor-container {
  width: 100%;
  max-width: 100%;
  margin: 0;
  padding: 0;
}

.editor-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: $spacing-xs;
  padding: $spacing-sm $spacing-md;
  background: white;
  border: 1px solid rgba($primary-color, 0.15);
  border-bottom: none;
  border-radius: 8px 8px 0 0;
  
  @media (max-width: $breakpoint-md) {
    gap: 2px;
    padding: $spacing-xs $spacing-sm;
  }
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
}

.toolbar-divider {
  width: 1px;
  height: 24px;
  background-color: rgba($primary-color, 0.2);
  margin: 0 $spacing-xs;
  
  @media (max-width: $breakpoint-md) {
    display: none;
  }
}

.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all $transition-fast;
  color: $primary-color;
  font-size: 11px;
  font-weight: $font-weight-medium;
  background: transparent;
  
  &:hover:not(:disabled) {
    background: rgba($accent-color, 0.1);
  }
  
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  
  &.is-active {
    background: rgba($accent-color, 0.15);
    color: $accent-color;
  }
  
  &--text {
    padding: 0 $spacing-xs;
    min-width: 32px;
    
    .btn-text {
      font-size: 10px;
      font-weight: $font-weight-bold;
      color: inherit;
      line-height: 1;
    }
  }
  
  svg {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
  }
  
  @media (max-width: $breakpoint-md) {
    min-width: 24px;
    height: 24px;
    
    svg {
      width: 12px;
      height: 12px;
    }
    
    &--text {
      min-width: 28px;
      
      .btn-text {
        font-size: 9px;
      }
    }
  }
}

/* BubbleMenu 스타일 */
.bubble-menu {
  padding: $spacing-xs;
  border-radius: 10px;
  box-shadow: $shadow-lg;
  z-index: $z-index-popover;
  
  &__content {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
  }
}

.bubble-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all $transition-fast;
  color: $primary-color;
  font-size: 11px;
  font-weight: $font-weight-medium;
  background: transparent;
  
  &:hover:not(:disabled) {
    background: rgba($accent-color, 0.1);
    transform: scale(1.05);
  }
  
  &.is-active {
    background: rgba($accent-color, 0.85);
    color: white;
    
    &:hover {
      background: rgba($accent-color, 0.95);
    }
  }
  
  &--text {
    padding: 0 $spacing-xs;
    min-width: 32px;
    
    .btn-text {
      font-size: 10px;
      font-weight: $font-weight-bold;
      color: inherit;
      line-height: 1;
    }
  }
  
  &--danger {
    color: $error-color;
    
    &:hover {
      background: rgba($error-color, 0.1);
      color: $error-color;
    }
  }
  
  svg {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
  }
}

.bubble-divider {
  width: 1px;
  height: 20px;
  background-color: rgba($primary-color, 0.2);
  margin: 0 $spacing-xs;
}

.hidden-input {
  display: none;
}

.editor-wrapper {
  min-height: 600px;
  background: white;
  border: 1px solid rgba($primary-color, 0.15);
  border-radius: 0 0 8px 8px;
  
  @media (max-width: $breakpoint-md) {
    min-height: 500px;
  }
}

.editor-content {
  min-height: 580px;
  outline: none;
  
  :deep(.ProseMirror) {
    outline: none;
    padding: $spacing-xl;
    min-height: 580px;
    color: $primary-color;
    line-height: 1.7;
    
    &:focus {
      outline: none;
    }
    
    // 플레이스홀더 스타일
    .is-editor-empty:first-child::before {
      content: attr(data-placeholder);
      float: left;
      color: $dark-gray;
      pointer-events: none;
      height: 0;
    }
    
    // 헤딩 스타일
    h1, h2, h3 {
      color: $primary-color;
      font-weight: $font-weight-bold;
      margin: $spacing-lg 0 $spacing-md 0;
      line-height: 1.3;
    }
    
    h1 {
      font-size: 2rem;
      border-bottom: 2px solid $light-gray;
      padding-bottom: $spacing-sm;
    }
    
    h2 {
      font-size: 1.5rem;
    }
    
    h3 {
      font-size: 1.25rem;
    }
    
    // 문단 스타일
    p {
      margin: $spacing-md 0;
      
      &:first-child {
        margin-top: 0;
      }
      
      &:last-child {
        margin-bottom: 0;
      }
    }
    
    // 리스트 스타일
    ul, ol {
      margin: $spacing-md 0;
      padding-left: $spacing-xl;
      
      li {
        margin: $spacing-xs 0;
        line-height: 1.6;
      }
    }
    
    ul {
      list-style-type: disc;
    }
    
    ol {
      list-style-type: decimal;
    }
    
    // 이미지 컨테이너 스타일
    .image-container {
      position: relative;
      display: inline-block;
      margin: $spacing-md 0;
      width: 100%;
      
      &:hover .image-delete-btn {
        opacity: 1;
      }
    }
    
    // 이미지 스타일
    .editor-image {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      box-shadow: $shadow-md;
      cursor: pointer;
      transition: all $transition-normal;
      display: block;
      
      &:hover {
        transform: scale(1.02);
        box-shadow: $shadow-lg;
      }
      
      // 이미지 로딩 상태
      &[src=""] {
        background: $light-gray;
        min-height: 100px;
        display: flex;
        align-items: center;
        justify-content: center;
        
        &::after {
          content: "이미지 로딩 중...";
          color: $dark-gray;
          font-size: 0.875rem;
        }
      }
      
      // 이미지 로드 실패 스타일
      &[alt]:after {
        content: "";
      }
    }
    
    // 이미지 로드 실패 시 대체 스타일
    img.editor-image {
      &:not([src]),
      &[src=""],
      &[src="#"] {
        background: $light-gray;
        min-height: 100px;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        
        &::before {
          content: "🖼️";
          font-size: 2rem;
          color: $dark-gray;
        }
      }
    }
    
    // 구분선 스타일
    hr {
      border: none;
      border-top: 2px solid $light-gray;
      margin: $spacing-xl 0;
    }
    
    // 강조 스타일
    strong {
      font-weight: $font-weight-bold;
      color: $primary-color;
    }
    
    em {
      font-style: italic;
    }
    
    s {
      text-decoration: line-through;
      opacity: 0.7;
    }
    
    @media (max-width: $breakpoint-md) {
      padding: $spacing-lg;
      min-height: 480px;
      
      h1 {
        font-size: 1.75rem;
      }
      
      h2 {
        font-size: 1.5rem;
      }
      
      h3 {
        font-size: 1.25rem;
      }
    }
  }
}

// 이미지 삭제 버튼 스타일 (전역 스타일로 적용)
:deep(.image-delete-btn) {
  position: absolute;
  top: 8px;
  left: 8px;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 50%;
  background: rgba($error-color, 0.9);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all $transition-fast;
  z-index: 10;
  box-shadow: $shadow-md;
  
  &:hover {
    background: $error-color;
    transform: scale(1.1);
    box-shadow: $shadow-lg;
  }
  
  svg {
    width: 12px;
    height: 12px;
  }
  
  @media (max-width: $breakpoint-md) {
    opacity: 1; // 모바일에서는 항상 표시
    width: 28px;
    height: 28px;
    
    svg {
      width: 14px;
      height: 14px;
    }
  }
}

// 애니메이션
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// 접근성
.toolbar-btn:focus,
.bubble-btn:focus {
  outline: 2px solid $accent-color;
  outline-offset: 2px;
}

.editor-content:focus-within {
  outline: 2px solid $accent-color;
  outline-offset: -2px;
}
</style>
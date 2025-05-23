// stores/board.js
import { defineStore } from "pinia";
import { ref } from "vue";
import BoardService from "@/services/board.service";

export const useBoardStore = defineStore("board", () => {
  // 상태 관리
  const boards = ref([]);
  const isLoading = ref(false);
  const error = ref(null);

  /**
   * 게시판 종류 전체 조회
   */
  const fetchBoards = async () => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await BoardService.getBoards();
      boards.value = response.data || [];
    } catch (err) {
      error.value =
        err.message || "게시판 목록을 불러오는 중 오류가 발생했습니다.";
    } finally {
      isLoading.value = false;
    }
  };

  return {
    // 상태
    boards,
    isLoading,
    error,

    // 액션
    fetchBoards,
  };
});

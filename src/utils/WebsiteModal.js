// src/utils/WebsiteModal.js

/**
 * 웹사이트 미리보기 모달 클래스
 */
export class WebsiteModal {
  constructor() {
    this.modal = null;
    this.isInitialized = false;
    this.setupGlobalFunctions();
  }

  /**
   * 전역 함수 설정
   */
  setupGlobalFunctions() {
    window.kakaoMapService_openWebsite = (url, placeName) => {
      this.openModal(url, placeName);
    };
  }

  /**
   * 모달 초기화
   */
  initialize() {
    if (this.isInitialized) return;

    this.createModal();
    this.addStyles();
    this.setupEvents();
    this.isInitialized = true;
  }

  /**
   * 모달 HTML 생성
   */
  createModal() {
    // 기존 모달이 있으면 제거
    if (this.modal) {
      document.body.removeChild(this.modal);
    }

    this.modal = document.createElement("div");
    this.modal.className = "website-modal-overlay";
    this.modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(5px);
      -webkit-backdrop-filter: blur(5px);
      z-index: 10000;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 20px;
      box-sizing: border-box;
    `;

    this.modal.innerHTML = this.getModalHTML();
    document.body.appendChild(this.modal);
  }

  /**
   * 모달 HTML 구조
   */
  getModalHTML() {
    return `
      <div class="website-modal-content" style="
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(15px);
        -webkit-backdrop-filter: blur(15px);
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 16px;
        width: 90%;
        max-width: 1200px;
        height: 85%;
        max-height: 800px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        position: relative;
      ">
        ${this.getModalHeader()}
        ${this.getModalBody()}
      </div>
    `;
  }

  /**
   * 모달 헤더 HTML
   */
  getModalHeader() {
    return `
      <div class="modal-header" style="
        padding: 20px 24px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: rgba(255, 255, 255, 0.8);
      ">
        <div class="modal-title" style="
          font-size: 18px;
          font-weight: 600;
          color: #2d3748;
          margin-right: auto;
        "></div>
        <button class="modal-close-btn" style="
          background: rgba(239, 68, 68, 0.1);
          border: none;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #ef4444;
          font-size: 18px;
          font-weight: bold;
          transition: all 0.2s ease;
        ">×</button>
      </div>
    `;
  }

  /**
   * 모달 바디 HTML
   */
  getModalBody() {
    return `
      <div class="modal-body" style="
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      ">
        <div class="loading-indicator" style="
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          font-size: 16px;
          color: #718096;
        ">
          <div class="loading-spinner" style="
            width: 40px;
            height: 40px;
            border: 3px solid #e2e8f0;
            border-top: 3px solid #0064FF;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-right: 12px;
          "></div>
          웹사이트를 불러오는 중...
        </div>
        
        <iframe class="website-iframe" style="
          width: 100%;
          height: 100%;
          border: none;
          border-radius: 0 0 16px 16px;
          display: none;
        "></iframe>
        
        <div class="error-message" style="
          display: none;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          padding: 40px;
          text-align: center;
        ">
          <div style="font-size: 48px; margin-bottom: 16px;">🚫</div>
          <div style="font-size: 18px; font-weight: 600; color: #2d3748; margin-bottom: 8px;">
            웹사이트를 불러올 수 없습니다
          </div>
          <div style="font-size: 14px; color: #718096; margin-bottom: 20px;">
            이 웹사이트는 보안 정책으로 인해 미리보기가 제한됩니다.
          </div>
          <button class="open-new-tab-btn" style="
            background: linear-gradient(135deg, #0064FF, #0051CC);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 0 4px 12px rgba(0, 100, 255, 0.3);
          ">새 탭에서 열기 →</button>
        </div>
      </div>
    `;
  }

  /**
   * CSS 스타일 추가
   */
  addStyles() {
    if (!document.getElementById("website-modal-styles")) {
      const style = document.createElement("style");
      style.id = "website-modal-styles";
      style.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .website-modal-overlay {
          animation: modalFadeIn 0.3s ease-out;
        }
        
        @keyframes modalFadeIn {
          from {
            opacity: 0;
            backdrop-filter: blur(0px);
          }
          to {
            opacity: 1;
            backdrop-filter: blur(5px);
          }
        }
        
        .website-modal-content {
          animation: modalSlideIn 0.3s ease-out;
        }
        
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .modal-close-btn:hover {
          background: rgba(239, 68, 68, 0.2) !important;
        }

        .open-new-tab-btn:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 6px 20px rgba(0, 100, 255, 0.4) !important;
        }
      `;
      document.head.appendChild(style);
    }
  }

  /**
   * 이벤트 리스너 설정
   */
  setupEvents() {
    if (!this.modal) return;

    // 닫기 버튼
    const closeBtn = this.modal.querySelector(".modal-close-btn");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => this.closeModal());
    }

    // 배경 클릭 시 닫기
    this.modal.addEventListener("click", (e) => {
      if (e.target === this.modal) {
        this.closeModal();
      }
    });

    // ESC 키로 닫기
    document.addEventListener("keydown", (e) => {
      if (
        e.key === "Escape" &&
        this.modal &&
        this.modal.style.display === "flex"
      ) {
        this.closeModal();
      }
    });
  }

  /**
   * 모달 열기
   */
  openModal(url, placeName) {
    if (!this.isInitialized) {
      this.initialize();
    }

    const iframe = this.modal.querySelector(".website-iframe");
    const loadingIndicator = this.modal.querySelector(".loading-indicator");
    const errorMessage = this.modal.querySelector(".error-message");
    const modalTitle = this.modal.querySelector(".modal-title");
    const newTabBtn = this.modal.querySelector(".open-new-tab-btn");

    // 초기화
    iframe.style.display = "none";
    loadingIndicator.style.display = "flex";
    errorMessage.style.display = "none";
    modalTitle.textContent = placeName;
    iframe.src = "";

    // 모달 표시
    this.modal.style.display = "flex";

    // iframe 로드 이벤트
    const onLoad = () => {
      loadingIndicator.style.display = "none";
      iframe.style.display = "block";
    };

    const onError = () => {
      loadingIndicator.style.display = "none";
      errorMessage.style.display = "flex";

      // 새 탭에서 열기 버튼 이벤트
      newTabBtn.onclick = () => {
        window.open(url, "_blank");
        this.closeModal();
      };
    };

    iframe.onload = onLoad;
    iframe.onerror = onError;

    // 타이머로 로딩 실패 감지 (10초)
    const timeoutId = setTimeout(() => {
      if (loadingIndicator.style.display !== "none") {
        onError();
      }
    }, 10000);

    // iframe src 설정
    try {
      iframe.src = url;
    } catch (error) {
      onError();
    }

    // 성공적으로 로드되면 타이머 클리어
    iframe.addEventListener(
      "load",
      () => {
        clearTimeout(timeoutId);
      },
      { once: true }
    );
  }

  /**
   * 모달 닫기
   */
  closeModal() {
    if (this.modal) {
      this.modal.style.display = "none";

      // iframe 정리
      const iframe = this.modal.querySelector(".website-iframe");
      if (iframe) {
        iframe.src = "";
      }
    }
  }

  /**
   * 정리
   */
  destroy() {
    if (this.modal && this.modal.parentNode) {
      this.modal.parentNode.removeChild(this.modal);
    }

    // 전역 함수 정리
    if (window.kakaoMapService_openWebsite) {
      delete window.kakaoMapService_openWebsite;
    }

    this.modal = null;
    this.isInitialized = false;
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
const websiteModal = new WebsiteModal();
export default websiteModal;

import { SELECTORS } from '../constants/selectors';

export const UIUtil = {
  /**
   * 상태 메시지와 진행 상태 업데이트
   */
  updateStatus(message, progress = null) {
    const status = document.querySelector(SELECTORS.STATUS.STATUS_MESSAGE);
    const progressBar = document.querySelector(SELECTORS.STATUS.PROGRESS_BAR);
    
    if (status) status.textContent = message;
    if (progressBar && progress !== null) {
      progressBar.style.width = `${progress}%`;
    }
  },

  /**
   * API 상태 메시지 업데이트
   */
  updateApiStatus(message, type) {
    const apiStatus = document.querySelector(SELECTORS.STATUS.API_STATUS);
    if (!apiStatus) return;

    apiStatus.textContent = message;
    apiStatus.className = `status-message ${type}`;
  },

  /**
   * 폼 표시/숨김 처리
   */
  showForm(formId) {
    Object.values(SELECTORS.FORMS).forEach(selector => {
      const form = document.querySelector(selector);
      if (form) {
        form.style.display = selector === formId ? 'block' : 'none';
      }
    });
  },

  /**
   * 크롤링 데이터 표시
   */
  displayCrawledData(data) {
    const dataForm = document.querySelector(SELECTORS.FORMS.CRAWLED_DATA);
    if (!dataForm) return;

    dataForm.style.display = 'block';

    // 기본 정보 설정
    this.setInputValue(SELECTORS.INPUTS.PRODUCT_TITLE, data.title);
    this.setInputValue(SELECTORS.INPUTS.PRODUCT_PRICE, data.price);
    this.setInputValue(SELECTORS.INPUTS.PRODUCT_STOCK, data.stockQuantity || 999);
    this.setInputValue(SELECTORS.INPUTS.PRODUCT_ORIGIN, data.origin || '수입산');

    // 이미지 목록 표시
    this.displayImages(data.images);

    // 옵션 목록 표시
    this.displayOptions(data.options);
  },

  /**
   * 이미지 목록 표시
   */
  displayImages(images) {
    const container = document.querySelector(SELECTORS.LISTS.PRODUCT_IMAGES);
    if (!container) return;

    container.innerHTML = '';
    images.forEach((imgUrl, index) => {
      const div = document.createElement('div');
      div.className = 'image-item';
      div.innerHTML = `
        <input type="text" class="form-control form-control-sm" 
               value="${imgUrl}" data-index="${index}" />
        ${index === 0 ? '(대표이미지)' : ''}
      `;
      container.appendChild(div);
    });
  },

  /**
   * 옵션 목록 표시
   */
  displayOptions(options) {
    const container = document.querySelector(SELECTORS.LISTS.PRODUCT_OPTIONS);
    if (!container) return;

    container.innerHTML = '';
    options.forEach((option, index) => {
      const div = document.createElement('div');
      div.className = 'option-item';
      div.innerHTML = `
        <div class="option-content">
          <input type="text" class="form-control form-control-sm" 
                 value="${option.name}" readonly />
          <input type="number" class="form-control form-control-sm" 
                 value="${option.stockQuantity || 999}" min="0" readonly />
        </div>
      `;
      container.appendChild(div);
    });
  },

  /**
   * input 값 설정 헬퍼 함수
   */
  setInputValue(selector, value) {
    const input = document.querySelector(selector);
    if (input) input.value = value;
  },

  /**
   * 크롤링 폼 초기화
   */
  resetCrawlingForm() {
    this.setInputValue(SELECTORS.INPUTS.PRODUCT_URL, '');
    document.querySelector(SELECTORS.FORMS.CRAWLED_DATA).style.display = 'none';
    this.setInputValue(SELECTORS.INPUTS.PRODUCT_TITLE, '');
    this.setInputValue(SELECTORS.INPUTS.PRODUCT_PRICE, '');
    this.setInputValue(SELECTORS.INPUTS.PRODUCT_STOCK, '999');
    this.setInputValue(SELECTORS.INPUTS.PRODUCT_ORIGIN, '');
    
    const imagesContainer = document.querySelector(SELECTORS.LISTS.PRODUCT_IMAGES);
    const optionsContainer = document.querySelector(SELECTORS.LISTS.PRODUCT_OPTIONS);
    
    if (imagesContainer) imagesContainer.innerHTML = '';
    if (optionsContainer) optionsContainer.innerHTML = '';
    
    this.updateStatus('Ready for next product', 0);
  }
};
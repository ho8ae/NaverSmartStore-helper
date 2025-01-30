import { SELECTORS } from '../constants/selectors';
import { PRODUCT } from '../constants/product';
import { ParserUtil } from '../utils/parser';

export const CrawlerService = {
  /**
   * 페이지 데이터 크롤링
   */
  crawlPageData() {
    try {
      const selectors = SELECTORS.PRODUCT;
      
      // 기본 상품 정보 추출
      const productInfo = {
        title: this.getElementText(selectors.TITLE),
        price: this.getPrice(selectors.PRICE),
        description: this.getElementHtml(selectors.DESCRIPTION),
        images: this.getImages(selectors.IMAGES),
        origin: this.getElementText(selectors.ORIGIN) || PRODUCT.DEFAULTS.ORIGIN,
        options: this.getOptions(selectors.OPTIONS)
      };

      console.log('Crawled product info:', productInfo);
      return productInfo;
    } catch (error) {
      console.error('Crawling error:', error);
      return null;
    }
  },

  /**
   * 요소 텍스트 가져오기
   */
  getElementText(selector) {
    const element = document.querySelector(selector);
    return element?.textContent?.trim();
  },

  /**
   * 요소 HTML 가져오기
   */
  getElementHtml(selector) {
    const element = document.querySelector(selector);
    return element?.innerHTML;
  },

  /**
   * 가격 정보 추출
   */
  getPrice(selector) {
    const priceText = this.getElementText(selector);
    return ParserUtil.parsePrice(priceText);
  },

  /**
   * 이미지 URL 목록 추출
   */
  getImages(selector) {
    const images = document.querySelectorAll(selector);
    return Array.from(images).map(img => img.src);
  },

  /**
   * 상품 옵션 추출
   */
  getOptions(selector) {
    const options = [];
    const optionElements = document.querySelectorAll(selector);
    
    optionElements.forEach(element => {
      const optionText = element.textContent;
      if (!optionText.includes('판매종료')) {
        const name = optionText.split('(')[0].trim();
        options.push({
          name,
          stockQuantity: PRODUCT.DEFAULTS.STOCK
        });
      }
    });

    return options;
  },

  /**
   * 상품 상세 설명 정리
   */
  cleanDescription(description) {
    if (!description) return '';
    
    // 불필요한 스크립트 제거
    description = description.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // 외부 리소스 경로 정리
    description = description.replace(/(src|href)=["'](?!http|\/\/)(.*?)["']/g, '$1="$2"');
    
    return description.trim();
  }
};
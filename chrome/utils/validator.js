import { MESSAGES } from '../constants/messages';

export const ValidatorUtil = {
  /**
   * 이메일 유효성 검사
   */
  validateEmail(email) {
    if (!email) {
      throw new Error(MESSAGES.VALIDATION.REQUIRED_EMAIL);
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error(MESSAGES.VALIDATION.INVALID_EMAIL);
    }
    return true;
  },

  /**
   * 비밀번호 유효성 검사
   */
  validatePassword(password) {
    if (!password) {
      throw new Error(MESSAGES.VALIDATION.REQUIRED_PASSWORD);
    }
    if (password.length < 6) {
      throw new Error(MESSAGES.VALIDATION.INVALID_PASSWORD);
    }
    return true;
  },

  /**
   * API 키 유효성 검사
   */
  validateApiKeys(apiKey, secretKey) {
    if (!apiKey) {
      throw new Error(MESSAGES.VALIDATION.REQUIRED_API_KEY);
    }
    if (!secretKey) {
      throw new Error(MESSAGES.VALIDATION.REQUIRED_SECRET_KEY);
    }
    return true;
  },

  /**
   * 크롤링된 데이터 유효성 검사
   */
  validateCrawledData(data) {
    if (!data) {
      throw new Error('Invalid crawled data');
    }
    if (!data.title) {
      throw new Error('Product title is required');
    }
    if (!data.price) {
      throw new Error('Product price is required');
    }
    if (!data.images || data.images.length === 0) {
      throw new Error('Product images are required');
    }
    return true;
  },

  /**
   * 이미지 URL 유효성 검사
   */
  validateImageUrl(url) {
    if (!url) return false;
    return url.match(/\.(jpg|jpeg|png|gif)$/i) !== null;
  }
};
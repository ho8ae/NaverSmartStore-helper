import { STORAGE_KEYS } from '../constants/storage-keys.js';

export const StorageUtil = {
  /**
   * Chrome Storage에 데이터 저장
   */
  async set(key, value) {
    try {
      await chrome.storage.local.set({ [key]: value });
      return true;
    } catch (error) {
      console.error('Storage set error:', error);
      return false;
    }
  },

  /**
   * Chrome Storage에서 데이터 조회
   */
  async get(key) {
    try {
      const data = await chrome.storage.local.get([key]);
      return data[key];
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  },

  /**
   * Chrome Storage에서 데이터 삭제
   */
  async remove(key) {
    try {
      await chrome.storage.local.remove(key);
      return true;
    } catch (error) {
      console.error('Storage remove error:', error);
      return false;
    }
  },

  /**
   * Chrome Storage 초기화
   */
  async clear() {
    try {
      await chrome.storage.local.clear();
      return true;
    } catch (error) {
      console.error('Storage clear error:', error);
      return false;
    }
  },

  // Auth related storage methods
  async getToken() {
    return this.get(STORAGE_KEYS.AUTH.TOKEN);
  },

  async setToken(token) {
    return this.set(STORAGE_KEYS.AUTH.TOKEN, token);
  },

  async getUser() {
    return this.get(STORAGE_KEYS.AUTH.USER);
  },

  async setUser(user) {
    return this.set(STORAGE_KEYS.AUTH.USER, user);
  },

  // API related storage methods
  async getApiKeys() {
    const apiKey = await this.get(STORAGE_KEYS.API.API_KEY);
    const secretKey = await this.get(STORAGE_KEYS.API.SECRET_KEY);
    return { apiKey, secretKey };
  },

  async setApiKeys(apiKey, secretKey) {
    await this.set(STORAGE_KEYS.API.API_KEY, apiKey);
    await this.set(STORAGE_KEYS.API.SECRET_KEY, secretKey);
  },

  // Product related storage methods
  async getCrawledData() {
    return this.get(STORAGE_KEYS.PRODUCT.CRAWLED_DATA);
  },

  async setCrawledData(data) {
    return this.set(STORAGE_KEYS.PRODUCT.CRAWLED_DATA, data);
  },

  async getLastCrawledUrl() {
    return this.get(STORAGE_KEYS.PRODUCT.LAST_CRAWLED_URL);
  },

  async setLastCrawledUrl(url) {
    return this.set(STORAGE_KEYS.PRODUCT.LAST_CRAWLED_URL, url);
  }
};
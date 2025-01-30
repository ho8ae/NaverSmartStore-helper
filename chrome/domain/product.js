import { API } from '../constants/api';
import { MESSAGES } from '../constants/messages';
import { StorageUtil } from '../utils/storage';
import { ParserUtil } from '../utils/parser';
import { ValidatorUtil } from '../utils/validator';

export const ProductService = {
  /**
   * 상품 크롤링 시작
   */
  async crawlProduct(url) {
    try {
      if (!ParserUtil.validateUrl(url)) {
        throw new Error(MESSAGES.ERROR.INVALID_URL);
      }

      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
      });

      // content script 실행
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });

      // 크롤링 요청
      const response = await new Promise((resolve) => {
        chrome.tabs.sendMessage(
          tab.id,
          { action: 'crawl', url },
          (response) => {
            if (chrome.runtime.lastError) {
              resolve({ success: false, message: MESSAGES.ERROR.CRAWLING_FAILED });
            } else {
              resolve(response);
            }
          }
        );
      });

      if (response.success) {
        const formattedData = ParserUtil.formatForSmartStore(response.data);
        await StorageUtil.setCrawledData(formattedData);
        await StorageUtil.setLastCrawledUrl(url);
        return { success: true, data: response.data };
      }

      throw new Error(response.message || MESSAGES.ERROR.CRAWLING_FAILED);
    } catch (error) {
      console.error('Crawling error:', error);
      return { success: false, message: error.message };
    }
  },

  /**
   * 스마트스토어에 상품 등록
   */
  async registerProduct() {
    try {
      const token = await StorageUtil.getToken();
      if (!token) throw new Error(MESSAGES.ERROR.NO_TOKEN);

      const crawledData = await StorageUtil.getCrawledData();
      if (!crawledData) throw new Error('No crawled data found');

      ValidatorUtil.validateCrawledData(crawledData);

      const response = await fetch(`${API.BASE_URL}${API.ENDPOINTS.PRODUCT.REGISTER}`, {
        method: 'POST',
        headers: {
          ...API.HEADERS.JSON,
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ productData: crawledData })
      });

      const data = await response.json();

      if (data.success) {
        return { success: true, data: data.data };
      }

      throw new Error(data.message || MESSAGES.ERROR.PRODUCT_REGISTER_FAILED);
    } catch (error) {
      console.error('Product registration error:', error);
      return { success: false, message: error.message };
    }
  },

  /**
   * 등록된 상품 목록 조회
   */
  async getProductList() {
    try {
      const token = await StorageUtil.getToken();
      if (!token) throw new Error(MESSAGES.ERROR.NO_TOKEN);

      const response = await fetch(`${API.BASE_URL}${API.ENDPOINTS.PRODUCT.LIST}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        return { success: true, data: data.data };
      }

      throw new Error(data.message || 'Failed to fetch product list');
    } catch (error) {
      console.error('Product list fetch error:', error);
      return { success: false, message: error.message };
    }
  },

  /**
   * 상품 정보 업데이트
   */
  async updateProduct(productId, updateData) {
    try {
      const token = await StorageUtil.getToken();
      if (!token) throw new Error(MESSAGES.ERROR.NO_TOKEN);

      const response = await fetch(`${API.BASE_URL}${API.ENDPOINTS.PRODUCT.UPDATE}/${productId}`, {
        method: 'PUT',
        headers: {
          ...API.HEADERS.JSON,
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      if (data.success) {
        return { success: true, data: data.data };
      }

      throw new Error(data.message || 'Failed to update product');
    } catch (error) {
      console.error('Product update error:', error);
      return { success: false, message: error.message };
    }
  }
};
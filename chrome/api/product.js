import { API } from '../constants/api';
import { MESSAGES } from '../constants/messages';

export const ProductAPI = {
  /**
   * 상품 등록 API 요청
   */
  async registerProduct(productData, token) {
    try {
      const response = await fetch(`${API.BASE_URL}${API.ENDPOINTS.PRODUCT.REGISTER}`, {
        method: 'POST',
        headers: {
          ...API.HEADERS.JSON,
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ productData })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || MESSAGES.ERROR.PRODUCT_REGISTER_FAILED);
      }

      return data;
    } catch (error) {
      console.error('Product Registration Error:', error);
      throw error;
    }
  },

  /**
   * 상품 목록 조회 API 요청
   */
  async getProducts(token, params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `${API.BASE_URL}${API.ENDPOINTS.PRODUCT.LIST}?${queryString}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch products');
      }

      return data;
    } catch (error) {
      console.error('Product List Fetch Error:', error);
      throw error;
    }
  },

  /**
   * 상품 정보 업데이트 API 요청
   */
  async updateProduct(productId, updateData, token) {
    try {
      const response = await fetch(`${API.BASE_URL}${API.ENDPOINTS.PRODUCT.UPDATE}/${productId}`, {
        method: 'PUT',
        headers: {
          ...API.HEADERS.JSON,
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update product');
      }

      return data;
    } catch (error) {
      console.error('Product Update Error:', error);
      throw error;
    }
  },

  /**
   * 상품 삭제 API 요청
   */
  async deleteProduct(productId, token) {
    try {
      const response = await fetch(`${API.BASE_URL}${API.ENDPOINTS.PRODUCT.DELETE}/${productId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete product');
      }

      return data;
    } catch (error) {
      console.error('Product Deletion Error:', error);
      throw error;
    }
  }
};
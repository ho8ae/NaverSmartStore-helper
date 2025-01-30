import { API } from '../constants/api';
import { MESSAGES } from '../constants/messages';

export const AuthAPI = {
  /**
   * 로그인 API 요청
   */
  async login(credentials) {
    try {
      const response = await fetch(`${API.BASE_URL}${API.ENDPOINTS.AUTH.LOGIN}`, {
        method: 'POST',
        headers: API.HEADERS.JSON,
        body: JSON.stringify(credentials)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || MESSAGES.ERROR.LOGIN_FAILED);
      }

      return data;
    } catch (error) {
      console.error('Login API Error:', error);
      throw error;
    }
  },

  /**
   * 회원가입 API 요청
   */
  async register(userData) {
    try {
      const response = await fetch(`${API.BASE_URL}${API.ENDPOINTS.AUTH.REGISTER}`, {
        method: 'POST',
        headers: API.HEADERS.JSON,
        body: JSON.stringify(userData)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || MESSAGES.ERROR.REGISTER_FAILED);
      }

      return data;
    } catch (error) {
      console.error('Register API Error:', error);
      throw error;
    }
  },

  /**
   * API 키 검증 요청
   */
  async verifyApiKeys(apiKeys, token) {
    try {
      const response = await fetch(`${API.BASE_URL}${API.ENDPOINTS.AUTH.VERIFY_API}`, {
        method: 'POST',
        headers: {
          ...API.HEADERS.JSON,
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(apiKeys)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || MESSAGES.ERROR.API_VERIFY_FAILED);
      }

      return data;
    } catch (error) {
      console.error('API Key Verification Error:', error);
      throw error;
    }
  },

  /**
   * 토큰 검증 요청
   */
  async verifyToken(token) {
    try {
      const response = await fetch(`${API.BASE_URL}${API.ENDPOINTS.AUTH.VERIFY}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || MESSAGES.ERROR.TOKEN_VERIFICATION_FAILED);
      }

      return data;
    } catch (error) {
      console.error('Token Verification Error:', error);
      throw error;
    }
  }
};
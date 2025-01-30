import { API } from '../constants/api';
import { MESSAGES } from '../constants/messages';
import { StorageUtil } from '../utils/storage';
import { ValidatorUtil } from '../utils/validator';

export const AuthService = {
  /**
   * 로그인 처리
   */
  async login(email, password) {
    try {
      ValidatorUtil.validateEmail(email);
      ValidatorUtil.validatePassword(password);

      const response = await fetch(`${API.BASE_URL}${API.ENDPOINTS.AUTH.LOGIN}`, {
        method: 'POST',
        headers: API.HEADERS.JSON,
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.success) {
        const { token, user } = data.data;
        await StorageUtil.setToken(token);
        await StorageUtil.setUser(user);
        await StorageUtil.set('isLoggedIn', true);

        return { success: true, data: data.data };
      }

      throw new Error(data.message || MESSAGES.ERROR.LOGIN_FAILED);
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: error.message };
    }
  },

  /**
   * 회원가입 처리
   */
  async register(email, password) {
    try {
      ValidatorUtil.validateEmail(email);
      ValidatorUtil.validatePassword(password);

      const response = await fetch(`${API.BASE_URL}${API.ENDPOINTS.AUTH.REGISTER}`, {
        method: 'POST',
        headers: API.HEADERS.JSON,
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.success) {
        return { success: true, data: data.data };
      }

      throw new Error(data.message || MESSAGES.ERROR.REGISTER_FAILED);
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, message: error.message };
    }
  },

  /**
   * API 키 검증
   */
  async verifyApiKeys(apiKey, secretKey) {
    try {
      ValidatorUtil.validateApiKeys(apiKey, secretKey);

      const token = await StorageUtil.getToken();
      if (!token) throw new Error(MESSAGES.ERROR.NO_TOKEN);

      const response = await fetch(`${API.BASE_URL}${API.ENDPOINTS.AUTH.VERIFY_API}`, {
        method: 'POST',
        headers: {
          ...API.HEADERS.JSON,
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ apiKey, secretKey })
      });

      const data = await response.json();

      if (data.success) {
        await StorageUtil.setApiKeys(apiKey, secretKey);
        return { success: true };
      }

      throw new Error(data.message || MESSAGES.ERROR.API_VERIFY_FAILED);
    } catch (error) {
      console.error('API verification error:', error);
      return { success: false, message: error.message };
    }
  },

  /**
   * 인증 상태 확인
   */
  async checkAuthStatus() {
    try {
      const token = await StorageUtil.getToken();
      if (!token) return false;

      const response = await fetch(`${API.BASE_URL}${API.ENDPOINTS.AUTH.VERIFY}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Auth check error:', error);
      return false;
    }
  },

  /**
   * 로그아웃
   */
  async logout() {
    try {
      await StorageUtil.clear();
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, message: error.message };
    }
  }
};
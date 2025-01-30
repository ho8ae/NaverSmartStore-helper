import { API } from '../constants/api';
import { MESSAGES } from '../constants/messages';

export class NaverAPI {
  constructor(apiKey, secretKey) {
    this.apiKey = apiKey;
    this.secretKey = secretKey;
    this.accessToken = null;
    this.tokenExpireTime = null;
  }

  /**
   * API 서명 생성
   */
  async generateSignature() {
    try {
      const timestamp = Date.now().toString();
      const message = `${this.apiKey}_${timestamp}`;
      
      // bcrypt 해싱
      const hashedMessage = window.bcrypt.hashSync(message, this.secretKey);
      
      // Base64 인코딩
      const signature = btoa(hashedMessage);
      
      return { signature, timestamp };
    } catch (error) {
      console.error('Signature Generation Error:', error);
      throw error;
    }
  }

  /**
   * 액세스 토큰 요청
   */
  async requestToken() {
    try {
      const { signature, timestamp } = await this.generateSignature();

      const params = new URLSearchParams({
        client_id: this.apiKey,
        timestamp: timestamp,
        client_secret_sign: signature,
        grant_type: 'client_credentials',
        type: 'SELF'
      });

      const response = await fetch(`${API.NAVER.API_URL}/${API.NAVER.API_VERSION}/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: params
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Token request failed');
      }

      this.accessToken = data.access_token;
      this.tokenExpireTime = Date.now() + (data.expires_in * 1000);

      return this.accessToken;
    } catch (error) {
      console.error('Token Request Error:', error);
      throw error;
    }
  }

  /**
   * 토큰 유효성 검사
   */
  isTokenValid() {
    return (
      this.accessToken &&
      this.tokenExpireTime &&
      Date.now() < this.tokenExpireTime
    );
  }

  /**
   * 액세스 토큰 가져오기 (필요시 갱신)
   */
  async getAccessToken() {
    if (!this.isTokenValid()) {
      await this.requestToken();
    }
    return this.accessToken;
  }

  /**
   * 스마트스토어 상품 등록
   */
  async registerProduct(productData) {
    try {
      const token = await this.getAccessToken();
      const response = await fetch(`${API.NAVER.API_URL}/${API.NAVER.API_VERSION}/products`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to register product to SmartStore');
      }

      return data;
    } catch (error) {
      console.error('SmartStore Product Registration Error:', error);
      throw error;
    }
  }

  /**
   * 스마트스토어 상품 수정
   */
  async updateProduct(productNo, updateData) {
    try {
      const token = await this.getAccessToken();
      const response = await fetch(`${API.NAVER.API_URL}/${API.NAVER.API_VERSION}/products/${productNo}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update product in SmartStore');
      }

      return data;
    } catch (error) {
      console.error('SmartStore Product Update Error:', error);
      throw error;
    }
  }
};
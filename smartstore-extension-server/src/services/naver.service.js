const axios = require('axios');
const CryptoUtil = require('../utils/crypto.util');

class NaverService {
    constructor() {
        this.apiUrl = process.env.NAVER_API_URL;
        this.apiVersion = process.env.NAVER_API_VERSION;
    }

    /**
     * Get access token from Naver API
     * @param {string} clientId - Client ID
     * @param {string} clientSecret - Client Secret
     * @returns {Promise<Object>} - Access token response
     */
    async getAccessToken(clientId, clientSecret) {
        try {
            const timestamp = Date.now().toString();
            const message = `${clientId}_${timestamp}`;
            const signature = await CryptoUtil.generateSignature(message, clientSecret);
            const encodedSignature = CryptoUtil.toBase64(signature);

            const response = await axios.post(
                `${this.apiUrl}/${this.apiVersion}/oauth2/token`,
                new URLSearchParams({
                    client_id: clientId,
                    timestamp: timestamp,
                    client_secret_sign: encodedSignature,
                    grant_type: 'client_credentials',
                    type: 'SELF'
                }).toString(),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    }
                }
            );

            return response.data;
        } catch (error) {
            console.error('Error getting access token:', error.response?.data || error.message);
            throw new Error(error.response?.data?.message || 'Failed to get access token');
        }
    }

    /**
     * Register product to Smartstore
     * @param {string} accessToken - Access token
     * @param {Object} productData - Product data
     * @returns {Promise<Object>} - API response
     */
    async registerProduct(accessToken, productData) {
        try {
            const response = await axios.post(
                `${this.apiUrl}/${this.apiVersion}/products`,
                productData,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return response.data;
        } catch (error) {
            console.error('Error registering product:', error.response?.data || error.message);
            throw new Error(error.response?.data?.message || 'Failed to register product');
        }
    }

    /**
     * Validate API credentials
     * @param {string} clientId - Client ID
     * @param {string} clientSecret - Client Secret
     * @returns {Promise<boolean>} - Validation result
     */
    async validateCredentials(clientId, clientSecret) {
        try {
            const response = await this.getAccessToken(clientId, clientSecret);
            return !!response.access_token;
        } catch (error) {
            console.error('Credential validation failed:', error.message);
            return false;
        }
    }
}

module.exports = new NaverService();
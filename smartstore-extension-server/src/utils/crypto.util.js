const bcrypt = require('bcrypt');

class CryptoUtil {
    /**
     * Generate signature for Naver API authentication
     * @param {string} message - Message to sign
     * @param {string} salt - Salt for bcrypt
     * @returns {string} - Generated signature
     */
    static async generateSignature(message, salt) {
        try {
            return await bcrypt.hash(message, salt);
        } catch (error) {
            console.error('Error generating signature:', error);
            throw new Error('Failed to generate signature');
        }
    }

    /**
     * Convert string to base64
     * @param {string} str - String to convert
     * @returns {string} - Base64 encoded string
     */
    static toBase64(str) {
        try {
            return Buffer.from(str).toString('base64');
        } catch (error) {
            console.error('Error converting to base64:', error);
            throw new Error('Failed to convert to base64');
        }
    }

    /**
     * Convert base64 to string
     * @param {string} base64Str - Base64 string to convert
     * @returns {string} - Decoded string
     */
    static fromBase64(base64Str) {
        try {
            return Buffer.from(base64Str, 'base64').toString();
        } catch (error) {
            console.error('Error converting from base64:', error);
            throw new Error('Failed to convert from base64');
        }
    }
}

module.exports = CryptoUtil;
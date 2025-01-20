const NaverService = require('../services/naver.service');

class AuthController {
    /**
     * Get access token
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getToken(req, res) {
        try {
            const { clientId, clientSecret } = req.body;

            if (!clientId || !clientSecret) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Client ID and Client Secret are required'
                });
            }

            const tokenData = await NaverService.getAccessToken(clientId, clientSecret);
            
            res.json({
                status: 'success',
                data: tokenData
            });
        } catch (error) {
            console.error('Token generation error:', error);
            res.status(500).json({
                status: 'error',
                message: error.message || 'Failed to generate token'
            });
        }
    }

    /**
     * Validate API credentials
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async validateCredentials(req, res) {
        try {
            const { clientId, clientSecret } = req.body;

            if (!clientId || !clientSecret) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Client ID and Client Secret are required'
                });
            }

            const isValid = await NaverService.validateCredentials(clientId, clientSecret);
            
            res.json({
                status: 'success',
                data: { isValid }
            });
        } catch (error) {
            console.error('Credential validation error:', error);
            res.status(500).json({
                status: 'error',
                message: error.message || 'Failed to validate credentials'
            });
        }
    }
}

module.exports = new AuthController();
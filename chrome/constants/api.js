export const API = {
    BASE_URL: 'http://localhost:3000/api',
    
    ENDPOINTS: {
      // Auth endpoints
      AUTH: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        VERIFY: '/auth/verify',
        VERIFY_API: '/auth/verify-api'
      },
      
      // Product endpoints
      PRODUCT: {
        REGISTER: '/products/register',
        UPDATE: '/products/update',
        LIST: '/products/list',
        DELETE: '/products/delete'
      }
    },
    
    // API Headers
    HEADERS: {
      JSON: {
        'Content-Type': 'application/json'
      }
    },
  
    // Response status
    STATUS: {
      SUCCESS: 'success',
      ERROR: 'error'
    },
  
    // Naver API
    NAVER: {
      API_URL: 'https://api.commerce.naver.com',
      API_VERSION: 'external/v1'
    }
  };
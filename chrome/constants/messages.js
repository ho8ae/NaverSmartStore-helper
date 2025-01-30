export const MESSAGES = {
    // Success messages
    SUCCESS: {
      LOGIN: 'Login successful!',
      REGISTER: 'Registration successful!',
      API_VERIFY: 'API keys verified successfully!',
      CRAWLING: 'Crawling completed!',
      PRODUCT_REGISTER: 'Product registered successfully!'
    },
  
    // Error messages
    ERROR: {
      LOGIN_FAILED: 'Login failed: ',
      REGISTER_FAILED: 'Registration failed: ',
      API_VERIFY_FAILED: 'API verification failed: ',
      CRAWLING_FAILED: 'Crawling failed: ',
      PRODUCT_REGISTER_FAILED: 'Product registration failed: ',
      INVALID_URL: 'Please enter a valid product URL',
      NO_TOKEN: 'No authentication token found',
      NETWORK_ERROR: 'Network error occurred',
      INVALID_RESPONSE: 'Invalid response from server'
    },
  
    // Status messages
    STATUS: {
      LOGGING_IN: 'Logging in...',
      REGISTERING: 'Signing up...',
      VERIFYING_API: 'Verifying API keys...',
      CRAWLING: 'Crawling product...',
      REGISTERING_PRODUCT: 'Registering product...',
      READY: 'Ready for next product'
    },
  
    // Validation messages
    VALIDATION: {
      REQUIRED_EMAIL: 'Email is required',
      REQUIRED_PASSWORD: 'Password is required',
      REQUIRED_API_KEY: 'API key is required',
      REQUIRED_SECRET_KEY: 'Secret key is required',
      INVALID_EMAIL: 'Please enter a valid email address',
      INVALID_PASSWORD: 'Password must be at least 6 characters long'
    }
  };
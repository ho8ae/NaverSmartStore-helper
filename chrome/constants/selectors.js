export const SELECTORS = {
    // Product information selectors
    PRODUCT: {
      TITLE: 'h1#lInfoItemTitle',
      PRICE: 'div.lItemPrice',
      DESCRIPTION: 'div#lInfoViewItemContents',
      IMAGES: 'img.mainThumb',
      OPTIONS: 'ul.pSelectUIMenu li:not(.pDisabled) button.pSelectUIBtn',
      ORIGIN: 'td.lInfoItemCountryContent'
    },
  
    // Form IDs
    FORMS: {
      LOGIN: '#loginForm',
      REGISTER: '#registerForm',
      API_SETTINGS: '#apiSettingsForm',
      CRAWLING: '#crawlingForm',
      CRAWLED_DATA: '#crawledDataForm'
    },
  
    // Input fields
    INPUTS: {
      EMAIL: '#email',
      PASSWORD: '#password',
      REG_EMAIL: '#regEmail',
      REG_PASSWORD: '#regPassword',
      API_KEY: '#apiKey',
      SECRET_KEY: '#secretKey',
      PRODUCT_URL: '#productUrl',
      PRODUCT_TITLE: '#productTitle',
      PRODUCT_PRICE: '#productPrice',
      PRODUCT_STOCK: '#productStock',
      PRODUCT_ORIGIN: '#productOrigin'
    },
  
    // Buttons
    BUTTONS: {
      LOGIN: '#loginButton',
      SIGNUP: '#signupButton',
      VERIFY_API: '#verifyApiButton',
      CRAWL: '#crawlButton',
      PRODUCT_REGISTER: '#productRegisterButton',
      SHOW_REGISTER: '#showRegister',
      SHOW_LOGIN: '#showLogin'
    },
  
    // Status elements
    STATUS: {
      PROGRESS_BAR: '.progress',
      STATUS_MESSAGE: '#status',
      API_STATUS: '#apiStatus'
    },
  
    // Lists
    LISTS: {
      PRODUCT_IMAGES: '#productImages',
      PRODUCT_OPTIONS: '#productOptions'
    }
  };
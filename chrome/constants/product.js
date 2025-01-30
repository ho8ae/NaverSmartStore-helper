export const PRODUCT = {
    // Default values
    DEFAULTS: {
      STOCK: 999,
      ORIGIN: '수입산',
      DELIVERY_FEE: 0,
      RETURN_FEE: 3000,
      EXCHANGE_FEE: 3000
    },
  
    // Product status types
    STATUS: {
      SALE: 'SALE',
      OUTOF_STOCK: 'OUTOF_STOCK',
      HIDDEN: 'HIDDEN'
    },
  
    // Sale types
    SALE_TYPE: {
      NEW: 'NEW',
      USE: 'USE'
    },
  
    // Delivery info
    DELIVERY: {
      TYPE: {
        DELIVERY: 'DELIVERY',
        DIRECT: 'DIRECT',
        VISIT: 'VISIT'
      },
      ATTRIBUTE: {
        NORMAL: 'NORMAL',
        COLD: 'COLD',
        FROZEN: 'FROZEN'
      },
      FEE_TYPE: {
        FREE: 'FREE',
        CHARGE: 'CHARGE',
        CONDITIONAL_FREE: 'CONDITIONAL_FREE'
      },
      COMPANY: 'CJGLS'
    },
  
    // Product notice types
    NOTICE_TYPE: {
      WEAR: 'WEAR',
      SHOES: 'SHOES',
      FOOD: 'FOOD',
      COSMETIC: 'COSMETIC'
    },
  
    // Default category ID
    DEFAULT_CATEGORY: '50000803',
  
    // Option settings
    OPTIONS: {
      SORT_TYPE: 'CREATE',
      DEFAULT_GROUP_NAME: '옵션'
    },
  
    // Image settings
    IMAGES: {
      MAX_COUNT: 10,
      TYPES: ['jpg', 'jpeg', 'png', 'gif'],
      MAX_SIZE: 5 * 1024 * 1024  // 5MB
    }
  };
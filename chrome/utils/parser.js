import { PRODUCT } from '../constants/product';

export const ParserUtil = {
  /**
   * 가격 문자열에서 숫자만 추출
   */
  parsePrice(priceText) {
    if (!priceText) return 0;
    return parseInt(priceText.replace(/[^0-9]/g, ''));
  },

  /**
   * 상품 옵션 파싱
   */
  parseOptions(optionElements) {
    const options = [];
    optionElements.forEach(element => {
      const optionText = element.textContent;
      if (!optionText.includes('판매종료')) {
        const name = optionText.split('(')[0].trim();
        options.push({
          name,
          stockQuantity: PRODUCT.DEFAULTS.STOCK
        });
      }
    });
    return options;
  },

  /**
   * 네이버 스마트스토어 형식으로 데이터 변환
   */
  formatForSmartStore(data) {
    const uniqueOptions = Array.from(
      new Set(data.options.map(opt => opt.name))
    ).map(name => ({
      name,
      stockQuantity: PRODUCT.DEFAULTS.STOCK
    }));

    return {
      originProduct: {
        statusType: PRODUCT.STATUS.SALE,
        saleType: PRODUCT.SALE_TYPE.NEW,
        leafCategoryId: PRODUCT.DEFAULT_CATEGORY,
        name: data.title,
        detailContent: data.description,
        images: {
          representativeImage: {
            url: data.images[0]
          },
          optionalImages: data.images.map(url => ({ url }))
        },
        salePrice: this.parsePrice(data.price),
        stockQuantity: PRODUCT.DEFAULTS.STOCK,
        deliveryInfo: {
          deliveryType: PRODUCT.DELIVERY.TYPE.DELIVERY,
          deliveryAttributeType: PRODUCT.DELIVERY.ATTRIBUTE.NORMAL,
          deliveryFee: {
            deliveryFeeType: PRODUCT.DELIVERY.FEE_TYPE.FREE,
            baseFee: PRODUCT.DEFAULTS.DELIVERY_FEE
          },
          claimDeliveryInfo: {
            returnDeliveryFee: PRODUCT.DEFAULTS.RETURN_FEE,
            exchangeDeliveryFee: PRODUCT.DEFAULTS.EXCHANGE_FEE
          }
        },
        optionInfo: uniqueOptions.length > 0 ? {
          optionCombinationSortType: PRODUCT.OPTIONS.SORT_TYPE,
          optionCombinationGroupNames: {
            optionGroupName1: PRODUCT.OPTIONS.DEFAULT_GROUP_NAME
          },
          optionCombinations: uniqueOptions.map(opt => ({
            optionName1: opt.name,
            stockQuantity: opt.stockQuantity,
            price: 0,
            usable: true
          }))
        } : undefined
      },
      smartstoreChannelProduct: {
        naverShoppingRegistration: true,
        channelProductDisplayStatusType: "ON"
      }
    };
  },

  /**
   * URL 유효성 검사
   */
  validateUrl(url) {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.hostname.includes('domeggook.com');
    } catch (error) {
      return false;
    }
  }
};
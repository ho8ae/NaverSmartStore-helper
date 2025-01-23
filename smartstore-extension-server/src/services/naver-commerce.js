import bcrypt from "bcrypt";
import axios from "axios";

export class NaverCommerceAPI {
  constructor(clientId, clientSecret) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.baseUrl = "https://api.commerce.naver.com/external";

    // 요청 인터셉터 추가
    axios.interceptors.request.use((request) => {
      console.log("요청 설정:", {
        url: request.url,
        method: request.method,
        headers: request.headers,
        data: request.data ? JSON.stringify(request.data, null, 2) : "No data",
      });
      return request;
    });

    // 응답 인터셉터 추가
    axios.interceptors.response.use(
      (response) => {
        console.log("응답 성공:", {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          data: response.data,
        });
        return response;
      },
      (error) => {
        console.error("응답 실패:", {
          status: error.response?.status,
          statusText: error.response?.statusText,
          error: error.response?.data,
          validationErrors: error.response?.data?.invalidInputs?.map(
            (item) => ({
              field: item.name,
              message: item.message,
              type: item.type,
            }),
          ),
        });
        throw error;
      },
    );
  }

  generateSignature(timestamp) {
    const message = `${this.clientId}_${timestamp}`;
    const hashed = bcrypt.hashSync(message, this.clientSecret);
    return Buffer.from(hashed).toString("base64");
  }

  async getAccessToken() {
    try {
      const timestamp = Date.now();
      const signature = this.generateSignature(timestamp);

      const formData = new URLSearchParams();
      formData.append("client_id", this.clientId);
      formData.append("timestamp", timestamp);
      formData.append("grant_type", "client_credentials");
      formData.append("client_secret_sign", signature);
      formData.append("type", "SELF");

      console.log("Token request data:", {
        client_id: this.clientId,
        timestamp,
        signature,
      });

      const response = await axios.post(
        `${this.baseUrl}/v1/oauth2/token`,
        formData,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
      );

      return response.data.access_token;
    } catch (error) {
      console.error("Token error full details:", {
        message: error.message,
        response: error.response?.data,
        invalidInputs: error.response?.data?.invalidInputs,
      });
      throw error;
    }
  }

  async uploadImage(imageUrl) {
    try {
      const token = await this.getAccessToken();
      console.log("이미지 URL:", imageUrl);

      // 이미지 다운로드
      const imageResponse = await axios.get(imageUrl, {
        responseType: "arraybuffer",
      });

      // FormData 설정
      const formData = new FormData();
      const imageBlob = new Blob([imageResponse.data], { type: "image/jpeg" });
      formData.append("imageFiles", imageBlob, "image.jpg");

      console.log("FormData 확인:", formData);

      // 이미지 업로드 요청
      const uploadResponse = await axios.post(
        `${this.baseUrl}/v1/product-images/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      console.log("업로드 응답:", uploadResponse.data);
      return uploadResponse.data.images[0].url;
    } catch (error) {
      console.error("이미지 업로드 실패:", error);
      throw error;
    }
  }

  async registerProduct(productData) {
    try {
      const token = await this.getAccessToken();
      const imageUrl = productData.originProduct.images.representativeImage.url;
      const uploadedImageUrl = await this.uploadImage(imageUrl);

      const formattedData = {
        originProduct: {
          ...productData.originProduct,
          detailAttribute: {
            ...productData.originProduct.detailAttribute,
            minorPurchasable: false, // 필수 필드 추가
          },
          images: {
            representativeImage: { url: uploadedImageUrl },
            optionalImages: [{ url: uploadedImageUrl }],
          },
        },
        smartstoreChannelProduct: productData.smartstoreChannelProduct,
      };

      const response = await axios.post(
        `${this.baseUrl}/v2/products`,
        formattedData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      return response.data;
    } catch (error) {
      console.error("상품 등록 실패:", error);
      throw error;
    }
  }

  async formatProductData(productData) {
    const hasOptions = productData.options?.length > 0;

    return {
      originProduct: {
        statusType: "SALE",
        saleType: "NEW",
        leafCategoryId: "50000803",
        name: productData.title,
        detailContent: productData.description,
        images: {
          representativeImage: {
            url: productData.images[0],
          },
          optionalImages: [
            {
              url: productData.images[0],
            },
          ],
        },
        salePrice: productData.price,
        stockQuantity: productData.stockQuantity || 999,
        deliveryInfo: {
          deliveryType: "DELIVERY",
          deliveryAttributeType: "NORMAL",
          deliveryFee: {
            deliveryFeeType: "FREE",
            baseFee: 0,
          },
          claimDeliveryInfo: {
            returnDeliveryFee: 3000,
            exchangeDeliveryFee: 3000,
          },
        },
        detailAttribute: {
          naverShoppingSearchInfo: {
            manufacturerName: "제조사",
            brandName: "브랜드",
          },
          afterServiceInfo: {
            afterServiceTelephoneNumber: "1234-5678",
            afterServiceGuideContent: "구매자 단순변심 반품 가능",
          },
          optionInfo: hasOptions
            ? {
                optionCombinationSortType: "CREATE",
                optionCombinationGroupNames: {
                  optionGroupName1: "옵션",
                },
                optionCombinations: productData.options.map((opt, index) => ({
                  id: index + 1,
                  optionName1: opt.name,
                  stockQuantity: 999,
                  price: 0,
                  usable: true,
                })),
                useStockManagement: true,
              }
            : undefined,
          originAreaInfo: {
            originAreaCode: "0200037",
            content: productData.origin || "수입산",
            plural: false,
            importer: "주식회사 수입사",
          },
          productInfoProvidedNotice: {
            productInfoProvidedNoticeType: "WEAR",
            wear: {
              material: "상세페이지 참조",
              color: "상세페이지 참조",
              size: "상세페이지 참조",
              manufacturer: "상세페이지 참조",
              caution: "상세페이지 참조",
              packDate: "2024-01",
              warrantyPolicy: "상세페이지 참조",
              afterServiceDirector: "1234-5678",
            },
          },
        },
      },
      smartstoreChannelProduct: {
        naverShoppingRegistration: true,
        channelProductDisplayStatusType: "ON",
      },
    };
  }
}

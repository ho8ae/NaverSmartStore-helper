import bcrypt from "bcrypt";
import axios from "axios";

export class NaverCommerceAPI {
  constructor(clientId, clientSecret) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.baseUrl = "https://api.commerce.naver.com/external";
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

      // 이미지 다운로드
      const imageResponse = await axios.get(imageUrl, {
        responseType: "arraybuffer",
      });

      // FormData 생성
      const formData = new FormData();
      const blob = new Blob([imageResponse.data], { type: "image/jpeg" });
      formData.append("imageFiles", blob, "image.jpg");

      console.log("Uploading image:", imageUrl);

      const response = await axios.post(
        `${this.baseUrl}/v1/product-images/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      console.log("Image upload response:", response.data);
      return response.data.images[0].url;
    } catch (error) {
      console.error("Image upload error:", error);
      throw error;
    }
  }

  // services/naver-commerce.js
  async registerProduct(productData) {
    try {
      const token = await this.getAccessToken();
      console.log("Starting image uploads with structured data...");

      // 이미지 데이터 검증
      if (!productData.originProduct?.images?.representativeImage?.url) {
        throw new Error("대표 이미지가 필요합니다.");
      }

      // 대표 이미지 업로드
      const mainImageUrl = await this.uploadImage(
        productData.originProduct.images.representativeImage.url,
      );

      // 추가 이미지 업로드 (있는 경우)
      const optionalImageUrls = await Promise.all(
        (productData.originProduct.images.optionalImages || []).map((img) =>
          this.uploadImage(img.url),
        ),
      );

      // 업로드된 이미지로 데이터 구성
      const updatedProductData = {
        ...productData,
        originProduct: {
          ...productData.originProduct,
          images: {
            representativeImage: { url: mainImageUrl },
            optionalImages: optionalImageUrls.map((url) => ({ url })),
          },
        },
      };

      // 상품 등록 요청
      const response = await axios.post(
        `${this.baseUrl}/v2/products`,
        updatedProductData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      return response.data;
    } catch (error) {
      console.error("Product registration error:", error);
      throw error;
    }
  }

  formatProductData(productData) {
    return {
      originProduct: {
        statusType: "WAIT",
        saleType: "NEW",
        leafCategoryId: "50000803", // 의류 카테고리
        name: productData.title,
        detailContent: productData.description,
        images: {
          representativeImage: {
            url: productData.images[0],
          },
          optionalImages: productData.images.slice(1).map((url) => ({ url })),
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

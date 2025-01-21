import { pool } from "../db/connection.js";
import { NaverCommerceAPI } from "../services/naver-commerce.js";

export const registerProduct = async (req, res) => {
  const { productData } = req.body;
  const userId = req.user.id;
  let client;

  try {
    // 이미지 데이터 유효성 검사
    if (
      !productData.images ||
      !Array.isArray(productData.images) ||
      productData.images.length === 0
    ) {
      throw new Error("최소 1개 이상의 상품 이미지가 필요합니다.");
    }

    client = await pool.connect();
    await client.query("BEGIN");

    // API 키 조회
    const userResult = await client.query(
      "SELECT api_key, secret_key FROM users WHERE id = $1",
      [userId],
    );

    if (userResult.rows.length === 0) {
      throw new Error("사용자를 찾을 수 없습니다.");
    }

    const { api_key, secret_key } = userResult.rows[0];
    const naverApi = new NaverCommerceAPI(api_key, secret_key);

    // 이미지 데이터 구성
    const imageData = {
      representativeImage: { url: productData.images[0] },
      optionalImages: productData.images.slice(1).map((url) => ({ url })),
    };

    console.log("Image data being sent:", imageData); // 디버깅용

    // 네이버 API 요청 데이터 구성
    const naverProductData = {
      originProduct: {
        excludeAdminAutoUpdate: true,
        excludeSettle: true,
        statusType: "SALE",
        saleType: "NEW",
        leafCategoryId: "50000803",
        name: productData.title,
        detailContent: `
            <div style="width:100%; margin:0 auto; text-align:center;">
              <h2>${productData.title}</h2>
              ${productData.description || ""}
            </div>
          `,
        images: imageData, // 수정된 이미지 데이터 구조
        salePrice: productData.price,
        stockQuantity: 999,
        detailAttribute: {
          hasManuallyEnteredProductInfo: true,
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
          originAreaInfo: {
            originAreaCode: "0200037",
            content: productData.origin || "수입산",
            plural: false,
            importer: "주식회사 수입사",
          },
          minorPurchasable: true,
          afterServiceInfo: {
            afterServiceTelephoneNumber: "1234-5678",
            afterServiceGuideContent: "구매자 단순변심 반품 가능",
          },
        },
      },
      smartstoreChannelProduct: {
        naverShoppingRegistration: true,
        channelProductDisplayStatusType: "ON",
      },
    };
    
    console.log("Full request data:", JSON.stringify(naverProductData, null, 2)); // 디버깅용


    // 상품 등록
    const naverResponse = await naverApi.registerProduct(naverProductData);

    // DB에 저장
    const result = await client.query(
      `INSERT INTO products (
          user_id, title, price, description, 
          images, naver_product_id, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7) 
        RETURNING *`,
      [
        userId,
        productData.title,
        productData.price,
        productData.description,
        productData.images,
        naverResponse.productId,
        "registered",
      ],
    );

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      data: {
        ...result.rows[0],
        naverProductId: naverResponse.productId,
      },
    });
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    console.error("Product registration error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  } finally {
    if (client) client.release();
  }
};

export const getProducts = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      "SELECT * FROM products WHERE user_id = $1 ORDER BY created_at DESC",
      [userId],
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getProductById = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      "SELECT * FROM products WHERE id = $1 AND user_id = $2",
      [id, userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

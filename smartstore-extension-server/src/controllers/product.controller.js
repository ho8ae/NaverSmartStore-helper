import { pool } from "../db/connection.js";
import { NaverCommerceAPI } from "../services/naver-commerce.js";

export const registerProduct = async (req, res) => {
    try {
        console.log("요청 데이터:", JSON.stringify(req.body, null, 2)); // 전체 로깅
        const { productData } = req.body;
        const naverApi = new NaverCommerceAPI(req.user.api_key, req.user.secret_key);
        const response = await naverApi.registerProduct(productData);
        res.json({ success: true, data: response });
    } catch (error) {
        console.error("컨트롤러 오류:", error);
        res.status(500).json({ success: false, message: error.message });
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

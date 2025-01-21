// middleware/auth.js
import jwt from "jsonwebtoken";
import { pool } from "../db/connection.js";

export const authenticateToken = async (req, res, next) => {
  try {
    // Authorization 헤더 확인
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      console.log("No authorization header found");
      return res.status(401).json({
        success: false,
        message: "인증 헤더가 없습니다.",
      });
    }

    // Bearer 토큰 형식 확인
    const [bearer, token] = authHeader.split(" ");
    if (bearer !== "Bearer" || !token) {
      console.log("Invalid token format");
      return res.status(401).json({
        success: false,
        message: "잘못된 토큰 형식입니다.",
      });
    }

    try {
      // 토큰 검증
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Token decoded:", decoded);

      // 사용자 조회
      const result = await pool.query(
        "SELECT id, email, api_key, secret_key FROM users WHERE id = $1",
        [decoded.id],
      );

      if (result.rows.length === 0) {
        console.log("User not found:", decoded.id);
        return res.status(401).json({
          success: false,
          message: "사용자를 찾을 수 없습니다.",
        });
      }

      // 토큰 만료 시간 확인
      const currentTimestamp = Math.floor(Date.now() / 1000);
      if (decoded.exp && decoded.exp < currentTimestamp) {
        console.log("Token expired");
        return res.status(401).json({
          success: false,
          message: "토큰이 만료되었습니다.",
        });
      }

      // 사용자 정보를 요청 객체에 저장
      req.user = {
        id: result.rows[0].id,
        email: result.rows[0].email,
        api_key: result.rows[0].api_key,
        secret_key: result.rows[0].secret_key,
      };

      console.log("Authentication successful for user:", req.user.email);
      next();
    } catch (jwtError) {
      console.error("JWT verification error:", jwtError);
      return res.status(403).json({
        success: false,
        message: "토큰 검증에 실패했습니다.",
        error:
          process.env.NODE_ENV === "development" ? jwtError.message : undefined,
      });
    }
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(500).json({
      success: false,
      message: "인증 처리 중 오류가 발생했습니다.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

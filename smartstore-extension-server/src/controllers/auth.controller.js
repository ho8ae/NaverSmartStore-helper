import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../db/connection.js";

export const register = async (req, res) => {
  const { email, password, api_key, secret_key } = req.body;

  try {
    console.log("Attempting registration with email:", email);

    // 이메일 중복 체크
    const userExists = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email],
    );

    console.log("Checked for existing user:", userExists.rows.length);

    if (userExists.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "이미 존재하는 이메일입니다.",
      });
    }

    // 비밀번호 해싱
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    console.log("Password hashed successfully");

    // 사용자 생성
    const result = await pool.query(
      `INSERT INTO users (email, password, api_key, secret_key, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
       RETURNING id, email, api_key`,
      [email, hashedPassword, api_key, secret_key],
    );

    console.log("User created successfully:", result.rows[0]);

    // JWT 토큰 생성
    const token = jwt.sign(
      { id: result.rows[0].id, email: result.rows[0].email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN },
    );

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: result.rows[0].id,
          email: result.rows[0].email,
          api_key: result.rows[0].api_key,
        },
        token,
      },
    });
  } catch (error) {
    console.error("Register error details:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
      detail: error.detail,
    });

    res.status(500).json({
      success: false,
      message: "회원가입 중 오류가 발생했습니다.",
      detail:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// 로그인
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 사용자 확인
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "이메일 또는 비밀번호가 일치하지 않습니다.",
      });
    }

    const user = result.rows[0];

    // 비밀번호 확인
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: "이메일 또는 비밀번호가 일치하지 않습니다.",
      });
    }

    // JWT 토큰 생성
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN },
    );

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          api_key: user.api_key,
        },
        token,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "로그인 중 오류가 발생했습니다.",
    });
  }
};

// 토큰 확인
export const verifyToken = async (req, res) => {
  try {
    const user = await pool.query(
      "SELECT id, email, api_key FROM users WHERE id = $1",
      [req.user.id],
    );

    if (user.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "사용자를 찾을 수 없습니다.",
      });
    }

    res.json({
      success: true,
      data: {
        user: user.rows[0],
      },
    });
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(500).json({
      success: false,
      message: "인증 확인 중 오류가 발생했습니다.",
    });
  }
};
export const verifyApi = async (req, res) => {
  try {
    const { apiKey, secretKey } = req.body;
    const userId = req.user.id;

    // API 키와 시크릿 키 유효성 검사
    if (!apiKey || !secretKey) {
      return res.status(400).json({
        success: false,
        message: "API 키와 시크릿 키가 필요합니다.",
      });
    }

    // 사용자의 API 키 업데이트
    const result = await pool.query(
      `UPDATE users 
         SET api_key = $1, secret_key = $2, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $3 
         RETURNING id, email, api_key`,
      [apiKey, secretKey, userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "사용자를 찾을 수 없습니다.",
      });
    }

    res.json({
      success: true,
      message: "API 키가 성공적으로 저장되었습니다.",
      data: {
        user: {
          id: result.rows[0].id,
          email: result.rows[0].email,
          api_key: result.rows[0].api_key,
        },
      },
    });
  } catch (error) {
    console.error("API 키 검증 오류:", error);
    res.status(500).json({
      success: false,
      message: "API 키 검증 중 오류가 발생했습니다.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

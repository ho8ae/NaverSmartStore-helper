// routes/auth.routes.js
import express from "express";
import {
  login,
  register,
  verifyToken,
  verifyApi,
} from "../controllers/auth.controller.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/verify", authenticateToken, verifyToken);
router.post("/verify-api", authenticateToken, verifyApi); // 새로운 라우트 추가

export default router;

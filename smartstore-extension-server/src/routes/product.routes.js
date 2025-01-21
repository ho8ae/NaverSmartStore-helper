import { Router } from 'express';
import { registerProduct, getProducts, getProductById } from '../controllers/product.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.post('/register', authenticateToken, registerProduct);
router.get('/', authenticateToken, getProducts);
router.get('/:id', authenticateToken, getProductById);

export default router;
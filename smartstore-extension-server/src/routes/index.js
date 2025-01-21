import { Router } from 'express';
import authRoutes from './auth.routes.js';
import productRoutes from './product.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/products', productRoutes);

// Test route
router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

export default router;  // 명시적으로 default export 추가
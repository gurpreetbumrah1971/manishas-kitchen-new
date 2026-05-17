import { Router } from 'express';
import { getCategories, getMenu, updateFoodItemAvailability } from '../controllers/menuController';
import { createOrder, getOrders, updateOrderStatus } from '../controllers/orderController';
import { login } from '../controllers/adminController';
import { authenticateAdmin } from '../middleware/auth';

const router = Router();

// Menu Routes
router.get('/categories', getCategories);
router.get('/menu', getMenu);
router.patch('/admin/menu/:id/availability', authenticateAdmin, updateFoodItemAvailability);

// Order Routes
router.post('/orders', createOrder);
router.get('/admin/orders', authenticateAdmin, getOrders);
router.patch('/admin/orders/:id/status', authenticateAdmin, updateOrderStatus);

// Admin Auth
router.post('/admin/login', login);

export default router;

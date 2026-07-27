import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { createFoodItem, deleteFoodItem, getCategories, getMenu, getMenuImage, updateFoodItem, updateFoodItemAvailability } from '../controllers/menuController';
import { createOrder, getOrderStatus, getOrders, updateOrderStatus } from '../controllers/orderController';
import { login } from '../controllers/adminController';
import { authenticateAdmin } from '../middleware/auth';

const router = Router();
const menuUploadDir = path.resolve(__dirname, '../../uploads/menu');
const campaignUploadDir = path.resolve(__dirname, '../../uploads/campaign');

fs.mkdirSync(menuUploadDir, { recursive: true });
fs.mkdirSync(campaignUploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, menuUploadDir),
  filename: (_req, file, cb) => {
    const safeExt = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  }
});

const campaignStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, campaignUploadDir),
  filename: (_req, file, cb) => {
    const safeExt = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
  }
});

const campaignUpload = multer({
  storage: campaignStorage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/') && !file.mimetype.startsWith('video/')) {
      return cb(new Error('Only image and video files are allowed'));
    }
    cb(null, true);
  }
});

// Menu Routes
router.get('/categories', getCategories);
router.get('/menu', getMenu);
router.get('/menu-image/:name', getMenuImage);
router.post('/admin/uploads/menu-image', authenticateAdmin, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Image file is required' });
  res.status(201).json({ imageUrl: `${req.protocol}://${req.get('host')}/uploads/menu/${req.file.filename}` });
});
router.post('/admin/uploads/campaign-media', authenticateAdmin, campaignUpload.single('media'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Media file is required' });
  res.status(201).json({
    mediaUrl: `${req.protocol}://${req.get('host')}/uploads/campaign/${req.file.filename}`,
    mediaType: req.file.mimetype,
  });
});
router.post('/admin/menu', authenticateAdmin, createFoodItem);
router.put('/admin/menu/:id', authenticateAdmin, updateFoodItem);
router.delete('/admin/menu/:id', authenticateAdmin, deleteFoodItem);
router.patch('/admin/menu/:id/availability', authenticateAdmin, updateFoodItemAvailability);

// Order Routes
router.post('/orders', createOrder);
router.get('/orders/:orderNumber/status', getOrderStatus);
router.get('/admin/orders', authenticateAdmin, getOrders);
router.patch('/admin/orders/:id/status', authenticateAdmin, updateOrderStatus);

// Admin Auth
router.post('/admin/login', login);

export default router;

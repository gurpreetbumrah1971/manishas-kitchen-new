import { Request, Response } from 'express';
import prisma from '../prisma';

export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { foodItems: true }
        }
      }
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

export const getMenu = async (req: Request, res: Response) => {
  try {
    const { categoryId, admin } = req.query;
    const where: any = {};
    
    if (categoryId) where.categoryId = Number(categoryId);
    if (!admin) where.isAvailable = true; // Only show available items to users
    
    const foodItems = await prisma.foodItem.findMany({
      where,
      include: { category: true }
    });
    res.json(foodItems);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch menu' });
  }
};

export const updateFoodItemAvailability = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isAvailable } = req.body;
    const foodItem = await prisma.foodItem.update({
      where: { id: Number(id) },
      data: { isAvailable }
    });
    res.json(foodItem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update item availability' });
  }
};

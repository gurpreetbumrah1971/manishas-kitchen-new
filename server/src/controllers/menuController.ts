import { Request, Response } from 'express';
import prisma from '../prisma';
import { menuImageUrl, renderMenuImageSvg } from '../utils/menuImages';

const visibleCategoryOrder = ['Parathas', 'Frankies', 'Pakodas', 'Egg Dishes', 'Snacks', 'Beverages'];

const parseFoodItemBody = (body: any) => {
  const name = String(body.name || '').trim();
  const description = String(body.description || '').trim();
  const image = String(body.image || '').trim() || menuImageUrl(name);
  const price = Number(body.price);
  const categoryId = Number(body.categoryId);

  if (!name) return { error: 'Item name is required' };
  if (!Number.isFinite(price) || price <= 0) return { error: 'Price must be greater than 0' };
  if (!Number.isInteger(categoryId) || categoryId <= 0) return { error: 'Category is required' };

  return {
    data: {
      name,
      description,
      image,
      price,
      categoryId,
      isVeg: Boolean(body.isVeg),
      isAvailable: Boolean(body.isAvailable),
    }
  };
};

export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      where: {
        name: { in: visibleCategoryOrder }
      }
    });
    const categoryCounts = await prisma.foodItem.groupBy({
      by: ['categoryId'],
      where: {
        isAvailable: true,
        category: {
          name: { in: visibleCategoryOrder }
        }
      },
      _count: { _all: true }
    });
    const countByCategoryId = new Map(categoryCounts.map((count) => [count.categoryId, count._count._all]));
    res.json(categories
      .map((category) => ({
        ...category,
        _count: { foodItems: countByCategoryId.get(category.id) || 0 }
      }))
      .sort((a, b) => visibleCategoryOrder.indexOf(a.name) - visibleCategoryOrder.indexOf(b.name)));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

export const getMenu = async (req: Request, res: Response) => {
  try {
    const { categoryId, admin } = req.query;
    const where: any = {
      category: {
        name: { in: visibleCategoryOrder }
      }
    };
    
    if (categoryId) where.categoryId = Number(categoryId);
    if (!admin) where.isAvailable = true; // Only show available items to users
    
    const foodItems = await prisma.foodItem.findMany({
      where,
      include: { category: true }
    });
    res.json(foodItems.sort((a, b) => {
      const categoryCompare =
        (visibleCategoryOrder.indexOf(a.category.name) === -1 ? Number.MAX_SAFE_INTEGER : visibleCategoryOrder.indexOf(a.category.name)) -
        (visibleCategoryOrder.indexOf(b.category.name) === -1 ? Number.MAX_SAFE_INTEGER : visibleCategoryOrder.indexOf(b.category.name));
      if (categoryCompare !== 0) return categoryCompare;
      return a.id - b.id;
    }));
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

export const createFoodItem = async (req: Request, res: Response) => {
  try {
    const parsed = parseFoodItemBody(req.body);
    if ('error' in parsed) return res.status(400).json({ error: parsed.error });

    const foodItem = await prisma.foodItem.create({
      data: parsed.data,
      include: { category: true }
    });
    res.status(201).json(foodItem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create menu item' });
  }
};

export const updateFoodItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const parsed = parseFoodItemBody(req.body);
    if ('error' in parsed) return res.status(400).json({ error: parsed.error });

    const foodItem = await prisma.foodItem.update({
      where: { id: Number(id) },
      data: parsed.data,
      include: { category: true }
    });
    res.json(foodItem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update menu item' });
  }
};

export const deleteFoodItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.foodItem.delete({ where: { id: Number(id) } });
    res.status(204).send();
  } catch (error: any) {
    if (error?.code === 'P2003') {
      return res.status(409).json({ error: 'This item has orders attached. Mark it unavailable instead.' });
    }
    res.status(500).json({ error: 'Failed to delete menu item' });
  }
};

export const getMenuImage = (req: Request, res: Response) => {
  const paramName = Array.isArray(req.params.name) ? req.params.name[0] : req.params.name;
  const rawName = paramName.replace(/\.svg$/i, '');
  const name = decodeURIComponent(rawName);
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.send(renderMenuImageSvg(name));
};

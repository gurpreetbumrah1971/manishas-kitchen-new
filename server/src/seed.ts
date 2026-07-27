import prisma from './prisma';
import bcrypt from 'bcryptjs';
import { generatedMenuAssetUrl } from './utils/menuImages';

type CategorySeed = {
  name: string;
  image: string;
};

type MenuItemSeed = {
  name: string;
  description: string;
  price: number;
  categoryName: string;
  isVeg: boolean;
  image: string;
};

const categories: CategorySeed[] = [
  { name: 'Beverages', image: '/food/iced-tea.png' },
  { name: 'Biryanis', image: generatedMenuAssetUrl('Veg Biryani') },
  { name: 'Egg Dishes', image: generatedMenuAssetUrl('Egg Omelet + 2 Pav (Single)') },
  { name: 'Frankies', image: generatedMenuAssetUrl('Paneer Frankie') },
  { name: 'Pakodas', image: generatedMenuAssetUrl('Onion Pakoda') },
  { name: 'Parathas', image: generatedMenuAssetUrl('Aloo Paratha') },
  { name: 'Snacks', image: '/food/poha.png' },
  { name: 'Custom', image: generatedMenuAssetUrl('Custom Party Box') },
];

const menuItems: MenuItemSeed[] = [
  { name: 'Tea', description: 'Hot traditional Indian masala chai.', price: 15, categoryName: 'Beverages', isVeg: true, image: '/food/tea-realistic.png' },
  { name: 'Hot Coffee', description: 'Freshly brewed hot coffee.', price: 30, categoryName: 'Beverages', isVeg: true, image: generatedMenuAssetUrl('Hot Coffee') },
  { name: 'Chaas', description: 'Refreshing spiced buttermilk.', price: 20, categoryName: 'Beverages', isVeg: true, image: generatedMenuAssetUrl('Chaas') },
  { name: 'Nimbu Pani', description: 'Classic fresh lime water.', price: 20, categoryName: 'Beverages', isVeg: true, image: generatedMenuAssetUrl('Nimbu Pani') },
  { name: 'Lemon Tea', description: 'Refreshing hot lemon tea.', price: 25, categoryName: 'Beverages', isVeg: true, image: '/food/lemon-tea.png' },
  { name: 'Green Tea', description: 'Healthy and soothing hot green tea.', price: 25, categoryName: 'Beverages', isVeg: true, image: generatedMenuAssetUrl('Green Tea') },
  { name: 'Iced Tea', description: 'Chilled lemon infused iced tea.', price: 40, categoryName: 'Beverages', isVeg: true, image: '/food/iced-tea.png' },
  { name: 'Watermelon Juice', description: 'Freshly squeezed watermelon juice.', price: 50, categoryName: 'Beverages', isVeg: true, image: generatedMenuAssetUrl('Watermelon Juice') },
  { name: 'Cold Coffee', description: 'Chilled creamy cold coffee.', price: 60, categoryName: 'Beverages', isVeg: true, image: generatedMenuAssetUrl('Cold Coffee') },
  { name: 'Chikoo Milkshake', description: 'Thick and creamy sapota shake.', price: 60, categoryName: 'Beverages', isVeg: true, image: generatedMenuAssetUrl('Chikoo Milkshake') },
  { name: 'Chocolate Milkshake', description: 'Rich and indulgent chocolate shake.', price: 90, categoryName: 'Beverages', isVeg: true, image: generatedMenuAssetUrl('Chocolate Milkshake') },
  { name: 'Mango Milkshake', description: 'Creamy shake made with fresh mangoes.', price: 120, categoryName: 'Beverages', isVeg: true, image: generatedMenuAssetUrl('Mango Milkshake') },
  { name: 'Veg Biryani', description: 'Fragrant rice layered with spiced vegetables.', price: 140, categoryName: 'Biryanis', isVeg: true, image: generatedMenuAssetUrl('Veg Biryani') },
  { name: 'Egg Biryani', description: 'Fragrant rice layered with masala eggs.', price: 160, categoryName: 'Biryanis', isVeg: false, image: generatedMenuAssetUrl('Egg Biryani') },
  { name: 'Chicken Dum Biryani', description: 'Slow-cooked dum biryani with tender chicken and aromatic rice.', price: 225, categoryName: 'Biryanis', isVeg: false, image: generatedMenuAssetUrl('Chicken Dum Biryani') },
  { name: 'Paneer Biryani', description: 'Aromatic biryani layered with spiced paneer and basmati rice.', price: 225, categoryName: 'Biryanis', isVeg: true, image: generatedMenuAssetUrl('Paneer Biryani') },
  { name: 'Egg Burji + 2 Pav (Single)', description: 'Spiced scrambled eggs served with 2 pav.', price: 40, categoryName: 'Egg Dishes', isVeg: false, image: generatedMenuAssetUrl('Egg Burji + 2 Pav (Single)') },
  { name: 'Egg Burji + 2 Pav (Double)', description: 'Double portion spiced scrambled eggs with 2 pav.', price: 80, categoryName: 'Egg Dishes', isVeg: false, image: generatedMenuAssetUrl('Egg Burji + 2 Pav (Double)') },
  { name: 'Egg Omelet + 2 Pav (Single)', description: 'Classic spiced omelet served with 2 pav.', price: 40, categoryName: 'Egg Dishes', isVeg: false, image: generatedMenuAssetUrl('Egg Omelet + 2 Pav (Single)') },
  { name: 'Egg Omelet + 2 Pav (Double)', description: 'Double portion spiced omelet with 2 pav.', price: 80, categoryName: 'Egg Dishes', isVeg: false, image: generatedMenuAssetUrl('Egg Omelet + 2 Pav (Double)') },
  { name: 'Aloo Frankie', description: 'Soft roll filled with spiced potato and chutney.', price: 60, categoryName: 'Frankies', isVeg: true, image: generatedMenuAssetUrl('Aloo Frankie') },
  { name: 'Paneer Frankie', description: 'Soft roll filled with spiced paneer and onions.', price: 90, categoryName: 'Frankies', isVeg: true, image: generatedMenuAssetUrl('Paneer Frankie') },
  { name: 'Wada', description: 'Single spicy potato fritter.', price: 15, categoryName: 'Pakodas', isVeg: true, image: generatedMenuAssetUrl('Wada') },
  { name: 'Wada Pav', description: 'Spicy potato fritter in a bun.', price: 20, categoryName: 'Pakodas', isVeg: true, image: generatedMenuAssetUrl('Wada Pav') },
  { name: 'Onion Pakoda', description: 'Crisp onion fritters with house masala.', price: 50, categoryName: 'Pakodas', isVeg: true, image: generatedMenuAssetUrl('Onion Pakoda') },
  { name: 'Mix Pakoda', description: 'Assorted vegetable fritters fried crisp.', price: 70, categoryName: 'Pakodas', isVeg: true, image: generatedMenuAssetUrl('Mix Pakoda') },
  { name: 'Aloo Paratha', description: 'Wheat flatbread stuffed with spiced potatoes.', price: 60, categoryName: 'Parathas', isVeg: true, image: generatedMenuAssetUrl('Aloo Paratha') },
  { name: 'Gobi Paratha', description: 'Wheat flatbread stuffed with spiced cauliflower.', price: 60, categoryName: 'Parathas', isVeg: true, image: generatedMenuAssetUrl('Gobi Paratha') },
  { name: 'Paneer Paratha', description: 'Wheat flatbread stuffed with spiced cottage cheese.', price: 100, categoryName: 'Parathas', isVeg: true, image: generatedMenuAssetUrl('Paneer Paratha') },
  { name: 'Methi Paratha', description: 'Wheat flatbread with fresh fenugreek leaves.', price: 60, categoryName: 'Parathas', isVeg: true, image: generatedMenuAssetUrl('Methi Paratha') },
  { name: 'Palak Paratha', description: 'Wheat flatbread layered with spiced spinach.', price: 60, categoryName: 'Parathas', isVeg: true, image: generatedMenuAssetUrl('Palak Paratha') },
  { name: 'Cabbage Paratha', description: 'Wheat flatbread stuffed with seasoned cabbage.', price: 60, categoryName: 'Parathas', isVeg: true, image: generatedMenuAssetUrl('Cabbage Paratha') },
  { name: 'Moong Daal Chilla', description: 'Savory moong dal pancake with mild spices.', price: 65, categoryName: 'Parathas', isVeg: true, image: generatedMenuAssetUrl('Moong Daal Chilla') },
  { name: 'Plain Paratha', description: 'Simple layered wheat flatbread.', price: 20, categoryName: 'Parathas', isVeg: true, image: generatedMenuAssetUrl('Plain Paratha') },
  { name: 'Poha', description: 'Flattened rice seasoned with spices.', price: 30, categoryName: 'Snacks', isVeg: true, image: '/food/poha.png' },
  { name: 'Poha Usal', description: 'Poha served with spicy bean curry.', price: 40, categoryName: 'Snacks', isVeg: true, image: generatedMenuAssetUrl('Poha Usal') },
  { name: 'Upma', description: 'Savory semolina porridge.', price: 30, categoryName: 'Snacks', isVeg: true, image: generatedMenuAssetUrl('Upma') },
  { name: 'Uttapam', description: 'Thick rice pancake with toppings.', price: 60, categoryName: 'Snacks', isVeg: true, image: generatedMenuAssetUrl('Uttapam') },
  { name: 'Dhokla (Half)', description: 'Steamed gram flour cake (4 pieces).', price: 40, categoryName: 'Snacks', isVeg: true, image: '/food/dhokla.jpeg' },
  { name: 'Dhokla (Full)', description: 'Steamed gram flour cake (8 pieces).', price: 70, categoryName: 'Snacks', isVeg: true, image: '/food/dhokla.jpeg' },
  { name: 'Pav', description: 'Single bread bun.', price: 5, categoryName: 'Snacks', isVeg: true, image: generatedMenuAssetUrl('Pav') },
  { name: 'Pav Bhaji', description: 'Spiced vegetable mash with buns.', price: 150, categoryName: 'Snacks', isVeg: true, image: generatedMenuAssetUrl('Pav Bhaji') },
  { name: 'Misal Pav', description: 'Spicy sprout curry topped with farsan, served with pav.', price: 80, categoryName: 'Snacks', isVeg: true, image: '/food/misal-pav.png' },
  { name: 'Wada Usal Pav', description: 'Wada served with spicy sprout curry and pav.', price: 80, categoryName: 'Snacks', isVeg: true, image: generatedMenuAssetUrl('Wada Usal Pav') },
  { name: 'Chole Puri', description: 'Spicy chickpeas served with 4 fluffy fried puris.', price: 110, categoryName: 'Snacks', isVeg: true, image: '/food/chole-puri.png' },
  { name: 'Chole Bhature', description: 'Spicy chickpeas served with 2 large bhaturas.', price: 150, categoryName: 'Snacks', isVeg: true, image: generatedMenuAssetUrl('Chole Bhature') },
  { name: 'Chole Plate', description: 'A plate of spicy chickpeas (Chole only).', price: 80, categoryName: 'Snacks', isVeg: true, image: generatedMenuAssetUrl('Chole Plate') },
  { name: 'Custom Party Box', description: 'Your selection of snacks and sweets.', price: 999, categoryName: 'Custom', isVeg: true, image: generatedMenuAssetUrl('Custom Party Box') },
];

async function seedAdmin() {
  const existingAdmin = await prisma.admin.findUnique({ where: { username: 'admin' } });
  if (existingAdmin) return;

  const hashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.admin.create({
    data: {
      username: 'admin',
      password: hashedPassword,
    },
  });
}

async function syncCategories() {
  const categoryByName = new Map<string, { id: number }>();

  for (const category of categories) {
    const savedCategory = await prisma.category.upsert({
      where: { name: category.name },
      update: { image: category.image },
      create: category,
      select: { id: true, name: true },
    });
    categoryByName.set(savedCategory.name, { id: savedCategory.id });
  }

  return categoryByName;
}

async function syncMenuItems(categoryByName: Map<string, { id: number }>) {
  for (const item of menuItems) {
    const category = categoryByName.get(item.categoryName);
    if (!category) {
      throw new Error(`Missing category for menu item: ${item.name}`);
    }

    const data = {
      description: item.description,
      price: item.price,
      image: item.image,
      isVeg: item.isVeg,
      categoryId: category.id,
    };

    const updated = await prisma.foodItem.updateMany({
      where: { name: item.name },
      data,
    });

    if (updated.count === 0) {
      await prisma.foodItem.create({
        data: {
          name: item.name,
          isAvailable: true,
          ...data,
        },
      });
    }
  }
}

async function main() {
  await seedAdmin();
  const categoryByName = await syncCategories();
  await syncMenuItems(categoryByName);

  console.log('Seed data synchronized successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

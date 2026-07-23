import prisma from './prisma';
import bcrypt from 'bcryptjs';
import { generatedMenuAssetUrl } from './utils/menuImages';

const menuImages: Record<string, string> = {
  'Poha': '/food/poha.png',
  'Poha Usal': generatedMenuAssetUrl('Poha Usal'),
  'Upma': generatedMenuAssetUrl('Upma'),
  'Uttapam': generatedMenuAssetUrl('Uttapam'),
  'Dhokla (Half)': '/food/dhokla.jpeg',
  'Dhokla (Full)': '/food/dhokla.jpeg',
  'Wada Pav': generatedMenuAssetUrl('Wada Pav'),
  'Wada': generatedMenuAssetUrl('Wada'),
  'Pav': generatedMenuAssetUrl('Pav'),
  'Pav Bhaji': generatedMenuAssetUrl('Pav Bhaji'),
  'Misal Pav': '/food/misal-pav.png',
  'Wada Usal Pav': generatedMenuAssetUrl('Wada Usal Pav'),
  'Aloo Paratha': generatedMenuAssetUrl('Aloo Paratha'),
  'Gobi Paratha': generatedMenuAssetUrl('Gobi Paratha'),
  'Paneer Paratha': generatedMenuAssetUrl('Paneer Paratha'),
  'Methi Paratha': generatedMenuAssetUrl('Methi Paratha'),
  'Plain Paratha': generatedMenuAssetUrl('Plain Paratha'),
  'Chole Puri': '/food/chole-puri.png',
  'Chole Bhature': generatedMenuAssetUrl('Chole Bhature'),
  'Chole Plate': generatedMenuAssetUrl('Chole Plate'),
  'Puri Plate': generatedMenuAssetUrl('Puri Plate'),
  'Bhatura': generatedMenuAssetUrl('Bhatura'),
  'Egg Burji + 2 Pav (Single)': generatedMenuAssetUrl('Egg Burji + 2 Pav (Single)'),
  'Egg Burji + 2 Pav (Double)': generatedMenuAssetUrl('Egg Burji + 2 Pav (Double)'),
  'Egg Omelet + 2 Pav (Single)': generatedMenuAssetUrl('Egg Omelet + 2 Pav (Single)'),
  'Egg Omelet + 2 Pav (Double)': generatedMenuAssetUrl('Egg Omelet + 2 Pav (Double)'),
  'Butter Pav': generatedMenuAssetUrl('Butter Pav'),
  'Tea': '/food/tea.png',
  'Hot Coffee': generatedMenuAssetUrl('Hot Coffee'),
  'Chaas': generatedMenuAssetUrl('Chaas'),
  'Nimbu Pani': generatedMenuAssetUrl('Nimbu Pani'),
  'Lemon Tea': '/food/lemon-tea.png',
  'Green Tea': generatedMenuAssetUrl('Green Tea'),
  'Iced Tea': '/food/iced-tea.png',
  'Watermelon Juice': generatedMenuAssetUrl('Watermelon Juice'),
  'Cold Coffee': generatedMenuAssetUrl('Cold Coffee'),
  'Chikoo Milkshake': generatedMenuAssetUrl('Chikoo Milkshake'),
  'Chocolate Milkshake': generatedMenuAssetUrl('Chocolate Milkshake'),
  'Mango Milkshake': generatedMenuAssetUrl('Mango Milkshake'),
  'Custom Party Box': generatedMenuAssetUrl('Custom Party Box'),
};

const imageFor = (name: string) => menuImages[name] || generatedMenuAssetUrl(name);

async function syncMenuImages() {
  await Promise.all(
    Object.entries(menuImages).map(([name, image]) =>
      prisma.foodItem.updateMany({
        where: { name },
        data: { image },
      })
    )
  );
}

async function main() {
  const existingAdmin = await prisma.admin.findUnique({ where: { username: 'admin' } });
  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.admin.create({
      data: {
        username: 'admin',
        password: hashedPassword,
      },
    });
  }

  const snacks = await prisma.category.upsert({
    where: { name: 'Snacks' },
    update: {},
    create: { name: 'Snacks', image: '/food/poha.png' },
  });
  const meals = await prisma.category.upsert({
    where: { name: 'Meals' },
    update: {},
    create: { name: 'Meals', image: '/food/chole-puri.png' },
  });
  const beverages = await prisma.category.upsert({
    where: { name: 'Beverages' },
    update: {},
    create: { name: 'Beverages', image: '/food/iced-tea.png' },
  });
  const custom = await prisma.category.upsert({
    where: { name: 'Custom' },
    update: {},
    create: { name: 'Custom', image: 'https://images.unsplash.com/photo-1495195129352-aeb325a55b65?auto=format&fit=crop&q=80&w=400' },
  });

  const existingFoodItems = await prisma.foodItem.count();
  if (existingFoodItems > 0) {
    await syncMenuImages();
    console.log('Seed skipped: food items already exist');
    console.log('Menu item images synchronized successfully');
    return;
  }

  // Create Food Items
  await prisma.foodItem.createMany({
    data: [
      // Snacks
      { name: 'Poha', description: 'Flattened rice seasoned with spices.', price: 30, categoryId: snacks.id, isVeg: true, image: imageFor('Poha') },
      { name: 'Poha Usal', description: 'Poha served with spicy bean curry.', price: 40, categoryId: snacks.id, isVeg: true, image: imageFor('Poha Usal') },
      { name: 'Upma', description: 'Savory semolina porridge.', price: 30, categoryId: snacks.id, isVeg: true, image: imageFor('Upma') },
      { name: 'Uttapam', description: 'Thick rice pancake with toppings.', price: 60, categoryId: snacks.id, isVeg: true, image: imageFor('Uttapam') },
      { name: 'Dhokla (Half)', description: 'Steamed gram flour cake (4 pieces).', price: 40, categoryId: snacks.id, isVeg: true, image: imageFor('Dhokla (Half)') },
      { name: 'Dhokla (Full)', description: 'Steamed gram flour cake (8 pieces).', price: 70, categoryId: snacks.id, isVeg: true, image: imageFor('Dhokla (Full)') },
      { name: 'Wada Pav', description: 'Spicy potato fritter in a bun.', price: 20, categoryId: snacks.id, isVeg: true, image: imageFor('Wada Pav') },
      { name: 'Wada', description: 'Single spicy potato fritter.', price: 15, categoryId: snacks.id, isVeg: true, image: imageFor('Wada') },
      { name: 'Pav', description: 'Single bread bun.', price: 5, categoryId: snacks.id, isVeg: true, image: imageFor('Pav') },
      { name: 'Pav Bhaji', description: 'Spiced vegetable mash with buns.', price: 150, categoryId: snacks.id, isVeg: true, image: imageFor('Pav Bhaji') },

      // Meals
      { name: 'Misal Pav', description: 'Spicy sprout curry topped with farsan, served with pav.', price: 80, categoryId: meals.id, isVeg: true, image: imageFor('Misal Pav') },
      { name: 'Wada Usal Pav', description: 'Wada served with spicy sprout curry and pav.', price: 80, categoryId: meals.id, isVeg: true, image: imageFor('Wada Usal Pav') },
      { name: 'Aloo Paratha', description: 'Wheat flatbread stuffed with spiced potatoes.', price: 50, categoryId: meals.id, isVeg: true, image: imageFor('Aloo Paratha') },
      { name: 'Gobi Paratha', description: 'Wheat flatbread stuffed with spiced cauliflower.', price: 50, categoryId: meals.id, isVeg: true, image: imageFor('Gobi Paratha') },
      { name: 'Paneer Paratha', description: 'Wheat flatbread stuffed with spiced cottage cheese.', price: 80, categoryId: meals.id, isVeg: true, image: imageFor('Paneer Paratha') },
      { name: 'Methi Paratha', description: 'Wheat flatbread with fresh fenugreek leaves.', price: 50, categoryId: meals.id, isVeg: true, image: imageFor('Methi Paratha') },
      { name: 'Plain Paratha', description: 'Simple layered wheat flatbread.', price: 15, categoryId: meals.id, isVeg: true, image: imageFor('Plain Paratha') },
      { name: 'Chole Puri', description: 'Spicy chickpeas served with 4 fluffy fried puris.', price: 110, categoryId: meals.id, isVeg: true, image: imageFor('Chole Puri') },
      { name: 'Chole Bhature', description: 'Spicy chickpeas served with 2 large bhaturas.', price: 150, categoryId: meals.id, isVeg: true, image: imageFor('Chole Bhature') },
      { name: 'Chole Plate', description: 'A plate of spicy chickpeas (Chole only).', price: 80, categoryId: meals.id, isVeg: true, image: imageFor('Chole Plate') },
      { name: 'Puri Plate', description: 'A plate of 4 fluffy fried puris.', price: 40, categoryId: meals.id, isVeg: true, image: imageFor('Puri Plate') },
      { name: 'Bhatura', description: 'Single large fluffy fried bread.', price: 40, categoryId: meals.id, isVeg: true, image: imageFor('Bhatura') },
      { name: 'Egg Burji + 2 Pav (Single)', description: 'Spiced scrambled eggs served with 2 pav.', price: 40, categoryId: meals.id, isVeg: false, image: imageFor('Egg Burji + 2 Pav (Single)') },
      { name: 'Egg Burji + 2 Pav (Double)', description: 'Double portion spiced scrambled eggs with 2 pav.', price: 80, categoryId: meals.id, isVeg: false, image: imageFor('Egg Burji + 2 Pav (Double)') },
      { name: 'Egg Omelet + 2 Pav (Single)', description: 'Classic spiced omelet served with 2 pav.', price: 40, categoryId: meals.id, isVeg: false, image: imageFor('Egg Omelet + 2 Pav (Single)') },
      { name: 'Egg Omelet + 2 Pav (Double)', description: 'Double portion spiced omelet with 2 pav.', price: 80, categoryId: meals.id, isVeg: false, image: imageFor('Egg Omelet + 2 Pav (Double)') },
      { name: 'Butter Pav', description: 'Single pav toasted with generous butter.', price: 10, categoryId: meals.id, isVeg: true, image: imageFor('Butter Pav') },

      // Beverages
      { name: 'Tea', description: 'Hot traditional Indian masala chai.', price: 15, categoryId: beverages.id, isVeg: true, image: imageFor('Tea') },
      { name: 'Hot Coffee', description: 'Freshly brewed hot coffee.', price: 30, categoryId: beverages.id, isVeg: true, image: imageFor('Hot Coffee') },
      { name: 'Chaas', description: 'Refreshing spiced buttermilk.', price: 20, categoryId: beverages.id, isVeg: true, image: imageFor('Chaas') },
      { name: 'Nimbu Pani', description: 'Classic fresh lime water.', price: 20, categoryId: beverages.id, isVeg: true, image: imageFor('Nimbu Pani') },
      { name: 'Lemon Tea', description: 'Refreshing hot lemon tea.', price: 25, categoryId: beverages.id, isVeg: true, image: imageFor('Lemon Tea') },
      { name: 'Green Tea', description: 'Healthy and soothing hot green tea.', price: 25, categoryId: beverages.id, isVeg: true, image: imageFor('Green Tea') },
      { name: 'Iced Tea', description: 'Chilled lemon infused iced tea.', price: 40, categoryId: beverages.id, isVeg: true, image: imageFor('Iced Tea') },
      { name: 'Watermelon Juice', description: 'Freshly squeezed watermelon juice.', price: 50, categoryId: beverages.id, isVeg: true, image: imageFor('Watermelon Juice') },
      { name: 'Cold Coffee', description: 'Chilled creamy cold coffee.', price: 60, categoryId: beverages.id, isVeg: true, image: imageFor('Cold Coffee') },
      { name: 'Chikoo Milkshake', description: 'Thick and creamy sapota (chikoo) shake.', price: 60, categoryId: beverages.id, isVeg: true, image: imageFor('Chikoo Milkshake') },
      { name: 'Chocolate Milkshake', description: 'Rich and indulgent chocolate shake.', price: 90, categoryId: beverages.id, isVeg: true, image: imageFor('Chocolate Milkshake') },
      { name: 'Mango Milkshake', description: 'Creamy shake made with fresh mangoes.', price: 120, categoryId: beverages.id, isVeg: true, image: imageFor('Mango Milkshake') },

      // Custom
      { name: 'Custom Party Box', description: 'Your selection of snacks and sweets.', price: 999, categoryId: custom.id, isVeg: true, image: imageFor('Custom Party Box') },
    ],
  });

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

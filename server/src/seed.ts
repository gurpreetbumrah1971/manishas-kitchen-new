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

const photoUpdateUrl = (filename: string) => `/food/photo-updates/${filename}.png`;

const categories: CategorySeed[] = [
  { name: 'Beverages', image: '/food/iced-tea.png' },
  { name: 'Biryanis', image: generatedMenuAssetUrl('Veg Biryani') },
  { name: 'Egg Dishes', image: generatedMenuAssetUrl('Single Egg Omelet + 2 Butter Pav') },
  { name: 'Frankies', image: photoUpdateUrl('paneer-frankie') },
  { name: 'Kebabs', image: photoUpdateUrl('chicken-kheema-paratha') },
  { name: 'Pakodas', image: photoUpdateUrl('onion-pakoda') },
  { name: 'Parathas', image: generatedMenuAssetUrl('Aloo Paratha') },
  { name: 'Snacks', image: '/food/poha.png' },
  { name: 'Custom', image: generatedMenuAssetUrl('Custom Party Box') },
];

const menuItems: MenuItemSeed[] = [
  { name: 'Tea', description: 'Hot traditional Indian masala chai.', price: 29, categoryName: 'Beverages', isVeg: true, image: '/food/tea-realistic.png' },
  { name: 'Hot Coffee', description: 'Freshly brewed hot coffee.', price: 39, categoryName: 'Beverages', isVeg: true, image: generatedMenuAssetUrl('Hot Coffee') },
  { name: 'Chaas', description: 'Refreshing spiced buttermilk.', price: 29, categoryName: 'Beverages', isVeg: true, image: generatedMenuAssetUrl('Chaas') },
  { name: 'Nimbu Pani', description: 'Classic fresh lime water.', price: 29, categoryName: 'Beverages', isVeg: true, image: generatedMenuAssetUrl('Nimbu Pani') },
  { name: 'Lemon Tea', description: 'Refreshing hot lemon tea.', price: 39, categoryName: 'Beverages', isVeg: true, image: '/food/lemon-tea.png' },
  { name: 'Green Tea', description: 'Healthy and soothing hot green tea.', price: 39, categoryName: 'Beverages', isVeg: true, image: generatedMenuAssetUrl('Green Tea') },
  { name: 'Iced Tea', description: 'Chilled lemon infused iced tea.', price: 69, categoryName: 'Beverages', isVeg: true, image: '/food/iced-tea.png' },
  { name: 'Watermelon Juice', description: 'Freshly squeezed watermelon juice.', price: 50, categoryName: 'Beverages', isVeg: true, image: generatedMenuAssetUrl('Watermelon Juice') },
  { name: 'Cold Coffee', description: 'Chilled creamy cold coffee.', price: 79, categoryName: 'Beverages', isVeg: true, image: generatedMenuAssetUrl('Cold Coffee') },
  { name: 'Chikoo Milkshake', description: 'Thick and creamy sapota shake.', price: 60, categoryName: 'Beverages', isVeg: true, image: generatedMenuAssetUrl('Chikoo Milkshake') },
  { name: 'Chocolate Milkshake', description: 'Rich and indulgent chocolate shake.', price: 99, categoryName: 'Beverages', isVeg: true, image: generatedMenuAssetUrl('Chocolate Milkshake') },
  { name: 'Mango Milkshake', description: 'Creamy shake made with fresh mangoes.', price: 120, categoryName: 'Beverages', isVeg: true, image: generatedMenuAssetUrl('Mango Milkshake') },
  { name: 'Veg Biryani', description: 'Fragrant rice layered with spiced vegetables.', price: 140, categoryName: 'Biryanis', isVeg: true, image: generatedMenuAssetUrl('Veg Biryani') },
  { name: 'Egg Biryani', description: 'Fragrant rice layered with masala eggs.', price: 160, categoryName: 'Biryanis', isVeg: false, image: photoUpdateUrl('egg-biryani') },
  { name: 'Chicken Dum Biryani', description: 'Slow-cooked dum biryani with tender chicken and aromatic rice.', price: 225, categoryName: 'Biryanis', isVeg: false, image: photoUpdateUrl('chicken-biryani') },
  { name: 'Paneer Biryani', description: 'Aromatic biryani layered with spiced paneer and basmati rice.', price: 225, categoryName: 'Biryanis', isVeg: true, image: photoUpdateUrl('paneer-biryani') },
  { name: 'Single Egg Burjee + 2 Butter Pav', description: 'Spiced scrambled egg served with 2 butter pav.', price: 79, categoryName: 'Egg Dishes', isVeg: false, image: generatedMenuAssetUrl('Single Egg Burjee + 2 Butter Pav') },
  { name: 'Single Egg Omelet + 2 Butter Pav', description: 'Classic spiced omelet served with 2 butter pav.', price: 79, categoryName: 'Egg Dishes', isVeg: false, image: generatedMenuAssetUrl('Single Egg Omelet + 2 Butter Pav') },
  { name: 'Double Egg Burjee + 4 Butter Pav', description: 'Double portion spiced scrambled eggs served with 4 butter pav.', price: 139, categoryName: 'Egg Dishes', isVeg: false, image: generatedMenuAssetUrl('Double Egg Burjee + 4 Butter Pav') },
  { name: 'Double Omelet + 4 Butter Pav', description: 'Double portion spiced omelet served with 4 butter pav.', price: 139, categoryName: 'Egg Dishes', isVeg: false, image: generatedMenuAssetUrl('Double Omelet + 4 Butter Pav') },
  { name: 'Boiled Egg (1 Egg)', description: 'One boiled egg served fresh.', price: 25, categoryName: 'Egg Dishes', isVeg: false, image: generatedMenuAssetUrl('Boiled Egg (1 Egg)') },
  { name: 'Extra Pav', description: 'Additional pav served with egg dishes.', price: 7, categoryName: 'Egg Dishes', isVeg: true, image: generatedMenuAssetUrl('Pav') },
  { name: 'Extra Butter Pav', description: 'Additional butter pav served with egg dishes.', price: 15, categoryName: 'Egg Dishes', isVeg: true, image: generatedMenuAssetUrl('Butter Pav') },
  { name: 'Aloo Frankie', description: 'Soft roll filled with spiced potato and chutney.', price: 79, categoryName: 'Frankies', isVeg: true, image: photoUpdateUrl('paneer-frankie') },
  { name: 'Paneer Frankie', description: 'Soft roll filled with spiced paneer and onions.', price: 139, categoryName: 'Frankies', isVeg: true, image: photoUpdateUrl('paneer-frankie') },
  { name: 'Chicken Frankie', description: 'Soft roll filled with spiced chicken and onions.', price: 139, categoryName: 'Frankies', isVeg: false, image: photoUpdateUrl('chicken-frankie') },
  { name: 'Chicken Galouti Kebab', description: 'Tender minced chicken kebab with aromatic spices.', price: 199, categoryName: 'Kebabs', isVeg: false, image: photoUpdateUrl('chicken-kheema-paratha') },
  { name: 'Chicken Shami Kebab', description: 'Spiced chicken and lentil kebab cooked until tender.', price: 199, categoryName: 'Kebabs', isVeg: false, image: photoUpdateUrl('chicken-kheema-paratha') },
  { name: 'Wada', description: 'Single spicy potato fritter.', price: 29, categoryName: 'Snacks', isVeg: true, image: photoUpdateUrl('wada') },
  { name: 'Wada Pav', description: 'Spicy potato fritter in a bun.', price: 29, categoryName: 'Snacks', isVeg: true, image: photoUpdateUrl('wada-pav') },
  { name: 'Onion Pakoda', description: 'Crisp onion fritters with house masala.', price: 69, categoryName: 'Pakodas', isVeg: true, image: photoUpdateUrl('onion-pakoda') },
  { name: 'Paneer Pakoda', description: 'Crisp paneer fritters with house masala.', price: 109, categoryName: 'Pakodas', isVeg: true, image: generatedMenuAssetUrl('Paneer Paratha') },
  { name: 'Moong Dal Pakoda', description: 'Crisp moong dal fritters with house masala.', price: 69, categoryName: 'Pakodas', isVeg: true, image: photoUpdateUrl('moong-dal-pakoda') },
  { name: 'Chana Daal Pakoda', description: 'Crisp chana dal fritters with house masala.', price: 69, categoryName: 'Pakodas', isVeg: true, image: photoUpdateUrl('chana-dal-pakoda') },
  { name: 'Palak Pakoda', description: 'Crisp spinach fritters with house masala.', price: 69, categoryName: 'Pakodas', isVeg: true, image: photoUpdateUrl('palak-paratha') },
  { name: 'Aloo Paratha', description: 'Wheat flatbread stuffed with spiced potatoes.', price: 69, categoryName: 'Parathas', isVeg: true, image: generatedMenuAssetUrl('Aloo Paratha') },
  { name: 'Gobi Paratha', description: 'Wheat flatbread stuffed with spiced cauliflower.', price: 69, categoryName: 'Parathas', isVeg: true, image: photoUpdateUrl('gobi-paratha') },
  { name: 'Paneer Paratha', description: 'Wheat flatbread stuffed with spiced cottage cheese.', price: 109, categoryName: 'Parathas', isVeg: true, image: generatedMenuAssetUrl('Paneer Paratha') },
  { name: 'Methi Paratha', description: 'Wheat flatbread with fresh fenugreek leaves.', price: 69, categoryName: 'Parathas', isVeg: true, image: photoUpdateUrl('methi-paratha') },
  { name: 'Palak Paratha', description: 'Wheat flatbread layered with spiced spinach.', price: 69, categoryName: 'Parathas', isVeg: true, image: photoUpdateUrl('palak-paratha') },
  { name: 'Cabbage Paratha', description: 'Wheat flatbread stuffed with seasoned cabbage.', price: 69, categoryName: 'Parathas', isVeg: true, image: photoUpdateUrl('cabbage-paratha') },
  { name: 'Moong Daal Chilla', description: 'Savory moong dal pancake with mild spices.', price: 69, categoryName: 'Parathas', isVeg: true, image: generatedMenuAssetUrl('Moong Daal Chilla') },
  { name: 'Plain Paratha', description: 'Simple layered wheat flatbread.', price: 29, categoryName: 'Parathas', isVeg: true, image: photoUpdateUrl('plain-paratha') },
  { name: 'Mulli Paratha', description: 'Wheat flatbread stuffed with seasoned radish.', price: 69, categoryName: 'Parathas', isVeg: true, image: photoUpdateUrl('muli-paratha') },
  { name: 'Chicken Kheema Paratha', description: 'Wheat flatbread stuffed with spiced chicken kheema.', price: 129, categoryName: 'Parathas', isVeg: false, image: photoUpdateUrl('chicken-kheema-paratha') },
  { name: 'Corn Cheese Paratha', description: 'Wheat flatbread stuffed with sweet corn and cheese.', price: 109, categoryName: 'Parathas', isVeg: true, image: photoUpdateUrl('corn-cheese-paratha') },
  { name: 'Loki Paratha', description: 'Wheat flatbread stuffed with seasoned vegetables.', price: 69, categoryName: 'Parathas', isVeg: true, image: photoUpdateUrl('loki-paratha') },
  { name: 'Poha', description: 'Flattened rice seasoned with spices.', price: 49, categoryName: 'Snacks', isVeg: true, image: '/food/poha.png' },
  { name: 'Poha Usal', description: 'Poha served with spicy bean curry.', price: 40, categoryName: 'Snacks', isVeg: true, image: generatedMenuAssetUrl('Poha Usal') },
  { name: 'Upma', description: 'Savory semolina porridge.', price: 49, categoryName: 'Snacks', isVeg: true, image: generatedMenuAssetUrl('Upma') },
  { name: 'Idli', description: 'Steamed rice cakes served with chutney.', price: 49, categoryName: 'Snacks', isVeg: true, image: generatedMenuAssetUrl('Uttapam') },
  { name: 'Uttapam', description: 'Thick rice pancake with toppings.', price: 69, categoryName: 'Snacks', isVeg: true, image: generatedMenuAssetUrl('Uttapam') },
  { name: 'Dhokla (Half)', description: 'Steamed gram flour cake (4 pieces).', price: 40, categoryName: 'Snacks', isVeg: true, image: '/food/dhokla.jpeg' },
  { name: 'Dhokla (Full)', description: 'Steamed gram flour cake (8 pieces).', price: 70, categoryName: 'Snacks', isVeg: true, image: '/food/dhokla.jpeg' },
  { name: 'Pav', description: 'Single bread bun.', price: 5, categoryName: 'Snacks', isVeg: true, image: generatedMenuAssetUrl('Pav') },
  { name: 'Pav Bhaji', description: 'Spiced vegetable mash with buns.', price: 150, categoryName: 'Snacks', isVeg: true, image: generatedMenuAssetUrl('Pav Bhaji') },
  { name: 'Chole Puri', description: 'Spicy chickpeas served with 4 fluffy fried puris.', price: 130, categoryName: 'Snacks', isVeg: true, image: '/food/chole-puri.png' },
  { name: 'Chole Bhature', description: 'Spicy chickpeas served with 2 large bhaturas.', price: 150, categoryName: 'Snacks', isVeg: true, image: generatedMenuAssetUrl('Chole Bhature') },
  { name: 'Chole Plate', description: 'A plate of spicy chickpeas (Chole only).', price: 90, categoryName: 'Snacks', isVeg: true, image: generatedMenuAssetUrl('Chole Plate') },
  { name: 'Custom Party Box', description: 'Your selection of snacks and sweets.', price: 999, categoryName: 'Custom', isVeg: true, image: generatedMenuAssetUrl('Custom Party Box') },
];

const retiredMenuItemNames = [
  'Egg Burji + 2 Pav (Single)',
  'Egg Burji + 2 Pav (Double)',
  'Egg Omelet + 2 Pav (Single)',
  'Egg Omelet + 2 Pav (Double)',
  'Mix Pakoda',
  'Misal Pav',
  'Wada Usal Pav',
  'Lorn Paratha',
  'Veg Biryani',
  'Egg Biryani',
  'Chicken Dum Biryani',
  'Paneer Biryani',
  'Custom Party Box',
  'Bhatura',
  'Butter Pav',
  'Puri Plate',
  'Extra Cheese',
  'Chikoo Milkshake',
  'Watermelon Juice',
  'Mango Milkshake',
  'Chole Puri',
  'Chole Bhature',
  'Chole Plate',
  'Pav Bhaji',
  'Pav',
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

async function retireMenuItems() {
  await prisma.foodItem.updateMany({
    where: { name: { in: retiredMenuItemNames } },
    data: { isAvailable: false },
  });
}

async function main() {
  await seedAdmin();
  const categoryByName = await syncCategories();
  await syncMenuItems(categoryByName);
  await retireMenuItems();

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

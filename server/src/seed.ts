import prisma from './prisma';
import bcrypt from 'bcryptjs';

async function main() {
  // Clear existing data
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.foodItem.deleteMany();
  await prisma.category.deleteMany();
  await prisma.admin.deleteMany();

  // Create Admin
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.admin.create({
    data: {
      username: 'admin',
      password: hashedPassword,
    },
  });

  // Create Categories
  const snacks = await prisma.category.create({
    data: { name: 'Snacks', image: 'https://images.unsplash.com/photo-1601050633647-81a3175c20d1?auto=format&fit=crop&q=80&w=400' },
  });
  const meals = await prisma.category.create({
    data: { name: 'Meals', image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=400' },
  });
  const beverages = await prisma.category.create({
    data: { name: 'Beverages', image: 'https://images.unsplash.com/photo-1544145945-f904253d0c7b?auto=format&fit=crop&q=80&w=400' },
  });
  const custom = await prisma.category.create({
    data: { name: 'Custom', image: 'https://images.unsplash.com/photo-1495195129352-aeb325a55b65?auto=format&fit=crop&q=80&w=400' },
  });

  // Create Food Items
  await prisma.foodItem.createMany({
    data: [
      // Snacks
      { name: 'Poha', description: 'Flattened rice seasoned with spices.', price: 30, categoryId: snacks.id, isVeg: true, image: 'https://images.unsplash.com/photo-1626132646525-098869c9b977?auto=format&fit=crop&q=80&w=400' },
      { name: 'Poha Usal', description: 'Poha served with spicy bean curry.', price: 40, categoryId: snacks.id, isVeg: true, image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=400' },
      { name: 'Upma', description: 'Savory semolina porridge.', price: 30, categoryId: snacks.id, isVeg: true, image: 'https://images.unsplash.com/photo-1626132646525-098869c9b977?auto=format&fit=crop&q=80&w=400' },
      { name: 'Uttapam', description: 'Thick rice pancake with toppings.', price: 60, categoryId: snacks.id, isVeg: true, image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=400' },
      { name: 'Dhokla (Half)', description: 'Steamed gram flour cake (4 pieces).', price: 40, categoryId: snacks.id, isVeg: true, image: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&q=80&w=400' },
      { name: 'Dhokla (Full)', description: 'Steamed gram flour cake (8 pieces).', price: 70, categoryId: snacks.id, isVeg: true, image: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&q=80&w=400' },
      { name: 'Wada Pav', description: 'Spicy potato fritter in a bun.', price: 20, categoryId: snacks.id, isVeg: true, image: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&q=80&w=400' },
      { name: 'Wada', description: 'Single spicy potato fritter.', price: 15, categoryId: snacks.id, isVeg: true, image: 'https://images.unsplash.com/photo-1601050633647-81a3175c20d1?auto=format&fit=crop&q=80&w=400' },
      { name: 'Pav', description: 'Single bread bun.', price: 5, categoryId: snacks.id, isVeg: true, image: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&q=80&w=400' },
      { name: 'Pav Bhaji', description: 'Spiced vegetable mash with buns.', price: 150, categoryId: snacks.id, isVeg: true, image: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&q=80&w=400' },
      
      // Meals
      { name: 'Misal Pav', description: 'Spicy sprout curry topped with farsan, served with pav.', price: 80, categoryId: meals.id, isVeg: true, image: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&q=80&w=400' },
      { name: 'Wada Usal Pav', description: 'Wada served with spicy sprout curry and pav.', price: 80, categoryId: meals.id, isVeg: true, image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=400' },
      { name: 'Aloo Paratha', description: 'Wheat flatbread stuffed with spiced potatoes.', price: 50, categoryId: meals.id, isVeg: true, image: 'https://images.unsplash.com/photo-1626132647523-26f5bf380027?auto=format&fit=crop&q=80&w=400' },
      { name: 'Gobi Paratha', description: 'Wheat flatbread stuffed with spiced cauliflower.', price: 50, categoryId: meals.id, isVeg: true, image: 'https://images.unsplash.com/photo-1626132647523-26f5bf380027?auto=format&fit=crop&q=80&w=400' },
      { name: 'Paneer Paratha', description: 'Wheat flatbread stuffed with spiced cottage cheese.', price: 80, categoryId: meals.id, isVeg: true, image: 'https://images.unsplash.com/photo-1626132647523-26f5bf380027?auto=format&fit=crop&q=80&w=400' },
      { name: 'Methi Paratha', description: 'Wheat flatbread with fresh fenugreek leaves.', price: 50, categoryId: meals.id, isVeg: true, image: 'https://images.unsplash.com/photo-1626132647523-26f5bf380027?auto=format&fit=crop&q=80&w=400' },
      { name: 'Plain Paratha', description: 'Simple layered wheat flatbread.', price: 15, categoryId: meals.id, isVeg: true, image: 'https://images.unsplash.com/photo-1626132647523-26f5bf380027?auto=format&fit=crop&q=80&w=400' },
      { name: 'Chole Puri', description: 'Spicy chickpeas served with 4 fluffy fried puris.', price: 110, categoryId: meals.id, isVeg: true, image: 'https://images.unsplash.com/photo-1505253758473-96b7015fcd40?auto=format&fit=crop&q=80&w=400' },
      { name: 'Chole Bhature', description: 'Spicy chickpeas served with 2 large bhaturas.', price: 150, categoryId: meals.id, isVeg: true, image: 'https://images.unsplash.com/photo-1505253758473-96b7015fcd40?auto=format&fit=crop&q=80&w=400' },
      { name: 'Chole Plate', description: 'A plate of spicy chickpeas (Chole only).', price: 80, categoryId: meals.id, isVeg: true, image: 'https://images.unsplash.com/photo-1505253758473-96b7015fcd40?auto=format&fit=crop&q=80&w=400' },
      { name: 'Puri Plate', description: 'A plate of 4 fluffy fried puris.', price: 40, categoryId: meals.id, isVeg: true, image: 'https://images.unsplash.com/photo-1505253758473-96b7015fcd40?auto=format&fit=crop&q=80&w=400' },
      { name: 'Bhatura', description: 'Single large fluffy fried bread.', price: 40, categoryId: meals.id, isVeg: true, image: 'https://images.unsplash.com/photo-1505253758473-96b7015fcd40?auto=format&fit=crop&q=80&w=400' },
      { name: 'Egg Burji + 2 Pav (Single)', description: 'Spiced scrambled eggs served with 2 pav.', price: 40, categoryId: meals.id, isVeg: false, image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&q=80&w=400' },
      { name: 'Egg Burji + 2 Pav (Double)', description: 'Double portion spiced scrambled eggs with 2 pav.', price: 80, categoryId: meals.id, isVeg: false, image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&q=80&w=400' },
      { name: 'Egg Omelet + 2 Pav (Single)', description: 'Classic spiced omelet served with 2 pav.', price: 40, categoryId: meals.id, isVeg: false, image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&q=80&w=400' },
      { name: 'Egg Omelet + 2 Pav (Double)', description: 'Double portion spiced omelet with 2 pav.', price: 80, categoryId: meals.id, isVeg: false, image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&q=80&w=400' },
      { name: 'Butter Pav', description: 'Single pav toasted with generous butter.', price: 10, categoryId: meals.id, isVeg: true, image: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&q=80&w=400' },

      // Beverages      { name: 'Tea', description: 'Hot traditional Indian masala chai.', price: 15, categoryId: beverages.id, isVeg: true, image: 'https://images.unsplash.com/photo-1544145945-f904253d0c7b?auto=format&fit=crop&q=80&w=400' },
      { name: 'Hot Coffee', description: 'Freshly brewed hot coffee.', price: 30, categoryId: beverages.id, isVeg: true, image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=400' },
      { name: 'Chaas', description: 'Refreshing spiced buttermilk.', price: 20, categoryId: beverages.id, isVeg: true, image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=400' },
      { name: 'Nimbu Pani', description: 'Classic fresh lime water.', price: 20, categoryId: beverages.id, isVeg: true, image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=400' },
      { name: 'Lemon Tea', description: 'Refreshing hot lemon tea.', price: 25, categoryId: beverages.id, isVeg: true, image: 'https://images.unsplash.com/photo-1558160074-4d7d8bdf4256?auto=format&fit=crop&q=80&w=400' },
      { name: 'Green Tea', description: 'Healthy and soothing hot green tea.', price: 25, categoryId: beverages.id, isVeg: true, image: 'https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?auto=format&fit=crop&q=80&w=400' },
      { name: 'Iced Tea', description: 'Chilled lemon infused iced tea.', price: 40, categoryId: beverages.id, isVeg: true, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&q=80&w=400' },
      { name: 'Watermelon Juice', description: 'Freshly squeezed watermelon juice.', price: 50, categoryId: beverages.id, isVeg: true, image: 'https://images.unsplash.com/photo-1563229871-841846ffb7aa?auto=format&fit=crop&q=80&w=400' },
      { name: 'Cold Coffee', description: 'Chilled creamy cold coffee.', price: 60, categoryId: beverages.id, isVeg: true, image: 'https://images.unsplash.com/photo-1541167760496-162955ed8a9f?auto=format&fit=crop&q=80&w=400' },
      { name: 'Chikoo Milkshake', description: 'Thick and creamy sapota (chikoo) shake.', price: 60, categoryId: beverages.id, isVeg: true, image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&q=80&w=400' },
      { name: 'Chocolate Milkshake', description: 'Rich and indulgent chocolate shake.', price: 90, categoryId: beverages.id, isVeg: true, image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&q=80&w=400' },
      { name: 'Mango Milkshake', description: 'Creamy shake made with fresh mangoes.', price: 120, categoryId: beverages.id, isVeg: true, image: 'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&q=80&w=400' },

      // Custom
      { name: 'Custom Party Box', description: 'Your selection of snacks and sweets.', price: 999, categoryId: custom.id, isVeg: true, image: 'https://images.unsplash.com/photo-1495195129352-aeb325a55b65?auto=format&fit=crop&q=80&w=400' },
    ],
  });

  console.log('Seed data updated with extensive Beverages list successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

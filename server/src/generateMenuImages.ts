import fs from 'fs';
import path from 'path';
import { renderMenuImageSvg, slugifyMenuImageName } from './utils/menuImages';

const menuItemNames = [
  'Poha Usal',
  'Upma',
  'Uttapam',
  'Wada Pav',
  'Wada',
  'Pav',
  'Pav Bhaji',
  'Wada Usal Pav',
  'Aloo Paratha',
  'Gobi Paratha',
  'Paneer Paratha',
  'Methi Paratha',
  'Plain Paratha',
  'Chole Bhature',
  'Chole Plate',
  'Puri Plate',
  'Bhatura',
  'Egg Burji + 2 Pav (Single)',
  'Egg Burji + 2 Pav (Double)',
  'Egg Omelet + 2 Pav (Single)',
  'Egg Omelet + 2 Pav (Double)',
  'Butter Pav',
  'Hot Coffee',
  'Chaas',
  'Nimbu Pani',
  'Green Tea',
  'Watermelon Juice',
  'Cold Coffee',
  'Chikoo Milkshake',
  'Chocolate Milkshake',
  'Mango Milkshake',
  'Custom Party Box',
  'Veg Biryani',
  'Single Egg Burjee + 2 Butter Pav',
  'Single Egg Omelet + 2 Butter Pav',
  'Double Egg Burjee + 4 Butter Pav',
  'Double Omelet + 4 Butter Pav',
  'Boiled Egg (1 Egg)',
  'Aloo Frankie',
  'Paneer Frankie',
  'Moong Daal Chilla',
];

const outputDirs = [
  path.resolve(__dirname, '../../assets/food/generated'),
  path.resolve(__dirname, '../../client/public/food/generated'),
];

for (const outputDir of outputDirs) {
  fs.mkdirSync(outputDir, { recursive: true });

  for (const name of menuItemNames) {
    const filePath = path.join(outputDir, `${slugifyMenuImageName(name)}.svg`);
    fs.writeFileSync(filePath, renderMenuImageSvg(name), 'utf8');
  }

  console.log(`Generated ${menuItemNames.length} menu images in ${outputDir}`);
}

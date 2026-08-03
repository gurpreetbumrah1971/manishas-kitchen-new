import { cp, mkdir, rm } from 'node:fs/promises';

const staticFiles = ['index.html', 'menu.html', 'checkout.html'];

await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });

for (const file of staticFiles) {
  await cp(file, `dist/${file}`);
}

await cp('assets', 'dist/assets', { recursive: true });

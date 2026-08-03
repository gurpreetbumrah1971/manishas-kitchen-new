import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import apiRoutes from './routes/api';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const publicRootPath = path.resolve(__dirname, '../..');
const clientDistPath = path.resolve(__dirname, '../../client/dist');
const uploadsPath = path.resolve(__dirname, '../uploads');
const publicAssetsPath = path.join(publicRootPath, 'assets');
const sendPublicPage = (res: express.Response, pageName: string) => {
  res.sendFile(path.join(publicRootPath, `${pageName}.html`));
};
const sendAdminApp = (res: express.Response) => {
  res.set('Cache-Control', 'no-store');
  res.sendFile(path.join(clientDistPath, 'index.html'));
};

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsPath));

// API Routes
app.use('/api', apiRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Manisha\'s Kitchen API is running' });
});

if (fs.existsSync(clientDistPath)) {
  app.use('/assets', express.static(path.join(clientDistPath, 'assets')));
}

if (fs.existsSync(publicAssetsPath)) {
  app.use('/assets', express.static(publicAssetsPath));
  app.use('/food', express.static(path.join(publicAssetsPath, 'food')));
}

app.get('/admin/login.php', (req, res) => {
  res.redirect(302, '/admin/login');
});

app.get('/admin/dashboard.php', (req, res) => {
  res.redirect(302, '/admin/dashboard');
});

if (fs.existsSync(clientDistPath)) {
  app.get(/^\/admin(?:\/.*)?$/, (req, res) => {
    sendAdminApp(res);
  });

  app.get('/menu', (req, res) => {
    res.redirect(302, '/menu.html');
  });

  app.get('/checkout', (req, res) => {
    res.redirect(302, '/checkout.html');
  });
}

app.get(['/', '/index.html'], (req, res) => {
  sendPublicPage(res, 'index');
});

app.get(['/menu.html', '/checkout.html'], (req, res) => {
  sendPublicPage(res, path.basename(req.path, '.html'));
});

app.get(['/index.php', '/menu.php', '/checkout.php'], (req, res) => {
  sendPublicPage(res, path.basename(req.path, '.php'));
});

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});

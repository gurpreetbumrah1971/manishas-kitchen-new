# Manisha's Kitchen Order Booking System

A modern, responsive, and full-stack restaurant order booking system for Indian restaurants.

## Features
- **Customer Portal:**
  - Modern Landing Page with hero sections.
  - Interactive Menu with category filtering and search.
  - Dynamic Cart system using React Context.
  - Checkout form with Order Type (Dine-in, Takeaway, Delivery) and WhatsApp notification integration.
- **Admin Dashboard:**
  - Secure Admin Login.
  - Sales Analytics with Chart.js (Weekly sales, Category split).
  - Real-time Order Management (Update status: Pending, Preparing, Completed).
- **Tech Stack:**
  - **Frontend:** React (TypeScript), Vite, Lucide Icons, Chart.js.
  - **Backend:** Node.js (Express), TypeScript, Prisma ORM.
  - **Database:** MySQL.

## Render Deployment

This repo is ready to deploy on Render's free tier as:
- one Node web service serving both the API and React app
- one Render Postgres database

### Steps
1. Push this repository to GitHub.
2. In Render, create a new **Blueprint** from the repository.
3. Render will read `render.yaml` and create:
   - `manishas-kitchen`
   - `manishas-kitchen-db`
4. Open the `manishas-kitchen` URL after deploy. The API health check is available at `/health`.

The first start runs `prisma db push` and seeds the default admin/menu data. The seed is idempotent and will not delete existing orders on later restarts.

### Free Tier Notes
- Render free web services can spin down after inactivity, so the first request after idle time can be slow.
- Render free Postgres databases currently expire after 30 days unless upgraded.

## Local Setup

### Prerequisites
- Node.js (v18+)
- PostgreSQL

### Database Setup
1. Create a PostgreSQL database.
2. Configure `server/.env` with your database credentials:
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/spice_restaurant"
   PORT=5000
   JWT_SECRET="your-secret-key"
   ```

### Installation
1. **Server:**
   ```bash
   cd server
   npm install
   npx prisma generate
   npm run seed        # Populates sample food categories and items
   npm run start
   ```
2. **Client:**
   ```bash
   cd client
   npm install
   npm run dev
   ```

## Admin Credentials
- **Username:** `admin`
- **Password:** `admin123`

## WhatsApp Integration
The system uses the WhatsApp Click-to-Chat API. Upon successful order placement, a WhatsApp window will automatically open with a pre-filled message containing the order details.

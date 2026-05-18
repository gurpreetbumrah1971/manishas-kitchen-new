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

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- MySQL Server (e.g., via XAMPP)

### Database Setup
1. Create a MySQL database named `spice_restaurant`.
2. Configure `server/.env` with your database credentials:
   ```env
   DATABASE_URL="mysql://root:password@localhost:3306/spice_restaurant"
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

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
  - **Database:** PostgreSQL.

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
5. Admin login is available at `/admin/login`.

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
The customer checkout still uses WhatsApp Click-to-Chat as a manual fallback, and the backend can also send automatic admin notifications through the WhatsApp Cloud API when a new order is placed.

Set these environment variables on Render for automatic admin order messages:

```env
WHATSAPP_PHONE_NUMBER_ID="your_meta_phone_number_id"
WHATSAPP_ACCESS_TOKEN="your_meta_whatsapp_access_token"
WHATSAPP_ADMIN_NUMBER="918879630082"
WHATSAPP_API_VERSION="v23.0"
```

Optional, but recommended for production-initiated WhatsApp messages:

```env
WHATSAPP_ADMIN_ORDER_TEMPLATE="your_approved_template_name"
WHATSAPP_TEMPLATE_LANGUAGE="en_US"

# MSG91 WhatsApp customer order confirmation (optional)
# Use numbers with country code and no +, e.g. 919999999999.
MSG91_WHATSAPP_AUTHKEY="your_msg91_whatsapp_authkey"
MSG91_WHATSAPP_SENDER_NUMBER="your_msg91_whatsapp_sender_number"
MSG91_WHATSAPP_TEMPLATE_NAMESPACE="your_msg91_template_namespace"
MSG91_WHATSAPP_ORDER_TEMPLATE="order_confirmation"
MSG91_WHATSAPP_TEMPLATE_LANGUAGE="en"
```

If the WhatsApp credentials are missing or invalid, order creation continues and the server logs the notification failure.

## Order Email Notifications

Every successfully confirmed order is emailed to `gurpreet.bumrah@gmail.com` and `manishaskitchen2026@gmail.com`. Configure these server environment variables to enable sending through Resend:

```env
RESEND_API_KEY="re_your_resend_api_key"
RESEND_FROM_EMAIL="Manisha's Kitchen <orders@your-verified-domain.com>"
```

Verify the sender domain in Resend before deploying. Orders still complete if the email configuration is missing or delivery fails.

# Supabase Setup

This PHP app can store orders, customer details, menu data, and admin settings in Supabase Postgres.

## 1. Create Supabase Project

In Supabase, create a new project and copy the database connection string from:

Project Settings > Database > Connection string

Use the URI format. It looks like:

```env
postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

## 2. Configure Hosting Environment

Set these environment variables on the PHP hosting service:

```env
DB_CONNECTION=pgsql
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

The app creates its tables automatically on first request.

## 3. Important Deployment Note

The current Vercel deployment serves static HTML, so it cannot securely save orders to Supabase by itself.

Use a PHP-capable host for the live app, such as:

- Render Web Service with Docker/PHP
- Railway
- Fly.io
- Shared PHP hosting with environment variable support

Point that PHP app at Supabase using the variables above.

## 4. Admin Exports

After orders are stored, admin exports are available at:

```text
admin/export.php?type=customers
admin/export.php?type=orders
```

These return Excel-compatible CSV files.

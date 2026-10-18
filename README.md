# DE (Defined Energy) — Dark Luxury Clothing Store Backend

A complete, production-ready Node.js & Express REST API powered by **MySQL 8.0** for the DE Dark Luxury streetwear clothing store.

---

## 🌟 Architecture & Features

- **Database**: MySQL 8.0 relational database (`de_clothing_store`) with foreign key constraints, connection pooling, and parameterized queries.
- **REST API**: Clean Express.js backend with structured controllers, routes, and error handling.
- **Dynamic Catalog**: Products and categories are dynamically served from MySQL.
- **Cart & Real-time Orders**: Customers can place orders with multiple items, shipping details, automatic stock updates, and transactional safety (`orders` and `order_items` tables).
- **Authentication**: JWT authentication with `bcryptjs` password hashing for customer accounts and administrators.
- **Admin Management Portal (`/admin.html`)**:
  - Live store statistics (revenue, order counts, catalog items, subscribers).
  - Product catalog management (add new products with image, price, stock; delete items).
  - Order management (view customer details, items, change order status: `pending` → `processing` → `shipped` → `delivered`).
  - View newsletter VIP subscribers.
- **Newsletter Subscription**: Directly stores subscribers in MySQL with duplicate checking.

---

## 🗄️ MySQL Database Structure

| Table | Description |
|---|---|
| `categories` | Product collections (`men`, `women`, `accessories`, `essentials`) |
| `products` | Product catalog with name, slug, price, badge, category, image URL, and stock |
| `users` | Customers and admins with encrypted password hashes (`role: customer / admin`) |
| `orders` | Customer orders, shipping details, total amount, and status |
| `order_items` | Items associated with each order, prices, and quantities |
| `wishlists` | Customer saved wishlist items |
| `newsletter_subscribers` | Email subscribers for marketing and drops |
| `contact_messages` | Inquiries submitted through the contact form |

---

## 🚀 How to Run

### 1. Start the Backend Server
In PowerShell, navigate to the `backend` folder and run:
```powershell
cd backend
npm start
```
The server will start at:
- **Frontend Storefront**: [http://localhost:5000/](http://localhost:5000/)
- **Admin Management Portal**: [http://localhost:5000/admin.html](http://localhost:5000/admin.html)
- **API Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

### 2. (Optional) Re-initialize or Reset the Database
To re-run the schema and re-seed the catalog at any time:
```powershell
cd backend
npm run init-db
```

---

## 🔑 Default Administrator Credentials

Use these credentials to log into the Admin Management Portal at [http://localhost:5000/admin.html](http://localhost:5000/admin.html) or the Account button in the header:

- **Admin Email**: `admin@declothing.com`
- **Admin Password**: `AdminPassword123!`

---

## 📡 REST API Endpoints

### Products & Categories
- `GET /api/products` — Get products (supports `?category=men`, `?search=hoodie`, `?sort=price_asc`)
- `GET /api/products/:id` — Get product by ID
- `POST /api/products` — *(Admin)* Add new product
- `PUT /api/products/:id` — *(Admin)* Update product
- `DELETE /api/products/:id` — *(Admin)* Remove product
- `GET /api/categories` — Get collections list

### Orders
- `POST /api/orders` — Place new customer order (calculates total, saves items, updates inventory)
- `GET /api/orders/my` — *(Auth)* Get current customer's order history
- `GET /api/orders` — *(Admin)* Get all store orders
- `PUT /api/orders/:id/status` — *(Admin)* Update order status (`pending`, `processing`, `shipped`, `delivered`, `cancelled`)

### Authentication
- `POST /api/auth/register` — Create new customer account
- `POST /api/auth/login` — Sign in and receive JWT token
- `GET /api/auth/profile` — Get authenticated user details

### Extras
- `POST /api/newsletter/subscribe` — Subscribe email to newsletter
- `GET /api/newsletter/subscribers` — *(Admin)* View subscribers
- `POST /api/contact` — Submit customer inquiry message
# DE

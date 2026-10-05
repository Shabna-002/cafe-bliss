# ☕ Café Bliss – Complete Online Food Ordering & Cafeteria Operations System

> 🌐 **GitHub Pages Live (Client):** [https://shabna-002.github.io/cafe-bliss/](https://shabna-002.github.io/cafe-bliss/)  
> 📁 **GitHub Repository:** [https://github.com/Shabna-002/cafe-bliss](https://github.com/Shabna-002/cafe-bliss)  
> 🚀 **Deploy on Render:** [![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Shabna-002/cafe-bliss)

A complete, production-ready, full-stack **online food ordering, purchasing, and cafeteria management system** with an SQLite database, Python Flask REST API backend, real-time customer live order tracking, interactive payment gateways, and a secure **Executive Admin Dashboard** for real-time order processing, menu management, and sales analytics.

---

## 🚀 Key Functional Systems

### 🛒 1. Customer Ordering & Checkout Experience
- **Interactive Food Catalog**: 27+ delicacies across 9 categories (Coffee, Tea, Breakfast, Burgers, Pizza, Sandwiches, Snacks, Fresh Juice, Desserts) with appetizing photos, nutritional calories, prep times, veg/non-veg indicators, and bestseller badges.
- **Stock Availability**: Items marked "Out of Stock" in the Admin Dashboard automatically display a red **Sold Out** badge, dim the card, and disable the "Add to Cart" button.
- **Cart Management**: Add items, increase/decrease quantities, remove delicacies, apply coupon codes (`BLISS20`, `STUDENT25`, `WELCOME50`), with automatic calculation of Subtotal, Discount, 5% Tax, and Delivery Fee (Free on orders > $30).
- **Checkout Options**:
  - **Doorstep Delivery** (with address validation)
  - **Takeaway Pickup**
  - **Dine-In at Table** (with dynamic table number selector)
- **Interactive Multi-Method Payment Gateway**:
  - **UPI / QR Code**: Dynamic QR code, Café Bliss UPI ID (`blisscafe@okaxis`), 1-click copy, UPI apps row (GPay, PhonePe, Paytm), customer UPI ID input, and **interactive test simulation buttons** (`Simulate UPI Success` / `Simulate Failed Payment`).
  - **Credit / Debit Cards**: Card number formatting with live Visa/Mastercard/Amex icon detection, cardholder name, expiry date, CVV, and 3D Secure simulation.
  - **Net Banking**: Bank selector across popular financial institutions.
  - **Cash on Delivery / Pay at Counter**: Clear payment instructions upon handover.
- **Payment Status Feedback**:
  - `PAID` (Emerald green verified badge)
  - `PENDING` (Orange processing badge)
  - `FAILED` (Red error banner with descriptive reason and instant retry)
- **Order Confirmation Page / Receipt**:
  - Generates unique Order ID (e.g. `BLISS-104921`).
  - Displays customer details, order type, payment status, itemized breakdown, and estimated preparation time.
  - Direct buttons to **Track Live Order** and **Print Receipt**.

---

### ⏱️ 2. Real-Time Customer Live Order Tracker
- Synchronized directly with the backend SQLite database via polling every 3.5 seconds.
- When the cafeteria owner/chef updates the status in the Admin Dashboard, the customer's tracking stepper advances in real time with an audio chime!
- **5-Stage Order Progression**:
  1. `1. Order Placed` – Order received securely in database.
  2. `2. Confirmed by Cafeteria` – Manager accepted order.
  3. `3. Kitchen Preparing & Brewing` – Baristas and chefs actively cooking.
  4. `4. Ready for Pickup / Out for Delivery` – Sealed and ready at counter or en route with rider.
  5. `5. Order Completed & Enjoyed` – Meal successfully delivered.
- **Recent Orders Bar**: Customers can switch between and track multiple orders placed throughout the day.

---

### 🛡️ 3. Executive Admin Dashboard (`/admin` or `admin.html`)
- **Secure Authentication**: Manager username (`admin`) and password (`bliss123`) with token verification, remember session, and quick demo autofill.
- **Real-Time Live Orders Console**:
  - Auto-polls backend every 3.5 seconds with visual pulse indicator (`🟢 Live Sync Active`).
  - **Synthesized Web Audio Chime**: Dual-tone bell alert plays automatically whenever a new order arrives! (With mute/unmute control).
  - Status progression buttons: **Accept Order** (`Confirmed`) → **Start Preparing** (`Preparing`) → **Mark Ready** (`Ready`) → **Complete Order** (`Completed`) → **Reject / Cancel** (`Cancelled`).
  - Toggle Payment Status (`Paid` / `Pending` / `Failed`).
  - One-click **Print Kitchen Order Ticket (KOT)**: Formatted thermal ticket for chefs and baristas.
  - Search & filter orders by status (`All`, `New`, `Confirmed`, `Preparing`, `Ready`, `Completed`, `Cancelled`) or search by name, phone, Order ID.
- **Cafeteria Menu Manager (Full CRUD)**:
  - Add new delicacies with photos, category, price, prep time, veg/non-veg classification, and badges.
  - Edit existing food items and update prices dynamically.
  - Instant 1-click **In Stock / Out of Stock** toggle switches.
  - Delete delicacies with confirmation.
- **Sales & Revenue Analytics**:
  - Key Performance Indicators: Today's Sales, This Week's Revenue, This Month's Revenue, Total Lifetime Revenue, Total Orders Count, Average Order Value (AOV), and Pending Kitchen Orders.
  - **Responsive 7-Day Revenue Bar Chart** with interactive tooltips.
- **Owner Email Notifications Inbox**:
  - Real-time audit log of every email notification dispatched to `owner@cafebliss.com`.
  - Built-in preview modal showing the exact styled HTML email received by the owner with complete itemized bill and customer contact.

---

## 🗄️ Database Architecture (`cafe.db`)

The backend uses an SQLite database (`cafe.db`) with 6 core tables:

| Table | Purpose |
| :--- | :--- |
| **`orders`** | Stores Order ID, customer name, phone, email, order type, address, table number, JSON items, subtotal, tax, delivery fee, grand total, payment method, payment status (`Paid`, `Pending`, `Failed`), order status (`New`, `Confirmed`, `Preparing`, `Ready`, `Completed`, `Cancelled`), notes, and timestamps. |
| **`food_items`** | Stores delicacy ID, name, category, price, original price, rating, reviews count, veg/non-veg flag, badge, prep time, calories, description, image URL, ingredients JSON, and stock availability flag (`is_available`). |
| **`admin_users`** | Stores manager username, SHA-256 hashed password, and role. |
| **`notifications`** | Stores real-time order alerts, unread status, and creation timestamps for the Admin Dashboard. |
| **`email_logs`** | Stores rich HTML email notifications dispatched to `owner@cafebliss.com` for auditing. |
| **`cafe_settings`** | Stores business settings including tax rate, delivery fee, free delivery threshold, and kitchen status. |

---

## 🔌 REST API Endpoints

### Customer APIs
- `GET /api/menu` – Returns all active menu items.
- `POST /api/orders` – Places a new order, records payment, creates notification, and logs email.
- `GET /api/orders/<order_id>` – Customer tracking query returning live status and timeline.

### Admin APIs
- `POST /api/admin/login` – Manager authentication returning session token.
- `GET /api/admin/orders` – Returns all orders with status and search filters.
- `PATCH /api/admin/orders/<order_id>/status` – Updates order stage (`Confirmed`, `Preparing`, `Ready`, `Completed`, `Cancelled`).
- `PATCH /api/admin/orders/<order_id>/payment` – Updates payment status (`Paid`, `Pending`, `Failed`).
- `GET /api/admin/analytics` – Returns today, weekly, monthly sales and 7-day chart data.
- `GET /api/admin/notifications` – Returns unread count and latest order alerts.
- `GET /api/admin/menu` – Returns all food items for CRUD management.
- `POST /api/admin/menu` – Adds a new food delicacy.
- `PUT /api/admin/menu/<id>` – Updates delicacy details and prices.
- `PATCH /api/admin/menu/<id>/toggle-stock` – Toggles delicacy in-stock vs out-of-stock.
- `DELETE /api/admin/menu/<id>` – Deletes a delicacy from the menu.
- `GET /api/admin/email-logs` – Returns owner email dispatch audit logs.

---

## 💻 How to Run Locally

### Option 1: Run Full-Stack Server with Python & SQLite (Recommended)
```bash
# 1. Run the Python server (Python 3.10+)
py server.py
# (or: python server.py)
```
- Customer Storefront: **`http://localhost:5000`**
- Admin Operations Dashboard: **`http://localhost:5000/admin`**
  - **Username:** `admin`
  - **Password:** `bliss123`

### Option 2: Run Without Server (Offline / Client Mode)
Double-click **`index.html`** or **`admin.html`** directly in any web browser. The application includes a smart fallback engine that stores orders and menu items in `localStorage` when no backend is detected, allowing full demo capabilities even without Python!

---

## ☁️ Deploy to Render

This project is pre-configured for Render full-stack deployment via [`render.yaml`](render.yaml) and [`Procfile`](Procfile):

1. Click 👉 **[Deploy to Render (1-Click)](https://render.com/deploy?repo=https://github.com/Shabna-002/cafe-bliss)**.
2. Sign in with GitHub on Render.
3. Render automatically reads `render.yaml`, installs dependencies from `requirements.txt`, and starts the app with Gunicorn (`gunicorn server:app`).
4. In under 60 seconds, your complete online ordering system and Admin Dashboard will be live on your custom `.onrender.com` URL!

#!/usr/bin/env python3
"""
Café Bliss - Production Backend Server
Complete online food ordering system with SQLite database,
REST APIs, Admin Dashboard, real-time live tracking, and email notifications.
"""

import os
import sys
import json
import sqlite3
import hashlib
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, send_from_directory, render_template

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DB_PATH = os.path.join(BASE_DIR, 'cafe.db')

app = Flask(__name__, static_folder=BASE_DIR, static_url_path='')

# -------------------------------------------------------------
# Database Helper
# -------------------------------------------------------------
def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def hash_password(password):
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Admin Users Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS admin_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'owner',
            created_at TEXT NOT NULL
        )
    ''')

    # 2. Food Items Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS food_items (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            price REAL NOT NULL,
            original_price REAL DEFAULT 0.0,
            rating REAL DEFAULT 4.8,
            reviews_count INTEGER DEFAULT 120,
            is_veg INTEGER DEFAULT 1,
            badge TEXT DEFAULT '',
            prep_time TEXT DEFAULT '10-15 mins',
            calories TEXT DEFAULT '200 kcal',
            description TEXT NOT NULL,
            image TEXT NOT NULL,
            ingredients TEXT DEFAULT '[]',
            is_available INTEGER DEFAULT 1,
            created_at TEXT NOT NULL
        )
    ''')

    # 3. Orders Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id TEXT UNIQUE NOT NULL,
            customer_name TEXT NOT NULL,
            customer_phone TEXT NOT NULL,
            customer_email TEXT,
            order_type TEXT NOT NULL DEFAULT 'delivery',
            address TEXT,
            table_number TEXT,
            items_json TEXT NOT NULL,
            subtotal REAL NOT NULL,
            discount REAL DEFAULT 0.0,
            tax REAL DEFAULT 0.0,
            delivery_fee REAL DEFAULT 0.0,
            total_amount REAL NOT NULL,
            payment_method TEXT NOT NULL,
            payment_status TEXT NOT NULL DEFAULT 'Paid',
            payment_ref TEXT,
            order_status TEXT NOT NULL DEFAULT 'New',
            status_step INTEGER NOT NULL DEFAULT 1,
            estimated_minutes INTEGER DEFAULT 20,
            notes TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    ''')

    # 4. Notifications Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id TEXT NOT NULL,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            is_read INTEGER DEFAULT 0,
            created_at TEXT NOT NULL
        )
    ''')

    # 5. Email Logs Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS email_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id TEXT NOT NULL,
            recipient TEXT NOT NULL,
            subject TEXT NOT NULL,
            body_html TEXT NOT NULL,
            sent_at TEXT NOT NULL,
            status TEXT DEFAULT 'Delivered'
        )
    ''')

    # 6. Cafe Settings Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS cafe_settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )
    ''')

    # Seed Default Admin User
    admin = cursor.execute('SELECT * FROM admin_users WHERE username = ?', ('admin',)).fetchone()
    if not admin:
        cursor.execute(
            'INSERT INTO admin_users (username, password_hash, role, created_at) VALUES (?, ?, ?, ?)',
            ('admin', hash_password('bliss123'), 'owner', datetime.now().isoformat())
        )

    # Seed Default Settings
    default_settings = {
        'cafe_name': 'Café Bliss',
        'owner_email': 'owner@cafebliss.com',
        'tax_rate': '0.05',
        'delivery_fee': '2.50',
        'free_delivery_threshold': '30.00',
        'order_auto_accept': 'false',
        'kitchen_status': 'open'
    }
    for k, v in default_settings.items():
        cursor.execute('INSERT OR IGNORE INTO cafe_settings (key, value) VALUES (?, ?)', (k, v))

    # Seed Food Items if empty
    item_count = cursor.execute('SELECT COUNT(*) as count FROM food_items').fetchone()['count']
    if item_count == 0:
        seed_initial_menu(cursor)

    # Seed sample orders if empty so admin dashboard immediately shows rich analytics
    order_count = cursor.execute('SELECT COUNT(*) as count FROM orders').fetchone()['count']
    if order_count == 0:
        seed_sample_orders(cursor)

    conn.commit()
    conn.close()

def seed_initial_menu(cursor):
    sample_menu = [
        # Coffee
        ("c1", "Bliss Signature Caramel Macchiato", "coffee", 5.49, 6.50, 4.9, 342, 1, "Bestseller", "5 mins", "220 kcal", "Rich freshly pulled espresso layered over velvety steamed milk with house-made Madagascar vanilla and salted butter caramel drizzle.", "https://images.unsplash.com/photo-1485808191629-56ade4608215?auto=format&fit=crop&w=700&q=80", json.dumps(["Double Shot Espresso", "Steamed Whole Milk", "Madagascar Vanilla", "House Salted Caramel"])),
        ("c2", "Artisan Velvet Flat White", "coffee", 4.80, 5.50, 4.8, 215, 1, "Chef's Choice", "4 mins", "140 kcal", "Smooth microfoam milk poured delicately over a dense double ristretto shot crafted from 100% single-origin Ethiopian beans.", "https://images.unsplash.com/photo-1577968897966-3d4325b36b61?auto=format&fit=crop&w=700&q=80", json.dumps(["Double Ristretto", "Microfoam Milk", "Single-origin Arabica"])),
        ("c3", "Nitro Cold Brew with Vanilla Cream", "coffee", 5.95, 6.80, 4.9, 189, 1, "Trending", "3 mins", "90 kcal", "Slow-steeped for 20 hours and infused with food-grade nitrogen for a creamy Guinness-like cascade, crowned with cold sweet cream.", "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=700&q=80", json.dumps(["20hr Cold Brew Coffee", "Nitrogen Infusion", "Sweet Vanilla Cream"])),
        ("c4", "Hazelnut Mocha Supreme", "coffee", 5.75, 6.50, 4.7, 164, 1, "Popular", "5 mins", "280 kcal", "Dark Belgian cocoa blended with double espresso and hazelnut praline syrup, topped with hand-whipped cream and cacao nibs.", "https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=700&q=80", json.dumps(["Espresso", "Belgian Dark Chocolate", "Hazelnut Praline", "Whipped Cream"])),
        ("c5", "Spanish Iced Latte with Condensed Milk", "coffee", 5.25, 6.00, 4.8, 278, 1, "", "4 mins", "190 kcal", "Rich double espresso poured over chilled whole milk and sweetened condensed milk, served over artisanal crystal ice.", "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=700&q=80", json.dumps(["Double Espresso", "Sweet Condensed Milk", "Fresh Whole Milk", "Crystal Ice"])),
        ("c6", "Classic Americano Al Fresco", "coffee", 3.95, 4.50, 4.6, 120, 1, "", "3 mins", "5 kcal", "Crisp double shot of house espresso poured over hot spring water with a smooth crema finish.", "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=700&q=80", json.dumps(["Fresh Espresso", "Filtered Mountain Spring Water"])),

        # Tea
        ("t1", "Royal Masala Chai Pot", "tea", 4.50, 5.20, 4.9, 412, 1, "Bestseller", "6 mins", "130 kcal", "Slow-simmered Assam whole black tea leaves brewed with crushed ginger, green cardamom, Ceylon cinnamon, and rich buffalo milk.", "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=700&q=80", json.dumps(["Assam CTC Tea", "Crushed Green Cardamom", "Fresh Ginger", "Steamed Whole Milk"])),
        ("t2", "Organic Japanese Uji Matcha Latte", "tea", 5.60, 6.40, 4.8, 198, 1, "Trending", "4 mins", "160 kcal", "Ceremonial Grade A Uji green tea matcha whisked with bamboo chasen and folded into velvety oat milk.", "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=700&q=80", json.dumps(["Ceremonial Uji Matcha", "Organic Oat Milk", "Pure Agave Nectar"])),
        ("t3", "Hibiscus Berry Bliss Infusion", "tea", 4.75, 5.50, 4.7, 134, 1, "", "5 mins", "45 kcal", "Caffeine-free tart wild Egyptian hibiscus blossoms steeped with crushed organic raspberries, mint leaves, and raw honey.", "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=700&q=80", json.dumps(["Dried Hibiscus Flowers", "Organic Raspberries", "Fresh Spearmint", "Wildflower Honey"])),

        # Breakfast
        ("b1", "Avocado Sourdough Toast Royale", "breakfast", 8.95, 10.50, 4.8, 290, 1, "Chef's Choice", "8 mins", "360 kcal", "Artisan toasted levain sourdough topped with smashed Hass avocado, Persian feta, heirloom radish, toasted dukkah seeds, and chili flakes.", "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=700&q=80", json.dumps(["Rustic Sourdough", "Hass Avocado", "Greek Feta", "Pomegranate Seeds", "Za'atar Dukkah"])),
        ("b2", "Golden Berry Buttermilk Pancakes", "breakfast", 9.50, 11.00, 4.9, 310, 1, "Popular", "10 mins", "480 kcal", "Triple-stack fluffy buttermilk pancakes crowned with fresh blueberries, whipped maple mascarpone, and pure Canadian amber syrup.", "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=700&q=80", json.dumps(["Fluffy Buttermilk Pancakes", "Blueberries & Strawberries", "Maple Mascarpone", "Pure Maple Syrup"])),
        ("b3", "Smoked Salmon Eggs Benedict", "breakfast", 11.25, 13.00, 4.9, 185, 0, "Bestseller", "12 mins", "520 kcal", "Poached pasture-raised farm eggs and Norwegian smoked salmon on toasted English muffins, draped in velvety house hollandaise sauce.", "https://images.unsplash.com/photo-1608039829572-78524f79c4c7?auto=format&fit=crop&w=700&q=80", json.dumps(["English Muffins", "Norwegian Smoked Salmon", "Poached Eggs", "Lemon Hollandaise Sauce"])),

        # Burgers
        ("bg1", "Truffle Mushroom Angus Burger", "burgers", 12.95, 14.50, 4.9, 360, 0, "Bestseller", "14 mins", "680 kcal", "Prime Black Angus smash patty, melted aged Gruyère cheese, sautéed wild porcini mushrooms, and black truffle aioli in a brioche bun.", "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80", json.dumps(["Black Angus Beef Patty", "Aged Gruyère", "Sautéed Wild Mushrooms", "Truffle Aioli", "Brioche Bun"])),
        ("bg2", "Fiery Paneer & Avocado Brioche Burger", "burgers", 10.95, 12.50, 4.7, 245, 1, "Popular", "12 mins", "590 kcal", "Crisp golden spiced cottage cheese steak tossed in peri-peri glaze with sliced avocado, crisp iceberg, and chipotle lime crema.", "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=700&q=80", json.dumps(["Crispy Paneer Steak", "Peri-Peri Glaze", "Avocado", "Chipotle Mayo", "Sesame Brioche"])),
        ("bg3", "BBQ Crispy Chicken Crunch Burger", "burgers", 11.50, 13.00, 4.8, 280, 0, "Trending", "13 mins", "640 kcal", "Buttermilk fried golden chicken thigh coated in smoky bourbon BBQ glaze, apple slaw, and house dill pickles.", "https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=700&q=80", json.dumps(["Crispy Buttermilk Chicken", "Smoky Bourbon BBQ", "Apple Cider Slaw", "Pickles"])),

        # Pizza
        ("pz1", "Neapolitan Burrata Margherita", "pizza", 13.50, 15.00, 4.9, 410, 1, "Bestseller", "15 mins", "650 kcal", "Slow-fermented wood-fired crust, San Marzano tomato sauce, torn creamy fresh burrata, sweet basil, and extra virgin olive oil.", "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=700&q=80", json.dumps(["Slow-Fermented Dough", "San Marzano DOP Tomatoes", "Creamy Burrata", "Fresh Sweet Basil"])),
        ("pz2", "Rustic Pepperoni & Hot Honey Pizza", "pizza", 14.50, 16.50, 4.9, 395, 0, "Chef's Choice", "15 mins", "740 kcal", "Crispy cupped artisanal pepperoni slices, whole-milk mozzarella, crushed red pepper flakes, and hot habanero wildflower honey.", "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=700&q=80", json.dumps(["Handmade Crust", "Artisan Pepperoni", "Fior di Latte", "Spicy Infused Honey"])),
        ("pz3", "Garden Harvest Pesto & Artichoke", "pizza", 12.80, 14.20, 4.7, 180, 1, "", "14 mins", "580 kcal", "Genovese basil pesto base, grilled Roman artichokes, sun-dried cherry tomatoes, kalamata olives, and creamy goat cheese.", "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=700&q=80", json.dumps(["House Basil Pesto", "Grilled Artichokes", "Sun-dried Tomatoes", "Goat Cheese"])),

        # Sandwiches
        ("sw1", "Grilled Caprese Panini", "sandwiches", 8.50, 9.80, 4.8, 220, 1, "Popular", "8 mins", "420 kcal", "Crispy pressed ciabatta layered with fresh buffalo mozzarella, vine tomatoes, basil pesto, and aged Modena balsamic glaze.", "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=700&q=80", json.dumps(["Artisan Ciabatta", "Buffalo Mozzarella", "Fresh Pesto", "Balsamic Glaze"])),
        ("sw2", "Smoked Turkey & Bacon Club", "sandwiches", 9.75, 11.50, 4.8, 195, 0, "Bestseller", "9 mins", "510 kcal", "Triple-decker sourdough with tender smoked turkey breast, applewood smoked bacon, romaine lettuce, tomatoes, and garlic aioli.", "https://images.unsplash.com/photo-1553909489-cd47e0907980?auto=format&fit=crop&w=700&q=80", json.dumps(["Smoked Turkey Breast", "Crispy Bacon", "Sliced Avocado", "Herb Garlic Aioli"])),

        # Snacks
        ("sk1", "Truffle Parmesan Hand-Cut Fries", "snacks", 5.95, 7.00, 4.9, 440, 1, "Bestseller", "7 mins", "380 kcal", "Crisp golden Idaho potatoes tossed in white truffle oil, freshly grated 24-month Parmigiano-Reggiano, and rosemary sea salt.", "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=700&q=80", json.dumps(["Hand-Cut Russet Potatoes", "White Truffle Oil", "Parmigiano-Reggiano", "Rosemary Salt"])),
        ("sk2", "Crispy Golden Falafel Bites (6 pcs)", "snacks", 6.25, 7.50, 4.7, 185, 1, "", "6 mins", "310 kcal", "Herbed chickpea croquettes golden fried to perfection, served with house garlic lemon tahini dip and pickled turnips.", "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=700&q=80", json.dumps(["Herbed Chickpeas", "Sesame Tahini Dip", "Parsley", "Pickled Turnips"])),

        # Fresh Juice
        ("j1", "Sunshine Citrus Detox Refresher", "fresh-juice", 4.95, 5.80, 4.8, 160, 1, "Popular", "4 mins", "110 kcal", "Cold-pressed Valencia oranges, ruby red grapefruit, fresh carrot juice, grated turmeric, and ginger kick.", "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=700&q=80", json.dumps(["Valencia Oranges", "Grapefruit", "Ginger Root", "Fresh Turmeric"])),
        ("j2", "Green Goddess Vitality Tonic", "fresh-juice", 5.50, 6.50, 4.9, 210, 1, "Trending", "4 mins", "95 kcal", "Cold-pressed curly kale, Granny Smith apple, English cucumber, celery, fresh mint, and zesty Key lime.", "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=700&q=80", json.dumps(["Organic Kale", "Granny Smith Apple", "Cucumber", "Lime", "Fresh Mint"])),

        # Desserts
        ("d1", "Belgian Molten Chocolate Lava Cake", "desserts", 6.95, 8.00, 4.9, 520, 1, "Bestseller", "8 mins", "460 kcal", "Warm dark chocolate cake with a rich molten Belgian chocolate center, served with Madagascan bourbon vanilla bean gelato.", "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=700&q=80", json.dumps(["Callebaut 70% Dark Chocolate", "French Butter", "Vanilla Bean Gelato", "Fresh Berries"])),
        ("d2", "New York Salted Caramel Cheesecake", "desserts", 6.50, 7.50, 4.8, 380, 1, "Chef's Choice", "3 mins", "420 kcal", "Silky Philadelphia cream cheese on a buttery graham cracker crust, topped with house burnt caramel and Maldon sea salt flakes.", "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=700&q=80", json.dumps(["Philadelphia Cream Cheese", "Graham Cracker Base", "Salted Butter Caramel", "Maldon Salt"])),
        ("d3", "Artisan Almond Butter Croissant", "desserts", 4.25, 5.00, 4.7, 290, 1, "Popular", "3 mins", "340 kcal", "Flaky French puff pastry laminated with pure butter, filled with rich almond frangipane cream and topped with toasted almond slices.", "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=700&q=80", json.dumps(["French Butter Pastry", "Almond Frangipane", "Toasted Almond Flakes", "Powdered Sugar"]))
    ]

    now_str = datetime.now().isoformat()
    for item in sample_menu:
        cursor.execute('''
            INSERT INTO food_items (
                id, name, category, price, original_price, rating, reviews_count,
                is_veg, badge, prep_time, calories, description, image, ingredients, is_available, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
        ''', (*item, now_str))

def seed_sample_orders(cursor):
    sample_orders = [
        {
            "order_id": "BLISS-104921",
            "customer_name": "Samantha Hayes",
            "customer_phone": "+1 (555) 349-2810",
            "customer_email": "samantha.hayes@example.com",
            "order_type": "delivery",
            "address": "42 Artisan Boulevard, Apt 4B, Metro City",
            "table_number": "",
            "items": [
                {"id": "c1", "name": "Bliss Signature Caramel Macchiato", "price": 5.49, "quantity": 2},
                {"id": "b1", "name": "Avocado Sourdough Toast Royale", "price": 8.95, "quantity": 1}
            ],
            "subtotal": 19.93,
            "discount": 0.0,
            "tax": 1.00,
            "delivery_fee": 2.50,
            "total_amount": 23.43,
            "payment_method": "UPI / GPay",
            "payment_status": "Paid",
            "payment_ref": "UPI-839210498210",
            "order_status": "Preparing",
            "status_step": 3,
            "estimated_minutes": 12,
            "notes": "Please extra caramel drizzle",
            "created_at": (datetime.now() - timedelta(minutes=14)).isoformat()
        },
        {
            "order_id": "BLISS-104920",
            "customer_name": "Marcus Vance",
            "customer_phone": "+1 (555) 782-9901",
            "customer_email": "marcus.v@example.com",
            "order_type": "dinein",
            "address": "",
            "table_number": "7",
            "items": [
                {"id": "bg1", "name": "Truffle Mushroom Angus Burger", "price": 12.95, "quantity": 1},
                {"id": "sk1", "name": "Truffle Parmesan Hand-Cut Fries", "price": 5.95, "quantity": 1},
                {"id": "c3", "name": "Nitro Cold Brew with Vanilla Cream", "price": 5.95, "quantity": 1}
            ],
            "subtotal": 24.85,
            "discount": 2.50,
            "tax": 1.12,
            "delivery_fee": 0.0,
            "total_amount": 23.47,
            "payment_method": "Credit Card",
            "payment_status": "Paid",
            "payment_ref": "CARD-48201948",
            "order_status": "Ready",
            "status_step": 4,
            "estimated_minutes": 5,
            "notes": "Dine-in at Table 7",
            "created_at": (datetime.now() - timedelta(minutes=25)).isoformat()
        },
        {
            "order_id": "BLISS-104919",
            "customer_name": "Elena Rostova",
            "customer_phone": "+1 (555) 921-6543",
            "customer_email": "elena.r@example.com",
            "order_type": "pickup",
            "address": "",
            "table_number": "",
            "items": [
                {"id": "pz1", "name": "Neapolitan Burrata Margherita", "price": 13.50, "quantity": 1},
                {"id": "d1", "name": "Belgian Molten Chocolate Lava Cake", "price": 6.95, "quantity": 1}
            ],
            "subtotal": 20.45,
            "discount": 0.0,
            "tax": 1.02,
            "delivery_fee": 0.0,
            "total_amount": 21.47,
            "payment_method": "Apple Pay",
            "payment_status": "Paid",
            "payment_ref": "APL-77401928",
            "order_status": "Completed",
            "status_step": 5,
            "estimated_minutes": 0,
            "notes": "Picked up with thanks",
            "created_at": (datetime.now() - timedelta(hours=2)).isoformat()
        }
    ]

    for ord_data in sample_orders:
        cursor.execute('''
            INSERT INTO orders (
                order_id, customer_name, customer_phone, customer_email,
                order_type, address, table_number, items_json, subtotal, discount,
                tax, delivery_fee, total_amount, payment_method, payment_status,
                payment_ref, order_status, status_step, estimated_minutes, notes,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            ord_data['order_id'], ord_data['customer_name'], ord_data['customer_phone'],
            ord_data['customer_email'], ord_data['order_type'], ord_data['address'],
            ord_data['table_number'], json.dumps(ord_data['items']), ord_data['subtotal'],
            ord_data['discount'], ord_data['tax'], ord_data['delivery_fee'],
            ord_data['total_amount'], ord_data['payment_method'], ord_data['payment_status'],
            ord_data['payment_ref'], ord_data['order_status'], ord_data['status_step'],
            ord_data['estimated_minutes'], ord_data['notes'], ord_data['created_at'], ord_data['created_at']
        ))

        # Also insert notification & email log for sample orders
        cursor.execute('''
            INSERT INTO notifications (order_id, title, message, is_read, created_at)
            VALUES (?, ?, ?, 1, ?)
        ''', (
            ord_data['order_id'],
            f"New Order #{ord_data['order_id']} Received!",
            f"{ord_data['customer_name']} placed a ${ord_data['total_amount']:.2f} ({ord_data['order_type']}) order.",
            ord_data['created_at']
        ))

        email_html = f"""
        <div style="font-family: sans-serif; color: #2d1810; padding: 20px; max-width: 600px; border: 1px solid #ebd9c8; border-radius: 8px;">
            <h2 style="color: #c27835;">Café Bliss – New Order Notification</h2>
            <p><strong>Order ID:</strong> #{ord_data['order_id']}</p>
            <p><strong>Customer:</strong> {ord_data['customer_name']} ({ord_data['customer_phone']})</p>
            <p><strong>Type:</strong> {ord_data['order_type'].upper()}</p>
            <p><strong>Total Amount:</strong> ${ord_data['total_amount']:.2f} ({ord_data['payment_status']})</p>
            <hr style="border: none; border-top: 1px dashed #ebd9c8; margin: 15px 0;">
            <p style="font-size: 13px; color: #7d6b5c;">This is an automated dispatch from Café Bliss Kitchen Engine.</p>
        </div>
        """
        cursor.execute('''
            INSERT INTO email_logs (order_id, recipient, subject, body_html, sent_at, status)
            VALUES (?, ?, ?, ?, ?, 'Delivered')
        ''', (
            ord_data['order_id'],
            'owner@cafebliss.com',
            f"New Order Alert: #{ord_data['order_id']} (${ord_data['total_amount']:.2f})",
            email_html,
            ord_data['created_at']
        ))

# Initialize Database on load
init_db()

# -------------------------------------------------------------
# Static Pages & App Serving
# -------------------------------------------------------------
@app.route('/')
def serve_index():
    return send_from_directory(BASE_DIR, 'index.html')

@app.route('/admin')
@app.route('/admin/')
@app.route('/admin.html')
@app.route('/admin/index.html')
def serve_admin():
    admin_folder = os.path.join(BASE_DIR, 'admin')
    if os.path.exists(os.path.join(admin_folder, 'index.html')):
        return send_from_directory(admin_folder, 'index.html')
    return send_from_directory(BASE_DIR, 'admin.html')

@app.route('/health')
def health_check():
    return jsonify({
        'status': 'healthy',
        'service': 'Cafe Bliss Food Ordering Engine',
        'database': 'SQLite Connected',
        'time': datetime.now().isoformat()
    })

# -------------------------------------------------------------
# Customer Menu API
# -------------------------------------------------------------
@app.route('/api/menu', methods=['GET'])
def get_menu():
    conn = get_db_connection()
    items = conn.execute('SELECT * FROM food_items ORDER BY category, name').fetchall()
    conn.close()

    result = []
    for item in items:
        d = dict(item)
        try:
            d['ingredients'] = json.loads(d.get('ingredients') or '[]')
        except Exception:
            d['ingredients'] = []
        d['isVeg'] = bool(d.pop('is_veg', 1))
        d['isAvailable'] = bool(d.pop('is_available', 1))
        d['originalPrice'] = d.pop('original_price', 0.0)
        d['reviewsCount'] = d.pop('reviews_count', 0)
        d['prepTime'] = d.pop('prep_time', '10 mins')
        result.append(d)

    return jsonify({'success': True, 'items': result})

# -------------------------------------------------------------
# Order Creation & Customer Tracking API
# -------------------------------------------------------------
@app.route('/api/orders', methods=['POST'])
def create_order():
    data = request.get_json() or {}

    customer = data.get('customer') or {}
    customer_name = customer.get('name', '').strip()
    customer_phone = customer.get('phone', '').strip()
    customer_email = customer.get('email', '').strip()
    order_type = data.get('orderType', 'delivery')
    address = customer.get('address', '').strip()
    table_number = customer.get('tableNumber', '').strip()
    items = data.get('items', [])
    totals = data.get('totals', {})
    payment_method = data.get('paymentMethod', 'UPI')
    payment_status = data.get('paymentStatus', 'Paid')
    payment_ref = data.get('paymentRef', f"TXN-{int(datetime.now().timestamp())}")
    notes = data.get('notes', '').strip()

    if not customer_name or not customer_phone:
        return jsonify({'success': False, 'error': 'Name and phone are required'}), 400

    if not items:
        return jsonify({'success': False, 'error': 'Cart cannot be empty'}), 400

    order_id = 'BLISS-' + str(int(datetime.now().timestamp()))[-6:]
    now_str = datetime.now().isoformat()
    est_mins = 20 if order_type == 'delivery' else 15

    subtotal = float(totals.get('subtotal', 0.0))
    discount = float(totals.get('discount', 0.0))
    tax = float(totals.get('tax', 0.0))
    delivery_fee = float(totals.get('deliveryFee', 0.0))
    total_amount = float(totals.get('grandTotal', subtotal + tax + delivery_fee - discount))

    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Insert Order
    cursor.execute('''
        INSERT INTO orders (
            order_id, customer_name, customer_phone, customer_email,
            order_type, address, table_number, items_json, subtotal, discount,
            tax, delivery_fee, total_amount, payment_method, payment_status,
            payment_ref, order_status, status_step, estimated_minutes, notes,
            created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'New', 1, ?, ?, ?, ?)
    ''', (
        order_id, customer_name, customer_phone, customer_email,
        order_type, address, table_number, json.dumps(items), subtotal, discount,
        tax, delivery_fee, total_amount, payment_method, payment_status,
        payment_ref, est_mins, notes, now_str, now_str
    ))

    # 2. Insert Real-Time Notification for Admin
    cursor.execute('''
        INSERT INTO notifications (order_id, title, message, is_read, created_at)
        VALUES (?, ?, ?, 0, ?)
    ''', (
        order_id,
        f"🚨 New Order Placed: #{order_id}",
        f"{customer_name} ordered {len(items)} delicacy item(s) for ${total_amount:.2f} ({order_type.upper()}). Payment: {payment_status}.",
        now_str
    ))

    # 3. Dispatch Owner Email Notification Log
    items_html_rows = "".join([
        f"<tr><td style='padding: 6px 12px; border-bottom: 1px solid #ebd9c8;'>{item.get('quantity', 1)}x {item.get('name', 'Item')}</td>"
        f"<td style='padding: 6px 12px; border-bottom: 1px solid #ebd9c8; text-align: right;'>${(item.get('price', 0) * item.get('quantity', 1)):.2f}</td></tr>"
        for item in items
    ])

    email_html = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #faf6f0; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); border: 1px solid #ebd9c8;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #2d1810 0%, #4a2818 100%); color: #ffffff; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; color: #df9e58;">☕ Café Bliss Kitchen Engine</h1>
          <p style="margin: 6px 0 0 0; color: #d6c7b9; font-size: 14px;">Instant Owner Order Notification</p>
        </div>

        <!-- Body -->
        <div style="padding: 24px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
            <div style="font-size: 18px; font-weight: bold; color: #2d1810;">Order ID: <span style="color: #c27835;">#{order_id}</span></div>
            <div style="background: #e8f5e9; color: #2e7d32; font-weight: bold; padding: 4px 12px; border-radius: 20px; font-size: 13px;">{payment_status.upper()}</div>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
            <tr><td style="padding: 4px 0; color: #7d6b5c;">Customer Name:</td><td style="font-weight: 600; color: #2d1810;">{customer_name}</td></tr>
            <tr><td style="padding: 4px 0; color: #7d6b5c;">Phone Number:</td><td style="font-weight: 600; color: #2d1810;">{customer_phone}</td></tr>
            <tr><td style="padding: 4px 0; color: #7d6b5c;">Email:</td><td style="font-weight: 600; color: #2d1810;">{customer_email or 'N/A'}</td></tr>
            <tr><td style="padding: 4px 0; color: #7d6b5c;">Order Type:</td><td style="font-weight: 600; color: #c27835; text-transform: uppercase;">{order_type}</td></tr>
            {f'<tr><td style="padding: 4px 0; color: #7d6b5c;">Delivery Address:</td><td style="font-weight: 600; color: #2d1810;">{address}</td></tr>' if order_type == 'delivery' else ''}
            {f'<tr><td style="padding: 4px 0; color: #7d6b5c;">Table Number:</td><td style="font-weight: 600; color: #2d1810;">Table #{table_number}</td></tr>' if order_type == 'dinein' else ''}
            <tr><td style="padding: 4px 0; color: #7d6b5c;">Payment Method:</td><td style="font-weight: 600; color: #2d1810;">{payment_method} ({payment_ref})</td></tr>
          </table>

          <h3 style="color: #2d1810; margin-bottom: 10px; border-bottom: 2px solid #ebd9c8; padding-bottom: 6px;">Ordered Items</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
            <thead>
              <tr style="background: #faf6f0; color: #7d6b5c; text-align: left;">
                <th style="padding: 8px 12px;">Delicacy</th>
                <th style="padding: 8px 12px; text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items_html_rows}
            </tbody>
          </table>

          <!-- Financial Breakdown -->
          <div style="background: #faf6f0; padding: 14px; border-radius: 8px; font-size: 14px; line-height: 1.6;">
            <div style="display: flex; justify-content: space-between;"><span>Subtotal:</span><span>${subtotal:.2f}</span></div>
            {f'<div style="display: flex; justify-content: space-between; color: #2e7d32;"><span>Discount:</span><span>-${discount:.2f}</span></div>' if discount > 0 else ''}
            <div style="display: flex; justify-content: space-between;"><span>Tax (5%):</span><span>${tax:.2f}</span></div>
            <div style="display: flex; justify-content: space-between;"><span>Delivery Fee:</span><span>{f"${delivery_fee:.2f}" if delivery_fee > 0 else "FREE"}</span></div>
            <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: bold; border-top: 1px dashed #ebd9c8; padding-top: 8px; margin-top: 8px; color: #2d1810;">
              <span>Total Payable:</span>
              <span style="color: #c27835;">${total_amount:.2f}</span>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #f5eee6; padding: 14px 24px; text-align: center; font-size: 12px; color: #7d6b5c; border-top: 1px solid #ebd9c8;">
          Café Bliss • 42 Artisan Boulevard, Coffee Quarter • <a href="mailto:hello@cafebliss.com" style="color: #c27835; text-decoration: none;">hello@cafebliss.com</a>
        </div>
      </div>
    </body>
    </html>
    """

    cursor.execute('''
        INSERT INTO email_logs (order_id, recipient, subject, body_html, sent_at, status)
        VALUES (?, ?, ?, ?, ?, 'Delivered')
    ''', (
        order_id,
        'owner@cafebliss.com',
        f"🚨 New Order Placed: #{order_id} from {customer_name} (${total_amount:.2f})",
        email_html,
        now_str
    ))

    conn.commit()
    conn.close()

    return jsonify({
        'success': True,
        'order': {
            'orderId': order_id,
            'customer': customer,
            'items': items,
            'orderType': order_type,
            'totals': {
                'subtotal': subtotal,
                'discount': discount,
                'tax': tax,
                'deliveryFee': delivery_fee,
                'grandTotal': total_amount
            },
            'paymentMethod': payment_method,
            'paymentStatus': payment_status,
            'paymentRef': payment_ref,
            'orderStatus': 'New',
            'statusStep': 1,
            'estimatedMinutes': est_mins,
            'createdAt': now_str
        }
    })

# -------------------------------------------------------------
# Customer Live Tracking API
# -------------------------------------------------------------
@app.route('/api/orders/<order_id>', methods=['GET'])
def get_order_status(order_id):
    conn = get_db_connection()
    row = conn.execute('SELECT * FROM orders WHERE order_id = ?', (order_id,)).fetchone()
    conn.close()

    if not row:
        return jsonify({'success': False, 'error': f'Order {order_id} not found'}), 404

    d = dict(row)
    try:
        d['items'] = json.loads(d.pop('items_json', '[]'))
    except Exception:
        d['items'] = []

    return jsonify({
        'success': True,
        'order': {
            'orderId': d['order_id'],
            'customerName': d['customer_name'],
            'customerPhone': d['customer_phone'],
            'customerEmail': d['customer_email'],
            'orderType': d['order_type'],
            'address': d['address'],
            'tableNumber': d['table_number'],
            'items': d['items'],
            'subtotal': d['subtotal'],
            'discount': d['discount'],
            'tax': d['tax'],
            'deliveryFee': d['delivery_fee'],
            'totalAmount': d['total_amount'],
            'paymentMethod': d['payment_method'],
            'paymentStatus': d['payment_status'],
            'orderStatus': d['order_status'],
            'statusStep': d['status_step'],
            'estimatedMinutes': d['estimated_minutes'],
            'notes': d['notes'],
            'createdAt': d['created_at'],
            'updatedAt': d['updated_at']
        }
    })

# -------------------------------------------------------------
# Admin Authentication API
# -------------------------------------------------------------
@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()

    if not username or not password:
        return jsonify({'success': False, 'error': 'Username and password required'}), 400

    conn = get_db_connection()
    user = conn.execute('SELECT * FROM admin_users WHERE username = ?', (username,)).fetchone()
    conn.close()

    if not user or user['password_hash'] != hash_password(password):
        return jsonify({'success': False, 'error': 'Invalid username or password'}), 401

    token = hashlib.sha256(f"{username}-{datetime.now().isoformat()}".encode('utf-8')).hexdigest()
    return jsonify({
        'success': True,
        'token': token,
        'user': {
            'username': user['username'],
            'role': user['role']
        }
    })

# -------------------------------------------------------------
# Admin Orders Management API
# -------------------------------------------------------------
@app.route('/api/admin/orders', methods=['GET'])
def get_admin_orders():
    status_filter = request.args.get('status', 'all').strip().lower()
    search_q = request.args.get('q', '').strip().lower()

    conn = get_db_connection()
    query = 'SELECT * FROM orders ORDER BY id DESC'
    rows = conn.execute(query).fetchall()
    conn.close()

    orders_list = []
    for r in rows:
        d = dict(r)
        try:
            d['items'] = json.loads(d.pop('items_json', '[]'))
        except Exception:
            d['items'] = []

        # Filter by status
        if status_filter != 'all':
            if d['order_status'].lower() != status_filter:
                continue

        # Search query filter
        if search_q:
            combined = f"{d['order_id']} {d['customer_name']} {d['customer_phone']} {d['customer_email']}".lower()
            if search_q not in combined:
                continue

        orders_list.append(d)

    return jsonify({'success': True, 'orders': orders_list, 'count': len(orders_list)})

@app.route('/api/admin/orders/<order_id>/status', methods=['PATCH'])
def update_order_status(order_id):
    data = request.get_json() or {}
    new_status = data.get('status', '').strip()

    valid_statuses = {
        'new': 1,
        'confirmed': 2,
        'preparing': 3,
        'ready': 4,
        'completed': 5,
        'cancelled': 0
    }

    status_key = new_status.lower()
    if status_key not in valid_statuses:
        return jsonify({'success': False, 'error': 'Invalid status'}), 400

    step = valid_statuses[status_key]
    normalized_status = new_status.capitalize() if status_key != 'new' else 'New'

    now_str = datetime.now().isoformat()
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
        UPDATE orders
        SET order_status = ?, status_step = ?, updated_at = ?
        WHERE order_id = ?
    ''', (normalized_status, step, now_str, order_id))

    cursor.execute('''
        INSERT INTO notifications (order_id, title, message, is_read, created_at)
        VALUES (?, ?, ?, 1, ?)
    ''', (
        order_id,
        f"Order #{order_id} Status: {normalized_status}",
        f"Order #{order_id} has been moved to '{normalized_status}' stage.",
        now_str
    ))

    conn.commit()
    conn.close()

    return jsonify({
        'success': True,
        'orderId': order_id,
        'newStatus': normalized_status,
        'step': step,
        'updatedAt': now_str
    })

@app.route('/api/admin/orders/<order_id>/payment', methods=['PATCH'])
def update_order_payment(order_id):
    data = request.get_json() or {}
    new_payment_status = data.get('paymentStatus', 'Paid').strip().capitalize()

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE orders
        SET payment_status = ?, updated_at = ?
        WHERE order_id = ?
    ''', (new_payment_status, datetime.now().isoformat(), order_id))
    conn.commit()
    conn.close()

    return jsonify({'success': True, 'orderId': order_id, 'paymentStatus': new_payment_status})

# -------------------------------------------------------------
# Admin Analytics API
# -------------------------------------------------------------
@app.route('/api/admin/analytics', methods=['GET'])
def get_analytics():
    conn = get_db_connection()
    cursor = conn.cursor()

    orders = cursor.execute('SELECT * FROM orders').fetchall()
    items = cursor.execute('SELECT * FROM food_items').fetchall()
    conn.close()

    total_orders = len(orders)
    total_revenue = sum(o['total_amount'] for o in orders if o['order_status'] != 'Cancelled')
    pending_orders = sum(1 for o in orders if o['order_status'] in ['New', 'Confirmed', 'Preparing'])

    # Today's sales
    today_date = datetime.now().date()
    today_orders = []
    weekly_orders = []
    monthly_orders = []

    seven_days_ago = datetime.now() - timedelta(days=7)
    thirty_days_ago = datetime.now() - timedelta(days=30)

    for o in orders:
        if o['order_status'] == 'Cancelled':
            continue
        try:
            ord_date = datetime.fromisoformat(o['created_at'].replace('Z', '')).date()
            ord_dt = datetime.fromisoformat(o['created_at'].replace('Z', ''))
            if ord_date == today_date:
                today_orders.append(o)
            if ord_dt >= seven_days_ago:
                weekly_orders.append(o)
            if ord_dt >= thirty_days_ago:
                monthly_orders.append(o)
        except Exception:
            pass

    today_sales = sum(o['total_amount'] for o in today_orders)
    weekly_sales = sum(o['total_amount'] for o in weekly_orders)
    monthly_sales = sum(o['total_amount'] for o in monthly_orders)
    avg_order_value = (total_revenue / total_orders) if total_orders > 0 else 0.0

    # Sales by day for last 7 days
    daily_chart = []
    for i in range(6, -1, -1):
        day = (datetime.now() - timedelta(days=i)).date()
        day_label = day.strftime('%a %d')
        day_total = 0.0
        day_count = 0
        for o in orders:
            if o['order_status'] == 'Cancelled':
                continue
            try:
                if datetime.fromisoformat(o['created_at'].replace('Z', '')).date() == day:
                    day_total += o['total_amount']
                    day_count += 1
            except Exception:
                pass
        daily_chart.append({'date': day_label, 'revenue': round(day_total, 2), 'orders': day_count})

    return jsonify({
        'success': True,
        'summary': {
            'totalRevenue': round(total_revenue, 2),
            'totalOrders': total_orders,
            'todaySales': round(today_sales, 2),
            'todayOrdersCount': len(today_orders),
            'weeklySales': round(weekly_sales, 2),
            'monthlySales': round(monthly_sales, 2),
            'avgOrderValue': round(avg_order_value, 2),
            'pendingOrders': pending_orders,
            'totalMenuItems': len(items)
        },
        'dailyChart': daily_chart
    })

# -------------------------------------------------------------
# Admin Menu Management CRUD API
# -------------------------------------------------------------
@app.route('/api/admin/menu', methods=['GET'])
def admin_get_menu():
    conn = get_db_connection()
    items = conn.execute('SELECT * FROM food_items ORDER BY id DESC').fetchall()
    conn.close()

    result = []
    for item in items:
        d = dict(item)
        try:
            d['ingredients'] = json.loads(d.get('ingredients') or '[]')
        except Exception:
            d['ingredients'] = []
        d['isVeg'] = bool(d.pop('is_veg', 1))
        d['isAvailable'] = bool(d.pop('is_available', 1))
        d['originalPrice'] = d.pop('original_price', 0.0)
        d['reviewsCount'] = d.pop('reviews_count', 0)
        d['prepTime'] = d.pop('prep_time', '10 mins')
        result.append(d)

    return jsonify({'success': True, 'items': result})

@app.route('/api/admin/menu', methods=['POST'])
def admin_add_food_item():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    category = data.get('category', 'coffee').strip()
    price = float(data.get('price', 0.0))
    original_price = float(data.get('originalPrice', 0.0))
    is_veg = 1 if data.get('isVeg', True) else 0
    badge = data.get('badge', '').strip()
    prep_time = data.get('prepTime', '10 mins').strip()
    calories = data.get('calories', '200 kcal').strip()
    description = data.get('description', '').strip()
    image = data.get('image', '').strip()
    ingredients = json.dumps(data.get('ingredients', []))

    if not name or price <= 0:
        return jsonify({'success': False, 'error': 'Name and valid price are required'}), 400

    if not image:
        image = "https://images.unsplash.com/photo-1509785307050-d4066910ec1e?auto=format&fit=crop&w=700&q=80"

    item_id = 'item_' + str(int(datetime.now().timestamp()))[-6:]
    now_str = datetime.now().isoformat()

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO food_items (
            id, name, category, price, original_price, rating, reviews_count,
            is_veg, badge, prep_time, calories, description, image, ingredients, is_available, created_at
        ) VALUES (?, ?, ?, ?, ?, 5.0, 1, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    ''', (
        item_id, name, category, price, original_price, is_veg, badge, prep_time,
        calories, description, image, ingredients, now_str
    ))
    conn.commit()
    conn.close()

    return jsonify({'success': True, 'itemId': item_id, 'message': f'"{name}" added successfully!'})

@app.route('/api/admin/menu/<item_id>', methods=['PUT'])
def admin_edit_food_item(item_id):
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    category = data.get('category', 'coffee').strip()
    price = float(data.get('price', 0.0))
    original_price = float(data.get('originalPrice', 0.0))
    is_veg = 1 if data.get('isVeg', True) else 0
    badge = data.get('badge', '').strip()
    prep_time = data.get('prepTime', '10 mins').strip()
    calories = data.get('calories', '200 kcal').strip()
    description = data.get('description', '').strip()
    image = data.get('image', '').strip()

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE food_items
        SET name = ?, category = ?, price = ?, original_price = ?,
            is_veg = ?, badge = ?, prep_time = ?, calories = ?, description = ?, image = ?
        WHERE id = ?
    ''', (name, category, price, original_price, is_veg, badge, prep_time, calories, description, image, item_id))
    conn.commit()
    conn.close()

    return jsonify({'success': True, 'itemId': item_id, 'message': 'Delicacy updated successfully!'})

@app.route('/api/admin/menu/<item_id>/toggle-stock', methods=['PATCH'])
def toggle_item_stock(item_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    item = cursor.execute('SELECT is_available, name FROM food_items WHERE id = ?', (item_id,)).fetchone()
    if not item:
        conn.close()
        return jsonify({'success': False, 'error': 'Item not found'}), 404

    new_stock = 0 if item['is_available'] == 1 else 1
    cursor.execute('UPDATE food_items SET is_available = ? WHERE id = ?', (new_stock, item_id))
    conn.commit()
    conn.close()

    return jsonify({
        'success': True,
        'itemId': item_id,
        'isAvailable': bool(new_stock),
        'message': f"'{item['name']}' is now {'In Stock' if new_stock == 1 else 'Out of Stock'}"
    })

@app.route('/api/admin/menu/<item_id>', methods=['DELETE'])
def admin_delete_food_item(item_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM food_items WHERE id = ?', (item_id,))
    conn.commit()
    conn.close()

    return jsonify({'success': True, 'itemId': item_id, 'message': 'Item deleted from menu'})

# -------------------------------------------------------------
# Admin Notifications & Email Logs API
# -------------------------------------------------------------
@app.route('/api/admin/notifications', methods=['GET'])
def get_notifications():
    conn = get_db_connection()
    rows = conn.execute('SELECT * FROM notifications ORDER BY id DESC LIMIT 50').fetchall()
    unread_count = conn.execute('SELECT COUNT(*) as count FROM notifications WHERE is_read = 0').fetchone()['count']
    conn.close()

    return jsonify({
        'success': True,
        'unreadCount': unread_count,
        'notifications': [dict(r) for r in rows]
    })

@app.route('/api/admin/notifications/mark-read', methods=['POST'])
def mark_notifications_read():
    conn = get_db_connection()
    conn.execute('UPDATE notifications SET is_read = 1')
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/admin/email-logs', methods=['GET'])
def get_email_logs():
    conn = get_db_connection()
    rows = conn.execute('SELECT * FROM email_logs ORDER BY id DESC LIMIT 50').fetchall()
    conn.close()
    return jsonify({'success': True, 'emails': [dict(r) for r in rows]})

# -------------------------------------------------------------
# Main Application Launcher
# -------------------------------------------------------------
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"\n☕ Café Bliss Server starting on http://localhost:{port}")
    print(f"📊 Admin Dashboard accessible at: http://localhost:{port}/admin")
    print(f"📁 SQLite Database file: {DB_PATH}\n")
    app.run(host='0.0.0.0', port=port, debug=False)

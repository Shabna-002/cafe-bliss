// ==========================================
// Café Bliss - Data Store & Configuration
// ==========================================

const CAFE_DATA = {
  cafeInfo: {
    name: "Café Bliss",
    tagline: "Fresh Taste, Happy Moments",
    phone: "+1 (555) 234-5678",
    whatsapp: "+15552345678",
    email: "hello@cafebliss.com",
    address: "42 Artisan Boulevard, Coffee Quarter, Metro City, NY 10001",
    hours: {
      weekdays: "Mon - Fri: 7:00 AM - 10:30 PM",
      weekends: "Sat - Sun: 7:30 AM - 11:30 PM",
      kitchenCloses: "Kitchen closes 45 mins before closing"
    },
    socials: {
      instagram: "https://instagram.com",
      facebook: "https://facebook.com",
      twitter: "https://twitter.com",
      pinterest: "https://pinterest.com"
    }
  },

  categories: [
    { id: "all", name: "All Delights", icon: "fa-utensils" },
    { id: "coffee", name: "Coffee", icon: "fa-mug-hot" },
    { id: "tea", name: "Tea", icon: "fa-leaf" },
    { id: "breakfast", name: "Breakfast", icon: "fa-egg" },
    { id: "burgers", name: "Burgers", icon: "fa-burger" },
    { id: "pizza", name: "Pizza", icon: "fa-pizza-slice" },
    { id: "sandwiches", name: "Sandwiches", icon: "fa-bread-slice" },
    { id: "snacks", name: "Snacks", icon: "fa-cookie-bite" },
    { id: "fresh-juice", name: "Fresh Juice", icon: "fa-glass-water" },
    { id: "desserts", name: "Cakes & Desserts", icon: "fa-cake-candles" }
  ],

  menuItems: [
    // --- COFFEE ---
    {
      id: "c1",
      name: "Bliss Signature Caramel Macchiato",
      category: "coffee",
      price: 5.49,
      originalPrice: 6.50,
      rating: 4.9,
      reviewsCount: 342,
      isVeg: true,
      badge: "Bestseller",
      prepTime: "5 mins",
      calories: "220 kcal",
      description: "Rich freshly pulled espresso layered over velvety steamed milk with house-made Madagascar vanilla and salted butter caramel drizzle.",
      image: "https://images.unsplash.com/photo-1485808191629-56ade4608215?auto=format&fit=crop&w=700&q=80",
      ingredients: ["Double Shot Espresso", "Steamed Whole Milk", "Madagascar Vanilla", "House Salted Caramel"]
    },
    {
      id: "c2",
      name: "Artisan Velvet Flat White",
      category: "coffee",
      price: 4.80,
      originalPrice: 5.50,
      rating: 4.8,
      reviewsCount: 215,
      isVeg: true,
      badge: "Chef's Choice",
      prepTime: "4 mins",
      calories: "140 kcal",
      description: "Smooth microfoam milk poured delicately over a dense double ristretto shot crafted from 100% single-origin Ethiopian beans.",
      image: "https://images.unsplash.com/photo-1577968897966-3d4325b36b61?auto=format&fit=crop&w=700&q=80",
      ingredients: ["Double Ristretto", "Microfoam Milk", "Single-origin Arabica"]
    },
    {
      id: "c3",
      name: "Nitro Cold Brew with Vanilla Cream",
      category: "coffee",
      price: 5.95,
      originalPrice: 6.80,
      rating: 4.9,
      reviewsCount: 189,
      isVeg: true,
      badge: "Trending",
      prepTime: "3 mins",
      calories: "90 kcal",
      description: "Slow-steeped for 20 hours and infused with food-grade nitrogen for a creamy Guinness-like cascade, crowned with cold sweet cream.",
      image: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=700&q=80",
      ingredients: ["20hr Cold Brew Coffee", "Nitrogen Infusion", "Sweet Vanilla Cream"]
    },
    {
      id: "c4",
      name: "Hazelnut Mocha Supreme",
      category: "coffee",
      price: 5.75,
      originalPrice: 6.50,
      rating: 4.7,
      reviewsCount: 164,
      isVeg: true,
      badge: "Popular",
      prepTime: "5 mins",
      calories: "280 kcal",
      description: "Single-origin dark cocoa blend, freshly roasted espresso, roasted hazelnut infusion, and whipped cream dusted with Belgian chocolate curls.",
      image: "https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=700&q=80",
      ingredients: ["Espresso", "Dark Belgian Chocolate", "Hazelnut Praline", "Whipped Cream"]
    },

    // --- TEA ---
    {
      id: "t1",
      name: "Royal Masala Chai Latte",
      category: "tea",
      price: 4.25,
      originalPrice: 4.95,
      rating: 4.9,
      reviewsCount: 280,
      isVeg: true,
      badge: "Must Try",
      prepTime: "5 mins",
      calories: "160 kcal",
      description: "Slow-simmered Assam black tea leaves steeped with fresh crushed cardamom, cinnamon bark, cloves, ginger, and rich creamy milk.",
      image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=700&q=80",
      ingredients: ["Assam CTC Tea", "Green Cardamom", "Cinnamon", "Fresh Ginger", "Whole Milk"]
    },
    {
      id: "t2",
      name: "Organic Matcha Green Tea Latte",
      category: "tea",
      price: 5.25,
      originalPrice: 6.00,
      rating: 4.8,
      reviewsCount: 198,
      isVeg: true,
      badge: "Healthy",
      prepTime: "4 mins",
      calories: "130 kcal",
      description: "Ceremonial grade Uji Japanese matcha whisked with oat milk and lightly sweetened with wild blossom honey.",
      image: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=700&q=80",
      ingredients: ["Ceremonial Uji Matcha", "Creamy Oat Milk", "Organic Blossom Honey"]
    },
    {
      id: "t3",
      name: "Hibiscus Berry Bliss Iced Tea",
      category: "tea",
      price: 4.50,
      originalPrice: 5.20,
      rating: 4.7,
      reviewsCount: 145,
      isVeg: true,
      badge: "Refreshing",
      prepTime: "3 mins",
      calories: "70 kcal",
      description: "Ruby red organic hibiscus flowers brewed cold with fresh wild blackberries, mint sprigs, and a dash of zesty lemon.",
      image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=700&q=80",
      ingredients: ["Egyptian Hibiscus", "Wild Berries", "Garden Fresh Mint", "Lemon Slice"]
    },

    // --- BREAKFAST ---
    {
      id: "b1",
      name: "Sunlit Avocado Sourdough Toast",
      category: "breakfast",
      price: 8.95,
      originalPrice: 10.50,
      rating: 4.9,
      reviewsCount: 310,
      isVeg: true,
      badge: "Bestseller",
      prepTime: "8 mins",
      calories: "340 kcal",
      description: "Toasted artisan sourdough loaded with Hass avocado smash, heirloom cherry tomatoes, crumbled feta, pumpkin seeds, and balsamic glaze.",
      image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=700&q=80",
      ingredients: ["Artisan Sourdough", "Hass Avocado", "Greek Feta", "Cherry Tomatoes", "Seeds"]
    },
    {
      id: "b2",
      name: "Classic Eggs Benedict Royale",
      category: "breakfast",
      price: 11.50,
      originalPrice: 13.00,
      rating: 4.8,
      reviewsCount: 225,
      isVeg: false,
      badge: "Chef's Choice",
      prepTime: "12 mins",
      calories: "520 kcal",
      description: "Poached free-range pasture eggs served on warm toasted English muffins with smoked turkey bacon and velvety scratch Hollandaise.",
      image: "https://images.unsplash.com/photo-1608039829572-78524f79c4c7?auto=format&fit=crop&w=700&q=80",
      ingredients: ["Free-range Eggs", "English Muffin", "Smoked Turkey Bacon", "Hollandaise Butter Sauce"]
    },
    {
      id: "b3",
      name: "Golden Fluffy Berry Pancakes",
      category: "breakfast",
      price: 9.25,
      originalPrice: 10.80,
      rating: 4.9,
      reviewsCount: 260,
      isVeg: true,
      badge: "Must Try",
      prepTime: "10 mins",
      calories: "450 kcal",
      description: "Stack of triple fluffy buttermilk hotcakes layered with fresh strawberries, blueberries, cultured whipped butter, and pure Canadian maple syrup.",
      image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=700&q=80",
      ingredients: ["Buttermilk Batter", "Organic Strawberries & Blueberries", "Whipped Butter", "Maple Syrup"]
    },

    // --- BURGERS ---
    {
      id: "bg1",
      name: "Truffle Mushroom Angus Burger",
      category: "burgers",
      price: 12.95,
      originalPrice: 14.50,
      rating: 4.9,
      reviewsCount: 380,
      isVeg: false,
      badge: "Bestseller",
      prepTime: "15 mins",
      calories: "680 kcal",
      description: "Prime Angus beef patty grilled to juicy perfection, topped with sautéed wild portobello mushrooms, aged Swiss Gruyère, and black truffle aioli.",
      image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80",
      ingredients: ["Prime Angus Patty", "Portobello Mushrooms", "Swiss Gruyère", "Black Truffle Aioli", "Brioche Bun"]
    },
    {
      id: "bg2",
      name: "Crunchy Fiery Paneer / Veggie Burger",
      category: "burgers",
      price: 10.50,
      originalPrice: 12.00,
      rating: 4.8,
      reviewsCount: 290,
      isVeg: true,
      badge: "Spicy Hit",
      prepTime: "12 mins",
      calories: "540 kcal",
      description: "Golden panko-crusted spiced cottage cheese patty with pickled jalapeños, crispy iceberg lettuce, tomato slice, and sriracha chipotle mayo.",
      image: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=700&q=80",
      ingredients: ["Crispy Spiced Cottage Cheese", "Brioche Bun", "Jalapeño Relish", "Chipotle Mayo", "Fresh Greens"]
    },
    {
      id: "bg3",
      name: "Smokey BBQ Crispy Chicken Burger",
      category: "burgers",
      price: 11.95,
      originalPrice: 13.50,
      rating: 4.9,
      reviewsCount: 340,
      isVeg: false,
      badge: "Popular",
      prepTime: "14 mins",
      calories: "620 kcal",
      description: "Buttermilk marinated fried chicken breast tossed in hickory smoked BBQ glaze, crowned with purple slaw and melted Vermont cheddar.",
      image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=700&q=80",
      ingredients: ["Crispy Fried Chicken Breast", "Hickory BBQ Glaze", "Purple Cabbage Slaw", "Aged Cheddar"]
    },

    // --- PIZZA ---
    {
      id: "pz1",
      name: "Neapolitan Burrata Margherita Pizza",
      category: "pizza",
      price: 13.50,
      originalPrice: 15.50,
      rating: 4.9,
      reviewsCount: 420,
      isVeg: true,
      badge: "Signature",
      prepTime: "15 mins",
      calories: "720 kcal",
      description: "Wood-fired fermented sourdough crust, San Marzano tomato sauce, torn fresh mozzarella, creamy buffalo burrata ball, fresh basil, and extra virgin olive oil.",
      image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=700&q=80",
      ingredients: ["San Marzano Sauce", "Italian Burrata", "Fresh Mozzarella", "Sweet Basil", "EVOO"]
    },
    {
      id: "pz2",
      name: "Rustic Pepperoni & Hot Honey Pizza",
      category: "pizza",
      price: 14.95,
      originalPrice: 16.80,
      rating: 4.9,
      reviewsCount: 360,
      isVeg: false,
      badge: "Bestseller",
      prepTime: "15 mins",
      calories: "810 kcal",
      description: "Crispy-edged artisanal pepperoni cups, smoked provolone and mozzarella blend, chili flakes, and an addictive drizzle of habanero-infused hot honey.",
      image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=700&q=80",
      ingredients: ["Artisan Pepperoni", "Smoked Provolone", "Crushed Tomatoes", "Wild Hot Honey"]
    },
    {
      id: "pz3",
      name: "Garden Harvest Pesto Pizza",
      category: "pizza",
      price: 12.80,
      originalPrice: 14.20,
      rating: 4.8,
      reviewsCount: 210,
      isVeg: true,
      badge: "Healthy Choice",
      prepTime: "14 mins",
      calories: "650 kcal",
      description: "Fragrant basil pine-nut pesto base, charred bell peppers, kalamata olives, sun-dried tomatoes, artichoke hearts, and creamy goat cheese.",
      image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=700&q=80",
      ingredients: ["Basil Pesto", "Artichoke Hearts", "Kalamata Olives", "Sun-dried Tomatoes", "Goat Cheese"]
    },

    // --- SANDWICHES ---
    {
      id: "sw1",
      name: "Grilled Caprese Pesto Panini",
      category: "sandwiches",
      price: 8.50,
      originalPrice: 9.80,
      rating: 4.8,
      reviewsCount: 230,
      isVeg: true,
      badge: "Popular",
      prepTime: "8 mins",
      calories: "410 kcal",
      description: "Crispy grilled ciabatta bread stuffed with sliced buffalo mozzarella, beefsteak tomatoes, fresh pesto genovese, and aged Modena glaze.",
      image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=700&q=80",
      ingredients: ["Crusty Ciabatta", "Buffalo Mozzarella", "Beefsteak Tomato", "Basil Pesto", "Balsamic"]
    },
    {
      id: "sw2",
      name: "Smoked Turkey & Bacon Club",
      category: "sandwiches",
      price: 9.95,
      originalPrice: 11.50,
      rating: 4.9,
      reviewsCount: 275,
      isVeg: false,
      badge: "Hearty",
      prepTime: "10 mins",
      calories: "530 kcal",
      description: "Triple-decker toasted multigrain bread loaded with slow-smoked herb turkey breast, crisp bacon, avocado slices, butter lettuce, and herb mayo.",
      image: "https://images.unsplash.com/photo-1553909489-cd47e0907980?auto=format&fit=crop&w=700&q=80",
      ingredients: ["Multigrain Bread", "Smoked Turkey", "Crispy Bacon", "Avocado", "Herb Mayo"]
    },
    {
      id: "sw3",
      name: "Mediterranean Falafel Pita Pocket",
      category: "sandwiches",
      price: 8.25,
      originalPrice: 9.50,
      rating: 4.7,
      reviewsCount: 180,
      isVeg: true,
      badge: "Vegan Friendly",
      prepTime: "8 mins",
      calories: "380 kcal",
      description: "Warm Greek pita pocket filled with crispy house chickpea falafels, hummus, diced Persian cucumber salad, and creamy tahini sauce.",
      image: "https://images.unsplash.com/photo-1540713434306-585257e3f348?auto=format&fit=crop&w=700&q=80",
      ingredients: ["Warm Pita Bread", "Handmade Falafels", "Silky Hummus", "Persian Cucumbers", "Tahini"]
    },

    // --- SNACKS ---
    {
      id: "sn1",
      name: "Truffle Parmesan Hand-Cut Fries",
      category: "snacks",
      price: 5.80,
      originalPrice: 6.90,
      rating: 4.9,
      reviewsCount: 390,
      isVeg: true,
      badge: "Addictive",
      prepTime: "6 mins",
      calories: "360 kcal",
      description: "Crispy golden double-fried Russet potato fries tossed in Italian white truffle oil, shaved 24-month Parmigiano-Reggiano, and fresh rosemary.",
      image: "https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=700&q=80",
      ingredients: ["Russet Potatoes", "White Truffle Oil", "Aged Parmesan", "Rosemary Herbs", "Garlic Dip"]
    },
    {
      id: "sn2",
      name: "Stuffed Jalapeño & Cheese Poppers",
      category: "snacks",
      price: 6.40,
      originalPrice: 7.50,
      rating: 4.8,
      reviewsCount: 220,
      isVeg: true,
      badge: "Crispy Hit",
      prepTime: "7 mins",
      calories: "320 kcal",
      description: "Fresh jalapeño peppers hollowed and filled with whipped cream cheese and sharp cheddar, golden crumb breaded and served with cilantro lime dip.",
      image: "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=700&q=80",
      ingredients: ["Fresh Jalapeños", "Cream Cheese", "Sharp Cheddar", "Panko Crumbs", "Lime Crema"]
    },
    {
      id: "sn3",
      name: "Crispy Peri-Peri Chicken Tenders",
      category: "snacks",
      price: 7.95,
      originalPrice: 9.20,
      rating: 4.9,
      reviewsCount: 310,
      isVeg: false,
      badge: "Crunchy",
      prepTime: "9 mins",
      calories: "430 kcal",
      description: "Tender chicken fillets marinated in buttermilk and spices, hand-breaded and dusted with spicy African bird's eye peri-peri seasoning.",
      image: "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=700&q=80",
      ingredients: ["Tender Chicken Breast", "Peri-Peri Seasoning", "Buttermilk Marinade", "Smoky Ranch"]
    },

    // --- FRESH JUICE ---
    {
      id: "fj1",
      name: "Bliss Sunshine Citrus Detox",
      category: "fresh-juice",
      price: 4.95,
      originalPrice: 5.80,
      rating: 4.9,
      reviewsCount: 195,
      isVeg: true,
      badge: "100% Raw",
      prepTime: "4 mins",
      calories: "110 kcal",
      description: "Cold-pressed fresh Valencia oranges, ruby red grapefruit, passionfruit splash, and fresh ginger kick. No added sugars or water.",
      image: "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=700&q=80",
      ingredients: ["Valencia Oranges", "Ruby Grapefruit", "Passionfruit", "Ginger Root"]
    },
    {
      id: "fj2",
      name: "Green Goddess Glow Elixir",
      category: "fresh-juice",
      price: 5.50,
      originalPrice: 6.20,
      rating: 4.8,
      reviewsCount: 160,
      isVeg: true,
      badge: "Superfood",
      prepTime: "4 mins",
      calories: "85 kcal",
      description: "Crisp green Granny Smith apples, organic baby spinach, cucumber, celery ribs, fresh mint leaves, and refreshing lime juice.",
      image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=700&q=80",
      ingredients: ["Green Apple", "Baby Spinach", "English Cucumber", "Celery", "Fresh Lime"]
    },
    {
      id: "fj3",
      name: "Wild Watermelon Mint Cooler",
      category: "fresh-juice",
      price: 4.75,
      originalPrice: 5.50,
      rating: 4.9,
      reviewsCount: 240,
      isVeg: true,
      badge: "Summer Favorite",
      prepTime: "3 mins",
      calories: "90 kcal",
      description: "Sweet chilled seedless crimson watermelon juice blended smoothly with crushed Moroccan spearmint, lime, and black Himalayan salt.",
      image: "https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?auto=format&fit=crop&w=700&q=80",
      ingredients: ["Seedless Watermelon", "Spearmint Leaves", "Fresh Lime", "Himalayan Pink Salt"]
    },

    // --- DESSERTS ---
    {
      id: "d1",
      name: "Belgian Molten Chocolate Lava Cake",
      category: "desserts",
      price: 6.95,
      originalPrice: 8.20,
      rating: 5.0,
      reviewsCount: 512,
      isVeg: true,
      badge: "Decadent",
      prepTime: "10 mins",
      calories: "490 kcal",
      description: "Warm baked dark Belgian chocolate cake with a rich flowing ganache molten core, served with a scoop of Madagascar bean gelato.",
      image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=700&q=80",
      ingredients: ["70% Callebaut Cocoa", "Creamy Butter", "Free-range Eggs", "Vanilla Bean Gelato"]
    },
    {
      id: "d2",
      name: "New York Salted Caramel Cheesecake",
      category: "desserts",
      price: 6.50,
      originalPrice: 7.80,
      rating: 4.9,
      reviewsCount: 388,
      isVeg: true,
      badge: "Signature",
      prepTime: "3 mins",
      calories: "420 kcal",
      description: "Silky Philadelphia cream cheese on a buttery graham cracker crust, topped with house burnt sugar caramel and sea salt flakes.",
      image: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=700&q=80",
      ingredients: ["Philadelphia Cream Cheese", "Graham Cracker Crust", "Sea Salt Caramel"]
    },
    {
      id: "d3",
      name: "Warm Almond Croissant Delight",
      category: "desserts",
      price: 4.95,
      originalPrice: 5.75,
      rating: 4.9,
      reviewsCount: 295,
      isVeg: true,
      badge: "Fresh Baked",
      prepTime: "4 mins",
      calories: "380 kcal",
      description: "Twice-baked French butter croissant filled with rich almond frangipane cream, topped with toasted sliced almonds and powdered sugar.",
      image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=700&q=80",
      ingredients: ["French Butter Pastry", "Almond Frangipane", "Toasted Almond Flakes", "Powdered Sugar"]
    },
    {
      id: "d4",
      name: "Tiramisu Classico Della Casa",
      category: "desserts",
      price: 6.25,
      originalPrice: 7.50,
      rating: 4.9,
      reviewsCount: 330,
      isVeg: true,
      badge: "Authentic",
      prepTime: "3 mins",
      calories: "350 kcal",
      description: "Espresso-soaked Italian Savoiardi ladyfingers layered with whipped mascarpone cream and dusted with raw cocoa.",
      image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=700&q=80",
      ingredients: ["Savoiardi Ladyfingers", "Italian Mascarpone", "Fresh Espresso", "Dutch Cocoa"]
    }
  ],

  specialOffers: [
    {
      id: "off1",
      badge: "Combo Deal",
      title: "Morning Fuel Combo",
      subtitle: "Artisan Coffee + Warm Pastry or Avocado Toast",
      code: "MORNINGFUEL",
      discountText: "Save 30%",
      regularPrice: "$14.45",
      offerPrice: "$9.99",
      image: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=700&q=80",
      description: "Kickstart your day with any signature espresso beverage paired with our freshly baked almond croissant or sunlit avocado toast."
    },
    {
      id: "off2",
      badge: "Student Special",
      title: "Campus Study Grind 25% Off",
      subtitle: "Valid on all Coffee, Sandwiches & Snacks",
      code: "STUDENT25",
      discountText: "Flat 25% Off",
      regularPrice: "Any Order",
      offerPrice: "Min $15",
      image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=700&q=80",
      description: "Fuel your study sessions with fast café Wi-Fi and 25% off all menu essentials. Flash student ID or use code."
    },
    {
      id: "off3",
      badge: "Weekend Craze",
      title: "BOGO Gourmet Pizza Weekend",
      subtitle: "Buy 1 Wood-Fired Pizza, Get 2nd at 50% Off",
      code: "WEEKENDPIZZA",
      discountText: "Buy 1 Get 50% Off",
      regularPrice: "$28.45",
      offerPrice: "$19.99",
      image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=700&q=80",
      description: "Gather your friends every Friday to Sunday! Order any artisan sourdough pizza and enjoy the second one half price."
    },
    {
      id: "off4",
      badge: "Buy 1 Get 1",
      title: "Happy Hour BOGO Brews",
      subtitle: "Every weekday between 4:00 PM - 6:30 PM",
      code: "BOGOBREW",
      discountText: "BOGO Free",
      regularPrice: "$10.98",
      offerPrice: "$5.49",
      image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=700&q=80",
      description: "Bring a companion or double your caffeine hit! Order any large coffee or iced brew and receive a second one on the house."
    }
  ],

  coupons: [
    { code: "BLISS20", discount: 20, type: "percent", desc: "20% off all orders above $20", minOrder: 20 },
    { code: "STUDENT25", discount: 25, type: "percent", desc: "25% student discount on entire menu", minOrder: 15 },
    { code: "WELCOME50", discount: 5.0, type: "flat", desc: "$5 flat discount on your first order", minOrder: 18 },
    { code: "COFFEEFEVER", discount: 3.5, type: "flat", desc: "$3.50 off on Coffee & Dessert combos", minOrder: 12 }
  ],

  gallery: [
    {
      id: "g1",
      category: "coffee",
      title: "Artisan Latte Art Crafting",
      subtitle: "Single-origin pour with rosetta microfoam",
      image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=900&q=80"
    },
    {
      id: "g2",
      category: "interior",
      title: "Warm Rustic Reading Nook",
      subtitle: "Sun-drenched wooden booth seating",
      image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=900&q=80"
    },
    {
      id: "g3",
      category: "food",
      title: "Wood-Fired Neapolitan Sourdough",
      subtitle: "Charred blistered crust & fresh burrata",
      image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=900&q=80"
    },
    {
      id: "g4",
      category: "desserts",
      title: "Fresh Baked Morning Pastries",
      subtitle: "Flaky golden croissants & tarts",
      image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80"
    },
    {
      id: "g5",
      category: "customers",
      title: "Laughter, Friends & Good Moments",
      subtitle: "Cozy afternoon conversations",
      image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80"
    },
    {
      id: "g6",
      category: "kitchen",
      title: "Our Open Sanitized Kitchen",
      subtitle: "Fresh organic ingredients prepared live",
      image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=900&q=80"
    },
    {
      id: "g7",
      category: "food",
      title: "Avocado Sourdough Toast Harmony",
      subtitle: "Heirloom tomatoes & microgreens",
      image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=900&q=80"
    },
    {
      id: "g8",
      category: "coffee",
      title: "Nitro Cold Brew Cascade",
      subtitle: "Slow-steeped 20hr velvety infusion",
      image: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=900&q=80"
    },
    {
      id: "g9",
      category: "interior",
      title: "Evening Amber Fairy Light Patio",
      subtitle: "Outdoor botanical garden dining",
      image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80"
    }
  ],

  reviews: [
    {
      id: "r1",
      name: "Sophia Montgomery",
      title: "Food & Travel Blogger, NYC",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
      rating: 5,
      date: "3 days ago",
      text: "Café Bliss is hands down my favorite sanctuary in town. The Caramel Macchiato is crafted to absolute perfection, and the Truffle Burger melted in my mouth. The warm jazz tunes and glowing amber aesthetic make it impossible to leave!"
    },
    {
      id: "r2",
      name: "Marcus Vance",
      title: "Software Architect & Coffee Enthusiast",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
      rating: 5,
      date: "1 week ago",
      text: "The Wi-Fi is super fast, seating is delightfully cozy, and their Flat White with oat milk hits the spot every single morning. Online ordering and pickup is lightning fast too. A gold standard modern cafeteria!"
    },
    {
      id: "r3",
      name: "Elena Rostova",
      title: "Pastry Connoisseur",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
      rating: 5,
      date: "2 weeks ago",
      text: "The Molten Chocolate Lava Cake paired with their artisanal French press coffee was heavenly. You can tell they use farm-fresh butter and premium Callebaut chocolate. Clean, hygienic, and such gracious staff."
    },
    {
      id: "r4",
      name: "Dr. David K.",
      title: "Local University Professor",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
      rating: 5,
      date: "3 weeks ago",
      text: "We hosted an intimate faculty celebration in their patio garden. The reservations team accommodated all our dietary requests with ease, and the Burrata Pizza was a massive crowd favorite. Exceptional hospitality!"
    }
  ],

  stats: [
    { value: "50,000+", label: "Happy Cups Served", icon: "fa-mug-hot" },
    { value: "35+", label: "Gourmet Recipes", icon: "fa-utensils" },
    { value: "4.9 / 5", label: "Customer Rating", icon: "fa-star" },
    { value: "15 mins", label: "Average Prep Time", icon: "fa-clock" }
  ]
};

// Export to window for global access across scripts
window.CAFE_DATA = CAFE_DATA;

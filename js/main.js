// ==========================================
// Café Bliss - Main Application Controller
// ==========================================

// Global Toast System
const Toast = {
  container: null,

  init() {
    this.container = document.getElementById('toast-container');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.className = 'toast-container';
      this.container.setAttribute('aria-live', 'polite');
      document.body.appendChild(this.container);
    }
  },

  show(message, type = 'info', duration = 3200) {
    if (!this.container) this.init();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type} toast-enter`;

    const iconMap = {
      success: 'fa-circle-check',
      error: 'fa-circle-xmark',
      warning: 'fa-triangle-exclamation',
      info: 'fa-mug-hot'
    };

    toast.innerHTML = `
      <i class="fa-solid ${iconMap[type] || 'fa-info-circle'} toast-icon"></i>
      <span class="toast-text">${message}</span>
      <button class="toast-close" aria-label="Close notification">&times;</button>
    `;

    toast.querySelector('.toast-close').addEventListener('click', () => {
      this.dismiss(toast);
    });

    this.container.appendChild(toast);

    // Auto dismiss
    setTimeout(() => {
      this.dismiss(toast);
    }, duration);
  },

  dismiss(toast) {
    if (!toast || !toast.parentNode) return;
    toast.classList.remove('toast-enter');
    toast.classList.add('toast-exit');
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }
};
window.Toast = Toast;

// App Controller
const BlissApp = {
  activeCategory: 'all',
  activeDiet: 'all', // all, veg, non-veg
  searchQuery: '',
  sortBy: 'featured', // featured, price-low, price-high, rating
  wishlist: [],
  activeGalleryCategory: 'all',
  currentLightboxIndex: 0,
  currentReviewIndex: 0,
  reviewTimer: null,
  currentUser: null,

  init() {
    Toast.init();
    this.loadWishlist();
    this.loadAuthUser();

    // Render components
    this.renderMenuCategories();
    this.renderMenuItems();
    this.renderSpecialOffers();
    this.renderGallery();
    this.renderReviews();
    this.initCountdownTimer();
    this.initHeroStats();

    // Bind all interactions
    this.bindNavigation();
    this.bindSearchAndFilters();
    this.bindModals();
    this.bindReservationForm();
    this.bindContactForm();
    this.bindNewsletter();
    this.bindAuth();
    this.bindScrollEffects();

    // Initialize Subsystems
    if (window.A11yEngine) window.A11yEngine.init();
    if (window.CartEngine) window.CartEngine.init();

    // Remove preloader smoothly
    window.addEventListener('load', () => {
      const preloader = document.getElementById('preloader');
      if (preloader) {
        preloader.classList.add('fade-out');
        setTimeout(() => preloader.style.display = 'none', 500);
      }
    });
  },

  // ------------------------------------------
  // WISHLIST MANAGEMENT
  // ------------------------------------------
  loadWishlist() {
    try {
      const saved = localStorage.getItem('bliss_wishlist');
      if (saved) this.wishlist = JSON.parse(saved);
      this.updateWishlistBadge();
    } catch (e) {
      console.warn('Wishlist load error:', e);
    }
  },

  saveWishlist() {
    try {
      localStorage.setItem('bliss_wishlist', JSON.stringify(this.wishlist));
      this.updateWishlistBadge();
    } catch (e) {}
  },

  toggleWishlist(itemId) {
    const item = window.CAFE_DATA?.menuItems.find(i => i.id === itemId);
    if (!item) return;

    const idx = this.wishlist.indexOf(itemId);
    if (idx > -1) {
      this.wishlist.splice(idx, 1);
      Toast.show(`Removed "${item.name}" from your Favorites`, 'info');
    } else {
      this.wishlist.push(itemId);
      if (window.A11yEngine) window.A11yEngine.playTone(600, 0.08);
      Toast.show(`Saved "${item.name}" to your Favorites ❤️`, 'success');
    }

    this.saveWishlist();
    this.updateItemWishlistButtons();
    this.renderWishlistModal();
  },

  updateWishlistBadge() {
    const badges = document.querySelectorAll('.wishlist-count-badge');
    badges.forEach(b => {
      b.textContent = this.wishlist.length;
      b.style.display = this.wishlist.length > 0 ? 'inline-flex' : 'none';
    });
  },

  updateItemWishlistButtons() {
    document.querySelectorAll('.item-wishlist-btn').forEach(btn => {
      const id = btn.getAttribute('data-id');
      if (this.wishlist.includes(id)) {
        btn.classList.add('active');
        btn.innerHTML = '<i class="fa-solid fa-heart"></i>';
        btn.setAttribute('aria-label', 'Remove from wishlist');
      } else {
        btn.classList.remove('active');
        btn.innerHTML = '<i class="fa-regular fa-heart"></i>';
        btn.setAttribute('aria-label', 'Add to wishlist');
      }
    });
  },

  openWishlistModal() {
    this.renderWishlistModal();
    const modal = document.getElementById('wishlist-modal');
    if (modal) {
      modal.classList.add('active');
      document.body.classList.add('modal-locked');
    }
  },

  renderWishlistModal() {
    const container = document.getElementById('wishlist-items-container');
    const emptyState = document.getElementById('wishlist-empty-state');
    if (!container || !emptyState) return;

    if (this.wishlist.length === 0) {
      container.innerHTML = '';
      emptyState.style.display = 'block';
    } else {
      emptyState.style.display = 'none';
      const items = window.CAFE_DATA.menuItems.filter(i => this.wishlist.includes(i.id));

      container.innerHTML = items.map(item => `
        <div class="wishlist-item-card">
          <img src="${item.image}" alt="${item.name}" class="wishlist-item-thumb" loading="lazy">
          <div class="wishlist-item-details">
            <div class="wishlist-title-row">
              <h4>${item.name}</h4>
              <button class="remove-fav-btn" onclick="BlissApp.toggleWishlist('${item.id}')" title="Remove" aria-label="Remove ${item.name} from favorites">
                <i class="fa-solid fa-times"></i>
              </button>
            </div>
            <p class="wishlist-desc">${item.description.slice(0, 75)}...</p>
            <div class="wishlist-footer">
              <span class="wishlist-price">$${item.price.toFixed(2)}</span>
              <button class="btn btn-primary btn-sm" onclick="CartEngine.addItem('${item.id}'); BlissApp.toggleWishlist('${item.id}');">
                <i class="fa-solid fa-bag-shopping"></i> Move to Cart
              </button>
            </div>
          </div>
        </div>
      `).join('');
    }
  },

  // ------------------------------------------
  // MENU RENDERING & FILTERING
  // ------------------------------------------
  renderMenuCategories() {
    const catContainer = document.getElementById('menu-category-tabs');
    if (!catContainer) return;

    catContainer.innerHTML = window.CAFE_DATA.categories.map(cat => `
      <button class="menu-cat-btn ${cat.id === this.activeCategory ? 'active' : ''}" data-category="${cat.id}">
        <i class="fa-solid ${cat.icon}"></i>
        <span>${cat.name}</span>
      </button>
    `).join('');
  },

  renderMenuItems() {
    const grid = document.getElementById('menu-items-grid');
    const countEl = document.getElementById('menu-results-count');
    if (!grid) return;

    let items = [...window.CAFE_DATA.menuItems];

    // Filter by Category
    if (this.activeCategory !== 'all') {
      items = items.filter(item => item.category === this.activeCategory);
    }

    // Filter by Diet
    if (this.activeDiet === 'veg') {
      items = items.filter(item => item.isVeg === true);
    } else if (this.activeDiet === 'non-veg') {
      items = items.filter(item => item.isVeg === false);
    }

    // Filter by Search Query
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      items = items.filter(item => 
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.ingredients && item.ingredients.some(ing => ing.toLowerCase().includes(q)))
      );
    }

    // Sort items
    if (this.sortBy === 'price-low') {
      items.sort((a, b) => a.price - b.price);
    } else if (this.sortBy === 'price-high') {
      items.sort((a, b) => b.price - a.price);
    } else if (this.sortBy === 'rating') {
      items.sort((a, b) => b.rating - a.rating);
    }

    if (countEl) {
      countEl.textContent = `Showing ${items.length} delicious item${items.length === 1 ? '' : 's'}`;
    }

    if (items.length === 0) {
      grid.innerHTML = `
        <div class="menu-no-results">
          <i class="fa-solid fa-mug-saucer fa-3x"></i>
          <h3>No matching delicacies found</h3>
          <p>Try searching with another keyword or resetting the dietary filters.</p>
          <button class="btn btn-secondary btn-sm" onclick="BlissApp.resetFilters()">Reset All Filters</button>
        </div>
      `;
      return;
    }

    grid.innerHTML = items.map(item => {
      const isFav = this.wishlist.includes(item.id);
      return `
        <article class="food-card" data-id="${item.id}">
          <div class="food-card-img-wrap">
            <img src="${item.image}" alt="${item.name}" class="food-card-img" loading="lazy">
            <div class="food-card-badges">
              <span class="diet-badge ${item.isVeg ? 'veg' : 'non-veg'}" title="${item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}">
                <span class="diet-badge-dot"></span>
              </span>
              ${item.badge ? `<span class="tag-badge">${item.badge}</span>` : ''}
            </div>
            <button class="item-wishlist-btn ${isFav ? 'active' : ''}" data-id="${item.id}" onclick="BlissApp.toggleWishlist('${item.id}')" aria-label="Toggle favorite">
              <i class="fa-${isFav ? 'solid' : 'regular'} fa-heart"></i>
            </button>
            <button class="quick-view-btn" onclick="BlissApp.openQuickView('${item.id}')" aria-label="Quick view of ${item.name}">
              <i class="fa-solid fa-eye"></i> Quick View
            </button>
          </div>
          <div class="food-card-body">
            <div class="food-card-meta">
              <div class="food-rating">
                <i class="fa-solid fa-star"></i>
                <span>${item.rating.toFixed(1)}</span>
                <span class="food-reviews">(${item.reviewsCount})</span>
              </div>
              <div class="food-prep-time">
                <i class="fa-regular fa-clock"></i> ${item.prepTime}
              </div>
            </div>
            <h3 class="food-card-title">${item.name}</h3>
            <p class="food-card-desc">${item.description}</p>
            <div class="food-card-footer">
              <div class="food-price-wrap">
                <span class="food-current-price">$${item.price.toFixed(2)}</span>
                ${item.originalPrice ? `<span class="food-old-price">$${item.originalPrice.toFixed(2)}</span>` : ''}
              </div>
              <div class="food-card-order-action">
                <button class="btn btn-add-cart" onclick="CartEngine.addItem('${item.id}')" aria-label="Add ${item.name} to cart">
                  <i class="fa-solid fa-plus"></i> Add
                </button>
              </div>
            </div>
          </div>
        </article>
      `;
    }).join('');
  },

  resetFilters() {
    this.activeCategory = 'all';
    this.activeDiet = 'all';
    this.searchQuery = '';
    this.sortBy = 'featured';

    const searchInput = document.getElementById('menu-search-input');
    if (searchInput) searchInput.value = '';

    const sortSelect = document.getElementById('menu-sort-select');
    if (sortSelect) sortSelect.value = 'featured';

    document.querySelectorAll('.diet-filter-btn').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-diet') === 'all');
    });

    this.renderMenuCategories();
    this.renderMenuItems();
  },

  openQuickView(itemId) {
    const item = window.CAFE_DATA?.menuItems.find(i => i.id === itemId);
    if (!item) return;

    const modal = document.getElementById('quick-view-modal');
    const content = document.getElementById('quick-view-content');
    if (!modal || !content) return;

    content.innerHTML = `
      <div class="qv-grid">
        <div class="qv-image-wrap">
          <img src="${item.image}" alt="${item.name}" class="qv-image">
          <span class="qv-diet-badge ${item.isVeg ? 'veg' : 'non-veg'}">
            ${item.isVeg ? 'Pure Vegetarian' : 'Non-Vegetarian'}
          </span>
        </div>
        <div class="qv-details">
          <div class="qv-header">
            <span class="qv-category-tag">${item.category.toUpperCase()}</span>
            ${item.badge ? `<span class="qv-highlight-badge">${item.badge}</span>` : ''}
          </div>
          <h2 class="qv-title">${item.name}</h2>
          <div class="qv-rating-row">
            <div class="food-rating">
              <i class="fa-solid fa-star"></i>
              <span>${item.rating.toFixed(1)}</span>
              <span class="food-reviews">(${item.reviewsCount} customer reviews)</span>
            </div>
            <span class="qv-prep"><i class="fa-regular fa-clock"></i> ${item.prepTime}</span>
            <span class="qv-cals"><i class="fa-solid fa-fire"></i> ${item.calories}</span>
          </div>
          <p class="qv-desc">${item.description}</p>
          <div class="qv-ingredients">
            <strong>Key Ingredients:</strong>
            <div class="qv-tags">
              ${(item.ingredients || ['Fresh Daily Ingredients', 'Master Chef Spices']).map(ing => `<span class="qv-tag">${ing}</span>`).join('')}
            </div>
          </div>
          <div class="qv-pricing-action">
            <div class="qv-price-box">
              <span class="qv-price">$${item.price.toFixed(2)}</span>
              ${item.originalPrice ? `<span class="qv-old-price">$${item.originalPrice.toFixed(2)}</span>` : ''}
            </div>
            <div class="qv-add-action">
              <div class="qty-pill">
                <button type="button" id="qv-qty-minus" aria-label="Decrease quantity"><i class="fa-solid fa-minus"></i></button>
                <span id="qv-qty-val" class="qty-count">1</span>
                <button type="button" id="qv-qty-plus" aria-label="Increase quantity"><i class="fa-solid fa-plus"></i></button>
              </div>
              <button class="btn btn-primary" id="qv-add-cart-btn">
                <i class="fa-solid fa-bag-shopping"></i> Add to Order
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    let qvQuantity = 1;
    const qtyVal = content.querySelector('#qv-qty-val');
    content.querySelector('#qv-qty-minus')?.addEventListener('click', () => {
      if (qvQuantity > 1) {
        qvQuantity--;
        qtyVal.textContent = qvQuantity;
      }
    });
    content.querySelector('#qv-qty-plus')?.addEventListener('click', () => {
      qvQuantity++;
      qtyVal.textContent = qvQuantity;
    });

    content.querySelector('#qv-add-cart-btn')?.addEventListener('click', () => {
      CartEngine.addItem(item.id, qvQuantity);
      modal.classList.remove('active');
      document.body.classList.remove('modal-locked');
    });

    modal.classList.add('active');
    document.body.classList.add('modal-locked');
  },

  // ------------------------------------------
  // SPECIAL OFFERS & COUNTDOWN TIMER
  // ------------------------------------------
  renderSpecialOffers() {
    const offersGrid = document.getElementById('offers-cards-grid');
    if (!offersGrid) return;

    offersGrid.innerHTML = window.CAFE_DATA.specialOffers.map(offer => `
      <div class="offer-card glass-card">
        <div class="offer-img-box">
          <img src="${offer.image}" alt="${offer.title}" loading="lazy">
          <span class="offer-badge-tag">${offer.badge}</span>
          <span class="offer-savings">${offer.discountText}</span>
        </div>
        <div class="offer-content">
          <h3 class="offer-title">${offer.title}</h3>
          <p class="offer-subtitle">${offer.subtitle}</p>
          <p class="offer-desc">${offer.description}</p>
          <div class="offer-bottom-bar">
            <div class="offer-pricing">
              <span class="offer-reg">${offer.regularPrice}</span>
              <span class="offer-deal">${offer.offerPrice}</span>
            </div>
            <div class="offer-code-pill">
              <span class="coupon-code-text">${offer.code}</span>
              <button class="copy-coupon-btn" onclick="BlissApp.copyCouponCode('${offer.code}')" title="Copy code" aria-label="Copy coupon ${offer.code}">
                <i class="fa-regular fa-copy"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  },

  copyCouponCode(code) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code).then(() => {
        Toast.show(`Coupon code "${code}" copied to clipboard! Paste at checkout 🎉`, 'success');
        if (window.A11yEngine) window.A11yEngine.playSuccessChime();
      });
    } else {
      Toast.show(`Coupon code: ${code}`, 'info');
    }
  },

  initCountdownTimer() {
    // 6-hour rolling countdown timer
    let remainingSeconds = 6 * 3600 + 42 * 60 + 15;

    const hoursEl = document.getElementById('countdown-hours');
    const minutesEl = document.getElementById('countdown-minutes');
    const secondsEl = document.getElementById('countdown-seconds');

    if (!hoursEl || !minutesEl || !secondsEl) return;

    setInterval(() => {
      if (remainingSeconds > 0) {
        remainingSeconds--;
      } else {
        remainingSeconds = 6 * 3600; // reset
      }

      const hrs = Math.floor(remainingSeconds / 3600);
      const mins = Math.floor((remainingSeconds % 3600) / 60);
      const secs = remainingSeconds % 60;

      hoursEl.textContent = String(hrs).padStart(2, '0');
      minutesEl.textContent = String(mins).padStart(2, '0');
      secondsEl.textContent = String(secs).padStart(2, '0');
    }, 1000);
  },

  initHeroStats() {
    const statsContainer = document.getElementById('hero-stats-row');
    if (!statsContainer) return;

    statsContainer.innerHTML = window.CAFE_DATA.stats.map(s => `
      <div class="hero-stat-card glass-card">
        <i class="fa-solid ${s.icon} stat-icon"></i>
        <div class="stat-text">
          <span class="stat-value">${s.value}</span>
          <span class="stat-label">${s.label}</span>
        </div>
      </div>
    `).join('');
  },

  // ------------------------------------------
  // GALLERY & LIGHTBOX
  // ------------------------------------------
  renderGallery() {
    const grid = document.getElementById('gallery-grid');
    if (!grid) return;

    let items = window.CAFE_DATA.gallery;
    if (this.activeGalleryCategory !== 'all') {
      items = items.filter(g => g.category === this.activeGalleryCategory);
    }

    grid.innerHTML = items.map((g, idx) => `
      <div class="gallery-item-wrap" onclick="BlissApp.openLightbox(${idx})">
        <img src="${g.image}" alt="${g.title}" class="gallery-img" loading="lazy">
        <div class="gallery-overlay">
          <div class="gallery-overlay-content">
            <span class="gallery-cat-pill">${g.category.toUpperCase()}</span>
            <h4 class="gallery-item-title">${g.title}</h4>
            <p class="gallery-item-sub">${g.subtitle}</p>
            <span class="gallery-zoom-icon"><i class="fa-solid fa-expand"></i></span>
          </div>
        </div>
      </div>
    `).join('');
  },

  openLightbox(index) {
    let items = window.CAFE_DATA.gallery;
    if (this.activeGalleryCategory !== 'all') {
      items = items.filter(g => g.category === this.activeGalleryCategory);
    }

    this.currentLightboxIndex = index;
    const modal = document.getElementById('lightbox-modal');
    const img = document.getElementById('lightbox-img');
    const title = document.getElementById('lightbox-title');
    const sub = document.getElementById('lightbox-sub');
    const counter = document.getElementById('lightbox-counter');

    if (!modal || !items[index]) return;

    const item = items[index];
    img.src = item.image;
    img.alt = item.title;
    title.textContent = item.title;
    sub.textContent = item.subtitle;
    counter.textContent = `${index + 1} / ${items.length}`;

    modal.classList.add('active');
    document.body.classList.add('modal-locked');
  },

  navigateLightbox(direction) {
    let items = window.CAFE_DATA.gallery;
    if (this.activeGalleryCategory !== 'all') {
      items = items.filter(g => g.category === this.activeGalleryCategory);
    }

    let newIndex = this.currentLightboxIndex + direction;
    if (newIndex < 0) newIndex = items.length - 1;
    if (newIndex >= items.length) newIndex = 0;

    this.openLightbox(newIndex);
  },

  closeLightbox() {
    const modal = document.getElementById('lightbox-modal');
    if (modal) {
      modal.classList.remove('active');
      document.body.classList.remove('modal-locked');
    }
  },

  // ------------------------------------------
  // REVIEWS & TESTIMONIALS SLIDER
  // ------------------------------------------
  renderReviews() {
    const track = document.getElementById('reviews-slider-track');
    const dotsContainer = document.getElementById('reviews-slider-dots');
    if (!track) return;

    const reviews = window.CAFE_DATA.reviews;
    track.innerHTML = reviews.map((r, i) => `
      <div class="review-slide glass-card ${i === this.currentReviewIndex ? 'active' : ''}">
        <div class="review-quote-mark"><i class="fa-solid fa-quote-left"></i></div>
        <p class="review-text">"${r.text}"</p>
        <div class="review-stars">
          ${Array(5).fill(0).map((_, starIdx) => `
            <i class="fa-solid fa-star ${starIdx < r.rating ? 'filled' : ''}"></i>
          `).join('')}
        </div>
        <div class="review-author">
          <img src="${r.avatar}" alt="${r.name}" class="review-avatar" loading="lazy">
          <div class="review-author-info">
            <h4 class="review-name">${r.name}</h4>
            <span class="review-title">${r.title}</span>
            <span class="review-date">${r.date}</span>
          </div>
        </div>
      </div>
    `).join('');

    if (dotsContainer) {
      dotsContainer.innerHTML = reviews.map((_, i) => `
        <button class="review-dot ${i === this.currentReviewIndex ? 'active' : ''}" onclick="BlissApp.goToReview(${i})" aria-label="Go to review slide ${i + 1}"></button>
      `).join('');
    }

    this.startReviewAutoplay();
  },

  goToReview(index) {
    const reviews = window.CAFE_DATA.reviews;
    if (index < 0) index = reviews.length - 1;
    if (index >= reviews.length) index = 0;
    this.currentReviewIndex = index;

    const slides = document.querySelectorAll('.review-slide');
    const dots = document.querySelectorAll('.review-dot');

    slides.forEach((s, idx) => s.classList.toggle('active', idx === index));
    dots.forEach((d, idx) => d.classList.toggle('active', idx === index));
  },

  startReviewAutoplay() {
    if (this.reviewTimer) clearInterval(this.reviewTimer);
    this.reviewTimer = setInterval(() => {
      this.goToReview(this.currentReviewIndex + 1);
    }, 6000);
  },

  openWriteReviewModal() {
    const modal = document.getElementById('write-review-modal');
    if (modal) {
      modal.classList.add('active');
      document.body.classList.add('modal-locked');
    }
  },

  closeWriteReviewModal() {
    const modal = document.getElementById('write-review-modal');
    if (modal) {
      modal.classList.remove('active');
      document.body.classList.remove('modal-locked');
    }
  },

  // ------------------------------------------
  // TABLE RESERVATION
  // ------------------------------------------
  bindReservationForm() {
    const form = document.getElementById('reservation-form');
    if (!form) return;

    // Set minimum date to today
    const dateInput = document.getElementById('res-date');
    if (dateInput) {
      const today = new Date().toISOString().split('T')[0];
      dateInput.min = today;
      dateInput.value = today;
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('res-name')?.value.trim();
      const phone = document.getElementById('res-phone')?.value.trim();
      const email = document.getElementById('res-email')?.value.trim();
      const date = document.getElementById('res-date')?.value;
      const time = document.getElementById('res-time')?.value;
      const guests = document.getElementById('res-guests')?.value;
      const seating = document.getElementById('res-seating')?.value;
      const notes = document.getElementById('res-notes')?.value.trim();

      if (!name || !phone || !date || !time) {
        Toast.show('Please fill in all mandatory reservation fields', 'error');
        return;
      }

      const bookingRef = 'RES-' + Math.floor(10000 + Math.random() * 90000);
      const bookingData = { bookingRef, name, phone, email, date, time, guests, seating, notes };

      // Save reservation to storage
      const existing = JSON.parse(localStorage.getItem('bliss_reservations') || '[]');
      existing.unshift(bookingData);
      localStorage.setItem('bliss_reservations', JSON.stringify(existing));

      if (window.A11yEngine) window.A11yEngine.playSuccessChime();
      form.reset();

      // Show Booking Confirmation Modal
      this.showReservationSuccess(bookingData);
    });
  },

  showReservationSuccess(booking) {
    const modal = document.getElementById('res-success-modal');
    if (!modal) return;

    document.getElementById('res-ref-id').textContent = booking.bookingRef;
    document.getElementById('res-guest-name').textContent = booking.name;
    document.getElementById('res-summary-date').textContent = `${booking.date} at ${booking.time}`;
    document.getElementById('res-summary-party').textContent = `${booking.guests} Guest(s) • ${booking.seating}`;

    modal.classList.add('active');
    document.body.classList.add('modal-locked');
    Toast.show(`Table successfully reserved for ${booking.name}! Reference: ${booking.bookingRef} 🎉`, 'success');
  },

  // ------------------------------------------
  // CONTACT & NEWSLETTER
  // ------------------------------------------
  bindContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('contact-name')?.value.trim();
      const email = document.getElementById('contact-email')?.value.trim();
      const message = document.getElementById('contact-message')?.value.trim();

      if (!name || !email || !message) {
        Toast.show('Please complete all message fields', 'error');
        return;
      }

      if (window.A11yEngine) window.A11yEngine.playSuccessChime();
      Toast.show(`Thank you, ${name}! Your message has reached our Café Concierge. We will reply within 2 hours. ☕`, 'success');
      form.reset();
    });
  },

  bindNewsletter() {
    const form = document.getElementById('newsletter-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailInput = document.getElementById('newsletter-email');
      const email = emailInput?.value.trim();
      if (!email || !email.includes('@')) {
        Toast.show('Please enter a valid email address', 'error');
        return;
      }

      if (window.A11yEngine) window.A11yEngine.playSuccessChime();
      Toast.show(`Welcome to Café Bliss Circle! Check your inbox for your 20% discount code "BLISS20" 🥐`, 'success');
      if (emailInput) emailInput.value = '';
    });
  },

  // ------------------------------------------
  // AUTHENTICATION (LOGIN / SIGN UP)
  // ------------------------------------------
  loadAuthUser() {
    try {
      const savedUser = localStorage.getItem('bliss_user');
      if (savedUser) {
        this.currentUser = JSON.parse(savedUser);
        this.updateUserNavUI();
      }
    } catch (e) {}
  },

  bindAuth() {
    const authForm = document.getElementById('auth-form');
    const authTabs = document.querySelectorAll('.auth-tab-btn');

    authTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        authTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const mode = tab.getAttribute('data-mode'); // login or signup
        const signupGroup = document.getElementById('auth-signup-fields');
        const submitBtn = document.getElementById('auth-submit-btn');

        if (signupGroup && submitBtn) {
          if (mode === 'signup') {
            signupGroup.style.display = 'block';
            submitBtn.textContent = 'Create My Bliss Account';
          } else {
            signupGroup.style.display = 'none';
            submitBtn.textContent = 'Sign In to Café Bliss';
          }
        }
      });
    });

    if (authForm) {
      authForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('auth-email')?.value.trim();
        const name = document.getElementById('auth-name')?.value.trim() || email.split('@')[0];
        
        if (!email) {
          Toast.show('Please enter your email', 'error');
          return;
        }

        this.currentUser = { name, email, memberSince: '2026' };
        localStorage.setItem('bliss_user', JSON.stringify(this.currentUser));
        this.updateUserNavUI();

        if (window.A11yEngine) window.A11yEngine.playSuccessChime();
        Toast.show(`Welcome back, ${name}! Enjoy your Café Bliss moments ☕`, 'success');
        this.closeAuthModal();
      });
    }
  },

  updateUserNavUI() {
    const userBtn = document.getElementById('nav-auth-btn');
    if (!userBtn) return;

    if (this.currentUser) {
      userBtn.innerHTML = `
        <i class="fa-solid fa-user-check"></i>
        <span>Hi, ${this.currentUser.name}</span>
      `;
      userBtn.title = 'Account details (Click to log out)';
      userBtn.onclick = () => {
        if (confirm(`Logged in as ${this.currentUser.name} (${this.currentUser.email}). Do you want to sign out?`)) {
          this.currentUser = null;
          localStorage.removeItem('bliss_user');
          this.updateUserNavUI();
          Toast.show('You have safely signed out', 'info');
        }
      };
    } else {
      userBtn.innerHTML = `
        <i class="fa-regular fa-user"></i>
        <span>Login / Sign Up</span>
      `;
      userBtn.onclick = () => BlissApp.openAuthModal();
    }
  },

  openAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
      modal.classList.add('active');
      document.body.classList.add('modal-locked');
    }
  },

  closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
      modal.classList.remove('active');
      document.body.classList.remove('modal-locked');
    }
  },

  // ------------------------------------------
  // NAVIGATION & SCROLL EVENTS
  // ------------------------------------------
  bindNavigation() {
    // Mobile Drawer Toggle
    const hamburger = document.getElementById('nav-hamburger-btn');
    const mobileDrawer = document.getElementById('mobile-nav-drawer');
    const mobileOverlay = document.getElementById('mobile-nav-overlay');
    const mobileClose = document.getElementById('close-mobile-nav');

    const toggleMobileNav = (open) => {
      if (mobileDrawer && mobileOverlay) {
        mobileDrawer.classList.toggle('open', open);
        mobileOverlay.classList.toggle('open', open);
        hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
      }
    };

    if (hamburger) hamburger.addEventListener('click', () => toggleMobileNav(true));
    if (mobileClose) mobileClose.addEventListener('click', () => toggleMobileNav(false));
    if (mobileOverlay) mobileOverlay.addEventListener('click', () => toggleMobileNav(false));

    // Close mobile nav on link click
    document.querySelectorAll('.mobile-nav-link').forEach(link => {
      link.addEventListener('click', () => toggleMobileNav(false));
    });

    // Wishlist Button in Nav
    document.getElementById('navbar-wishlist-btn')?.addEventListener('click', () => {
      this.openWishlistModal();
    });

    // Back to top button
    const backToTop = document.getElementById('back-to-top-btn');
    if (backToTop) {
      backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // New review modal trigger
    document.getElementById('open-write-review-btn')?.addEventListener('click', () => {
      this.openWriteReviewModal();
    });

    // Star rating picker in review modal
    const starPicker = document.querySelectorAll('.star-rating-select .star-pick');
    let selectedRating = 5;
    starPicker.forEach(star => {
      star.addEventListener('click', () => {
        selectedRating = parseInt(star.getAttribute('data-value'), 10);
        starPicker.forEach((s, idx) => {
          s.classList.toggle('active', idx < selectedRating);
        });
      });
    });

    const submitReviewForm = document.getElementById('submit-review-form');
    if (submitReviewForm) {
      submitReviewForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('review-author-name')?.value.trim();
        const role = document.getElementById('review-author-role')?.value.trim() || 'Café Patron';
        const text = document.getElementById('review-text-input')?.value.trim();

        if (!name || !text) {
          Toast.show('Please provide your name and review', 'error');
          return;
        }

        const newReview = {
          id: 'user_r_' + Date.now(),
          name,
          title: role,
          avatar: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 50)}?auto=format&fit=crop&w=200&q=80`,
          rating: selectedRating,
          date: 'Just now',
          text
        };

        window.CAFE_DATA.reviews.unshift(newReview);
        this.renderReviews();
        this.closeWriteReviewModal();
        submitReviewForm.reset();

        if (window.A11yEngine) window.A11yEngine.playSuccessChime();
        Toast.show('Thank you for your delightful review! ⭐', 'success');
      });
    }
  },

  bindSearchAndFilters() {
    // Menu Category click
    document.getElementById('menu-category-tabs')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.menu-cat-btn');
      if (btn) {
        document.querySelectorAll('.menu-cat-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeCategory = btn.getAttribute('data-category');
        this.renderMenuItems();
      }
    });

    // Dietary Filter click
    document.querySelectorAll('.diet-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.diet-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeDiet = btn.getAttribute('data-diet');
        this.renderMenuItems();
      });
    });

    // Search Input with debounce
    const searchInput = document.getElementById('menu-search-input');
    if (searchInput) {
      let debounceTimer;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          this.searchQuery = e.target.value.trim();
          this.renderMenuItems();
        }, 250);
      });
    }

    // Sort Dropdown
    const sortSelect = document.getElementById('menu-sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.sortBy = e.target.value;
        this.renderMenuItems();
      });
    }

    // Gallery Category tabs
    document.getElementById('gallery-category-tabs')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.gallery-cat-btn');
      if (btn) {
        document.querySelectorAll('.gallery-cat-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeGalleryCategory = btn.getAttribute('data-category');
        this.renderGallery();
      }
    });
  },

  bindModals() {
    // Global Escape Key to close modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active'));
        document.body.classList.remove('modal-locked');
        CartEngine.closeDrawer();
      }
      // Lightbox keyboard navigation
      const lightbox = document.getElementById('lightbox-modal');
      if (lightbox && lightbox.classList.contains('active')) {
        if (e.key === 'ArrowLeft') this.navigateLightbox(-1);
        if (e.key === 'ArrowRight') this.navigateLightbox(1);
      }
    });

    // Close button delegator
    document.addEventListener('click', (e) => {
      if (e.target.closest('.modal-close') || e.target.classList.contains('modal-backdrop')) {
        const modal = e.target.closest('.modal');
        if (modal) {
          modal.classList.remove('active');
          document.body.classList.remove('modal-locked');
        }
      }
    });

    // Lightbox Controls
    document.getElementById('lightbox-prev-btn')?.addEventListener('click', () => this.navigateLightbox(-1));
    document.getElementById('lightbox-next-btn')?.addEventListener('click', () => this.navigateLightbox(1));
    document.getElementById('lightbox-close-btn')?.addEventListener('click', () => this.closeLightbox());

    // Review Slider Arrows
    document.getElementById('review-prev-btn')?.addEventListener('click', () => this.goToReview(this.currentReviewIndex - 1));
    document.getElementById('review-next-btn')?.addEventListener('click', () => this.goToReview(this.currentReviewIndex + 1));
  },

  bindScrollEffects() {
    const navbar = document.getElementById('main-navbar');
    const backToTop = document.getElementById('back-to-top-btn');

    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;

      // Navbar glass blur effect
      if (navbar) {
        if (scrollY > 50) {
          navbar.classList.add('scrolled');
        } else {
          navbar.classList.remove('scrolled');
        }
      }

      // Back to top visibility
      if (backToTop) {
        if (scrollY > 400) {
          backToTop.classList.add('visible');
        } else {
          backToTop.classList.remove('visible');
        }
      }

      // Update active nav link based on scroll position (Scrollspy)
      const sections = document.querySelectorAll('section[id]');
      const navLinks = document.querySelectorAll('.nav-link');
      let currentSectionId = '';

      sections.forEach(sec => {
        const top = sec.offsetTop - 120;
        const height = sec.offsetHeight;
        if (scrollY >= top && scrollY < top + height) {
          currentSectionId = sec.getAttribute('id');
        }
      });

      if (currentSectionId) {
        navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === `#${currentSectionId}`);
        });
      }
    }, { passive: true });

    // IntersectionObserver for smooth fade-in animations on scroll
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('fade-in-visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12 });

      document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
    }
  }
};

window.BlissApp = BlissApp;

// Auto-run on DOM Ready
document.addEventListener('DOMContentLoaded', () => BlissApp.init());

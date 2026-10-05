// ==========================================
// Café Bliss - Cart, Ordering & Live Tracking Engine
// ==========================================

const CartEngine = {
  items: [],
  appliedCoupon: null,
  orderType: 'delivery', // delivery, pickup, dinein
  orders: [],
  activeTrackingOrder: null,
  trackingTimer: null,

  init() {
    this.loadFromStorage();
    this.renderCartUI();
    this.bindEvents();
    this.checkActiveTracking();
  },

  loadFromStorage() {
    try {
      const savedCart = localStorage.getItem('bliss_cart');
      if (savedCart) this.items = JSON.parse(savedCart);

      const savedCoupon = localStorage.getItem('bliss_coupon');
      if (savedCoupon) this.appliedCoupon = JSON.parse(savedCoupon);

      const savedOrders = localStorage.getItem('bliss_orders');
      if (savedOrders) this.orders = JSON.parse(savedOrders);
    } catch (e) {
      console.warn('Cart storage load error:', e);
    }
  },

  saveToStorage() {
    try {
      localStorage.setItem('bliss_cart', JSON.stringify(this.items));
      if (this.appliedCoupon) {
        localStorage.setItem('bliss_coupon', JSON.stringify(this.appliedCoupon));
      } else {
        localStorage.removeItem('bliss_coupon');
      }
      localStorage.setItem('bliss_orders', JSON.stringify(this.orders));
    } catch (e) {
      console.warn('Cart storage save error:', e);
    }
  },

  addItem(itemId, quantity = 1) {
    const product = window.CAFE_DATA?.menuItems.find(item => item.id === itemId);
    if (!product) return;

    const existingIndex = this.items.findIndex(item => item.id === itemId);
    if (existingIndex > -1) {
      this.items[existingIndex].quantity += quantity;
    } else {
      this.items.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category,
        isVeg: product.isVeg,
        quantity: quantity
      });
    }

    this.saveToStorage();
    this.renderCartUI();
    if (window.A11yEngine) window.A11yEngine.playSuccessChime();

    // Trigger cart badge bounce
    const badge = document.querySelectorAll('.cart-count-badge');
    badge.forEach(b => {
      b.classList.remove('badge-pop');
      void b.offsetWidth; // re-flow
      b.classList.add('badge-pop');
    });

    if (window.Toast) {
      Toast.show(`Added "${product.name}" to your cart! ☕`, 'success');
    }
  },

  updateQuantity(itemId, delta) {
    const itemIndex = this.items.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return;

    this.items[itemIndex].quantity += delta;
    if (this.items[itemIndex].quantity <= 0) {
      const removedName = this.items[itemIndex].name;
      this.items.splice(itemIndex, 1);
      if (window.Toast) Toast.show(`Removed "${removedName}" from cart`, 'info');
    }

    this.saveToStorage();
    this.renderCartUI();
    if (window.A11yEngine) window.A11yEngine.playTone(380, 0.05);
  },

  removeItem(itemId) {
    const itemIndex = this.items.findIndex(item => item.id === itemId);
    if (itemIndex > -1) {
      const name = this.items[itemIndex].name;
      this.items.splice(itemIndex, 1);
      this.saveToStorage();
      this.renderCartUI();
      if (window.Toast) Toast.show(`Removed "${name}" from cart`, 'info');
    }
  },

  clearCart() {
    this.items = [];
    this.appliedCoupon = null;
    this.saveToStorage();
    this.renderCartUI();
  },

  getTotals() {
    const subtotal = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let discount = 0;

    if (this.appliedCoupon) {
      if (this.appliedCoupon.type === 'percent') {
        discount = (subtotal * this.appliedCoupon.discount) / 100;
      } else if (this.appliedCoupon.type === 'flat') {
        discount = Math.min(this.appliedCoupon.discount, subtotal);
      }
    }

    const discountedSubtotal = Math.max(0, subtotal - discount);
    const taxRate = 0.05; // 5% cafe tax
    const tax = discountedSubtotal * taxRate;

    // Free delivery on orders over $30 or if pickup/dine-in
    let deliveryFee = 0;
    if (this.orderType === 'delivery') {
      deliveryFee = subtotal > 30 || subtotal === 0 ? 0 : 2.50;
    }

    const grandTotal = discountedSubtotal + tax + deliveryFee;

    return {
      itemCount: this.items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: Number(subtotal.toFixed(2)),
      discount: Number(discount.toFixed(2)),
      tax: Number(tax.toFixed(2)),
      deliveryFee: Number(deliveryFee.toFixed(2)),
      grandTotal: Number(grandTotal.toFixed(2))
    };
  },

  applyCoupon(inputCode) {
    if (!inputCode) {
      if (window.Toast) Toast.show('Please enter a coupon code', 'error');
      return false;
    }

    const code = inputCode.trim().toUpperCase();
    const coupon = window.CAFE_DATA?.coupons.find(c => c.code === code);

    if (!coupon) {
      if (window.Toast) Toast.show(`Coupon "${code}" is invalid or expired`, 'error');
      return false;
    }

    const totals = this.getTotals();
    if (totals.subtotal < coupon.minOrder) {
      if (window.Toast) Toast.show(`Minimum subtotal of $${coupon.minOrder.toFixed(2)} required for code ${code}`, 'warning');
      return false;
    }

    this.appliedCoupon = coupon;
    this.saveToStorage();
    this.renderCartUI();
    if (window.A11yEngine) window.A11yEngine.playSuccessChime();
    if (window.Toast) Toast.show(`Coupon "${code}" applied! You saved on this order 🎉`, 'success');
    return true;
  },

  removeCoupon() {
    this.appliedCoupon = null;
    this.saveToStorage();
    this.renderCartUI();
    if (window.Toast) Toast.show('Coupon removed', 'info');
  },

  renderCartUI() {
    const totals = this.getTotals();

    // 1. Update Cart count badges
    const badges = document.querySelectorAll('.cart-count-badge');
    badges.forEach(b => {
      b.textContent = totals.itemCount;
      b.style.display = totals.itemCount > 0 ? 'inline-flex' : 'none';
    });

    // 2. Update Drawer Cart list
    const cartList = document.getElementById('cart-items-list');
    const emptyState = document.getElementById('cart-empty-state');
    const cartFooter = document.getElementById('cart-footer-summary');

    if (cartList && emptyState && cartFooter) {
      if (this.items.length === 0) {
        cartList.innerHTML = '';
        emptyState.style.display = 'flex';
        cartFooter.style.display = 'none';
      } else {
        emptyState.style.display = 'none';
        cartFooter.style.display = 'block';

        cartList.innerHTML = this.items.map(item => `
          <div class="cart-item-row" data-id="${item.id}">
            <img src="${item.image}" alt="${item.name}" class="cart-item-thumb" loading="lazy">
            <div class="cart-item-info">
              <div class="cart-item-title-row">
                <h4 class="cart-item-name">${item.name}</h4>
                <button class="cart-item-remove-btn" onclick="CartEngine.removeItem('${item.id}')" title="Remove item" aria-label="Remove ${item.name}">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
              </div>
              <div class="cart-item-meta">
                <span class="diet-dot ${item.isVeg ? 'veg' : 'non-veg'}"></span>
                <span class="cart-item-unit-price">$${item.price.toFixed(2)}</span>
              </div>
              <div class="cart-item-actions">
                <div class="qty-pill">
                  <button type="button" onclick="CartEngine.updateQuantity('${item.id}', -1)" aria-label="Decrease quantity">
                    <i class="fa-solid fa-minus"></i>
                  </button>
                  <span class="qty-count">${item.quantity}</span>
                  <button type="button" onclick="CartEngine.updateQuantity('${item.id}', 1)" aria-label="Increase quantity">
                    <i class="fa-solid fa-plus"></i>
                  </button>
                </div>
                <div class="cart-item-row-total">$${(item.price * item.quantity).toFixed(2)}</div>
              </div>
            </div>
          </div>
        `).join('');
      }
    }

    // 3. Update summary figures in cart drawer
    const subtotalEl = document.getElementById('cart-subtotal');
    const taxEl = document.getElementById('cart-tax');
    const deliveryEl = document.getElementById('cart-delivery');
    const grandTotalEl = document.getElementById('cart-grand-total');
    const discountRow = document.getElementById('cart-discount-row');
    const discountEl = document.getElementById('cart-discount');
    const couponTag = document.getElementById('applied-coupon-tag');

    if (subtotalEl) subtotalEl.textContent = `$${totals.subtotal.toFixed(2)}`;
    if (taxEl) taxEl.textContent = `$${totals.tax.toFixed(2)}`;
    if (deliveryEl) {
      deliveryEl.textContent = totals.deliveryFee === 0 ? 'FREE' : `$${totals.deliveryFee.toFixed(2)}`;
      deliveryEl.className = totals.deliveryFee === 0 ? 'free-badge-text' : '';
    }
    if (grandTotalEl) grandTotalEl.textContent = `$${totals.grandTotal.toFixed(2)}`;

    if (discountRow && discountEl) {
      if (totals.discount > 0 && this.appliedCoupon) {
        discountRow.style.display = 'flex';
        discountEl.textContent = `-$${totals.discount.toFixed(2)}`;
        if (couponTag) {
          couponTag.innerHTML = `
            <span>Code: <strong>${this.appliedCoupon.code}</strong> (${this.appliedCoupon.discount}${this.appliedCoupon.type === 'percent' ? '%' : '$'} OFF)</span>
            <button type="button" onclick="CartEngine.removeCoupon()" class="remove-coupon-tag-btn" title="Remove coupon">×</button>
          `;
          couponTag.style.display = 'inline-flex';
        }
      } else {
        discountRow.style.display = 'none';
        if (couponTag) couponTag.style.display = 'none';
      }
    }

    // Update Checkout modal numbers if active
    this.updateCheckoutModalSummary();
  },

  updateCheckoutModalSummary() {
    const totals = this.getTotals();
    const chkSubtotal = document.getElementById('checkout-subtotal');
    const chkDiscount = document.getElementById('checkout-discount');
    const chkTax = document.getElementById('checkout-tax');
    const chkDelivery = document.getElementById('checkout-delivery');
    const chkTotal = document.getElementById('checkout-total');
    const chkDiscountRow = document.getElementById('checkout-discount-row');

    if (chkSubtotal) chkSubtotal.textContent = `$${totals.subtotal.toFixed(2)}`;
    if (chkTax) chkTax.textContent = `$${totals.tax.toFixed(2)}`;
    if (chkDelivery) chkDelivery.textContent = totals.deliveryFee === 0 ? 'FREE' : `$${totals.deliveryFee.toFixed(2)}`;
    if (chkTotal) chkTotal.textContent = `$${totals.grandTotal.toFixed(2)}`;

    if (chkDiscountRow && chkDiscount) {
      if (totals.discount > 0) {
        chkDiscountRow.style.display = 'flex';
        chkDiscount.textContent = `-$${totals.discount.toFixed(2)}`;
      } else {
        chkDiscountRow.style.display = 'none';
      }
    }
  },

  openDrawer() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-overlay');
    if (drawer && overlay) {
      drawer.classList.add('open');
      overlay.classList.add('open');
      document.body.classList.add('modal-locked');
      if (window.A11yEngine) window.A11yEngine.playTone(420, 0.06);
    }
  },

  closeDrawer() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-overlay');
    if (drawer && overlay) {
      drawer.classList.remove('open');
      overlay.classList.remove('open');
      document.body.classList.remove('modal-locked');
    }
  },

  openCheckoutModal() {
    if (this.items.length === 0) {
      if (window.Toast) Toast.show('Your cart is empty! Please select delicious treats first 🥐', 'warning');
      return;
    }
    this.closeDrawer();
    const modal = document.getElementById('checkout-modal');
    if (modal) {
      modal.classList.add('active');
      document.body.classList.add('modal-locked');
      this.updateCheckoutModalSummary();
    }
  },

  closeCheckoutModal() {
    const modal = document.getElementById('checkout-modal');
    if (modal) {
      modal.classList.remove('active');
      document.body.classList.remove('modal-locked');
    }
  },

  handleOrderSubmission(formData) {
    const totals = this.getTotals();
    const orderId = 'BLISS-' + Math.floor(100000 + Math.random() * 900000);
    const timestamp = new Date().toISOString();

    const newOrder = {
      orderId,
      timestamp,
      customer: formData,
      items: [...this.items],
      orderType: this.orderType,
      totals,
      paymentMethod: formData.paymentMethod || 'Credit Card / UPI',
      status: 'confirmed', // stages: confirmed -> brewing -> packing -> out_for_delivery -> delivered
      statusStep: 1,
      estimatedMinutes: 20
    };

    this.orders.unshift(newOrder);
    this.saveToStorage();

    // Clear cart after successful order
    this.clearCart();
    this.closeCheckoutModal();

    // Trigger Success Chime
    if (window.A11yEngine) window.A11yEngine.playSuccessChime();

    // Show Confirmation Modal
    this.showOrderConfirmation(newOrder);

    // Start Live tracking simulation
    this.startOrderTracking(newOrder);
  },

  showOrderConfirmation(order) {
    const modal = document.getElementById('order-success-modal');
    if (!modal) return;

    const idEl = document.getElementById('success-order-id');
    const nameEl = document.getElementById('success-order-name');
    const totalEl = document.getElementById('success-order-total');
    const typeEl = document.getElementById('success-order-type');
    const timeEl = document.getElementById('success-order-eta');
    const itemsListEl = document.getElementById('success-order-items');

    if (idEl) idEl.textContent = order.orderId;
    if (nameEl) nameEl.textContent = order.customer.name;
    if (totalEl) totalEl.textContent = `$${order.totals.grandTotal.toFixed(2)}`;
    if (typeEl) typeEl.textContent = order.orderType.toUpperCase();
    if (timeEl) timeEl.textContent = `${order.estimatedMinutes} mins`;

    if (itemsListEl) {
      itemsListEl.innerHTML = order.items.map(i => `
        <div class="receipt-item-line">
          <span>${i.quantity}x ${i.name}</span>
          <span>$${(i.price * i.quantity).toFixed(2)}</span>
        </div>
      `).join('');
    }

    modal.classList.add('active');
    document.body.classList.add('modal-locked');
  },

  closeSuccessModal() {
    const modal = document.getElementById('order-success-modal');
    if (modal) {
      modal.classList.remove('active');
      document.body.classList.remove('modal-locked');
    }
  },

  // ------------------------------------------
  // LIVE ORDER TRACKING
  // ------------------------------------------
  startOrderTracking(order) {
    this.activeTrackingOrder = order;

    // Simulated progress transitions
    if (this.trackingTimer) clearInterval(this.trackingTimer);

    let currentStep = 1;
    this.trackingTimer = setInterval(() => {
      currentStep++;
      if (currentStep <= 5) {
        order.statusStep = currentStep;
        if (currentStep === 2) order.status = 'Kitchen Preparing & Brewing';
        if (currentStep === 3) order.status = 'Fresh Packaging & Quality Seal';
        if (currentStep === 4) order.status = order.orderType === 'delivery' ? 'Out for Delivery with Courier' : 'Ready at Pickup Counter!';
        if (currentStep === 5) {
          order.status = 'Delivered & Enjoyed';
          clearInterval(this.trackingTimer);
        }
        this.saveToStorage();
        this.renderTrackingModal(order);
      }
    }, 7000); // 7s per stage for demonstrative live simulation
  },

  checkActiveTracking() {
    if (this.orders.length > 0) {
      const latest = this.orders[0];
      if (latest && latest.statusStep < 5) {
        this.startOrderTracking(latest);
      }
    }
  },

  openTrackingModal() {
    if (this.orders.length === 0) {
      if (window.Toast) Toast.show('No active orders found yet. Treat yourself to a warm coffee first! ☕', 'info');
      return;
    }
    const latest = this.orders[0];
    this.renderTrackingModal(latest);
    const modal = document.getElementById('tracking-modal');
    if (modal) {
      modal.classList.add('active');
      document.body.classList.add('modal-locked');
    }
  },

  closeTrackingModal() {
    const modal = document.getElementById('tracking-modal');
    if (modal) {
      modal.classList.remove('active');
      document.body.classList.remove('modal-locked');
    }
  },

  renderTrackingModal(order) {
    const modal = document.getElementById('tracking-modal');
    if (!modal || !order) return;

    const idEl = document.getElementById('track-order-id');
    const statusPill = document.getElementById('track-status-pill');
    const etaEl = document.getElementById('track-eta-countdown');
    const addressEl = document.getElementById('track-delivery-address');

    if (idEl) idEl.textContent = order.orderId;
    if (statusPill) statusPill.textContent = order.status;
    if (etaEl) {
      const remainingMins = Math.max(0, 20 - (order.statusStep * 4));
      etaEl.textContent = remainingMins > 0 ? `${remainingMins} mins` : 'Arrived / Ready';
    }
    if (addressEl) {
      addressEl.textContent = order.orderType === 'dinein' 
        ? `Dine-In Table #${order.customer.tableNumber || '5'}` 
        : (order.customer.address || 'Artisan Boulevard Pickup Counter');
    }

    // Update Steps
    const steps = [1, 2, 3, 4, 5];
    steps.forEach(stepNum => {
      const stepEl = document.getElementById(`track-step-${stepNum}`);
      if (stepEl) {
        stepEl.classList.remove('completed', 'active');
        if (order.statusStep > stepNum) {
          stepEl.classList.add('completed');
        } else if (order.statusStep === stepNum) {
          stepEl.classList.add('active');
        }
      }
    });
  },

  bindEvents() {
    // Open cart drawer
    document.addEventListener('click', (e) => {
      if (e.target.closest('#navbar-cart-btn') || e.target.closest('#mobile-cart-btn')) {
        this.openDrawer();
      }
      if (e.target.closest('#close-cart-drawer') || e.target.closest('#cart-overlay')) {
        this.closeDrawer();
      }
      if (e.target.closest('#open-checkout-btn')) {
        this.openCheckoutModal();
      }
      if (e.target.closest('#close-checkout-modal')) {
        this.closeCheckoutModal();
      }
      if (e.target.closest('#track-order-nav-btn')) {
        this.openTrackingModal();
      }
      if (e.target.closest('#close-tracking-modal')) {
        this.closeTrackingModal();
      }
      if (e.target.closest('#close-success-modal')) {
        this.closeSuccessModal();
      }
      if (e.target.closest('#view-live-track-btn')) {
        this.closeSuccessModal();
        this.openTrackingModal();
      }
    });

    // Apply coupon form
    const couponForm = document.getElementById('cart-coupon-form');
    if (couponForm) {
      couponForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('coupon-code-input');
        if (input) {
          this.applyCoupon(input.value);
          input.value = '';
        }
      });
    }

    // Order type tabs in checkout
    const orderTypeBtns = document.querySelectorAll('.order-type-btn');
    orderTypeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        orderTypeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.orderType = btn.getAttribute('data-type') || 'delivery';

        const addressGroup = document.getElementById('checkout-address-group');
        const tableGroup = document.getElementById('checkout-table-group');
        if (addressGroup && tableGroup) {
          if (this.orderType === 'dinein') {
            addressGroup.style.display = 'none';
            tableGroup.style.display = 'block';
          } else if (this.orderType === 'pickup') {
            addressGroup.style.display = 'none';
            tableGroup.style.display = 'none';
          } else {
            addressGroup.style.display = 'block';
            tableGroup.style.display = 'none';
          }
        }
        this.renderCartUI();
      });
    });

    // Checkout submission form
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
      checkoutForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('chk-name')?.value.trim();
        const phone = document.getElementById('chk-phone')?.value.trim();
        const email = document.getElementById('chk-email')?.value.trim();
        const address = document.getElementById('chk-address')?.value.trim();
        const tableNumber = document.getElementById('chk-table')?.value.trim();
        const paymentMethod = document.querySelector('input[name="payment-method"]:checked')?.value || 'Online Card / UPI';

        if (!name || !phone) {
          if (window.Toast) Toast.show('Please provide your name and phone number', 'error');
          return;
        }

        if (this.orderType === 'delivery' && !address) {
          if (window.Toast) Toast.show('Please provide delivery address', 'error');
          return;
        }

        this.handleOrderSubmission({ name, phone, email, address, tableNumber, paymentMethod });
      });
    }
  }
};

window.CartEngine = CartEngine;

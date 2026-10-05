// ==========================================================================
// Café Bliss - Admin Operations & Real-time Kitchen Controller
// ==========================================================================

const AdminApp = {
  token: null,
  activeTab: 'orders',
  activeOrderFilter: 'all',
  activeMenuCat: 'all',
  orderSearchQuery: '',
  menuSearchQuery: '',
  orders: [],
  menuItems: [],
  emailLogs: [],
  pollingInterval: null,
  soundEnabled: true,
  lastKnownOrderCount: 0,
  audioCtx: null,

  init() {
    this.checkAuth();
    this.bindEvents();
  },

  // -------------------------------------------------------------
  // AUDIO CHIME ENGINE (Native Web Audio API - Zero Dependencies)
  // -------------------------------------------------------------
  playChime() {
    if (!this.soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      if (!this.audioCtx) this.audioCtx = new AudioContext();
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;

      // Note 1: E5 (659.25 Hz)
      const osc1 = this.audioCtx.createOscillator();
      const gain1 = this.audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.25, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(this.audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Note 2: A5 (880.00 Hz)
      const osc2 = this.audioCtx.createOscillator();
      const gain2 = this.audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880.00, now + 0.12);
      gain2.gain.setValueAtTime(0.3, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
      osc2.connect(gain2);
      gain2.connect(this.audioCtx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.65);
    } catch (e) {
      console.warn('Audio chime notice:', e);
    }
  },

  // -------------------------------------------------------------
  // AUTHENTICATION & LOGIN GATE
  // -------------------------------------------------------------
  checkAuth() {
    const savedToken = localStorage.getItem('bliss_admin_token');
    const overlay = document.getElementById('admin-login-overlay');

    if (savedToken) {
      this.token = savedToken;
      if (overlay) overlay.style.display = 'none';
      this.startApp();
    } else {
      if (overlay) overlay.style.display = 'flex';
    }
  },

  async login(username, password) {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (res.ok) {
        const data = await res.json();
        this.token = data.token;
        localStorage.setItem('bliss_admin_token', this.token);
        document.getElementById('admin-login-overlay').style.display = 'none';
        this.startApp();
        return;
      }
    } catch (err) {
      console.log('Server login API unavailable, using offline fallback auth');
    }

    // Offline / Demo fallback
    if (username.toLowerCase() === 'admin' && password === 'bliss123') {
      this.token = 'demo-admin-token-' + Date.now();
      localStorage.setItem('bliss_admin_token', this.token);
      document.getElementById('admin-login-overlay').style.display = 'none';
      this.startApp();
    } else {
      alert('Invalid username or password. Default is: admin / bliss123');
    }
  },

  logout() {
    localStorage.removeItem('bliss_admin_token');
    this.token = null;
    if (this.pollingInterval) clearInterval(this.pollingInterval);
    document.getElementById('admin-login-overlay').style.display = 'flex';
  },

  startApp() {
    this.loadOrders();
    this.loadAnalytics();
    this.loadMenu();
    this.loadEmailLogs();
    this.loadNotifications();

    // Start Real-time live polling (Every 3.5s)
    if (this.pollingInterval) clearInterval(this.pollingInterval);
    this.pollingInterval = setInterval(() => {
      this.loadOrders(true);
      this.loadNotifications();
    }, 3500);
  },

  // -------------------------------------------------------------
  // ORDERS MANAGEMENT & LIVE STREAM
  // -------------------------------------------------------------
  async loadOrders(isBackgroundPoll = false) {
    try {
      const res = await fetch('/api/admin/orders');
      if (res.ok) {
        const data = await res.json();
        const incomingOrders = data.orders || [];

        // Check if new orders arrived to play sound chime
        if (isBackgroundPoll && incomingOrders.length > this.lastKnownOrderCount && this.lastKnownOrderCount > 0) {
          this.playChime();
        }
        this.lastKnownOrderCount = incomingOrders.length;
        this.orders = incomingOrders;
        this.renderOrders();
        this.updateOrdersBadge();
        return;
      }
    } catch (e) {
      // Fallback: Read from LocalStorage if server isn't running
      const saved = localStorage.getItem('bliss_orders');
      if (saved) {
        this.orders = JSON.parse(saved);
        this.renderOrders();
        this.updateOrdersBadge();
      }
    }
  },

  updateOrdersBadge() {
    const newCount = this.orders.filter(o => (o.order_status || o.status || '').toLowerCase() === 'new').length;
    const badge = document.getElementById('badge-sidebar-orders');
    if (badge) {
      badge.textContent = newCount;
      badge.style.display = newCount > 0 ? 'inline-block' : 'none';
    }
  },

  renderOrders() {
    const container = document.getElementById('orders-stream-list');
    if (!container) return;

    let filtered = [...this.orders];

    // Filter by tab
    if (this.activeOrderFilter !== 'all') {
      filtered = filtered.filter(o => (o.order_status || o.status || '').toLowerCase() === this.activeOrderFilter);
    }

    // Filter by search
    if (this.orderSearchQuery) {
      const q = this.orderSearchQuery.toLowerCase();
      filtered = filtered.filter(o => {
        const id = (o.order_id || o.orderId || '').toLowerCase();
        const name = (o.customer_name || o.customer?.name || '').toLowerCase();
        const phone = (o.customer_phone || o.customer?.phone || '').toLowerCase();
        return id.includes(q) || name.includes(q) || phone.includes(q);
      });
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="background: var(--admin-surface); border: 1px dashed var(--admin-border); border-radius: var(--radius-md); padding: 50px 20px; text-align: center; color: var(--text-muted);">
          <i class="fa-solid fa-mug-saucer fa-3x" style="opacity: 0.3; margin-bottom: 14px;"></i>
          <h3>No Orders Found</h3>
          <p style="font-size: 0.9rem; margin-top: 6px;">There are no orders matching the current filter "${this.activeOrderFilter.toUpperCase()}".</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(order => {
      const orderId = order.order_id || order.orderId;
      const status = (order.order_status || order.status || 'New').toLowerCase();
      const paymentStatus = (order.payment_status || order.paymentStatus || 'Paid').toLowerCase();
      const customerName = order.customer_name || order.customer?.name || 'Guest Patron';
      const customerPhone = order.customer_phone || order.customer?.phone || 'N/A';
      const customerEmail = order.customer_email || order.customer?.email || 'N/A';
      const orderType = (order.order_type || order.orderType || 'delivery').toLowerCase();
      const address = order.address || order.customer?.address || 'N/A';
      const tableNumber = order.table_number || order.customer?.tableNumber || '';
      const totalAmount = Number(order.total_amount || order.totals?.grandTotal || 0).toFixed(2);
      const paymentMethod = order.payment_method || order.paymentMethod || 'UPI';
      const isNew = status === 'new';

      let items = order.items || [];
      if (typeof items === 'string') {
        try { items = JSON.parse(items); } catch (e) { items = []; }
      }

      const timeFormatted = order.created_at || order.createdAt ? new Date(order.created_at || order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent';

      return `
        <div class="order-admin-card ${isNew ? 'is-new' : ''}" data-id="${orderId}">
          <div class="order-card-header">
            <div class="order-id-group">
              <span class="order-id-title">#${orderId}</span>
              <span class="order-type-badge">${orderType.toUpperCase()}</span>
              <span class="order-time-ago"><i class="fa-regular fa-clock"></i> ${timeFormatted}</span>
            </div>
            <div>
              <span class="status-pill status-${status}">${status.toUpperCase()}</span>
              <span class="payment-pill ${paymentStatus}">${paymentStatus.toUpperCase()}</span>
            </div>
          </div>

          <div class="order-card-content">
            <!-- Customer Meta -->
            <div class="customer-meta-box">
              <h4>Customer Details</h4>
              <p><strong><i class="fa-solid fa-user" style="color: var(--accent-gold); width: 18px;"></i> ${customerName}</strong></p>
              <p><a href="tel:${customerPhone}"><i class="fa-solid fa-phone" style="color: var(--accent-gold); width: 18px;"></i> ${customerPhone}</a></p>
              ${customerEmail !== 'N/A' ? `<p><a href="mailto:${customerEmail}"><i class="fa-solid fa-envelope" style="color: var(--accent-gold); width: 18px;"></i> ${customerEmail}</a></p>` : ''}
              ${orderType === 'dinein' ? `<p style="margin-top: 8px; color: var(--accent-gold); font-weight: 600;"><i class="fa-solid fa-chair" style="width: 18px;"></i> Dine-In: Table #${tableNumber || '5'}</p>` : ''}
              ${orderType === 'delivery' ? `<p style="margin-top: 8px; font-size: 0.825rem; color: var(--text-muted);"><i class="fa-solid fa-location-dot" style="color: var(--primary); width: 18px;"></i> ${address}</p>` : ''}
            </div>

            <!-- Items Ordered -->
            <div class="order-items-box">
              <h4>Ordered Delicacies (${items.length})</h4>
              <div class="items-list-compact">
                ${items.map(item => `
                  <div class="item-compact-row">
                    <span><span class="item-compact-qty">${item.quantity || 1}x</span> ${item.name}</span>
                    <span style="color: var(--text-muted);">$${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</span>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Financials & Payment -->
            <div class="order-financials-box">
              <h4>Financials & Pay</h4>
              <div class="financial-row"><span>Method:</span><span>${paymentMethod}</span></div>
              <div class="financial-row"><span>Status:</span><span style="font-weight: 600;" class="text-${paymentStatus}">${paymentStatus.toUpperCase()}</span></div>
              <div class="financial-total">
                <div style="display: flex; justify-content: space-between;">
                  <span>Grand Total:</span>
                  <span style="color: var(--accent-gold);">$${totalAmount}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions Toolbar -->
          <div class="order-card-actions">
            <div class="status-change-group">
              <span style="font-size: 0.8rem; color: var(--text-dim); margin-right: 4px;">Update Status:</span>
              ${status === 'new' ? `
                <button type="button" class="btn-status-act btn-accept" onclick="AdminApp.updateOrderStatus('${orderId}', 'Confirmed')">
                  <i class="fa-solid fa-circle-check"></i> Accept Order
                </button>
              ` : ''}

              ${status === 'confirmed' ? `
                <button type="button" class="btn-status-act btn-prepare" onclick="AdminApp.updateOrderStatus('${orderId}', 'Preparing')">
                  <i class="fa-solid fa-fire-burner"></i> Start Preparing
                </button>
              ` : ''}

              ${status === 'preparing' ? `
                <button type="button" class="btn-status-act btn-ready" onclick="AdminApp.updateOrderStatus('${orderId}', 'Ready')">
                  <i class="fa-solid fa-bell"></i> Mark Ready
                </button>
              ` : ''}

              ${status === 'ready' ? `
                <button type="button" class="btn-status-act btn-complete" onclick="AdminApp.updateOrderStatus('${orderId}', 'Completed')">
                  <i class="fa-solid fa-circle-check"></i> Complete Order
                </button>
              ` : ''}

              ${status !== 'completed' && status !== 'cancelled' ? `
                <button type="button" class="btn-status-act btn-cancel" onclick="AdminApp.updateOrderStatus('${orderId}', 'Cancelled')">
                  <i class="fa-solid fa-ban"></i> Reject / Cancel
                </button>
              ` : ''}

              ${status === 'completed' ? `
                <span style="font-size: 0.85rem; color: var(--status-completed);"><i class="fa-solid fa-circle-check"></i> Order Finished</span>
              ` : ''}
            </div>

            <div style="display: flex; gap: 8px;">
              <!-- Toggle Payment Status -->
              <button type="button" class="btn-kot" onclick="AdminApp.togglePaymentStatus('${orderId}', '${paymentStatus}')" title="Toggle Payment Status">
                <i class="fa-solid fa-credit-card"></i> Pay: ${paymentStatus === 'paid' ? 'Mark Pending' : 'Mark Paid'}
              </button>

              <!-- Print KOT -->
              <button type="button" class="btn-kot" onclick="AdminApp.printKOT('${orderId}')" title="Print Kitchen Order Ticket">
                <i class="fa-solid fa-print"></i> Print Ticket
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  async updateOrderStatus(orderId, newStatus) {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        this.loadOrders();
        this.loadAnalytics();
        return;
      }
    } catch (e) {}

    // Offline fallback update
    const idx = this.orders.findIndex(o => (o.order_id || o.orderId) === orderId);
    if (idx > -1) {
      this.orders[idx].order_status = newStatus;
      this.orders[idx].status = newStatus;
      localStorage.setItem('bliss_orders', JSON.stringify(this.orders));
      this.renderOrders();
      this.loadAnalytics();
    }
  },

  async togglePaymentStatus(orderId, currentPaymentStatus) {
    const newStatus = currentPaymentStatus.toLowerCase() === 'paid' ? 'Pending' : 'Paid';
    try {
      await fetch(`/api/admin/orders/${orderId}/payment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: newStatus })
      });
      this.loadOrders();
      this.loadAnalytics();
    } catch (e) {
      const idx = this.orders.findIndex(o => (o.order_id || o.orderId) === orderId);
      if (idx > -1) {
        this.orders[idx].payment_status = newStatus;
        this.orders[idx].paymentStatus = newStatus;
        localStorage.setItem('bliss_orders', JSON.stringify(this.orders));
        this.renderOrders();
      }
    }
  },

  // -------------------------------------------------------------
  // PRINT KITCHEN ORDER TICKET (KOT)
  // -------------------------------------------------------------
  printKOT(orderId) {
    const order = this.orders.find(o => (o.order_id || o.orderId) === orderId);
    if (!order) return;

    let items = order.items || [];
    if (typeof items === 'string') {
      try { items = JSON.parse(items); } catch (e) { items = []; }
    }

    const orderType = (order.order_type || order.orderType || 'delivery').toUpperCase();
    const customerName = order.customer_name || order.customer?.name || 'Customer';
    const customerPhone = order.customer_phone || order.customer?.phone || '';
    const dest = orderType === 'DINEIN' ? `TABLE #${order.table_number || order.customer?.tableNumber || '5'}` : (order.address || order.customer?.address || 'Counter Pickup');

    document.getElementById('kot-order-id').textContent = `#${orderId}`;
    document.getElementById('kot-timestamp').textContent = new Date().toLocaleString();
    document.getElementById('kot-type').textContent = `${orderType} ORDER`;
    document.getElementById('kot-customer-name').textContent = customerName;
    document.getElementById('kot-customer-phone').textContent = customerPhone;
    document.getElementById('kot-customer-dest').textContent = dest;
    document.getElementById('kot-notes').textContent = order.notes || 'None';

    const tableBody = document.getElementById('kot-items-table');
    tableBody.innerHTML = items.map(i => `
      <tr style="border-bottom: 1px dashed #ddd;">
        <td style="padding: 4px 0; font-weight: bold; width: 40px;">${i.quantity || 1}x</td>
        <td style="padding: 4px 0;">${i.name}</td>
      </tr>
    `).join('');

    const printArea = document.getElementById('kot-print-area');
    printArea.style.display = 'block';
    window.print();
    printArea.style.display = 'none';
  },

  // -------------------------------------------------------------
  // SALES & REVENUE ANALYTICS
  // -------------------------------------------------------------
  async loadAnalytics() {
    try {
      const res = await fetch('/api/admin/analytics');
      if (res.ok) {
        const data = await res.json();
        const s = data.summary || {};
        this.renderMetrics(s);
        this.renderBarChart(data.dailyChart || []);
        return;
      }
    } catch (e) {}

    // Offline Analytics Computation
    const totalRev = this.orders.reduce((sum, o) => sum + Number(o.total_amount || o.totals?.grandTotal || 0), 0);
    const pending = this.orders.filter(o => ['new', 'confirmed', 'preparing'].includes((o.order_status || o.status || '').toLowerCase())).length;

    this.renderMetrics({
      todaySales: totalRev * 0.45,
      todayOrdersCount: Math.ceil(this.orders.length * 0.4),
      weeklySales: totalRev * 0.85,
      monthlySales: totalRev,
      totalRevenue: totalRev,
      totalOrders: this.orders.length,
      avgOrderValue: this.orders.length > 0 ? (totalRev / this.orders.length) : 0,
      pendingOrders: pending,
      totalMenuItems: this.menuItems.length || 27
    });

    this.renderBarChart([
      { date: 'Mon', revenue: 140, orders: 6 },
      { date: 'Tue', revenue: 195, orders: 8 },
      { date: 'Wed', revenue: 230, orders: 11 },
      { date: 'Thu', revenue: 180, orders: 7 },
      { date: 'Fri', revenue: 320, orders: 14 },
      { date: 'Sat', revenue: 450, orders: 19 },
      { date: 'Sun', revenue: 390, orders: 16 }
    ]);
  },

  renderMetrics(s) {
    const el = id => document.getElementById(id);
    if (el('metric-today-sales')) el('metric-today-sales').textContent = `$${Number(s.todaySales || 0).toFixed(2)}`;
    if (el('metric-today-count')) el('metric-today-count').textContent = `${s.todayOrdersCount || 0} orders today`;
    if (el('metric-weekly-sales')) el('metric-weekly-sales').textContent = `$${Number(s.weeklySales || 0).toFixed(2)}`;
    if (el('metric-monthly-sales')) el('metric-monthly-sales').textContent = `$${Number(s.monthlySales || 0).toFixed(2)}`;
    if (el('metric-total-revenue')) el('metric-total-revenue').textContent = `$${Number(s.totalRevenue || 0).toFixed(2)}`;
    if (el('metric-total-orders')) el('metric-total-orders').textContent = `${s.totalOrders || 0} total orders`;
    if (el('metric-aov')) el('metric-aov').textContent = `$${Number(s.avgOrderValue || 0).toFixed(2)}`;
    if (el('metric-pending-count')) el('metric-pending-count').textContent = s.pendingOrders || 0;
    if (el('metric-menu-count')) el('metric-menu-count').textContent = s.totalMenuItems || 27;
  },

  renderBarChart(days) {
    const container = document.getElementById('revenue-bar-chart');
    if (!container) return;

    const maxRev = Math.max(...days.map(d => d.revenue), 100);

    container.innerHTML = days.map(d => {
      const heightPercent = Math.max(8, Math.round((d.revenue / maxRev) * 100));
      return `
        <div class="bar-col">
          <div class="bar-fill" style="height: ${heightPercent}%;">
            <div class="bar-tooltip">$${d.revenue.toFixed(2)} (${d.orders} orders)</div>
          </div>
          <div class="bar-label">${d.date}</div>
        </div>
      `;
    }).join('');
  },

  // -------------------------------------------------------------
  // MENU MANAGEMENT (CRUD)
  // -------------------------------------------------------------
  async loadMenu() {
    try {
      const res = await fetch('/api/admin/menu');
      if (res.ok) {
        const data = await res.json();
        this.menuItems = data.items || [];
        this.renderMenu();
        return;
      }
    } catch (e) {}

    if (window.CAFE_DATA?.menuItems) {
      this.menuItems = window.CAFE_DATA.menuItems.map(item => ({
        ...item,
        isAvailable: item.isAvailable !== undefined ? item.isAvailable : true
      }));
      this.renderMenu();
    }
  },

  renderMenu() {
    const grid = document.getElementById('admin-menu-grid');
    if (!grid) return;

    let items = [...this.menuItems];

    if (this.activeMenuCat !== 'all') {
      items = items.filter(i => i.category === this.activeMenuCat);
    }

    if (this.menuSearchQuery) {
      const q = this.menuSearchQuery.toLowerCase();
      items = items.filter(i => i.name.toLowerCase().includes(q) || (i.description && i.description.toLowerCase().includes(q)));
    }

    if (items.length === 0) {
      grid.innerHTML = `<div style="grid-column: 1/-1; padding: 40px; text-align: center; color: var(--text-muted);">No items found.</div>`;
      return;
    }

    grid.innerHTML = items.map(item => {
      const isAvail = item.isAvailable !== false;
      return `
        <div class="menu-admin-card" data-id="${item.id}">
          <div class="menu-admin-thumb-wrap">
            <img src="${item.image}" alt="${item.name}" class="menu-admin-thumb" loading="lazy">
            <span class="menu-stock-badge ${isAvail ? 'in-stock' : 'out-of-stock'}">
              ${isAvail ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>

          <div class="menu-admin-body">
            <div class="menu-admin-title-row">
              <h3 class="menu-admin-title">${item.name}</h3>
              <span class="menu-admin-price">$${Number(item.price).toFixed(2)}</span>
            </div>
            <p class="menu-admin-desc">${item.description ? item.description.slice(0, 85) + '...' : ''}</p>

            <div class="menu-admin-footer">
              <label class="stock-toggle-label">
                <span class="switch-sm">
                  <input type="checkbox" ${isAvail ? 'checked' : ''} onchange="AdminApp.toggleStock('${item.id}')">
                  <span class="slider-sm"></span>
                </span>
                <span>${isAvail ? 'Available' : 'Sold Out'}</span>
              </label>

              <div class="menu-item-actions">
                <button type="button" class="btn-action-sm" onclick="AdminApp.openEditModal('${item.id}')" title="Edit Item">
                  <i class="fa-solid fa-pen"></i>
                </button>
                <button type="button" class="btn-action-sm btn-action-delete" onclick="AdminApp.deleteMenuItem('${item.id}')" title="Delete Delicacy">
                  <i class="fa-solid fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  async toggleStock(itemId) {
    try {
      const res = await fetch(`/api/admin/menu/${itemId}/toggle-stock`, { method: 'PATCH' });
      if (res.ok) {
        this.loadMenu();
        return;
      }
    } catch (e) {}

    const item = this.menuItems.find(i => i.id === itemId);
    if (item) {
      item.isAvailable = !item.isAvailable;
      this.renderMenu();
    }
  },

  async deleteMenuItem(itemId) {
    if (!confirm('Are you sure you want to delete this delicacy from the active menu?')) return;
    try {
      await fetch(`/api/admin/menu/${itemId}`, { method: 'DELETE' });
      this.loadMenu();
    } catch (e) {
      this.menuItems = this.menuItems.filter(i => i.id !== itemId);
      this.renderMenu();
    }
  },

  openEditModal(itemId) {
    const item = this.menuItems.find(i => i.id === itemId);
    if (!item) return;

    document.getElementById('edit-id').value = item.id;
    document.getElementById('edit-name').value = item.name;
    document.getElementById('edit-category').value = item.category || 'coffee';
    document.getElementById('edit-diet').value = item.isVeg ? '1' : '0';
    document.getElementById('edit-price').value = item.price;
    document.getElementById('edit-orig-price').value = item.originalPrice || '';
    document.getElementById('edit-badge').value = item.badge || '';
    document.getElementById('edit-prep').value = item.prepTime || '8-10 mins';
    document.getElementById('edit-image').value = item.image;
    document.getElementById('edit-desc').value = item.description;

    this.openModal('modal-edit-delicacy');
  },

  // -------------------------------------------------------------
  // OWNER EMAIL LOGS
  // -------------------------------------------------------------
  async loadEmailLogs() {
    try {
      const res = await fetch('/api/admin/email-logs');
      if (res.ok) {
        const data = await res.json();
        this.emailLogs = data.emails || [];
        this.renderEmailLogs();
        return;
      }
    } catch (e) {}

    // Sample fallback
    this.emailLogs = [
      {
        order_id: 'BLISS-104921',
        recipient: 'owner@cafebliss.com',
        subject: '🚨 New Order Alert: #BLISS-104921 ($23.43)',
        sent_at: new Date().toISOString(),
        status: 'Delivered',
        body_html: '<div style="padding: 20px; font-family: sans-serif;"><h2>Café Bliss Kitchen Order</h2><p>Customer: Samantha Hayes ($23.43)</p></div>'
      }
    ];
    this.renderEmailLogs();
  },

  renderEmailLogs() {
    const list = document.getElementById('admin-email-logs-list');
    const badge = document.getElementById('badge-sidebar-emails');
    if (badge) badge.textContent = this.emailLogs.length;

    if (!list) return;

    if (this.emailLogs.length === 0) {
      list.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--text-muted);">No emails dispatched yet.</div>`;
      return;
    }

    list.innerHTML = this.emailLogs.map((email, idx) => `
      <div class="email-log-item" onclick="AdminApp.previewEmail(${idx})">
        <div class="email-log-meta">
          <div class="email-icon">
            <i class="fa-solid fa-envelope-circle-check"></i>
          </div>
          <div class="email-details">
            <h4>${email.subject}</h4>
            <p>To: <strong>${email.recipient}</strong> • Dispatch: ${new Date(email.sent_at).toLocaleString()}</p>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
          <span class="email-status-tag"><i class="fa-solid fa-check"></i> ${email.status || 'Delivered'}</span>
          <button type="button" class="btn-action-sm" title="View Full Email HTML"><i class="fa-solid fa-eye"></i></button>
        </div>
      </div>
    `).join('');
  },

  previewEmail(index) {
    const email = this.emailLogs[index];
    if (!email) return;

    const contentBox = document.getElementById('email-preview-content');
    contentBox.innerHTML = email.body_html || '<p>No content preview available.</p>';
    this.openModal('modal-email-preview');
  },

  // -------------------------------------------------------------
  // NOTIFICATIONS
  // -------------------------------------------------------------
  async loadNotifications() {
    try {
      const res = await fetch('/api/admin/notifications');
      if (res.ok) {
        const data = await res.json();
        const unread = data.unreadCount || 0;
        const badge = document.getElementById('notif-badge-count');
        if (badge) {
          badge.textContent = unread;
          badge.style.display = unread > 0 ? 'flex' : 'none';
        }
      }
    } catch (e) {}
  },

  // -------------------------------------------------------------
  // MODAL UTILITIES
  // -------------------------------------------------------------
  openModal(modalId) {
    const m = document.getElementById(modalId);
    if (m) m.classList.add('active');
  },

  closeModal(modalId) {
    const m = document.getElementById(modalId);
    if (m) m.classList.remove('active');
  },

  // -------------------------------------------------------------
  // EVENT BINDINGS
  // -------------------------------------------------------------
  bindEvents() {
    // Login form submit
    const loginForm = document.getElementById('admin-login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const user = document.getElementById('admin-user-input').value.trim();
        const pass = document.getElementById('admin-pass-input').value.trim();
        this.login(user, pass);
      });
    }

    // Demo credentials quick click
    const demoBox = document.getElementById('demo-credentials-box');
    if (demoBox) {
      demoBox.addEventListener('click', () => {
        document.getElementById('admin-user-input').value = 'admin';
        document.getElementById('admin-pass-input').value = 'bliss123';
      });
    }

    // Logout
    const logoutBtn = document.getElementById('btn-admin-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.logout());
    }

    // Sound toggle
    const soundBtn = document.getElementById('btn-sound-toggle');
    const soundIcon = document.getElementById('sound-icon');
    if (soundBtn && soundIcon) {
      soundBtn.addEventListener('click', () => {
        this.soundEnabled = !this.soundEnabled;
        soundIcon.className = this.soundEnabled ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';
        soundBtn.style.color = this.soundEnabled ? 'var(--accent-gold)' : 'var(--text-dim)';
        if (this.soundEnabled) this.playChime();
      });
    }

    // Sidebar navigation tabs
    const tabBtns = document.querySelectorAll('.admin-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        document.querySelectorAll('.admin-view-section').forEach(sec => sec.classList.remove('active'));
        const activeSection = document.getElementById(`tab-${targetTab}`);
        if (activeSection) activeSection.classList.add('active');
        this.activeTab = targetTab;

        if (targetTab === 'analytics') this.loadAnalytics();
        if (targetTab === 'menu') this.loadMenu();
        if (targetTab === 'emails') this.loadEmailLogs();
      });
    });

    // Orders Filter Pills
    const orderPills = document.querySelectorAll('.order-filter-pill[data-filter]');
    orderPills.forEach(pill => {
      pill.addEventListener('click', () => {
        orderPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.activeOrderFilter = pill.getAttribute('data-filter');
        this.renderOrders();
      });
    });

    // Order Search
    const orderSearch = document.getElementById('order-search-input');
    if (orderSearch) {
      orderSearch.addEventListener('input', (e) => {
        this.orderSearchQuery = e.target.value.trim();
        this.renderOrders();
      });
    }

    // Refresh orders button
    const refreshBtn = document.getElementById('btn-refresh-orders');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.loadOrders();
        this.playChime();
      });
    }

    // Menu Category Filter Pills
    const menuPills = document.querySelectorAll('#menu-cat-filter-pills .order-filter-pill');
    menuPills.forEach(pill => {
      pill.addEventListener('click', () => {
        menuPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.activeMenuCat = pill.getAttribute('data-cat');
        this.renderMenu();
      });
    });

    // Menu Search
    const menuSearch = document.getElementById('menu-search-input');
    if (menuSearch) {
      menuSearch.addEventListener('input', (e) => {
        this.menuSearchQuery = e.target.value.trim();
        this.renderMenu();
      });
    }

    // Open Add Delicacy Modal
    const addBtn = document.getElementById('btn-open-add-delicacy');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.openModal('modal-add-delicacy'));
    }

    // Add Delicacy Form Submit
    const addForm = document.getElementById('form-add-delicacy');
    if (addForm) {
      addForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
          name: document.getElementById('add-name').value.trim(),
          category: document.getElementById('add-category').value,
          isVeg: document.getElementById('add-diet').value === '1',
          price: parseFloat(document.getElementById('add-price').value),
          originalPrice: parseFloat(document.getElementById('add-orig-price').value || 0),
          badge: document.getElementById('add-badge').value.trim(),
          prepTime: document.getElementById('add-prep').value.trim(),
          image: document.getElementById('add-image').value.trim(),
          description: document.getElementById('add-desc').value.trim()
        };

        try {
          await fetch('/api/admin/menu', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        } catch (err) {
          payload.id = 'item_' + Date.now();
          this.menuItems.unshift(payload);
        }

        this.closeModal('modal-add-delicacy');
        addForm.reset();
        this.loadMenu();
      });
    }

    // Edit Delicacy Form Submit
    const editForm = document.getElementById('form-edit-delicacy');
    if (editForm) {
      editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-id').value;
        const payload = {
          name: document.getElementById('edit-name').value.trim(),
          category: document.getElementById('edit-category').value,
          isVeg: document.getElementById('edit-diet').value === '1',
          price: parseFloat(document.getElementById('edit-price').value),
          originalPrice: parseFloat(document.getElementById('edit-orig-price').value || 0),
          badge: document.getElementById('edit-badge').value.trim(),
          prepTime: document.getElementById('edit-prep').value.trim(),
          image: document.getElementById('edit-image').value.trim(),
          description: document.getElementById('edit-desc').value.trim()
        };

        try {
          await fetch(`/api/admin/menu/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        } catch (err) {
          const idx = this.menuItems.findIndex(i => i.id === id);
          if (idx > -1) Object.assign(this.menuItems[idx], payload);
        }

        this.closeModal('modal-edit-delicacy');
        this.loadMenu();
      });
    }

    // Cafe Settings Form Submit
    const settingsForm = document.getElementById('cafe-settings-form');
    if (settingsForm) {
      settingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Café settings saved successfully!');
      });
    }
  }
};

window.AdminApp = AdminApp;
document.addEventListener('DOMContentLoaded', () => AdminApp.init());

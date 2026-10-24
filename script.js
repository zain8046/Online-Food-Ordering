/**
 * SAFFRON & STONE KITCHEN — APPLICATION JAVASCRIPT
 * Course: Web Engineering | Project: Online Food Ordering
 * Technologies: HTML5, CSS3, Bootstrap 5, Vanilla JavaScript
 *
 * Architecture Highlights:
 * 1. Single source of truth for menu items, pricing, and cart state.
 * 2. Real-time mathematical calculation of subtotals, delivery fees, and discounts.
 * 3. Safe DOM generation using createElement & textContent (XSS prevention).
 * 4. Client-side input validation with Bootstrap feedback.
 * 5. Non-sensitive cart persistence via localStorage.
 * 6. Responsive UI interactions: category filtering, live search, dark mode toggle.
 */

'use strict';

// =============================================================================
// 1. MASTER MENU CATALOG (APPLICATION DATA SOURCE OF TRUTH)
// =============================================================================
const MENU_CATALOG = Object.freeze({
  'burger-01': {
    id: 'burger-01',
    name: 'Artisan Wagyu Smash Burger',
    category: 'handhelds',
    price: 1450,
    image: 'images/burger.jpg',
    description: 'Two grass-fed beef smash patties, aged cheddar, saffron aioli, toasted brioche.'
  },
  'pizza-01': {
    id: 'pizza-01',
    name: 'Wood-Fired Truffle Pizza',
    category: 'mains',
    price: 1850,
    image: 'images/pizza.jpg',
    description: '48-hour fermented sourdough crust, San Marzano pomodoro, buffalo mozzarella, white truffle oil.'
  },
  'pasta-01': {
    id: 'pasta-01',
    name: 'Wild Mushroom Fettuccine',
    category: 'mains',
    price: 1650,
    image: 'images/pasta.jpg',
    description: 'Fresh egg fettuccine, porcini-shiitake cream sauce, fresh garden thyme, Parmigiano-Reggiano.'
  },
  'sandwich-01': {
    id: 'sandwich-01',
    name: 'Smoked Sourdough Sandwich',
    category: 'handhelds',
    price: 1150,
    image: 'images/sandwich.jpg',
    description: 'Hickory-smoked chicken, avocado, crisp greens, vine tomatoes, stoneground herb Dijon on sourdough.'
  },
  'fries-01': {
    id: 'fries-01',
    name: 'Rosemary Parmesan Fries',
    category: 'sides',
    price: 650,
    image: 'images/fries.jpg',
    description: 'Double-fried Russet potatoes tossed with fresh rosemary, Himalayan pink salt, and aged parmesan.'
  },
  'drink-01': {
    id: 'drink-01',
    name: 'Botanical Saffron Cooler',
    category: 'sides',
    price: 450,
    image: 'images/drink.jpg',
    description: 'Sparkling cooler with blood orange, fresh mint leaves, wild cardamom, and golden saffron cordial.'
  }
});

// Promotional Combo Bundles definition
const PROMOTIONAL_BUNDLES = Object.freeze({
  feast: {
    name: 'The Saffron Feast Bundle',
    items: [
      { id: 'pizza-01', qty: 1 },
      { id: 'burger-01', qty: 1 },
      { id: 'fries-01', qty: 1 },
      { id: 'drink-01', qty: 2 }
    ],
    originalTotal: 4400,
    discountedPrice: 3850,
    discountAmount: 550
  },
  lunch: {
    name: 'Artisan Lunch Express',
    items: [
      { id: 'sandwich-01', qty: 1 },
      { id: 'fries-01', qty: 1 },
      { id: 'drink-01', qty: 1 }
    ],
    originalTotal: 2250,
    discountedPrice: 1650,
    discountAmount: 600
  }
});

// Delivery pricing constants
const DELIVERY_FEE_STANDARD = 150;
const FREE_DELIVERY_THRESHOLD = 3000;

// =============================================================================
// 2. APPLICATION STATE MANAGEMENT
// =============================================================================
const AppState = {
  // Cart maps item id -> quantity { 'burger-01': 2, ... }
  cart: {},
  appliedBundles: [],
  serviceType: 'delivery', // 'delivery' or 'pickup'

  // Cart helper functions
  addItem(itemId, qty = 1) {
    if (!MENU_CATALOG[itemId]) {
      console.warn(`Attempted to add invalid item id: ${itemId}`);
      return;
    }
    const currentQty = this.cart[itemId] || 0;
    this.cart[itemId] = Math.min(currentQty + qty, 50); // limit to reasonable max
    this.saveCartToStorage();
    UIController.renderCart();
  },

  updateItemQty(itemId, newQty) {
    if (newQty <= 0) {
      delete this.cart[itemId];
    } else {
      this.cart[itemId] = Math.min(newQty, 50);
    }
    this.saveCartToStorage();
    UIController.renderCart();
  },

  removeItem(itemId) {
    if (this.cart[itemId]) {
      delete this.cart[itemId];
      this.saveCartToStorage();
      UIController.renderCart();
    }
  },

  clearCart() {
    this.cart = {};
    this.appliedBundles = [];
    this.saveCartToStorage();
    UIController.renderCart();
  },

  addBundle(bundleKey) {
    const bundle = PROMOTIONAL_BUNDLES[bundleKey];
    if (!bundle) return;

    // Add each bundle item to cart
    bundle.items.forEach(bundleItem => {
      this.cart[bundleItem.id] = (this.cart[bundleItem.id] || 0) + bundleItem.qty;
    });

    if (!this.appliedBundles.includes(bundleKey)) {
      this.appliedBundles.push(bundleKey);
    }

    this.saveCartToStorage();
    UIController.renderCart();
  },

  // Compute pricing totals from trusted catalog values
  calculateTotals() {
    let subtotal = 0;
    let totalItems = 0;

    for (const [id, qty] of Object.entries(this.cart)) {
      const item = MENU_CATALOG[id];
      if (item && qty > 0) {
        subtotal += item.price * qty;
        totalItems += qty;
      }
    }

    // Calculate applied discounts from bundles
    let discount = 0;
    this.appliedBundles.forEach(bundleKey => {
      const bundle = PROMOTIONAL_BUNDLES[bundleKey];
      if (bundle) {
        // Verify user still has required bundle items
        const hasAllItems = bundle.items.every(bItem => (this.cart[bItem.id] || 0) >= bItem.qty);
        if (hasAllItems) {
          discount += bundle.discountAmount;
        }
      }
    });

    // Delivery fee rule
    let deliveryFee = 0;
    if (this.serviceType === 'delivery') {
      deliveryFee = (subtotal >= FREE_DELIVERY_THRESHOLD || subtotal === 0) ? 0 : DELIVERY_FEE_STANDARD;
    }

    const grandTotal = Math.max(0, subtotal - discount + deliveryFee);

    return {
      subtotal,
      totalItems,
      discount,
      deliveryFee,
      grandTotal
    };
  },

  // Non-sensitive localStorage persistence
  saveCartToStorage() {
    try {
      const payload = {
        cart: this.cart,
        appliedBundles: this.appliedBundles
      };
      localStorage.setItem('saffron_stone_cart', JSON.stringify(payload));
    } catch (e) {
      console.warn('LocalStorage unavailable or disabled', e);
    }
  },

  loadCartFromStorage() {
    try {
      const raw = localStorage.getItem('saffron_stone_cart');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.cart === 'object') {
          // Validate stored keys against master catalog
          for (const [key, qty] of Object.entries(parsed.cart)) {
            if (MENU_CATALOG[key] && typeof qty === 'number' && qty > 0) {
              this.cart[key] = qty;
            }
          }
          if (Array.isArray(parsed.appliedBundles)) {
            this.appliedBundles = parsed.appliedBundles.filter(b => PROMOTIONAL_BUNDLES[b]);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved cart', e);
      this.cart = {};
    }
  }
};

// =============================================================================
// 3. UI CONTROLLER (DOM RENDERING & EVENT HANDLING)
// =============================================================================
const UIController = {
  // Elements cache
  elements: {
    navCartBadge: document.getElementById('nav-cart-badge'),
    cartItemCountText: document.getElementById('cart-item-count-text'),
    cartEmptyState: document.getElementById('cart-empty-state'),
    cartActiveList: document.getElementById('cart-active-list'),
    calcSubtotal: document.getElementById('calc-subtotal'),
    calcDeliveryLabel: document.getElementById('calc-delivery-label'),
    calcDeliveryFee: document.getElementById('calc-delivery-fee'),
    calcDiscountRow: document.getElementById('calc-discount-row'),
    calcDiscountAmount: document.getElementById('calc-discount-amount'),
    calcGrandTotal: document.getElementById('calc-grand-total'),
    deliveryPerkText: document.getElementById('delivery-perk-text'),
    deliveryProgressBar: document.getElementById('delivery-progress-bar'),
    quickItemSelect: document.getElementById('quick-item-select'),
    quickItemQty: document.getElementById('quick-item-qty'),
    quickAddBtn: document.getElementById('quick-add-btn'),
    orderForm: document.getElementById('food-order-form'),
    clearOrderBtn: document.getElementById('clear-order-btn'),
    deliveryAddressContainer: document.getElementById('delivery-address-container'),
    orderAddressInput: document.getElementById('order-address'),
    menuSearchInput: document.getElementById('menu-search-input'),
    noMenuResults: document.getElementById('no-menu-results'),
    resetSearchBtn: document.getElementById('reset-search-btn'),
    themeToggleBtn: document.getElementById('theme-toggle-btn'),
    themeToggleIcon: document.getElementById('theme-toggle-icon'),
    themeToggleText: document.getElementById('theme-toggle-text'),
    currentDateDisplay: document.getElementById('current-date-display'),
    contactForm: document.getElementById('contact-form'),
    contactSuccessAlert: document.getElementById('contact-success-alert'),
    orderConfirmationModal: document.getElementById('orderConfirmationModal')
  },

  // Initialize UI components and listeners
  init() {
    this.displayCurrentDate();
    this.initTheme();
    this.bindEvents();
    AppState.loadCartFromStorage();

    // Check URL parameters for automated demonstration and testing screenshots
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('theme') === 'dark') {
      this.applyTheme('dark');
    }
    const isolateSection = urlParams.get('isolate');
    if (isolateSection) {
      const sections = ['hero', 'menu', 'about', 'offers', 'testimonials', 'order', 'contact'];
      sections.forEach(sId => {
        if (sId !== isolateSection) {
          const el = document.getElementById(sId);
          if (el) el.style.display = 'none';
        }
      });
    }
    if (urlParams.get('demo') === 'cart') {
      AppState.clearCart();
      AppState.addItem('pizza-01', 1);
      AppState.addItem('burger-01', 1);
      AppState.addItem('fries-01', 2);
      AppState.addItem('drink-01', 2);
    } else if (urlParams.get('demo') === 'modal') {
      AppState.clearCart();
      AppState.addItem('pizza-01', 1);
      AppState.addItem('burger-01', 1);
      AppState.addItem('fries-01', 1);
      AppState.addItem('drink-01', 1);
      const nameInput = document.getElementById('order-name');
      const emailInput = document.getElementById('order-email');
      const phoneInput = document.getElementById('order-phone');
      const addressInput = document.getElementById('order-address');
      if (nameInput) nameInput.value = 'M Zain Ul Abideen';
      if (emailInput) emailInput.value = 'zain@example.com';
      if (phoneInput) phoneInput.value = '0300-1234567';
      if (addressInput) addressInput.value = 'House 14, Street 25, F-7/2, Islamabad';
      setTimeout(() => this.handleOrderSubmission(), 150);
    }

    if (urlParams.get('scroll')) {
      const targetEl = document.getElementById(urlParams.get('scroll'));
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'instant', block: 'start' });
      }
    }

    this.renderCart();
  },

  // Display human-readable current date
  displayCurrentDate() {
    if (!this.elements.currentDateDisplay) return;
    const now = new Date();
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    const dateStr = now.toLocaleDateString('en-PK', options);
    this.elements.currentDateDisplay.innerHTML = `<i class="bi bi-calendar3 me-1 text-accent" aria-hidden="true"></i> ${dateStr}`;
  },

  // Bind all interactive page events
  bindEvents() {
    // 1. Menu "Add to Order" buttons (Event delegation)
    document.addEventListener('click', (e) => {
      const addBtn = e.target.closest('.add-to-order-btn');
      if (addBtn) {
        const itemId = addBtn.getAttribute('data-id');
        AppState.addItem(itemId, 1);
        this.animateBadgeBounce();
        this.showToastNotification(`Added ${MENU_CATALOG[itemId].name} to your order.`);
      }

      // Special Offer Bundle button
      const bundleBtn = e.target.closest('.add-bundle-btn');
      if (bundleBtn) {
        const bundleKey = bundleBtn.getAttribute('data-bundle');
        AppState.addBundle(bundleKey);
        this.animateBadgeBounce();
        this.showToastNotification(`Claimed ${PROMOTIONAL_BUNDLES[bundleKey].name}! Discount applied.`);
        // Smooth scroll to order section
        document.getElementById('order')?.scrollIntoView({ behavior: 'smooth' });
      }
    });

    // 2. Quick Item Selector in Order Form
    if (this.elements.quickAddBtn) {
      this.elements.quickAddBtn.addEventListener('click', () => {
        const select = this.elements.quickItemSelect;
        const itemId = select ? select.value : null;
        const qty = parseInt(this.elements.quickItemQty?.value, 10) || 1;
        if (itemId && qty > 0) {
          AppState.addItem(itemId, qty);
          this.animateBadgeBounce();
          this.showToastNotification(`Added ${qty}x ${MENU_CATALOG[itemId].name} to your order.`);
        }
      });
    }

    // 3. Clear / Reset Order button
    if (this.elements.clearOrderBtn) {
      this.elements.clearOrderBtn.addEventListener('click', () => {
        if (Object.keys(AppState.cart).length === 0) {
          alert('Your order cart is already empty.');
          return;
        }
        if (confirm('Are you sure you want to clear your current order and reset the form?')) {
          AppState.clearCart();
          if (this.elements.orderForm) {
            this.elements.orderForm.reset();
            this.elements.orderForm.classList.remove('was-validated');
          }
          this.showToastNotification('Your order has been cleared.');
        }
      });
    }

    // 4. Delivery vs Pickup radio toggle
    const serviceRadios = document.querySelectorAll('input[name="orderServiceType"]');
    serviceRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        AppState.serviceType = e.target.value;
        if (this.elements.deliveryAddressContainer && this.elements.orderAddressInput) {
          if (AppState.serviceType === 'pickup') {
            this.elements.deliveryAddressContainer.classList.add('d-none');
            this.elements.orderAddressInput.removeAttribute('required');
          } else {
            this.elements.deliveryAddressContainer.classList.remove('d-none');
            this.elements.orderAddressInput.setAttribute('required', 'required');
          }
        }
        if (urlParams.get('scroll')) {
      const targetEl = document.getElementById(urlParams.get('scroll'));
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'instant', block: 'start' });
      }
    }

    this.renderCart();
      });
    });

    // 5. Category Filters
    const filterBtns = document.querySelectorAll('.btn-filter');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.filterMenu();
      });
    });

    // 6. Live Search Input
    if (this.elements.menuSearchInput) {
      this.elements.menuSearchInput.addEventListener('input', () => {
        this.filterMenu();
      });
    }

    if (this.elements.resetSearchBtn) {
      this.elements.resetSearchBtn.addEventListener('click', () => {
        if (this.elements.menuSearchInput) this.elements.menuSearchInput.value = '';
        const allBtn = document.querySelector('.btn-filter[data-category="all"]');
        if (allBtn) {
          filterBtns.forEach(b => b.classList.remove('active'));
          allBtn.classList.add('active');
        }
        this.filterMenu();
      });
    }

    // 7. Order Form Submit
    if (this.elements.orderForm) {
      this.elements.orderForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleOrderSubmission();
      });
    }

    // 8. Contact Form Submit
    if (this.elements.contactForm) {
      this.elements.contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleContactSubmission();
      });
    }

    // 9. Theme Toggle
    if (this.elements.themeToggleBtn) {
      this.elements.themeToggleBtn.addEventListener('click', () => {
        this.toggleTheme();
      });
    }

    // 10. Close mobile navigation on menu item click
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    const navCollapse = document.getElementById('navbarContent');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (navCollapse && navCollapse.classList.contains('show')) {
          const bsCollapse = bootstrap.Collapse.getInstance(navCollapse);
          if (bsCollapse) bsCollapse.hide();
        }
      });
    });
  },

  // Render the shopping cart breakdown safely using DOM nodes
  renderCart() {
    const totals = AppState.calculateTotals();

    // Update Badges and Counts
    if (this.elements.navCartBadge) {
      this.elements.navCartBadge.textContent = totals.totalItems;
    }
    if (this.elements.cartItemCountText) {
      this.elements.cartItemCountText.textContent = `${totals.totalItems} ${totals.totalItems === 1 ? 'item' : 'items'}`;
    }

    // Check if cart is empty
    const hasItems = totals.totalItems > 0;
    if (this.elements.cartEmptyState) {
      this.elements.cartEmptyState.classList.toggle('d-none', hasItems);
    }
    if (this.elements.cartActiveList) {
      this.elements.cartActiveList.classList.toggle('d-none', !hasItems);
      // Clear previous list
      this.elements.cartActiveList.innerHTML = '';
    }

    // Render active cart items safely
    if (hasItems && this.elements.cartActiveList) {
      for (const [id, qty] of Object.entries(AppState.cart)) {
        if (qty <= 0) continue;
        const item = MENU_CATALOG[id];
        if (!item) continue;

        const row = document.createElement('div');
        row.className = 'cart-item-row';

        // Thumbnail image
        const img = document.createElement('img');
        img.className = 'cart-item-thumb';
        img.src = item.image;
        img.alt = item.name;
        img.width = 52;
        img.height = 52;

        // Details column
        const details = document.createElement('div');
        details.className = 'cart-item-details';

        const nameEl = document.createElement('div');
        nameEl.className = 'cart-item-name';
        nameEl.textContent = item.name;

        const priceEl = document.createElement('div');
        priceEl.className = 'cart-item-price';
        priceEl.textContent = `Rs. ${item.price.toLocaleString()} × ${qty} = Rs. ${(item.price * qty).toLocaleString()}`;

        details.appendChild(nameEl);
        details.appendChild(priceEl);

        // Quantity Stepper
        const stepper = document.createElement('div');
        stepper.className = 'qty-stepper';

        // Decrement button
        const decBtn = document.createElement('button');
        decBtn.type = 'button';
        decBtn.className = 'btn-qty';
        decBtn.setAttribute('aria-label', `Decrease quantity of ${item.name}`);
        decBtn.innerHTML = '<i class="bi bi-dash" aria-hidden="true"></i>';
        decBtn.addEventListener('click', () => {
          AppState.updateItemQty(id, qty - 1);
        });

        // Quantity label
        const qtyLabel = document.createElement('span');
        qtyLabel.className = 'qty-display';
        qtyLabel.textContent = qty;

        // Increment button
        const incBtn = document.createElement('button');
        incBtn.type = 'button';
        incBtn.className = 'btn-qty';
        incBtn.setAttribute('aria-label', `Increase quantity of ${item.name}`);
        incBtn.innerHTML = '<i class="bi bi-plus" aria-hidden="true"></i>';
        incBtn.addEventListener('click', () => {
          AppState.updateItemQty(id, qty + 1);
        });

        stepper.appendChild(decBtn);
        stepper.appendChild(qtyLabel);
        stepper.appendChild(incBtn);

        // Remove button
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'btn-remove-item ms-2';
        removeBtn.setAttribute('aria-label', `Remove ${item.name} from order`);
        removeBtn.innerHTML = '<i class="bi bi-trash3" aria-hidden="true"></i>';
        removeBtn.addEventListener('click', () => {
          AppState.removeItem(id);
        });

        // Assemble row
        row.appendChild(img);
        row.appendChild(details);
        row.appendChild(stepper);
        row.appendChild(removeBtn);

        this.elements.cartActiveList.appendChild(row);
      }
    }

    // Render Calculation Figures
    if (this.elements.calcSubtotal) {
      this.elements.calcSubtotal.textContent = `Rs. ${totals.subtotal.toLocaleString()}`;
    }

    if (this.elements.calcDeliveryFee) {
      if (AppState.serviceType === 'pickup') {
        this.elements.calcDeliveryLabel.textContent = 'Service:';
        this.elements.calcDeliveryFee.textContent = 'Self Pickup (Free)';
      } else {
        this.elements.calcDeliveryLabel.textContent = 'Delivery Fee:';
        if (totals.subtotal === 0) {
          this.elements.calcDeliveryFee.textContent = 'Rs. 0';
        } else if (totals.deliveryFee === 0) {
          this.elements.calcDeliveryFee.innerHTML = '<span class="badge bg-success">FREE</span>';
        } else {
          this.elements.calcDeliveryFee.textContent = `Rs. ${totals.deliveryFee.toLocaleString()}`;
        }
      }
    }

    // Discount Row
    if (this.elements.calcDiscountRow && this.elements.calcDiscountAmount) {
      if (totals.discount > 0) {
        this.elements.calcDiscountRow.classList.remove('d-none');
        this.elements.calcDiscountAmount.textContent = `-Rs. ${totals.discount.toLocaleString()}`;
      } else {
        this.elements.calcDiscountRow.classList.add('d-none');
      }
    }

    if (this.elements.calcGrandTotal) {
      this.elements.calcGrandTotal.textContent = `Rs. ${totals.grandTotal.toLocaleString()}`;
    }

    // Delivery Perk Progress Bar
    if (this.elements.deliveryProgressBar && this.elements.deliveryPerkText) {
      if (AppState.serviceType === 'pickup') {
        this.elements.deliveryPerkText.innerHTML = '<i class="bi bi-shop me-1 text-forest"></i> Self Pickup selected at F-7 Markaz Hearth.';
        this.elements.deliveryProgressBar.style.width = '100%';
        this.elements.deliveryProgressBar.className = 'progress-bar bg-forest';
      } else if (totals.subtotal >= FREE_DELIVERY_THRESHOLD) {
        this.elements.deliveryPerkText.innerHTML = '<i class="bi bi-check-circle-fill text-success me-1"></i> You unlocked <strong>FREE Express Delivery</strong>!';
        this.elements.deliveryProgressBar.style.width = '100%';
        this.elements.deliveryProgressBar.className = 'progress-bar bg-success';
      } else {
        const remaining = FREE_DELIVERY_THRESHOLD - totals.subtotal;
        const percent = Math.min(100, Math.round((totals.subtotal / FREE_DELIVERY_THRESHOLD) * 100));
        this.elements.deliveryPerkText.innerHTML = `Add <strong>Rs. ${remaining.toLocaleString()}</strong> more for <strong>FREE Delivery</strong>!`;
        this.elements.deliveryProgressBar.style.width = `${percent}%`;
        this.elements.deliveryProgressBar.className = 'progress-bar bg-accent';
      }
    }
  },

  // Filter menu items by active category and search term
  filterMenu() {
    const activeCategoryBtn = document.querySelector('.btn-filter.active');
    const selectedCategory = activeCategoryBtn ? activeCategoryBtn.getAttribute('data-category') : 'all';
    const query = (this.elements.menuSearchInput?.value || '').trim().toLowerCase();

    const items = document.querySelectorAll('.menu-item-col');
    let visibleCount = 0;

    items.forEach(col => {
      const itemCategory = col.getAttribute('data-category');
      const itemName = (col.getAttribute('data-name') || '').toLowerCase();
      const itemText = col.textContent.toLowerCase();

      const matchesCategory = (selectedCategory === 'all' || itemCategory === selectedCategory);
      const matchesSearch = (!query || itemName.includes(query) || itemText.includes(query));

      if (matchesCategory && matchesSearch) {
        col.classList.remove('d-none');
        visibleCount++;
      } else {
        col.classList.add('d-none');
      }
    });

    if (this.elements.noMenuResults) {
      this.elements.noMenuResults.classList.toggle('d-none', visibleCount > 0);
    }
  },

  // Handle Order Form Validation & Submission
  handleOrderSubmission() {
    const form = this.elements.orderForm;
    if (!form) return;

    // Check if cart has items
    const totals = AppState.calculateTotals();
    if (totals.totalItems <= 0) {
      alert('Your cart is empty! Please add at least one dish from the menu before placing an order.');
      document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    // HTML5 Constraint Validation
    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      // Scroll to first invalid field
      const firstInvalid = form.querySelector(':invalid');
      if (firstInvalid) {
        firstInvalid.focus();
      }
      return;
    }

    // Extract validated customer details
    const customerName = document.getElementById('order-name')?.value.trim();
    const customerEmail = document.getElementById('order-email')?.value.trim();
    const customerPhone = document.getElementById('order-phone')?.value.trim();
    const customerAddress = (AppState.serviceType === 'delivery')
      ? (document.getElementById('order-address')?.value.trim() || 'Not specified')
      : 'Self Pickup at Restaurant Hearth';
    const specialNotes = document.getElementById('order-notes')?.value.trim() || 'None';

    // Generate simulated order reference and timestamp
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const orderRef = `#SFS-2026-${randomNum}`;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ', ' + new Date().toLocaleDateString();

    // Populate Confirmation Modal fields safely
    document.getElementById('modal-order-ref').textContent = orderRef;
    document.getElementById('modal-order-time').textContent = timestamp;
    document.getElementById('modal-cust-name').textContent = customerName;
    document.getElementById('modal-cust-email').textContent = customerEmail;
    document.getElementById('modal-cust-phone').textContent = customerPhone;
    document.getElementById('modal-order-service').textContent = (AppState.serviceType === 'delivery') ? 'Express Delivery (35-45 Min)' : 'Self Pickup (20 Min)';
    document.getElementById('modal-cust-address').textContent = customerAddress;
    document.getElementById('modal-cust-notes').textContent = specialNotes;

    // Populate Modal itemized breakdown table
    const modalTbody = document.getElementById('modal-items-tbody');
    if (modalTbody) {
      modalTbody.innerHTML = '';
      for (const [id, qty] of Object.entries(AppState.cart)) {
        if (qty <= 0) continue;
        const item = MENU_CATALOG[id];
        if (!item) continue;

        const tr = document.createElement('tr');

        const tdName = document.createElement('td');
        tdName.className = 'fw-semibold text-dark';
        tdName.textContent = item.name;

        const tdQty = document.createElement('td');
        tdQty.className = 'text-center';
        tdQty.textContent = qty;

        const tdPrice = document.createElement('td');
        tdPrice.className = 'text-end text-muted';
        tdPrice.textContent = `Rs. ${item.price.toLocaleString()}`;

        const tdTotal = document.createElement('td');
        tdTotal.className = 'text-end fw-semibold text-dark';
        tdTotal.textContent = `Rs. ${(item.price * qty).toLocaleString()}`;

        tr.appendChild(tdName);
        tr.appendChild(tdQty);
        tr.appendChild(tdPrice);
        tr.appendChild(tdTotal);

        modalTbody.appendChild(tr);
      }
    }

    document.getElementById('modal-subtotal').textContent = `Rs. ${totals.subtotal.toLocaleString()}`;
    document.getElementById('modal-delivery').textContent = (totals.deliveryFee === 0) ? 'Free' : `Rs. ${totals.deliveryFee.toLocaleString()}`;

    const modalDiscountRow = document.getElementById('modal-discount-row');
    if (modalDiscountRow) {
      if (totals.discount > 0) {
        modalDiscountRow.classList.remove('d-none');
        document.getElementById('modal-discount').textContent = `-Rs. ${totals.discount.toLocaleString()}`;
      } else {
        modalDiscountRow.classList.add('d-none');
      }
    }

    document.getElementById('modal-total').textContent = `Rs. ${totals.grandTotal.toLocaleString()}`;

    // Show Confirmation Modal via Bootstrap 5 API
    const modalEl = this.elements.orderConfirmationModal;
    if (modalEl) {
      const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);
      bsModal.show();
    }

    // Reset form validation styling
    form.classList.remove('was-validated');
  },

  // Handle Contact Form Submission
  handleContactSubmission() {
    const form = this.elements.contactForm;
    if (!form) return;

    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      const firstInvalid = form.querySelector(':invalid');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    const name = document.getElementById('contact-name')?.value.trim();
    if (this.elements.contactSuccessAlert) {
      this.elements.contactSuccessAlert.classList.remove('d-none');
      const textEl = document.getElementById('contact-success-text');
      if (textEl) {
        textEl.textContent = `Thank you, ${name}! Your inquiry has been received. Please note: As this is a university academic demonstration, no real email was dispatched to an external server.`;
      }
    }

    form.reset();
    form.classList.remove('was-validated');
  },

  // Dark / Light Theme Switching
  initTheme() {
    let savedTheme = 'light';
    try {
      savedTheme = localStorage.getItem('saffron_stone_theme') || 'light';
    } catch (e) {
      console.warn(e);
    }
    this.applyTheme(savedTheme);
  },

  applyTheme(theme) {
    document.documentElement.setAttribute('data-bs-theme', theme);
    const isDark = theme === 'dark';
    if (this.elements.themeToggleIcon) {
      this.elements.themeToggleIcon.className = isDark ? 'bi bi-sun-fill text-warning' : 'bi bi-moon-stars';
    }
    if (this.elements.themeToggleText) {
      this.elements.themeToggleText.textContent = isDark ? 'Light' : 'Dark';
    }
    try {
      localStorage.setItem('saffron_stone_theme', theme);
    } catch (e) {
      console.warn(e);
    }
  },

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-bs-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    this.applyTheme(next);
  },

  // Interactive micro-animations
  animateBadgeBounce() {
    const badge = this.elements.navCartBadge;
    if (!badge) return;
    badge.classList.remove('bounce-anim');
    void badge.offsetWidth; // trigger reflow
    badge.classList.add('bounce-anim');
  },

  // Ephemeral toast notification
  showToastNotification(message) {
    // Check if an existing toast exists
    let toast = document.getElementById('app-ephemeral-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'app-ephemeral-toast';
      toast.style.position = 'fixed';
      toast.style.bottom = '24px';
      toast.style.right = '24px';
      toast.style.backgroundColor = 'var(--color-forest)';
      toast.style.color = 'var(--color-ivory)';
      toast.style.padding = '12px 20px';
      toast.style.borderRadius = 'var(--radius-pill)';
      toast.style.boxShadow = '0 10px 30px rgba(0,0,0,0.25)';
      toast.style.zIndex = '99999';
      toast.style.fontSize = '0.9rem';
      toast.style.fontWeight = '500';
      toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(15px)';
      document.body.appendChild(toast);
    }

    toast.innerHTML = `<i class="bi bi-bag-check-fill text-accent me-2" aria-hidden="true"></i> ${message}`;
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';

    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(15px)';
    }, 2800);
  }
};

// Initialize application on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  UIController.init();
});

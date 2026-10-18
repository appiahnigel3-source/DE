// Base API configuration
const API_BASE = window.location.port === '5000' ? '/api' : 'http://localhost:5000/api';

// Fallback initial products in case backend server is starting up
const fallbackProducts = [
  { id: 1, name: 'DE Signature Hoodie', price: 79.99, cat: 'men', badge: 'NEW', img: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=85' },
  { id: 2, name: 'DE Premium Tee', price: 49.99, cat: 'men', badge: 'NEW', img: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85' },
  { id: 3, name: 'DE Cargo Pants', price: 79.99, cat: 'men', badge: '-20%', img: 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=900&q=85' },
  { id: 4, name: 'DE Minimal Hoodie', price: 74.99, cat: 'women', badge: 'NEW', img: 'https://images.unsplash.com/photo-1578681994506-b8f463449011?auto=format&fit=crop&w=900&q=85' },
  { id: 5, name: 'DE Varsity Jacket', price: 109.99, cat: 'men', badge: '-15%', img: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=900&q=85' },
  { id: 6, name: 'DE Classic Cap', price: 29.99, cat: 'accessories', badge: 'NEW', img: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=900&q=85' },
  { id: 7, name: 'DE Sculpted Blazer', price: 119.99, cat: 'women', badge: 'NEW', img: 'https://images.unsplash.com/photo-1591369822096-ffd140ec948f?auto=format&fit=crop&w=900&q=85' },
  { id: 8, name: 'DE Leather Carryall', price: 89.99, cat: 'accessories', badge: 'LIMITED', img: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=85' }
];

let products = [...fallbackProducts];
let current = 0, cart = [], wishlist = new Set(), filter = 'all';
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];

// Hero Slider
const slides = [
  'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=2000&q=90',
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=2000&q=90',
  'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=2000&q=90'
];

function setSlide(i) {
  current = (i + slides.length) % slides.length;
  const heroBg = $('#heroBg');
  if (heroBg) heroBg.style.backgroundImage = `url('${slides[current]}')`;
  $$('#dots button').forEach((b, n) => b.classList.toggle('active', n === current));
}

slides.forEach((_, i) => {
  const b = document.createElement('button');
  b.ariaLabel = `Slide ${i + 1}`;
  b.onclick = () => setSlide(i);
  const dots = $('#dots');
  if (dots) dots.appendChild(b);
});
setSlide(0);

const prevBtn = $('#prevSlide');
const nextBtn = $('#nextSlide');
if (prevBtn) prevBtn.onclick = () => setSlide(current - 1);
if (nextBtn) nextBtn.onclick = () => setSlide(current + 1);
setInterval(() => setSlide(current + 1), 7000);

// Product Grid Rendering
function renderProducts(list = products) {
  const grid = $('#productGrid');
  if (!grid) return;
  const filtered = list.filter(p => filter === 'all' || p.cat === filter);
  if (filtered.length === 0) {
    grid.innerHTML = '<p class="empty" style="grid-column:1/-1;text-align:center;padding:40px;color:var(--muted);">No products found in this category.</p>';
    return;
  }
  grid.innerHTML = filtered.map(p => {
    const isSale = p.badge && (p.badge.includes('%') || p.badge.toLowerCase().includes('sale'));
    const isApparel = p.cat !== 'accessories';
    const sizesHtml = isApparel ? `
      <div class="size-selector" aria-label="Select size">
        <button type="button" class="size-btn" data-size="S">S</button>
        <button type="button" class="size-btn active" data-size="M">M</button>
        <button type="button" class="size-btn" data-size="L">L</button>
        <button type="button" class="size-btn" data-size="XL">XL</button>
      </div>
    ` : `
      <div class="size-selector" aria-label="Select size">
        <button type="button" class="size-btn active" data-size="OS">OS</button>
      </div>
    `;

    return `
    <article class="product-card">
      <div class="product-image" style="background-image:url('${p.img}')">
        <span class="badge ${isSale ? 'sale' : ''}">${p.badge || 'NEW'}</span>
        <button class="wish ${wishlist.has(p.id) ? 'saved' : ''}" data-wish="${p.id}" aria-label="Save ${p.name}">♡</button>
      </div>
      <div class="product-info">
        <h3>${p.name}</h3>
        <div class="product-meta">
          <span class="price">$${parseFloat(p.price).toFixed(2)}</span>
          <span class="swatches"><i style="background:#1C1C1C"></i><i style="background:#b8b2a8"></i><i style="background:#FFF6EC"></i></span>
        </div>
        ${sizesHtml}
        <button class="add" data-add="${p.id}">Add to cart</button>
      </div>
    </article>
  `;
  }).join('');
}

// Fetch products from MySQL backend
async function fetchProductsFromBackend() {
  try {
    const res = await fetch(`${API_BASE}/products`);
    if (!res.ok) throw new Error('API unavailable');
    const data = await res.json();
    if (data.success && Array.isArray(data.data) && data.data.length > 0) {
      products = data.data.map(p => ({
        id: p.id,
        name: p.name,
        price: parseFloat(p.price),
        cat: p.category,
        badge: p.badge,
        img: p.image_url,
        stock: p.stock
      }));
      renderProducts();
    }
  } catch (err) {
    console.log('[Backend Info] Using local fallback catalog. Backend server can be started on port 5000.');
    renderProducts();
  }
}
fetchProductsFromBackend();

// Filter buttons
const filters = $('#filters');
if (filters) {
  filters.onclick = e => {
    const b = e.target.closest('button');
    if (!b) return;
    filter = b.dataset.filter;
    $$('#filters button').forEach(x => x.classList.toggle('active', x === b));
    renderProducts();
  };
}

// Product Grid interactions (Add to Cart / Wishlist / Size Selection)
const grid = $('#productGrid');
if (grid) {
  grid.onclick = async e => {
    const sz = e.target.closest('.size-btn');
    const a = e.target.closest('[data-add]');
    const w = e.target.closest('[data-wish]');

    if (sz) {
      const parent = sz.closest('.size-selector');
      if (parent) {
        parent.querySelectorAll('.size-btn').forEach(btn => btn.classList.remove('active'));
        sz.classList.add('active');
      }
      return;
    }

    if (a) {
      const prod = products.find(p => p.id == a.dataset.add);
      if (prod) {
        const card = a.closest('.product-card');
        const activeSizeBtn = card ? card.querySelector('.size-btn.active') : null;
        const chosenSize = activeSizeBtn ? activeSizeBtn.dataset.size : 'M';
        cart.push({ ...prod, selectedSize: chosenSize });
        updateCounts();
        toast(`Added "${prod.name}" (Size: ${chosenSize}) to cart`);
      }
    }

    if (w) {
      const id = +w.dataset.wish;
      const isSaved = wishlist.has(id);
      if (isSaved) {
        wishlist.delete(id);
      } else {
        wishlist.add(id);
      }
      updateCounts();
      renderProducts();
      toast(isSaved ? 'Removed from wishlist' : 'Saved to wishlist');

      // Sync with backend if user has auth token
      const token = localStorage.getItem('de_auth_token');
      if (token) {
        try {
          await fetch(`${API_BASE}/wishlist/toggle`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ product_id: id })
          });
        } catch (e) {}
      }
    }
  };
}

function updateCounts() {
  const cCount = $('#cartCount');
  const wCount = $('#wishCount');
  if (cCount) cCount.textContent = cart.length;
  if (wCount) wCount.textContent = wishlist.size;
}

function toast(t) {
  const toastEl = $('#toast');
  if (!toastEl) return;
  toastEl.textContent = t;
  toastEl.classList.add('show');
  setTimeout(() => toastEl.classList.remove('show'), 2200);
}

// Cart & Wishlist Drawer
function openDrawer(type) {
  $('#drawerTitle').textContent = type === 'cart' ? 'Your Cart' : 'Wishlist';
  const items = type === 'cart' ? cart : products.filter(p => wishlist.has(p.id));
  
  $('#drawerBody').innerHTML = items.length ? items.map((p, i) => `
    <div class="cart-line">
      <img src="${p.img}" alt="${p.name}">
      <div>
        <h4>${p.name} ${p.selectedSize ? `<span class="cart-size">${p.selectedSize}</span>` : ''}</h4>
        <small>$${parseFloat(p.price).toFixed(2)}</small>
      </div>
      <button data-remove="${type}:${type === 'cart' ? i : p.id}">×</button>
    </div>
  `).join('') : '<p class="empty">Nothing here yet.</p>';

  const subtotal = cart.reduce((s, p) => s + p.price, 0);
  $('#drawerFoot').innerHTML = (type === 'cart' && items.length) ? `
    <p><b>Total</b> <span style="float:right;color:var(--tangerine,#FF6B35);font-size:18px;font-weight:700">$${subtotal.toFixed(2)}</span></p>
    <button class="checkout btn gold w-100" id="proceedCheckoutBtn">Proceed to Checkout →</button>
  ` : '';

  $('#drawer').classList.add('open');
  $('#overlay').classList.add('open');
  $('#drawer').ariaHidden = 'false';
}

$('#cartBtn').onclick = () => openDrawer('cart');
$('#wishBtn').onclick = () => openDrawer('wish');
$('#closeDrawer').onclick = closeAll;
$('#overlay').onclick = closeAll;

function closeAll() {
  $('#drawer').classList.remove('open');
  $('#searchPanel').classList.remove('open');
  const checkoutModal = $('#checkoutModal');
  if (checkoutModal) checkoutModal.classList.remove('open');
  const accountModal = $('#accountModal');
  if (accountModal) accountModal.classList.remove('open');
  $('#overlay').classList.remove('open');
}

$('#drawerBody').onclick = e => {
  const b = e.target.closest('[data-remove]');
  if (!b) return;
  const [type, id] = b.dataset.remove.split(':');
  if (type === 'cart') {
    cart.splice(+id, 1);
    updateCounts();
    openDrawer('cart');
  } else {
    wishlist.delete(+id);
    updateCounts();
    renderProducts();
    openDrawer('wish');
  }
};

// Search Panel
$('#searchBtn').onclick = () => {
  $('#searchPanel').classList.add('open');
  $('#overlay').classList.add('open');
  setTimeout(() => $('#searchInput').focus(), 100);
};
$('#closeSearch').onclick = closeAll;
$('#searchInput').oninput = e => {
  const q = e.target.value.toLowerCase().trim();
  $('#searchResults').innerHTML = q ? products.filter(p => p.name.toLowerCase().includes(q)).map(p => `
    <div class="result" style="padding:10px 0;border-bottom:1px solid #222;cursor:pointer;" onclick="filter='${p.cat}';renderProducts();closeAll();">
      <strong>${p.name}</strong> — <span style="color:var(--gold,#d4af37)">$${p.price.toFixed(2)}</span> <small>(${p.cat})</small>
    </div>
  `).join('') || '<div class="result" style="padding:10px 0;color:#888;">No matching products found.</div>' : '';
};

// Mobile Navigation
$('#menuBtn').onclick = () => $('#mobileNav').classList.toggle('open');
$$('#mobileNav a').forEach(a => a.onclick = () => $('#mobileNav').classList.remove('open'));

// Tilt Cards effect
$$('.tilt').forEach(card => {
  card.addEventListener('mousemove', e => {
    if (innerWidth < 900) return;
    const r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    card.style.transform = `perspective(700px) rotateX(${-y * 5}deg) rotateY(${x * 7}deg) scale(1.015)`;
  });
  card.addEventListener('mouseleave', () => card.style.transform = '');
});

// Newsletter Subscription (Connected to MySQL)
$('#newsletter').onsubmit = async e => {
  e.preventDefault();
  const emailInput = e.target.querySelector('input[type="email"]');
  const email = emailInput ? emailInput.value.trim() : '';

  try {
    const res = await fetch(`${API_BASE}/newsletter/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    toast(data.message || 'Welcome to the DE exclusive circle.');
  } catch (err) {
    toast('Subscribed to DE list!');
  }
  e.target.reset();
};

// =========================================================
// Checkout & Order System (MySQL)
// =========================================================
document.addEventListener('click', e => {
  if (e.target && e.target.id === 'proceedCheckoutBtn') {
    if (cart.length === 0) {
      toast('Your cart is empty.');
      return;
    }
    // Close cart drawer, open checkout modal
    $('#drawer').classList.remove('open');
    const total = cart.reduce((s, p) => s + p.price, 0);
    $('#summaryItemCount').textContent = cart.length;
    $('#summarySubtotal').textContent = `$${total.toFixed(2)}`;
    $('#summaryTotal').textContent = `$${total.toFixed(2)}`;

    // Autofill logged in user details if available
    const savedUser = JSON.parse(localStorage.getItem('de_user') || 'null');
    if (savedUser) {
      if ($('#custName')) $('#custName').value = savedUser.name || '';
      if ($('#custEmail')) $('#custEmail').value = savedUser.email || '';
    }

    $('#checkoutModal').classList.add('open');
    $('#overlay').classList.add('open');
  }
});

const closeCheckoutBtn = $('#closeCheckout');
if (closeCheckoutBtn) closeCheckoutBtn.onclick = closeAll;

const checkoutForm = $('#checkoutForm');
if (checkoutForm) {
  checkoutForm.onsubmit = async e => {
    e.preventDefault();
    const submitBtn = $('#submitOrderBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving order to MySQL...';

    const orderData = {
      customer_name: $('#custName').value.trim(),
      customer_email: $('#custEmail').value.trim(),
      phone: $('#custPhone').value.trim(),
      shipping_address: $('#custAddress').value.trim(),
      city: $('#custCity').value.trim(),
      postal_code: $('#custPostal').value.trim(),
      items: cart.map(p => ({ productId: p.id, quantity: 1 }))
    };

    const token = localStorage.getItem('de_auth_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers,
        body: JSON.stringify(orderData)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to place order.');
      }

      // Success
      cart = [];
      updateCounts();
      closeAll();
      toast(`✓ Order #${data.order.order_number} confirmed! Saved in MySQL.`);
    } catch (err) {
      alert(`Order submission error: ${err.message}`);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Confirm Order & Save to MySQL';
    }
  };
}

// =========================================================
// Account Modal & Authentication (JWT + MySQL)
// =========================================================
const accountBtn = $('#accountBtn');
const accountModal = $('#accountModal');
const closeAccountBtn = $('#closeAccount');

function updateAccountUI() {
  const token = localStorage.getItem('de_auth_token');
  const user = JSON.parse(localStorage.getItem('de_user') || 'null');

  if (token && user) {
    $('#accountLoggedOut').classList.add('hidden');
    $('#accountLoggedIn').classList.remove('hidden');
    $('#userName').textContent = user.name;
    $('#userEmail').textContent = user.email;

    const adminLink = $('#adminPortalLink');
    if (adminLink) {
      if (user.role === 'admin') {
        adminLink.classList.remove('hidden');
      } else {
        adminLink.classList.add('hidden');
      }
    }

    // Load recent customer orders
    loadMyOrders(token);
  } else {
    $('#accountLoggedOut').classList.remove('hidden');
    $('#accountLoggedIn').classList.add('hidden');
  }
}

async function loadMyOrders(token) {
  const container = $('#myOrdersList');
  if (!container) return;
  try {
    const res = await fetch(`${API_BASE}/orders/my`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success && data.orders && data.orders.length > 0) {
      container.innerHTML = data.orders.map(o => `
        <div class="my-order-card">
          <div class="order-top">
            <strong>${o.order_number}</strong>
            <span class="badge-status status-${o.order_status}">${o.order_status}</span>
          </div>
          <div style="color:#aaa;font-size:12px;margin-bottom:4px;">
            ${new Date(o.created_at).toLocaleDateString()} — $${parseFloat(o.total_amount).toFixed(2)}
          </div>
          <small style="color:#777">${o.items ? o.items.map(i => `${i.product_name} (x${i.quantity})`).join(', ') : ''}</small>
        </div>
      `).join('');
    } else {
      container.innerHTML = '<p class="empty-state">No previous orders found.</p>';
    }
  } catch (err) {
    container.innerHTML = '<p class="empty-state">Could not load orders.</p>';
  }
}

if (accountBtn && accountModal) {
  accountBtn.onclick = () => {
    updateAccountUI();
    accountModal.classList.add('open');
    $('#overlay').classList.add('open');
  };
}

if (closeAccountBtn) closeAccountBtn.onclick = closeAll;

// Tabs for login / register
const tabLogin = $('#tabLogin');
const tabRegister = $('#tabRegister');
const loginForm = $('#loginForm');
const registerForm = $('#registerForm');

if (tabLogin && tabRegister) {
  tabLogin.onclick = () => {
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
  };
  tabRegister.onclick = () => {
    tabRegister.classList.add('active');
    tabLogin.classList.remove('active');
    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
  };
}

// Login submission
if (loginForm) {
  loginForm.onsubmit = async e => {
    e.preventDefault();
    const email = $('#loginEmail').value.trim();
    const password = $('#loginPassword').value;

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed.');

      localStorage.setItem('de_auth_token', data.token);
      localStorage.setItem('de_user', JSON.stringify(data.user));
      toast(`Welcome back, ${data.user.name}`);
      updateAccountUI();
    } catch (err) {
      alert(err.message);
    }
  };
}

// Register submission
if (registerForm) {
  registerForm.onsubmit = async e => {
    e.preventDefault();
    const name = $('#regName').value.trim();
    const email = $('#regEmail').value.trim();
    const password = $('#regPassword').value;

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed.');

      localStorage.setItem('de_auth_token', data.token);
      localStorage.setItem('de_user', JSON.stringify(data.user));
      toast(`Account created! Welcome, ${data.user.name}`);
      updateAccountUI();
    } catch (err) {
      alert(err.message);
    }
  };
}

// Logout
const logoutBtn = $('#logoutBtn');
if (logoutBtn) {
  logoutBtn.onclick = () => {
    localStorage.removeItem('de_auth_token');
    localStorage.removeItem('de_user');
    updateAccountUI();
    toast('Signed out successfully.');
  };
}

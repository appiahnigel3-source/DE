const API_BASE = window.location.port === '5000' ? '/api' : 'http://localhost:5000/api';
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

let adminToken = localStorage.getItem('de_auth_token') || '';
let currentUser = JSON.parse(localStorage.getItem('de_user') || 'null');

function toast(t) {
  const toastEl = $('#toast');
  if (!toastEl) return;
  toastEl.textContent = t;
  toastEl.classList.add('show');
  setTimeout(() => toastEl.classList.remove('show'), 2200);
}

// Check admin auth state
function checkAdminAuth() {
  if (adminToken && currentUser && currentUser.role === 'admin') {
    $('#adminLoginGate').style.display = 'none';
    loadDashboardData();
  } else {
    $('#adminLoginGate').style.display = 'flex';
  }
}

// Handle Admin Sign In
$('#adminLoginForm').onsubmit = async e => {
  e.preventDefault();
  const email = $('#adminEmail').value.trim();
  const password = $('#adminPass').value;

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.message || 'Login failed.');
    if (data.user.role !== 'admin') {
      throw new Error('Access denied. This account does not have administrator privileges.');
    }

    adminToken = data.token;
    currentUser = data.user;
    localStorage.setItem('de_auth_token', data.token);
    localStorage.setItem('de_user', JSON.stringify(data.user));

    toast('Authenticated as Admin');
    checkAdminAuth();
  } catch (err) {
    alert(err.message);
  }
};

// Logout
$('#adminLogoutBtn').onclick = () => {
  localStorage.removeItem('de_auth_token');
  localStorage.removeItem('de_user');
  adminToken = '';
  currentUser = null;
  checkAdminAuth();
};

// Tabs navigation
$$('.nav-tab').forEach(tab => {
  tab.onclick = () => {
    $$('.nav-tab').forEach(t => t.classList.remove('active'));
    $$('.tab-content').forEach(c => c.classList.add('hidden'));

    tab.classList.add('active');
    const targetId = tab.dataset.tab;
    const targetContent = $(`#${targetId}`);
    if (targetContent) targetContent.classList.remove('hidden');
  };
});

// Load Dashboard Data (Products, Orders, Subscribers)
async function loadDashboardData() {
  await Promise.all([loadProducts(), loadOrders(), loadSubscribers()]);
}

// 1. Products
async function loadProducts() {
  try {
    const res = await fetch(`${API_BASE}/products`);
    const data = await res.json();
    const tbody = $('#productsTableBody');

    if (data.success && data.data) {
      $('#statProducts').textContent = data.data.length;
      tbody.innerHTML = data.data.map(p => `
        <tr>
          <td><strong>#${p.id}</strong></td>
          <td>
            <img src="${p.image_url}" class="prod-thumb" alt="">
            <strong>${p.name}</strong>
          </td>
          <td style="text-transform:capitalize;">${p.category}</td>
          <td style="color:var(--gold,#d4af37);font-weight:600;">$${parseFloat(p.price).toFixed(2)}</td>
          <td><span class="badge-status status-processing">${p.badge || 'STANDARD'}</span></td>
          <td>${p.stock}</td>
          <td>
            <button class="btn-action delete" onclick="deleteProduct(${p.id})">Delete</button>
          </td>
        </tr>
      `).join('');
    }
  } catch (err) {
    $('#productsTableBody').innerHTML = `<tr><td colspan="7" style="color:#f44336;text-align:center;">Failed to load products from MySQL.</td></tr>`;
  }
}

// 2. Orders
async function loadOrders() {
  try {
    const res = await fetch(`${API_BASE}/orders`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const data = await res.json();
    const tbody = $('#ordersTableBody');

    if (data.success && data.orders) {
      $('#statOrders').textContent = data.orders.length;
      const totalRev = data.orders.reduce((sum, o) => sum + parseFloat(o.total_amount), 0);
      $('#statRevenue').textContent = `$${totalRev.toFixed(2)}`;

      if (data.orders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:24px;color:#888;">No customer orders placed yet.</td></tr>`;
        return;
      }

      tbody.innerHTML = data.orders.map(o => `
        <tr>
          <td><strong>${o.order_number}</strong></td>
          <td>${new Date(o.created_at).toLocaleString()}</td>
          <td>
            <div><strong>${o.customer_name}</strong></div>
            <small style="color:#888">${o.customer_email}</small>
          </td>
          <td>${o.shipping_address}, ${o.city} ${o.postal_code}</td>
          <td>
            <small>${o.items ? o.items.map(i => `${i.product_name} (x${i.quantity})`).join('<br>') : '—'}</small>
          </td>
          <td style="color:var(--gold,#d4af37);font-weight:600;">$${parseFloat(o.total_amount).toFixed(2)}</td>
          <td>
            <select class="status-select" onchange="updateOrderStatus(${o.id}, this.value)">
              <option value="pending" ${o.order_status === 'pending' ? 'selected' : ''}>Pending</option>
              <option value="processing" ${o.order_status === 'processing' ? 'selected' : ''}>Processing</option>
              <option value="shipped" ${o.order_status === 'shipped' ? 'selected' : ''}>Shipped</option>
              <option value="delivered" ${o.order_status === 'delivered' ? 'selected' : ''}>Delivered</option>
              <option value="cancelled" ${o.order_status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
          </td>
        </tr>
      `).join('');
    }
  } catch (err) {
    $('#ordersTableBody').innerHTML = `<tr><td colspan="7" style="color:#f44336;text-align:center;">Failed to load orders.</td></tr>`;
  }
}

// 3. Subscribers
async function loadSubscribers() {
  try {
    const res = await fetch(`${API_BASE}/newsletter/subscribers`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const data = await res.json();
    const tbody = $('#subscribersTableBody');

    if (data.success && data.subscribers) {
      $('#statSubscribers').textContent = data.subscribers.length;
      if (data.subscribers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;padding:24px;color:#888;">No subscribers yet.</td></tr>`;
        return;
      }
      tbody.innerHTML = data.subscribers.map(s => `
        <tr>
          <td>#${s.id}</td>
          <td><strong>${s.email}</strong></td>
          <td>${new Date(s.subscribed_at).toLocaleDateString()}</td>
        </tr>
      `).join('');
    }
  } catch (err) {
    $('#subscribersTableBody').innerHTML = `<tr><td colspan="3" style="color:#f44336;text-align:center;">Failed to load subscribers.</td></tr>`;
  }
}

// Delete Product
window.deleteProduct = async function(id) {
  if (!confirm(`Are you sure you want to delete product #${id} from MySQL?`)) return;

  try {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Delete failed.');

    toast('Product deleted from database');
    loadProducts();
  } catch (err) {
    alert(err.message);
  }
};

// Update Order Status
window.updateOrderStatus = async function(orderId, newStatus) {
  try {
    const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ order_status: newStatus })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Status update failed.');

    toast(`Order #${orderId} marked as ${newStatus}`);
  } catch (err) {
    alert(err.message);
    loadOrders();
  }
};

// Add Product Modal
const addProductModal = $('#addProductModal');
$('#openAddProductModal').onclick = () => {
  addProductModal.classList.add('open');
};
$('#closeAddProduct').onclick = () => {
  addProductModal.classList.remove('open');
};

$('#addProductForm').onsubmit = async e => {
  e.preventDefault();
  const saveBtn = $('#saveProdBtn');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Inserting into MySQL...';

  const productData = {
    name: $('#newProdName').value.trim(),
    price: parseFloat($('#newProdPrice').value),
    category: $('#newProdCat').value,
    badge: $('#newProdBadge').value.trim() || 'NEW',
    stock: parseInt($('#newProdStock').value, 10),
    image_url: $('#newProdImg').value.trim(),
    description: $('#newProdDesc').value.trim()
  };

  try {
    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(productData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to create product.');

    toast('Product added to MySQL catalog!');
    addProductModal.classList.remove('open');
    e.target.reset();
    loadProducts();
  } catch (err) {
    alert(err.message);
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Product to MySQL';
  }
};

// Initialize
checkAdminAuth();

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, push, onValue, remove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Ganti databaseURL dengan milik Firebase Anda
const firebaseConfig = {
  databaseURL: "https://tungzzthriftsecond-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const WA_NUMBER = "6285743473837";
const ADMIN_PASSWORD = "fatur072009";

let products = [];
let cart = [];
let isAdmin = false;

// DOM Elements
const productGrid = document.getElementById('product-grid');
const emptyMsg = document.getElementById('empty-msg');
const cartCount = document.getElementById('cart-count');
const cartModal = document.getElementById('cart-modal');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalElement = document.getElementById('cart-total');

// Admin Elements
const adminTriggerBtn = document.getElementById('admin-trigger-btn');
const adminLoginModal = document.getElementById('admin-login-modal');
const adminPassInput = document.getElementById('admin-pass-input');
const submitAdminLogin = document.getElementById('submit-admin-login');
const closeAdminLogin = document.getElementById('close-admin-login');
const adminPanel = document.getElementById('admin-panel');
const closeAdminPanel = document.getElementById('close-admin-panel');
const addProductForm = document.getElementById('add-product-form');

// Chat Bot Elements
const chatToggle = document.getElementById('chat-toggle');
const chatBox = document.getElementById('chat-box');
const chatClose = document.getElementById('chat-close');
const chatBody = document.getElementById('chat-body');

// Sinkronisasi Real-Time dari Firebase (Muncul di semua HP)
onValue(ref(db, 'products'), (snapshot) => {
  const data = snapshot.val();
  products = [];
  if (data) {
    Object.keys(data).forEach(key => {
      products.push({ id: key, ...data[key] });
    });
  }
  renderProducts();
});

function renderProducts() {
  productGrid.innerHTML = '';
  if (products.length === 0) {
    emptyMsg.classList.remove('hidden');
    return;
  }
  emptyMsg.classList.add('hidden');

  products.forEach(p => {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    const deleteBtnHtml = isAdmin 
      ? `<button class="btn-delete" onclick="deleteProduct('${p.id}')" title="Hapus"><i class="fas fa-trash"></i></button>` 
      : '';

    card.innerHTML = `
      <img src="${p.image}" alt="${p.name}">
      <div class="product-info">
        <div class="product-title">${p.name}</div>
        <div class="product-size">Size: ${p.size}</div>
        <div class="product-price">Rp ${Number(p.price).toLocaleString('id-ID')}</div>
        <div class="card-actions">
          <button class="btn-add" onclick="addToCart('${p.id}')">+ Keranjang</button>
          ${deleteBtnHtml}
        </div>
      </div>
    `;
    productGrid.appendChild(card);
  });
}

// Admin Trigger & Login
adminTriggerBtn.addEventListener('click', () => {
  if (!isAdmin) {
    adminLoginModal.classList.remove('hidden');
    adminPassInput.value = '';
  } else {
    adminPanel.classList.toggle('hidden');
  }
});

closeAdminLogin.addEventListener('click', () => adminLoginModal.classList.add('hidden'));

submitAdminLogin.addEventListener('click', () => {
  if (adminPassInput.value === ADMIN_PASSWORD) {
    isAdmin = true;
    adminLoginModal.classList.add('hidden');
    adminPanel.classList.remove('hidden');
    adminTriggerBtn.textContent = "Kelola Toko";
    renderProducts();
    alert("Berhasil masuk sebagai Admin!");
  } else {
    alert("Password Admin Salah!");
  }
});

closeAdminPanel.addEventListener('click', () => adminPanel.classList.add('hidden'));

// Unggah Produk ke Firebase
addProductForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!isAdmin) return;

  const name = document.getElementById('prod-name').value;
  const price = document.getElementById('prod-price').value;
  const size = document.getElementById('prod-size').value;
  const image = document.getElementById('prod-image').value;

  push(ref(db, 'products'), { name, price, size, image })
    .then(() => {
      alert("Produk berhasil diunggah!");
      addProductForm.reset();
      adminPanel.classList.add('hidden');
    })
    .catch(err => alert("Gagal mengunggah: " + err.message));
});

// Hapus Produk dari Firebase
window.deleteProduct = (id) => {
  if (!isAdmin) return;
  if (confirm("Yakin ingin menghapus produk ini?")) {
    remove(ref(db, `products/${id}`));
  }
};

// Keranjang Belanja
window.addToCart = (id) => {
  const item = products.find(p => p.id === id);
  if (item) {
    cart.push(item);
    updateCartUI();
  }
};

function updateCartUI() {
  cartCount.textContent = cart.length;
  cartItemsContainer.innerHTML = '';
  let total = 0;

  cart.forEach((item, index) => {
    total += Number(item.price);
    cartItemsContainer.innerHTML += `
      <div class="cart-item-row">
        <div>
          <strong>${item.name}</strong> (${item.size})<br>
          <small>Rp ${Number(item.price).toLocaleString('id-ID')}</small>
        </div>
        <button onclick="removeFromCart(${index})" style="background:none; border:none; color:var(--danger); cursor:pointer;"><i class="fas fa-times"></i></button>
      </div>
    `;
  });

  cartTotalElement.textContent = `Rp ${total.toLocaleString('id-ID')}`;
}

window.removeFromCart = (index) => {
  cart.splice(index, 1);
  updateCartUI();
};

document.getElementById('cart-btn').onclick = () => cartModal.classList.remove('hidden');
document.getElementById('close-cart').onclick = () => cartModal.classList.add('hidden');

// Checkout WhatsApp
document.getElementById('checkout-wa').onclick = () => {
  if (cart.length === 0) {
    alert("Keranjang masih kosong!");
    return;
  }
  let msg = "Halo Tungzzthriftsecond, saya ingin memesan:\n\n";
  let total = 0;
  cart.forEach((item, i) => {
    msg += `${i+1}. ${item.name} (Size: ${item.size}) - Rp ${Number(item.price).toLocaleString('id-ID')}\n`;
    total += Number(item.price);
  });
  msg += `\n*Total Harga:* Rp ${total.toLocaleString('id-ID')}\nApakah produk ready?`;
  window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
};

// Chat Bot Logic
chatToggle.onclick = () => chatBox.classList.toggle('hidden');
chatClose.onclick = () => chatBox.classList.add('hidden');

window.askBot = (topic) => {
  let reply = "";
  if (topic === 'harga') reply = "Harga bervariasi sesuai brand & kondisi produk. Cek langsung di katalog ya!";
  if (topic === 'ongkir') reply = "Pengiriman via kurir ekspedisi. Ongkir dihitung saat konfirmasi pesanan ke WhatsApp.";
  if (topic === 'kondisi') reply = "Semua pakaian sudah dicuci bersih, wangi, disetrika, dan siap pakai!";
  if (topic === 'admin') {
    window.open(`https://wa.me/${WA_NUMBER}?text=Halo%20Admin%20Tungzzthriftsecond`, '_blank');
    return;
  }

  chatBody.innerHTML += `<div class="msg user">Tanya tentang ${topic}</div>`;
  setTimeout(() => {
    chatBody.innerHTML += `<div class="msg bot">${reply}</div>`;
    chatBody.scrollTop = chatBody.scrollHeight;
  }, 300);
};

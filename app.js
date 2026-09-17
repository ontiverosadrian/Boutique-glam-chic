// Definición automática de la URL de la API (Local en tu PC vs Nube en Render)
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:5000' 
    : 'https://boutique-glam-chic.onrender.com';

let isRegistering = false;
let salesChartInstance = null;
let cachedAdminOrders = [];
let cachedClientOrders = [];
let selectedProductForDetail = null;
let currentSelectedSize = 'Unitalla';

async function initializeApp() {
    if (!localStorage.getItem('glam_saved_order')) {
        localStorage.setItem('glam_saved_order', JSON.stringify([]));
    }
    await fetchAndRenderProducts();
    checkUserSession();
    setupProductForm();
    setupEditProductForm();
    setupThemeToggle();
    setupFilters();
    updateOrderBadge();
    setupOrderModal();
    setupAuthForm();
    setupChatbot();
    monitorConnection();
}

async function fetchAndRenderProducts() {
    let local = JSON.parse(localStorage.getItem('glam_products'));
    if (local && local.length > 0) {
        renderCatalog(local);
        renderAdminProductsTable(local);
    } else {
        local = [
            { name: "Vestido Midi Satinado", category: "Vestidos", price: 899.00, image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&auto=format&fit=crop&q=60", description: "Elegante vestido de satín con tirantes ajustables." }
        ];
        renderCatalog(local);
        renderAdminProductsTable(local);
    }

    try {
        const response = await fetch(`${API_URL}/api/products`);
        if (response.ok) {
            const products = await response.json();
            if (Array.isArray(products) && products.length > 0) {
                localStorage.setItem('glam_products', JSON.stringify(products));
                renderCatalog(products);
                renderAdminProductsTable(products);
            }
        }
    } catch (err) {
        console.log('Modo offline activo o servidor despertando.');
    }
}

function getStoredProducts() {
    return JSON.parse(localStorage.getItem('glam_products')) || [];
}

function getSavedOrder() {
    return JSON.parse(localStorage.getItem('glam_saved_order')) || [];
}

function saveOrderToStorage(orderItems) {
    localStorage.setItem('glam_saved_order', JSON.stringify(orderItems));
    updateOrderBadge();
}

function renderCatalog(itemsToRender) {
    const grid = document.getElementById('product-grid');
    const noResults = document.getElementById('no-results');
    if (!grid) return;
    
    grid.innerHTML = '';
    if (itemsToRender.length === 0) {
        if (noResults) noResults.classList.remove('hidden');
        return;
    } else {
        if (noResults) noResults.classList.add('hidden');
    }

    itemsToRender.forEach(product => {
        const prodId = product._id || product.id || Math.random().toString();
        const card = document.createElement('div');
        card.className = 'bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col cursor-pointer group';
        card.onclick = (e) => {
            if (e.target.closest('.quick-add-btn')) return;
            openProductDetail(prodId);
        };

        card.innerHTML = `
            <div class="h-64 overflow-hidden bg-gray-100 dark:bg-gray-900 relative">
                <img src="${product.image}" alt="${product.name}" class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300" loading="lazy">
                <span class="absolute top-3 right-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm text-pink-700 dark:text-pink-400 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
                    ${product.category}
                </span>
            </div>
            <div class="p-5 flex flex-col flex-grow">
                <h3 class="font-bold text-lg text-gray-800 dark:text-gray-100 mb-1 group-hover:text-pink-600 transition-colors">${product.name}</h3>
                <p class="text-gray-500 dark:text-gray-400 text-sm mb-4 flex-grow line-clamp-2">${product.description || 'Sin descripción detallada.'}</p>
                <div class="flex items-center justify-between mt-4 pt-4 border-t border-gray-50 dark:border-gray-700">
                    <span class="text-xl font-extrabold text-pink-600 dark:text-pink-400">$${product.price.toFixed(2)}</span>
                    <button onclick="addToOrder('${prodId}')" class="quick-add-btn bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm flex items-center space-x-1.5">
                        <i class="fas fa-plus"></i> <span>Añadir</span>
                    </button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

window.openProductDetail = function(productId) {
    const products = getStoredProducts();
    const product = products.find(p => (p._id === productId || p.id == productId || String(p.id) === String(productId)));
    if (!product) return;

    selectedProductForDetail = product;
    currentSelectedSize = 'Unitalla';

    document.querySelectorAll('.size-btn').forEach(btn => {
        if (btn.textContent === 'Unitalla') {
            btn.className = 'size-btn px-4 py-2 rounded-xl text-xs font-bold border border-pink-500 bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 transition-all';
        } else {
            btn.className = 'size-btn px-4 py-2 rounded-xl text-xs font-bold border border-gray-200 dark:border-gray-700 hover:border-pink-500 transition-all text-gray-700 dark:text-gray-200';
        }
    });

    document.getElementById('detail-img').src = product.image;
    document.getElementById('detail-category').textContent = product.category;
    document.getElementById('detail-name').textContent = product.name;
    document.getElementById('detail-price').textContent = `$${product.price.toFixed(2)}`;
    document.getElementById('detail-desc').textContent = product.description || 'Prenda exclusiva de alta calidad con acabados finos de Boutique Glam Chic.';

    document.getElementById('product-detail-modal').classList.remove('hidden');
};

window.closeProductDetailModal = function() {
    document.getElementById('product-detail-modal').classList.add('hidden');
    selectedProductForDetail = null;
};

window.selectSize = function(size) {
    currentSelectedSize = size;
    document.querySelectorAll('.size-btn').forEach(btn => {
        if (btn.textContent === size) {
            btn.className = 'size-btn px-4 py-2 rounded-xl text-xs font-bold border border-pink-500 bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 transition-all';
        } else {
            btn.className = 'size-btn px-4 py-2 rounded-xl text-xs font-bold border border-gray-200 dark:border-gray-700 hover:border-pink-500 transition-all text-gray-700 dark:text-gray-200';
        }
    });
};

window.addCurrentProductToOrder = function() {
    if (!selectedProductForDetail) return;
    
    const itemWithExtras = {
        ...selectedProductForDetail,
        name: `${selectedProductForDetail.name} (Talla: ${currentSelectedSize})`
    };

    let currentOrder = getSavedOrder();
    const existingItem = currentOrder.find(item => item.name === itemWithExtras.name);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        currentOrder.push({ ...itemWithExtras, quantity: 1 });
    }

    saveOrderToStorage(currentOrder);
    showToast(`¡"${selectedProductForDetail.name}" (${currentSelectedSize}) añadido al pedido!`);
    closeProductDetailModal();
};

function renderAdminProductsTable(products) {
    const tableBody = document.getElementById('admin-products-table');
    if (!tableBody) return;

    if (products.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-gray-400">No hay productos en el inventario.</td></tr>`;
        return;
    }

    tableBody.innerHTML = '';
    products.forEach((p, index) => {
        const prodId = p._id || p.id || index;
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors';
        tr.innerHTML = `
            <td class="p-4 flex items-center space-x-3">
                <img src="${p.image}" alt="${p.name}" class="w-10 h-10 object-cover rounded-lg">
                <span class="font-semibold text-gray-800 dark:text-gray-200">${p.name}</span>
            </td>
            <td class="p-4 text-xs text-gray-600 dark:text-gray-300">${p.category}</td>
            <td class="p-4 font-bold text-pink-600 dark:text-pink-400">$${p.price.toFixed(2)}</td>
            <td class="p-4 text-center space-x-2">
                <button onclick="openEditModal('${prodId}')" class="px-3 py-1.5 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded-xl text-xs font-semibold hover:bg-blue-200 transition-colors">
                    <i class="fas fa-edit mr-1"></i> Editar
                </button>
                <button onclick="deleteProduct('${prodId}')" class="px-3 py-1.5 bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 rounded-xl text-xs font-semibold hover:bg-red-200 transition-colors">
                    <i class="fas fa-trash-alt mr-1"></i> Eliminar
                </button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

window.addToOrder = function(productId) {
    const allProducts = getStoredProducts();
    const product = allProducts.find(p => (p._id === productId || p.id == productId || String(p.id) === String(productId)));
    if (!product) return;

    let currentOrder = getSavedOrder();
    const existingItem = currentOrder.find(item => (item._id === productId || item.id == productId || String(item.id) === String(productId)));

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        currentOrder.push({ ...product, quantity: 1 });
    }

    saveOrderToStorage(currentOrder);
    showToast(`¡"${product.name}" añadido al pedido!`);
};

function removeFromOrder(productId) {
    let currentOrder = getSavedOrder();
    currentOrder = currentOrder.filter(item => (item._id !== productId && item.id != productId && String(item.id) !== String(productId)));
    saveOrderToStorage(currentOrder);
    renderOrderModalContent();
}

function updateOrderBadge() {
    const currentOrder = getSavedOrder();
    const totalItems = currentOrder.reduce((sum, item) => sum + item.quantity, 0);
    const badge = document.getElementById('order-badge');
    if (!badge) return;

    if (totalItems > 0) {
        badge.textContent = totalItems;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

function renderOrderModalContent() {
    const listContainer = document.getElementById('order-items-list');
    const totalContainer = document.getElementById('order-total');
    if (!listContainer || !totalContainer) return;

    const currentOrder = getSavedOrder();
    listContainer.innerHTML = '';

    if (currentOrder.length === 0) {
        listContainer.innerHTML = `
            <div class="text-center py-10 text-gray-400">
                <i class="fas fa-shopping-basket text-4xl mb-2"></i>
                <p class="text-sm">No tienes artículos guardados en tu pedido aún.</p>
            </div>
        `;
        totalContainer.textContent = '$0.00';
        return;
    }

    let grandTotal = 0;
    currentOrder.forEach(item => {
        const itemTotal = item.price * item.quantity;
        grandTotal += itemTotal;
        const itemId = item._id || item.id;

        const div = document.createElement('div');
        div.className = 'flex items-center justify-between pt-2 first:pt-0';
        div.innerHTML = `
            <div class="flex items-center space-x-3">
                <img src="${item.image}" alt="${item.name}" class="w-12 h-12 object-cover rounded-lg">
                <div>
                    <h4 class="font-semibold text-xs text-gray-800 dark:text-gray-200">${item.name}</h4>
                    <p class="text-xs text-gray-500">Cant: ${item.quantity} x $${item.price.toFixed(2)}</p>
                </div>
            </div>
            <div class="flex items-center space-x-3">
                <span class="font-bold text-pink-600 dark:text-pink-400 text-xs">$${itemTotal.toFixed(2)}</span>
                <button onclick="removeFromOrder('${itemId}')" class="text-gray-400 hover:text-red-500 transition-colors p-1">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;
        listContainer.appendChild(div);
    });

    totalContainer.textContent = `$${grandTotal.toFixed(2)}`;
}

function showToast(message) {
    let toast = document.getElementById('toast-notification');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-notification';
        toast.className = 'fixed bottom-5 right-5 bg-gray-900 dark:bg-gray-700 text-white px-5 py-3 rounded-xl shadow-lg z-50 text-sm font-medium transition-opacity duration-300';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.opacity = '1';
    setTimeout(() => { toast.style.opacity = '0'; }, 2500);
}

function checkUserSession() {
    const session = JSON.parse(localStorage.getItem('glam_user_session'));
    const container = document.getElementById('auth-action-container');
    const catalogView = document.getElementById('catalog-view');
    const adminDashboard = document.getElementById('admin-dashboard');
    const clientNavTabs = document.getElementById('client-nav-tabs');

    if (!container) return;

    if (session) {
        container.innerHTML = `
            <div class="flex items-center space-x-3">
                <span class="text-xs font-semibold px-3 py-1.5 bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300 rounded-xl">
                    <i class="fas fa-user-circle mr-1"></i> ${session.name} (${session.role})
                </span>
                <button onclick="logoutUser()" class="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-red-100 hover:text-red-600 transition-colors" title="Cerrar Sesión">
                    <i class="fas fa-sign-out-alt"></i>
                </button>
            </div>
        `;

        if (session.role === 'admin') {
            if (catalogView) catalogView.classList.add('hidden');
            if (adminDashboard) adminDashboard.classList.remove('hidden');
            if (clientNavTabs) clientNavTabs.classList.add('hidden');
            loadAdminDashboardData();
        } else {
            if (catalogView) catalogView.classList.remove('hidden');
            if (adminDashboard) adminDashboard.classList.add('hidden');
            if (clientNavTabs) clientNavTabs.classList.remove('hidden');
        }
    } else {
        container.innerHTML = `
            <button id="open-auth-btn" class="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors flex items-center space-x-2">
                <i class="fas fa-user"></i> <span class="hidden sm:inline">Iniciar Sesión</span>
            </button>
        `;
        document.getElementById('open-auth-btn').addEventListener('click', openAuthModal);
        if (catalogView) catalogView.classList.remove('hidden');
        if (adminDashboard) adminDashboard.classList.add('hidden');
        if (clientNavTabs) clientNavTabs.classList.add('hidden');
    }
}

function openAuthModal() { document.getElementById('auth-modal').classList.remove('hidden'); }
function closeAuthModal() { document.getElementById('auth-modal').classList.add('hidden'); }

window.toggleAuthMode = function() {
    isRegistering = !isRegistering;
    const title = document.getElementById('auth-modal-title');
    const submitBtn = document.getElementById('auth-submit-btn');
    const nameField = document.getElementById('name-field-container');
    const toggleText = document.getElementById('auth-toggle-text');

    if (isRegistering) {
        title.textContent = 'Crear Cuenta';
        submitBtn.textContent = 'Registrarse';
        nameField.classList.remove('hidden');
        toggleText.innerHTML = `¿Ya tienes cuenta? <button type="button" onclick="toggleAuthMode()" class="text-pink-600 dark:text-pink-400 font-semibold hover:underline">Inicia Sesión</button>`;
    } else {
        title.textContent = 'Iniciar Sesión';
        submitBtn.textContent = 'Entrar';
        nameField.classList.add('hidden');
        toggleText.innerHTML = `¿No tienes cuenta? <button type="button" onclick="toggleAuthMode()" class="text-pink-600 dark:text-pink-400 font-semibold hover:underline">Regístrate</button>`;
    }
}

window.logoutUser = function() {
    localStorage.removeItem('glam_user_session');
    checkUserSession();
    showToast('Sesión cerrada correctamente.');
    window.location.reload();
}

function sendWelcomeEmail(userData) {
    const SERVICE_ID = "service_wv8zvlk";
    const TEMPLATE_ID = "template_gm5inic";

    const templateParams = {
        name: userData.name || 'Cliente',
        email: userData.email,
        link: 'https://boquite-glam-chic.netlify.app',
        date: new Date().toLocaleString()
    };

    emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams)
        .then((response) => {
            console.log('Correo de bienvenida enviado con éxito!', response.status, response.text);
            showToast('¡Correo de bienvenida enviado a tu bandeja!');
        }, (err) => {
            console.error('Error al enviar el correo de bienvenida:', err);
        });
}

function setupAuthForm() {
    const form = document.getElementById('auth-form');
    if (!form) return;

    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);

    newForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const emailInput = document.getElementById('auth-email').value.trim().toLowerCase();
        const passwordInput = document.getElementById('auth-password').value.trim();
        const nameInput = document.getElementById('auth-name') ? document.getElementById('auth-name').value.trim() : '';

        const endpoint = isRegistering ? `${API_URL}/api/auth/register` : `${API_URL}/api/auth/login`;
        const payload = isRegistering 
            ? { name: nameInput, email: emailInput, password: passwordInput, role: emailInput.includes('admin') ? 'admin' : 'client' }
            : { email: emailInput, password: passwordInput };

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();

            if (response.ok) {
                if (isRegistering) {
                    sendWelcomeEmail({ name: nameInput, email: emailInput });
                    alert('¡Registro exitoso! Te hemos enviado un correo de bienvenida. Ahora inicia sesión.');
                    toggleAuthMode();
                } else {
                    localStorage.setItem('glam_user_session', JSON.stringify(data.user));
                    closeAuthModal();
                    checkUserSession();
                    showToast(`¡Bienvenido, ${data.user.name}!`);
                    window.location.reload();
                }
            } else {
                alert(data.error || 'Ocurrió un error en la autenticación.');
            }
        } catch (err) {
            console.error('Error de red al autenticar:', err);
            const fallbackUser = { 
                name: nameInput || (emailInput.includes('admin') ? 'Administrador' : 'Cliente'), 
                email: emailInput, 
                role: emailInput.includes('admin') ? 'admin' : 'client' 
            };
            localStorage.setItem('glam_user_session', JSON.stringify(fallbackUser));
            closeAuthModal();
            checkUserSession();
            showToast(`¡Sesión iniciada en modo local, bienvenido!`);
            window.location.reload();
        }
    });
}

function setupProductForm() {
    const form = document.getElementById('add-product-form');
    if (!form) return;

    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);

    newForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('prod-name').value.trim();
        const category = document.getElementById('prod-category').value;
        const price = parseFloat(document.getElementById('prod-price').value);
        const image = document.getElementById('prod-image').value.trim();
        const description = document.getElementById('prod-desc').value.trim();

        const newProd = { name, category, price, image, description };

        try {
            showToast('Guardando producto en la base de datos...');
            const response = await fetch(`${API_URL}/api/admin/products`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newProd)
            });
            
            if (response.ok) {
                const savedProduct = await response.json();
                
                let currentProducts = getStoredProducts();
                currentProducts.push(savedProduct);
                localStorage.setItem('glam_products', JSON.stringify(currentProducts));

                newForm.reset();
                renderCatalog(currentProducts);
                renderAdminProductsTable(currentProducts);
                showToast('¡Producto guardado exitosamente en MongoDB!');
                
                await fetchAndRenderProducts();
                return;
            } else {
                throw new Error('Error al guardar en el servidor');
            }
        } catch (err) {
            console.error('Error al guardar en la nube:', err);
            alert('No se pudo conectar con el servidor para guardar el producto en la base de datos.');
        }
    });
}

window.openEditModal = function(productId) {
    const products = getStoredProducts();
    const product = products.find(p => (p._id === productId || p.id == productId));
    if (!product) return;

    document.getElementById('edit-prod-id').value = product._id || product.id;
    document.getElementById('edit-prod-name').value = product.name;
    document.getElementById('edit-prod-category').value = product.category;
    document.getElementById('edit-prod-price').value = product.price;
    document.getElementById('edit-prod-image').value = product.image;
    document.getElementById('edit-prod-desc').value = product.description || '';

    document.getElementById('edit-product-modal').classList.remove('hidden');
}

window.closeEditModal = function() {
    document.getElementById('edit-product-modal').classList.add('hidden');
}

function setupEditProductForm() {
    const form = document.getElementById('edit-product-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-prod-id').value;
        const updated = {
            name: document.getElementById('edit-prod-name').value,
            category: document.getElementById('edit-prod-category').value,
            price: parseFloat(document.getElementById('edit-prod-price').value),
            image: document.getElementById('edit-prod-image').value,
            description: document.getElementById('edit-prod-desc').value
        };

        try {
            const response = await fetch(`${API_URL}/api/admin/products/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updated)
            });
            if (response.ok) {
                closeEditModal();
                await fetchAndRenderProducts();
                showToast('¡Producto actualizado en la base de datos!');
                return;
            }
        } catch (err) {
            console.log('Actualizando producto localmente...');
        }

        let products = getStoredProducts();
        products = products.map(p => (p._id === id || p.id == id) ? { ...p, ...updated } : p);
        localStorage.setItem('glam_products', JSON.stringify(products));
        closeEditModal();
        renderCatalog(products);
        renderAdminProductsTable(products);
        showToast('¡Producto actualizado localmente!');
    });
}

window.deleteProduct = async function(productId) {
    if (!confirm('¿Estás seguro de eliminar este producto del inventario?')) return;

    try {
        const response = await fetch(`${API_URL}/api/admin/products/${productId}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            showToast('Producto eliminado de la base de datos.');
            await fetchAndRenderProducts();
            return;
        }
    } catch (err) {
        console.log('Eliminando producto localmente...');
    }

    let products = getStoredProducts();
    products = products.filter(p => p._id !== productId && p.id != productId);
    localStorage.setItem('glam_products', JSON.stringify(products));
    renderCatalog(products);
    renderAdminProductsTable(products);
    showToast('Producto eliminado localmente.');
}

window.switchClientView = function(view) {
    const productsSection = document.getElementById('products-section');
    const historySection = document.getElementById('client-history-section');
    const catalogBtn = document.getElementById('tab-catalog-btn');
    const historyBtn = document.getElementById('tab-history-btn');

    if (view === 'catalog') {
        productsSection.classList.remove('hidden');
        historySection.classList.add('hidden');
        catalogBtn.className = "px-5 py-2.5 rounded-xl font-medium text-sm bg-pink-600 text-white shadow-sm transition-colors";
        historyBtn.className = "px-5 py-2.5 rounded-xl font-medium text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors";
    } else {
        productsSection.classList.add('hidden');
        historySection.classList.remove('hidden');
        historyBtn.className = "px-5 py-2.5 rounded-xl font-medium text-sm bg-pink-600 text-white shadow-sm transition-colors";
        catalogBtn.className = "px-5 py-2.5 rounded-xl font-medium text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors";
        loadClientOrderHistory();
    }
}

async function loadClientOrderHistory() {
    const container = document.getElementById('client-orders-container');
    const session = JSON.parse(localStorage.getItem('glam_user_session'));
    if (!container || !session) return;

    container.innerHTML = `<div class="text-center py-10 text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i> Cargando tus pedidos...</div>`;

    let fetchedOrders = [];

    try {
        const response = await fetch(`${API_URL}/api/orders/client/${encodeURIComponent(session.email)}`);
        if (response.ok) {
            fetchedOrders = await response.json();
        }
    } catch (err) {
        console.log('Usando almacenamiento local debido a fallo de red.');
        const localOrders = JSON.parse(localStorage.getItem('glam_local_orders')) || [];
        fetchedOrders = localOrders.filter(o => o.clientEmail === session.email);
    }

    const uniqueOrdersMap = new Map();
    (fetchedOrders || []).forEach(ord => {
        const uniqueKey = ord._id || ord.id || `${ord.createdAt}-${ord.total}`;
        if (!uniqueOrdersMap.has(String(uniqueKey))) {
            uniqueOrdersMap.set(String(uniqueKey), ord);
        }
    });

    cachedClientOrders = Array.from(uniqueOrdersMap.values());
    renderOrdersList(cachedClientOrders, container);
}

function renderOrdersList(orders, container) {
    if (orders.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12 text-gray-400 border border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
                <i class="fas fa-box-open text-4xl mb-2"></i>
                <p class="text-sm">Aún no has registrado ningún pedido.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    orders.forEach((order) => {
        const orderId = order._id || order.id;
        const date = new Date(order.createdAt || Date.now()).toLocaleString();
        let itemsListHtml = (order.items || []).map(i => `
            <div class="flex justify-between text-xs text-gray-600 dark:text-gray-300 py-1 border-b border-gray-50 dark:border-gray-700/50 last:border-0">
                <span>${i.quantity}x ${i.name}</span>
                <span class="font-medium">$${(i.price * i.quantity).toFixed(2)}</span>
            </div>
        `).join('');

        const card = document.createElement('div');
        card.className = 'bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-2xl p-5 shadow-sm';
        card.innerHTML = `
            <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-gray-200 dark:border-gray-700 gap-2">
                <div>
                    <span class="text-xs font-mono text-pink-600 dark:text-pink-400 font-semibold">Pedido ID: ${orderId}</span>
                    <p class="text-xs text-gray-400 mt-0.5"><i class="far fa-clock mr-1"></i> ${date}</p>
                </div>
                <div class="flex items-center space-x-2">
                    <span class="px-3 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                        ${order.status || 'Pendiente'}
                    </span>
                    <button onclick="downloadClientTicket('${orderId}')" class="px-3 py-1.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-medium transition-colors shadow-sm flex items-center space-x-1">
                        <i class="fas fa-file-pdf"></i> <span>Ticket PDF</span>
                    </button>
                </div>
            </div>
            <div class="space-y-2 mb-3 text-xs text-gray-600 dark:text-gray-300">
                <p><strong class="text-gray-800 dark:text-gray-100">Dirección:</strong> ${order.shippingAddress || 'No especificada'}</p>
                <p><strong class="text-gray-800 dark:text-gray-100">Teléfono:</strong> ${order.clientPhone || 'No especificado'}</p>
                <p><strong class="text-gray-800 dark:text-gray-100">Método de Pago:</strong> ${order.paymentMethod || 'Efectivo'}</p>
            </div>
            <div class="space-y-1 mb-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                ${itemsListHtml}
            </div>
            <div class="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700 font-bold text-sm">
                <span class="text-gray-700 dark:text-gray-300">Total pagado:</span>
                <span class="text-pink-600 dark:text-pink-400 text-base">$${(order.total || 0).toFixed(2)}</span>
            </div>
        `;
        container.appendChild(card);
    });
}

window.downloadClientTicket = function(orderId) {
    let order = cachedClientOrders.find(o => String(o._id || o.id) === String(orderId) || String(o._id || o.id).includes(orderId));
    
    if (!order) {
        const localOrders = JSON.parse(localStorage.getItem('glam_local_orders')) || [];
        order = localOrders.find(o => String(o._id || o.id) === String(orderId));
    }

    if (!order) {
        alert('No se encontró la información detallada de este pedido en este dispositivo.');
        return;
    }

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ unit: 'mm', format: [80, 150] });

        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(219, 39, 119);
        doc.text("BOUTIQUE GLAM CHIC", 40, 10, { align: "center" });

        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text("Moda y Accesorios Exclusivos", 40, 15, { align: "center" });
        doc.text("----------------------------------------------------------------", 40, 19, { align: "center" });

        doc.setFontSize(8);
        doc.setTextColor(50, 50, 50);
        doc.text(`Folio ID: ${String(order._id || order.id).substring(0, 12)}...`, 5, 24);
        doc.text(`Fecha: ${new Date(order.createdAt || Date.now()).toLocaleString()}`, 5, 29);
        doc.text(`Cliente: ${order.clientName || 'Cliente'}`, 5, 34);
        doc.text(`Tel: ${order.clientPhone || 'N/D'}`, 5, 39);
        doc.text(`Dir: ${order.shippingAddress || 'N/D'}`, 5, 44);
        doc.text(`Pago: ${order.paymentMethod || 'Efectivo'}`, 5, 49);
        doc.text("----------------------------------------------------------------", 40, 53, { align: "center" });

        const tableColumns = ["Artículos", "Subtotal"];
        const tableRows = (order.items || []).map(i => [
            `${i.quantity}x ${i.name}`,
            `$${(i.price * i.quantity).toFixed(2)}`
        ]);

        if (typeof doc.autoTable === 'function') {
            doc.autoTable({
                head: [tableColumns],
                body: tableRows,
                startY: 56,
                theme: 'plain',
                headStyles: { fillColor: [219, 39, 119], textColor: [255, 255, 255], fontSize: 8 },
                styles: { fontSize: 7, cellPadding: 1 },
                margin: { left: 5, right: 5 }
            });
        }

        let finalY = doc.lastAutoTable && doc.lastAutoTable.finalY ? doc.lastAutoTable.finalY + 6 : 75;
        doc.text("----------------------------------------------------------------", 40, finalY, { align: "center" });
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(219, 39, 119);
        doc.text(`TOTAL: $${(order.total || 0).toFixed(2)}`, 75, finalY + 6, { align: "right" });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(120, 120, 120);
        doc.text("¡Gracias por tu compra en Glam Chic!", 40, finalY + 14, { align: "center" });

        doc.save(`Ticket_${String(order._id || order.id).substring(0, 6)}.pdf`);
        showToast('¡Ticket descargado con éxito!');
    } catch (error) {
        console.error("Error al generar el PDF del ticket:", error);
        alert('Ocurrió un error al generar el PDF del ticket.');
    }
};

window.downloadCatalogPDF = async function() {
    try {
        if (!window.jspdf || !window.jspdf.jsPDF) {
            alert('La librería jsPDF aún no se ha cargado.');
            return;
        }

        const products = getStoredProducts();
        if (!products || products.length === 0) {
            alert('No hay productos disponibles.');
            return;
        }

        showToast('Generando catálogo PDF...');

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ unit: 'mm', format: 'a4' });

        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.setTextColor(219, 39, 119);
        doc.text("Colección Exclusiva", 105, 20, { align: "center" });

        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text("Explora nuestra selección de moda y accesorios de alta calidad.", 105, 26, { align: "center" });
        doc.text(`Fecha de emisión: ${new Date().toLocaleDateString()}`, 105, 32, { align: "center" });

        const getBase64ImageFromURL = (url) => {
            return new Promise((resolve) => {
                if (!url) { resolve(null); return; }
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => {
                    try {
                        const canvas = document.createElement('canvas');
                        canvas.width = img.width || 300;
                        canvas.height = img.height || 300;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0);
                        resolve(canvas.toDataURL('image/jpeg', 0.85));
                    } catch (e) {
                        resolve(null);
                    }
                };
                img.onerror = () => resolve(null);
                img.src = url;
            });
        };

        let startX = 15;
        let startY = 42;
        let cardWidth = 55;
        let cardHeight = 85;
        let gapX = 10;
        let gapY = 12;
        let itemsPerRow = 3;

        for (let i = 0; i < products.length; i++) {
            const p = products[i];
            if (startY + cardHeight > 275) {
                doc.addPage();
                startY = 20;
            }

            let col = i % itemsPerRow;
            let row = Math.floor(i / itemsPerRow);
            let x = startX + col * (cardWidth + gapX);
            let y = startY + row * (cardHeight + gapY);

            doc.setFillColor(255, 255, 255);
            doc.setDrawColor(230, 230, 230);
            doc.roundedRect(x, y, cardWidth, cardHeight, 3, 3, 'FD');

            let imageLoaded = false;
            if (p.image) {
                let base64Img = await getBase64ImageFromURL(p.image);
                if (base64Img) {
                    try {
                        doc.addImage(base64Img, 'JPEG', x, y, cardWidth, 42);
                        imageLoaded = true;
                    } catch (e) {
                        imageLoaded = false;
                    }
                }
            }

            if (!imageLoaded) {
                doc.setFillColor(252, 231, 243);
                doc.rect(x, y, cardWidth, 42, 'F');
                doc.setFont("helvetica", "bold");
                doc.setFontSize(9);
                doc.setTextColor(219, 39, 119);
                doc.text("Glam Chic", x + (cardWidth / 2), y + 23, { align: "center" });
            }

            doc.setFillColor(30, 30, 30);
            doc.roundedRect(x + cardWidth - 25, y + 4, 22, 6, 2, 2, 'F');
            doc.setFont("helvetica", "bold");
            doc.setFontSize(7);
            doc.setTextColor(255, 255, 255);
            doc.text(p.category || 'General', x + cardWidth - 14, y + 8, { align: "center" });

            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.setTextColor(30, 30, 30);
            let cleanName = doc.splitTextToSize(p.name || 'Sin nombre', cardWidth - 8);
            doc.text(cleanName, x + 4, y + 50);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            doc.setTextColor(120, 120, 120);
            let cleanDesc = doc.splitTextToSize(p.description || '', cardWidth - 8);
            doc.text(cleanDesc.slice(0, 2), x + 4, y + 58);

            doc.setFont("helvetica", "bold");
            doc.setFontSize(12);
            doc.setTextColor(219, 39, 119);
            doc.text(`$${(p.price || 0).toFixed(2)}`, x + 6, y + 76);
        }

        doc.save("Catalogo_Visual_GlamChic.pdf");
        showToast('¡Catálogo visual generado con éxito!');
    } catch (error) {
        console.error('Error al generar el PDF visual:', error);
    }
};

function setupChatbot() {
    const toggleBtn = document.getElementById('chatbot-toggle-btn');
    const closeBtn = document.getElementById('chatbot-close-btn');
    const windowEl = document.getElementById('chatbot-window');
    const sendBtn = document.getElementById('chatbot-send-btn');
    const inputEl = document.getElementById('chatbot-input');

    if (!toggleBtn || !windowEl) return;

    toggleBtn.addEventListener('click', () => windowEl.classList.toggle('hidden'));
    closeBtn.addEventListener('click', () => windowEl.classList.add('hidden'));

    const handleUserMessage = () => {
        const text = inputEl.value.trim();
        if (!text) return;
        appendChatMessage(text, 'user');
        inputEl.value = '';
        setTimeout(() => {
            const botReply = generateBotResponse(text);
            appendChatMessage(botReply, 'bot');
        }, 500);
    };

    sendBtn.addEventListener('click', handleUserMessage);
    inputEl.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleUserMessage(); });
}

function appendChatMessage(text, sender) {
    const messagesEl = document.getElementById('chatbot-messages');
    if (!messagesEl) return;

    const div = document.createElement('div');
    if (sender === 'user') {
        div.className = 'flex items-end justify-end space-x-2';
        div.innerHTML = `<div class="bg-pink-600 text-white p-3 rounded-2xl shadow-sm max-w-[80%]">${text}</div>`;
    } else {
        div.className = 'flex items-start space-x-2';
        div.innerHTML = `
            <div class="w-7 h-7 bg-pink-100 dark:bg-pink-900/50 text-pink-600 dark:text-pink-400 rounded-full flex items-center justify-center flex-shrink-0 text-xs">
                <i class="fas fa-robot"></i>
            </div>
            <div class="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 p-3 rounded-2xl shadow-sm max-w-[80%] border border-gray-100 dark:border-gray-700">${text}</div>
        `;
    }
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
}

function generateBotResponse(userMsg) {
    const msg = userMsg.toLowerCase().trim();
    if (msg.includes('hola') || msg.includes('buenos dias') || msg.includes('buenas tardes')) {
        return "¡Hola! Qué gusto saludarte en Boutique Glam Chic. 💖 ¿Cómo puedo ayudarte hoy?";
    } else if (msg.includes('pago') || msg.includes('tarjeta') || msg.includes('efectivo')) {
        return "💳 Contamos con pagos por PayPal, tarjetas y efectivo contra entrega.";
    } else if (msg.includes('envio') || msg.includes('tiempo')) {
        return "🚚 Los envíos tardan de 2 a 3 días hábiles una vez confirmado tu pedido.";
    } else {
        return "En Glam Chic nos especializamos en moda exclusiva. ¿Te gustaría conocer nuestros vestidos o métodos de pago?";
    }
}

window.loadAdminDashboardData = async function() {
    const tableBody = document.getElementById('admin-orders-table');
    const totalSalesEl = document.getElementById('kpi-total-sales');
    const totalOrdersEl = document.getElementById('kpi-total-orders');
    const pendingOrdersEl = document.getElementById('kpi-pending-orders');

    if (!tableBody) return;
    tableBody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i> Cargando métricas...</td></tr>`;

    try {
        const response = await fetch(`${API_URL}/api/admin/orders`);
        const orders = await response.json();
        if (response.ok) {
            cachedAdminOrders = orders;
            processAdminOrders(orders, totalSalesEl, totalOrdersEl, pendingOrdersEl, tableBody);
            return;
        }
    } catch (err) {
        console.log('Cargando órdenes locales...');
    }

    const localOrders = JSON.parse(localStorage.getItem('glam_local_orders')) || [];
    cachedAdminOrders = localOrders;
    processAdminOrders(localOrders, totalSalesEl, totalOrdersEl, pendingOrdersEl, tableBody);
}

function processAdminOrders(orders, totalSalesEl, totalOrdersEl, pendingOrdersEl, tableBody) {
    const totalOrdersCount = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    const pendingCount = orders.filter(order => order.status === 'Pendiente' || !order.status).length;

    if (totalSalesEl) totalSalesEl.textContent = `$${totalRevenue.toFixed(2)}`;
    if (totalOrdersEl) totalOrdersEl.textContent = totalOrdersCount;
    if (pendingOrdersEl) pendingOrdersEl.textContent = pendingCount;

    renderSalesChart(orders);

    if (orders.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-gray-400">No hay pedidos registrados todavía.</td></tr>`;
        return;
    }

    tableBody.innerHTML = '';
    orders.forEach(order => {
        const orderId = order._id || order.id;
        const itemsSummary = (order.items || []).map(i => `${i.quantity}x ${i.name}`).join(', ');
        const currentStatus = order.status || 'Pendiente';

        let statusBg = 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
        if (currentStatus === 'Pagado') statusBg = 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
        if (currentStatus === 'Enviado') statusBg = 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300';
        if (currentStatus === 'Entregado') statusBg = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300';

        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors';
        tr.innerHTML = `
            <td class="p-4 font-mono text-xs text-pink-600 dark:text-pink-400 font-semibold">${orderId}</td>
            <td class="p-4">
                <p class="font-semibold text-gray-800 dark:text-gray-200">${order.clientName || 'Cliente'}</p>
                <p class="text-xs text-gray-500">${order.clientEmail || 'N/D'}</p>
            </td>
            <td class="p-4 text-xs text-gray-600 dark:text-gray-300 max-w-xs truncate" title="${itemsSummary}">${itemsSummary}</td>
            <td class="p-4 text-xs text-gray-600 dark:text-gray-300">
                <p><strong>Dir:</strong> ${order.shippingAddress || 'N/D'}</p>
                <p><strong>Pago:</strong> ${order.paymentMethod || 'Efectivo'}</p>
            </td>
            <td class="p-4 font-bold text-gray-900 dark:text-white">$${(order.total || 0).toFixed(2)}</td>
            <td class="p-4 flex items-center space-x-3">
                <select onchange="updateOrderStatus('${orderId}', this.value)" class="px-3 py-1.5 text-xs font-semibold rounded-xl border border-gray-200 dark:border-gray-700 ${statusBg} focus:outline-none focus:ring-2 focus:ring-pink-500 cursor-pointer">
                    <option value="Pendiente" ${currentStatus === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                    <option value="Pagado" ${currentStatus === 'Pagado' ? 'selected' : ''}>Pagado</option>
                    <option value="Enviado" ${currentStatus === 'Enviado' ? 'selected' : ''}>Enviado</option>
                    <option value="Entregado" ${currentStatus === 'Entregado' ? 'selected' : ''}>Entregado</option>
                </select>
                <button onclick="deleteAdminOrder('${orderId}')" class="p-2 bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300 rounded-xl hover:bg-red-200 transition-colors" title="Eliminar Pedido">
                    <i class="fas fa-trash-alt text-xs"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

window.updateOrderStatus = async function(orderId, newStatus) {
    let localOrders = JSON.parse(localStorage.getItem('glam_local_orders')) || [];
    localOrders = localOrders.map(o => (o._id === orderId || o.id == orderId) ? { ...o, status: newStatus } : o);
    localStorage.setItem('glam_local_orders', JSON.stringify(localOrders));

    if (cachedAdminOrders) {
        cachedAdminOrders = cachedAdminOrders.map(o => (o._id === orderId || o.id == orderId) ? { ...o, status: newStatus } : o);
    }

    try {
        await fetch(`${API_URL}/api/admin/orders/${orderId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
    } catch (e) {
        console.log('Sincronización con la nube pendiente, guardado localmente.');
    }

    showToast(`¡Estatus actualizado a "${newStatus}"!`);
    loadAdminDashboardData();
};

window.deleteAdminOrder = async function(orderId) {
    if (!confirm(`¿Estás seguro de eliminar permanentemente el pedido ${orderId} de la base de datos en MongoDB?`)) return;

    try {
        const response = await fetch(`${API_URL}/api/admin/orders/${orderId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('No se pudo eliminar el registro en la base de datos remota');
        }

        showToast('¡Pedido eliminado de MongoDB exitosamente!');
    } catch (e) {
        console.log('Error de red al intentar eliminar en la nube:', e);
        alert('No se pudo conectar con el servidor para eliminar el registro de la base de datos.');
        return;
    }

    if (cachedAdminOrders) {
        cachedAdminOrders = cachedAdminOrders.filter(o => String(o._id || o.id) !== String(orderId));
    }

    let localOrders = JSON.parse(localStorage.getItem('glam_local_orders')) || [];
    localOrders = localOrders.filter(o => String(o._id || o.id) !== String(orderId));
    localStorage.setItem('glam_local_orders', JSON.stringify(localOrders));

    loadAdminDashboardData();
};

window.confirmCashOrder = async function() {
    const order = getSavedOrder();
    const session = JSON.parse(localStorage.getItem('glam_user_session'));
    const address = document.getElementById('shipping-address').value;
    const phone = document.getElementById('client-phone').value;

    if (order.length === 0) {
        alert('Tu pedido está vacío.');
        return;
    }
    if (!session) {
        alert('Por favor, inicia sesión para confirmar tu pedido.');
        openAuthModal();
        return;
    }
    if (!address || !phone) {
        alert('Por favor, completa la dirección de envío y el teléfono de contacto.');
        return;
    }

    const total = order.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const newOrderRecord = {
        clientEmail: session.email,
        clientName: session.name,
        shippingAddress: address,
        clientPhone: phone,
        paymentMethod: 'Efectivo / Pago Directo',
        items: order,
        total: total,
        status: 'Pendiente',
        createdAt: new Date().toISOString()
    };

    try {
        const response = await fetch(`${API_URL}/api/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newOrderRecord)
        });

        if (!response.ok) throw new Error('Error al registrar en MongoDB');
        
        localStorage.removeItem('glam_local_orders');
    } catch (e) {
        console.log('Guardando en respaldo local:', e);
        let localOrders = JSON.parse(localStorage.getItem('glam_local_orders')) || [];
        localOrders.push({ ...newOrderRecord, _id: 'ORD-' + Math.floor(100000 + Math.random() * 900000) });
        localStorage.setItem('glam_local_orders', JSON.stringify(localOrders));
    }

    alert('¡Pedido confirmado con éxito!');
    localStorage.removeItem('glam_saved_order');
    updateOrderBadge();
    renderOrderModalContent();
    document.getElementById('order-modal').classList.add('hidden');
    
    if (typeof loadClientOrderHistory === 'function') {
        loadClientOrderHistory();
    }
};

window.exportOrdersToExcel = function() {
    if (!cachedAdminOrders || cachedAdminOrders.length === 0) { alert('No hay pedidos.'); return; }
    const dataToExport = cachedAdminOrders.map(o => ({
        'ID Pedido': o._id || o.id,
        'Cliente': o.clientName || 'N/D',
        'Correo': o.clientEmail || 'N/D',
        'Teléfono': o.clientPhone || 'N/D',
        'Dirección': o.shippingAddress || 'N/D',
        'Método de Pago': o.paymentMethod || 'N/D',
        'Total ($)': o.total,
        'Estatus': o.status || 'Pendiente',
        'Fecha': new Date(o.createdAt || Date.now()).toLocaleString()
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ventas");
    XLSX.writeFile(workbook, "Reporte_Ventas_GlamChic.xlsx");
    showToast('¡Reporte de Excel exportado!');
}

window.exportOrdersToPDF = function() {
    if (!cachedAdminOrders || cachedAdminOrders.length === 0) { alert('No hay pedidos.'); return; }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(219, 39, 119);
    doc.text("Boutique Glam Chic - Reporte de Ventas", 14, 20);

    const tableColumns = ["ID", "Cliente", "Tel", "Pago", "Total", "Estatus"];
    const tableRows = cachedAdminOrders.map(o => [
        String(o._id || o.id).substring(0, 8) + '...',
        o.clientName || 'Cliente',
        o.clientPhone || 'N/D',
        o.paymentMethod || 'Efectivo',
        `$${(o.total || 0).toFixed(2)}`,
        o.status || 'Pendiente'
    ]);

    doc.autoTable({ head: [tableColumns], body: tableRows, startY: 30 });
    doc.save("Reporte_Ventas_GlamChic.pdf");
    showToast('¡Reporte en PDF exportado!');
}

function renderSalesChart(orders) {
    const ctx = document.getElementById('salesChart');
    if (!ctx) return;
    const recentOrders = [...orders].reverse().slice(-6);
    const labels = recentOrders.map(o => new Date(o.createdAt || Date.now()).toLocaleDateString());
    const dataValues = recentOrders.map(o => o.total || 0);

    if (salesChartInstance) salesChartInstance.destroy();
    salesChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels.length > 0 ? labels : ['Sin datos'],
            datasets: [{
                data: dataValues.length > 0 ? dataValues : [0],
                backgroundColor: 'rgba(219, 39, 119, 0.7)',
                borderColor: 'rgb(219, 39, 119)',
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
}

function setupOrderModal() {
    const modal = document.getElementById('order-modal');
    const openBtn = document.getElementById('open-order-btn');
    const closeBtn = document.getElementById('close-order-btn');
    const whatsappBtn = document.getElementById('whatsapp-btn');

    if (!modal || !openBtn) return;
    openBtn.addEventListener('click', () => {
        renderOrderModalContent();
        modal.classList.remove('hidden');
        renderPayPalButton();
    });
    if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.add('hidden'));

    if (whatsappBtn) {
        whatsappBtn.addEventListener('click', () => {
            const order = getSavedOrder();
            if (order.length === 0) { alert('Pedido vacío.'); return; }
            let message = "Hola, me gustaría solicitar los siguientes artículos de Boutique Glam Chic:\n\n";
            let total = 0;
            order.forEach(item => {
                message += `- ${item.quantity}x ${item.name} ($${(item.price * item.quantity).toFixed(2)})\n`;
                total += item.price * item.quantity;
            });
            message += `\n*Total: $${total.toFixed(2)}*`;
            window.open(`https://wa.me/5218995432261?text=${encodeURIComponent(message)}`, '_blank');
        });
    }
}

function renderPayPalButton() {
    const container = document.getElementById('paypal-button-container');
    if (!container) return;
    container.innerHTML = '';

    if (typeof paypal === 'undefined') return;

    paypal.Buttons({
        createOrder: (data, actions) => {
            const order = getSavedOrder();
            const session = JSON.parse(localStorage.getItem('glam_user_session'));
            const address = document.getElementById('shipping-address').value;
            const phone = document.getElementById('client-phone').value;

            if (order.length === 0) throw new Error('Carrito vacío');
            if (!session) { alert('Inicia sesión.'); openAuthModal(); throw new Error('Sin sesión'); }
            if (!address || !phone) { alert('Completa dirección y teléfono.'); throw new Error('Faltan datos'); }

            const total = order.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            return actions.order.create({ purchase_units: [{ amount: { value: total.toFixed(2) } }] });
        },
        onApprove: async (data, actions) => {
            return actions.order.capture().then(async (details) => {
                const order = getSavedOrder();
                const session = JSON.parse(localStorage.getItem('glam_user_session'));
                const address = document.getElementById('shipping-address').value;
                const phone = document.getElementById('client-phone').value;
                const total = order.reduce((sum, item) => sum + (item.price * item.quantity), 0);

                const newOrderRecord = {
                    clientEmail: session.email,
                    clientName: session.name,
                    shippingAddress: address,
                    clientPhone: phone,
                    paymentMethod: 'PayPal (ID: ' + details.id + ')',
                    items: order,
                    total: total,
                    status: 'Pendiente',
                    createdAt: new Date().toISOString()
                };

                try {
                    await fetch(`${API_URL}/api/orders`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(newOrderRecord)
                    });
                } catch (e) {}

                alert(`¡Pago completado con éxito! Pedido registrado.`);
                localStorage.removeItem('glam_saved_order');
                updateOrderBadge();
                renderOrderModalContent();
                document.getElementById('order-modal').classList.add('hidden');
            });
        }
    }).render('#paypal-button-container');
}

function setupThemeToggle() {
    const toggleBtn = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const htmlElement = document.documentElement;
    if (!toggleBtn || !themeIcon) return;

    const applyTheme = (isDark) => {
        if (isDark) {
            htmlElement.classList.add('dark');
            themeIcon.className = 'fas fa-sun text-yellow-400';
            localStorage.setItem('glam_theme', 'dark');
        } else {
            htmlElement.classList.remove('dark');
            themeIcon.className = 'fas fa-moon text-gray-700';
            localStorage.setItem('glam_theme', 'light');
        }
    };
    applyTheme((localStorage.getItem('glam_theme') || 'light') === 'dark');
    toggleBtn.addEventListener('click', () => applyTheme(!htmlElement.classList.contains('dark')));
}

function setupFilters() {
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    if (!searchInput || !categoryFilter) return;

    const filterHandler = () => {
        const query = searchInput.value.toLowerCase();
        const selectedCategory = categoryFilter.value;
        const filtered = getStoredProducts().filter(product => {
            const matchesQuery = product.name.toLowerCase().includes(query) || (product.description && product.description.toLowerCase().includes(query));
            const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
            return matchesQuery && matchesCategory;
        });
        renderCatalog(filtered);
    };
    searchInput.addEventListener('input', filterHandler);
    categoryFilter.addEventListener('change', filterHandler);
}

function monitorConnection() {
    const banner = document.getElementById('offline-banner');
    if (!banner) return;
    const updateStatus = () => banner.classList.toggle('hidden', navigator.onLine);
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    updateStatus();
}

document.addEventListener('DOMContentLoaded', () => { initializeApp(); });
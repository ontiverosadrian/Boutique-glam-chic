let isRegistering = false;
let salesChartInstance = null;
let cachedAdminOrders = [];
let cachedClientOrders = [];

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
    registerServiceWorker();
}

async function fetchAndRenderProducts() {
    try {
        const response = await fetch('http://localhost:5000/api/products');
        const products = await response.json();
        
        if (response.ok) {
            if (products.length === 0) {
                await seedInitialProducts();
                return;
            }
            localStorage.setItem('glam_products', JSON.stringify(products));
            renderCatalog(products);
            renderAdminProductsTable(products);
        }
    } catch (err) {
        console.error('Error al conectar con la API de productos:', err);
        const local = JSON.parse(localStorage.getItem('glam_products')) || [];
        renderCatalog(local);
        renderAdminProductsTable(local);
    }
}

async function seedInitialProducts() {
    const defaultProducts = [
        { name: "Vestido Midi Satinado", category: "Vestidos", price: 899.00, image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&auto=format&fit=crop&q=60", description: "Elegante vestido de satín con tirantes ajustables." },
        { name: "Bolso de Mano Elegante", category: "Accesorios", price: 549.00, image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&auto=format&fit=crop&q=60", description: "Bolso compacto con detalles metálicos dorados." }
    ];

    for (let p of defaultProducts) {
        await fetch('http://localhost:5000/api/admin/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(p)
        });
    }
    fetchAndRenderProducts();
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
        const card = document.createElement('div');
        card.className = 'bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col';
        card.innerHTML = `
            <div class="h-64 overflow-hidden bg-gray-100 dark:bg-gray-900 relative">
                <img src="${product.image}" alt="${product.name}" class="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-300" loading="lazy">
                <span class="absolute top-3 right-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm text-pink-700 dark:text-pink-400 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
                    ${product.category}
                </span>
            </div>
            <div class="p-5 flex flex-col flex-grow">
                <h3 class="font-bold text-lg text-gray-800 dark:text-gray-100 mb-1">${product.name}</h3>
                <p class="text-gray-500 dark:text-gray-400 text-sm mb-4 flex-grow">${product.description || ''}</p>
                <div class="flex items-center justify-between mt-4 pt-4 border-t border-gray-50 dark:border-gray-700">
                    <span class="text-xl font-extrabold text-pink-600 dark:text-pink-400">$${product.price.toFixed(2)}</span>
                    <button onclick="addToOrder('${product._id || product.id}')" class="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm flex items-center space-x-1.5">
                        <i class="fas fa-plus"></i> <span>Añadir</span>
                    </button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function renderAdminProductsTable(products) {
    const tableBody = document.getElementById('admin-products-table');
    if (!tableBody) return;

    if (products.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-gray-400">No hay productos en el inventario.</td></tr>`;
        return;
    }

    tableBody.innerHTML = '';
    products.forEach(p => {
        const prodId = p._id || p.id;
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
    const product = allProducts.find(p => (p._id === productId || p.id == productId));
    if (!product) return;

    let currentOrder = getSavedOrder();
    const existingItem = currentOrder.find(item => (item._id === productId || item.id == productId));

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
    currentOrder = currentOrder.filter(item => (item._id !== productId && item.id != productId));
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
                <button onclick="removeFromOrder('${item._id || item.id}')" class="text-gray-400 hover:text-red-500 transition-colors p-1">
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
            <button id="open-auth-btn" class="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors flex items-center space-x-2">
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

function setupAuthForm() {
    const form = document.getElementById('auth-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('auth-email').value;
        const password = document.getElementById('auth-password').value;
        const name = document.getElementById('auth-name').value;

        const endpoint = isRegistering ? 'http://localhost:5000/api/auth/register' : 'http://localhost:5000/api/auth/login';
        const payload = isRegistering ? { name, email, password, role: email.includes('admin') ? 'admin' : 'client' } : { email, password };

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();

            if (response.ok) {
                if (isRegistering) {
                    alert('¡Registro exitoso! Ahora inicia sesión.');
                    toggleAuthMode();
                } else {
                    localStorage.setItem('glam_user_session', JSON.stringify(data.user));
                    closeAuthModal();
                    checkUserSession();
                    showToast(`¡Bienvenido, ${data.user.name}!`);
                }
            } else {
                alert(data.error || 'Ocurrió un error en la autenticación.');
            }
        } catch (err) {
            console.error('Error de red:', err);
            alert('No se pudo conectar con el servidor backend en localhost:5000.');
        }
    });
}

function setupProductForm() {
    const form = document.getElementById('add-product-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('prod-name').value;
        const category = document.getElementById('prod-category').value;
        const price = parseFloat(document.getElementById('prod-price').value);
        const image = document.getElementById('prod-image').value;
        const description = document.getElementById('prod-desc').value;

        try {
            const response = await fetch('http://localhost:5000/api/admin/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, category, price, image, description })
            });

            if (response.ok) {
                alert('¡Producto agregado con éxito a MongoDB!');
                form.reset();
                await fetchAndRenderProducts();
            } else {
                alert('Error al guardar el producto.');
            }
        } catch (err) {
            console.error('Error:', err);
            alert('Error de red al registrar el producto.');
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
        const name = document.getElementById('edit-prod-name').value;
        const category = document.getElementById('edit-prod-category').value;
        const price = parseFloat(document.getElementById('edit-prod-price').value);
        const image = document.getElementById('edit-prod-image').value;
        const description = document.getElementById('edit-prod-desc').value;

        try {
            const response = await fetch(`http://localhost:5000/api/admin/products/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, category, price, image, description })
            });

            if (response.ok) {
                alert('¡Producto actualizado correctamente en MongoDB!');
                closeEditModal();
                await fetchAndRenderProducts();
            } else {
                alert('Error al actualizar el producto.');
            }
        } catch (err) {
            console.error('Error:', err);
            alert('Error de red al actualizar.');
        }
    });
}

window.deleteProduct = async function(productId) {
    if (!confirm('¿Estás seguro de eliminar este producto del inventario?')) return;

    try {
        const response = await fetch(`http://localhost:5000/api/admin/products/${productId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showToast('Producto eliminado.');
            await fetchAndRenderProducts();
        } else {
            alert('Error al eliminar el producto.');
        }
    } catch (err) {
        console.error('Error:', err);
        alert('Error de red al eliminar.');
    }
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

    try {
        const response = await fetch(`http://localhost:5000/api/orders/client/${encodeURIComponent(session.email)}`);
        const orders = await response.json();

        if (response.ok) {
            cachedClientOrders = orders;

            if (orders.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-12 text-gray-400 border border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
                        <i class="fas fa-box-open text-4xl mb-2"></i>
                        <p class="text-sm">Aún no has registrado ningún pedido en la base de datos.</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = '';
            orders.forEach((order) => {
                const date = new Date(order.createdAt).toLocaleString();
                let itemsListHtml = order.items.map(i => `
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
                            <span class="text-xs font-mono text-pink-600 dark:text-pink-400 font-semibold">Pedido ID: ${order._id}</span>
                            <p class="text-xs text-gray-400 mt-0.5"><i class="far fa-clock mr-1"></i> ${date}</p>
                        </div>
                        <div class="flex items-center space-x-2">
                            <span class="px-3 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                                ${order.status}
                            </span>
                            <button onclick="downloadClientTicket('${order._id}')" class="px-3 py-1.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-medium transition-colors shadow-sm flex items-center space-x-1">
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
                        <span class="text-pink-600 dark:text-pink-400 text-base">$${order.total.toFixed(2)}</span>
                    </div>
                `;
                container.appendChild(card);
            });
        }
    } catch (err) {
        console.error('Error al cargar historial:', err);
        container.innerHTML = `<div class="text-center py-10 text-red-400">Error de conexión al cargar tu historial.</div>`;
    }
}

window.downloadClientTicket = function(orderId) {
    const order = cachedClientOrders.find(o => o._id === orderId);
    if (!order) {
        alert('No se encontró la información del pedido.');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: [80, 150] });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(219, 39, 119);
    doc.text("BOUTIQUE GLAM CHIC", 40, 10, { align: "center" });

    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("Moda y Accesorios Exclusivos", 40, 15, { align: "center" });
    doc.text("----------------------------------------------------------------", 40, 19, { align: "center" });

    doc.setFontSize(8);
    doc.setTextColor(50, 50, 50);
    doc.text(`Folio ID: ${order._id.substring(0, 12)}...`, 5, 24);
    doc.text(`Fecha: ${new Date(order.createdAt).toLocaleString()}`, 5, 29);
    doc.text(`Cliente: ${order.clientName || 'Cliente'}`, 5, 34);
    doc.text(`Tel: ${order.clientPhone || 'N/D'}`, 5, 39);
    doc.text(`Dir: ${order.shippingAddress || 'N/D'}`, 5, 44);
    doc.text(`Pago: ${order.paymentMethod || 'Efectivo'}`, 5, 49);
    doc.text("----------------------------------------------------------------", 40, 53, { align: "center" });

    const tableColumns = ["Cant. / Art.", "Subtotal"];
    const tableRows = order.items.map(i => [
        `${i.quantity}x ${i.name}`,
        `$${(i.price * i.quantity).toFixed(2)}`
    ]);

    doc.autoTable({
        head: [tableColumns],
        body: tableRows,
        startY: 56,
        theme: 'plain',
        headStyles: { fillColor: [219, 39, 119], textColor: [255, 255, 255], fontSize: 8 },
        styles: { fontSize: 7, cellPadding: 1 },
        margin: { left: 5, right: 5 }
    });

    let finalY = doc.lastAutoTable.finalY + 5;
    doc.text("----------------------------------------------------------------", 40, finalY, { align: "center" });
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(219, 39, 119);
    doc.text(`TOTAL: $${order.total.toFixed(2)}`, 75, finalY + 6, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text("¡Gracias por tu compra en Glam Chic!", 40, finalY + 14, { align: "center" });
    doc.text("Conserva este ticket para cualquier aclaración.", 40, 18, { align: "center" });

    doc.save(`Ticket_GlamChic_${order._id.substring(0, 6)}.pdf`);
    showToast('¡Ticket en PDF descargado con éxito!');
}

function setupChatbot() {
    const toggleBtn = document.getElementById('chatbot-toggle-btn');
    const closeBtn = document.getElementById('chatbot-close-btn');
    const windowEl = document.getElementById('chatbot-window');
    const sendBtn = document.getElementById('chatbot-send-btn');
    const inputEl = document.getElementById('chatbot-input');

    if (!toggleBtn || !windowEl) return;

    toggleBtn.addEventListener('click', () => {
        windowEl.classList.toggle('hidden');
    });

    closeBtn.addEventListener('click', () => {
        windowEl.classList.add('hidden');
    });

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
    inputEl.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleUserMessage();
    });
}

function appendChatMessage(text, sender) {
    const messagesEl = document.getElementById('chatbot-messages');
    if (!messagesEl) return;

    const div = document.createElement('div');
    if (sender === 'user') {
        div.className = 'flex items-end justify-end space-x-2';
        div.innerHTML = `
            <div class="bg-pink-600 text-white p-3 rounded-2xl shadow-sm max-w-[80%]">
                ${text}
            </div>
        `;
    } else {
        div.className = 'flex items-start space-x-2';
        div.innerHTML = `
            <div class="w-7 h-7 bg-pink-100 dark:bg-pink-900/50 text-pink-600 dark:text-pink-400 rounded-full flex items-center justify-center flex-shrink-0 text-xs">
                <i class="fas fa-robot"></i>
            </div>
            <div class="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 p-3 rounded-2xl shadow-sm max-w-[80%] border border-gray-100 dark:border-gray-700">
                ${text}
            </div>
        `;
    }
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
}

function generateBotResponse(userMsg) {
    const msg = userMsg.toLowerCase().trim();

    // Saludos y cortesía
    if (msg.includes('hola') || msg.includes('buenos dias') || msg.includes('buenas tardes') || msg.includes('buenas noches') || msg.includes('que tal')) {
        return "¡Hola! Qué gusto saludarte en Boutique Glam Chic. 💖 ¿Cómo puedo ayudarte hoy? Puedes preguntarme sobre pagos, envíos, vestidos o nuestras ubicaciones.";
    } 
    // Métodos de pago
    else if (msg.includes('pago') || msg.includes('pagar') || msg.includes('tarjeta') || msg.includes('efectivo') || msg.includes('transferencia') || msg.includes('oxxo')) {
        return "💳 Contamos con múltiples métodos de pago seguros:\n1. Efectivo contra entrega.\n2. Transferencia bancaria directa.\n3. Tarjetas de crédito/débito y pagos digitales.";
    } 
    // Envíos y entregas
    else if (msg.includes('envio') || msg.includes('entrega') || msg.includes('tiempo') || msg.includes('llega') || msg.includes('costo') || msg.includes('domicilio')) {
        return "🚚 Realizamos envíos locales y nacionales. El tiempo estimado de entrega es de 2 a 3 días hábiles una vez confirmado tu pedido en el sistema.";
    } 
    // Productos, vestidos y categorías
    else if (msg.includes('vestido') || msg.includes('ropa') || msg.includes('accesorio') || msg.includes('calzado') || msg.includes('catalogo') || msg.includes('productos') || msg.includes('muestrame')) {
        return "👗 Tenemos una colección exclusiva de vestidos midi, bolsos y accesorios de alta calidad. Puedes explorar y filtrar todo nuestro catálogo directamente en la página principal.";
    } 
    // Ubicación / Tienda física
    else if (msg.includes('ubicacion') || msg.includes('donde') || msg.includes('tienda') || msg.includes('local') || msg.includes('sucursal')) {
        return "📍 Operamos principalmente como una boutique digital exclusiva con entregas programadas y atención en línea las 24 horas.";
    }
    // Horarios
    else if (msg.includes('horario') || msg.includes('atienden') || msg.includes('abierto') || msg.includes('horas')) {
        return "🕒 Nuestra tienda digital y este asistente virtual están disponibles las 24 horas, los 365 días del año para tomar tus pedidos.";
    }
    // Cambios o devoluciones
    else if (msg.includes('cambio') || msg.includes('devolucion') || msg.includes('garantia') || msg.includes('regresar')) {
        return "🔄 Tienes hasta 7 días posteriores a la recepción de tu pedido para solicitar un cambio de talla o aclaración, siempre que la prenda conserve su viñeta original.";
    }
    // Descuentos o promociones
    else if (msg.includes('descuento') || msg.includes('oferta') || msg.includes('promo') || msg.includes('cupon')) {
        return "✨ ¡Mantente atento a nuestras publicaciones! Frecuentemente lanzamos dinámicas y códigos promocionales especiales para nuestras clientas frecuentes.";
    }
    // Contacto humano o WhatsApp directo
    else if (msg.includes('contacto') || msg.includes('telefono') || msg.includes('whatsapp') || msg.includes('humano') || msg.includes('asesor')) {
        return "📱 Claro que sí. Si necesitas atención directa con un asesor humano, puedes hacer clic en el botón verde de 'WhatsApp' dentro de tu carrito de compras.";
    } 
    // Respuesta por defecto
    else {
        return "Interesante pregunta. 🤔 En Glam Chic nos especializamos en moda exclusiva. ¿Te gustaría saber más sobre nuestros métodos de pago, tiempos de entrega o ver el catálogo de vestidos?";
    }
}

window.loadAdminDashboardData = async function() {
    const tableBody = document.getElementById('admin-orders-table');
    const totalSalesEl = document.getElementById('kpi-total-sales');
    const totalOrdersEl = document.getElementById('kpi-total-orders');
    const pendingOrdersEl = document.getElementById('kpi-pending-orders');

    if (!tableBody) return;

    tableBody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i> Cargando métricas desde MongoDB...</td></tr>`;

    try {
        const response = await fetch('http://localhost:5000/api/admin/orders');
        const orders = await response.json();

        if (response.ok) {
            cachedAdminOrders = orders;

            const totalOrdersCount = orders.length;
            const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
            const pendingCount = orders.filter(order => order.status === 'Pendiente').length;

            if (totalSalesEl) totalSalesEl.textContent = `$${totalRevenue.toFixed(2)}`;
            if (totalOrdersEl) totalOrdersEl.textContent = totalOrdersCount;
            if (pendingOrdersEl) pendingOrdersEl.textContent = pendingCount;

            renderSalesChart(orders);

            if (orders.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-gray-400">No hay pedidos registrados en la base de datos todavía.</td></tr>`;
                return;
            }

            tableBody.innerHTML = '';
            orders.forEach(order => {
                const itemsSummary = order.items.map(i => `${i.quantity}x ${i.name}`).join(', ');
                const date = new Date(order.createdAt).toLocaleDateString();
                
                const tr = document.createElement('tr');
                tr.className = 'hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors';
                tr.innerHTML = `
                    <td class="p-4 font-mono text-xs text-pink-600 dark:text-pink-400 font-semibold">${order._id}</td>
                    <td class="p-4">
                        <p class="font-semibold text-gray-800 dark:text-gray-200">${order.clientName || 'Cliente'}</p>
                        <p class="text-xs text-gray-500">${order.clientEmail}</p>
                    </td>
                    <td class="p-4 text-xs text-gray-600 dark:text-gray-300 max-w-xs truncate" title="${itemsSummary}">${itemsSummary}</td>
                    <td class="p-4 text-xs text-gray-600 dark:text-gray-300">
                        <p><strong>Dir:</strong> ${order.shippingAddress || 'N/D'}</p>
                        <p><strong>Pago:</strong> ${order.paymentMethod || 'Efectivo'}</p>
                    </td>
                    <td class="p-4 font-bold text-gray-900 dark:text-white">$${order.total.toFixed(2)}</td>
                    <td class="p-4">
                        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                            ${order.status}
                        </span>
                    </td>
                `;
                tableBody.appendChild(tr);
            });
        }
    } catch (err) {
        console.error('Error al conectar con el dashboard admin:', err);
        tableBody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-red-400">Sin conexión con el servidor central.</td></tr>`;
    }
}

window.exportOrdersToExcel = function() {
    if (!cachedAdminOrders || cachedAdminOrders.length === 0) {
        alert('No hay pedidos disponibles para exportar.');
        return;
    }

    const dataToExport = cachedAdminOrders.map(o => ({
        'ID Pedido': o._id,
        'Cliente': o.clientName || 'N/D',
        'Correo': o.clientEmail,
        'Teléfono': o.clientPhone || 'N/D',
        'Dirección': o.shippingAddress || 'N/D',
        'Método de Pago': o.paymentMethod || 'N/D',
        'Total ($)': o.total,
        'Estatus': o.status,
        'Fecha': new Date(o.createdAt).toLocaleString()
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Historial de Ventas");
    XLSX.writeFile(workbook, "Reporte_Ventas_GlamChic.xlsx");
    showToast('¡Reporte de Excel exportado con éxito!');
}

window.exportOrdersToPDF = function() {
    if (!cachedAdminOrders || cachedAdminOrders.length === 0) {
        alert('No hay pedidos disponibles para exportar.');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(219, 39, 119);
    doc.text("Boutique Glam Chic - Reporte de Ventas", 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generado el: ${new Date().toLocaleString()}`, 14, 28);

    const tableColumns = ["ID Pedido", "Cliente", "Teléfono", "Método Pago", "Total", "Estatus", "Fecha"];
    const tableRows = cachedAdminOrders.map(o => [
        o._id.substring(0, 8) + '...',
        o.clientName || o.clientEmail,
        o.clientPhone || 'N/D',
        o.paymentMethod || 'Efectivo',
        `$${o.total.toFixed(2)}`,
        o.status,
        new Date(o.createdAt).toLocaleDateString()
    ]);

    doc.autoTable({
        head: [tableColumns],
        body: tableRows,
        startY: 35,
        theme: 'grid',
        headStyles: { fillColor: [219, 39, 119] },
        styles: { fontSize: 8 }
    });

    doc.save("Reporte_Ventas_GlamChic.pdf");
    showToast('¡Reporte en PDF exportado con éxito!');
}

function renderSalesChart(orders) {
    const ctx = document.getElementById('salesChart');
    if (!ctx) return;

    const recentOrders = [...orders].reverse().slice(-6);
    const labels = recentOrders.map(o => new Date(o.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }));
    const dataValues = recentOrders.map(o => o.total);

    if (salesChartInstance) {
        salesChartInstance.destroy();
    }

    salesChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels.length > 0 ? labels : ['Sin datos'],
            datasets: [{
                label: 'Monto del Pedido ($ MXN)',
                data: dataValues.length > 0 ? dataValues : [0],
                backgroundColor: 'rgba(219, 39, 119, 0.7)',
                borderColor: 'rgb(219, 39, 119)',
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(200, 200, 200, 0.1)' }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });
}

function setupOrderModal() {
    const modal = document.getElementById('order-modal');
    const openBtn = document.getElementById('open-order-btn');
    const closeBtn = document.getElementById('close-order-btn');
    const checkoutBtn = document.getElementById('checkout-btn');
    const whatsappBtn = document.getElementById('whatsapp-btn');

    if (!modal || !openBtn) return;

    openBtn.addEventListener('click', () => {
        renderOrderModalContent();
        modal.classList.remove('hidden');
    });

    if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); });

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', async () => {
            const order = getSavedOrder();
            const session = JSON.parse(localStorage.getItem('glam_user_session'));
            const address = document.getElementById('shipping-address').value;
            const phone = document.getElementById('client-phone').value;
            const paymentMethod = document.getElementById('payment-method').value;

            if (order.length === 0) { alert('Tu pedido está vacío.'); return; }
            if (!session) { alert('Debes iniciar sesión para sincronizar tu pedido.'); openAuthModal(); return; }
            if (!address || !phone) { alert('Por favor, completa la dirección de envío y el teléfono.'); return; }

            const total = order.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            try {
                const response = await fetch('http://localhost:5000/api/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        clientEmail: session.email, 
                        clientName: session.name, 
                        shippingAddress: address,
                        clientPhone: phone,
                        paymentMethod: paymentMethod,
                        items: order, 
                        total: total 
                    })
                });

                const data = await response.json();
                if (response.ok) {
                    alert(`¡Pedido guardado con éxito en MongoDB! ID: ${data.orderId}`);
                    localStorage.removeItem('glam_saved_order');
                    updateOrderBadge();
                    renderOrderModalContent();
                    modal.classList.add('hidden');
                } else {
                    alert('Error al sincronizar con el servidor.');
                }
            } catch (error) {
                console.error('Error de red:', error);
                alert('No se pudo conectar con el servidor backend.');
            }
        });
    }

    if (whatsappBtn) {
        whatsappBtn.addEventListener('click', () => {
            const order = getSavedOrder();
            if (order.length === 0) { alert('Tu pedido está vacío.'); return; }

            let message = "Hola, me gustaría solicitar los siguientes artículos de Boutique Glam Chic:\n\n";
            let total = 0;
            order.forEach(item => {
                message += `- ${item.quantity}x ${item.name} ($${(item.price * item.quantity).toFixed(2)})\n`;
                total += item.price * item.quantity;
            });
            message += `\n*Total Estimado: $${total.toFixed(2)}*`;
            window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
        });
    }
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

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(reg => console.log('SW registrado:', reg.scope))
                .catch(err => console.log('Error SW:', err));
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});
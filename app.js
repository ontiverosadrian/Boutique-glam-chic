const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:5000' 
    : 'https://boutique-glam-chic.onrender.com';

let isRegistering = false;
let salesChartInstance = null;
let selectedProductForDetail = null;
let currentSelectedSize = 'Unitalla';

async function initializeApp() {
    if (!localStorage.getItem('glam_saved_order')) {
        localStorage.setItem('glam_saved_order', JSON.stringify([]));
    }
    await fetchAndRenderProducts();
    await fetchAndRenderBanner();
    checkUserSession();
    setupProductForm();
    setupEditProductForm();
    setupBannerAdminForm();
    setupCardPaymentForm();
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

async function fetchAndRenderBanner() {
    try {
        const response = await fetch(`${API_URL}/api/banner`);
        if (response.ok) {
            const banner = await response.json();
            const titleEl = document.getElementById('display-title');
            const subtitleEl = document.getElementById('display-subtitle');
            const badgeEl = document.getElementById('display-badge');
            const videoEl = document.getElementById('display-video');

            if (titleEl) titleEl.textContent = banner.title;
            if (subtitleEl) subtitleEl.textContent = banner.subtitle;
            if (badgeEl) badgeEl.textContent = banner.badge;
            if (videoEl && banner.videoUrl) videoEl.src = banner.videoUrl;
        }
    } catch (e) {
        console.log('Error al cargar banner publicitario:', e);
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
        const isAvailable = product.available !== false;

        const card = document.createElement('div');
        card.className = `bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col group ${!isAvailable ? 'opacity-75' : 'cursor-pointer'}`;
        
        if (isAvailable) {
            card.onclick = (e) => {
                if (e.target.closest('.quick-add-btn')) return;
                openProductDetail(prodId);
            };
        }

        card.innerHTML = `
            <div class="h-64 overflow-hidden bg-gray-100 dark:bg-gray-900 relative">
                <img src="${product.image}" alt="${product.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${!isAvailable ? 'grayscale' : ''}" loading="lazy">
                <span class="absolute top-3 right-3 bg-white/90 dark:bg-gray-900/95 backdrop-blur-sm text-pink-700 dark:text-pink-400 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
                    ${product.category}
                </span>
                ${!isAvailable ? '<span class="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">Agotado</span>' : ''}
            </div>
            <div class="p-5 flex flex-col flex-grow">
                <h3 class="font-bold text-lg text-gray-800 dark:text-gray-100 mb-1 group-hover:text-pink-600 transition-colors">${product.name}</h3>
                <p class="text-gray-500 dark:text-gray-400 text-sm mb-4 flex-grow line-clamp-2">${product.description || 'Sin descripción detallada.'}</p>
                <div class="flex items-center justify-between mt-4 pt-4 border-t border-gray-50 dark:border-gray-700">
                    <span class="text-xl font-extrabold text-pink-600 dark:text-pink-400">$${product.price.toFixed(2)}</span>
                    ${isAvailable ? `
                        <button onclick="addToOrder('${prodId}')" class="quick-add-btn bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm flex items-center space-x-1.5">
                            <i class="fas fa-plus"></i> <span>Añadir</span>
                        </button>
                    ` : `
                        <span class="text-xs font-bold text-red-500 uppercase tracking-wider px-3 py-1.5 bg-red-50 dark:bg-red-900/30 rounded-xl">No disponible</span>
                    `}
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function renderAdminProductsTable(products) {
    const tableBody = document.getElementById('admin-products-table');
    if (!tableBody) return;

    if (!Array.isArray(products) || products.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-gray-400 text-xs">No hay productos en el inventario.</td></tr>`;
        return;
    }

    tableBody.innerHTML = products.map(p => {
        const prodId = p._id || p.id;
        const isAvailable = p.available !== false;
        return `
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <td class="p-4 flex items-center space-x-3">
                    <img src="${p.image}" alt="${p.name}" class="w-10 h-10 object-cover rounded-xl">
                    <span class="font-semibold text-xs text-gray-800 dark:text-gray-200">${p.name}</span>
                </td>
                <td class="p-4 text-xs text-gray-500">${p.category}</td>
                <td class="p-4 font-bold text-xs text-pink-600">$${p.price.toFixed(2)}</td>
                <td class="p-4 text-xs">
                    <span class="px-2.5 py-1 rounded-full font-semibold ${isAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}">
                        ${isAvailable ? 'Disponible' : 'Agotado'}
                    </span>
                </td>
                <td class="p-4 text-center space-x-2">
                    <button onclick="openEditProductModal('${prodId}')" class="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-xl text-xs font-semibold hover:bg-blue-200 transition-colors" title="Editar producto">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteProduct('${prodId}')" class="px-3 py-1.5 bg-red-100 text-red-700 rounded-xl text-xs font-semibold hover:bg-red-200 transition-colors" title="Eliminar producto">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

window.openEditProductModal = function(productId) {
    const products = getStoredProducts();
    const product = products.find(p => (p._id === productId || p.id == productId));
    if (!product) return;

    document.getElementById('edit-prod-id').value = product._id || product.id;
    document.getElementById('edit-prod-name').value = product.name;
    document.getElementById('edit-prod-category').value = product.category;
    document.getElementById('edit-prod-price').value = product.price;
    document.getElementById('edit-prod-image').value = product.image;
    document.getElementById('edit-prod-available').value = product.available !== false ? 'true' : 'false';
    document.getElementById('edit-prod-desc').value = product.description || '';

    document.getElementById('edit-product-modal').classList.remove('hidden');
};

window.closeEditProductModal = function() {
    document.getElementById('edit-product-modal').classList.add('hidden');
};

function setupEditProductForm() {
    const form = document.getElementById('edit-product-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const prodId = document.getElementById('edit-prod-id').value;
        const updatedProd = {
            name: document.getElementById('edit-prod-name').value.trim(),
            category: document.getElementById('edit-prod-category').value,
            price: parseFloat(document.getElementById('edit-prod-price').value),
            image: document.getElementById('edit-prod-image').value.trim(),
            available: document.getElementById('edit-prod-available').value === 'true',
            description: document.getElementById('edit-prod-desc').value.trim()
        };

        try {
            const response = await fetch(`${API_URL}/api/admin/products/${prodId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedProd)
            });

            if (response.ok) {
                showToast('¡Producto actualizado con éxito!');
                closeEditProductModal();
                await fetchAndRenderProducts();
            } else {
                alert('Error al actualizar el producto en el servidor.');
            }
        } catch (err) {
            alert('No se pudo conectar con el servidor.');
        }
    });
}

window.openProductDetail = function(productId) {
    const products = getStoredProducts();
    const product = products.find(p => (p._id === productId || p.id == productId));
    if (!product) return;

    selectedProductForDetail = product;
    currentSelectedSize = 'Unitalla';

    document.getElementById('detail-img').src = product.image;
    document.getElementById('detail-category').textContent = product.category;
    document.getElementById('detail-name').textContent = product.name;
    document.getElementById('detail-price').textContent = `$${product.price.toFixed(2)}`;
    document.getElementById('detail-desc').textContent = product.description || 'Prenda exclusiva de alta calidad.';

    document.getElementById('product-detail-modal').classList.remove('hidden');
};

window.closeProductDetailModal = function() {
    document.getElementById('product-detail-modal').classList.add('hidden');
    selectedProductForDetail = null;
};

window.selectSize = function(size) { currentSelectedSize = size; };

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
    showToast(`¡"${selectedProductForDetail.name}" añadido al pedido!`);
    closeProductDetailModal();
};

window.addToOrder = function(productId) {
    const allProducts = getStoredProducts();
    const product = allProducts.find(p => (p._id === productId || p.id == productId));
    if (!product || product.available === false) return;

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
    if (currentOrder.length === 0) {
        listContainer.innerHTML = `<div class="text-center py-10 text-gray-400"><p class="text-sm">Tu pedido está vacío.</p></div>`;
        totalContainer.textContent = '$0.00';
        return;
    }

    let grandTotal = 0;
    listContainer.innerHTML = currentOrder.map(item => {
        const itemTotal = item.price * item.quantity;
        grandTotal += itemTotal;
        const itemId = item._id || item.id;
        return `
            <div class="flex items-center justify-between pt-2">
                <div class="flex items-center space-x-3">
                    <img src="${item.image}" alt="${item.name}" class="w-12 h-12 object-cover rounded-lg">
                    <div>
                        <h4 class="font-semibold text-xs text-gray-800 dark:text-gray-200">${item.name}</h4>
                        <p class="text-xs text-gray-500">Cant: ${item.quantity} x $${item.price.toFixed(2)}</p>
                    </div>
                </div>
                <div class="flex items-center space-x-3">
                    <span class="font-bold text-pink-600 text-xs">$${itemTotal.toFixed(2)}</span>
                    <button onclick="removeFromOrder('${itemId}')" class="text-gray-400 hover:text-red-500"><i class="fas fa-trash-alt"></i></button>
                </div>
            </div>
        `;
    }).join('');

    totalContainer.textContent = `$${grandTotal.toFixed(2)}`;
}

window.confirmCashOrder = async function() {
    await processOrderWithPaymentMethod('Efectivo / Contra Entrega');
}

window.openCardModal = function() {
    const currentOrder = getSavedOrder();
    if (currentOrder.length === 0) {
        alert('Tu pedido está vacío.');
        return;
    }
    
    const address = document.getElementById('shipping-address').value.trim();
    const phone = document.getElementById('client-phone').value.trim();
    if (!address || !phone) {
        alert('Por favor ingresa tu dirección de envío y teléfono antes de proceder al pago con tarjeta.');
        return;
    }

    document.getElementById('order-modal').classList.add('hidden');
    document.getElementById('card-payment-modal').classList.remove('hidden');
}

window.closeCardModal = function() {
    document.getElementById('card-payment-modal').classList.add('hidden');
}

function setupCardPaymentForm() {
    const form = document.getElementById('card-payment-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const number = document.getElementById('card-number').value.trim();
        if (number.length < 15) {
            alert('Número de tarjeta inválido.');
            return;
        }
        await processOrderWithPaymentMethod(`Tarjeta (Terminada en ${number.slice(-4)})`);
        closeCardModal();
        form.reset();
    });
}

async function processOrderWithPaymentMethod(method) {
    const currentOrder = getSavedOrder();
    const address = document.getElementById('shipping-address').value.trim();
    const phone = document.getElementById('client-phone').value.trim();
    const session = JSON.parse(localStorage.getItem('glam_user_session'));

    const orderPayload = {
        clientEmail: session ? session.email : 'cliente@glamchic.com',
        clientName: session ? session.name : 'Cliente Invitado',
        shippingAddress: address,
        clientPhone: phone,
        paymentMethod: method,
        items: currentOrder,
        total: currentOrder.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        status: method.includes('Tarjeta') ? 'Pagado y Confirmado' : 'Pendiente'
    };

    try {
        const response = await fetch(`${API_URL}/api/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderPayload)
        });

        if (response.ok) {
            alert(`¡Pedido procesado con éxito vía ${method}! Registrado correctamente.`);
            localStorage.setItem('glam_saved_order', JSON.stringify([]));
            updateOrderBadge();
            document.getElementById('order-modal').classList.add('hidden');
        } else {
            alert('Error al registrar el pedido en el servidor.');
        }
    } catch (err) {
        alert('No se pudo conectar con el servidor.');
    }
}

window.downloadCatalogPDF = function() {
    try {
        const { jsPDF } = window.jspdf || {};
        if (!jsPDF) {
            alert("La librería de PDF aún se está cargando. Intenta de nuevo en un segundo.");
            return;
        }

        const doc = new jsPDF();
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.setTextColor(219, 39, 119);
        doc.text("Boutique Glam Chic", 14, 20);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.setTextColor(100, 100, 100);
        doc.text("Catálogo Exclusivo de Prendas y Accesorios", 14, 27);
        
        doc.setFontSize(9);
        doc.text(`Fecha de emisión: ${new Date().toLocaleDateString()}`, 14, 34);

        const products = getStoredProducts();
        if (!products || products.length === 0) {
            alert("No hay productos en el catálogo para exportar.");
            return;
        }

        const tableData = products.map(p => [
            p.name || 'Sin nombre', 
            p.category || 'General', 
            `$${(p.price || 0).toFixed(2)}`, 
            p.available !== false ? 'Disponible' : 'Agotado'
        ]);

        doc.autoTable({
            startY: 40,
            head: [['Prenda / Accesorio', 'Categoría', 'Precio', 'Estatus']],
            body: tableData,
            headStyles: { fillColor: [219, 39, 119], textColor: [255, 255, 255], fontStyle: 'bold' },
            bodyStyles: { textColor: [50, 50, 50] },
            alternateRowStyles: { fillColor: [253, 242, 248] },
            theme: 'striped',
            margin: { left: 14, right: 14 }
        });

        doc.save("Catalogo_Boutique_Glam_Chic.pdf");
        showToast("¡Catálogo PDF descargado con éxito!");

    } catch (error) {
        console.error("Error al generar PDF:", error);
        alert("Ocurrió un error al generar el PDF.");
    }
};

function showToast(message) {
    let toast = document.getElementById('toast-notification');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-notification';
        toast.className = 'fixed bottom-5 right-5 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-lg z-50 text-sm font-medium transition-opacity duration-300';
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
                <span class="text-xs font-semibold px-3 py-1.5 bg-pink-100 text-pink-700 rounded-xl">${session.name} (${session.role || 'cliente'})</span>
                <button onclick="logoutUser()" class="p-2.5 rounded-xl bg-gray-100 hover:bg-red-100 hover:text-red-600 transition-colors" title="Cerrar Sesión"><i class="fas fa-sign-out-alt"></i></button>
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
        container.innerHTML = `<button id="open-auth-btn" class="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 px-3.5 py-2 rounded-xl text-sm font-medium flex items-center space-x-2"><i class="fas fa-user"></i> <span>Iniciar Sesión</span></button>`;
        const btn = document.getElementById('open-auth-btn');
        if (btn) btn.addEventListener('click', openAuthModal);
        
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

    if (isRegistering) {
        title.textContent = 'Crear Cuenta';
        submitBtn.textContent = 'Registrarse';
        nameField.classList.remove('hidden');
    } else {
        title.textContent = 'Iniciar Sesión';
        submitBtn.textContent = 'Entrar';
        nameField.classList.add('hidden');
    }
}

window.logoutUser = function() {
    localStorage.removeItem('glam_user_session');
    window.location.reload();
}

function setupAuthForm() {
    const form = document.getElementById('auth-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
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
                    alert('¡Registro exitoso! Ahora inicia sesión.');
                    toggleAuthMode();
                } else {
                    localStorage.setItem('glam_user_session', JSON.stringify(data.user));
                    closeAuthModal();
                    window.location.reload();
                }
            } else {
                alert(data.error || 'Ocurrió un error.');
            }
        } catch (err) {
            alert('Error de conexión con el servidor.');
        }
    });
}

function setupProductForm() {
    const form = document.getElementById('add-product-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newProd = {
            name: document.getElementById('prod-name').value.trim(),
            category: document.getElementById('prod-category').value,
            price: parseFloat(document.getElementById('prod-price').value),
            image: document.getElementById('prod-image').value.trim(),
            description: document.getElementById('prod-desc').value.trim(),
            available: document.getElementById('prod-available').value === 'true'
        };

        try {
            const response = await fetch(`${API_URL}/api/admin/products`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newProd)
            });
            if (response.ok) {
                form.reset();
                showToast('¡Producto guardado exitosamente!');
                await fetchAndRenderProducts();
            }
        } catch (err) {
            alert('No se pudo guardar el producto.');
        }
    });
}

function setupBannerAdminForm() {
    const form = document.getElementById('banner-admin-form');
    if (!form) return;

    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);

    newForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            title: document.getElementById('banner-title').value.trim(),
            badge: document.getElementById('banner-badge').value.trim() || '✨ Promoción',
            subtitle: document.getElementById('banner-subtitle').value.trim(),
            videoUrl: document.getElementById('banner-video').value.trim()
        };

        try {
            showToast('Guardando anuncio...');
            const response = await fetch(`${API_URL}/api/admin/banner`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                showToast('¡Anuncio actualizado con éxito!');
                await fetchAndRenderBanner();
                newForm.reset();
            } else {
                alert('Error al actualizar el anuncio.');
            }
        } catch (err) {
            alert('No se pudo conectar con el servidor.');
        }
    });
}

window.deleteProduct = async function(productId) {
    if (!confirm('¿Eliminar este producto?')) return;
    try {
        await fetch(`${API_URL}/api/admin/products/${productId}`, { method: 'DELETE' });
        await fetchAndRenderProducts();
        showToast('Producto eliminado.');
    } catch (e) {
        alert('Error al eliminar.');
    }
}

window.loadAdminDashboardData = async function() {
    const tableBody = document.getElementById('admin-orders-table');
    const totalSalesEl = document.getElementById('kpi-total-sales');
    const totalOrdersEl = document.getElementById('kpi-total-orders');
    const pendingOrdersEl = document.getElementById('kpi-pending-orders');

    if (!tableBody) return;

    try {
        const response = await fetch(`${API_URL}/api/admin/orders`);
        const orders = await response.json();
        if (response.ok) {
            if (totalSalesEl) totalSalesEl.textContent = `$${orders.reduce((s, o) => s + o.total, 0).toFixed(2)}`;
            if (totalOrdersEl) totalOrdersEl.textContent = orders.length;
            if (pendingOrdersEl) pendingOrdersEl.textContent = orders.filter(o => o.status.includes('Pendiente')).length;
            renderSalesChart(orders);

            tableBody.innerHTML = orders.map(o => `
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td class="p-4 font-mono text-xs text-pink-600">${o._id ? o._id.slice(-6) : 'S/N'}</td>
                    <td class="p-4 text-xs font-semibold">${o.clientName}</td>
                    <td class="p-4 text-xs">${o.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}</td>
                    <td class="p-4 text-xs">${o.shippingAddress}</td>
                    <td class="p-4 font-bold text-xs">$${o.total.toFixed(2)}</td>
                    <td class="p-4 text-xs">
                        <select onchange="updateOrderStatus('${o._id}', this.value)" class="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs font-semibold border border-gray-200 dark:border-gray-700">
                            <option value="Pendiente" ${o.status === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                            <option value="Pagado y Confirmado" ${o.status === 'Pagado y Confirmado' ? 'selected' : ''}>Pagado y Confirmado</option>
                            <option value="En Camino" ${o.status === 'En Camino' ? 'selected' : ''}>En Camino</option>
                            <option value="Entregado" ${o.status === 'Entregado' ? 'selected' : ''}>Entregado</option>
                        </select>
                    </td>
                    <td class="p-4 text-center">
                        <button onclick="deleteOrder('${o._id}')" class="px-3 py-1.5 bg-red-100 text-red-700 rounded-xl text-xs font-semibold hover:bg-red-200 transition-colors" title="Eliminar pedido">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (e) {
        console.log('Error al cargar pedidos del admin');
    }
}

window.updateOrderStatus = async function(orderId, newStatus) {
    try {
        const response = await fetch(`${API_URL}/api/admin/orders/${orderId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        if (response.ok) {
            showToast("¡Estatus del pedido actualizado!");
            loadAdminDashboardData();
        }
    } catch (e) {
        alert("Error al actualizar estatus.");
    }
};

window.deleteOrder = async function(orderId) {
    if (!confirm('¿Estás seguro de eliminar este pedido del sistema?')) return;
    try {
        const response = await fetch(`${API_URL}/api/admin/orders/${orderId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showToast("Pedido eliminado correctamente.");
            await loadAdminDashboardData();
        } else {
            const errData = await response.json();
            alert(errData.error || "No se pudo eliminar el pedido en el servidor.");
        }
    } catch (e) {
        console.error("Error al eliminar pedido:", e);
        alert("Error de conexión al intentar eliminar el pedido.");
    }
};

function renderSalesChart(orders) {
    const ctx = document.getElementById('salesChart');
    if (!ctx) return;
    if (salesChartInstance) salesChartInstance.destroy();
    salesChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: orders.map(o => new Date(o.createdAt).toLocaleDateString()),
            datasets: [{ data: orders.map(o => o.total), backgroundColor: 'rgba(219, 39, 119, 0.7)' }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
}

function setupOrderModal() {
    const modal = document.getElementById('order-modal');
    const openBtn = document.getElementById('open-order-btn');
    const closeBtn = document.getElementById('close-order-btn');
    if (!modal || !openBtn) return;
    openBtn.addEventListener('click', () => { renderOrderModalContent(); modal.classList.remove('hidden'); });
    closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
}

function setupThemeToggle() {
    const toggleBtn = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const htmlElement = document.documentElement;
    if (!toggleBtn) return;

    toggleBtn.addEventListener('click', () => {
        htmlElement.classList.toggle('dark');
        themeIcon.className = htmlElement.classList.contains('dark') ? 'fas fa-sun text-yellow-400' : 'fas fa-moon text-gray-700';
    });
}

function setupFilters() {
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    if (!searchInput) return;

    const filterHandler = () => {
        const query = searchInput.value.toLowerCase();
        const cat = categoryFilter.value;
        const filtered = getStoredProducts().filter(p => 
            (p.name.toLowerCase().includes(query)) && (cat === 'all' || p.category === cat)
        );
        renderCatalog(filtered);
    };
    searchInput.addEventListener('input', filterHandler);
    categoryFilter.addEventListener('change', filterHandler);
}

function setupChatbot() {
    const toggleBtn = document.getElementById('chatbot-toggle-btn');
    const closeBtn = document.getElementById('chatbot-close-btn');
    const windowEl = document.getElementById('chatbot-window');
    const sendBtn = document.getElementById('chatbot-send-btn');
    const inputEl = document.getElementById('chatbot-input');
    const messagesEl = document.getElementById('chatbot-messages');

    if (!toggleBtn) return;

    toggleBtn.onclick = () => windowEl.classList.toggle('hidden');
    closeBtn.onclick = () => windowEl.classList.add('hidden');

    const addMsg = (text, sender) => {
        const div = document.createElement('div');
        div.className = `flex ${sender === 'user' ? 'justify-end' : 'justify-start'}`;
        div.innerHTML = `<div class="p-3 rounded-2xl max-w-[80%] text-xs ${sender === 'user' ? 'bg-pink-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border'}">${text}</div>`;
        messagesEl.appendChild(div);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    };

    const handleSend = () => {
        const text = inputEl.value.trim();
        if (!text) return;
        addMsg(text, 'user');
        inputEl.value = '';
        setTimeout(() => {
            addMsg('¡Gracias por tu mensaje! Con gusto te asistimos con tu compra en Boutique Glam Chic. 💖', 'bot');
        }, 1000);
    };

    sendBtn.onclick = handleSend;
    inputEl.onkeypress = (e) => { if (e.key === 'Enter') handleSend(); };
}

function monitorConnection() {
    const banner = document.getElementById('offline-banner');
    if (!banner) return;
    const updateStatus = () => banner.classList.toggle('hidden', navigator.onLine);
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    updateStatus();
}

window.switchClientView = function(view) {
    const catalogView = document.getElementById('products-section');
    const historyView = document.getElementById('client-history-section');
    const catBtn = document.getElementById('tab-catalog-btn');
    const histBtn = document.getElementById('tab-history-btn');

    if (view === 'catalog') {
        catalogView.classList.remove('hidden');
        historyView.classList.add('hidden');
        catBtn.className = 'px-5 py-2.5 rounded-xl font-medium text-sm bg-pink-600 text-white shadow-sm';
        histBtn.className = 'px-5 py-2.5 rounded-xl font-medium text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200';
    } else {
        catalogView.classList.add('hidden');
        historyView.classList.remove('hidden');
        catBtn.className = 'px-5 py-2.5 rounded-xl font-medium text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200';
        histBtn.className = 'px-5 py-2.5 rounded-xl font-medium text-sm bg-pink-600 text-white shadow-sm';
        loadClientOrders();
    }
}

async function loadClientOrders() {
    const session = JSON.parse(localStorage.getItem('glam_user_session'));
    const container = document.getElementById('client-orders-container');
    if (!container) return;

    if (!session) {
        container.innerHTML = `<p class="text-xs text-gray-400">Inicia sesión para ver tu historial de pedidos.</p>`;
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/orders/client/${session.email}`);
        if (!response.ok) throw new Error('Error al conectar');

        const orders = await response.json();
        if (!Array.isArray(orders) || orders.length === 0) {
            container.innerHTML = `<p class="text-xs text-gray-400">No tienes pedidos registrados todavía.</p>`;
            return;
        }

        container.innerHTML = orders.map(o => `
            <div class="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 flex justify-between items-center text-xs">
                <div>
                    <span class="font-bold text-pink-600">Pedido #${o._id ? o._id.slice(-6) : 'S/N'}</span>
                    <p class="text-gray-500 mt-1">${o.items ? o.items.map(i => `${i.name} (x${i.quantity})`).join(', ') : ''}</p>
                    <span class="text-[10px] text-gray-400">Envío a: ${o.shippingAddress || 'N/A'} | Pago: ${o.paymentMethod || 'Efectivo'}</span>
                </div>
                <div class="text-right">
                    <span class="font-extrabold text-sm">$${o.total ? o.total.toFixed(2) : '0.00'}</span>
                    <span class="block px-2.5 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-700 mt-1">${o.status || 'Pendiente'}</span>
                </div>
            </div>
        `).join('');
    } catch (e) {
        container.innerHTML = `<p class="text-xs text-gray-400">Tus pedidos recientes se mostrarán aquí cuando el servidor responda.</p>`;
    }
}

document.addEventListener('DOMContentLoaded', () => { initializeApp(); });
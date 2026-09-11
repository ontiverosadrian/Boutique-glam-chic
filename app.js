// Catálogo de productos (16 artículos)
const products = [
    { id: 1, name: "Vestido Midi Satinado", category: "Vestidos", price: 899.00, image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&auto=format&fit=crop&q=60", description: "Elegante vestido de satín con tirantes ajustables, ideal para eventos formales." },
    { id: 2, name: "Bolso de Mano Elegante", category: "Accesorios", price: 549.00, image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&auto=format&fit=crop&q=60", description: "Bolso compacto con detalles metálicos dorados y correa ajustable." },
    { id: 3, name: "Zapatos de Tacón Minimalistas", category: "Calzado", price: 799.00, image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500&auto=format&fit=crop&q=60", description: "Tacones cómodos de diseño clásico en tono nude para cualquier ocasión." },
    { id: 4, name: "Blusa Romántica con Encaje", category: "Vestidos", price: 420.00, image: "https://images.unsplash.com/photo-1564257577535-648b292e76f4?w=500&auto=format&fit=crop&q=60", description: "Blusa delicada de mangas largas con acabados en encaje fino." },
    { id: 5, name: "Gafas de Sol Glam", category: "Accesorios", price: 299.00, image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500&auto=format&fit=crop&q=60", description: "Gafas de sol con protección UV y armazón geométrico estilo retro." },
    { id: 6, name: "Sandalias de Tiras Finas", category: "Calzado", price: 650.00, image: "https://images.unsplash.com/photo-1535043934128-cf0b28d52f95?w=500&auto=format&fit=crop&q=60", description: "Sandalias planas elegantes perfectas para un look fresco y casual." },
    { id: 7, name: "Blazer Oversize Chic", category: "Vestidos", price: 980.00, image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500&auto=format&fit=crop&q=60", description: "Blazer estructurado de corte moderno, perfecto para un look ejecutivo y sofisticado." },
    { id: 8, name: "Collar Dije de Cristal", category: "Accesorios", price: 350.00, image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&auto=format&fit=crop&q=60", description: "Delicado collar de plata esterlina con circonita brillante en corte diamante." },
    { id: 9, name: "Botines de Piel Estilo Chelsea", category: "Calzado", price: 1150.00, image: "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=500&auto=format&fit=crop&q=60", description: "Botines de piel sintética premium con paneles elásticos laterales y tacón cómodo." },
    { id: 10, name: "Vestido Largo de Gala", category: "Vestidos", price: 1450.00, image: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=500&auto=format&fit=crop&q=60", description: "Impresionante vestido largo con abertura lateral y caída fluida de alta costura." },
    { id: 11, name: "Sombrero de Paja Floppy", category: "Accesorios", price: 380.00, image: "https://images.unsplash.com/photo-1521369909029-2afed882baee?w=500&auto=format&fit=crop&q=60", description: "Sombrero elegante para exteriores con cinta decorativa en tono contrastante." },
    { id: 12, name: "Mocasines Clásicos Dorados", category: "Calzado", price: 690.00, image: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=500&auto=format&fit=crop&q=60", description: "Calzado plano de diseño atemporal con detalles metálicos frontales discretos." },
    { id: 13, name: "Falda Plisada Metálica", category: "Vestidos", price: 590.00, image: "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=500&auto=format&fit=crop&q=60", description: "Falda midi con pliegues finos y acabado brillante sutil en tono bronce." },
    { id: 14, name: "Reloj Minimalista Rose Gold", category: "Accesorios", price: 890.00, image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=500&auto=format&fit=crop&q=60", description: "Reloj de pulsera con extensible de malla milanesa y carátula limpia ultra delgada." },
    { id: 15, name: "Zapatillas Deportivas Casuales", category: "Calzado", price: 850.00, image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=500&auto=format&fit=crop&q=60", description: "Tenis urbanos blancos de líneas limpias combinables con cualquier atuendo chic." },
    { id: 16, name: "Cinturón Fino con Hebilla Dorada", category: "Accesorios", price: 250.00, image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=500&auto=format&fit=crop&q=60", description: "Cinturón de piel sintética estrecho ideal para marcar la cintura con vestidos o abrigos." }
];

let deferredPrompt = null;
let isRegistering = false;

// Inicialización de LocalStorage y Sesión
function initializeApp() {
    if (!localStorage.getItem('glam_products')) {
        localStorage.setItem('glam_products', JSON.stringify(products));
    }
    if (!localStorage.getItem('glam_saved_order')) {
        localStorage.setItem('glam_saved_order', JSON.stringify([]));
    }
    checkUserSession();
}

function getStoredProducts() {
    return JSON.parse(localStorage.getItem('glam_products')) || products;
}

function getSavedOrder() {
    return JSON.parse(localStorage.getItem('glam_saved_order')) || [];
}

function saveOrderToStorage(orderItems) {
    localStorage.setItem('glam_saved_order', JSON.stringify(orderItems));
    updateOrderBadge();
}

// Renderizado del Catálogo
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
                <p class="text-gray-500 dark:text-gray-400 text-sm mb-4 flex-grow">${product.description}</p>
                <div class="flex items-center justify-between mt-4 pt-4 border-t border-gray-50 dark:border-gray-700">
                    <span class="text-xl font-extrabold text-pink-600 dark:text-pink-400">$${product.price.toFixed(2)}</span>
                    <button onclick="addToOrder(${product.id})" class="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm flex items-center space-x-1.5">
                        <i class="fas fa-plus"></i> <span>Añadir</span>
                    </button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Gestión del Pedido / Carrito
window.addToOrder = function(productId) {
    const allProducts = getStoredProducts();
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    let currentOrder = getSavedOrder();
    const existingItem = currentOrder.find(item => item.id === productId);

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
    currentOrder = currentOrder.filter(item => item.id !== productId);
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
            <div class="text-center py-12 text-gray-400">
                <i class="fas fa-shopping-basket text-4xl mb-2"></i>
                <p>No tienes artículos guardados en tu pedido aún.</p>
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
        div.className = 'flex items-center justify-between pt-3 first:pt-0';
        div.innerHTML = `
            <div class="flex items-center space-x-3">
                <img src="${item.image}" alt="${item.name}" class="w-14 h-14 object-cover rounded-lg">
                <div>
                    <h4 class="font-semibold text-sm text-gray-800 dark:text-gray-200">${item.name}</h4>
                    <p class="text-xs text-gray-500 dark:text-gray-400">Cant: ${item.quantity} x $${item.price.toFixed(2)}</p>
                </div>
            </div>
            <div class="flex items-center space-x-3">
                <span class="font-bold text-pink-600 dark:text-pink-400 text-sm">$${itemTotal.toFixed(2)}</span>
                <button onclick="removeFromOrder(${item.id})" class="text-gray-400 hover:text-red-500 transition-colors p-1">
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
    
    setTimeout(() => {
        toast.style.opacity = '0';
    }, 2500);
}

// --- SISTEMA DE SESIONES Y AUTENTICACIÓN ---

function checkUserSession() {
    const session = JSON.parse(localStorage.getItem('glam_user_session'));
    const container = document.getElementById('auth-action-container');
    const catalogView = document.getElementById('catalog-view');
    const adminDashboard = document.getElementById('admin-dashboard');

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
            loadAdminOrders();
        } else {
            if (catalogView) catalogView.classList.remove('hidden');
            if (adminDashboard) adminDashboard.classList.add('hidden');
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
    }
}

function openAuthModal() {
    document.getElementById('auth-modal').classList.remove('hidden');
}

function closeAuthModal() {
    document.getElementById('auth-modal').classList.add('hidden');
}

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
            alert('No se pudo conectar con el servidor backend.');
        }
    });
}

// --- PANEL DE ADMINISTRADOR ---

async function loadAdminOrders() {
    const tableBody = document.getElementById('admin-orders-table');
    if (!tableBody) return;

    tableBody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i> Cargando pedidos desde MongoDB...</td></tr>`;

    try {
        const response = await fetch('http://localhost:5000/api/admin/orders');
        const orders = await response.json();

        if (response.ok) {
            if (orders.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-gray-400">No hay pedidos registrados en la base de datos todavía.</td></tr>`;
                return;
            }

            tableBody.innerHTML = '';
            orders.forEach(order => {
                const itemsSummary = order.items.map(i => `${i.quantity}x ${i.name}`).join(', ');
                const date = new Date(order.createdAt).toLocaleString();
                
                const tr = document.createElement('tr');
                tr.className = 'hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors';
                tr.innerHTML = `
                    <td class="p-4 font-mono text-xs text-pink-600 dark:text-pink-400">${order._id}</td>
                    <td class="p-4">
                        <p class="font-semibold text-gray-800 dark:text-gray-200">${order.clientName || 'Cliente'}</p>
                        <p class="text-xs text-gray-500">${order.clientEmail}</p>
                    </td>
                    <td class="p-4 text-xs text-gray-600 dark:text-gray-300 max-w-xs truncate" title="${itemsSummary}">${itemsSummary}</td>
                    <td class="p-4 font-bold text-gray-900 dark:text-white">$${order.total.toFixed(2)}</td>
                    <td class="p-4">
                        <span class="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                            ${order.status}
                        </span>
                    </td>
                    <td class="p-4 text-xs text-gray-500">${date}</td>
                `;
                tableBody.appendChild(tr);
            });
        } else {
            tableBody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-red-400">Error al obtener los pedidos del servidor.</td></tr>`;
        }
    } catch (err) {
        console.error('Error al conectar con el panel admin:', err);
        tableBody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-red-400">Sin conexión con el servidor central.</td></tr>`;
    }
}

// --- CONFIGURACIÓN DE INTERFAZ Y MODALES ---

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

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
        });
    }

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
    });

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', async () => {
            const order = getSavedOrder();
            const session = JSON.parse(localStorage.getItem('glam_user_session'));

            if (order.length === 0) {
                alert('Tu pedido está vacío.');
                return;
            }

            if (!session) {
                alert('Debes iniciar sesión para sincronizar tu pedido con la base de datos.');
                openAuthModal();
                return;
            }

            if (navigator.onLine) {
                try {
                    const total = order.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                    const response = await fetch('http://localhost:5000/api/orders', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            clientEmail: session.email,
                            clientName: session.name,
                            items: order,
                            total: total
                        })
                    });

                    const data = await response.json();

                    if (response.ok) {
                        alert(`¡Pedido guardado en MongoDB (base de datos boquite)! ID: ${data.orderId}`);
                        localStorage.removeItem('glam_saved_order');
                        updateOrderBadge();
                        renderOrderModalContent();
                        modal.classList.add('hidden');
                    } else {
                        alert('Error al sincronizar con el servidor.');
                    }
                } catch (error) {
                    console.error('Error de red:', error);
                    alert('No se pudo conectar con el servidor. El pedido se mantiene local.');
                }
            } else {
                alert('Estás offline. El pedido se guardó localmente.');
                modal.classList.add('hidden');
            }
        });
    }

    if (whatsappBtn) {
        whatsappBtn.addEventListener('click', () => {
            const order = getSavedOrder();
            if (order.length === 0) {
                alert('Tu pedido está vacío.');
                return;
            }

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

    const savedTheme = localStorage.getItem('glam_theme') || 'light';
    applyTheme(savedTheme === 'dark');

    toggleBtn.addEventListener('click', () => {
        applyTheme(!htmlElement.classList.contains('dark'));
    });
}

function setupFilters() {
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    if (!searchInput || !categoryFilter) return;

    const filterHandler = () => {
        const query = searchInput.value.toLowerCase();
        const selectedCategory = categoryFilter.value;
        const allProducts = getStoredProducts();

        const filtered = allProducts.filter(product => {
            const matchesQuery = product.name.toLowerCase().includes(query) || product.description.toLowerCase().includes(query);
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
    
    function updateStatus() {
        if (!navigator.onLine) {
            banner.classList.remove('hidden');
        } else {
            banner.classList.add('hidden');
        }
    }

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    updateStatus();
}

function setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        showInstallButton();
    });

    window.addEventListener('appinstalled', () => {
        hideInstallButton();
        deferredPrompt = null;
    });
}

function showInstallButton() {
    let installBtn = document.getElementById('install-btn');
    if (!installBtn) {
        const headerActions = document.querySelector('header .max-w-7xl > div:last-child');
        if (headerActions) {
            installBtn = document.createElement('button');
            installBtn.id = 'install-btn';
            installBtn.className = 'bg-pink-600 hover:bg-pink-700 text-white px-3.5 py-2 rounded-xl text-sm font-medium transition-colors flex items-center space-x-2 shadow-sm';
            installBtn.innerHTML = `<i class="fas fa-download"></i> <span class="hidden md:inline">Instalar</span>`;
            
            const themeToggleBtn = document.getElementById('theme-toggle');
            headerActions.insertBefore(installBtn, themeToggleBtn);
        }
    }

    if (installBtn) {
        installBtn.classList.remove('hidden');
        installBtn.onclick = async () => {
            if (!deferredPrompt) return;
            deferredPrompt.prompt();
            await deferredPrompt.userChoice;
            deferredPrompt = null;
            hideInstallButton();
        };
    }
}

function hideInstallButton() {
    const installBtn = document.getElementById('install-btn');
    if (installBtn) installBtn.classList.add('hidden');
}

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/Boutique-glam-chic/sw.js')
                .then(reg => console.log('SW registrado:', reg.scope))
                .catch(err => console.log('Error SW:', err));
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    renderCatalog(getStoredProducts());
    setupFilters();
    updateOrderBadge();
    setupOrderModal();
    setupThemeToggle();
    setupAuthForm();
    monitorConnection();
    setupInstallPrompt();
    registerServiceWorker();
});
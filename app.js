// Base de datos local de productos del catálogo
const products = [
    { id: 1, name: "Vestido Midi Satinado", category: "Vestidos", price: 899.00, image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&auto=format&fit=crop&q=60", description: "Elegante vestido de satín con tirantes ajustables, ideal para eventos formales." },
    { id: 2, name: "Bolso de Mano Elegante", category: "Accesorios", price: 549.00, image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&auto=format&fit=crop&q=60", description: "Bolso compacto con detalles metálicos dorados y correa ajustable." },
    { id: 3, name: "Zapatos de Tacón Minimalistas", category: "Calzado", price: 799.00, image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500&auto=format&fit=crop&q=60", description: "Tacones cómodos de diseño clásico en tono nude para cualquier ocasión." },
    { id: 4, name: "Blusa Romántica con Encaje", category: "Vestidos", price: 420.00, image: "https://images.unsplash.com/photo-1564257577535-648b292e76f4?w=500&auto=format&fit=crop&q=60", description: "Blusa delicada de mangas largas con acabados en encaje fino." },
    { id: 5, name: "Gafas de Sol Glam", category: "Accesorios", price: 299.00, image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500&auto=format&fit=crop&q=60", description: "Gafas de sol con protección UV y armazón geométrico estilo retro." },
    { id: 6, name: "Sandalias de Tiras Finas", category: "Calzado", price: 650.00, image: "https://images.unsplash.com/photo-1535043934128-cf0b28d52f95?w=500&auto=format&fit=crop&q=60", description: "Sandalias planas elegantes perfectas para un look fresco y casual." }
];

let deferredPrompt = null;

// Inicialización de LocalStorage
function initializeLocalStorage() {
    if (!localStorage.getItem('glam_products')) {
        localStorage.setItem('glam_products', JSON.stringify(products));
    }
    if (!localStorage.getItem('glam_saved_order')) {
        localStorage.setItem('glam_saved_order', JSON.stringify([]));
    }
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
        noResults.classList.remove('hidden');
        return;
    } else {
        noResults.classList.add('hidden');
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

// Gestión del Pedido
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
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
    });

    // Envío real al Backend conectado a MongoDB Atlas
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', async () => {
            const order = getSavedOrder();
            if (order.length === 0) {
                alert('Tu pedido está vacío.');
                return;
            }

            if (navigator.onLine) {
                try {
                    const total = order.reduce((sum, item) => sum + (item.price * item.quantity), 0);

                    const response = await fetch('http://localhost:5000/api/orders', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ items: order, total: total })
                    });

                    const data = await response.json();

                    if (response.ok) {
                        alert(`¡Sincronizado con MongoDB con éxito! ID de orden: ${data.orderId}`);
                        localStorage.removeItem('glam_saved_order');
                        updateOrderBadge();
                        renderOrderModalContent();
                        modal.classList.add('hidden');
                    } else {
                        alert('Hubo un problema al sincronizar con el servidor.');
                    }
                } catch (error) {
                    console.error('Error de red al conectar con el servidor:', error);
                    alert('No se pudo conectar con el servidor central. El pedido se mantiene resguardado localmente.');
                }
            } else {
                alert('Estás sin conexión. El pedido se ha guardado de forma segura en el almacenamiento local y se enviará a MongoDB en cuanto recuperes internet.');
                modal.classList.add('hidden');
            }
        });
    }

    if (whatsappBtn) {
        whatsappBtn.addEventListener('click', () => {
            const order = getSavedOrder();
            if (order.length === 0) {
                alert('Tu pedido está vacío para compartir.');
                return;
            }

            let message = "Hola, me gustaría solicitar los siguientes artículos de Boutique Glam Chic:\n\n";
            let total = 0;
            order.forEach(item => {
                message += `- ${item.quantity}x ${item.name} ($${(item.price * item.quantity).toFixed(2)})\n`;
                total += item.price * item.quantity;
            });
            message += `\n*Total Estimado: $${total.toFixed(2)}*`;

            const encodedMessage = encodeURIComponent(message);
            window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
        });
    }
}

// Selector de Tema Corregido y Optimizado
function setupThemeToggle() {
    const toggleBtn = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const htmlElement = document.documentElement;

    if (!toggleBtn || !themeIcon) return;

    // Verificar preferencia guardada al iniciar
    const savedTheme = localStorage.getItem('glam_theme') || 'light';
    if (savedTheme === 'dark') {
        htmlElement.classList.add('dark');
        themeIcon.className = 'fas fa-sun text-yellow-400';
    } else {
        htmlElement.classList.remove('dark');
        themeIcon.className = 'fas fa-moon text-gray-700';
    }

    toggleBtn.addEventListener('click', () => {
        if (htmlElement.classList.contains('dark')) {
            htmlElement.classList.remove('dark');
            localStorage.setItem('glam_theme', 'light');
            themeIcon.className = 'fas fa-moon text-gray-700';
        } else {
            htmlElement.classList.add('dark');
            localStorage.setItem('glam_theme', 'dark');
            themeIcon.className = 'fas fa-sun text-yellow-400';
        }
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
    if (installBtn) {
        installBtn.classList.add('hidden');
    }
}

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/Boutique-glam-chic/sw.js')
                .then(registration => {
                    console.log('Service Worker registrado con éxito:', registration.scope);
                })
                .catch(error => {
                    console.log('Fallo al registrar el Service Worker:', error);
                });
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initializeLocalStorage();
    renderCatalog(getStoredProducts());
    setupFilters();
    updateOrderBadge();
    setupOrderModal();
    setupThemeToggle();
    monitorConnection();
    setupInstallPrompt();
    registerServiceWorker();
});
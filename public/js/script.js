
// Configurações da API
const API_BASE_URL = window.location.origin + '/api';

// Estado global da aplicação
const AppState = {
    user: null,
    token: localStorage.getItem('token'),
    cart: JSON.parse(localStorage.getItem('cart') || '[]')
};

// Utilitários de API
class ApiClient {
    static async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // Adicionar token de autenticação se disponível
        if (AppState.token) {
            config.headers.Authorization = `Bearer ${AppState.token}`;
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Erro na requisição');
            }

            return data;
        } catch (error) {
            console.error('Erro na API:', error);
            throw error;
        }
    }

    static async get(endpoint) {
        return this.request(endpoint);
    }

    static async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    static async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    static async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }
}

// Gerenciamento de autenticação
class Auth {
    static async login(email, password) {
        try {
            const response = await ApiClient.post('/auth/login', { email, password });
            
            AppState.token = response.data.token;
            AppState.user = response.data.user;
            
            localStorage.setItem('token', AppState.token);
            localStorage.setItem('user', JSON.stringify(AppState.user));
            
            return response;
        } catch (error) {
            throw error;
        }
    }

    static async register(userData) {
        try {
            const response = await ApiClient.post('/auth/register', userData);
            
            AppState.token = response.data.token;
            AppState.user = response.data.user;
            
            localStorage.setItem('token', AppState.token);
            localStorage.setItem('user', JSON.stringify(AppState.user));
            
            return response;
        } catch (error) {
            throw error;
        }
    }

    static logout() {
        AppState.token = null;
        AppState.user = null;
        AppState.cart = [];
        
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('cart');
        
        window.location.href = '/';
    }

    static async getProfile() {
        try {
            const response = await ApiClient.get('/auth/profile');
            AppState.user = response.data.user;
            localStorage.setItem('user', JSON.stringify(AppState.user));
            return response;
        } catch (error) {
            throw error;
        }
    }

    static isAuthenticated() {
        return !!AppState.token;
    }

    static getUserRole() {
        return AppState.user?.role;
    }

    static redirectBasedOnRole() {
        if (!this.isAuthenticated()) {
            window.location.href = '/login.html';
            return;
        }

        const role = this.getUserRole();
        const currentPage = window.location.pathname;

        // Redirecionar para a página apropriada baseada no role
        if (role === 'producer' && !currentPage.includes('producer')) {
            window.location.href = '/producer.html';
        } else if (role === 'consumer' && !currentPage.includes('consumer')) {
            window.location.href = '/consumer.html';
        } else if (role === 'logistics' && !currentPage.includes('logistics')) {
            window.location.href = '/logistics.html';
        }
    }
}

// Gerenciamento de carrinho de compras
class Cart {
    static addItem(product, quantity = 1) {
        const existingItem = AppState.cart.find(item => item.productId === product.id);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            AppState.cart.push({
                productId: product.id,
                productName: product.name,
                price: product.price,
                quantity: quantity,
                unit: product.unit
            });
        }
        
        this.saveCart();
        this.updateCartUI();
    }

    static removeItem(productId) {
        AppState.cart = AppState.cart.filter(item => item.productId !== productId);
        this.saveCart();
        this.updateCartUI();
    }

    static updateQuantity(productId, quantity) {
        const item = AppState.cart.find(item => item.productId === productId);
        if (item) {
            if (quantity <= 0) {
                this.removeItem(productId);
            } else {
                item.quantity = quantity;
                this.saveCart();
                this.updateCartUI();
            }
        }
    }

    static getTotal() {
        return AppState.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    static getItemCount() {
        return AppState.cart.reduce((count, item) => count + item.quantity, 0);
    }

    static clear() {
        AppState.cart = [];
        this.saveCart();
        this.updateCartUI();
    }

    static saveCart() {
        localStorage.setItem('cart', JSON.stringify(AppState.cart));
    }

    static updateCartUI() {
        const cartCount = document.getElementById('cart-count');
        if (cartCount) {
            cartCount.textContent = this.getItemCount();
        }

        const cartTotal = document.getElementById('cart-total');
        if (cartTotal) {
            cartTotal.textContent = `R$ ${this.getTotal().toFixed(2)}`;
        }
    }
}

// Utilitários de UI
class UI {
    static showAlert(message, type = 'info') {
        const alertContainer = document.getElementById('alert-container') || document.body;
        
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;
        
        alertContainer.appendChild(alert);
        
        // Remover após 5 segundos
        setTimeout(() => {
            alert.remove();
        }, 5000);
    }

    static showLoading(element) {
        const originalContent = element.innerHTML;
        element.innerHTML = '<span class="loading"></span> Carregando...';
        element.disabled = true;
        
        return () => {
            element.innerHTML = originalContent;
            element.disabled = false;
        };
    }

    static formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    }

    static formatDate(date) {
        return new Intl.DateTimeFormat('pt-BR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(date));
    }

    static createProductCard(product) {
        return `
            <div class="product-card" data-product-id="${product.id}">
                <div class="product-image">
                    ${product.imageUrl ? 
                        `<img src="${product.imageUrl}" alt="${product.name}" style="width: 100%; height: 100%; object-fit: cover;">` :
                        '🥬'
                    }
                </div>
                <div class="product-info">
                    <div class="product-name">${product.name}</div>
                    <div class="product-description">${product.description}</div>
                    <div class="product-price">${this.formatCurrency(product.price)} / ${product.unit}</div>
                    <div class="product-stock">Estoque: ${product.stock} ${product.unit}</div>
                    ${Auth.getUserRole() === 'consumer' ? `
                        <button class="btn btn-primary btn-full" onclick="Cart.addItem(${JSON.stringify(product).replace(/"/g, '&quot;')})">
                            Adicionar ao Carrinho
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    static createOrderCard(order) {
        const statusClass = `status-${order.status}`;
        const statusText = this.getStatusText(order.status);
        
        return `
            <div class="order-card" data-order-id="${order.id}">
                <div class="order-header">
                    <div class="order-id">Pedido #${order.id.substring(0, 8)}</div>
                    <div class="order-status ${statusClass}">${statusText}</div>
                </div>
                <div class="order-details">
                    <p><strong>Total:</strong> ${this.formatCurrency(order.totalAmount)}</p>
                    <p><strong>Data:</strong> ${this.formatDate(order.createdAt)}</p>
                    <p><strong>Itens:</strong> ${order.items.length}</p>
                    ${order.notes ? `<p><strong>Observações:</strong> ${order.notes}</p>` : ''}
                </div>
                <div class="order-actions mt-2">
                    <button class="btn btn-secondary" onclick="viewOrderDetails('${order.id}')">
                        Ver Detalhes
                    </button>
                    ${this.getOrderActions(order)}
                </div>
            </div>
        `;
    }

    static getStatusText(status) {
        const statusMap = {
            'pending': 'Pendente',
            'confirmed': 'Confirmado',
            'preparing': 'Preparando',
            'ready': 'Pronto',
            'in_delivery': 'Em Entrega',
            'delivered': 'Entregue',
            'cancelled': 'Cancelado'
        };
        return statusMap[status] || status;
    }

    static getOrderActions(order) {
        const userRole = Auth.getUserRole();
        let actions = '';

        if (userRole === 'producer' && order.producerId === AppState.user.id) {
            if (order.status === 'pending') {
                actions += `<button class="btn btn-success" onclick="updateOrderStatus('${order.id}', 'confirmed')">Confirmar</button>`;
            } else if (order.status === 'confirmed') {
                actions += `<button class="btn btn-success" onclick="updateOrderStatus('${order.id}', 'preparing')">Iniciar Preparo</button>`;
            } else if (order.status === 'preparing') {
                actions += `<button class="btn btn-success" onclick="updateOrderStatus('${order.id}', 'ready')">Marcar como Pronto</button>`;
            }
        }

        if (userRole === 'consumer' && order.consumerId === AppState.user.id) {
            if (['pending', 'confirmed'].includes(order.status)) {
                actions += `<button class="btn btn-danger" onclick="cancelOrder('${order.id}')">Cancelar</button>`;
            }
        }

        if (userRole === 'logistics') {
            if (order.status === 'ready' && !order.logisticsId) {
                actions += `<button class="btn btn-primary" onclick="assignLogistics('${order.id}')">Aceitar Entrega</button>`;
            } else if (order.logisticsId === AppState.user.id) {
                if (order.status === 'ready') {
                    actions += `<button class="btn btn-success" onclick="updateOrderStatus('${order.id}', 'in_delivery')">Iniciar Entrega</button>`;
                } else if (order.status === 'in_delivery') {
                    actions += `<button class="btn btn-success" onclick="updateOrderStatus('${order.id}', 'delivered')">Marcar como Entregue</button>`;
                }
            }
        }

        return actions;
    }
}

// Funções globais para interação com pedidos
async function updateOrderStatus(orderId, status) {
    try {
        await ApiClient.put(`/orders/${orderId}/status`, { status });
        UI.showAlert('Status do pedido atualizado com sucesso!', 'success');
        
        // Recarregar a lista de pedidos
        if (typeof loadOrders === 'function') {
            loadOrders();
        }
    } catch (error) {
        UI.showAlert(error.message, 'error');
    }
}

async function cancelOrder(orderId) {
    if (confirm('Tem certeza que deseja cancelar este pedido?')) {
        try {
            await ApiClient.put(`/orders/${orderId}/cancel`);
            UI.showAlert('Pedido cancelado com sucesso!', 'success');
            
            if (typeof loadOrders === 'function') {
                loadOrders();
            }
        } catch (error) {
            UI.showAlert(error.message, 'error');
        }
    }
}

async function assignLogistics(orderId) {
    try {
        await ApiClient.put(`/orders/${orderId}/assign-logistics`);
        UI.showAlert('Entrega aceita com sucesso!', 'success');
        
        if (typeof loadOrders === 'function') {
            loadOrders();
        }
    } catch (error) {
        UI.showAlert(error.message, 'error');
    }
}

function viewOrderDetails(orderId) {
    // Implementar modal ou página de detalhes do pedido
    console.log('Ver detalhes do pedido:', orderId);
}

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', function() {
    // Carregar dados do usuário do localStorage
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
        AppState.user = JSON.parse(savedUser);
    }

    // Atualizar UI do carrinho
    Cart.updateCartUI();

    // Verificar autenticação em páginas protegidas
    const protectedPages = ['producer.html', 'consumer.html', 'logistics.html'];
    const currentPage = window.location.pathname.split('/').pop();
    
    if (protectedPages.includes(currentPage) && !Auth.isAuthenticated()) {
        window.location.href = '/login.html';
    }

    // Adicionar container de alertas se não existir
    if (!document.getElementById('alert-container')) {
        const alertContainer = document.createElement('div');
        alertContainer.id = 'alert-container';
        alertContainer.style.position = 'fixed';
        alertContainer.style.top = '20px';
        alertContainer.style.right = '20px';
        alertContainer.style.zIndex = '9999';
        document.body.appendChild(alertContainer);
    }
});

// Exportar para uso global
window.ApiClient = ApiClient;
window.Auth = Auth;
window.Cart = Cart;
window.UI = UI;



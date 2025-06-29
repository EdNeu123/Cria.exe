const { db } = require('../config/firebase');

/**
 * Modelo de Pedido para interação com Firestore
 * Status possíveis: pending, confirmed, preparing, ready, in_delivery, delivered, cancelled
 */
class Order {
  constructor(data) {
    this.id = data.id || null;
    this.consumerId = data.consumerId;
    this.producerId = data.producerId;
    this.logisticsId = data.logisticsId || null;
    this.items = data.items || []; // Array de OrderItem
    this.totalAmount = data.totalAmount || 0;
    this.status = data.status || 'pending';
    this.deliveryAddress = data.deliveryAddress || {};
    this.deliveryFee = data.deliveryFee || 0;
    this.notes = data.notes || '';
    this.estimatedDeliveryTime = data.estimatedDeliveryTime || null;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.deliveredAt = data.deliveredAt || null;
  }

  /**
   * Salvar pedido no Firestore
   */
  async save() {
    try {
      const orderData = {
        consumerId: this.consumerId,
        producerId: this.producerId,
        logisticsId: this.logisticsId,
        items: this.items,
        totalAmount: this.totalAmount,
        status: this.status,
        deliveryAddress: this.deliveryAddress,
        deliveryFee: this.deliveryFee,
        notes: this.notes,
        estimatedDeliveryTime: this.estimatedDeliveryTime,
        createdAt: this.createdAt,
        updatedAt: new Date(),
        deliveredAt: this.deliveredAt
      };

      if (this.id) {
        // Atualizar pedido existente
        await db.collection('orders').doc(this.id).update(orderData);
        return this.id;
      } else {
        // Criar novo pedido
        const docRef = await db.collection('orders').add(orderData);
        this.id = docRef.id;
        return this.id;
      }
    } catch (error) {
      throw new Error(`Erro ao salvar pedido: ${error.message}`);
    }
  }

  /**
   * Buscar pedido por ID
   */
  static async findById(id) {
    try {
      const doc = await db.collection('orders').doc(id).get();
      if (!doc.exists) {
        return null;
      }
      return new Order({ id: doc.id, ...doc.data() });
    } catch (error) {
      throw new Error(`Erro ao buscar pedido por ID: ${error.message}`);
    }
  }

  /**
   * Buscar pedidos por consumidor
   */
  static async findByConsumer(consumerId) {
    try {
      const snapshot = await db.collection('orders')
        .where('consumerId', '==', consumerId)
        .orderBy('createdAt', 'desc')
        .get();
      
      const orders = [];
      snapshot.forEach(doc => {
        orders.push(new Order({ id: doc.id, ...doc.data() }));
      });
      
      return orders;
    } catch (error) {
      throw new Error(`Erro ao buscar pedidos por consumidor: ${error.message}`);
    }
  }

  /**
   * Buscar pedidos por produtor
   */
  static async findByProducer(producerId) {
    try {
      const snapshot = await db.collection('orders')
        .where('producerId', '==', producerId)
        .orderBy('createdAt', 'desc')
        .get();
      
      const orders = [];
      snapshot.forEach(doc => {
        orders.push(new Order({ id: doc.id, ...doc.data() }));
      });
      
      return orders;
    } catch (error) {
      throw new Error(`Erro ao buscar pedidos por produtor: ${error.message}`);
    }
  }

  /**
   * Buscar pedidos por logística
   */
  static async findByLogistics(logisticsId) {
    try {
      const snapshot = await db.collection('orders')
        .where('logisticsId', '==', logisticsId)
        .orderBy('createdAt', 'desc')
        .get();
      
      const orders = [];
      snapshot.forEach(doc => {
        orders.push(new Order({ id: doc.id, ...doc.data() }));
      });
      
      return orders;
    } catch (error) {
      throw new Error(`Erro ao buscar pedidos por logística: ${error.message}`);
    }
  }

  /**
   * Buscar pedidos por status
   */
  static async findByStatus(status) {
    try {
      const snapshot = await db.collection('orders')
        .where('status', '==', status)
        .orderBy('createdAt', 'desc')
        .get();
      
      const orders = [];
      snapshot.forEach(doc => {
        orders.push(new Order({ id: doc.id, ...doc.data() }));
      });
      
      return orders;
    } catch (error) {
      throw new Error(`Erro ao buscar pedidos por status: ${error.message}`);
    }
  }

  /**
   * Buscar pedidos disponíveis para logística
   */
  static async findAvailableForLogistics() {
    try {
      const snapshot = await db.collection('orders')
        .where('status', '==', 'ready')
        .where('logisticsId', '==', null)
        .orderBy('createdAt', 'asc')
        .get();
      
      const orders = [];
      snapshot.forEach(doc => {
        orders.push(new Order({ id: doc.id, ...doc.data() }));
      });
      
      return orders;
    } catch (error) {
      throw new Error(`Erro ao buscar pedidos disponíveis para logística: ${error.message}`);
    }
  }

  /**
   * Atualizar status do pedido
   */
  async updateStatus(newStatus) {
    try {
      const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'in_delivery', 'delivered', 'cancelled'];
      
      if (!validStatuses.includes(newStatus)) {
        throw new Error('Status inválido');
      }

      this.status = newStatus;
      this.updatedAt = new Date();
      
      // Se o pedido foi entregue, marcar data de entrega
      if (newStatus === 'delivered') {
        this.deliveredAt = new Date();
      }
      
      await db.collection('orders').doc(this.id).update({
        status: this.status,
        updatedAt: this.updatedAt,
        deliveredAt: this.deliveredAt
      });
      
      return true;
    } catch (error) {
      throw new Error(`Erro ao atualizar status: ${error.message}`);
    }
  }

  /**
   * Atribuir logística ao pedido
   */
  async assignLogistics(logisticsId) {
    try {
      this.logisticsId = logisticsId;
      this.updatedAt = new Date();
      
      await db.collection('orders').doc(this.id).update({
        logisticsId: this.logisticsId,
        updatedAt: this.updatedAt
      });
      
      return true;
    } catch (error) {
      throw new Error(`Erro ao atribuir logística: ${error.message}`);
    }
  }

  /**
   * Calcular total do pedido
   */
  calculateTotal() {
    try {
      let itemsTotal = 0;
      
      this.items.forEach(item => {
        itemsTotal += item.price * item.quantity;
      });
      
      this.totalAmount = itemsTotal + this.deliveryFee;
      return this.totalAmount;
    } catch (error) {
      throw new Error(`Erro ao calcular total: ${error.message}`);
    }
  }

  /**
   * Adicionar item ao pedido
   */
  addItem(productId, productName, price, quantity, unit) {
    try {
      const existingItemIndex = this.items.findIndex(item => item.productId === productId);
      
      if (existingItemIndex >= 0) {
        // Se o item já existe, atualizar quantidade
        this.items[existingItemIndex].quantity += quantity;
      } else {
        // Adicionar novo item
        this.items.push({
          productId,
          productName,
          price,
          quantity,
          unit,
          subtotal: price * quantity
        });
      }
      
      this.calculateTotal();
      return true;
    } catch (error) {
      throw new Error(`Erro ao adicionar item: ${error.message}`);
    }
  }

  /**
   * Remover item do pedido
   */
  removeItem(productId) {
    try {
      this.items = this.items.filter(item => item.productId !== productId);
      this.calculateTotal();
      return true;
    } catch (error) {
      throw new Error(`Erro ao remover item: ${error.message}`);
    }
  }

  /**
   * Atualizar quantidade de um item
   */
  updateItemQuantity(productId, newQuantity) {
    try {
      const itemIndex = this.items.findIndex(item => item.productId === productId);
      
      if (itemIndex >= 0) {
        if (newQuantity <= 0) {
          this.removeItem(productId);
        } else {
          this.items[itemIndex].quantity = newQuantity;
          this.items[itemIndex].subtotal = this.items[itemIndex].price * newQuantity;
          this.calculateTotal();
        }
        return true;
      }
      
      throw new Error('Item não encontrado no pedido');
    } catch (error) {
      throw new Error(`Erro ao atualizar quantidade: ${error.message}`);
    }
  }

  /**
   * Cancelar pedido
   */
  async cancel() {
    try {
      if (this.status === 'delivered') {
        throw new Error('Não é possível cancelar um pedido já entregue');
      }
      
      if (this.status === 'cancelled') {
        throw new Error('Pedido já está cancelado');
      }
      
      await this.updateStatus('cancelled');
      return true;
    } catch (error) {
      throw new Error(`Erro ao cancelar pedido: ${error.message}`);
    }
  }

  /**
   * Obter estatísticas de pedidos por período
   */
  static async getStatistics(startDate, endDate) {
    try {
      const snapshot = await db.collection('orders')
        .where('createdAt', '>=', startDate)
        .where('createdAt', '<=', endDate)
        .get();
      
      const stats = {
        total: 0,
        pending: 0,
        confirmed: 0,
        preparing: 0,
        ready: 0,
        in_delivery: 0,
        delivered: 0,
        cancelled: 0,
        totalRevenue: 0
      };
      
      snapshot.forEach(doc => {
        const order = doc.data();
        stats.total++;
        stats[order.status]++;
        
        if (order.status === 'delivered') {
          stats.totalRevenue += order.totalAmount;
        }
      });
      
      return stats;
    } catch (error) {
      throw new Error(`Erro ao obter estatísticas: ${error.message}`);
    }
  }
}

module.exports = Order;


const Order = require('../models/Order');
const Product = require('../models/Product');
const { validateOrderData } = require('../utils/validation');

/**
 * Controller de Pedidos
 * Gerencia todo o fluxo de pedidos entre consumidores, produtores e logística
 */

/**
 * Criar novo pedido (apenas consumidores)
 */
const createOrder = async (req, res) => {
  try {
    const { producerId, items, deliveryAddress, deliveryFee, notes } = req.body;
    const consumerId = req.user.id;

    // Validar dados básicos do pedido
    const orderData = {
      consumerId,
      producerId,
      items,
      deliveryAddress,
      deliveryFee: parseFloat(deliveryFee) || 0,
      notes
    };

    const validation = validateOrderData(orderData);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validation.errors
      });
    }

    // Verificar disponibilidade e estoque dos produtos
    const processedItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Produto ${item.productId} não encontrado`
        });
      }

      if (!product.isAvailable) {
        return res.status(400).json({
          success: false,
          message: `Produto ${product.name} não está disponível`
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Estoque insuficiente para ${product.name}. Disponível: ${product.stock}`
        });
      }

      if (product.producerId !== producerId) {
        return res.status(400).json({
          success: false,
          message: `Produto ${product.name} não pertence ao produtor selecionado`
        });
      }

      // Adicionar item processado
      const processedItem = {
        productId: product.id,
        productName: product.name,
        price: product.price,
        quantity: item.quantity,
        unit: product.unit,
        subtotal: product.price * item.quantity
      };

      processedItems.push(processedItem);
      totalAmount += processedItem.subtotal;
    }

    // Criar pedido
    const order = new Order({
      consumerId,
      producerId,
      items: processedItems,
      totalAmount: totalAmount + orderData.deliveryFee,
      deliveryAddress,
      deliveryFee: orderData.deliveryFee,
      notes,
      status: 'pending'
    });

    const orderId = await order.save();

    // Reduzir estoque dos produtos
    for (const item of processedItems) {
      const product = await Product.findById(item.productId);
      await product.reduceStock(item.quantity);
    }

    // Buscar pedido criado
    const createdOrder = await Order.findById(orderId);

    res.status(201).json({
      success: true,
      message: 'Pedido criado com sucesso',
      data: {
        order: createdOrder
      }
    });
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};

/**
 * Listar pedidos do usuário autenticado
 */
const getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    let orders;

    switch (userRole) {
      case 'consumer':
        orders = await Order.findByConsumer(userId);
        break;
      case 'producer':
        orders = await Order.findByProducer(userId);
        break;
      case 'logistics':
        orders = await Order.findByLogistics(userId);
        break;
      default:
        return res.status(403).json({
          success: false,
          message: 'Tipo de usuário inválido'
        });
    }

    res.json({
      success: true,
      data: {
        orders,
        total: orders.length
      }
    });
  } catch (error) {
    console.error('Erro ao listar pedidos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};

/**
 * Obter pedido por ID
 */
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pedido não encontrado'
      });
    }

    // Verificar se o usuário tem acesso ao pedido
    const hasAccess = 
      order.consumerId === userId ||
      order.producerId === userId ||
      order.logisticsId === userId;

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado a este pedido'
      });
    }

    res.json({
      success: true,
      data: {
        order
      }
    });
  } catch (error) {
    console.error('Erro ao buscar pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};

/**
 * Atualizar status do pedido
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status é obrigatório'
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pedido não encontrado'
      });
    }

    // Verificar permissões baseadas no role e status
    let canUpdate = false;
    
    switch (userRole) {
      case 'producer':
        // Produtor pode confirmar, preparar e marcar como pronto
        if (order.producerId === userId) {
          canUpdate = ['confirmed', 'preparing', 'ready'].includes(status);
        }
        break;
      case 'logistics':
        // Logística pode marcar como em entrega e entregue
        if (order.logisticsId === userId) {
          canUpdate = ['in_delivery', 'delivered'].includes(status);
        }
        break;
      case 'consumer':
        // Consumidor pode cancelar pedidos pendentes
        if (order.consumerId === userId) {
          canUpdate = status === 'cancelled' && order.status === 'pending';
        }
        break;
    }

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        message: 'Você não tem permissão para alterar este status'
      });
    }

    // Atualizar status
    await order.updateStatus(status);

    // Se cancelado, devolver estoque
    if (status === 'cancelled') {
      for (const item of order.items) {
        const product = await Product.findById(item.productId);
        if (product) {
          await product.increaseStock(item.quantity);
        }
      }
    }

    res.json({
      success: true,
      message: 'Status do pedido atualizado com sucesso',
      data: {
        orderId: id,
        newStatus: status
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};

/**
 * Atribuir logística ao pedido (apenas logística)
 */
const assignLogistics = async (req, res) => {
  try {
    const { id } = req.params;
    const logisticsId = req.user.id;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pedido não encontrado'
      });
    }

    // Verificar se pedido está pronto para entrega
    if (order.status !== 'ready') {
      return res.status(400).json({
        success: false,
        message: 'Pedido deve estar com status "ready" para ser atribuído'
      });
    }

    // Verificar se já não tem logística atribuída
    if (order.logisticsId) {
      return res.status(400).json({
        success: false,
        message: 'Pedido já tem logística atribuída'
      });
    }

    // Atribuir logística
    await order.assignLogistics(logisticsId);

    res.json({
      success: true,
      message: 'Logística atribuída ao pedido com sucesso',
      data: {
        orderId: id,
        logisticsId
      }
    });
  } catch (error) {
    console.error('Erro ao atribuir logística:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};

/**
 * Listar pedidos disponíveis para logística
 */
const getAvailableOrdersForLogistics = async (req, res) => {
  try {
    const orders = await Order.findAvailableForLogistics();

    res.json({
      success: true,
      data: {
        orders,
        total: orders.length
      }
    });
  } catch (error) {
    console.error('Erro ao listar pedidos disponíveis:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};

/**
 * Cancelar pedido
 */
const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pedido não encontrado'
      });
    }

    // Verificar permissões para cancelar
    let canCancel = false;
    
    if (userRole === 'consumer' && order.consumerId === userId) {
      // Consumidor pode cancelar pedidos pendentes ou confirmados
      canCancel = ['pending', 'confirmed'].includes(order.status);
    } else if (userRole === 'producer' && order.producerId === userId) {
      // Produtor pode cancelar pedidos pendentes
      canCancel = order.status === 'pending';
    }

    if (!canCancel) {
      return res.status(403).json({
        success: false,
        message: 'Não é possível cancelar este pedido no status atual'
      });
    }

    // Cancelar pedido
    await order.cancel();

    // Devolver estoque
    for (const item of order.items) {
      const product = await Product.findById(item.productId);
      if (product) {
        await product.increaseStock(item.quantity);
      }
    }

    res.json({
      success: true,
      message: 'Pedido cancelado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao cancelar pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};

/**
 * Obter estatísticas de pedidos (para produtores)
 */
const getOrderStatistics = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole !== 'producer') {
      return res.status(403).json({
        success: false,
        message: 'Apenas produtores podem acessar estatísticas'
      });
    }

    // Calcular período (últimos 30 dias)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    // Buscar pedidos do produtor no período
    const allOrders = await Order.findByProducer(userId);
    const periodOrders = allOrders.filter(order => 
      order.createdAt >= startDate && order.createdAt <= endDate
    );

    // Calcular estatísticas
    const stats = {
      total: periodOrders.length,
      pending: 0,
      confirmed: 0,
      preparing: 0,
      ready: 0,
      in_delivery: 0,
      delivered: 0,
      cancelled: 0,
      totalRevenue: 0
    };

    periodOrders.forEach(order => {
      stats[order.status]++;
      if (order.status === 'delivered') {
        stats.totalRevenue += order.totalAmount;
      }
    });

    res.json({
      success: true,
      data: {
        statistics: stats,
        period: {
          startDate,
          endDate
        }
      }
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  assignLogistics,
  getAvailableOrdersForLogistics,
  cancelOrder,
  getOrderStatistics
};


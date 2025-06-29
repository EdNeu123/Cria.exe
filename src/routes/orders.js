const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticateToken, requireConsumer, requireLogistics, requireProducer } = require('../middleware/auth');

/**
 * Rotas de Pedidos
 * /api/orders/*
 */

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Listar meus pedidos
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de pedidos do usuário
 *       401:
 *         description: Token inválido
 */
router.get('/', authenticateToken, orderController.getMyOrders);

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Criar novo pedido (apenas consumidores)
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - producerId
 *               - items
 *               - deliveryAddress
 *             properties:
 *               producerId:
 *                 type: string
 *                 example: "producer123"
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                       example: "product123"
 *                     quantity:
 *                       type: integer
 *                       example: 2
 *               deliveryAddress:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                     example: "Rua das Flores, 123"
 *                   neighborhood:
 *                     type: string
 *                     example: "Centro"
 *                   city:
 *                     type: string
 *                     example: "São Paulo"
 *                   state:
 *                     type: string
 *                     example: "SP"
 *                   zipCode:
 *                     type: string
 *                     example: "01234-567"
 *               deliveryFee:
 *                 type: number
 *                 example: 5.00
 *               notes:
 *                 type: string
 *                 example: "Entregar pela manhã"
 *     responses:
 *       201:
 *         description: Pedido criado com sucesso
 *       400:
 *         description: Dados inválidos
 *       403:
 *         description: Acesso negado
 */
router.post('/', authenticateToken, requireConsumer, orderController.createOrder);

/**
 * @swagger
 * /api/orders/available-for-logistics:
 *   get:
 *     summary: Listar pedidos disponíveis para logística
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de pedidos disponíveis
 *       403:
 *         description: Acesso negado
 */
router.get('/available-for-logistics', authenticateToken, requireLogistics, orderController.getAvailableOrdersForLogistics);

/**
 * @swagger
 * /api/orders/statistics:
 *   get:
 *     summary: Obter estatísticas de pedidos (apenas produtores)
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estatísticas de pedidos
 *       403:
 *         description: Acesso negado
 */
router.get('/statistics', authenticateToken, requireProducer, orderController.getOrderStatistics);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Obter pedido por ID
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do pedido
 *     responses:
 *       200:
 *         description: Dados do pedido
 *       403:
 *         description: Acesso negado
 *       404:
 *         description: Pedido não encontrado
 */
router.get('/:id', authenticateToken, orderController.getOrderById);

/**
 * @swagger
 * /api/orders/{id}/status:
 *   put:
 *     summary: Atualizar status do pedido
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do pedido
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, preparing, ready, in_delivery, delivered, cancelled]
 *                 example: "confirmed"
 *     responses:
 *       200:
 *         description: Status atualizado com sucesso
 *       403:
 *         description: Acesso negado
 *       404:
 *         description: Pedido não encontrado
 */
router.put('/:id/status', authenticateToken, orderController.updateOrderStatus);

/**
 * @swagger
 * /api/orders/{id}/assign-logistics:
 *   put:
 *     summary: Atribuir logística ao pedido
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do pedido
 *     responses:
 *       200:
 *         description: Logística atribuída com sucesso
 *       400:
 *         description: Pedido não está pronto para entrega
 *       403:
 *         description: Acesso negado
 *       404:
 *         description: Pedido não encontrado
 */
router.put('/:id/assign-logistics', authenticateToken, requireLogistics, orderController.assignLogistics);

/**
 * @swagger
 * /api/orders/{id}/cancel:
 *   put:
 *     summary: Cancelar pedido
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do pedido
 *     responses:
 *       200:
 *         description: Pedido cancelado com sucesso
 *       403:
 *         description: Não é possível cancelar este pedido
 *       404:
 *         description: Pedido não encontrado
 */
router.put('/:id/cancel', authenticateToken, orderController.cancelOrder);

module.exports = router;


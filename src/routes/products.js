const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticateToken, requireProducer } = require('../middleware/auth');

/**
 * Rotas de Produtos
 * /api/products/*
 */

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Listar produtos disponíveis
 *     tags: [Produtos]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filtrar por categoria
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nome do produto
 *     responses:
 *       200:
 *         description: Lista de produtos disponíveis
 */
router.get('/', productController.getAvailableProducts);

/**
 * @swagger
 * /api/products/categories:
 *   get:
 *     summary: Obter categorias de produtos
 *     tags: [Produtos]
 *     responses:
 *       200:
 *         description: Lista de categorias
 */
router.get('/categories', productController.getCategories);

/**
 * @swagger
 * /api/products/my:
 *   get:
 *     summary: Listar meus produtos (apenas produtores)
 *     tags: [Produtos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de produtos do produtor
 *       403:
 *         description: Acesso negado
 */
router.get('/my', authenticateToken, requireProducer, productController.getMyProducts);

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Criar novo produto (apenas produtores)
 *     tags: [Produtos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - price
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Tomate Orgânico"
 *               description:
 *                 type: string
 *                 example: "Tomates frescos cultivados sem agrotóxicos"
 *               price:
 *                 type: number
 *                 example: 8.50
 *               category:
 *                 type: string
 *                 example: "Verduras"
 *               imageUrl:
 *                 type: string
 *                 example: "https://example.com/tomate.jpg"
 *               stock:
 *                 type: integer
 *                 example: 50
 *               unit:
 *                 type: string
 *                 example: "kg"
 *     responses:
 *       201:
 *         description: Produto criado com sucesso
 *       400:
 *         description: Dados inválidos
 *       403:
 *         description: Acesso negado
 */
router.post('/', authenticateToken, requireProducer, productController.createProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Obter produto por ID
 *     tags: [Produtos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do produto
 *     responses:
 *       200:
 *         description: Dados do produto
 *       404:
 *         description: Produto não encontrado
 */
router.get('/:id', productController.getProductById);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Atualizar produto (apenas o próprio produtor)
 *     tags: [Produtos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do produto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               category:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *               stock:
 *                 type: integer
 *               unit:
 *                 type: string
 *               isAvailable:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Produto atualizado com sucesso
 *       403:
 *         description: Acesso negado
 *       404:
 *         description: Produto não encontrado
 */
router.put('/:id', authenticateToken, requireProducer, productController.updateProduct);

/**
 * @swagger
 * /api/products/{id}/stock:
 *   put:
 *     summary: Atualizar estoque do produto
 *     tags: [Produtos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do produto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - stock
 *             properties:
 *               stock:
 *                 type: integer
 *                 example: 25
 *     responses:
 *       200:
 *         description: Estoque atualizado com sucesso
 *       403:
 *         description: Acesso negado
 *       404:
 *         description: Produto não encontrado
 */
router.put('/:id/stock', authenticateToken, requireProducer, productController.updateStock);

/**
 * @swagger
 * /api/products/{id}/toggle-availability:
 *   put:
 *     summary: Alterar disponibilidade do produto
 *     tags: [Produtos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do produto
 *     responses:
 *       200:
 *         description: Disponibilidade alterada com sucesso
 *       403:
 *         description: Acesso negado
 *       404:
 *         description: Produto não encontrado
 */
router.put('/:id/toggle-availability', authenticateToken, requireProducer, productController.toggleAvailability);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Deletar produto (apenas o próprio produtor)
 *     tags: [Produtos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do produto
 *     responses:
 *       200:
 *         description: Produto deletado com sucesso
 *       403:
 *         description: Acesso negado
 *       404:
 *         description: Produto não encontrado
 */
router.delete('/:id', authenticateToken, requireProducer, productController.deleteProduct);

module.exports = router;


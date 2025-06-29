const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

/**
 * Rotas de Autenticação
 * /api/auth/*
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registrar novo usuário
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *               - role
 *             properties:
 *               username:
 *                 type: string
 *                 example: "João Silva"
 *               email:
 *                 type: string
 *                 example: "joao@email.com"
 *               password:
 *                 type: string
 *                 example: "123456"
 *               role:
 *                 type: string
 *                 enum: [producer, consumer, logistics]
 *                 example: "consumer"
 *               profile:
 *                 type: object
 *                 example: {"phone": "(11) 99999-9999"}
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *       400:
 *         description: Dados inválidos
 *       409:
 *         description: Email já está em uso
 */
router.post('/register', authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login de usuário
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: "joao@email.com"
 *               password:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *       401:
 *         description: Credenciais inválidas
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Obter perfil do usuário autenticado
 *     tags: [Autenticação]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil do usuário
 *       401:
 *         description: Token inválido
 */
router.get('/profile', authenticateToken, authController.getProfile);

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: Atualizar perfil do usuário
 *     tags: [Autenticação]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: "João Silva Santos"
 *               profile:
 *                 type: object
 *                 example: {"phone": "(11) 88888-8888", "address": "Rua Nova, 123"}
 *     responses:
 *       200:
 *         description: Perfil atualizado com sucesso
 *       401:
 *         description: Token inválido
 */
router.put('/profile', authenticateToken, authController.updateProfile);

/**
 * @swagger
 * /api/auth/change-password:
 *   put:
 *     summary: Alterar senha do usuário
 *     tags: [Autenticação]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: "123456"
 *               newPassword:
 *                 type: string
 *                 example: "novaSenha123"
 *     responses:
 *       200:
 *         description: Senha alterada com sucesso
 *       401:
 *         description: Senha atual incorreta
 */
router.put('/change-password', authenticateToken, authController.changePassword);

/**
 * @swagger
 * /api/auth/deactivate:
 *   delete:
 *     summary: Desativar conta do usuário
 *     tags: [Autenticação]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Conta desativada com sucesso
 *       401:
 *         description: Token inválido
 */
router.delete('/deactivate', authenticateToken, authController.deactivateAccount);

module.exports = router;


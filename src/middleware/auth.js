const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

/**
 * Middleware de autenticação JWT
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de acesso requerido'
      });
    }

    // Verificar e decodificar o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar usuário no banco de dados
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não encontrado ou inativo'
      });
    }

    // Adicionar usuário ao request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({
        success: false,
        message: 'Token inválido'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({
        success: false,
        message: 'Token expirado'
      });
    }

    console.error('Erro na autenticação:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Middleware para verificar role específico
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Permissão insuficiente.'
      });
    }

    next();
  };
};

/**
 * Middleware para verificar se é produtor
 */
const requireProducer = requireRole(['producer']);

/**
 * Middleware para verificar se é consumidor
 */
const requireConsumer = requireRole(['consumer']);

/**
 * Middleware para verificar se é logística
 */
const requireLogistics = requireRole(['logistics']);

/**
 * Middleware para verificar se é produtor ou logística
 */
const requireProducerOrLogistics = requireRole(['producer', 'logistics']);

/**
 * Gerar token JWT
 */
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

module.exports = {
  authenticateToken,
  requireRole,
  requireProducer,
  requireConsumer,
  requireLogistics,
  requireProducerOrLogistics,
  generateToken
};


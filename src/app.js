const express = require('express');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
require('dotenv').config();

// Importar rotas
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');

// Criar aplicação Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globais
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS - Permitir requisições de qualquer origem
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, '../public')));

// Configuração do Swagger
const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Delivery App API',
    version: '1.0.0',
    description: 'API para aplicativo de entregas com Node.js, Express e Firebase Firestore',
    contact: {
      name: 'Equipe de Desenvolvimento',
      email: 'dev@deliveryapp.com'
    }
  },
  servers: [
    {
      url: `http://localhost:${PORT}`,
      description: 'Servidor de desenvolvimento'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  },
  tags: [
    {
      name: 'Autenticação',
      description: 'Endpoints de autenticação e gerenciamento de usuários'
    },
    {
      name: 'Produtos',
      description: 'Endpoints de gerenciamento de produtos'
    },
    {
      name: 'Pedidos',
      description: 'Endpoints de gerenciamento de pedidos'
    }
  ]
};

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// Documentação Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Rota de status da API
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    message: 'Delivery App API está funcionando!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Rota principal - redirecionar para a página inicial
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Middleware de tratamento de erros 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint não encontrado',
    path: req.originalUrl
  });
});

// Middleware de tratamento de erros globais
app.use((error, req, res, next) => {
  console.error('Erro não tratado:', error);
  
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Algo deu errado'
  });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📱 Aplicação: http://localhost:${PORT}`);
  console.log(`📚 Documentação API: http://localhost:${PORT}/api-docs`);
  console.log(`🔍 Status API: http://localhost:${PORT}/api/status`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;


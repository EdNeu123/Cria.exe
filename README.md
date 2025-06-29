# Delivery App - Sistema de Entregas Local

Um aplicativo web completo para conectar produtores locais, consumidores e entregadores, desenvolvido com Node.js, Express e Firebase Firestore.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Arquitetura](#arquitetura)
- [Funcionalidades](#funcionalidades)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Execução](#execução)
- [API Documentation](#api-documentation)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Modelos de Dados](#modelos-de-dados)
- [Autenticação](#autenticação)
- [Testes](#testes)
- [Deploy](#deploy)
- [Contribuição](#contribuição)

## 🎯 Visão Geral

O Delivery App é uma plataforma que conecta três tipos de usuários:

- **Produtores**: Cadastram e gerenciam seus produtos, recebem e processam pedidos
- **Consumidores**: Navegam pelos produtos, fazem pedidos e acompanham entregas
- **Entregadores**: Aceitam entregas e fazem a logística entre produtores e consumidores

### Fluxo Principal

1. **Cadastro**: Usuários se registram escolhendo seu tipo (produtor, consumidor ou entregador)
2. **Produtos**: Produtores cadastram seus produtos com preços e estoque
3. **Pedidos**: Consumidores navegam pelos produtos e fazem pedidos
4. **Processamento**: Produtores confirmam e preparam os pedidos
5. **Entrega**: Entregadores aceitam as entregas e levam aos consumidores

## 🏗️ Arquitetura

### Backend
- **Node.js** com **Express.js** para a API REST
- **Firebase Firestore** como banco de dados NoSQL
- **JWT** para autenticação e autorização
- **bcrypt** para hash de senhas
- **Swagger** para documentação da API

### Frontend
- **HTML5**, **CSS3** e **JavaScript** vanilla
- Design responsivo com CSS Grid e Flexbox
- Interface moderna com gradientes e animações
- Comunicação com API via Fetch API

### Banco de Dados
- **Firebase Firestore** para persistência de dados
- Coleções: users, products, orders
- Índices automáticos e consultas otimizadas

## ✨ Funcionalidades

### Autenticação e Usuários
- [x] Registro de usuários com diferentes roles
- [x] Login com JWT
- [x] Perfis específicos para cada tipo de usuário
- [x] Gerenciamento de perfil
- [x] Alteração de senha
- [x] Desativação de conta

### Produtos (Produtores)
- [x] CRUD completo de produtos
- [x] Gerenciamento de estoque
- [x] Categorização de produtos
- [x] Upload de imagens (preparado)
- [x] Controle de disponibilidade

### Pedidos
- [x] Criação de pedidos pelos consumidores
- [x] Carrinho de compras
- [x] Cálculo automático de totais
- [x] Controle de status do pedido
- [x] Histórico de pedidos
- [x] Cancelamento de pedidos

### Logística
- [x] Atribuição de entregadores
- [x] Rastreamento de entregas
- [x] Status em tempo real
- [x] Histórico de entregas

### Interface
- [x] Design responsivo
- [x] Interface intuitiva
- [x] Feedback visual
- [x] Alertas e notificações
- [x] Loading states

## 🛠️ Tecnologias Utilizadas

### Backend
- **Node.js** v20.18.0
- **Express.js** v4.19.2
- **Firebase Admin SDK** v12.1.0
- **JWT** (jsonwebtoken) v9.0.2
- **bcrypt** v5.1.1
- **Swagger UI Express** v5.0.0
- **dotenv** v16.4.5

### Frontend
- **HTML5** semântico
- **CSS3** com Flexbox e Grid
- **JavaScript ES6+**
- **Fetch API** para requisições

### Ferramentas
- **nodemon** para desenvolvimento
- **Swagger** para documentação da API
- **Git** para controle de versão

## 📋 Pré-requisitos

- **Node.js** v18 ou superior
- **npm** v8 ou superior
- **Conta no Firebase** com projeto configurado
- **Git** (opcional)

## 🚀 Instalação

### 1. Clone o repositório
```bash
git clone <url-do-repositorio>
cd delivery-app-local-nodejs
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações do Firebase.

## ⚙️ Configuração

### Firebase Setup

1. **Crie um projeto no Firebase Console**
   - Acesse [Firebase Console](https://console.firebase.google.com)
   - Clique em "Adicionar projeto"
   - Siga as instruções para criar o projeto

2. **Configure o Firestore**
   - No console do Firebase, vá para "Firestore Database"
   - Clique em "Criar banco de dados"
   - Escolha o modo de produção
   - Selecione uma localização

3. **Gere as credenciais de serviço**
   - Vá para "Configurações do projeto" > "Contas de serviço"
   - Clique em "Gerar nova chave privada"
   - Baixe o arquivo JSON

4. **Configure o arquivo .env**
```env
# Configurações do Firebase
FIREBASE_PROJECT_ID=seu-project-id
FIREBASE_PRIVATE_KEY_ID=sua-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nsua-private-key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=seu-client-email
FIREBASE_CLIENT_ID=seu-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token

# Configurações JWT
JWT_SECRET=sua-chave-secreta-jwt
JWT_EXPIRES_IN=24h

# Configurações do servidor
PORT=3000
NODE_ENV=development
```

### Regras do Firestore

Configure as regras de segurança no Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir acesso autenticado via Admin SDK
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## 🏃‍♂️ Execução

### Desenvolvimento
```bash
npm run dev
```

### Produção
```bash
npm start
```

### Popular dados iniciais
```bash
node src/utils/seedData.js
```

O servidor estará disponível em:
- **Aplicação**: http://localhost:3000
- **API**: http://localhost:3000/api
- **Documentação**: http://localhost:3000/api-docs

## 📚 API Documentation

A documentação completa da API está disponível via Swagger UI em `/api-docs` quando o servidor estiver rodando.

### Endpoints Principais

#### Autenticação
- `POST /api/auth/register` - Registrar usuário
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Obter perfil
- `PUT /api/auth/profile` - Atualizar perfil
- `PUT /api/auth/change-password` - Alterar senha

#### Produtos
- `GET /api/products` - Listar produtos disponíveis
- `GET /api/products/my` - Meus produtos (produtor)
- `POST /api/products` - Criar produto (produtor)
- `PUT /api/products/:id` - Atualizar produto
- `DELETE /api/products/:id` - Deletar produto

#### Pedidos
- `GET /api/orders` - Meus pedidos
- `POST /api/orders` - Criar pedido (consumidor)
- `PUT /api/orders/:id/status` - Atualizar status
- `PUT /api/orders/:id/assign-logistics` - Atribuir entregador

### Autenticação da API

Todas as rotas protegidas requerem o header:
```
Authorization: Bearer <jwt-token>
```

## 📁 Estrutura do Projeto

```
delivery-app-local-nodejs/
├── public/                 # Arquivos estáticos do frontend
│   ├── css/
│   │   └── style.css      # Estilos principais
│   ├── js/
│   │   └── script.js      # JavaScript principal
│   ├── images/            # Imagens da aplicação
│   ├── index.html         # Página inicial
│   ├── login.html         # Página de login
│   ├── register.html      # Página de registro
│   ├── producer.html      # Painel do produtor
│   ├── consumer.html      # Painel do consumidor
│   └── logistics.html     # Painel do entregador
├── src/
│   ├── config/
│   │   └── firebase.js    # Configuração do Firebase
│   ├── controllers/       # Lógica de negócio
│   │   ├── authController.js
│   │   ├── productController.js
│   │   └── orderController.js
│   ├── middleware/        # Middlewares
│   │   └── auth.js        # Autenticação JWT
│   ├── models/            # Modelos de dados
│   │   ├── User.js
│   │   ├── Product.js
│   │   └── Order.js
│   ├── routes/            # Rotas da API
│   │   ├── auth.js
│   │   ├── products.js
│   │   └── orders.js
│   ├── utils/             # Utilitários
│   │   ├── validation.js  # Validações
│   │   └── seedData.js    # Dados iniciais
│   └── app.js             # Arquivo principal
├── .env                   # Variáveis de ambiente
├── package.json           # Dependências
└── README.md             # Documentação
```

## 🗄️ Modelos de Dados

### User (Usuário)
```javascript
{
  id: string,
  username: string,
  email: string,
  password: string (hash),
  role: 'producer' | 'consumer' | 'logistics',
  profile: {
    // Campos específicos por role
  },
  isActive: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Product (Produto)
```javascript
{
  id: string,
  name: string,
  description: string,
  price: number,
  category: string,
  imageUrl: string,
  stock: number,
  unit: string,
  producerId: string,
  isAvailable: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Order (Pedido)
```javascript
{
  id: string,
  consumerId: string,
  producerId: string,
  logisticsId: string,
  items: [{
    productId: string,
    productName: string,
    price: number,
    quantity: number,
    unit: string,
    subtotal: number
  }],
  totalAmount: number,
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'in_delivery' | 'delivered' | 'cancelled',
  deliveryAddress: object,
  deliveryFee: number,
  notes: string,
  createdAt: Date,
  updatedAt: Date,
  deliveredAt: Date
}
```

## 🔐 Autenticação

O sistema utiliza JWT (JSON Web Tokens) para autenticação:

1. **Registro/Login**: Usuário fornece credenciais
2. **Verificação**: Sistema valida e gera JWT
3. **Armazenamento**: Token salvo no localStorage
4. **Requisições**: Token enviado no header Authorization
5. **Validação**: Middleware verifica token em rotas protegidas

### Roles e Permissões

- **Producer**: Gerenciar produtos, visualizar pedidos recebidos
- **Consumer**: Fazer pedidos, visualizar histórico
- **Logistics**: Aceitar entregas, atualizar status de entrega

## 🧪 Testes

### Contas de Teste

O sistema inclui dados de teste que podem ser populados com:

```bash
node src/utils/seedData.js
```

**Credenciais de teste:**
- **Produtor**: joao@fazenda.com / 123456
- **Consumidor**: pedro@email.com / 123456
- **Entregador**: carlos@entrega.com / 123456

### Testando a API

Use ferramentas como Postman ou Insomnia para testar os endpoints:

1. Faça login para obter o token
2. Use o token nas requisições protegidas
3. Teste os diferentes fluxos por role

## 🚀 Deploy

### Preparação para Deploy

1. **Configure variáveis de produção**
```env
NODE_ENV=production
PORT=3000
```

2. **Build da aplicação**
```bash
npm install --production
```

3. **Configure o Firebase para produção**
   - Use credenciais de produção
   - Configure regras de segurança adequadas

### Opções de Deploy

- **Heroku**: Suporte nativo para Node.js
- **Vercel**: Ideal para aplicações full-stack
- **DigitalOcean**: VPS com controle total
- **AWS**: EC2 ou Elastic Beanstalk

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Padrões de Código

- Use ESLint para linting
- Siga as convenções de nomenclatura
- Documente funções complexas
- Escreva testes para novas funcionalidades

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para suporte e dúvidas:
- Abra uma issue no GitHub
- Entre em contato via email: dev@deliveryapp.com

---

**Desenvolvido com ❤️ pela equipe Delivery App**


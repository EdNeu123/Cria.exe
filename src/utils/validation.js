/**
 * Utilitários de validação de dados
 */

/**
 * Validar formato de email
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validar força da senha
 */
function isValidPassword(password) {
  // Mínimo 6 caracteres
  return password && password.length >= 6;
}

/**
 * Validar dados de usuário
 */
function validateUserData(userData) {
  const errors = [];

  if (!userData.username || userData.username.trim().length < 2) {
    errors.push('Nome de usuário deve ter pelo menos 2 caracteres');
  }

  if (!userData.email || !isValidEmail(userData.email)) {
    errors.push('Email inválido');
  }

  if (!userData.password || !isValidPassword(userData.password)) {
    errors.push('Senha deve ter pelo menos 6 caracteres');
  }

  if (!userData.role || !['producer', 'consumer', 'logistics'].includes(userData.role)) {
    errors.push('Tipo de usuário inválido');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validar dados de produto
 */
function validateProductData(productData) {
  const errors = [];

  if (!productData.name || productData.name.trim().length < 2) {
    errors.push('Nome do produto deve ter pelo menos 2 caracteres');
  }

  if (!productData.description || productData.description.trim().length < 10) {
    errors.push('Descrição deve ter pelo menos 10 caracteres');
  }

  if (!productData.price || productData.price <= 0) {
    errors.push('Preço deve ser maior que zero');
  }

  if (!productData.category || productData.category.trim().length < 2) {
    errors.push('Categoria é obrigatória');
  }

  if (productData.stock !== undefined && productData.stock < 0) {
    errors.push('Estoque não pode ser negativo');
  }

  if (!productData.producerId) {
    errors.push('ID do produtor é obrigatório');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validar dados de pedido
 */
function validateOrderData(orderData) {
  const errors = [];

  if (!orderData.consumerId) {
    errors.push('ID do consumidor é obrigatório');
  }

  if (!orderData.producerId) {
    errors.push('ID do produtor é obrigatório');
  }

  if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
    errors.push('Pedido deve ter pelo menos um item');
  }

  if (orderData.items) {
    orderData.items.forEach((item, index) => {
      if (!item.productId) {
        errors.push(`Item ${index + 1}: ID do produto é obrigatório`);
      }
      if (!item.quantity || item.quantity <= 0) {
        errors.push(`Item ${index + 1}: Quantidade deve ser maior que zero`);
      }
      if (!item.price || item.price <= 0) {
        errors.push(`Item ${index + 1}: Preço deve ser maior que zero`);
      }
    });
  }

  if (!orderData.deliveryAddress || !orderData.deliveryAddress.street) {
    errors.push('Endereço de entrega é obrigatório');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Sanitizar string removendo caracteres especiais
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/[<>]/g, '');
}

/**
 * Validar CPF (formato brasileiro)
 */
function isValidCPF(cpf) {
  if (!cpf) return false;
  
  // Remove caracteres não numéricos
  cpf = cpf.replace(/[^\d]/g, '');
  
  // Verifica se tem 11 dígitos
  if (cpf.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  
  // Validação do algoritmo do CPF
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let remainder = 11 - (sum % 11);
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  remainder = 11 - (sum % 11);
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.charAt(10))) return false;
  
  return true;
}

/**
 * Validar telefone brasileiro
 */
function isValidPhone(phone) {
  if (!phone) return false;
  
  // Remove caracteres não numéricos
  phone = phone.replace(/[^\d]/g, '');
  
  // Verifica se tem 10 ou 11 dígitos (com DDD)
  return phone.length === 10 || phone.length === 11;
}

module.exports = {
  isValidEmail,
  isValidPassword,
  validateUserData,
  validateProductData,
  validateOrderData,
  sanitizeString,
  isValidCPF,
  isValidPhone
};


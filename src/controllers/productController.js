const Product = require('../models/Product');
const { validateProductData } = require('../utils/validation');

/**
 * Controller de Produtos
 * Gerencia CRUD de produtos pelos produtores
 */

/**
 * Criar novo produto (apenas produtores)
 */
const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, imageUrl, stock, unit } = req.body;
    const producerId = req.user.id;

    // Validar dados do produto
    const productData = {
      name,
      description,
      price: parseFloat(price),
      category,
      imageUrl,
      stock: parseInt(stock) || 0,
      unit,
      producerId
    };

    const validation = validateProductData(productData);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validation.errors
      });
    }

    // Criar produto
    const product = new Product(productData);
    const productId = await product.save();

    // Buscar produto criado
    const createdProduct = await Product.findById(productId);

    res.status(201).json({
      success: true,
      message: 'Produto criado com sucesso',
      data: {
        product: createdProduct
      }
    });
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};

/**
 * Listar produtos do produtor autenticado
 */
const getMyProducts = async (req, res) => {
  try {
    const producerId = req.user.id;
    const products = await Product.findByProducer(producerId);

    res.json({
      success: true,
      data: {
        products,
        total: products.length
      }
    });
  } catch (error) {
    console.error('Erro ao listar produtos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};

/**
 * Listar todos os produtos disponíveis (para consumidores)
 */
const getAvailableProducts = async (req, res) => {
  try {
    const { category, search } = req.query;

    let products;

    if (search) {
      products = await Product.searchByName(search);
    } else if (category) {
      products = await Product.findByCategory(category);
    } else {
      products = await Product.findAvailable();
    }

    res.json({
      success: true,
      data: {
        products,
        total: products.length
      }
    });
  } catch (error) {
    console.error('Erro ao listar produtos disponíveis:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};

/**
 * Obter produto por ID
 */
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produto não encontrado'
      });
    }

    res.json({
      success: true,
      data: {
        product
      }
    });
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};

/**
 * Atualizar produto (apenas o próprio produtor)
 */
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category, imageUrl, stock, unit, isAvailable } = req.body;
    const producerId = req.user.id;

    // Buscar produto
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produto não encontrado'
      });
    }

    // Verificar se o produto pertence ao produtor
    if (product.producerId !== producerId) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Você só pode editar seus próprios produtos.'
      });
    }

    // Atualizar campos fornecidos
    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = parseFloat(price);
    if (category !== undefined) product.category = category;
    if (imageUrl !== undefined) product.imageUrl = imageUrl;
    if (stock !== undefined) product.stock = parseInt(stock);
    if (unit !== undefined) product.unit = unit;
    if (isAvailable !== undefined) product.isAvailable = Boolean(isAvailable);

    // Validar dados atualizados
    const validation = validateProductData(product);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validation.errors
      });
    }

    // Salvar alterações
    await product.save();

    // Buscar produto atualizado
    const updatedProduct = await Product.findById(id);

    res.json({
      success: true,
      message: 'Produto atualizado com sucesso',
      data: {
        product: updatedProduct
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};

/**
 * Atualizar estoque do produto
 */
const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;
    const producerId = req.user.id;

    if (stock === undefined || stock < 0) {
      return res.status(400).json({
        success: false,
        message: 'Estoque deve ser um número não negativo'
      });
    }

    // Buscar produto
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produto não encontrado'
      });
    }

    // Verificar se o produto pertence ao produtor
    if (product.producerId !== producerId) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Você só pode editar seus próprios produtos.'
      });
    }

    // Atualizar estoque
    await product.updateStock(parseInt(stock));

    res.json({
      success: true,
      message: 'Estoque atualizado com sucesso',
      data: {
        productId: id,
        newStock: parseInt(stock)
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar estoque:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};

/**
 * Alterar disponibilidade do produto
 */
const toggleAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const producerId = req.user.id;

    // Buscar produto
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produto não encontrado'
      });
    }

    // Verificar se o produto pertence ao produtor
    if (product.producerId !== producerId) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Você só pode editar seus próprios produtos.'
      });
    }

    // Alterar disponibilidade
    await product.toggleAvailability();

    res.json({
      success: true,
      message: `Produto ${product.isAvailable ? 'disponibilizado' : 'indisponibilizado'} com sucesso`,
      data: {
        productId: id,
        isAvailable: product.isAvailable
      }
    });
  } catch (error) {
    console.error('Erro ao alterar disponibilidade:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};

/**
 * Deletar produto (apenas o próprio produtor)
 */
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const producerId = req.user.id;

    // Buscar produto
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produto não encontrado'
      });
    }

    // Verificar se o produto pertence ao produtor
    if (product.producerId !== producerId) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Você só pode deletar seus próprios produtos.'
      });
    }

    // Deletar produto
    await product.delete();

    res.json({
      success: true,
      message: 'Produto deletado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar produto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};

/**
 * Obter categorias de produtos
 */
const getCategories = async (req, res) => {
  try {
    const categories = await Product.getCategories();

    res.json({
      success: true,
      data: {
        categories
      }
    });
  } catch (error) {
    console.error('Erro ao obter categorias:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};

module.exports = {
  createProduct,
  getMyProducts,
  getAvailableProducts,
  getProductById,
  updateProduct,
  updateStock,
  toggleAvailability,
  deleteProduct,
  getCategories
};


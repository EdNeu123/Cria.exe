const { db } = require('../config/firebase');

/**
 * Modelo de Produto para interação com Firestore
 * Produtos são criados e gerenciados pelos produtores
 */
class Product {
  constructor(data) {
    this.id = data.id || null;
    this.name = data.name;
    this.description = data.description;
    this.price = data.price;
    this.category = data.category;
    this.imageUrl = data.imageUrl || '';
    this.stock = data.stock || 0;
    this.unit = data.unit || 'unidade'; // kg, litro, unidade, etc.
    this.producerId = data.producerId;
    this.isAvailable = data.isAvailable !== undefined ? data.isAvailable : true;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  /**
   * Salvar produto no Firestore
   */
  async save() {
    try {
      const productData = {
        name: this.name,
        description: this.description,
        price: this.price,
        category: this.category,
        imageUrl: this.imageUrl,
        stock: this.stock,
        unit: this.unit,
        producerId: this.producerId,
        isAvailable: this.isAvailable,
        createdAt: this.createdAt,
        updatedAt: new Date()
      };

      if (this.id) {
        // Atualizar produto existente
        await db.collection('products').doc(this.id).update(productData);
        return this.id;
      } else {
        // Criar novo produto
        const docRef = await db.collection('products').add(productData);
        this.id = docRef.id;
        return this.id;
      }
    } catch (error) {
      throw new Error(`Erro ao salvar produto: ${error.message}`);
    }
  }

  /**
   * Buscar produto por ID
   */
  static async findById(id) {
    try {
      const doc = await db.collection('products').doc(id).get();
      if (!doc.exists) {
        return null;
      }
      return new Product({ id: doc.id, ...doc.data() });
    } catch (error) {
      throw new Error(`Erro ao buscar produto por ID: ${error.message}`);
    }
  }

  /**
   * Buscar produtos por produtor
   */
  static async findByProducer(producerId) {
    try {
      const snapshot = await db.collection('products')
        .where('producerId', '==', producerId)
        .orderBy('createdAt', 'desc')
        .get();
      
      const products = [];
      snapshot.forEach(doc => {
        products.push(new Product({ id: doc.id, ...doc.data() }));
      });
      
      return products;
    } catch (error) {
      throw new Error(`Erro ao buscar produtos por produtor: ${error.message}`);
    }
  }

  /**
   * Buscar produtos disponíveis
   */
  static async findAvailable() {
    try {
      const snapshot = await db.collection('products')
        .where('isAvailable', '==', true)
        .where('stock', '>', 0)
        .orderBy('stock', 'desc')
        .orderBy('createdAt', 'desc')
        .get();
      
      const products = [];
      snapshot.forEach(doc => {
        products.push(new Product({ id: doc.id, ...doc.data() }));
      });
      
      return products;
    } catch (error) {
      throw new Error(`Erro ao buscar produtos disponíveis: ${error.message}`);
    }
  }

  /**
   * Buscar produtos por categoria
   */
  static async findByCategory(category) {
    try {
      const snapshot = await db.collection('products')
        .where('category', '==', category)
        .where('isAvailable', '==', true)
        .where('stock', '>', 0)
        .orderBy('stock', 'desc')
        .get();
      
      const products = [];
      snapshot.forEach(doc => {
        products.push(new Product({ id: doc.id, ...doc.data() }));
      });
      
      return products;
    } catch (error) {
      throw new Error(`Erro ao buscar produtos por categoria: ${error.message}`);
    }
  }

  /**
   * Buscar produtos por nome (busca parcial)
   */
  static async searchByName(searchTerm) {
    try {
      const snapshot = await db.collection('products')
        .where('isAvailable', '==', true)
        .get();
      
      const products = [];
      snapshot.forEach(doc => {
        const product = new Product({ id: doc.id, ...doc.data() });
        if (product.name.toLowerCase().includes(searchTerm.toLowerCase())) {
          products.push(product);
        }
      });
      
      return products;
    } catch (error) {
      throw new Error(`Erro ao buscar produtos por nome: ${error.message}`);
    }
  }

  /**
   * Atualizar estoque do produto
   */
  async updateStock(quantity) {
    try {
      this.stock = quantity;
      this.updatedAt = new Date();
      
      await db.collection('products').doc(this.id).update({
        stock: this.stock,
        updatedAt: this.updatedAt
      });
      
      return true;
    } catch (error) {
      throw new Error(`Erro ao atualizar estoque: ${error.message}`);
    }
  }

  /**
   * Reduzir estoque (usado quando um pedido é feito)
   */
  async reduceStock(quantity) {
    try {
      if (this.stock < quantity) {
        throw new Error('Estoque insuficiente');
      }
      
      this.stock -= quantity;
      this.updatedAt = new Date();
      
      await db.collection('products').doc(this.id).update({
        stock: this.stock,
        updatedAt: this.updatedAt
      });
      
      return true;
    } catch (error) {
      throw new Error(`Erro ao reduzir estoque: ${error.message}`);
    }
  }

  /**
   * Aumentar estoque (usado quando um pedido é cancelado)
   */
  async increaseStock(quantity) {
    try {
      this.stock += quantity;
      this.updatedAt = new Date();
      
      await db.collection('products').doc(this.id).update({
        stock: this.stock,
        updatedAt: this.updatedAt
      });
      
      return true;
    } catch (error) {
      throw new Error(`Erro ao aumentar estoque: ${error.message}`);
    }
  }

  /**
   * Alterar disponibilidade do produto
   */
  async toggleAvailability() {
    try {
      this.isAvailable = !this.isAvailable;
      this.updatedAt = new Date();
      
      await db.collection('products').doc(this.id).update({
        isAvailable: this.isAvailable,
        updatedAt: this.updatedAt
      });
      
      return true;
    } catch (error) {
      throw new Error(`Erro ao alterar disponibilidade: ${error.message}`);
    }
  }

  /**
   * Deletar produto
   */
  async delete() {
    try {
      await db.collection('products').doc(this.id).delete();
      return true;
    } catch (error) {
      throw new Error(`Erro ao deletar produto: ${error.message}`);
    }
  }

  /**
   * Obter categorias únicas de produtos
   */
  static async getCategories() {
    try {
      const snapshot = await db.collection('products')
        .where('isAvailable', '==', true)
        .get();
      
      const categories = new Set();
      snapshot.forEach(doc => {
        const product = doc.data();
        if (product.category) {
          categories.add(product.category);
        }
      });
      
      return Array.from(categories).sort();
    } catch (error) {
      throw new Error(`Erro ao obter categorias: ${error.message}`);
    }
  }
}

module.exports = Product;


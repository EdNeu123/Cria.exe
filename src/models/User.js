const { db } = require('../config/firebase');
const bcrypt = require('bcrypt');

/**
 * Modelo de Usuário para interação com Firestore
 * Tipos de usuário: producer, consumer, logistics
 */
class User {
  constructor(data) {
    this.id = data.id || null;
    this.username = data.username;
    this.email = data.email;
    this.password = data.password;
    this.role = data.role; // producer, consumer, logistics
    this.profile = data.profile || {};
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.isActive = data.isActive !== undefined ? data.isActive : true;
  }

  /**
   * Criar novo usuário no Firestore
   */
  async save() {
    try {
      // Hash da senha antes de salvar
      if (this.password) {
        this.password = await bcrypt.hash(this.password, 10);
      }

      const userData = {
        username: this.username,
        email: this.email,
        password: this.password,
        role: this.role,
        profile: this.profile,
        createdAt: this.createdAt,
        updatedAt: new Date(),
        isActive: this.isActive
      };

      if (this.id) {
        // Atualizar usuário existente
        await db.collection('users').doc(this.id).update(userData);
        return this.id;
      } else {
        // Criar novo usuário
        const docRef = await db.collection('users').add(userData);
        this.id = docRef.id;
        return this.id;
      }
    } catch (error) {
      throw new Error(`Erro ao salvar usuário: ${error.message}`);
    }
  }

  /**
   * Buscar usuário por ID
   */
  static async findById(id) {
    try {
      const doc = await db.collection('users').doc(id).get();
      if (!doc.exists) {
        return null;
      }
      return new User({ id: doc.id, ...doc.data() });
    } catch (error) {
      throw new Error(`Erro ao buscar usuário por ID: ${error.message}`);
    }
  }

  /**
   * Buscar usuário por email
   */
  static async findByEmail(email) {
    try {
      const snapshot = await db.collection('users')
        .where('email', '==', email)
        .limit(1)
        .get();
      
      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return new User({ id: doc.id, ...doc.data() });
    } catch (error) {
      throw new Error(`Erro ao buscar usuário por email: ${error.message}`);
    }
  }

  /**
   * Buscar usuários por tipo/role
   */
  static async findByRole(role) {
    try {
      const snapshot = await db.collection('users')
        .where('role', '==', role)
        .where('isActive', '==', true)
        .get();
      
      const users = [];
      snapshot.forEach(doc => {
        users.push(new User({ id: doc.id, ...doc.data() }));
      });
      
      return users;
    } catch (error) {
      throw new Error(`Erro ao buscar usuários por role: ${error.message}`);
    }
  }

  /**
   * Listar todos os usuários ativos
   */
  static async findAll() {
    try {
      const snapshot = await db.collection('users')
        .where('isActive', '==', true)
        .orderBy('createdAt', 'desc')
        .get();
      
      const users = [];
      snapshot.forEach(doc => {
        users.push(new User({ id: doc.id, ...doc.data() }));
      });
      
      return users;
    } catch (error) {
      throw new Error(`Erro ao listar usuários: ${error.message}`);
    }
  }

  /**
   * Verificar senha
   */
  async verifyPassword(password) {
    try {
      return await bcrypt.compare(password, this.password);
    } catch (error) {
      throw new Error(`Erro ao verificar senha: ${error.message}`);
    }
  }

  /**
   * Atualizar perfil do usuário
   */
  async updateProfile(profileData) {
    try {
      this.profile = { ...this.profile, ...profileData };
      this.updatedAt = new Date();
      
      await db.collection('users').doc(this.id).update({
        profile: this.profile,
        updatedAt: this.updatedAt
      });
      
      return true;
    } catch (error) {
      throw new Error(`Erro ao atualizar perfil: ${error.message}`);
    }
  }

  /**
   * Desativar usuário (soft delete)
   */
  async deactivate() {
    try {
      this.isActive = false;
      this.updatedAt = new Date();
      
      await db.collection('users').doc(this.id).update({
        isActive: this.isActive,
        updatedAt: this.updatedAt
      });
      
      return true;
    } catch (error) {
      throw new Error(`Erro ao desativar usuário: ${error.message}`);
    }
  }

  /**
   * Converter para objeto JSON (sem senha)
   */
  toJSON() {
    const { password, ...userWithoutPassword } = this;
    return userWithoutPassword;
  }
}

module.exports = User;


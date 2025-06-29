const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { validateUserData } = require('../utils/validation');

/**
 * Controller de Autenticação
 * Gerencia login, registro e perfil de usuários
 */

/**
 * Registrar novo usuário
 */
const register = async (req, res) => {
  try {
    const { username, email, password, role, profile } = req.body;

    // Validar dados de entrada
    const validation = validateUserData({ username, email, password, role });
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validation.errors
      });
    }

    // Verificar se email já existe
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email já está em uso'
      });
    }

    // Criar novo usuário
    const user = new User({
      username,
      email,
      password,
      role,
      profile: profile || {}
    });

    const userId = await user.save();

    // Gerar token JWT
    const token = generateToken(userId);

    // Buscar usuário criado (sem senha)
    const createdUser = await User.findById(userId);

    res.status(201).json({
      success: true,
      message: 'Usuário criado com sucesso',
      data: {
        user: createdUser.toJSON(),
        token
      }
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};

/**
 * Login de usuário
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar dados de entrada
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email e senha são obrigatórios'
      });
    }

    // Buscar usuário por email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }

    // Verificar se usuário está ativo
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Conta desativada'
      });
    }

    // Verificar senha
    const isPasswordValid = await user.verifyPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }

    // Gerar token JWT
    const token = generateToken(user.id);

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        user: user.toJSON(),
        token
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};

/**
 * Obter perfil do usuário autenticado
 */
const getProfile = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user.toJSON()
      }
    });
  } catch (error) {
    console.error('Erro ao obter perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};

/**
 * Atualizar perfil do usuário
 */
const updateProfile = async (req, res) => {
  try {
    const { username, profile } = req.body;
    const user = req.user;

    // Atualizar dados básicos se fornecidos
    if (username && username.trim().length >= 2) {
      user.username = username.trim();
    }

    // Atualizar perfil se fornecido
    if (profile && typeof profile === 'object') {
      await user.updateProfile(profile);
    }

    // Salvar alterações básicas
    if (username) {
      await user.save();
    }

    // Buscar usuário atualizado
    const updatedUser = await User.findById(user.id);

    res.json({
      success: true,
      message: 'Perfil atualizado com sucesso',
      data: {
        user: updatedUser.toJSON()
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};

/**
 * Alterar senha do usuário
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = req.user;

    // Validar dados de entrada
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Senha atual e nova senha são obrigatórias'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Nova senha deve ter pelo menos 6 caracteres'
      });
    }

    // Verificar senha atual
    const isCurrentPasswordValid = await user.verifyPassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Senha atual incorreta'
      });
    }

    // Atualizar senha
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Senha alterada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};

/**
 * Desativar conta do usuário
 */
const deactivateAccount = async (req, res) => {
  try {
    const user = req.user;

    await user.deactivate();

    res.json({
      success: true,
      message: 'Conta desativada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao desativar conta:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  deactivateAccount
};


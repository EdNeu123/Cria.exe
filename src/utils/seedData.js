const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

/**
 * Script para popular dados iniciais no Firestore
 * Execute este script para criar usuários, produtos e pedidos de exemplo
 */

async function seedUsers() {
  console.log('Criando usuários de exemplo...');
  
  try {
    // Criar usuários produtores
    const producer1 = new User({
      username: 'João Silva',
      email: 'joao@fazenda.com',
      password: '123456',
      role: 'producer',
      profile: {
        farmName: 'Fazenda São João',
        location: 'São Paulo, SP',
        phone: '(11) 99999-1111',
        description: 'Produtor de frutas e verduras orgânicas'
      }
    });
    await producer1.save();
    console.log('Produtor João Silva criado');

    const producer2 = new User({
      username: 'Maria Santos',
      email: 'maria@horta.com',
      password: '123456',
      role: 'producer',
      profile: {
        farmName: 'Horta da Maria',
        location: 'Minas Gerais, MG',
        phone: '(31) 99999-2222',
        description: 'Especialista em hortaliças e temperos'
      }
    });
    await producer2.save();
    console.log('Produtora Maria Santos criada');

    // Criar usuários consumidores
    const consumer1 = new User({
      username: 'Pedro Oliveira',
      email: 'pedro@email.com',
      password: '123456',
      role: 'consumer',
      profile: {
        phone: '(11) 88888-1111',
        address: {
          street: 'Rua das Flores, 123',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01234-567'
        }
      }
    });
    await consumer1.save();
    console.log('Consumidor Pedro Oliveira criado');

    const consumer2 = new User({
      username: 'Ana Costa',
      email: 'ana@email.com',
      password: '123456',
      role: 'consumer',
      profile: {
        phone: '(11) 88888-2222',
        address: {
          street: 'Av. Paulista, 456',
          neighborhood: 'Bela Vista',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01310-100'
        }
      }
    });
    await consumer2.save();
    console.log('Consumidora Ana Costa criada');

    // Criar usuários de logística
    const logistics1 = new User({
      username: 'Carlos Entregador',
      email: 'carlos@entrega.com',
      password: '123456',
      role: 'logistics',
      profile: {
        vehicleType: 'Moto',
        licensePlate: 'ABC-1234',
        phone: '(11) 77777-1111',
        workingArea: 'São Paulo - Zona Central'
      }
    });
    await logistics1.save();
    console.log('Entregador Carlos criado');

    return {
      producer1: producer1.id,
      producer2: producer2.id,
      consumer1: consumer1.id,
      consumer2: consumer2.id,
      logistics1: logistics1.id
    };
  } catch (error) {
    console.error('Erro ao criar usuários:', error.message);
    throw error;
  }
}

async function seedProducts(userIds) {
  console.log('Criando produtos de exemplo...');
  
  try {
    // Produtos do João (Fazenda São João)
    const products1 = [
      {
        name: 'Tomate Orgânico',
        description: 'Tomates frescos cultivados sem agrotóxicos',
        price: 8.50,
        category: 'Verduras',
        stock: 50,
        unit: 'kg',
        producerId: userIds.producer1
      },
      {
        name: 'Alface Crespa',
        description: 'Alface fresca e crocante',
        price: 3.00,
        category: 'Verduras',
        stock: 30,
        unit: 'unidade',
        producerId: userIds.producer1
      },
      {
        name: 'Banana Prata',
        description: 'Bananas doces e maduras',
        price: 4.50,
        category: 'Frutas',
        stock: 40,
        unit: 'kg',
        producerId: userIds.producer1
      }
    ];

    // Produtos da Maria (Horta da Maria)
    const products2 = [
      {
        name: 'Cenoura Baby',
        description: 'Cenouras pequenas e doces',
        price: 6.00,
        category: 'Verduras',
        stock: 25,
        unit: 'kg',
        producerId: userIds.producer2
      },
      {
        name: 'Manjericão',
        description: 'Manjericão fresco para temperos',
        price: 2.50,
        category: 'Temperos',
        stock: 20,
        unit: 'maço',
        producerId: userIds.producer2
      },
      {
        name: 'Rúcula',
        description: 'Rúcula fresca com sabor marcante',
        price: 4.00,
        category: 'Verduras',
        stock: 15,
        unit: 'maço',
        producerId: userIds.producer2
      }
    ];

    const allProducts = [...products1, ...products2];
    const productIds = [];

    for (const productData of allProducts) {
      const product = new Product(productData);
      const id = await product.save();
      productIds.push(id);
      console.log(`Produto ${productData.name} criado`);
    }

    return productIds;
  } catch (error) {
    console.error('Erro ao criar produtos:', error.message);
    throw error;
  }
}

async function seedOrders(userIds, productIds) {
  console.log('Criando pedidos de exemplo...');
  
  try {
    // Pedido 1: Pedro compra do João
    const order1 = new Order({
      consumerId: userIds.consumer1,
      producerId: userIds.producer1,
      deliveryAddress: {
        street: 'Rua das Flores, 123',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234-567'
      },
      deliveryFee: 5.00,
      notes: 'Entregar pela manhã, se possível'
    });

    order1.addItem(productIds[0], 'Tomate Orgânico', 8.50, 2, 'kg');
    order1.addItem(productIds[1], 'Alface Crespa', 3.00, 3, 'unidade');
    
    await order1.save();
    console.log('Pedido 1 criado');

    // Pedido 2: Ana compra da Maria
    const order2 = new Order({
      consumerId: userIds.consumer2,
      producerId: userIds.producer2,
      deliveryAddress: {
        street: 'Av. Paulista, 456',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01310-100'
      },
      deliveryFee: 7.00,
      notes: 'Apartamento 15B'
    });

    order2.addItem(productIds[3], 'Cenoura Baby', 6.00, 1, 'kg');
    order2.addItem(productIds[4], 'Manjericão', 2.50, 2, 'maço');
    
    await order2.save();
    console.log('Pedido 2 criado');

    return true;
  } catch (error) {
    console.error('Erro ao criar pedidos:', error.message);
    throw error;
  }
}

async function runSeed() {
  try {
    console.log('Iniciando população de dados...');
    
    const userIds = await seedUsers();
    console.log('Usuários criados com sucesso!');
    
    const productIds = await seedProducts(userIds);
    console.log('Produtos criados com sucesso!');
    
    await seedOrders(userIds, productIds);
    console.log('Pedidos criados com sucesso!');
    
    console.log('População de dados concluída!');
    console.log('\nCredenciais de teste:');
    console.log('Produtor: joao@fazenda.com / 123456');
    console.log('Produtor: maria@horta.com / 123456');
    console.log('Consumidor: pedro@email.com / 123456');
    console.log('Consumidor: ana@email.com / 123456');
    console.log('Logística: carlos@entrega.com / 123456');
    
  } catch (error) {
    console.error('Erro na população de dados:', error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  runSeed();
}

module.exports = {
  runSeed,
  seedUsers,
  seedProducts,
  seedOrders
};


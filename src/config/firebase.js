const admin = require('firebase-admin');
require('dotenv').config();

/**
 * Configuração do Firebase Admin SDK
 * Para demonstração, usamos um mock quando as credenciais não são válidas
 */

let db;
let isDemo = false;

try {
  // Verificar se as credenciais são válidas
  if (process.env.FIREBASE_PROJECT_ID === 'delivery-app-test' || 
      !process.env.FIREBASE_PROJECT_ID || 
      process.env.FIREBASE_PRIVATE_KEY.includes('test-private-key')) {
    
    console.log('🔧 Modo demonstração ativado - usando mock do Firestore');
    isDemo = true;
    
    // Mock do Firestore para demonstração
    db = createFirestoreMock();
    
  } else {
    // Configuração real do Firebase
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: process.env.FIREBASE_AUTH_URI,
      token_uri: process.env.FIREBASE_TOKEN_URI,
      auth_provider_x509_cert_url: `https://www.googleapis.com/oauth2/v1/certs`,
      client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
    };

    // Inicializar Firebase Admin
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID
      });
    }

    // Obter instância do Firestore
    db = admin.firestore();
    db.settings({
      timestampsInSnapshots: true
    });
  }
} catch (error) {
  console.log('⚠️  Erro ao conectar com Firebase, usando modo demonstração');
  console.log('   Para usar o Firebase real, configure as credenciais no arquivo .env');
  isDemo = true;
  db = createFirestoreMock();
}

/**
 * Mock do Firestore para demonstração
 */
function createFirestoreMock() {
  const mockData = {
    users: new Map(),
    products: new Map(),
    orders: new Map()
  };

  // Gerar IDs únicos
  function generateId() {
    return Math.random().toString(36).substr(2, 9);
  }

  // Mock de documento
  function createMockDoc(collection, id, data) {
    return {
      id,
      data: () => data,
      exists: true,
      ref: {
        id,
        collection: { id: collection }
      }
    };
  }

  // Mock de coleção
  function createMockCollection(collectionName) {
    return {
      doc: (id) => ({
        get: async () => {
          const data = mockData[collectionName].get(id);
          if (data) {
            return createMockDoc(collectionName, id, data);
          }
          return { exists: false };
        },
        set: async (data) => {
          mockData[collectionName].set(id, { ...data, id });
          return { id };
        },
        update: async (data) => {
          const existing = mockData[collectionName].get(id);
          if (existing) {
            mockData[collectionName].set(id, { ...existing, ...data });
          }
          return { id };
        },
        delete: async () => {
          mockData[collectionName].delete(id);
          return true;
        }
      }),
      add: async (data) => {
        const id = generateId();
        const docData = { ...data, id };
        mockData[collectionName].set(id, docData);
        return { id };
      },
      where: (field, operator, value) => ({
        where: (field2, operator2, value2) => ({
          where: (field3, operator3, value3) => ({
            get: async () => ({
              empty: mockData[collectionName].size === 0,
              docs: Array.from(mockData[collectionName].values())
                .filter(doc => {
                  let match = true;
                  if (field && operator && value !== undefined) {
                    match = match && evaluateCondition(doc[field], operator, value);
                  }
                  if (field2 && operator2 && value2 !== undefined) {
                    match = match && evaluateCondition(doc[field2], operator2, value2);
                  }
                  if (field3 && operator3 && value3 !== undefined) {
                    match = match && evaluateCondition(doc[field3], operator3, value3);
                  }
                  return match;
                })
                .map(data => createMockDoc(collectionName, data.id, data)),
              forEach: function(callback) {
                this.docs.forEach(callback);
              }
            }),
            limit: (num) => ({
              get: async () => ({
                empty: mockData[collectionName].size === 0,
                docs: Array.from(mockData[collectionName].values())
                  .filter(doc => evaluateCondition(doc[field], operator, value))
                  .slice(0, num)
                  .map(data => createMockDoc(collectionName, data.id, data)),
                forEach: function(callback) {
                  this.docs.forEach(callback);
                }
              })
            }),
            orderBy: (field, direction) => ({
              get: async () => ({
                empty: mockData[collectionName].size === 0,
                docs: Array.from(mockData[collectionName].values())
                  .filter(doc => evaluateCondition(doc[field], operator, value))
                  .sort((a, b) => {
                    if (direction === 'desc') {
                      return b[field] > a[field] ? 1 : -1;
                    }
                    return a[field] > b[field] ? 1 : -1;
                  })
                  .map(data => createMockDoc(collectionName, data.id, data)),
                forEach: function(callback) {
                  this.docs.forEach(callback);
                }
              })
            })
          }),
          get: async () => ({
            empty: mockData[collectionName].size === 0,
            docs: Array.from(mockData[collectionName].values())
              .filter(doc => {
                let match = evaluateCondition(doc[field], operator, value);
                if (field2 && operator2 && value2 !== undefined) {
                  match = match && evaluateCondition(doc[field2], operator2, value2);
                }
                return match;
              })
              .map(data => createMockDoc(collectionName, data.id, data)),
            forEach: function(callback) {
              this.docs.forEach(callback);
            }
          }),
          orderBy: (orderField, direction) => ({
            get: async () => ({
              empty: mockData[collectionName].size === 0,
              docs: Array.from(mockData[collectionName].values())
                .filter(doc => {
                  let match = evaluateCondition(doc[field], operator, value);
                  if (field2 && operator2 && value2 !== undefined) {
                    match = match && evaluateCondition(doc[field2], operator2, value2);
                  }
                  return match;
                })
                .sort((a, b) => {
                  if (direction === 'desc') {
                    return b[orderField] > a[orderField] ? 1 : -1;
                  }
                  return a[orderField] > b[orderField] ? 1 : -1;
                })
                .map(data => createMockDoc(collectionName, data.id, data)),
              forEach: function(callback) {
                this.docs.forEach(callback);
              }
            })
          })
        }),
        get: async () => ({
          empty: mockData[collectionName].size === 0,
          docs: Array.from(mockData[collectionName].values())
            .filter(doc => evaluateCondition(doc[field], operator, value))
            .map(data => createMockDoc(collectionName, data.id, data)),
          forEach: function(callback) {
            this.docs.forEach(callback);
          }
        }),
        limit: (num) => ({
          get: async () => ({
            empty: mockData[collectionName].size === 0,
            docs: Array.from(mockData[collectionName].values())
              .filter(doc => evaluateCondition(doc[field], operator, value))
              .slice(0, num)
              .map(data => createMockDoc(collectionName, data.id, data)),
            forEach: function(callback) {
              this.docs.forEach(callback);
            }
          })
        }),
        orderBy: (orderField, direction) => ({
          get: async () => ({
            empty: mockData[collectionName].size === 0,
            docs: Array.from(mockData[collectionName].values())
              .filter(doc => evaluateCondition(doc[field], operator, value))
              .sort((a, b) => {
                if (direction === 'desc') {
                  return b[orderField] > a[orderField] ? 1 : -1;
                }
                return a[orderField] > b[orderField] ? 1 : -1;
              })
              .map(data => createMockDoc(collectionName, data.id, data)),
            forEach: function(callback) {
              this.docs.forEach(callback);
            }
          })
        })
      }),
      orderBy: (field, direction) => ({
        get: async () => ({
          empty: mockData[collectionName].size === 0,
          docs: Array.from(mockData[collectionName].values())
            .sort((a, b) => {
              if (direction === 'desc') {
                return b[field] > a[field] ? 1 : -1;
              }
              return a[field] > b[field] ? 1 : -1;
            })
            .map(data => createMockDoc(collectionName, data.id, data)),
          forEach: function(callback) {
            this.docs.forEach(callback);
          }
        })
      }),
      get: async () => ({
        empty: mockData[collectionName].size === 0,
        docs: Array.from(mockData[collectionName].values())
          .map(data => createMockDoc(collectionName, data.id, data)),
        forEach: function(callback) {
          this.docs.forEach(callback);
        }
      })
    };
  }

  function evaluateCondition(fieldValue, operator, value) {
    switch (operator) {
      case '==': return fieldValue === value;
      case '!=': return fieldValue !== value;
      case '>': return fieldValue > value;
      case '>=': return fieldValue >= value;
      case '<': return fieldValue < value;
      case '<=': return fieldValue <= value;
      default: return true;
    }
  }

  return {
    collection: createMockCollection,
    settings: () => {},
    isDemo: true
  };
}

module.exports = {
  admin: isDemo ? null : admin,
  db,
  isDemo
};


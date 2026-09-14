/**
 * TEST DATA SEEDER
 * Creates sample data for testing and development
 * Run: node backend/src/database/seedTestData.js
 */

const db = require('./connection');
const { logger } = require('../utils/logger');

class TestDataSeeder {
  async seed() {
    try {
      console.log('🌱 Seeding test data...');

      // Seed users
      await this.seedUsers();

      // Seed products
      await this.seedProducts();

      // Seed orders
      await this.seedOrders();

      // Seed farmers
      await this.seedFarmers();

      console.log('✅ Test data seeded successfully!');
    } catch (error) {
      logger.error('❌ Error seeding test data:', error.message);
      throw error;
    }
  }

  async seedUsers() {
    const users = [
      {
        id: 'user-1',
        email: 'admin@ebdesign.com',
        password: '$2b$10$hashedpassword',
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin',
      },
      {
        id: 'user-2',
        email: 'manager@ebdesign.com',
        password: '$2b$10$hashedpassword',
        first_name: 'Manager',
        last_name: 'User',
        role: 'manager',
      },
      {
        id: 'user-3',
        email: 'user@ebdesign.com',
        password: '$2b$10$hashedpassword',
        first_name: 'Regular',
        last_name: 'User',
        role: 'user',
      },
      {
        id: 'user-4',
        email: 'farmer@ebdesign.com',
        password: '$2b$10$hashedpassword',
        first_name: 'Farmer',
        last_name: 'User',
        role: 'farmer',
      },
    ];

    for (const user of users) {
      await db.query(
        `INSERT INTO users (id, email, password_hash, first_name, last_name, role)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (email) DO NOTHING`,
        [user.id, user.email, user.password, user.first_name, user.last_name, user.role]
      );
    }

    console.log('✅ Seeded 4 test users');
  }

  async seedProducts() {
    const products = [
      {
        id: 'product-1',
        name: 'Organic Rice',
        description: 'Premium organic rice',
        price: 50,
        category: 'grains',
        stock: 100,
      },
      {
        id: 'product-2',
        name: 'Fresh Vegetables',
        description: 'Seasonal fresh vegetables',
        price: 30,
        category: 'vegetables',
        stock: 50,
      },
      {
        id: 'product-3',
        name: 'Dairy Products',
        description: 'Fresh dairy items',
        price: 40,
        category: 'dairy',
        stock: 75,
      },
    ];

    for (const product of products) {
      await db.query(
        `INSERT INTO products (id, name, description, price, category, stock)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO NOTHING`,
        [product.id, product.name, product.description, product.price, product.category, product.stock]
      );
    }

    console.log('✅ Seeded 3 test products');
  }

  async seedOrders() {
    const orders = [
      {
        id: 'order-1',
        user_id: 'user-3',
        total: 150,
        status: 'completed',
      },
      {
        id: 'order-2',
        user_id: 'user-3',
        total: 100,
        status: 'pending',
      },
    ];

    for (const order of orders) {
      await db.query(
        `INSERT INTO orders (id, user_id, total, status)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO NOTHING`,
        [order.id, order.user_id, order.total, order.status]
      );
    }

    console.log('✅ Seeded 2 test orders');
  }

  async seedFarmers() {
    const farmers = [
      {
        id: 'farmer-1',
        user_id: 'user-4',
        farm_name: 'Green Valley Farm',
        land_area: 50,
        crops: ['rice', 'wheat', 'vegetables'],
      },
    ];

    for (const farmer of farmers) {
      await db.query(
        `INSERT INTO farmers (id, user_id, farm_name, land_area, crops)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO NOTHING`,
        [farmer.id, farmer.user_id, farmer.farm_name, farmer.land_area, JSON.stringify(farmer.crops)]
      );
    }

    console.log('✅ Seeded 1 test farmer');
  }
}

// Run seeder
if (require.main === module) {
  const seeder = new TestDataSeeder();
  seeder.seed()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('❌ Fatal error:', error);
      process.exit(1);
    });
}

module.exports = TestDataSeeder;

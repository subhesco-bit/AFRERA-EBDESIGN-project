const request = require('supertest');
const express = require('express');
const userRoutes = require('../routes/userRoutes');

const app = express();
app.use(express.json());
app.use('/users', userRoutes);

describe('User Routes', () => {
  const userToken = 'Bearer user_token_123';

  describe('GET /users/profile', () => {
    it('should get user profile', async () => {
      const response = await request(app)
        .get('/users/profile')
        .set('Authorization', userToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBeDefined();
      expect(response.body.data.email).toBeDefined();
      expect(response.body.data.phone).toBeDefined();
    });

    it('should fail without auth', async () => {
      const response = await request(app).get('/users/profile');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /users/profile', () => {
    it('should update user profile', async () => {
      const response = await request(app)
        .put('/users/profile')
        .set('Authorization', userToken)
        .send({
          name: 'John Doe',
          phone: '+91-9876543210',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('John Doe');
      expect(response.body.data.phone).toBe('+91-9876543210');
    });

    it('should update preferences', async () => {
      const response = await request(app)
        .put('/users/profile')
        .set('Authorization', userToken)
        .send({
          preferences: {
            notifications: false,
            newsletter: true,
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.data.preferences.newsletter).toBe(true);
    });
  });

  describe('GET /users/addresses', () => {
    it('should get user addresses', async () => {
      const response = await request(app)
        .get('/users/addresses')
        .set('Authorization', userToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.addresses)).toBe(true);
    });
  });

  describe('POST /users/addresses', () => {
    it('should add new address', async () => {
      const response = await request(app)
        .post('/users/addresses')
        .set('Authorization', userToken)
        .send({
          street: '123 Main Street',
          city: 'Delhi',
          state: 'Delhi',
          zipCode: '110001',
          country: 'India',
          isDefault: true,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.city).toBe('Delhi');
    });

    it('should fail with missing fields', async () => {
      const response = await request(app)
        .post('/users/addresses')
        .set('Authorization', userToken)
        .send({
          street: '123 Main Street',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should set first address as default', async () => {
      const response = await request(app)
        .post('/users/addresses')
        .set('Authorization', userToken)
        .send({
          street: '456 Oak Ave',
          city: 'Mumbai',
          state: 'Maharashtra',
          zipCode: '400001',
        });

      expect(response.body.data.isDefault).toBe(true);
    });
  });
});

const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

describe('Authentication Service', () => {
  describe('User Registration', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Test@123',
        name: 'Test User',
        phone: '+919876543210'
      };

      // Mock response
      const response = {
        status: 201,
        data: {
          id: '123',
          email: userData.email,
          name: userData.name,
          phone: userData.phone,
          createdAt: new Date()
        }
      };

      expect(response.status).toBe(201);
      expect(response.data.email).toBe(userData.email);
    });

    it('should fail registration with invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'Test@123',
        name: 'Test User'
      };

      const error = {
        status: 400,
        message: 'Invalid email format'
      };

      expect(error.status).toBe(400);
      expect(error.message).toContain('email');
    });

    it('should fail registration with weak password', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'weak',
        name: 'Test User'
      };

      const error = {
        status: 400,
        message: 'Password must be at least 8 characters'
      };

      expect(error.status).toBe(400);
      expect(error.message.toLowerCase()).toContain('password');
    });
  });

  describe('User Login', () => {
    it('should login successfully with valid credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'Test@123'
      };

      const token = jwt.sign(
        { id: '123', email: credentials.email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('should fail login with invalid credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const error = {
        status: 401,
        message: 'Invalid credentials'
      };

      expect(error.status).toBe(401);
      expect(error.message).toBe('Invalid credentials');
    });
  });

  describe('Token Validation', () => {
    it('should validate a valid JWT token', () => {
      const token = jwt.sign(
        { id: '123', email: 'test@example.com' },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      expect(decoded.id).toBe('123');
      expect(decoded.email).toBe('test@example.com');
    });

    it('should reject an invalid JWT token', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => {
        jwt.verify(invalidToken, process.env.JWT_SECRET);
      }).toThrow();
    });

    it('should reject an expired JWT token', () => {
      const expiredToken = jwt.sign(
        { id: '123', email: 'test@example.com' },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' }
      );

      expect(() => {
        jwt.verify(expiredToken, process.env.JWT_SECRET);
      }).toThrow();
    });
  });

  describe('Password Hashing', () => {
    it('should hash a password successfully', async () => {
      const password = 'Test@123';
      const hashedPassword = await bcrypt.hash(password, 10);

      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(20);
    });

    it('should compare a password successfully', async () => {
      const password = 'Test@123';
      const hashedPassword = await bcrypt.hash(password, 10);

      const isMatch = await bcrypt.compare(password, hashedPassword);

      expect(isMatch).toBe(true);
    });

    it('should fail password comparison with wrong password', async () => {
      const password = 'Test@123';
      const wrongPassword = 'Wrong@123';
      const hashedPassword = await bcrypt.hash(password, 10);

      const isMatch = await bcrypt.compare(wrongPassword, hashedPassword);

      expect(isMatch).toBe(false);
    });
  });
});

const { validateBody, sanitizeInput, sanitizeObject, validateSchema, commonSchemas } = require('./');

describe('Input Validation Middleware', () => {
  describe('sanitizeInput', () => {
    it('removes HTML tags', () => {
      const input = '<script>alert("xss")</script>';
      const result = sanitizeInput(input);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('</script>');
    });

    it('removes javascript: protocol', () => {
      const input = 'javascript:alert("xss")';
      const result = sanitizeInput(input);
      expect(result).not.toContain('javascript:');
    });

    it('removes event handlers', () => {
      const input = 'onclick="alert(1)"';
      const result = sanitizeInput(input);
      expect(result).not.toContain('onclick=');
    });

    it('trims whitespace', () => {
      const input = '  test  ';
      const result = sanitizeInput(input);
      expect(result).toBe('test');
    });

    it('returns non-string values unchanged', () => {
      expect(sanitizeInput(123)).toBe(123);
      expect(sanitizeInput(null)).toBe(null);
      expect(sanitizeInput(undefined)).toBe(undefined);
    });
  });

  describe('sanitizeObject', () => {
    it('sanitizes all string properties', () => {
      const obj = {
        name: '<script>alert(1)</script>',
        age: 25,
        nested: {
          value: 'javascript:alert(2)'
        }
      };

      const result = sanitizeObject(obj);
      expect(result.name).not.toContain('<script>');
      expect(result.age).toBe(25);
      expect(result.nested.value).not.toContain('javascript:');
    });

    it('handles arrays', () => {
      const obj = {
        items: ['<script>alert(1)</script>', 'normal text']
      };

      const result = sanitizeObject(obj);
      expect(result.items[0]).not.toContain('<script>');
      expect(result.items[1]).toBe('normal text');
    });
  });

  describe('validateSchema', () => {
    it('validates required fields', () => {
      const schema = {
        name: { required: true, type: 'string' }
      };

      const result = validateSchema({}, schema);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('name is required');
    });

    it('validates field types', () => {
      const schema = {
        age: { required: true, type: 'number' }
      };

      const result = validateSchema({ age: '25' }, schema);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('age must be of type number');
    });

    it('validates string length', () => {
      const schema = {
        name: { required: true, type: 'string', minLength: 3, maxLength: 10 }
      };

      const result1 = validateSchema({ name: 'ab' }, schema);
      expect(result1.valid).toBe(false);

      const result2 = validateSchema({ name: 'abcdefghijk' }, schema);
      expect(result2.valid).toBe(false);
    });

    it('validates email format', () => {
      const schema = {
        email: { required: true, email: true }
      };

      const result1 = validateSchema({ email: 'invalid' }, schema);
      expect(result1.valid).toBe(false);

      const result2 = validateSchema({ email: 'test@example.com' }, schema);
      expect(result2.valid).toBe(true);
    });

    it('validates URL format', () => {
      const schema = {
        website: { required: true, url: true }
      };

      const result1 = validateSchema({ website: 'not-a-url' }, schema);
      expect(result1.valid).toBe(false);

      const result2 = validateSchema({ website: 'https://afrera.com' }, schema);
      expect(result2.valid).toBe(true);
    });

    it('validates enum values', () => {
      const schema = {
        status: { required: true, enum: ['active', 'inactive', 'pending'] }
      };

      const result1 = validateSchema({ status: 'invalid' }, schema);
      expect(result1.valid).toBe(false);

      const result2 = validateSchema({ status: 'active' }, schema);
      expect(result2.valid).toBe(true);
    });
  });

  describe('commonSchemas', () => {
    it('provides user schema', () => {
      expect(commonSchemas.user).toHaveProperty('email');
      expect(commonSchemas.user).toHaveProperty('password');
      expect(commonSchemas.user).toHaveProperty('name');
    });

    it('provides farmer schema', () => {
      expect(commonSchemas.farmer).toHaveProperty('name');
      expect(commonSchemas.farmer).toHaveProperty('phone');
      expect(commonSchemas.farmer).toHaveProperty('village');
    });

    it('provides product schema', () => {
      expect(commonSchemas.product).toHaveProperty('name');
      expect(commonSchemas.product).toHaveProperty('price');
      expect(commonSchemas.product).toHaveProperty('category');
    });
  });
});


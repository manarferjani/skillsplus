const UserService = require('../services/user.service');
const service = new UserService();

describe('Email Validation Tests', () => {
  const testCases = [
    { email: "test@example.com", expected: true },
    { email: "test@example..com", expected: false },
    { email: "test@example.c", expected: false },
    { email: "test@sub.example.com", expected: true },
    { email: "test@.com", expected: false }
  ];

  testCases.forEach(({ email, expected }) => {
    it(`should validate ${email} as ${expected}`, () => {
      expect(service.isStrictlyValidEmail(email)).toBe(expected);
    });
  });
});
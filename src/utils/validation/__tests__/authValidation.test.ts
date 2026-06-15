import { loginSchema, otpSchema } from '../authValidation';

describe('sign-in identifier validation', () => {
  it.each([loginSchema, otpSchema])('rejects malformed identifiers in every login mode', async (schema) => {
    await expect(schema.validate({ identifier: 'not-an-email-or-phone', password: 'Password1!' }))
      .rejects.toThrow('Enter valid email or phone');
  });

  it.each([
    ['email', 'buyer@propertyapp.com'],
    ['phone', '9876543210'],
  ])('accepts a valid %s for OTP login', async (_kind, identifier) => {
    await expect(otpSchema.validate({ identifier })).resolves.toEqual({ identifier });
  });
});

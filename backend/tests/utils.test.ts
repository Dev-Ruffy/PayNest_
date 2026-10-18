import { hashValue, compareValue } from '../src/utils/bcrypt.util';
import {
  generateNumericCode,
  generateSharedPassword,
  generateToken,
} from '../src/utils/generateCode.util';
import { ApiError } from '../src/utils/ApiError';

describe('bcrypt.util', () => {
  it('hashes a value and can verify it against the original', async () => {
    const hash = await hashValue('Password123!');
    expect(hash).not.toEqual('Password123!');
    await expect(compareValue('Password123!', hash)).resolves.toBe(true);
    await expect(compareValue('WrongPassword', hash)).resolves.toBe(false);
  });
});

describe('generateCode.util', () => {
  it('generates a 6-digit numeric verification code by default', () => {
    const code = generateNumericCode();
    expect(code).toHaveLength(6);
    expect(/^\d{6}$/.test(code)).toBe(true);
  });

  it('generates a custom-length numeric code', () => {
    expect(generateNumericCode(4)).toHaveLength(4);
  });

  it('generates a human-typable shared housemaster password', () => {
    const password = generateSharedPassword();
    expect(password).toMatch(/^house-[a-z]+-\d{4}$/);
  });

  it('generates a sufficiently long random token', () => {
    const token = generateToken();
    expect(token.length).toBeGreaterThanOrEqual(64);
  });
});

describe('ApiError', () => {
  it('builds the correct status code for each factory method', () => {
    expect(ApiError.badRequest().statusCode).toBe(400);
    expect(ApiError.unauthorized().statusCode).toBe(401);
    expect(ApiError.forbidden().statusCode).toBe(403);
    expect(ApiError.notFound().statusCode).toBe(404);
    expect(ApiError.conflict().statusCode).toBe(409);
    expect(ApiError.tooMany().statusCode).toBe(429);
    expect(ApiError.internal().statusCode).toBe(500);
  });

  it('is flagged as an operational error', () => {
    const err = ApiError.badRequest('Bad input');
    expect(err.isOperational).toBe(true);
    expect(err.message).toBe('Bad input');
  });
});

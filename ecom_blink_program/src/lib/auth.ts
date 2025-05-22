import jwt from 'jsonwebtoken';

export function createToken(payload: { id: number; email: string }) {
  if (!payload || typeof payload !== 'object') {
    throw new TypeError("Payload must be a non-null object");
  }

  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: '7d',
  });
}

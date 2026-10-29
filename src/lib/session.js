import "server-only";
import { SignJWT, jwtVerify } from "jose";

const secretValue = process.env.SESSION_SECRET;

if (!secretValue || secretValue.length < 32) {
  throw new Error(
    "Configure a strong SESSION_SECRET in .env.local"
  );
}

const secret = new TextEncoder().encode(secretValue);

export async function createSession(user) {
  return new SignJWT({ email: user.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifySession(token) {
  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
    });

    return payload;
  } catch {
    return null;
  }
}
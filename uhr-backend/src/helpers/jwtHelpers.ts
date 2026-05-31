
import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import config from "../config";

type TokenType = "access" | "refresh" | "reset";

const tokenConfig = {
  access: {
    secret: config.jwt.accessSecret,
    expiresIn: config.jwt.accessExpiresIn,
  },

  refresh: {
    secret: config.jwt.refreshSecret,
    expiresIn: config.jwt.refreshExpiresIn,
  },

  reset: {
    secret: config.jwt.resetSecret,
    expiresIn: config.jwt.resetExpiresIn,
  },
};

const createToken = (
  payload: Record<string, unknown>,
  type: TokenType
): string => {
  const { secret, expiresIn } = tokenConfig[type];

  return jwt.sign(payload, secret, {
    expiresIn,
  } as SignOptions);
};

const verifyToken = (
  token: string,
  type: TokenType
): JwtPayload => {
  const { secret } = tokenConfig[type];

  return jwt.verify(token, secret) as JwtPayload;
};

export const jwtHelpers = {
  createToken,
  verifyToken,
};
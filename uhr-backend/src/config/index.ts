import dotenv from "dotenv";
import path from "path";

// 1️⃣ Load .env explicitly
dotenv.config({ path: path.join(process.cwd(), ".env") });

// 2️⃣ List all required environment variables
const requiredEnvVars = [
  "NODE_ENV",
  "PORT",
  "DATABASE_URL",
  "ACCESS_TOKEN_SECRET",
  "REFRESH_TOKEN_SECRET",
  "ACCESS_TOKEN_EXPIRES_IN",
  "REFRESH_TOKEN_EXPIRES_IN",
  "RESET_PASS_TOKEN_SECRET",
  "RESET_PASS_TOKEN_EXPIRES_IN",
  "BCRYPT_SALT_ROUNDS",
];

// 3️⃣ Validate that all required variables exist
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar] || process.env[envVar] === "") {
    throw new Error(`Environment variable ${envVar} is not defined`);
  }
}

// 4️⃣ Define the config object with proper types
const config = {
  // Environment
  nodeEnv: process.env.NODE_ENV as "development" | "production" | "test",
  isProduction: process.env.NODE_ENV === "production",
  port: Number(process.env.PORT),

  // Database
  databaseUrl: process.env.DATABASE_URL as string,

  // JWT
  jwt: {
    accessSecret: process.env.ACCESS_TOKEN_SECRET as string,
    refreshSecret: process.env.REFRESH_TOKEN_SECRET as string,

    accessExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN as string,
    refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN as string,

    resetSecret: process.env.RESET_PASS_TOKEN_SECRET as string,
    resetExpiresIn: process.env.RESET_PASS_TOKEN_EXPIRES_IN as string,
  },

  // Password
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS),
};

export default config;

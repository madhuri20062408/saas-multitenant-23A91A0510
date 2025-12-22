// prisma.config.ts
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Read DATABASE_URL from .env here (Prisma 7 way)
    url: env("DATABASE_URL"),
  },
});

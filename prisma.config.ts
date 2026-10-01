import { loadEnvConfig } from "@next/env";
import { defineConfig } from "prisma/config";

// Load .env, .env.local, … exactly the way Next.js does, so the CLI and the app share one DATABASE_URL.
loadEnvConfig(process.cwd());

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: process.env.DATABASE_URL ?? "" },
});

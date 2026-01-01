import 'dotenv/config';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { PrismaClient } from '../generated/prisma/client';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const adapter = new PrismaLibSql({ url: databaseUrl });
const prisma = new PrismaClient({ adapter });

export { prisma };

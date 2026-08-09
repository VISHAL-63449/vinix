import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

export const prisma = new PrismaClient();
export const JWT_SECRET = process.env.JWT_SECRET || 'vinix_super_secret_jwt_key_2026';
export const PORT = process.env.PORT || 5000;

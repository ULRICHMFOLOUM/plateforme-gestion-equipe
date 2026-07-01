import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const users = await prisma.user.findMany();
    return NextResponse.json({ success: true, count: users.length, url: process.env.DATABASE_URL?.substring(0, 20) });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message, stack: error.stack, url: process.env.DATABASE_URL?.substring(0, 20) });
  }
}

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    hasDirect: !!process.env.DIRECT_URL,
    hasDatabase: !!process.env.DATABASE_URL,
    directLen: process.env.DIRECT_URL?.length || 0,
    dbLen: process.env.DATABASE_URL?.length || 0,
    keys: Object.keys(process.env).filter(k => k.includes("URL") || k.includes("DATA")),
  });
}

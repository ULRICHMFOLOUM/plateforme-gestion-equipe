import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Liste des utilisateurs + leurs abonnements (ADMIN seulement)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const search = searchParams.get("search") || "";
  const plan = searchParams.get("plan") || "";

  const where: any = {};
  if (search) {
    where.OR = [
      { email: { contains: search, mode: "insensitive" } },
      { name: { contains: search, mode: "insensitive" } },
    ];
  }
  if (plan) where.plan = plan;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        plan: true,
        subscriptionStatus: true,
        trialEndsAt: true,
        subscriptionEndsAt: true,
        isInternalAccount: true,
        role: true,
        createdAt: true,
        _count: { select: { payments: true, ownedProjects: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({ users, total, page, pages: Math.ceil(total / limit) });
}

// PATCH - Modifier le plan ou isInternalAccount d'un utilisateur
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { userId, plan, isInternalAccount, subscriptionStatus } = await req.json();

  if (!userId) return NextResponse.json({ error: "userId requis" }, { status: 400 });

  const updateData: any = {};
  if (plan !== undefined) updateData.plan = plan;
  if (isInternalAccount !== undefined) updateData.isInternalAccount = isInternalAccount;
  if (subscriptionStatus !== undefined) updateData.subscriptionStatus = subscriptionStatus;

  // Si on donne un compte interne, on lui met aussi le plan ENTERPRISE
  if (isInternalAccount === true) {
    updateData.plan = "ENTERPRISE";
    updateData.subscriptionStatus = "ACTIVE";
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: { id: true, email: true, plan: true, isInternalAccount: true, subscriptionStatus: true },
  });

  return NextResponse.json(updated);
}

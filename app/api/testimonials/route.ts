import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const testimonials = await prisma.testimonial.findMany({
      where: { isApproved: true },
      include: {
        user: { select: { name: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    });

    return NextResponse.json({ testimonials });
  } catch (error) {
    console.error("Erreur témoignages:", error);
    return NextResponse.json({ testimonials: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { content, rating, role, company } = await request.json();

    if (!content || content.length < 10) {
      return NextResponse.json({ error: "Le témoignage doit contenir au moins 10 caractères." }, { status: 400 });
    }

    const testimonial = await prisma.testimonial.create({
      data: {
        userId: session.user.id,
        content,
        rating: Math.min(5, Math.max(1, Number(rating) || 5)),
        role: role || "Membre d'équipe",
        company: company || "Entreprise",
        isApproved: true, // auto approve for logged in users
      },
    });

    return NextResponse.json({
      success: true,
      message: "Merci pour votre témoignage ! Il est maintenant publié.",
      testimonial,
    });
  } catch (error) {
    console.error("Erreur soumission témoignage:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

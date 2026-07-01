import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: {
    id: string; // Project ID
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Verify user has access to project
    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        members: true
      }
    });

    if (!project) {
        return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 });
    }

    const hasAccess = project.ownerId === session.user.id || project.members.some(m => m.userId === session.user.id);
    if (!hasAccess) {
        return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const comments = await prisma.comment.findMany({
      where: { projectId: params.id },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Map user to author for frontend compatibility
    const formattedComments = comments.map(comment => ({
      ...comment,
      author: comment.user
    }));

    return NextResponse.json(formattedComments);
  } catch (error) {
    console.error("Erreur lors de la récupération des commentaires:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { content } = await request.json();

    if (!content) {
      return NextResponse.json({ error: "Le contenu est requis" }, { status: 400 });
    }

    // Verify user has access to project
    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        members: true
      }
    });

    if (!project) {
        return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 });
    }

    const hasAccess = project.ownerId === session.user.id || project.members.some(m => m.userId === session.user.id);
    if (!hasAccess) {
        return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const newComment = await prisma.comment.create({
      data: {
        content,
        projectId: params.id,
        userId: session.user.id,
      },
      include: {
        user: true,
      },
    });

    return NextResponse.json({
      ...newComment,
      author: newComment.user
    }, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création du commentaire:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get("id");

    if (!commentId) {
      return NextResponse.json({ error: "ID du commentaire requis" }, { status: 400 });
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        project: {
          include: {
            members: {
              where: { userId: session.user.id }
            }
          }
        }
      }
    });

    if (!comment) {
      return NextResponse.json({ error: "Commentaire non trouvé" }, { status: 404 });
    }

    // Check permissions: author, owner or manager
    const isAuthor = comment.userId === session.user.id;
    const isOwner = comment.project.ownerId === session.user.id;
    const member = comment.project.members[0];
    const isProjectAdmin = member && (member.role === 'OWNER' || member.role === 'MANAGER' || member.role === 'ADMIN');
    const isGlobalAdmin = session.user.role === 'ADMIN';

    if (!isAuthor && !isOwner && !isProjectAdmin && !isGlobalAdmin) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    await prisma.comment.delete({
      where: { id: commentId }
    });

    return NextResponse.json({ message: "Commentaire supprimé" });
  } catch (error) {
    console.error("Erreur suppression commentaire:", error);
    return NextResponse.json(
      { error: "Erreur interne" },
      { status: 500 }
    );
  }
}

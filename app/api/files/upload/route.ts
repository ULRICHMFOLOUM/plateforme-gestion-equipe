import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadToCloudinary } from "@/lib/cloudinary";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const projectId = formData.get("projectId") as string | null;

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "Aucun fichier fourni" },
        { status: 400 }
      );
    }

    const uploadedFiles = [];

    for (const file of files) {
      // Convertir le fichier en buffer
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Uploader vers Cloudinary
      console.log('Début upload Cloudinary (Team Platform) pour:', file.name);
      const cloudinaryResult = await uploadToCloudinary(buffer, "uploads");
      console.log('Résultat Cloudinary (Team Platform):', cloudinaryResult.secure_url);

      // Sauvegarder les informations en base de données
      const fileRecord = await prisma.file.create({
        data: {
          name: file.name,
          url: cloudinaryResult.secure_url,
          size: file.size,
          type: file.type,
          userId: session.user.id,
          projectId: projectId || undefined,
        },
      });

      uploadedFiles.push(fileRecord);
    }

    return NextResponse.json(uploadedFiles, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de l'upload:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

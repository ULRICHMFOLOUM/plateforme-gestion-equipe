import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

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
      const cloudinaryResult = await uploadToCloudinary(buffer, "chat");

      // Créer un objet fichier pour le chat (sera lié au message plus tard)
      const chatFile = {
        id: uuidv4(),
        name: file.name,
        url: cloudinaryResult.secure_url,
        size: file.size,
        type: file.type,
      };

      uploadedFiles.push(chatFile);
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

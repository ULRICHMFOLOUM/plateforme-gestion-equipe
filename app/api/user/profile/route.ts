import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadBase64ToCloudinary } from "@/lib/cloudinary";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const formData = await request.formData();
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const bio = formData.get("bio") as string;
    const phone = formData.get("phone") as string;
    const department = formData.get("department") as string;
    const jobTitle = formData.get("jobTitle") as string;
    const timezone = formData.get("timezone") as string;
    const language = formData.get("language") as string;
    const existingImage = formData.get("existingImage") as string;
    
    let imageUrl = existingImage || null;
    const imageFile = formData.get("image") as File | null;

    if (imageFile && imageFile.size > 0) {
      try {
        const bytes = await imageFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        // Using the main cloudinary file upload
        const { uploadToCloudinary } = await import("@/lib/cloudinary");
        const cloudinaryResult = await uploadToCloudinary(buffer, "profiles");
        imageUrl = cloudinaryResult.secure_url;
      } catch (uploadError) {
        console.error("Erreur upload Cloudinary profil:", uploadError);
      }
    }

    try {
      const updatedUser = await prisma.user.update({
        where: { id: session.user.id },
        data: {
          name: `${firstName} ${lastName}`.trim(),
          image: imageUrl || null,
          firstName,
          lastName,
          bio,
          phone,
          department,
          jobTitle,
          timezone,
          language,
        },
      });

      return NextResponse.json({
        message: "Profil mis à jour avec succès",
        user: updatedUser
      });
    } catch (dbError: any) {
      console.error("Erreur Prisma profil:", dbError);
      return NextResponse.json(
        { error: "Erreur lors de l'accès à la base de données: " + dbError.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Erreur lors de la mise à jour du profil:", error);
    return NextResponse.json(
      { error: error.message || "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Erreur lors de la récupération du profil:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

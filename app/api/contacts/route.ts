import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * API Route : Gestion des Contacts et Invitations
 * Ce fichier gère tout l'annuaire de la plateforme.
 */

/**
 * GET - Récupère la liste des contacts acceptés et les demandes en attente
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userId = session.user.id;

    // 1. Récupération des contacts dont le statut est 'ACCEPTED'
    const contacts = await prisma.contact.findMany({
      where: { userId: userId, status: "ACCEPTED" },
      include: { contact: { select: { id: true, name: true, email: true, image: true } } },
    });

    // 2. Récupération des demandes d'invitation envoyées par l'utilisateur
    const sentRequests = await prisma.contactRequest.findMany({
      where: { senderId: userId, status: "PENDING" },
      include: { receiver: { select: { id: true, name: true, email: true, image: true } } },
    });

    // 3. Récupération des demandes d'invitation reçues par l'utilisateur
    const receivedRequests = await prisma.contactRequest.findMany({
      where: { receiverId: userId, status: "PENDING" },
      include: { sender: { select: { id: true, name: true, email: true, image: true } } },
    });

    // Mise en forme des données pour le frontend (Avatar généré si pas d'image)
    const formattedContacts = contacts.map((c) => ({
      id: c.id, contactId: c.contact.id, name: c.contact.name || c.contact.email, email: c.contact.email,
      avatar: c.contact.name ? c.contact.name.split(" ").map((n) => n[0]).join("").toUpperCase() : c.contact.email.substring(0, 2).toUpperCase(),
      image: c.contact.image, status: "offline" as const, isFavorite: false, createdAt: c.createdAt,
    }));

    const formattedSentRequests = sentRequests.map((r) => ({
      id: r.id, receiverId: r.receiver.id, name: r.receiver.name || r.receiver.email, email: r.receiver.email,
      avatar: r.receiver.name ? r.receiver.name.split(" ").map((n) => n[0]).join("").toUpperCase() : r.receiver.email.substring(0, 2).toUpperCase(),
      image: r.receiver.image, message: r.message, createdAt: r.createdAt,
    }));

    const formattedReceivedRequests = receivedRequests.map((r) => ({
      id: r.id, senderId: r.sender.id, name: r.sender.name || r.sender.email, email: r.sender.email,
      avatar: r.sender.name ? r.sender.name.split(" ").map((n) => n[0]).join("").toUpperCase() : r.sender.email.substring(0, 2).toUpperCase(),
      image: r.sender.image, message: r.message, createdAt: r.createdAt,
    }));

    return NextResponse.json({ 
      contacts: formattedContacts, 
      sentRequests: formattedSentRequests, 
      receivedRequests: formattedReceivedRequests 
    });
  } catch (error: any) {
    console.error("Erreur GET contacts:", error);
    return NextResponse.json({ 
      error: "Erreur interne du serveur (GET): " + (error?.message || String(error)) 
    }, { status: 500 });
  }
}

/**
 * POST - Gère les actions (Recherche, Envoi, Acceptation, Refus)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { action, userId, email, message } = await request.json();
    const currentUserId = session.user.id;
    const currentUserEmail = session.user.email;

    /**
     * Action : SEARCH - Rechercher des utilisateurs pour les ajouter
     */
    if (action === "search") {
      const searchQuery = email || "";
      // On récupère les IDs des gens déjà en contact pour les exclure de la recherche
      const existingContacts = await prisma.contact.findMany({ where: { userId: currentUserId }, select: { contactId: true } });
      const existingContactIds = existingContacts.map((c) => c.contactId);
      existingContactIds.push(currentUserId); // S'exclure soi-même

      const users = await prisma.user.findMany({
        where: { 
          email: { contains: searchQuery, mode: "insensitive" }, 
          id: { notIn: existingContactIds } 
        },
        select: { id: true, name: true, email: true, image: true }, take: 10,
      });

      const formattedUsers = users.map((u) => ({
        id: u.id, name: u.name || u.email, email: u.email,
        avatar: u.name ? u.name.split(" ").map((n) => n[0]).join("").toUpperCase() : u.email.substring(0, 2).toUpperCase(),
        image: u.image,
      }));

      return NextResponse.json(formattedUsers);
    }

    /**
     * Action : SENDREQUEST - Envoyer une invitation
     */
    if (action === "sendRequest") {
      if (!userId) return NextResponse.json({ error: "ID de destinataire requis" }, { status: 400 });

      // Recherche de l'utilisateur cible (par email ou ID)
      let targetUser;
      if (userId.includes('@')) {
        targetUser = await prisma.user.findUnique({ where: { email: userId } });
      } else {
        targetUser = await prisma.user.findUnique({ where: { id: userId } });
      }

      if (!targetUser) return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
      if (targetUser.id === currentUserId) return NextResponse.json({ error: "Vous ne pouvez pas vous ajouter vous-même" }, { status: 400 });

      const targetUserId = targetUser.id;

      // Vérifier si déjà en contact
      const existingContact = await prisma.contact.findFirst({
        where: { OR: [{ userId: currentUserId, contactId: targetUserId }, { userId: targetUserId, contactId: currentUserId }] },
      });
      if (existingContact) return NextResponse.json({ error: "Déjà dans vos contacts" }, { status: 400 });

      // Vérifier si une demande est déjà en attente
      const existingRequest = await prisma.contactRequest.findFirst({
        where: {
          OR: [{ senderId: currentUserId, receiverId: targetUserId }, { senderId: targetUserId, receiverId: currentUserId }],
          status: "PENDING",
        },
      });
      if (existingRequest) return NextResponse.json({ error: "Demande déjà en attente" }, { status: 400 });

      // Création ou réactivation de la demande d'invitation
      // On utilise upsert pour gérer le cas où une demande précédemment refusée existe déjà
      const contactRequest = await prisma.contactRequest.upsert({
        where: { senderId_receiverId: { senderId: currentUserId, receiverId: targetUserId } },
        update: { status: "PENDING", message: message || null, updatedAt: new Date() },
        create: { senderId: currentUserId, receiverId: targetUserId, message: message || null },
        include: { receiver: { select: { id: true, name: true, email: true, image: true } } },
      });

      return NextResponse.json({
        id: contactRequest.id, receiverId: contactRequest.receiver.id,
        name: contactRequest.receiver.name || contactRequest.receiver.email,
        email: contactRequest.receiver.email, message: contactRequest.message, createdAt: contactRequest.createdAt,
      });
    }

    /**
     * Action : ACCEPTREQUEST - Accepter une invitation reçue
     */
    if (action === "acceptRequest") {
      if (!userId) return NextResponse.json({ error: "ID requis" }, { status: 400 });

      const contactRequest = await prisma.contactRequest.findFirst({
        where: { senderId: userId, receiverId: currentUserId, status: "PENDING" },
      });

      if (!contactRequest) return NextResponse.json({ error: "Demande non trouvée" }, { status: 404 });

      // 1. On passe le statut de la demande à 'ACCEPTED'
      await prisma.contactRequest.update({ where: { id: contactRequest.id }, data: { status: "ACCEPTED" } });
      
      // 2. On crée la relation bidirectionnelle dans la table 'Contact'
      await prisma.contact.createMany({
        data: [
          { userId: currentUserId, contactId: userId, status: "ACCEPTED", updatedAt: new Date() },
          { userId: userId, contactId: currentUserId, status: "ACCEPTED", updatedAt: new Date() },
        ],
      });

      return NextResponse.json({ message: "Demande acceptée" });
    }

    /**
     * Action : REJECTREQUEST - Refuser une invitation reçue
     */
    if (action === "rejectRequest") {
      if (!userId) return NextResponse.json({ error: "ID requis" }, { status: 400 });

      const contactRequest = await prisma.contactRequest.findFirst({
        where: { senderId: userId, receiverId: currentUserId, status: "PENDING" },
      });

      if (!contactRequest) return NextResponse.json({ error: "Demande non trouvée" }, { status: 404 });

      await prisma.contactRequest.update({ where: { id: contactRequest.id }, data: { status: "REJECTED" } });
      return NextResponse.json({ message: "Demande refusée" });
    }

    /**
     * Action : REMOVE - Supprimer un contact
     */
    if (action === "remove") {
      if (!userId) return NextResponse.json({ error: "ID requis" }, { status: 400 });

      await prisma.contact.deleteMany({
        where: { OR: [{ userId: currentUserId, contactId: userId }, { userId: userId, contactId: currentUserId }] },
      });

      return NextResponse.json({ message: "Contact supprimé" });
    }

    return NextResponse.json({ error: "Action non valide" }, { status: 400 });
  } catch (error: any) {
    console.error("Erreur POST contacts:", error);
    return NextResponse.json({ 
      error: "Erreur interne du serveur: " + (error?.message || String(error)) 
    }, { status: 500 });
  }
}

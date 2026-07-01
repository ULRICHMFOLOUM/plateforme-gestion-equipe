"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = require("bcryptjs");
const prisma = new client_1.PrismaClient();
async function main() {
    // Créer des utilisateurs de test
    const hashedPassword = await bcryptjs_1.default.hash('password123', 12);
    const user1 = await prisma.user.upsert({
        where: { email: 'alice@example.com' },
        update: {},
        create: {
            id: 'user-1',
            name: 'Alice Dupont',
            email: 'alice@example.com',
            password: hashedPassword,
            role: 'USER',
        },
    });
    const user2 = await prisma.user.upsert({
        where: { email: 'bob@example.com' },
        update: {},
        create: {
            id: 'user-2',
            name: 'Bob Martin',
            email: 'bob@example.com',
            password: hashedPassword,
            role: 'USER',
        },
    });
    const user3 = await prisma.user.upsert({
        where: { email: 'charlie@example.com' },
        update: {},
        create: {
            id: 'user-3',
            name: 'Charlie Durand',
            email: 'charlie@example.com',
            password: hashedPassword,
            role: 'USER',
        },
    });
    console.log('Utilisateurs de test créés:', { user1, user2, user3 });
    // Créer un projet de test
    const project = await prisma.project.upsert({
        where: { id: 'project-1' },
        update: {},
        create: {
            id: 'project-1',
            name: 'Projet de démonstration',
            description: 'Un projet pour tester les fonctionnalités de la plateforme',
            status: 'ACTIVE',
            ownerId: user1.id,
        },
    });
    console.log('Projet créé:', project);
    // Créer quelques tâches de test
    const task1 = await prisma.task.create({
        data: {
            title: 'Configurer le tableau de bord',
            description: 'Mettre en place les composants principaux du dashboard',
            status: 'DONE',
            priority: 'HIGH',
            userId: user1.id,
            projectId: project.id,
        },
    });
    const task2 = await prisma.task.create({
        data: {
            title: 'Implémenter la messagerie',
            description: 'Développer le système de chat en temps réel',
            status: 'IN_PROGRESS',
            priority: 'HIGH',
            userId: user1.id,
            projectId: project.id,
            assigneeId: user2.id,
        },
    });
    const task3 = await prisma.task.create({
        data: {
            title: 'Créer l\'annuaire des utilisateurs',
            description: 'Développer la page d\'annuaire avec recherche',
            status: 'TODO',
            priority: 'MEDIUM',
            userId: user1.id,
            projectId: project.id,
            assigneeId: user3.id,
        },
    });
    console.log('Tâches créées:', { task1, task2, task3 });
    // Créer quelques événements
    const event1 = await prisma.event.create({
        data: {
            title: 'Réunion d\'équipe',
            description: 'Point hebdomadaire sur l\'avancement du projet',
            startDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // demain
            endDate: new Date(Date.now() + 25 * 60 * 60 * 1000), // demain +1h
            location: 'Salle de conférence A',
            userId: user1.id,
        },
    });
    console.log('Événement créé:', event1);
}
main()
    .then(async () => {
    await prisma.$disconnect();
})
    .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});

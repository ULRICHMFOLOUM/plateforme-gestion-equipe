import { NextResponse } from 'next/server';

// Socket.IO a été remplacé par Pusher pour la compatibilité serverless.
// Ce fichier est conservé pour éviter les erreurs 404 mais n'est plus utilisé.
export async function GET() {
  return NextResponse.json(
    { message: "Pusher est utilisé pour la messagerie temps réel." },
    { status: 200 }
  );
}

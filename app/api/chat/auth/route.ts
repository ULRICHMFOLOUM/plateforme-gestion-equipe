import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { pusherServer } from "@/lib/pusher";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.formData();
    const socketId = body.get("socket_id") as string;
    const channel = body.get("channel_name") as string;

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const authResponse = pusherServer.authorizeChannel(socketId, channel, {
      user_id: session.user.id,
      user_info: {
        name: session.user.name,
        email: session.user.email,
      },
    });

    return NextResponse.json(authResponse);
  } catch (error) {
    console.error("PUSHER AUTH ERROR:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

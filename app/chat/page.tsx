"use client";
export const dynamic = 'force-dynamic';

import { Suspense } from "react";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { ChatInterface } from "@/components/ChatInterface";

export default function ChatPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <ChatInterface />
    </Suspense>
  );
}

"use client";

import ContextDrawer from "./ui/ContextDrawer";
import { ChatInterface } from "./ChatInterface";

interface ProjectChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  roomId?: string;
}

export default function ProjectChatDrawer({
  isOpen,
  onClose,
  projectId,
  projectName,
  roomId,
}: ProjectChatDrawerProps) {
  return (
    <ContextDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={`Chat du projet — ${projectName}`}
      width="w-full sm:w-[550px] lg:w-[700px]"
    >
      <div className="h-full w-full flex flex-col overflow-hidden bg-slate-50">
        <ChatInterface isWidget={true} />
      </div>
    </ContextDrawer>
  );
}

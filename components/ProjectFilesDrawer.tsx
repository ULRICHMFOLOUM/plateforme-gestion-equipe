"use client";

import ContextDrawer from "./ui/ContextDrawer";
import FileManager from "./FileManager";

interface ProjectFilesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
}

export default function ProjectFilesDrawer({
  isOpen,
  onClose,
  projectId,
  projectName,
}: ProjectFilesDrawerProps) {
  return (
    <ContextDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={`Fichiers & Documents — ${projectName}`}
      width="w-full sm:w-[600px] lg:w-[800px]"
    >
      <div className="p-6">
        <FileManager projectId={projectId} projectName={projectName} isCompactView={true} />
      </div>
    </ContextDrawer>
  );
}

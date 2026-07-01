"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import KanbanCard from "./KanbanCard";

interface Task {
  id: string;
  title: string;
  description: string;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH";
  assignee?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

interface KanbanColumnProps {
  id: string;
  title: string;
  tasks: Task[];
  color: string;
}

export default function KanbanColumn({
  id,
  title,
  tasks,
  color,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col h-fit min-h-[600px] rounded-lg border-2 border-dashed p-4 transition-colors ${
        isOver ? "border-blue-400 bg-blue-50" : "border-gray-300 bg-white"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {tasks.length}
        </span>
      </div>

      <div className="flex-1 space-y-3">
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <KanbanCard key={task.id} task={task} />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
            Aucune tâche
          </div>
        )}
      </div>
    </div>
  );
}

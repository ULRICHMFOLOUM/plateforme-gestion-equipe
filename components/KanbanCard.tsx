"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AlertCircle, Clock, CheckCircle } from "lucide-react";
import UserAvatar from "./ui/UserAvatar";
import Card from "./ui/Card";

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
    image?: string | null;
  } | null;
}

interface KanbanCardProps {
  task: Task;
  isDragging?: boolean;
}

export default function KanbanCard({
  task,
  isDragging = false,
}: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priorityColor = {
    LOW: "text-green-600 bg-green-100",
    MEDIUM: "text-yellow-600 bg-yellow-100",
    HIGH: "text-red-600 bg-red-100",
  };

  const PriorityIcon = {
    LOW: CheckCircle,
    MEDIUM: Clock,
    HIGH: AlertCircle,
  };

  const Icon = PriorityIcon[task.priority];

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`cursor-move ${
        isDragging || isSortableDragging ? "opacity-50 rotate-2" : ""
      }`}
    >
      <Card
        title={task.title}
        badge={
          <div
            className={`flex items-center justify-center w-6 h-6 rounded-full ${priorityColor[task.priority]}`}
          >
            <Icon className="w-3 h-3" />
          </div>
        }
        className="p-4"
      >
        {task.description && (
          <p className="text-sm text-slate-600 line-clamp-2 mb-3">
            {task.description}
          </p>
        )}

        {task.assignee && (
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100/50">
            <div className="flex items-center gap-2 overflow-hidden">
              <UserAvatar 
                src={task.assignee.image} 
                name={task.assignee.name || task.assignee.email} 
                size="xs" 
              />
              <span className="text-[11px] font-medium text-slate-500 truncate">
                {task.assignee.name || task.assignee.email.split('@')[0]}
              </span>
            </div>
            <div className="flex -space-x-2">
              {/* Other members could be displayed here if supported by DB */}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

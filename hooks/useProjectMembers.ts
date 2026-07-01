import { useState, useEffect, useCallback } from "react";

export interface ProjectMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatar: string;
  image?: string;
  role: "owner" | "manager" | "contributor" | "viewer";
  joinedAt: Date;
}

export interface ProjectMemberData {
  projectId: string;
  projectName: string;
  owner: ProjectMember;
  members: ProjectMember[];
}

export function useProjectMembers(projectId: string) {
  const [projectData, setProjectData] = useState<ProjectMemberData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${projectId}/members`);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Unauthorized");
        }
        if (response.status === 403) {
          throw new Error("Access denied");
        }
        if (response.status === 404) {
          throw new Error("Project not found");
        }
        throw new Error("Failed to fetch members");
      }

      const data = await response.json();
      setProjectData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching project members:", err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const addMember = async (
    userId: string,
    role: "manager" | "contributor",
  ): Promise<boolean> => {
    try {
      const response = await fetch(`/api/projects/${projectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add member");
      }

      const newMember = await response.json();

      setProjectData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          members: [
            ...prev.members,
            {
              ...newMember,
              joinedAt: new Date(),
            },
          ],
        };
      });

      return true;
    } catch (err) {
      console.error("Error adding member:", err);
      return false;
    }
  };

  const updateMemberRole = async (
    memberId: string,
    role: "manager" | "contributor",
  ): Promise<boolean> => {
    try {
      const response = await fetch(`/api/projects/${projectId}/members`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, role }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update role");
      }

      const updatedMember = await response.json();

      setProjectData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          members: prev.members.map((m) =>
            m.id === memberId
              ? { ...m, role: updatedMember.role as ProjectMember["role"] }
              : m,
          ),
        };
      });

      return true;
    } catch (err) {
      console.error("Error updating member role:", err);
      return false;
    }
  };

  const removeMember = async (memberId: string): Promise<boolean> => {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/members?memberId=${memberId}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to remove member");
      }

      setProjectData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          members: prev.members.filter((m) => m.id !== memberId),
        };
      });

      return true;
    } catch (err) {
      console.error("Error removing member:", err);
      return false;
    }
  };

  return {
    projectData,
    loading,
    error,
    addMember,
    updateMemberRole,
    removeMember,
    refresh: fetchMembers,
  };
}

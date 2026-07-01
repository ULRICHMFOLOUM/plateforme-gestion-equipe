import { useState, useEffect, useCallback } from "react";

export interface Contact {
  id: string;
  contactId: string;
  name: string;
  email: string;
  avatar: string;
  image?: string;
  status: "online" | "away" | "busy" | "offline";
  isFavorite: boolean;
  lastSeen?: string;
  firstName?: string;
  lastName?: string;
  jobTitle?: string;
  department?: string;
}

export interface ContactRequest {
  id: string;
  senderId: string;
  receiverId?: string;
  name: string;
  email: string;
  avatar: string;
  image?: string;
  message?: string;
  createdAt: Date;
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar: string;
    jobTitle?: string;
  };
}

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/contacts");

      if (!response.ok) {
        throw new Error("Failed to fetch contacts");
      }

      const data = await response.json();

      // Transform API data to match our interface
      const transformedContacts: Contact[] = (data.contacts || []).map(
        (c: any) => ({
          id: c.id,
          contactId: c.contactId,
          name: c.name,
          email: c.email,
          avatar: c.avatar,
          image: c.image,
          status: c.status || "offline",
          isFavorite: c.isFavorite || false,
          lastSeen: c.createdAt,
        }),
      );

      const transformedRequests: ContactRequest[] = (
        data.receivedRequests || []
      ).map((r: any) => ({
        id: r.id,
        senderId: r.senderId,
        name: r.name,
        email: r.email,
        avatar: r.avatar,
        image: r.image,
        message: r.message,
        createdAt: r.createdAt,
        sender: {
          id: r.senderId,
          firstName: r.name?.split(" ")[0] || "",
          lastName: r.name?.split(" ").slice(1).join(" ") || "",
          email: r.email,
          avatar: r.avatar,
        },
      }));

      setContacts(transformedContacts);
      setRequests(transformedRequests);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching contacts:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const sendRequest = async (
    userId: string,
    message?: string,
  ): Promise<boolean> => {
    try {
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sendRequest",
          userId,
          message,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send request");
      }

      await fetchContacts();
      return true;
    } catch (err) {
      console.error("Error sending request:", err);
      return false;
    }
  };

  const acceptRequest = async (requestId: string): Promise<boolean> => {
    try {
      // Find the request in our state
      const request = requests.find((r) => r.id === requestId);
      if (!request) return false;

      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "acceptRequest",
          userId: request.senderId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to accept request");
      }

      await fetchContacts();
      return true;
    } catch (err) {
      console.error("Error accepting request:", err);
      return false;
    }
  };

  const rejectRequest = async (requestId: string): Promise<boolean> => {
    try {
      const request = requests.find((r) => r.id === requestId);
      if (!request) return false;

      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "rejectRequest",
          userId: request.senderId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to reject request");
      }

      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      return true;
    } catch (err) {
      console.error("Error rejecting request:", err);
      return false;
    }
  };

  const removeContact = async (contactId: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "remove",
          userId: contactId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to remove contact");
      }

      setContacts((prev) => prev.filter((c) => c.contactId !== contactId));
      return true;
    } catch (err) {
      console.error("Error removing contact:", err);
      return false;
    }
  };

  const toggleFavorite = async (contactId: string) => {
    // Optimistic update
    setContacts((prev) =>
      prev.map((c) =>
        c.contactId === contactId ? { ...c, isFavorite: !c.isFavorite } : c,
      ),
    );
  };

  return {
    contacts,
    requests,
    loading,
    error,
    sendRequest,
    acceptRequest,
    rejectRequest,
    removeContact,
    toggleFavorite,
    refresh: fetchContacts,
  };
}

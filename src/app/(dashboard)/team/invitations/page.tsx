"use client";

import React, { useState, useEffect } from "react";
import { InvitationManagement } from "@/components/features/team-management/invitations/InvitationManagement";
import { TeamService } from "@/lib/api/team";

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: "pending" | "accepted" | "declined" | "expired";
  message: string | null;
  expiresAt: string;
  acceptedAt: string | null;
  declinedAt: string | null;
  createdAt: string;
  organization: {
    id: string;
    name: string;
  };
  invitedBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function InvitationsPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvitations = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await TeamService.listInvitations() as any;
      setInvitations(data?.invitations ?? data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load invitations");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateInvitation = async (data: any) => {
    setError(null);

    try {
      await TeamService.createInvitation(data);
      await fetchInvitations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create invitation");
      throw err;
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    setError(null);

    try {
      await TeamService.resendInvitation({ invitationId } as any);
      await fetchInvitations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend invitation");
      throw err;
    }
  };

  const handleDeleteInvitation = async (invitationId: string) => {
    setError(null);

    try {
      await TeamService.deleteInvitation(invitationId);
      await fetchInvitations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete invitation");
      throw err;
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  return (
    <div className="container mx-auto py-6">
      <InvitationManagement
        invitations={invitations}
        isLoading={isLoading}
        onCreateInvitation={handleCreateInvitation}
        onResendInvitation={handleResendInvitation}
        onDeleteInvitation={handleDeleteInvitation}
        onRefresh={fetchInvitations}
        error={error}
      />
    </div>
  );
}

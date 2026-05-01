import { apiClient } from "../api-client";
import { CreateInvitationInput, ResendInvitationInput, ListInvitationsInput } from "@/server/validations/invitation.schema";

export interface AcceptInvitationPayload {
  token: string;
  firstName: string;
  lastName: string;
  password: string;
}

export interface TimeOffPayload {
  startDate: string;
  endDate: string;
  leaveType: string;
  reason: string;
  employeeId?: string;
}
export class TeamService {
  static async listInvitations(params?: ListInvitationsInput) {
    let url = "/api/v1/invitations";
    if (params) {
      const query = new URLSearchParams(params as any).toString();
      if (query) url += `?${query}`;
    }
    return apiClient.get(url);
  }

  static async createInvitation(data: CreateInvitationInput) {
    return apiClient.post("/api/v1/invitations", data);
  }

  static async resendInvitation(data: ResendInvitationInput) {
    return apiClient.post("/api/v1/invitations/resend", data);
  }

  static async deleteInvitation(invitationId: string) {
    return apiClient.delete(`/api/v1/invitations/${invitationId}`);
  }

  static async getTeamMembers() {
    return apiClient.get("/api/v1/team/members");
  }

  /** Validate an invitation token and return its details. */
  static async validateInvitation(token: string) {
    return apiClient.get(`/api/v1/invitations/validate?token=${encodeURIComponent(token)}`);
  }

  /** Accept an invitation and create a new user account. */
  static async acceptInvitation(payload: AcceptInvitationPayload) {
    return apiClient.post("/api/v1/invitations/accept", payload);
  }

  /** Decline an invitation by token. */
  static async declineInvitation(token: string) {
    return apiClient.post("/api/v1/invitations/decline", { token });
  }

  /** Submit a time-off request on behalf of an employee (or the current user). */
  static async submitTimeOff(payload: TimeOffPayload) {
    return apiClient.post("/api/v1/team/time-off", payload);
  }
}

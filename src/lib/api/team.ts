import { apiClient } from "../api-client";
import { CreateInvitationInput, ResendInvitationInput, ListInvitationsInput } from "@/server/validations/invitation.schema";

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
}

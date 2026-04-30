import { apiClient } from "../api-client";
import type { KybVerificationStatus } from "@/types/kyb";

export class KybService {
  static async getStatus(): Promise<KybVerificationStatus> {
    return apiClient.get("/api/v1/kyb/status");
  }
}
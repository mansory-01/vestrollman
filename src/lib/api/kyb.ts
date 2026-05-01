import { apiClient } from "../api-client";
import type { KybVerificationStatus } from "@/types/kyb";

export interface KybUploadUrlResponse {
  signedUrl: string;
  key: string;
}

export interface KybSubmitData {
  registrationType: string;
  registrationNo: string;
  incorporationCertificatePath: string;
  memorandumArticlePath: string;
  formC02C07Path?: string;
}

export class KybService {
  static async getStatus(): Promise<KybVerificationStatus> {
    return apiClient.get("/api/v1/kyb/status");
  }

  /**
   * Step 1 of file upload: request a presigned S3 URL from the server.
   * Returns { signedUrl, key } so the caller can PUT the raw file to S3.
   */
  static async getUploadUrl(filename: string, contentType: string): Promise<KybUploadUrlResponse> {
    return apiClient.post<KybUploadUrlResponse>("/api/v1/kyb/upload", {
      filename,
      contentType,
    });
  }

  /** Submit KYB verification data after all files have been uploaded to S3. */
  static async submit(data: KybSubmitData): Promise<void> {
    return apiClient.post<void>("/api/v1/kyb/submit", data);
  }
}
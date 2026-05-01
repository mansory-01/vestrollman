import { apiClient } from "../api-client";

export interface CompanyProfile {
  name: string;
  industry: string | null;
  registrationNumber: string | null;
  providerPreference: "monnify" | "flutterwave";
  registered: {
    street: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    country: string | null;
  };
  billing: {
    street: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    country: string | null;
  };
}

export interface UpdateCompanyProfileInput {
  name?: string;
  industry?: string | null;
  registrationNumber?: string | null;
  providerPreference?: "monnify" | "flutterwave";
  registered?: {
    street?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
    country?: string | null;
  };
  billing?: {
    street?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
    country?: string | null;
  };
}

export interface LogoUploadUrlResponse {
  signedUrl: string;
  key: string;
}

export interface UpdateLogoResponse {
  logoUrl: string;
}

export const OrganizationApi = {
  getProfile(): Promise<CompanyProfile> {
    return apiClient.get<CompanyProfile>("/api/v1/company/profile");
  },

  updateProfile(data: UpdateCompanyProfileInput): Promise<CompanyProfile> {
    return apiClient.put<CompanyProfile>("/api/v1/company/profile", data);
  },

  /**
   * Step 1 of logo upload: request a presigned S3 URL.
   * Pass `filename` and `contentType` to get back `{ signedUrl, key }`.
   */
  getLogoUploadUrl(filename: string, contentType: string): Promise<LogoUploadUrlResponse> {
    const params = new URLSearchParams({ filename, contentType }).toString();
    return apiClient.get<LogoUploadUrlResponse>(
      `/api/v1/organizations/logo-upload-url?${params}`
    );
  },

  /**
   * Step 3 of logo upload: save the S3 key to the database.
   * Returns `{ logoUrl }` with the permanent CDN URL.
   */
  updateLogo(key: string): Promise<UpdateLogoResponse> {
    return apiClient.patch<UpdateLogoResponse>("/api/v1/organizations/logo", { key });
  },
};

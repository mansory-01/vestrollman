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

export const OrganizationApi = {
  getProfile(): Promise<CompanyProfile> {
    return apiClient.get<CompanyProfile>("/api/v1/company/profile");
  },

  updateProfile(data: UpdateCompanyProfileInput): Promise<CompanyProfile> {
    return apiClient.put<CompanyProfile>("/api/v1/company/profile", data);
  },
};

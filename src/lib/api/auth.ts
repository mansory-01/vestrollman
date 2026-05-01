import { apiClient } from "../api-client";

interface LoginCredentials {
  email: string;
  password: string;
}

interface ResetPasswordData {
  password: string;
  email: string;
  type: "password-reset" | "create";
}

interface ForgotPasswordData {
  email: string;
}

interface RegisterData {
  businessEmail: string;
  firstName: string;
  lastName: string;
}

interface CompleteRegistrationData {
  firstName: string;
  lastName: string;
  businessEmail: string;
  accountType: string;
  companyName: string;
  companySize: string;
  companyIndustry: string;
  headquarterCountry: string;
  businessDescription: string;
}

export class AuthService {
  static async login(credentials: LoginCredentials) {
    return apiClient.post("/api/v1/auth/login", credentials);
  }

  static async verifyLoginOTP(data: { email: string; otp: string; rememberMe?: boolean }) {
    return apiClient.post("/api/v1/auth/verify-login-otp", data);
  }

  static async resendLoginOTP(email: string) {
    return apiClient.post("/api/v1/auth/resend-otp", { email });
  }

  static async register(credentials: RegisterData) {
    return apiClient.post("/api/v1/auth/register", credentials);
  }

  static async forgotPassword(data: ForgotPasswordData) {
    return apiClient.post("/api/v1/auth/forgot-password", data);
  }

  static async resetPassword(data: ResetPasswordData) {
    return apiClient.post("/api/v1/auth/reset-password", data);
  }

  static async completeRegistration(data: CompleteRegistrationData) {
    return apiClient.post("/api/v1/auth/complete-registration", data);
  }

  static async logout() {
    return apiClient.post("/api/v1/auth/logout", {});
  }

  static async verifyEmail(data: { email: string; otp: string }) {
    return apiClient.post("/api/v1/auth/verify-email", data);
  }
}





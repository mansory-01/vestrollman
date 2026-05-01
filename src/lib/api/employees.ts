import { apiClient } from "../api-client";
import { PaginatedResponse } from "@/types/pagination";

// ─── Employee list ──────────────────────────────────────────────────────────

export interface EmployeeItem {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  type: string;
  avatarUrl: string | null;
}

export interface EmployeeDetail {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department?: string;
}

export interface GetEmployeesParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: "Active" | "Inactive";
  type?: "Freelancer" | "Contractor";
}

export interface AddEmployeePayload {
  email: string;
  organizationId?: string;
}

export interface AddEmployeeResponse {
  id: string;
  status: string;
  invitedAt: string;
}

// ─── Bank account ────────────────────────────────────────────────────────────

export interface AccountDetails {
  id: string;
  bankName: string;
  accountNumber: string;
  routingNumber?: string;
  sortCode?: string;
  iban?: string;
  swiftCode?: string;
  accountType: string;
  accountHolderName: string;
  isAccountVerified: boolean;
  accountVerifiedAt?: string;
  bankAddress?: string;
  bankCity?: string;
  bankCountry?: string;
  employeeId: string;
  employeeName?: string;
}

export interface CreateAccountPayload {
  employeeId: string;
  bankName: string;
  accountNumber: string;
  routingNumber?: string;
  sortCode?: string;
  iban?: string;
  swiftCode?: string;
  accountType: string;
  accountHolderName: string;
  bankAddress?: string;
  bankCity?: string;
  bankCountry: string;
}

export interface ValidateAccountPayload {
  bankName: string;
  accountNumber: string;
  routingNumber?: string;
  sortCode?: string;
  iban?: string;
  bankCountry?: string;
}

export interface ValidateAccountResult {
  isValid: boolean;
  bankName?: string;
  accountName?: string;
  accountHolderName?: string;
  error?: string;
}

export interface VerifyAccountPayload {
  employeeId: string;
  accountNumber: string;
  bankName: string;
}

// ─── Exported functions (list / add) ────────────────────────────────────────

export async function getEmployees(
  params: GetEmployeesParams = {}
): Promise<PaginatedResponse<EmployeeItem>> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.search) query.set("search", params.search);
  if (params.status) query.set("status", params.status);
  if (params.type) query.set("type", params.type);

  const qs = query.toString();
  return apiClient.get<PaginatedResponse<EmployeeItem>>(
    `/api/v1/team/employees${qs ? `?${qs}` : ""}`
  );
}

export async function addEmployee(
  payload: AddEmployeePayload
): Promise<AddEmployeeResponse> {
  return apiClient.post<AddEmployeeResponse>("/api/v1/team/employees", payload);
}

// ─── EmployeesService (detail + accounts) ───────────────────────────────────

export class EmployeesService {
  /** Fetch a single employee by ID. */
  static async getEmployee(employeeId: string): Promise<EmployeeDetail> {
    return apiClient.get<EmployeeDetail>(`/api/v1/team/employees/${employeeId}`);
  }

  /** Fetch all bank accounts belonging to an employee. */
  static async getAccounts(employeeId: string): Promise<AccountDetails[]> {
    return apiClient.get<AccountDetails[]>(
      `/api/v1/accounts?employeeId=${employeeId}`
    );
  }

  /** Create or update a bank account (upsert via PUT). */
  static async upsertAccount(data: CreateAccountPayload): Promise<AccountDetails> {
    return apiClient.put<AccountDetails>("/api/v1/accounts", data);
  }

  /** Verify a bank account (mark as verified by the backend). */
  static async verifyAccount(payload: VerifyAccountPayload): Promise<void> {
    return apiClient.post<void>("/api/v1/accounts/verify", payload);
  }

  /** Delete a bank account by ID. */
  static async deleteAccount(accountId: string): Promise<void> {
    return apiClient.delete<void>(`/api/v1/accounts/${accountId}`);
  }

  /**
   * Validate bank account details before saving.
   * Used both in AccountForm and Step3PaymentDetails.
   */
  static async validateAccount(
    payload: ValidateAccountPayload
  ): Promise<ValidateAccountResult> {
    return apiClient.post<ValidateAccountResult>(
      "/api/v1/accounts/validate",
      payload
    );
  }
}

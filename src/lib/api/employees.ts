import { apiClient, RequestError } from "../api-client";
import { PaginatedResponse } from "@/types/pagination";

export interface EmployeeItem {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  type: string;
  avatarUrl: string | null;
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

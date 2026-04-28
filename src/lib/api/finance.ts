import { apiClient } from "../api-client";

export interface PayrollEmployee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatarUrl: string | null;
}

export interface PayrollItem {
  id: string;
  invoiceNo: string;
  title: string;
  amount: number;
  paidIn: string;
  status: string;
  issueDate: string;
  employee: PayrollEmployee;
}

export interface PayrollResult {
  invoiceId: string;
  status: "success" | "failed";
  error?: string;
}

export interface RunPayrollResponse {
  results: PayrollResult[];
  succeeded: number;
  failed: number;
  total: number;
}

export interface RunPayrollInput {
  invoiceIds: string[];
  providerId?: "monnify" | "flutterwave";
}

export class FinanceService {
  static async getPendingPayroll(): Promise<PayrollItem[]> {
    return apiClient.get<PayrollItem[]>("/api/v1/finance/payroll");
  }

  static async submitPayroll(data: RunPayrollInput): Promise<RunPayrollResponse> {
    return apiClient.post<RunPayrollResponse>("/api/v1/finance/payroll", data);
  }
}

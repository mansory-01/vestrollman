import { Contract } from "@/lib/data/contracts";
import { Invoice } from "@/lib/data/invoices";

export class FinanceService {
  static async getContracts(): Promise<Contract[]> {
    const res = await fetch("/api/v1/finance/contracts", {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch contracts");
    const json = await res.json();
    return json.data ?? [];
  }

  static async getInvoices(): Promise<Invoice[]> {
    const res = await fetch("/api/v1/finance/invoices", {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch invoices");
    const json = await res.json();
    return json.data ?? [];
import { apiClient } from "../api-client";

interface DepositRequest {
  amount: number;
  provider?: "monnify" | "flutterwave";
  redirectUrl?: string;
}

interface DepositResponse {
  reference: string;
  provider: string;
  checkoutUrl?: string;
  paymentUrl?: string;
  authorizationUrl?: string;
  status: string;
  amount: number;
  currency: string;
}

export class FinanceService {
  static async initializeDeposit(request: DepositRequest): Promise<DepositResponse> {
    return apiClient.post<DepositResponse>("/api/v1/finance/fiat/deposit", request);
  }
}

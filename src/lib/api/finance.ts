import { apiClient } from "../api-client";
import { Contract } from "@/lib/data/contracts";
import { Invoice } from "@/lib/data/invoices";

// ─── Wallet ──────────────────────────────────────────────────────────────────

export interface WalletFundingDetails {
  walletId: string | null;
  organizationId: string | null;
  virtualAccountNumber: string | null;
  virtualBankName: string | null;
  hasVirtualAccount: boolean;
}

// ─── Balance ─────────────────────────────────────────────────────────────────

export interface FiatBalanceResponse {
  balance: number; // in kobo
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export interface TransactionMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TransactionRecord {
  id: string;
  type?: string;
  description?: string;
  amount: string;
  asset?: string;
  status: string;
  timestamp: string;
}

export interface TransactionsPage {
  data: TransactionRecord[];
  meta: TransactionMeta;
}

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
  static async getPendingPayroll(): Promise<PayrollItem[]> {
    return apiClient.get<PayrollItem[]>("/api/v1/finance/payroll");
  }

  static async submitPayroll(data: RunPayrollInput): Promise<RunPayrollResponse> {
    return apiClient.post<RunPayrollResponse>("/api/v1/finance/payroll", data);
  }

  static async getContracts(): Promise<Contract[]> {
    return apiClient.get<Contract[]>("/api/v1/finance/contracts");
  }

  static async getInvoices(): Promise<Invoice[]> {
    return apiClient.get<Invoice[]>("/api/v1/finance/invoices");
  }

  static async initializeDeposit(request: DepositRequest): Promise<DepositResponse> {
    return apiClient.post<DepositResponse>("/api/v1/finance/fiat/deposit", request);
  }

  /** Fetch the organization's NGN virtual-account funding details. */
  static async getWallet(): Promise<WalletFundingDetails> {
    return apiClient.get<WalletFundingDetails>("/api/v1/finance/wallet");
  }

  /**
   * Request / refresh the organization's dedicated virtual account.
   * Used by AddFundsModal when no virtual account exists yet.
   */
  static async refreshWallet(): Promise<WalletFundingDetails> {
    return apiClient.post<WalletFundingDetails>("/api/v1/finance/wallet");
  }

  /** Fetch the raw NGN fiat balance (returns amount in kobo). */
  static async getBalance(): Promise<FiatBalanceResponse> {
    return apiClient.get<FiatBalanceResponse>("/api/v1/finance/balance");
  }

  /** Fetch a paginated list of transactions. */
  static async getTransactions(page = 1, limit = 10): Promise<TransactionsPage> {
    return apiClient.get<TransactionsPage>(
      `/api/v1/finance/transactions?page=${page}&limit=${limit}`
    );
  }
}

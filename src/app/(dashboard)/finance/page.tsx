"use client";
import { motion } from "framer-motion";

import { useEffect, useMemo, useState } from "react";
import { MOCK_ASSETS } from "@/lib/mock-data";
import { BalanceSection } from "@/components/features/finance/balance-section";
import { AssetsGrid } from "@/components/features/finance/assets-grid";
import { DepositModal } from "@/components/features/finance/DepositModal";
import Table from "@/components/shared/table/Table";
import { TableColumn } from "@/components/shared/table/TableHeader";
import type { Transaction } from "@/types/finance.types";
import { UsdtIcon } from "@/../public/svg";
import { formatNairaFromKobo } from "@/lib/format-naira";
import { FinanceService } from "@/lib/api/finance";

const transactionColumns: TableColumn[] = [
  { key: "id", header: "Transaction ID" },
  { key: "description", header: "Description" },
  { key: "amount", header: "Amount", align: "center" },
  { key: "asset", header: "Asset", align: "center" },
  { key: "status", header: "Status", align: "center" },
  { key: "timestamp", header: "Timestamp", align: "right" },
];

type ApiTransactionStatus =
  | "pending"
  | "completed"
  | "successful"
  | "failed"
  | "Pending"
  | "Successful"
  | "Failed";

type ApiTransaction = Omit<Transaction, "status"> & {
  status: ApiTransactionStatus;
};

type TransactionsResponse = {
  success: boolean;
  message?: string;
  data?: {
    data: ApiTransaction[];
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
};

type DisplayTransaction = Omit<Transaction, "status"> & {
  status: "Pending" | "Completed" | "Failed";
};

const formatStatus = (
  status: ApiTransactionStatus,
): DisplayTransaction["status"] => {
  switch (status) {
    case "completed":
    case "successful":
    case "Successful":
      return "Completed";
    case "failed":
    case "Failed":
      return "Failed";
    case "pending":
    case "Pending":
    default:
      return "Pending";
  }
};

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const normalizeTransaction = (
  transaction: ApiTransaction,
): DisplayTransaction => ({
  ...transaction,
  asset: transaction.asset ?? "NGN",
  description:
    transaction.description ??
    `${
      transaction.type
        ? `${transaction.type[0].toUpperCase()}${transaction.type.slice(1)}`
        : "Transaction"
    } ${transaction.id}`,
  status: formatStatus(transaction.status),
  timestamp: formatTimestamp(transaction.timestamp),
});

export default function FinancePage() {
  // State for balance
  const [ngnBalance, setNgnBalance] = useState<string>("₦0.00");

  // State for transactions
  const [transactions, setTransactions] = useState<DisplayTransaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const [transactionsError, setTransactionsError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // State for UI
  const [search, setSearch] = useState("");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

  // Fetch organization fiat balance
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const { balance } = await FinanceService.getBalance();
        setNgnBalance(formatNairaFromKobo(balance ?? 0));
      } catch (error) {
        console.error("Failed to fetch NGN balance:", error);
      }
    };
    fetchBalance();
  }, []);

  // Fetch transactions
  useEffect(() => {
    const controller = new AbortController();

    const fetchTransactions = async () => {
      setIsLoadingTransactions(true);
      setTransactionsError(null);

      try {
        const payload = await FinanceService.getTransactions(currentPage, itemsPerPage);

        setTransactions(payload.data.map(normalizeTransaction as any));
        setTotalItems(payload.meta.total);
        setTotalPages(Math.max(payload.meta.totalPages, 1));
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setTransactions([]);
        setTotalItems(0);
        setTotalPages(1);
        setTransactionsError(
          error instanceof Error ? error.message : "Unable to load transactions"
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingTransactions(false);
        }
      }
    };

    fetchTransactions();

    return () => controller.abort();
  }, [currentPage, itemsPerPage]);

  const filteredTransactions = useMemo(
    () =>
      transactions.filter((tx) =>
        [tx.id, tx.description, tx.amount, tx.status, tx.type, tx.asset]
          .filter(Boolean)
          .some((v) =>
            String(v).toLowerCase().includes(search.toLowerCase()),
          ),
      ),
    [search, transactions],
  );

  const getStatusBadge = (status: DisplayTransaction["status"]) => {
    switch (status) {
      case "Pending":
        return "border-[#E79A23] bg-[#FEF7EB] text-[#E79A23]";
      case "Failed":
        return "border-[#C64242] bg-[#FEECEC] text-[#C64242]";
      case "Completed":
        return "border-[#26902B] bg-[#EDFEEC] text-[#26902B]";
      default:
        return "";
    }
  };

  const renderTransactionCell = (
    item: DisplayTransaction,
    column: TableColumn,
  ) => {
    switch (column.key) {
      case "id":
        return (
          <p className="font-medium text-gray-900 dark:text-gray-100">
            {item.id}
          </p>
        );
      case "description":
        return (
          <div className="text-text-header font-medium dark:text-white">
            {item.description}
          </div>
        );
      case "amount":
        return (
          <div className="text-text-header font-semibold dark:text-white">
            {item.amount}
          </div>
        );
      case "asset":
        return (
          <div className="flex items-center font-medium gap-1 py-1.5 px-3 border border-border-primary bg-fill-background rounded-full w-fit mx-auto dark:border-gray-700 dark:bg-gray-800">
            <UsdtIcon />
            <span className="text-text-header dark:text-white">
              {item.asset}
            </span>
          </div>
        );
      case "status":
        return (
          <span
            className={`px-2 py-1 rounded-full text-sm font-semibold border ${getStatusBadge(item.status)}`}
          >
            {item.status}
          </span>
        );
      case "timestamp":
        return (
          <span className="text-gray-600 dark:text-gray-400">
            {item.timestamp}
          </span>
        );
      default:
        return (
          (item[column.key as keyof DisplayTransaction] as React.ReactNode) ||
          "-"
        );
    }
  };

  const renderMobileCell = (item: DisplayTransaction) => (
    <div className="flex gap-4 justify-between">
      <div className="space-y-2 flex-1 min-w-0">
        <p className="truncate font-semibold text-gray-500 dark:text-gray-400">
          {item.id}
        </p>
        <span className="flex items-center gap-2">
          <p className="text-xs font-medium text-gray-300 dark:text-gray-500">
            {item.amount}
          </p>
          <div className="w-px self-stretch bg-gray-150 dark:bg-gray-700" />
          <div className="flex items-center font-medium gap-1">
            <UsdtIcon />
            <span className="text-gray-600 text-sm font-medium dark:text-gray-400">
              {item.asset}
            </span>
          </div>
        </span>
      </div>
      <div className="space-y-2 shrink-0 flex flex-col items-end justify-between">
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(item.status)}`}
        >
          {item.status}
        </span>
        <p className="text-xs font-medium text-gray-400">{item.timestamp}</p>
      </div>
    </div>
  );

  const handleSelectItem = (id: string, checked: boolean) =>
    setSelectedItems((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id),
    );

  const handleSelectAll = (checked: boolean) =>
    setSelectedItems(
      checked ? filteredTransactions.map((transaction) => transaction.id) : [],
    );

  const handlePageChange = (page: number) => {
    setSelectedItems([]);
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setSelectedItems([]);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const showModal = () => console.log("Show filter modal");

  return (
    <div className="">
      <div className="">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <header className="flex sm:flex-row items-center justify-between px-6 sm:pt-6 pb-1 space-y-1 sm:space-y-2 bg-white sm:border-b sm:border-[#DCE0E5] sm:pb-5 dark:bg-gray-900 dark:border-gray-800">
            <div>
              <p className="text-xs text-[#7F8C9F] font-medium leading-[120%] tracking-[0%] dark:text-gray-400">
                Overview
              </p>
              <h1 className="font-bold text-2xl sm:font-semibold sm:text-[1.75rem] text-text-header dark:text-gray-100">
                Finance
              </h1>
            </div>
            <button
              onClick={() => setIsDepositModalOpen(true)}
              className="px-4 py-2 bg-[#1C6B4A] text-white rounded-full text-sm font-medium hover:bg-[#145a3d] transition-colors"
            >
              Deposit Funds
            </button>
          </header>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="p-4"
        >
          {/* Balance Section */}
          <div className="flex flex-col md:flex-row w-full gap-4 md:gap-6 mb-2">
            <BalanceSection balance={ngnBalance} change="" />
            <BalanceSection balance="$5,050.00" change="-0.0051% ($0.99)" />
          </div>

          {/* Assets Grid */}
          <AssetsGrid assets={MOCK_ASSETS} />

          {/* Transactions Table */}
          <div className="mt-6">
            <Table
              data={filteredTransactions}
              columns={transactionColumns}
              search={search}
              setSearch={setSearch}
              showModal={showModal}
              selectedTab="Transactions"
              searchPlaceholder="Search transactions..."
              showSearch={false}
              seeAllHref="/finance/transactions"
              selectedItems={selectedItems}
              onSelectItem={handleSelectItem}
              onSelectAll={handleSelectAll}
              renderCell={renderTransactionCell}
              renderMobileCell={renderMobileCell}
              isLoading={isLoadingTransactions}
              showPagination={true}
              itemsPerPage={itemsPerPage}
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
              showResultsPerPage={true}
              emptyTitle={
                transactionsError
                  ? "Unable to load transactions"
                  : isLoadingTransactions
                    ? "Loading transactions..."
                    : search
                      ? "No transactions found"
                      : "No transactions yet"
              }
              emptyDescription={
                transactionsError
                  ? transactionsError
                  : isLoadingTransactions
                    ? "Fetching recent deposits and withdrawals."
                    : search
                      ? `No transactions match "${search}". Try adjusting your search.`
                      : "Your transactions will appear here"
              }
              getItemId={(item) => item.id}
            />
          </div>
        </motion.div>

        <DepositModal
          open={isDepositModalOpen}
          onOpenChange={setIsDepositModalOpen}
        />
      </div>
    </div>
  );
}

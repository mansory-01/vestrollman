"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, ChevronDown, ShareIcon, CheckCircle, XCircle, Loader2 } from "lucide-react";
import Image from "next/image";
import searchIcon from "@/../public/images/search-payroll.png";
import { FinanceService, PayrollItem } from "@/lib/api/finance";
import { TableSkeleton } from "@/components/ui/skeleton";
import { RequestError } from "@/lib/api-client";
import useModal from "@/hooks/useModal";

import PayoutHistory from "@/app/(dashboard)/payroll/components/PayoutHistory";
import PayrollOverview from "@/app/(dashboard)/payroll/components/PayrollOverview";

type ModalState =
  | { type: "none" }
  | { type: "confirm"; selected: PayrollItem[] }
  | { type: "loading" }
  | { type: "success"; succeeded: number; failed: number; total: number }
  | { type: "error"; message: string };

const currencySymbols: Record<string, string> = {
  NGN: "₦",
  USD: "$",
  USDT: "USDT",
  fiat: "₦",
  crypto: "",
};

function formatAmount(amount: number, currency: string): string {
  const sym = currencySymbols[currency] ?? "$";
  return `${sym}${amount.toLocaleString()}`;
}

function getInitials(first: string, last: string): string {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

export default function PayrollPage() {
  const [activeTab, setActiveTab] = useState("Overview");
  const [search, setSearch] = useState("");
  const [payrollItems, setPayrollItems] = useState<PayrollItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>({ type: "none" });

  const fetchPayroll = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await FinanceService.getPendingPayroll();
      setPayrollItems(data);
    } catch (err) {
      if (err instanceof RequestError) {
        setFetchError(err.details.detail || err.message);
      } else {
        setFetchError("Failed to load payroll data");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayroll();
  }, [fetchPayroll]);

  const filtered = payrollItems.filter((item) => {
    const q = search.toLowerCase();
    const name = `${item.employee.firstName} ${item.employee.lastName}`.toLowerCase();
    return (
      name.includes(q) ||
      item.employee.email.toLowerCase().includes(q) ||
      item.employee.role.toLowerCase().includes(q) ||
      item.invoiceNo.toLowerCase().includes(q)
    );
  });

  const allSelected = filtered.length > 0 && filtered.every((i) => selectedIds.has(i.id));

  function toggleAll() {
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filtered.forEach((i) => next.delete(i.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filtered.forEach((i) => next.add(i.id));
        return next;
      });
    }
  }

  function toggleItem(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  const selectedItems = payrollItems.filter((i) => selectedIds.has(i.id));
  const totalAmount = selectedItems.reduce((sum, i) => sum + i.amount, 0);

  function openConfirm() {
    if (selectedItems.length === 0) return;
    setModal({ type: "confirm", selected: selectedItems });
  }

  async function executePayroll() {
    setModal({ type: "loading" });
    try {
      const result = await FinanceService.submitPayroll({
        invoiceIds: selectedItems.map((i) => i.id),
      });
      setSelectedIds(new Set());
      await fetchPayroll();
      setModal({ type: "success", ...result });
    } catch (err) {
      let msg = "Payroll submission failed. Please try again.";
      if (err instanceof RequestError) {
        msg = err.details.detail || err.message;
      }
      setModal({ type: "error", message: msg });
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F6F7] font-sans dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white border-b border-[#DCE0E5] px-4 sm:px-6 py-4 sm:py-6 dark:bg-gray-900 dark:border-gray-800">
        <div className="max-w-9xl mx-auto">
          <div className="flex sm:flex-row sm:items-center sm:justify-between gap-x-36 mb-6">
            <div>
              <p className="text-sm text-[#6B7280] mb-1 dark:text-gray-400">Overview</p>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] dark:text-white">
                Payroll
              </h1>
            </div>
            <button className="inline-flex items-center justify-center px-4 py-2 h-12 ml-auto md:py-2 bg-[#5E2A8C] text-white font-medium rounded-full hover:bg-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#5E2A8C] focus:ring-offset-2 transition-colors duration-200 gap-2">
              <ShareIcon className="h-4 w-4" />
              Export
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          <div className="flex border-b border-[#E5E7EB] dark:border-gray-800">
            {["Overview", "Payout history"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors duration-200 ${
                  activeTab === tab
                    ? "border-[#5E2A8C] text-[#5E2A8C]"
                    : "border-transparent text-[#6B7280] hover:text-[#374151] dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-9xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <AnimatePresence mode="wait">
          {activeTab === "Overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <PayrollOverview />
            </motion.div>
          )}

          {activeTab === "Payout history" && (
            <motion.div
              key="payout"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <PayoutHistory />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {modal.type !== "none" && (
          <motion.div
            key="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => {
              if (modal.type !== "loading") setModal({ type: "none" });
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6"
            >
              {modal.type === "confirm" && (
                <>
                  <h3 className="text-lg font-semibold text-[#111827] dark:text-white mb-1">
                    Confirm Payroll Run
                  </h3>
                  <p className="text-sm text-[#6B7280] dark:text-gray-400 mb-4">
                    You are about to process payroll for {modal.selected.length} employee
                    {modal.selected.length > 1 ? "s" : ""}.
                  </p>

                  <div className="space-y-2 max-h-48 overflow-y-auto mb-4">
                    {modal.selected.map((item) => (
                      <div key={item.id} className="flex justify-between items-center py-2 border-b border-[#E5E7EB] dark:border-gray-700 last:border-0">
                        <span className="text-sm text-[#374151] dark:text-gray-300">
                          {item.employee.firstName} {item.employee.lastName}
                        </span>
                        <span className="text-sm font-semibold text-[#111827] dark:text-white">
                          {formatAmount(item.amount, item.paidIn)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center py-2 mb-6 border-t-2 border-[#5E2A8C]">
                    <span className="text-sm font-semibold text-[#111827] dark:text-white">Total</span>
                    <span className="text-base font-bold text-[#5E2A8C]">
                      {formatAmount(modal.selected.reduce((s, i) => s + i.amount, 0), "NGN")}
                    </span>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setModal({ type: "none" })}
                      className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-[#374151] dark:text-gray-200 text-sm font-medium rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={executePayroll}
                      className="flex-1 px-4 py-2.5 bg-[#5E2A8C] text-white text-sm font-medium rounded-full hover:bg-[#7C3AED] transition-colors"
                    >
                      Confirm & Pay
                    </button>
                  </div>
                </>
              )}

              {modal.type === "loading" && (
                <div className="flex flex-col items-center py-8">
                  <Loader2 className="h-10 w-10 animate-spin text-[#5E2A8C] mb-4" />
                  <p className="text-base font-semibold text-[#111827] dark:text-white mb-1">
                    Processing Payroll
                  </p>
                  <p className="text-sm text-[#6B7280] dark:text-gray-400">
                    Please wait while we process the payments...
                  </p>
                </div>
              )}

              {modal.type === "success" && (
                <div className="flex flex-col items-center text-center py-4">
                  <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                  <h3 className="text-lg font-semibold text-[#111827] dark:text-white mb-2">
                    Payroll Processed
                  </h3>
                  <p className="text-sm text-[#6B7280] dark:text-gray-400 mb-4">
                    {modal.succeeded} of {modal.total} payment{modal.total > 1 ? "s" : ""} processed successfully.
                    {modal.failed > 0 && ` ${modal.failed} failed.`}
                  </p>
                  <button
                    onClick={() => setModal({ type: "none" })}
                    className="px-8 py-2.5 bg-[#5E2A8C] text-white text-sm font-medium rounded-full hover:bg-[#7C3AED] transition-colors"
                  >
                    Done
                  </button>
                </div>
              )}

              {modal.type === "error" && (
                <div className="flex flex-col items-center text-center py-4">
                  <XCircle className="h-12 w-12 text-red-400 mb-4" />
                  <h3 className="text-lg font-semibold text-[#111827] dark:text-white mb-2">
                    Payroll Failed
                  </h3>
                  <p className="text-sm text-[#6B7280] dark:text-gray-400 mb-4">
                    {modal.message}
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setModal({ type: "none" })}
                      className="px-6 py-2.5 bg-gray-100 dark:bg-gray-700 text-[#374151] dark:text-gray-200 text-sm font-medium rounded-full hover:bg-gray-200 transition-colors"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => setModal({ type: "confirm", selected: selectedItems })}
                      className="px-6 py-2.5 bg-[#5E2A8C] text-white text-sm font-medium rounded-full hover:bg-[#7C3AED] transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

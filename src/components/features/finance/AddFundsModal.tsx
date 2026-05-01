"use client";

import { useEffect, useState } from "react";
import { Building2, Copy, Landmark, Loader2, RefreshCcw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FinanceService, type WalletFundingDetails } from "@/lib/api/finance";

type AddFundsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AddFundsModal({ open, onOpenChange }: AddFundsModalProps) {
  const [wallet, setWallet] = useState<WalletFundingDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<"monnify" | "flutterwave">("monnify");

  useEffect(() => {
    if (!open) {
      return;
    }

    void loadWalletDetails();
  }, [open]);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timer = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function loadWalletDetails() {
    setIsLoading(true);
    setError(null);

    try {
      const data = await FinanceService.getWallet();
      setWallet(data);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Unable to load your funding account details.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function refreshVirtualAccount() {
    setIsRefreshing(true);
    setError(null);

    try {
      const data = await FinanceService.refreshWallet();
      setWallet(data);
    } catch (refreshError) {
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : "Unable to refresh your virtual account.",
      );
    } finally {
      setIsRefreshing(false);
    }
  }

  async function copyAccountNumber() {
    if (!wallet?.virtualAccountNumber) {
      return;
    }

    await navigator.clipboard.writeText(wallet.virtualAccountNumber);
    setCopied(true);
  }

  const showFundingDetails = !!wallet?.hasVirtualAccount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl border-0 p-0 shadow-2xl">
        <div className="overflow-hidden rounded-3xl bg-white">
          <div className="bg-[linear-gradient(135deg,#1C6B4A_0%,#0F172A_100%)] px-6 py-6 text-white">
            <DialogHeader className="space-y-2 text-left">
              <DialogTitle className="text-2xl font-semibold">
                Add Funds
              </DialogTitle>
              <DialogDescription className="text-sm text-white/80">
                Transfer Naira to your dedicated account and your organization
                balance will be funded.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="space-y-4 px-6 py-6">
            {/* Provider Selector */}
            <div className="flex gap-2 rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setSelectedProvider("monnify")}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                  selectedProvider === "monnify"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Monnify
              </button>
              <button
                type="button"
                onClick={() => setSelectedProvider("flutterwave")}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                  selectedProvider === "flutterwave"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Flutterwave
              </button>
            </div>
            {isLoading ? (
              <div className="flex min-h-52 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
                <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading account details
                </div>
              </div>
            ) : showFundingDetails ? (
              <>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                  Send funds from any Nigerian bank to this dedicated account.
                </div>

                <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-white p-2 text-slate-700 shadow-sm">
                      <Landmark className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                        Bank name
                      </p>
                      <p className="mt-1 text-base font-semibold text-slate-900">
                        {wallet?.virtualBankName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-white p-2 text-slate-700 shadow-sm">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                        Account number
                      </p>
                      <div className="mt-1 flex items-center justify-between gap-3">
                        <p className="text-2xl font-semibold tracking-[0.18em] text-slate-900">
                          {wallet?.virtualAccountNumber}
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-full border-slate-300 bg-white px-4"
                          onClick={() => void copyAccountNumber()}
                        >
                          <Copy className="h-4 w-4" />
                          {copied ? "Copied" : "Copy"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
                <div className="space-y-2">
                  <p className="text-lg font-semibold text-slate-900">
                    No virtual account yet
                  </p>
                  <p className="text-sm leading-6 text-slate-600">
                    Generate your organization&apos;s dedicated Naira transfer
                    account to start funding your NGN balance.
                  </p>
                </div>
                <Button
                  type="button"
                  className="w-full rounded-full bg-slate-900 text-white hover:bg-slate-800"
                  onClick={() => void refreshVirtualAccount()}
                  disabled={isRefreshing}
                >
                  {isRefreshing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Refreshing account
                    </>
                  ) : (
                    <>
                      <RefreshCcw className="h-4 w-4" />
                      Refresh Account
                    </>
                  )}
                </Button>
              </div>
            )}

            {error ? (
              <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </p>
            ) : null}

            <div className="flex justify-end">
              <Button
                type="button"
                variant="ghost"
                className="rounded-full px-5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


"use client";

import { useState } from "react";
import { CreditCard, Loader2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FinanceService } from "@/lib/api/finance";
import { RequestError } from "@/lib/api-client";

type DepositModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DepositModal({ open, onOpenChange }: DepositModalProps) {
  const [amount, setAmount] = useState("");
  const [provider, setProvider] = useState<"monnify" | "flutterwave">("monnify");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingTransaction, setPendingTransaction] = useState<{
    reference: string;
    checkoutUrl?: string;
    paymentUrl?: string;
    authorizationUrl?: string;
  } | null>(null);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        setError("Please enter a valid amount");
        setIsLoading(false);
        return;
      }

      const redirectUrl = `${window.location.origin}/finance?status=completed`;
      const result = await FinanceService.initializeDeposit({
        amount: amountNum,
        provider,
        redirectUrl,
      });

      setPendingTransaction({
        reference: result.reference,
        checkoutUrl: result.checkoutUrl,
        paymentUrl: result.paymentUrl,
        authorizationUrl: result.authorizationUrl,
      });

      // Redirect to payment gateway
      const paymentUrl = result.checkoutUrl || result.paymentUrl || result.authorizationUrl;
      if (paymentUrl) {
        window.location.href = paymentUrl;
      }
    } catch (err) {
      if (err instanceof RequestError) {
        setError(err.message);
      } else {
        setError("Failed to initialize deposit. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setAmount("");
    setError(null);
    setPendingTransaction(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md rounded-3xl border-0 p-0 shadow-2xl">
        <div className="overflow-hidden rounded-3xl bg-white">
          <div className="bg-[linear-gradient(135deg,#1C6B4A_0%,#0F172A_100%)] px-6 py-6 text-white">
            <DialogHeader className="space-y-2 text-left">
              <DialogTitle className="text-2xl font-semibold">
                Deposit Funds
              </DialogTitle>
              <DialogDescription className="text-sm text-white/80">
                Add funds to your wallet using card or bank transfer via payment gateway.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="space-y-4 px-6 py-6">
            {pendingTransaction ? (
              <div className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-amber-100 p-2 text-amber-700">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-amber-900">
                      Payment in Progress
                    </p>
                    <p className="mt-1 text-sm text-amber-700">
                      Redirecting to payment gateway...
                    </p>
                    <p className="mt-2 text-xs text-amber-600">
                      Reference: {pendingTransaction.reference}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleDeposit} className="space-y-4">
                {/* Provider Selector */}
                <div className="flex gap-2 rounded-xl bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => setProvider("monnify")}
                    className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                      provider === "monnify"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    Monnify
                  </button>
                  <button
                    type="button"
                    onClick={() => setProvider("flutterwave")}
                    className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                      provider === "flutterwave"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    Flutterwave
                  </button>
                </div>

                {/* Amount Input */}
                <div className="space-y-2">
                  <label htmlFor="amount" className="text-sm font-medium text-slate-700">
                    Amount (NGN)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                      ₦
                    </div>
                    <input
                      id="amount"
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 pl-8 text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                    <AlertCircle className="h-4 w-4 text-rose-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-rose-700">{error}</p>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full rounded-full bg-slate-900 text-white hover:bg-slate-800"
                  disabled={isLoading || !amount}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Proceed to Payment
                    </>
                  )}
                </Button>
              </form>
            )}

            <div className="flex justify-end">
              <Button
                type="button"
                variant="ghost"
                className="rounded-full px-5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                onClick={handleClose}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

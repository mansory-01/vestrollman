"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Building,
  Hash,
  ContactRound,
} from "lucide-react";
import { BankDetailsData } from "../types";
import { EmployeesService } from "@/lib/api/employees";

// ─── Schema ──────────────────────────────────────────────────────────────────

const schema = z.object({
  bankName: z.string().min(1, "Bank name is required"),
  accountNumber: z
    .string()
    .min(6, "Account number must be at least 6 digits")
    .max(25, "Account number cannot exceed 25 digits")
    .regex(/^\d+$/, "Account number must contain only numbers"),
  accountName: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

// ─── Nigerian banks list (common subset) ─────────────────────────────────────

const BANK_OPTIONS = [
  "Access Bank",
  "Citibank Nigeria",
  "Ecobank Nigeria",
  "Fidelity Bank",
  "First Bank of Nigeria",
  "First City Monument Bank (FCMB)",
  "Guaranty Trust Bank (GTBank)",
  "Heritage Bank",
  "Keystone Bank",
  "Polaris Bank",
  "Stanbic IBTC Bank",
  "Standard Chartered Bank",
  "Sterling Bank",
  "Union Bank of Nigeria",
  "United Bank for Africa (UBA)",
  "Unity Bank",
  "Wema Bank",
  "Zenith Bank",
  "Other",
];

// ─── Verification state type ──────────────────────────────────────────────────

type VerificationState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; accountName: string }
  | { status: "error"; message: string };

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  defaultValues: BankDetailsData;
  onNext: (data: BankDetailsData) => void;
  onBack: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Step3PaymentDetails({ defaultValues, onNext, onBack }: Props) {
  const [verification, setVerification] = useState<VerificationState>({
    status: "idle",
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      bankName: defaultValues.bankName,
      accountNumber: defaultValues.accountNumber,
      accountName: defaultValues.accountName,
    },
  });

  const selectedBank = watch("bankName");
  const accountNumber = watch("accountNumber");

  // ── Account verification ────────────────────────────────────────────────────
  const verifyAccount = async () => {
    const valid = await trigger(["bankName", "accountNumber"]);
    if (!valid) return;

    setVerification({ status: "loading" });

    try {
      const result = await EmployeesService.validateAccount({
        bankName: selectedBank,
        accountNumber,
      });

      const resolvedName: string =
        result.accountHolderName ||
        result.accountName ||
        "Account Verified";

      setValue("accountName", resolvedName);
      setVerification({ status: "success", accountName: resolvedName });
    } catch (err) {
      setVerification({
        status: "error",
        message:
          err instanceof Error ? err.message : "Could not verify account",
      });
    }
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const onSubmit = (values: FormValues) => {
    onNext({
      bankName: values.bankName,
      accountNumber: values.accountNumber,
      accountName:
        verification.status === "success"
          ? verification.accountName
          : values.accountName || "",
    });
  };

  const canVerify =
    selectedBank.length > 0 &&
    accountNumber.length >= 6 &&
    /^\d+$/.test(accountNumber);

  const isVerified = verification.status === "success";

  return (
    <form
      id="step3-form"
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6"
    >
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Enter the employee&apos;s bank details. Verify the account number to
        auto-fill the account name before proceeding.
      </p>

      {/* Bank Name */}
      <div className="space-y-1.5">
        <Label htmlFor="bankName">Bank Name</Label>
        <Select
          value={selectedBank}
          onValueChange={(v) => {
            setValue("bankName", v);
            setVerification({ status: "idle" });
          }}
        >
          <SelectTrigger id="bankName" className="w-full">
            <Building className="h-4 w-4 mr-2 text-gray-400 shrink-0" />
            <SelectValue placeholder="Select a bank…" />
          </SelectTrigger>
          <SelectContent className="max-h-72 overflow-y-auto">
            {BANK_OPTIONS.map((b) => (
              <SelectItem key={b} value={b}>
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.bankName && (
          <p className="text-xs text-red-500">{errors.bankName.message}</p>
        )}
      </div>

      {/* Account Number + Verify button */}
      <div className="space-y-1.5">
        <Label htmlFor="accountNumber">Account Number</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Hash className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="accountNumber"
              placeholder="0123456789"
              className="pl-9 tracking-widest font-mono"
              maxLength={25}
              {...register("accountNumber", {
                onChange: () => setVerification({ status: "idle" }),
              })}
            />
          </div>
          <button
            type="button"
            disabled={!canVerify || verification.status === "loading"}
            onClick={verifyAccount}
            className={`
              shrink-0 px-4 py-2 rounded-lg text-sm font-medium border transition-colors
              ${
                canVerify && verification.status !== "loading"
                  ? "border-primary-500 text-primary-600 hover:bg-primary-500/10 dark:text-primary-400 dark:border-primary-400"
                  : "border-gray-200 text-gray-400 cursor-not-allowed dark:border-gray-700"
              }
            `}
          >
            {verification.status === "loading" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Verify"
            )}
          </button>
        </div>
        {errors.accountNumber && (
          <p className="text-xs text-red-500">{errors.accountNumber.message}</p>
        )}
      </div>

      {/* Verification feedback */}
      {verification.status === "success" && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
          <p className="text-sm text-green-700 dark:text-green-300">
            Account verified
          </p>
        </div>
      )}
      {verification.status === "error" && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800">
          <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300">
            {verification.message}
          </p>
        </div>
      )}

      {/* Account Name — read-only, auto-filled */}
      <div className="space-y-1.5">
        <Label htmlFor="accountName">
          Account Name{" "}
          <span className="text-xs font-normal text-gray-400">
            (auto-filled after verification)
          </span>
        </Label>
        <div className="relative">
          <ContactRound className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="accountName"
            placeholder="Verified name will appear here"
            className={`pl-9 ${isVerified ? "bg-gray-50 dark:bg-gray-800 font-medium" : "text-gray-400"}`}
            readOnly
            {...register("accountName")}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          ← Back
        </button>
        <button
          type="submit"
          disabled={!isVerified}
          title={!isVerified ? "Verify account number first" : undefined}
          className={`
            px-5 py-2 rounded-lg text-sm font-medium transition-colors
            ${
              isVerified
                ? "bg-primary-500 text-white hover:bg-primary-600"
                : "bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700"
            }
          `}
        >
          Continue
        </button>
      </div>
    </form>
  );
}


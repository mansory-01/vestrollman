"use client";
import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import OTPVerification from "@/components/shared/otpVerificationModal";
import { AuthService } from "@/lib/api/auth";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/ui/toast";

function VerifyOTPContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const rememberMe = searchParams.get("rememberMe") === "true";
  const { toasts, removeToast, error: showError } = useToast();
  const [isResending, setIsResending] = useState(false);

  const handleVerify = async (otp: string): Promise<boolean> => {
    try {
      const result = await AuthService.verifyLoginOTP({ email, otp, rememberMe }) as any;

      // Store the access token in localStorage/cookie for subsequent requests
      if (result?.accessToken) {
        localStorage.setItem("access_token", result.accessToken);
      }

      router.push("/dashboard");
      return true;
    } catch (err: any) {
      showError(err?.message || "Invalid verification code. Please try again.");
      return false;
    }
  };

  const handleResend = async () => {
    if (isResending) return;
    setIsResending(true);
    try {
      await AuthService.resendLoginOTP(email);
    } catch (err: any) {
      showError(err?.message || "Failed to resend code. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const handleGoBack = () => {
    router.push("/login");
  };

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <OTPVerification
        email={email}
        onVerify={handleVerify}
        onResend={handleResend}
        onGoBack={handleGoBack}
        resendCooldown={60}
      />
    </>
  );
}

function VerifyOTPPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyOTPContent />
    </Suspense>
  );
}

export default VerifyOTPPage;

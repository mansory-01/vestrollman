"use client";
import TitleHeader from "@/components/features/dashboard/TitleHeader";
import avatar from "@/../public/avatar/avatar.png";
import OnboardingCheckList from "@/components/features/dashboard/home/OnboardingCheckList";
import RequiringAttention from "@/components/features/dashboard/home/RequiringAttention";
import QuickAction from "@/components/features/dashboard/home/QuickAction";
import { motion, Variants } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { KybService } from "@/lib/api/kyb";
import type { KybVerificationStatus } from "@/types/kyb";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle, Clock } from "lucide-react";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut" as const,
    },
  },
};

// Terminal statuses that stop polling
const TERMINAL_STATUSES: KybVerificationStatus["status"][] = [
  "verified",
  "approved",
  "rejected",
];

export default function DashboardPage() {
  const [kybStatus, setKybStatus] = useState<KybVerificationStatus | null>(null);
  const pollingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const user = {
    name: "Peter",
    email: "peter@vestroll.com",
    userType: "Administrator",
    avatar: avatar,
  };

  const fetchKybStatus = async () => {
    try {
      const status = await KybService.getStatus();
      setKybStatus(status);
      return status;
    } catch (error) {
      console.error("Failed to fetch KYB status:", error);
      return null;
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchKybStatus();
  }, []);

  useEffect(() => {
    // Start polling when status is pending
    if (kybStatus?.status === "pending" && !pollingRef.current) {
      pollingRef.current = true;
      // Start first poll immediately, then schedule subsequent polls
      const poll = async () => {
        if (!pollingRef.current || !isMountedRef.current) return;

        const status = await fetchKybStatus();

        // Continue polling only if status is still pending and component is mounted
        if (status?.status === "pending" && pollingRef.current && isMountedRef.current) {
          timeoutRef.current = setTimeout(poll, 5000);
        } else if (status) {
          // Terminal state reached - stop polling
          pollingRef.current = false;
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
        }
      };
      poll();
    }

    // Cleanup on unmount or status change
    return () => {
      pollingRef.current = false;
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - polling is controlled via refs

  const renderKybBanner = () => {
    if (!kybStatus || kybStatus.status === "not_started") return null;

    switch (kybStatus.status) {
      case "pending":
        return (
          <Alert className="mb-4">
            <Clock className="h-4 w-4" />
            <AlertTitle>KYB Verification In Progress</AlertTitle>
            <AlertDescription>
              Your KYB verification is being reviewed. We'll notify you once it's complete.
            </AlertDescription>
          </Alert>
        );
      case "verified":
      case "approved":
        return (
          <Alert className="mb-4 border-green-500 bg-green-50 dark:bg-green-950">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800 dark:text-green-200">KYB Verified</AlertTitle>
            <AlertDescription className="text-green-700 dark:text-green-300">
              Your business has been successfully verified. You now have full access to all features.
            </AlertDescription>
          </Alert>
        );
      case "rejected":
        return (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>KYB Verification Rejected</AlertTitle>
            <AlertDescription>
              {kybStatus.rejectionReason || "Your KYB verification was rejected. Please review and resubmit your documents."}
            </AlertDescription>
          </Alert>
        );
      default:
        return null;
    }
  };
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full h-full"
    >
      <motion.header
        variants={itemVariants}
        className="px-6 sm:pt-6 pb-1 space-y-1 sm:space-y-2 bg-white sm:border-b sm:border-[#DCE0E5] sm:pb-5 dark:bg-gray-900 dark:border-gray-800"
      >
        <h1 className="font-bold text-2xl sm:font-semibold sm:text-[1.75rem] text-text-header dark:text-gray-100">
          Welcome back <span className="text-[#9D62D0]">Oreoluwa</span>!
        </h1>
        <p className="text-xs text-[#7F8C9F] font-medium leading-[120%] tracking-[0%] dark:text-gray-400">
          What will you like to do today?
        </p>
      </motion.header>
      {renderKybBanner()}
      <motion.div variants={itemVariants} className="p-2 sm:p-4">
        <OnboardingCheckList />
      </motion.div>
      <motion.div
        variants={itemVariants}
        className="flex flex-col-reverse w-full gap-4 p-2 xl:flex-row sm:p-4"
      >
        <RequiringAttention />
        <QuickAction />
      </motion.div>
    </motion.div>
  );
}

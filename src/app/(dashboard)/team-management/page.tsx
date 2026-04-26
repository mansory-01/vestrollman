"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { NavigationTabs } from "@/components/features/team-management/NavigationTabs";
import TeamMgtTimeSheet from "@/components/features/team-management/time-tracking";
import TeamMgtMilestone from "@/components/features/team-management/milestone";
import TeamMgtExpense from "@/components/features/team-management/expense";
import { Plus } from "lucide-react";
import TeamMgtTimeoff from "@/components/features/team-management/timeoff";
import Link from "next/link";
import TeamMgtEmployees from "@/components/features/team-management/employees";
import { generateMockEmployees } from "@/components/features/team-management/utils";
import { ExportDropdown } from "@/components/features/team-management/ExportDropDown";
import { CreateFirstContact } from "@/components/features/team-management/CreateFirstContact";
import { InvitationManagement } from "@/components/features/team-management/invitations";
import { TeamService } from "@/lib/api/team";
import { useToast } from "@/hooks/useToast";
import { useEffect } from "react";
import { ToastContainer } from "@/components/ui/toast";

const TeamManagementDashboard = () => {
  const [activeTab, setActiveTab] = useState("Employees");
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [invitations, setInvitations] = useState([]);
  const [isInviting, setIsInviting] = useState(false);
  const [invitationError, setInvitationError] = useState<string | null>(null);
  const { toasts, removeToast, success, error: toastError } = useToast();

  const allEmployees = generateMockEmployees();

  const fetchInvitations = async () => {
    setIsInviting(true);
    try {
      const response: any = await TeamService.listInvitations();
      // Handle both { data: [...] } and directly [...]
      const data = response.data || response;
      setInvitations(Array.isArray(data) ? data : (data.data || []));
    } catch (err: any) {
      console.error("Failed to fetch invitations:", err);
      toastError("Failed to load invitations");
    } finally {
      setIsInviting(false);
    }
  };

  useEffect(() => {
    if (activeTab === "Invitations") {
      fetchInvitations();
    }
  }, [activeTab]);

  const handleCreateInvitation = async (data: any) => {
    setIsInviting(true);
    setInvitationError(null);
    try {
      await TeamService.createInvitation(data);
      success("Invitation sent successfully");
      fetchInvitations();
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to send invitation";
      setInvitationError(message);
      toastError(message);
    } finally {
      setIsInviting(false);
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    try {
      await TeamService.resendInvitation({ invitationId });
      success("Invitation resent successfully");
      fetchInvitations();
    } catch (err: any) {
      toastError(err.response?.data?.message || "Failed to resend invitation");
    }
  };

  const handleDeleteInvitation = async (invitationId: string) => {
    try {
      await TeamService.deleteInvitation(invitationId);
      success("Invitation deleted successfully");
      fetchInvitations();
    } catch (err: any) {
      toastError(err.response?.data?.message || "Failed to delete invitation");
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "Employees":
        return <TeamMgtEmployees employees={allEmployees} />;
      case "Time off":
        return <TeamMgtTimeoff />;
      case "Milestone":
        return <TeamMgtMilestone />;
      case "Time tracking":
        return <TeamMgtTimeSheet />;
      case "Expense":
        return <TeamMgtExpense />;
      case "Invitations":
        return (
          <InvitationManagement
            invitations={invitations}
            isLoading={isInviting}
            onCreateInvitation={handleCreateInvitation}
            onResendInvitation={handleResendInvitation}
            onDeleteInvitation={handleDeleteInvitation}
            onRefresh={fetchInvitations}
            error={invitationError}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="bg-white border-b border-gray-200 dark:bg-gray-900 dark:border-gray-800">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500 mb-1 dark:text-gray-400">
                Overview
              </p>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Team management
              </h1>
            </div>
            <div className="flex gap-2">
              <ExportDropdown
                isOpen={isExportOpen}
                onToggle={() => setIsExportOpen(!isExportOpen)}
              />
              {activeTab === "Time off" && (
                <Link
                  className="flex items-center gap-2 bg-primary-500 text-white md:h-10 px-4 rounded-lg"
                  href={"/app/team-management/create-timeoff"}
                >
                  <Plus />{" "}
                  <span className="hidden md:inline">Create request</span>
                </Link>
              )}
            </div>
          </div>
          <NavigationTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </div>

      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
          >
            {allEmployees.length === 0 ? (
              <CreateFirstContact />
            ) : (
              renderTabContent()
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {isExportOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsExportOpen(false)}
        />
      )}

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default TeamManagementDashboard;

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmployeeList } from "@/components/features/team-management/EmployeeList";
import { StatsBar } from "@/components/features/team-management/StatsBar";
import { SearchFilterBar } from "@/components/features/team-management/SearchFilterBar";
import { FilterModal } from "@/components/features/team-management/FilterModal";
import { Pagination } from "@/components/features/team-management/Pagination";
import { TeamEmptyState } from "@/components/features/team-management/TeamEmptyState";
import {
  AddEmployeeWizard,
  WizardFormData,
} from "@/components/features/team-management/add-employee-wizard";
import { getEmployees, addEmployee, EmployeeItem } from "@/lib/api/employees";
import { RequestError } from "@/lib/api-client";
import { Employee } from "@/types/teamManagement.types";

const ITEMS_PER_PAGE = 12;

const filterConfig = [
  {
    key: "status",
    label: "Status",
    options: [
      { label: "Active", value: "Active" },
      { label: "Inactive", value: "Inactive" },
    ],
  },
  {
    key: "type",
    label: "Type",
    options: [
      { label: "Freelancer", value: "Freelancer" },
      { label: "Contractor", value: "Contractor" },
    ],
  },
];

function toEmployee(item: EmployeeItem): Employee {
  return {
    id: item.id as unknown as number, // API returns string; local type uses number
    name: item.name,
    email: item.email,
    role: item.role,
    department: "",
    type: item.type,
    status: item.status,
    avatar: item.avatarUrl ?? undefined,
  };
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({
    status: "All",
    type: "All",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  const fetchEmployees = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getEmployees({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        search: searchQuery || undefined,
        status:
          filters.status !== "All"
            ? (filters.status as "Active" | "Inactive")
            : undefined,
        type:
          filters.type !== "All"
            ? (filters.type as "Freelancer" | "Contractor")
            : undefined,
      });
      setEmployees(result.data.map(toEmployee));
      setTotalEmployees(result.meta.total);
      setTotalPages(result.meta.totalPages);
    } catch (err) {
      setError(
        err instanceof RequestError
          ? err.details.detail
          : "Failed to load employees"
      );
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchQuery, filters]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Reset to page 1 when search/filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters]);

  const handleAddEmployee = async (data: WizardFormData) => {
    await addEmployee({ email: data.basicInfo.email });
    await fetchEmployees();
  };

  const activeCount = employees.filter((e) => e.status === "Active").length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Page header */}
      <div className="bg-white border-b border-gray-200 dark:bg-gray-900 dark:border-gray-800">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1 dark:text-gray-400">
                Overview
              </p>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Employees
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchEmployees}
                disabled={isLoading}
              >
                <RefreshCw
                  className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                />
              </Button>
              <Button
                onClick={() => setIsWizardOpen(true)}
                className="bg-primary-600 hover:bg-primary-700 text-white flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Employee</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        {/* Error banner */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Stats */}
        {!isLoading && totalEmployees > 0 && (
          <StatsBar
            totalEmployees={totalEmployees}
            activeEmployees={activeCount}
          />
        )}

        {/* Search + filter bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 max-w-md">
            <SearchFilterBar
              searchQuery={searchQuery}
              onSearchChange={(q) => setSearchQuery(q)}
              onFilterClick={() => setIsFilterOpen(true)}
            />
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : employees.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 dark:bg-gray-900 dark:border-gray-800">
            <TeamEmptyState onAddEmployee={() => setIsWizardOpen(true)} />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <EmployeeList employees={employees} />
            {totalPages > 1 && (
              <div className="border-t border-gray-200 mt-4 dark:border-gray-800">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalEmployees}
                  itemsPerPage={ITEMS_PER_PAGE}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </motion.div>
        )}
      </div>

      <FilterModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        onApply={(f) => setFilters(f)}
        filterConfiguration={filterConfig}
      />

      <AddEmployeeWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSuccess={handleAddEmployee}
      />
    </div>
  );
}

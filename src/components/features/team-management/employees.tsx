"use client";

import React, { useState } from "react";
import { SearchFilterBar } from "@/components/features/team-management/SearchFilterBar";
import EmptyState from "@/components/ui/EmptyState";
import { TeamEmptyState } from "@/components/features/team-management/TeamEmptyState";
import { Pagination } from "@/components/features/team-management/Pagination";
import { FilterModal } from "@/components/features/team-management/FilterModal";
import { StatsBar } from "@/components/features/team-management/StatsBar";
import { EmployeeList } from "@/components/features/team-management/EmployeeList";
import { useSort } from "@/hooks/use-sort";
import { Employee } from "@/types/teamManagement.types";
import { AddEmployeeWizard, WizardFormData } from "./add-employee-wizard";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TeamMgtEmployeesProps {
  employees: Employee[];
}

const TeamMgtEmployees: React.FC<TeamMgtEmployeesProps> = ({ employees }) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);

  const {
    data: paginatedEmployees,
    currentPage,
    setCurrentPage,
    totalPages,
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    totalItems,
    itemsPerPage,
  } = useSort({
    data: employees,
    searchKeys: ["name"],
    initialFilters: {
      status: "All",
      type: "All",
    },
    itemsPerPage: 12,
  });

  const activeEmployeesCount = employees.filter(
    (emp) => emp.status === "Active",
  ).length;

  const handleFilterApply = (newFilters: Record<string, string>) => {
    setFilters(newFilters);
  };

  const handleAddEmployeeSuccess = async (data: WizardFormData) => {
    // Mocking an API call
    console.log("Adding new employee with wizard data:", data);
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 1500);
    });
  };

  const employeeFilterConfig = [
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

  // Show empty state if no employees passed (handled by parent usually, but safety check)
  if (employees.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <TeamEmptyState onAddEmployee={() => setIsAddEmployeeOpen(true)} />
        <AddEmployeeWizard 
          isOpen={isAddEmployeeOpen} 
          onClose={() => setIsAddEmployeeOpen(false)} 
          onSuccess={handleAddEmployeeSuccess}
        />
      </div>
    );
  }

  return (
    <>
      <StatsBar
        totalEmployees={employees.length}
        activeEmployees={activeEmployeesCount}
      />
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Employees
          </h3>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex-1 md:flex-initial md:min-w-96">
            <SearchFilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onFilterClick={() => setIsFilterOpen(true)}
            />
          </div>
          <Button 
            onClick={() => setIsAddEmployeeOpen(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Member</span>
          </Button>
        </div>
      </div>

      {/* Show "no results" if search/filter returns empty */}
      {totalItems === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 min-h-96 flex items-center justify-center">
          <EmptyState
            title="No employees found"
            description="Try adjusting your search or filter criteria"
          />
        </div>
      ) : (
        <div>
          <EmployeeList employees={paginatedEmployees} />
          {totalPages > 1 && (
            <div className="border-t border-gray-200 mt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      )}

      <FilterModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        onApply={handleFilterApply}
        filterConfiguration={employeeFilterConfig}
      />

      <AddEmployeeWizard 
        isOpen={isAddEmployeeOpen} 
        onClose={() => setIsAddEmployeeOpen(false)} 
        onSuccess={handleAddEmployeeSuccess}
      />
    </>
  );
};

export default TeamMgtEmployees;

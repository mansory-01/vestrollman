"use client";

import React, { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { AlertCircle, Calendar, Users, DollarSign, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";

// Mock data for stat cards
const statsData = {
  totalMonthlyPayout: "₦2,450,000",
  totalEmployees: 24,
  nextPayoutDate: "May 15, 2026",
};

// Mock data for payout overview chart
const payoutChartData = [
  { month: "Jan", payout: 1800000 },
  { month: "Feb", payout: 2100000 },
  { month: "Mar", payout: 1950000 },
  { month: "Apr", payout: 2300000 },
  { month: "May", payout: 2450000 },
  { month: "Jun", payout: 2200000 },
];

// Mock data for payout schedule table
const payoutScheduleData = [
  {
    id: "1",
    name: "Aditya Kadam",
    role: "Software Engineer",
    contractType: "Full-time",
    frequency: "Monthly",
    amount: "₦450,000",
    paidIn: "USDT",
    nextPayout: "May 15, 2026",
    avatar: null,
  },
  {
    id: "2",
    name: "Sarah Chen",
    role: "Product Designer",
    contractType: "Full-time",
    frequency: "Monthly",
    amount: "₦380,000",
    paidIn: "NGN",
    nextPayout: "May 15, 2026",
    avatar: null,
  },
  {
    id: "3",
    name: "Michael Okon",
    role: "DevOps Engineer",
    contractType: "Contract",
    frequency: "Bi-weekly",
    amount: "₦280,000",
    paidIn: "USDT",
    nextPayout: "May 8, 2026",
    avatar: null,
  },
  {
    id: "4",
    name: "Fatima Ibrahim",
    role: "Frontend Developer",
    contractType: "Full-time",
    frequency: "Monthly",
    amount: "₦350,000",
    paidIn: "NGN",
    nextPayout: "May 15, 2026",
    avatar: null,
  },
  {
    id: "5",
    name: "David Paul",
    role: "Backend Developer",
    contractType: "Full-time",
    frequency: "Monthly",
    amount: "₦400,000",
    paidIn: "USDT",
    nextPayout: "May 15, 2026",
    avatar: null,
  },
  {
    id: "6",
    name: "Grace Emen",
    role: "QA Engineer",
    contractType: "Part-time",
    frequency: "Monthly",
    amount: "₦180,000",
    paidIn: "NGN",
    nextPayout: "May 15, 2026",
    avatar: null,
  },
  {
    id: "7",
    name: "James Wilson",
    role: "Tech Lead",
    contractType: "Full-time",
    frequency: "Monthly",
    amount: "₦550,000",
    paidIn: "USDT",
    nextPayout: "May 15, 2026",
    avatar: null,
  },
  {
    id: "8",
    name: "Amina Yusuf",
    role: "UI Designer",
    contractType: "Contract",
    frequency: "Monthly",
    amount: "₦320,000",
    paidIn: "NGN",
    nextPayout: "May 15, 2026",
    avatar: null,
  },
];

const ITEMS_PER_PAGE_OPTIONS = [5, 10, 20];

function getInitials(name: string): string {
  const parts = name.split(" ");
  return parts.map((p) => p[0]).join("").toUpperCase().slice(0, 2);
}

function getTokenColor(token: string): string {
  if (token === "USDT") return "bg-green-100 text-green-700 border-green-200";
  if (token === "NGN") return "bg-blue-100 text-blue-700 border-blue-200";
  return "bg-gray-100 text-gray-700 border-gray-200";
}

function getContractTypeBadge(type: string): string {
  switch (type) {
    case "Full-time":
      return "bg-purple-100 text-purple-700 border-purple-200";
    case "Part-time":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "Contract":
      return "bg-orange-100 text-orange-700 border-orange-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

// Stat Card Component
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  iconBg: string;
}

function StatCard({ icon, label, value, iconBg }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-[#6B7280] font-medium">{label}</p>
          <p className="text-2xl font-bold text-[#111827]">{value}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <span className="text-xs font-medium text-[#5E2A8C] bg-purple-50 px-2 py-1 rounded-full">
          This year
        </span>
      </div>
    </div>
  );
}

// Urgent Action Banner Component
interface UrgentActionBannerProps {
  visible: boolean;
}

function UrgentActionBanner({ visible }: UrgentActionBannerProps) {
  if (!visible) return null;

  return (
    <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 mb-6 text-white shadow-lg">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-1">Urgent: Pending Payroll Action Required</h3>
          <p className="text-sm text-orange-100 mb-4">
            You have 3 payroll items that require immediate attention. Please review and process them to avoid delays.
          </p>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-white text-orange-600 font-medium rounded-full text-sm hover:bg-orange-50 transition-colors duration-200 cursor-pointer">
            View Payroll
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Payout Schedule Table Component
interface PayoutScheduleTableProps {
  data: typeof payoutScheduleData;
}

function PayoutScheduleTable({ data }: PayoutScheduleTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageData = data.slice(startIndex, endIndex);

  const allSelected = currentPageData.length > 0 && currentPageData.every((item) => selectedIds.has(item.id));

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        currentPageData.forEach((item) => next.delete(item.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        currentPageData.forEach((item) => next.add(item.id));
        return next;
      });
    }
  };

  const toggleItem = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
      {/* Table Header */}
      <div className="hidden md:grid grid-cols-[40px_2fr_1fr_1fr_1fr_1fr_1.5fr] gap-4 px-6 py-3 border-b border-[#E5E7EB] bg-[#F9FAFB]">
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            className="w-4 h-4 rounded border-gray-300 text-[#5E2A8C] focus:ring-[#5E2A8C] cursor-pointer"
          />
        </div>
        <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Employee</span>
        <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Contract Type</span>
        <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Frequency</span>
        <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider text-right">Amount</span>
        <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider text-right">Paid In</span>
        <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider text-right">Next Payout Date</span>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-[#E5E7EB]">
        {currentPageData.map((item) => (
          <div
            key={item.id}
            className={`grid md:grid-cols-[40px_2fr_1fr_1fr_1fr_1fr_1.5fr] gap-4 px-6 py-4 transition-colors duration-200 cursor-pointer ${
              selectedIds.has(item.id) ? "bg-[#F5F0FF]" : "hover:bg-[#F9FAFB]"
            }`}
          >
            {/* Checkbox - Desktop */}
            <div className="hidden md:flex items-center" onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox"
                checked={selectedIds.has(item.id)}
                onChange={() => toggleItem(item.id)}
                className="w-4 h-4 rounded border-gray-300 text-[#5E2A8C] focus:ring-[#5E2A8C] cursor-pointer"
              />
            </div>

            {/* Employee */}
            <div className="flex items-center gap-3">
              <div className="md:hidden flex items-center mr-1" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={selectedIds.has(item.id)}
                  onChange={() => toggleItem(item.id)}
                  className="w-4 h-4 rounded border-gray-300 text-[#5E2A8C] focus:ring-[#5E2A8C] cursor-pointer"
                />
              </div>
              {item.avatar ? (
                <img
                  src={item.avatar}
                  alt={item.name}
                  className="w-10 h-10 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#5E2A8C] flex items-center justify-center text-white text-sm font-semibold shrink-0">
                  {getInitials(item.name)}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#111827] truncate">{item.name}</p>
                <p className="text-xs text-[#6B7280] truncate">{item.role}</p>
              </div>
            </div>

            {/* Contract Type */}
            <div className="hidden md:flex items-center">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${getContractTypeBadge(item.contractType)}`}>
                {item.contractType}
              </span>
            </div>

            {/* Frequency */}
            <div className="hidden md:flex items-center">
              <span className="text-sm text-[#374151]">{item.frequency}</span>
            </div>

            {/* Amount */}
            <div className="flex md:justify-end items-center">
              <span className="text-sm font-semibold text-[#111827]">{item.amount}</span>
            </div>

            {/* Paid In */}
            <div className="flex md:justify-end items-center">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${getTokenColor(item.paidIn)}`}>
                {item.paidIn === "USDT" ? "USDT" : "₦"} {item.paidIn}
              </span>
            </div>

            {/* Next Payout Date */}
            <div className="hidden md:flex justify-end items-center">
              <span className="text-sm text-[#374151]">{item.nextPayout}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-[#E5E7EB]">
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#6B7280]">Results per page:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="text-sm border border-[#DCE0E5] rounded-lg px-3 py-2 bg-white text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#5E2A8C] cursor-pointer"
          >
            {ITEMS_PER_PAGE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-[#DCE0E5] text-[#6B7280] hover:bg-[#F9FAFB] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  currentPage === page
                    ? "bg-[#5E2A8C] text-white"
                    : "text-[#6B7280] hover:bg-[#F9FAFB]"
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-[#DCE0E5] text-[#6B7280] hover:bg-[#F9FAFB] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Mobile Card View Component
interface MobilePayoutCardsProps {
  data: typeof payoutScheduleData;
}

function MobilePayoutCards({ data }: MobilePayoutCardsProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageData = data.slice(startIndex, endIndex);

  return (
    <div className="md:hidden space-y-3">
      {currentPageData.map((item) => (
        <div
          key={item.id}
          className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-sm"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              {item.avatar ? (
                <img
                  src={item.avatar}
                  alt={item.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#5E2A8C] flex items-center justify-center text-white text-sm font-semibold">
                  {getInitials(item.name)}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-[#111827]">{item.name}</p>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${getContractTypeBadge(item.contractType)}`}>
                  {item.contractType}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-[#111827]">{item.amount}</p>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${getTokenColor(item.paidIn)}`}>
                {item.paidIn}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#E5E7EB]">
            <div>
              <p className="text-xs text-[#6B7280]">Frequency</p>
              <p className="text-sm text-[#374151]">{item.frequency}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[#6B7280]">Next Payout</p>
              <p className="text-sm text-[#374151]">{item.nextPayout}</p>
            </div>
          </div>
        </div>
      ))}

      {/* Mobile Pagination */}
      <div className="flex items-center justify-between gap-2 pt-4">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          className="px-3 py-2 rounded-lg border border-[#DCE0E5] text-[#6B7280] hover:bg-[#F9FAFB] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        <span className="text-sm text-[#6B7280]">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
          className="px-3 py-2 rounded-lg border border-[#DCE0E5] text-[#6B7280] hover:bg-[#F9FAFB] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}

// Main Payroll Overview Component
export default function PayrollOverview() {
  const [showPendingAction] = useState(true); // Set to false to hide banner

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon={<DollarSign className="w-6 h-6 text-purple-600" />}
          label="Total Monthly Payout"
          value={statsData.totalMonthlyPayout}
          iconBg="bg-purple-100"
        />
        <StatCard
          icon={<Users className="w-6 h-6 text-blue-600" />}
          label="Total Employees"
          value={statsData.totalEmployees}
          iconBg="bg-blue-100"
        />
        <StatCard
          icon={<Calendar className="w-6 h-6 text-green-600" />}
          label="Next Payout Date"
          value={statsData.nextPayoutDate}
          iconBg="bg-green-100"
        />
      </div>

      {/* Urgent Action Banner */}
      <UrgentActionBanner visible={showPendingAction} />

      {/* Payout Overview Chart */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-[#111827] mb-6">Payout Overview</h2>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={payoutChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="month"
                stroke="#6B7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#6B7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `₦${(value / 1000000).toFixed(1)}M`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
                formatter={(value) => {
                  if (typeof value === "number") {
                    return [`₦${value.toLocaleString()}`, "Payout"];
                  }
                  return [String(value), "Payout"];
                }}
              />
              <Line
                type="monotone"
                dataKey="payout"
                stroke="#5E2A8C"
                strokeWidth={3}
                dot={{ fill: "#5E2A8C", strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Payout Schedule */}
      <div>
        <h2 className="text-xl font-semibold text-[#111827] mb-4">Payout Schedule</h2>
        {/* Desktop Table */}
        <div className="hidden md:block">
          <PayoutScheduleTable data={payoutScheduleData} />
        </div>
        {/* Mobile Cards */}
        <div className="md:hidden">
          <MobilePayoutCards data={payoutScheduleData} />
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Filter, Search } from "lucide-react";
import Table from '@/components/shared/table/Table';
import { TableColumn } from '@/components/shared/table/TableHeader';
import { UsdtIcon } from '@/../public/svg';
import { formatCurrency } from '@/utils/formatters';

type ContractType = "Fixed rate" | "Pay as you go" | "Milestone";

interface PayrollRecord {
  id: string;
  employeeName: string;
  employeeRole: string;
  contractType: ContractType;
  amount: number;
  paidIn: string;
  timestamp: string;
}

const MOCK_RECORDS: PayrollRecord[] = [
  {
    id: "1",
    employeeName: "James Akinbiola",
    employeeRole: "Front-end developer",
    contractType: "Fixed rate",
    amount: 1200,
    paidIn: "USDT",
    timestamp: "25th Oct 2025 | 2:00pm",
  },
  {
    id: "2",
    employeeName: "James Akinbiola",
    employeeRole: "Front-end developer",
    contractType: "Pay as you go",
    amount: 1200,
    paidIn: "USDT",
    timestamp: "25th Oct 2025 | 2:00pm",
  },
  {
    id: "3",
    employeeName: "James Akinbiola",
    employeeRole: "Front-end developer",
    contractType: "Milestone",
    amount: 1200,
    paidIn: "USDT",
    timestamp: "25th Oct 2025 | 2:00pm",
  },
  {
    id: "4",
    employeeName: "James Akinbiola",
    employeeRole: "Front-end developer",
    contractType: "Fixed rate",
    amount: 1200,
    paidIn: "USDT",
    timestamp: "25th Oct 2025 | 2:00pm",
  },
  {
    id: "5",
    employeeName: "James Akinbiola",
    employeeRole: "Front-end developer",
    contractType: "Fixed rate",
    amount: 1200,
    paidIn: "USDT",
    timestamp: "25th Oct 2025 | 2:00pm",
  },
  {
    id: "6",
    employeeName: "James Akinbiola",
    employeeRole: "Front-end developer",
    contractType: "Pay as you go",
    amount: 1200,
    paidIn: "USDT",
    timestamp: "25th Oct 2025 | 2:00pm",
  },
  {
    id: "7",
    employeeName: "James Akinbiola",
    employeeRole: "Front-end developer",
    contractType: "Milestone",
    amount: 1200,
    paidIn: "USDT",
    timestamp: "25th Oct 2025 | 2:00pm",
  },
  {
    id: "8",
    employeeName: "James Akinbiola",
    employeeRole: "Front-end developer",
    contractType: "Fixed rate",
    amount: 1200,
    paidIn: "USDT",
    timestamp: "25th Oct 2025 | 2:00pm",
  },
];

const CONTRACT_TYPE_STYLES: Record<ContractType, string> = {
  "Fixed rate": "border-[#5E2A8C] text-[#5E2A8C] bg-white",
  "Pay as you go": "border-[#5E2A8C] text-[#5E2A8C] bg-white",
  Milestone: "border-[#5E2A8C] text-[#5E2A8C] bg-white",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const columns: TableColumn[] = [
  { key: "employee", header: "Employee", width: "2fr" },
  { key: "contractType", header: "Contract type", width: "1.5fr" },
  { key: "amount", header: "Amount", align: "center" },
  { key: "paidIn", header: "Paid in", align: "center" },
  { key: "timestamp", header: "Timestamp", align: "right" },
];

const SkeletonRow = () => (
  <div className="flex items-center px-4 py-4 border-b border-gray-100 animate-pulse">
    <div className="w-6 mr-4">
      <div className="w-4 h-4 bg-gray-200 rounded" />
    </div>
    <div
      className="flex-1 grid gap-4"
      style={{ gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr" }}
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gray-200 shrink-0" />
        <div className="space-y-1.5">
          <div className="h-3 w-28 bg-gray-200 rounded" />
          <div className="h-2.5 w-20 bg-gray-100 rounded" />
        </div>
      </div>
      <div className="h-6 w-24 bg-gray-200 rounded-full" />
      <div className="h-3 w-16 bg-gray-200 rounded mx-auto" />
      <div className="h-6 w-16 bg-gray-200 rounded-full mx-auto" />
      <div className="h-3 w-28 bg-gray-200 rounded ml-auto" />
    </div>
  </div>
);

const PayoutHistory = () => {
  const [search, setSearch] = useState("");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  const filtered = MOCK_RECORDS.filter((r) =>
    r.employeeName.toLowerCase().includes(search.toLowerCase()),
  );

  const renderCell = (item: PayrollRecord, column: TableColumn) => {
    switch (column.key) {
      case "employee":
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#EDE9FE] flex items-center justify-center shrink-0">
              <span className="text-xs font-semibold text-[#5E2A8C]">
                {getInitials(item.employeeName)}
              </span>
            </div>
            <div>
              <p className="font-semibold text-[#111827] text-sm">
                {item.employeeName}
              </p>
              <p className="text-xs text-[#6B7280]">{item.employeeRole}</p>
            </div>
          </div>
        );
      case "contractType":
        return (
          <span
            className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${CONTRACT_TYPE_STYLES[item.contractType]}`}
          >
            {item.contractType}
          </span>
        );
      case "amount":
        return (
          <span className="font-semibold text-[#111827]">
            ${item.amount.toLocaleString()}.00
          </span>
        );
      case "paidIn":
        return (
          <div className="flex items-center gap-1 py-1.5 px-3 border border-border-primary bg-fill-background rounded-full w-fit mx-auto">
            <UsdtIcon />
            <span className="text-sm font-medium text-[#111827]">
              {item.paidIn}
            </span>
          </div>
        );
      case "timestamp":
        return <span className="text-sm text-[#6B7280]">{item.timestamp}</span>;
      default:
        return null;
    }
  };

  const renderMobileCell = (item: PayrollRecord) => (
    <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="font-bold text-[#111827] text-base">
          {item.employeeName}
        </p>
        <span
          className={`inline-flex shrink-0 px-3 py-1 rounded-full text-xs font-semibold border ${CONTRACT_TYPE_STYLES[item.contractType]}`}
        >
          {item.contractType}
        </span>
      </div>
      <div className="flex items-center gap-2 text-sm text-[#6B7280]">
        <span className="font-semibold text-[#111827]">
          ${item.amount.toLocaleString()}.00
        </span>
        <span className="text-[#DCE0E5]">|</span>
        <div className="flex items-center gap-1">
          <UsdtIcon />
          <span className="font-medium text-[#111827]">{item.paidIn}</span>
        </div>
        <span className="text-[#DCE0E5]">|</span>
        <span>{item.timestamp}</span>
      </div>
    </div>
  );

  const handleSelectItem = (id: string, checked: boolean) => {
    setSelectedItems((prev) =>
      checked ? [...prev, id] : prev.filter((i) => i !== id),
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedItems(checked ? filtered.map((r) => r.id) : []);
  };

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-[#E5E7EB]">
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-[#E5E7EB]">
        <h2 className="text-base font-semibold text-[#111827]">History</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-[#DCE0E5] rounded-lg w-44 sm:w-64 focus:outline-none focus:ring-2 focus:ring-[#5E2A8C] focus:border-[#5E2A8C] placeholder-[#9CA3AF] dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
            />
          </div>
          <button className="flex items-center justify-center p-2 border border-[#DCE0E5] rounded-lg text-[#6B7280] hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
            <Filter className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div>
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      ) : (
        <Table
          showFilterHeader={false}
          showCheckbox={true}
          data={filtered}
          columns={columns}
          search={search}
          setSearch={setSearch}
          showModal={() => {}}
          selectedItems={selectedItems}
          onSelectItem={handleSelectItem}
          onSelectAll={handleSelectAll}
          renderCell={renderCell}
          renderMobileCell={renderMobileCell}
          emptyTitle={search ? "No results found" : "No payout history yet"}
          emptyDescription={
            search
              ? `No records match "${search}". Try a different name.`
              : "Payroll payouts will appear here once processed."
          }
        />
      )}
    </div>
  );
};

export default PayoutHistory;

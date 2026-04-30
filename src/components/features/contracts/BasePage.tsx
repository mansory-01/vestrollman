"use client";

import { useEffect, useState } from "react";
import { Contract } from "@/lib/data/contracts";
import { FinanceService } from "@/lib/api/finance";
import FirstContractBanner from "./ui/FirstContractBanner";
import ContractHistory from "./ContractHistory";
import ContractMetrics from "./ui/ContractMetrics";

export default function BasePage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    FinanceService.getContracts()
      .then(setContracts)
      .catch(() => setContracts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="px-3 sm:px-6">
      <div className="space-y-4">
        {!loading && (contracts.length > 0 ? <ContractMetrics /> : <FirstContractBanner />)}
        <ContractHistory contracts={contracts} loading={loading} />
      </div>
    </section>
  );
}

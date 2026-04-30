"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import InputField from "@/components/ui/input-field";
import { CountrySelect, CustomSelect } from "../[components]/select-components";
import { OrganizationApi } from "@/lib/api/organization";

const regions = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","Gombe","Imo","Jigawa",
  "Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa","Niger",
  "Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe",
  "Zamfara","Federal Capital Territory",
];

const countries = [{ name: "Nigeria", flag: "/nigeria.svg" }];

export default function RegisteredAddressPage() {
  const [formData, setFormData] = useState({
    addressLine: "",
    alternateAddress: "",
    city: "",
    region: "",
    country: "Nigeria",
    postalCode: "",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Pre-fill from API
  useEffect(() => {
    OrganizationApi.getProfile()
      .then((profile) => {
        const r = profile.registered;
        setFormData((prev) => ({
          ...prev,
          addressLine: r.street ?? "",
          city: r.city ?? "",
          region: r.state ?? "",
          country: r.country ?? "Nigeria",
          postalCode: r.postalCode ?? "",
        }));
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const { addressLine, city, region, country, postalCode } = formData;
  const isFormValid = !!(addressLine && city && region && country && postalCode);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsSaving(true);
    try {
      await OrganizationApi.updateProfile({
        registered: {
          street: formData.addressLine || null,
          city: formData.city || null,
          state: formData.region || null,
          postalCode: formData.postalCode || null,
          country: formData.country || null,
        },
      });
      setSuccessMsg("Registered address saved successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="">
      <div className="mb-3 lg:mb-6 bg-white py-6 px-4">
        <Link
          href="/settings"
          className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">
          Registered address
        </h1>
      </div>

      <div className="max-w-2xl mx-auto p-2">
        <div className="bg-white p-6 sm:p-8 rounded-lg shadow-sm">
          {isLoading ? (
            <p className="text-center text-gray-500 py-8">Loading…</p>
          ) : (
            <form className="space-y-6 text-black" onSubmit={handleSubmit}>
              <InputField
                id="addressLine"
                label="Address line"
                value={formData.addressLine}
                onChange={handleInputChange}
                placeholder="-- "
              />
              <InputField
                id="alternateAddress"
                label="Alternate Address line (optional)"
                value={formData.alternateAddress}
                onChange={handleInputChange}
                placeholder="-- "
              />
              <InputField
                id="city"
                label="City"
                value={formData.city}
                onChange={handleInputChange}
                placeholder="-- "
              />
              <CustomSelect
                label="Region/State/Province"
                options={regions}
                value={formData.region}
                onChange={(value) => handleSelectChange("region", value)}
                placeholder="-- "
              />
              <CountrySelect
                label="Country"
                options={countries}
                value={formData.country}
                onChange={(value) => handleSelectChange("country", value)}
              />
              <InputField
                id="postalCode"
                label="Postal code / ZIP"
                value={formData.postalCode}
                onChange={handleInputChange}
                placeholder="-- "
              />

              {error && <p className="text-sm text-red-600">{error}</p>}
              {successMsg && <p className="text-sm text-green-600">{successMsg}</p>}

              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={!isFormValid || isSaving}
                  className={`w-full text-white px-8 py-6 rounded-lg text-base font-semibold ${
                    isFormValid && !isSaving
                      ? "bg-[#5E2A8C] hover:bg-[#4A1F73]"
                      : "bg-gray-500 cursor-not-allowed"
                  }`}
                >
                  {isSaving ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

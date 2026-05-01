"use client";
import { motion, AnimatePresence } from "framer-motion";

import Image from "next/image";
import Link from "next/link";
import React, { useState, useCallback, useEffect } from "react";
import { OrganizationApi, type CompanyProfile } from "@/lib/api/organization";
import {
  UsersIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  BellIcon,
  CreditCardIcon,
} from "@heroicons/react/24/outline";
import { ArrowLeft, Camera } from "lucide-react";
import ImageUploadModal from "@/components/features/profile-settings/ImageUploadModal";

interface StatProps {
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  value: string;
}

function Stat({ Icon, label, value }: StatProps) {
  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f5f3ff] dark:bg-gray-800">
        <Icon className="h-5 w-5 text-(--violet-base)" />
      </div>
      <div className="leading-tight flex flex-col-reverse items-center gap-1.5 text-center sm:items-start sm:text-left">
        <div className="text-xs sm:text-sm text-[#6b7280] dark:text-gray-400">
          {label}
        </div>
        <div className="text-base sm:text-lg font-semibold text-[#111827] dark:text-gray-100  text-left">
          {value}
        </div>
      </div>
    </div>
  );
}

interface SectionCardProps {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

function SectionCard({ title, action, children }: SectionCardProps) {
  return (
    <section className="rounded-xl border border-[#e5e7eb] bg-white shadow-sm dark:bg-gray-900 dark:border-gray-800">
      <div className="group flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-[#eef2f7] dark:border-gray-800">
        <h2 className="text-lg font-semibold text-[#1f2937] dark:text-gray-200">
          {title}
        </h2>
        {action}
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </section>
  );
}

interface FieldRowProps {
  label: string;
  value?: React.ReactNode;
  right?: React.ReactNode;
}

function FieldRow({ label, value, right }: FieldRowProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2 sm:gap-6 px-3 sm:px-4 py-3 rounded-lg bg-[#f8fafc] dark:bg-gray-800/50">
      <div className="text-sm text-[#6b7280] dark:text-gray-400">{label}</div>
      <div className="flex items-center justify-end gap-3 sm:col-span-2">
        <div className="text-sm sm:text-base text-[#111827] text-right dark:text-gray-200">
          {value ?? <span className="text-[#9ca3af]">--</span>}
        </div>
        {right}
      </div>
    </div>
  );
}
function HeaderTab({
  tabs,
  activeTab,
  setActiveTab,
}: {
  tabs: string[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
}) {
  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
  };
  return (
    <div className="px-4 pt-6 mb-3 bg-white lg:mb-6">
      <div>
        <Link
          href="/settings"
          className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">Settings </h1>
      </div>
      <div className="flex items-center gap-2.5 md:gap-6">
        {tabs.map((tab) => (
          <button
            onClick={() => handleTabClick(tab)}
            key={tab}
            className={`inline-block cursor-pointer mt-2 border-b-3 pb-1.5 text-xs sm:text-sm font-medium rounded-t-lg ${
              tab === activeTab
                ? "border-b-(--violet-base) "
                : "text-gray-600 border-b-transparent hover:text-gray-900"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Page() {
  const [activeTab, setActiveTab] = useState("Company");
  const tabs = ["Company", "Permissions", "Payment Methods", "Notifications"];

  // ── Org profile ─────────────────────────────────────────────────────────────
  const [profile, setProfile] = useState<CompanyProfile | null>(null);

  useEffect(() => {
    OrganizationApi.getProfile()
      .then(setProfile)
      .catch(() => {}); // silently fall back to placeholder UI
  }, []);

  // ── Logo state ──────────────────────────────────────────────────────────────
  const [logoSrc, setLogoSrc] = useState("/touchpoint360.png");
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Track the current blob URL so we can revoke it on any path (success/error/unmount)
  const currentBlobUrlRef = React.useRef<string | null>(null);

  // Revoke a blob URL and clear the ref
  const revokeBlobUrl = useCallback(() => {
    if (currentBlobUrlRef.current) {
      URL.revokeObjectURL(currentBlobUrlRef.current);
      currentBlobUrlRef.current = null;
    }
  }, []);

  /**
   * 3-step logo upload:
   *  1. GET /api/v1/organizations/logo-upload-url → { signedUrl, key }
   *  2. PUT blob → S3 via signedUrl
   *  3. PATCH /api/v1/organizations/logo { key } → { logoUrl }
   *
   * Optimistic update: show the local blob URL immediately while upload runs.
   */
  const handleLogoSave = useCallback(async (file: File) => {
    setUploadError(null);

    // Revoke any previous blob URL before creating a new one
    revokeBlobUrl();

    // Optimistic UI: swap logo immediately so the user sees their crop right away
    const localUrl = URL.createObjectURL(file);
    currentBlobUrlRef.current = localUrl;
    setLogoSrc(localUrl);
    setIsLogoModalOpen(false);

    setIsUploadingLogo(true);
    try {
      // Step 1 — get presigned S3 upload URL via the service
      const { signedUrl, key } = await OrganizationApi.getLogoUploadUrl(
        file.name,
        file.type
      );

      // Step 2 — upload blob directly to S3 (external URL, raw fetch is intentional)
      const s3Res = await fetch(signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!s3Res.ok) throw new Error("Failed to upload logo to storage");

      // Step 3 — save the S3 key to the database via the service
      const { logoUrl } = await OrganizationApi.updateLogo(key);

      // Replace optimistic blob URL with the permanent CDN URL
      revokeBlobUrl();
      setLogoSrc(logoUrl);
    } catch (err) {
      console.error("[Logo upload error]", err);
      setUploadError(
        err instanceof Error ? err.message : "Logo upload failed",
      );
      // Keep the optimistic blob URL visible; it will be revoked on next save or unmount
    } finally {
      setIsUploadingLogo(false);
    }
  }, [revokeBlobUrl]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <HeaderTab
          tabs={tabs}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      </motion.div>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit={{ opacity: 0, y: -15 }}
          className="pb-8"
        >
          <motion.div
            variants={itemVariants}
            className="rounded-xl border border-[#e5e7eb] bg-white p-4 sm:p-6 shadow-sm dark:bg-gray-900 dark:border-gray-800 max-w-213 mx-4 mt-4 "
          >
            <div className="flex flex-col items-center gap-4 text-center md:block sm:items-center sm:justify-start sm:text-left">
              <div className="items-center gap-8 md:flex">
                {/* ── Company logo with camera-overlay Edit trigger ── */}
                <div className="relative group mx-auto md:mx-0 w-24 h-24 sm:w-28 sm:h-28 shrink-0">
                  <Image
                    src={logoSrc}
                    alt="Company logo"
                    fill
                    className="object-cover rounded-xl"
                    unoptimized={logoSrc.startsWith("blob:")}
                  />
                  {/* Upload spinner overlay */}
                  {isUploadingLogo && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40">
                      <svg
                        className="h-6 w-6 animate-spin text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8z"
                        />
                      </svg>
                    </div>
                  )}
                  {/* Camera hover overlay */}
                  {!isUploadingLogo && (
                    <button
                      type="button"
                      onClick={() => setIsLogoModalOpen(true)}
                      aria-label="Edit company logo"
                      className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    >
                      <Camera className="h-6 w-6 text-white" />
                    </button>
                  )}
                </div>

                <div>
                  <h2 className="text-3xl sm:text-3xl font-semibold text-[#111827] dark:text-white">
                    {profile?.name ?? "—"}
                  </h2>

                  {uploadError && (
                    <p className="text-xs text-red-500 mt-1">{uploadError}</p>
                  )}

                  <div className="flex flex-wrap items-center justify-center gap-5 py-4 sm:gap-4 sm:pt-4 sm:justify-start md:gap-10">
                    <Stat Icon={UsersIcon} label="Active members" value="20" />
                    <div
                      className="hidden sm:block h-10 w-px bg-[#e5e7eb] dark:bg-gray-700"
                      aria-hidden="true"
                    />
                    <Stat Icon={GlobeAltIcon} label="Countries" value="04" />
                    <div
                      className="hidden sm:block h-10 w-px bg-[#e5e7eb] dark:bg-gray-700"
                      aria-hidden="true"
                    />
                    <Stat
                      Icon={ShieldCheckIcon}
                      label="Administrators"
                      value="02"
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="mx-4 mt-6 max-w-213">
            <SectionCard
              title="Company information"
              action={
                <Link
                  href="/settings/company/company-info"
                  className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium text-(--violet-base) border-(--violet-base) hover:bg-(--violet-hover) hover:text-white active:bg-(--violet-active) transition-colors"
                  aria-label="Edit company information"
                >
                  <Image
                    src="/edit.svg"
                    width={16}
                    height={16}
                    alt=""
                    aria-hidden
                    className="transition group-hover:invert group-hover:brightness-0 dark:invert"
                  />
                  Edit
                </Link>
              }
            >
              <div className="space-y-3">
                <FieldRow label="Company/Brand name" value={profile?.name} />
                <FieldRow label="Registered name" value={profile?.name} />
                <FieldRow
                  label="Registration Number/EIN ID"
                  value={profile?.registrationNumber ?? undefined}
                />
                <FieldRow
                  label="Country of incorporation"
                  value={
                    profile?.registered.country ? (
                      <span>{profile.registered.country}</span>
                    ) : undefined
                  }
                />
                <FieldRow label="Size" value={undefined} />
                <FieldRow label="VAT number" value={undefined} />
                <FieldRow label="Company public website URL" value={undefined} />
              </div>
            </SectionCard>
          </motion.div>

          <motion.div variants={itemVariants} className="mx-4 mt-6 max-w-213">
            <SectionCard title="Addresses">
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-[#6b7280] mb-2 dark:text-gray-400">
                    Billing address
                  </div>
                  {profile?.billing.street ? (
                    <div className="flex items-center justify-between px-4 py-4 border border-gray-300 rounded-xl dark:border-gray-700 dark:bg-gray-800/50">
                      <span className="text-sm dark:text-gray-300">
                        {[profile.billing.street, profile.billing.city, profile.billing.state, profile.billing.country]
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                      <Link
                        href="/settings/company/addresses/billing-address"
                        className="text-sm text-(--violet-base) hover:underline ml-4 shrink-0"
                      >
                        Edit
                      </Link>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-4 border border-gray-300 rounded-xl dark:border-gray-700 dark:bg-gray-800/50">
                      <Image src="/warning.svg" width={20} height={20} alt="Warning" />
                      <div className="text-sm dark:text-gray-300">
                        Please{" "}
                        <Link
                          className="underline decoration-(--violet-base) text-(--violet-base) hover:no-underline"
                          href="/settings/company/addresses/billing-address"
                        >
                          add
                        </Link>{" "}
                        your company billing address
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-sm text-[#6b7280] mb-2 dark:text-gray-400">
                    Registered address
                  </div>
                  {profile?.registered.street ? (
                    <div className="flex items-center justify-between px-4 py-4 border border-gray-300 rounded-xl dark:border-gray-700 dark:bg-gray-800/50">
                      <span className="text-sm dark:text-gray-300">
                        {[profile.registered.street, profile.registered.city, profile.registered.state, profile.registered.country]
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                      <Link
                        href="/settings/company/addresses/registered-address"
                        className="text-sm text-(--violet-base) hover:underline ml-4 shrink-0"
                      >
                        Edit
                      </Link>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-4 border border-gray-300 rounded-xl dark:border-gray-700 dark:bg-gray-800/50">
                      <Image src="/warning.svg" width={20} height={20} alt="Warning" />
                      <div className="text-sm dark:text-gray-300">
                        Please{" "}
                        <Link
                          className="underline decoration-(--violet-base) text-(--violet-base) hover:no-underline"
                          href="/settings/company/addresses/registered-address"
                        >
                          add
                        </Link>{" "}
                        your registered address
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </SectionCard>
          </motion.div>
          {/* Email Notifications & Security hookup */}
          {activeTab === "Notifications" && (
            <motion.div variants={itemVariants} className="mx-4 mt-6 max-w-213">
              <SectionCard
                title="Email Notification Preferences"
                action={<BellIcon className="h-5 w-5 text-gray-400" />}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-xl hover:bg-gray-50 transition-colors">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Security Alerts</h4>
                      <p className="text-xs text-gray-500">Get notified about new logins and password changes</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-xl hover:bg-gray-50 transition-colors">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Payroll Reports</h4>
                      <p className="text-xs text-gray-500">Receive weekly summaries of outbound transactions</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                </div>
              </SectionCard>
            </motion.div>
          )}

          {/* Payment Methods Config */}
          {activeTab === "Payment Methods" && (
            <motion.div variants={itemVariants} className="mx-4 mt-6 max-w-213">
              <SectionCard
                title="Fiat Payment Processors"
                action={<CreditCardIcon className="h-5 w-5 text-gray-400" />}
              >
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 mb-4">Select your preferred payment processor for virtual accounts and fiat disbursement. This preference is used globally for NGN routing.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="relative flex flex-col p-5 border-2 cursor-pointer rounded-xl hover:bg-gray-50 border-purple-600 bg-purple-50">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-gray-900">Monnify</span>
                        <input type="radio" name="paymentProvider" value="monnify" className="w-5 h-5 text-purple-600 focus:ring-purple-500" defaultChecked />
                      </div>
                      <span className="text-sm text-gray-500">Fast virtual account generation and reliable NGN disbursement. Default choice.</span>
                    </label>
                    <label className="relative flex flex-col p-5 border cursor-pointer rounded-xl hover:bg-gray-50 border-gray-200">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-gray-900">Flutterwave</span>
                        <input type="radio" name="paymentProvider" value="flutterwave" className="w-5 h-5 text-purple-600 focus:ring-purple-500" />
                      </div>
                      <span className="text-sm text-gray-500">Alternative processor for backup and specialized remittance rails.</span>
                    </label>
                  </div>
                </div>
              </SectionCard>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── Company Logo Crop Modal ── */}
      <ImageUploadModal
        isOpen={isLogoModalOpen}
        onClose={() => setIsLogoModalOpen(false)}
        onSave={handleLogoSave}
        currentImage={logoSrc}
        shape="square"
      />
    </>
  );
}



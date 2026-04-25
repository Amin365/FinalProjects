import React from "react";

/**
 * MemberDetailsSkeleton
 * - Clean, accessible skeleton for MemberDetails page
 * - Mirrors header, hero card, left details and right contact/meta columns
 * - Uses Tailwind utility classes and animate-pulse
 * - Now supports dark mode with appropriate color variants
 */
export default function MemberDetailsSkeleton() {
  return (
    <div className="max-w-5xl mx-auto p-4" role="status" aria-label="Loading member details">
      {/* Top header skeleton */}
      <div className="flex items-center gap-4 mb-6 animate-pulse">
        <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700" />
        <div className="flex-1">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-48 mb-3" />
          <div className="flex gap-3">
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-28" />
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-20" />
          </div>
        </div>
        <div className="flex gap-3">
          <div className="h-9 w-28 bg-slate-200 dark:bg-slate-700 rounded-lg" />
          <div className="h-9 w-28 bg-slate-200 dark:bg-slate-700 rounded-lg" />
          <div className="h-9 w-9 bg-slate-200 dark:bg-slate-700 rounded-lg" />
        </div>
      </div>

      {/* Profile Header Card skeleton */}
      <div className="rounded-2xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="h-32 bg-gradient-to-r from-orange-300 to-orange-500" />
        <div className="px-6 md:px-8 pb-7">
          <div className="flex flex-col md:flex-row items-start md:items-center -mt-12 gap-5 md:gap-6">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl border-4 border-white dark:border-slate-800 shadow-xl bg-slate-200 dark:bg-slate-700" />
            <div className="flex-1 min-w-0">
              <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/5 mb-3" />
              <div className="mt-2 flex items-center gap-3">
                <div className="h-8 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-8 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
              </div>

              <div className="mt-3 flex items-center gap-3">
                <div className="h-4 w-28 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
              </div>
            </div>

            <div className="flex flex-col items-stretch gap-2 w-36">
              <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-xl" />
              <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Details grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Left column (two stacked cards) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="animate-pulse">
              <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-44 mb-4" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="animate-pulse">
              <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-44 mb-4" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full" />
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full sm:col-span-2" />
              </div>
            </div>
          </div>
        </div>

        {/* Right column (contact + metadata) */}
        <div className="space-y-6">
          <div className="rounded-2xl p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="animate-pulse">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-36 mb-4" />
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700" />
                  <div className="flex-1">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700" />
                  <div className="flex-1">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3 mb-2" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="animate-pulse">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-36 mb-4" />
              <div className="space-y-3">
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
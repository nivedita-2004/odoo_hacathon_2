import React from 'react';

export default function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-6 pb-10 animate-pulse">
      {/* Top Banner Skeleton */}
      <div className="h-40 w-full rounded-xl bg-slate-200"></div>

      {/* KPIs Skeleton */}
      <div className="grid grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex justify-between items-start">
               <div className="space-y-3 w-full">
                 <div className="h-3 w-20 rounded bg-slate-200"></div>
                 <div className="h-8 w-12 rounded bg-slate-200"></div>
               </div>
               <div className="h-10 w-10 rounded bg-slate-200"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area Skeletons */}
      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-3 rounded-xl border border-gray-100 bg-white p-6 h-64">
           <div className="h-5 w-40 rounded bg-slate-200 mb-6"></div>
           <div className="space-y-4">
             <div className="h-8 w-full rounded bg-slate-100"></div>
             <div className="h-8 w-full rounded bg-slate-100"></div>
             <div className="h-8 w-full rounded bg-slate-100"></div>
           </div>
        </div>
        <div className="col-span-2 rounded-xl border border-gray-100 bg-white p-6 h-64">
           <div className="h-5 w-40 rounded bg-slate-200 mb-6"></div>
           <div className="h-40 w-full rounded bg-slate-100"></div>
        </div>
      </div>
    </div>
  );
}

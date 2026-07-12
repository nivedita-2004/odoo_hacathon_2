import React from 'react';

export default function ListSkeleton() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-6 pb-10 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center mb-8">
         <div className="space-y-2">
           <div className="h-6 w-48 rounded bg-slate-200"></div>
           <div className="h-4 w-72 rounded bg-slate-100"></div>
         </div>
         <div className="h-10 w-32 rounded-lg bg-slate-200"></div>
      </div>

      {/* Toolbar Skeleton */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
         <div className="h-9 w-64 rounded bg-slate-100"></div>
         <div className="flex gap-2">
           <div className="h-9 w-24 rounded bg-slate-100"></div>
           <div className="h-9 w-24 rounded bg-slate-100"></div>
         </div>
      </div>

      {/* Table Skeleton */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm border border-gray-100">
        <div className="border-b border-gray-100 bg-gray-50 px-6 py-4 flex gap-4">
           {[...Array(5)].map((_, i) => (
             <div key={i} className="h-4 flex-1 rounded bg-slate-200"></div>
           ))}
        </div>
        <div className="divide-y divide-gray-50">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex gap-4 px-6 py-5">
              {[...Array(5)].map((_, j) => (
                <div key={j} className="h-4 flex-1 rounded bg-slate-100"></div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import { Skeleton } from './skeleton';

export function SkeletonDashboard() {
  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-6 animate-pulse">
      {/* Balance Card Skeleton */}
      <div className="w-full rounded-[24px] p-6 bg-card border border-border/60 min-h-[160px] flex flex-col justify-between relative overflow-hidden">
        <div>
          <Skeleton className="w-32 h-4 mb-3" />
          <Skeleton className="w-64 h-12" />
        </div>
        <Skeleton className="w-40 h-5 mt-4" />
      </div>

      {/* Accounts List Skeleton */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <Skeleton className="w-24 h-4" />
          <Skeleton className="w-12 h-4" />
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {[...Array(3)].map((_, idx) => (
            <div
              key={idx}
              className="min-w-[180px] sm:min-w-[220px] rounded-2xl border border-border bg-card p-4 flex flex-col justify-between h-[96px] shrink-0"
            >
              <Skeleton className="w-20 h-3 mb-2" />
              <Skeleton className="w-32 h-6" />
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions Grid Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
        {[...Array(4)].map((_, idx) => (
          <div key={idx} className="flex flex-col items-center justify-center gap-3 p-4 bg-card border border-border rounded-[20px] h-[116px]">
            <Skeleton className="w-12 h-12 rounded-full" />
            <Skeleton className="w-16 h-4" />
          </div>
        ))}
      </div>

      {/* Main Stats Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(2)].map((_, idx) => (
          <div key={idx} className="p-6 bg-card border border-border rounded-[24px] h-[138px] flex flex-col justify-between">
            <div>
              <Skeleton className="w-20 h-4 mb-3" />
              <Skeleton className="w-40 h-8" />
            </div>
            <Skeleton className="w-48 h-4" />
          </div>
        ))}
      </div>

      {/* Charts Section Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cashflow Chart Card */}
        <div className="lg:col-span-2 p-6 bg-card border border-border rounded-[24px] h-[348px] flex flex-col gap-4">
          <Skeleton className="w-40 h-6 mb-2" />
          <Skeleton className="w-full h-full rounded-xl" />
        </div>

        {/* Expenses Pie Card */}
        <div className="p-6 bg-card border border-border rounded-[24px] h-[348px] flex flex-col justify-between">
          <Skeleton className="w-32 h-6" />
          <div className="flex justify-center items-center py-4">
            <Skeleton className="w-[140px] h-[140px] rounded-full" />
          </div>
          <div className="space-y-3">
            {[...Array(3)].map((_, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Skeleton className="w-3 h-3 rounded-full" />
                  <Skeleton className="w-24 h-4" />
                </div>
                <Skeleton className="w-16 h-4" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity List Skeleton */}
      <div className="w-full bg-card border border-border rounded-[24px] p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between pb-2">
          <Skeleton className="w-32 h-6" />
          <Skeleton className="w-16 h-4" />
        </div>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="w-36 h-4" />
                  <Skeleton className="w-24 h-3" />
                </div>
              </div>
              <Skeleton className="w-20 h-5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

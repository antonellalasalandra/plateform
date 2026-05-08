export default function CrmLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="h-9 w-64 animate-pulse rounded-[6px] bg-slate-200" />
        <div className="h-5 w-96 max-w-full animate-pulse rounded-[6px] bg-slate-200" />
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-[8px] border border-line bg-white shadow-plate" />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <div className="h-[380px] animate-pulse rounded-[8px] border border-line bg-white shadow-plate" />
        <div className="h-[380px] animate-pulse rounded-[8px] border border-line bg-white shadow-plate" />
      </div>
    </div>
  );
}

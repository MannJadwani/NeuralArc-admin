import { Plus, Search } from "lucide-react";

export default function ResourcesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Resources</h1>
          <p className="text-sm text-gray-400">Manage downloadable and external resources</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-3 py-2 text-sm font-medium">
          <Plus className="w-4 h-4" /> New Resource
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input className="w-full rounded-lg border border-white/10 bg-white/5 pl-10 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="Search resources..." />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="h-24 rounded-lg bg-white/5 border border-white/10 mb-3" />
            <div className="text-sm font-medium">—</div>
            <div className="text-xs text-gray-400">—</div>
          </div>
        ))}
      </div>
    </div>
  );
}



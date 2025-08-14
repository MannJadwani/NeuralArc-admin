export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-gray-400">Overview of content and activity</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Posts", value: 0 },
          { label: "Published", value: 0 },
          { label: "Resources", value: 0 },
          { label: "Users", value: 0 },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-gray-400">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-lg font-medium mb-4">Recent Activity</h2>
        <div className="text-sm text-gray-400">No data yet</div>
      </div>
    </div>
  );
}



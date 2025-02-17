export default function KitsPage() {
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gunpla Kits</h1>
        <div className="flex gap-4">
          <select className="border rounded-md px-3 py-2">
            <option value="">All Grades</option>
            <option value="RG">Real Grade (RG)</option>
            <option value="MG">Master Grade (MG)</option>
            <option value="PG">Perfect Grade (PG)</option>
            <option value="HG">High Grade (HG)</option>
          </select>
          <input
            type="search"
            placeholder="Search kits..."
            className="border rounded-md px-3 py-2"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Placeholder for kit grid - will be replaced with actual data */}
        <div className="border rounded-lg p-4">
          <div className="aspect-square bg-gray-100 rounded-md mb-4"></div>
          <h3 className="text-lg font-semibold">RG Gundam</h3>
          <p className="text-sm text-muted-foreground">Real Grade</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-sm">★ 4.5</span>
            <span className="text-sm text-muted-foreground">(123 ratings)</span>
          </div>
        </div>
      </div>
    </div>
  )
}
"use client"

import { KitCard } from "@/components/kits/kit-card"
import { Kit } from "@/types/kit"
import { getKitRating } from "@/utils/supabase/kit-interactions"
import { useQueries } from "@tanstack/react-query"
import { useState, useMemo } from "react"

import rgKits from '../../../public/data/rg.json';

// Helper function to get unique values from an array
const getUniqueValues = (array: any[], key: string): string[] => {
  const values = array
    .map(item => item.categories?.[key])
    .filter((value): value is string => value !== undefined && value !== null);
  return Array.from(new Set(values)).sort();
};

function getRGKits(): Kit[] {
  return rgKits;
}

export default function KitsPage() {
  const allKits = getRGKits();
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [selectedSeries, setSelectedSeries] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Get unique brands and series
  const brands = useMemo(() => getUniqueValues(allKits, 'brand'), [allKits]);
  const series = useMemo(() => getUniqueValues(allKits, 'series'), [allKits]);

  // Filter kits based on selected filters
  const filteredKits = useMemo(() => {
    return allKits.filter(kit => {
      const matchesBrand = !selectedBrand || kit.categories?.brand === selectedBrand;
      const matchesSeries = !selectedSeries || kit.categories?.series === selectedSeries;
      const matchesSearch = !searchQuery ||
        kit.title.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesBrand && matchesSeries && matchesSearch;
    });
  }, [allKits, selectedBrand, selectedSeries, searchQuery]);

  // Fetch ratings for filtered kits
  const ratingQueries = useQueries({
    queries: filteredKits.map(kit => {
      const id = kit.url.split("/").filter(Boolean).pop() || ""
      return {
        queryKey: ['rating', id],
        queryFn: () => getKitRating(id),
      }
    })
  })
  
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Gunpla Kits</h1>
        </div>

        <div className="flex flex-wrap gap-4 bg-white p-4 rounded-lg shadow-sm">
          <select
            className="border rounded-md px-3 py-2 min-w-[200px]"
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
          >
            <option value="">All Brands</option>
            {brands.map(brand => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>

          <select
            className="border rounded-md px-3 py-2 min-w-[200px]"
            value={selectedSeries}
            onChange={(e) => setSelectedSeries(e.target.value)}
          >
            <option value="">All Series</option>
            {series.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select className="border rounded-md px-3 py-2" defaultValue="RG">
            <option value="">All Grades</option>
            <option value="RG">Real Grade (RG)</option>
            <option value="MG">Master Grade (MG)</option>
            <option value="PG">Perfect Grade (PG)</option>
            <option value="HG">High Grade (HG)</option>
          </select>

          <input
            type="search"
            placeholder="Search kits..."
            className="border rounded-md px-3 py-2 flex-1"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
        {filteredKits.map((kit: Kit, index: number) => (
          <KitCard
            key={kit.url}
            title={kit.title}
            imageUrl={kit.imgUrlList[0]}
            price={kit.price}
            releaseDate={kit.releaseDate}
            exclusive={kit.exclusive}
            url={kit.url}
            rating={ratingQueries[index].data}
          />
        ))}
      </div>
    </div>
  )
}

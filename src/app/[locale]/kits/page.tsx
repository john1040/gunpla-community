"use client"

import { KitCard } from "@/components/kits/kit-card"
import { SearchBox } from "@/components/kits/search-box"
import { Kit } from "@/types/kit"
import { getKitRating } from "@/utils/supabase/kit-interactions"
import { useQueries, useQuery } from "@tanstack/react-query"
import { useState, useMemo, useEffect } from "react"
import { useTranslationClient } from '@/hooks/use-translation-client'
import { useParams } from 'next/navigation'

import { allKits } from '@/utils/kit-data';
import { useQueryClient } from '@tanstack/react-query';

// Helper function to get unique values from an array
const getUniqueValues = (array: Kit[], key: 'brand' | 'series'): string[] => {
  const values = array
    .map(item => item.categories?.[key])
    .filter((value): value is string => value != null);
  return Array.from(new Set(values)).sort();
};

export default function KitsPage() {
  const params = useParams()
  const locale = params.locale as string
  const { t } = useTranslationClient(locale)
  const queryClient = useQueryClient();
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [selectedSeries, setSelectedSeries] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12; // Show 12 kits per page (3x4 grid)

  // Get unique brands and series
  const brands = useMemo(() => getUniqueValues(allKits, 'brand'), [allKits]);
  const series = useMemo(() => getUniqueValues(allKits, 'series'), [allKits]);

  // Memoize selected filters for query key stability
  const filters = useMemo(() => ({
    brand: selectedBrand,
    series: selectedSeries,
    grade: selectedGrade,
    search: searchQuery,
    page: currentPage,
    itemsPerPage
  }), [selectedBrand, selectedSeries, selectedGrade, searchQuery, currentPage, itemsPerPage]);

  // Prefetch kit details and ratings on hover
  const prefetchKit = (id: string) => {
    queryClient.prefetchQuery({
      queryKey: ['rating', id],
      queryFn: () => getKitRating(id),
      staleTime: 1000 * 60 * 5 // 5 minutes
    });
  };

  interface PaginatedData {
    kits: Kit[];
    totalItems: number;
    totalPages: number;
    startIndex: number;
    endIndex: number;
  }

  const defaultPaginatedData: PaginatedData = {
    kits: [],
    totalItems: 0,
    totalPages: 0,
    startIndex: 0,
    endIndex: 0
  };

  const { data: paginatedData = defaultPaginatedData } = useQuery<PaginatedData>({
    queryKey: ['filteredKits', filters],
    queryFn: () => {
      if (currentPage !== 1 &&
        (selectedBrand || selectedSeries || selectedGrade || searchQuery)) {
        setCurrentPage(1);
      }

      const filtered = allKits.filter(kit => {
        const matchesBrand = !selectedBrand || kit.categories?.brand === selectedBrand;
        const matchesSeries = !selectedSeries || kit.categories?.series === selectedSeries;
        const matchesGrade = !selectedGrade ||
          (selectedGrade === 'RG' && kit.url.includes('/item/')) ||
          (selectedGrade === 'HG' && !kit.url.includes('/item/'));
        const matchesSearch = !searchQuery ||
          kit.title.toLowerCase().includes(searchQuery.toLowerCase());
        
        return matchesBrand && matchesSeries && matchesGrade && matchesSearch;
      });

      const totalItems = filtered.length;
      const totalPages = Math.ceil(totalItems / itemsPerPage);
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const currentKits = filtered.slice(startIndex, endIndex);

      return {
        kits: currentKits,
        totalItems,
        totalPages,
        startIndex,
        endIndex
      };
    },
    staleTime: 1000 * 60 * 5
  });

  const ratingQueries = useQueries({
    queries: (paginatedData?.kits || []).map((kit) => {
      const id = kit.url?.split("/").filter(Boolean).pop() || ""
      return {
        queryKey: ['rating', id],
        queryFn: () => getKitRating(id),
        staleTime: 1000 * 60 * 5
      }
    })
  });
  
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">{t?.('kits.title') || 'Gunpla Kits'}</h1>
        </div>

        <div className="flex items-center space-x-4 bg-white p-4 rounded-lg shadow-sm">
          <select
            className="border rounded-md px-3 py-2 w-[180px]"
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
          >
            <option value="">{t?.('kits.filters.allBrands') || 'All Brands'}</option>
            {brands.map(brand => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>

          <select
            className="border rounded-md px-3 py-2 w-[180px]"
            value={selectedSeries}
            onChange={(e) => setSelectedSeries(e.target.value)}
          >
            <option value="">{t?.('kits.filters.allSeries') || 'All Series'}</option>
            {series.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <SearchBox
            allKits={allKits}
            onSearch={setSearchQuery}
            value={searchQuery}
            placeholder={t?.('kits.search') || 'Search kits'}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
        {paginatedData?.kits.map((kit: Kit, index: number) => {
          const id = kit.url.split("/").filter(Boolean).pop() || "";
          return (
            <div
              key={kit.url}
              onMouseEnter={() => prefetchKit(id)}
            >
              <KitCard
                title={kit.title}
                imageUrl={kit.imgUrlList[0]}
                price={kit.price}
                releaseDate={kit.releaseDate}
                exclusive={kit.exclusive}
                url={kit.url}
                rating={ratingQueries[index].data}
                grade={kit.url.includes('/item/') ? 'RG' : 'HG'}
              />
            </div>
          );
        })}
      </div>

      {paginatedData?.totalPages > 1 && paginatedData && (
        <div className="mt-8 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              {t?.('kits.pagination.previous') || 'Previous'}
            </button>
            
            <div className="flex items-center gap-1">
              {(() => {
                const { totalPages } = paginatedData;
                const pageNumbers = [];
                
                if (currentPage > 2) {
                  pageNumbers.push(1);
                  if (currentPage > 3) {
                    pageNumbers.push('...');
                  }
                }
                
                const start = Math.max(1, currentPage - 1);
                const end = Math.min(totalPages, currentPage + 1);
                
                for (let i = start; i <= end; i++) {
                  pageNumbers.push(i);
                }
                
                if (currentPage < totalPages - 1) {
                  if (currentPage < totalPages - 2) {
                    pageNumbers.push('...');
                  }
                  pageNumbers.push(totalPages);
                }
                
                return pageNumbers.map((page, index) =>
                  typeof page === 'number' ? (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 flex items-center justify-center rounded-md ${
                        currentPage === page
                          ? 'bg-blue-500 text-white'
                          : 'border hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ) : (
                    <span key={`ellipsis-${index}`} className="px-2">
                      {page}
                    </span>
                  )
                );
              })()}
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(paginatedData.totalPages, p + 1))}
              disabled={currentPage === paginatedData.totalPages}
              className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              {t?.('kits.pagination.next') || 'Next'}
            </button>
          </div>
          
          <div className="text-sm text-gray-500">
            {t?.('kits.pagination.showing', {
              start: paginatedData.startIndex + 1,
              end: Math.min(paginatedData.endIndex, paginatedData.totalItems),
              total: paginatedData.totalItems
            }) || `Showing ${paginatedData.startIndex + 1}-${Math.min(paginatedData.endIndex, paginatedData.totalItems)} of ${paginatedData.totalItems} kits`}
          </div>
        </div>
      )}
    </div>
  )
}
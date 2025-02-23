"use client"

import { KitCard } from "@/components/kits/kit-card"
import { Kit } from "@/types/kit"

import rgKits from '../../../public/data/rg.json';

function getRGKits(): Kit[] {
  return rgKits;
}

export default function KitsPage() {
  const kits = getRGKits();
  
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gunpla Kits</h1>
        <div className="flex gap-4">
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
            className="border rounded-md px-3 py-2"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {kits.map((kit: Kit) => (
          <KitCard
            key={kit.url}
            title={kit.title}
            imageUrl={kit.imgUrlList[0]}
            price={kit.price}
            releaseDate={kit.releaseDate}
            exclusive={kit.exclusive}
            url={kit.url}
          />
        ))}
      </div>
    </div>
  )
}
import rgKitsRaw from '../../public/data/rg.json';
import hgKitsRaw from '../../public/data/hg.json';
import { Kit } from '@/types/kit';

export const rgKits = rgKitsRaw as Kit[];
export const hgKits = hgKitsRaw as Kit[];
export const allKits = [...rgKits, ...hgKits];

// Create a map for O(1) lookup
const kitMap = new Map<string, Kit>();

// Initialize map
allKits.forEach(kit => {
  const id = kit.url.split("/").filter(Boolean).pop() || "";
  kitMap.set(id, kit);
});

export function getKitById(id: string): Kit | null {
  return kitMap.get(id) || null;
}
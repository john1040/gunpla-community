import rgKitsRaw from '../../public/data/translated-google/rg.json';
import hgKitsRaw from '../../public/data/translated-google/hg.json';
import mgKitsRaw from '../../public/data/translated-google/mg.json';
import pgKitsRaw from '../../public/data/translated-google/pg.json';
import mgkaKitsRaw from '../../public/data/translated-google/mgka.json';
import fmKitsRaw from '../../public/data/translated-google/fm.json';
import optionPartsKitsRaw from '../../public/data/translated-google/option-parts.json';
import bbKitsRaw from '../../public/data/translated-google/bb-sd.json';
import mgsdKitsRaw from '../../public/data/translated-google/mgsd.json';
import mgexKitsRaw from '../../public/data/translated-google/mgex.json';

import { Kit, isTranslatedKit, LegacyKit, TranslatedKit } from '@/types/kit';

export const rgKits = rgKitsRaw as Kit[];
export const hgKits = hgKitsRaw as Kit[];
export const mgKits = mgKitsRaw as Kit[];
export const pgKits = pgKitsRaw as Kit[];
export const mgkaKits = mgkaKitsRaw as Kit[];
export const fmKits = fmKitsRaw as Kit[];
export const optionPartsKits = optionPartsKitsRaw as Kit[];
export const bbKits = bbKitsRaw as Kit[];
export const mgsdKits = mgsdKitsRaw as Kit[];
export const mgexKits = mgexKitsRaw as Kit[];
export const allKits = [...rgKits, ...hgKits, ...mgKits, ...pgKits, ...mgkaKits, ...fmKits, ...optionPartsKits, ...bbKits, ...mgsdKits, ...mgexKits];

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

// Helper functions for getting localized content
export function getLocalizedTitle(kit: Kit, locale: string = 'ja'): string {
  if (isTranslatedKit(kit)) {
    return kit.title[locale as keyof typeof kit.title] || kit.title.ja;
  }
  return kit.title;
}

export function getLocalizedDescription(kit: Kit, locale: string = 'ja'): string {
  if (isTranslatedKit(kit)) {
    return kit.description[locale as keyof typeof kit.description] || kit.description.ja;
  }
  return kit.description;
}

export function getLocalizedBrand(kit: Kit, locale: string = 'ja'): string {
  if (isTranslatedKit(kit)) {
    return kit.categories.brand[locale as keyof typeof kit.categories.brand] || kit.categories.brand.ja;
  }
  return kit.categories.brand;
}

export function getLocalizedSeries(kit: Kit, locale: string = 'ja'): string | undefined {
  if (!kit.categories.series) {
    return undefined;
  }
  
  if (isTranslatedKit(kit)) {
    return kit.categories.series[locale as keyof typeof kit.categories.series] || kit.categories.series.ja;
  }
  
  return kit.categories.series;
}
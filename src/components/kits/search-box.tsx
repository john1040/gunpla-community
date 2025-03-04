"use client"

import { useDebounce } from "@/hooks/use-debounce"
import { Kit } from "@/types/kit"
import { useEffect, useState, useRef } from "react"
import { cn } from "@/utils/cn"
import { getLocalizedTitle } from "@/utils/kit-data"

export interface SearchBoxProps {
  allKits: Kit[]
  onSearch: (query: string) => void
  value: string
  placeholder?: string
  locale: string
}

export function SearchBox({ allKits, onSearch, value, placeholder = "Search kits...", locale }: SearchBoxProps) {
  const [searchTerm, setSearchTerm] = useState(value)
  const [suggestions, setSuggestions] = useState<Kit[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  useEffect(() => {
    onSearch(debouncedSearchTerm)
  }, [debouncedSearchTerm, onSearch])

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = allKits
        .filter(kit =>
          getLocalizedTitle(kit, locale).toLowerCase().includes(searchTerm.toLowerCase())
        )
        .slice(0, 5) // Limit to 5 suggestions
      setSuggestions(filtered)
      setShowSuggestions(true)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
    setSelectedIndex(-1)
  }, [searchTerm, allKits])

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > -1 ? prev - 1 : prev)
        break
      case 'Enter':
        if (selectedIndex >= 0) {
          e.preventDefault()
          handleSuggestionClick(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        break
    }
  }

  const handleSuggestionClick = (kit: Kit) => {
    const localizedTitle = getLocalizedTitle(kit, locale)
    setSearchTerm(localizedTitle)
    setShowSuggestions(false)
    onSearch(localizedTitle)
  }

  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        type="search"
        className="w-full border rounded-md px-3 py-2"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => searchTerm.trim() && setShowSuggestions(true)}
      />
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((kit, index) => (
            <li
              key={kit.url}
              onClick={() => handleSuggestionClick(kit)}
              className={cn(
                "px-3 py-2 cursor-pointer hover:bg-gray-100",
                selectedIndex === index && "bg-gray-100"
              )}
            >
              {getLocalizedTitle(kit, locale)}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
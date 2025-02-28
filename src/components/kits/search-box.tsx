"use client"

import { useState, useRef } from 'react'
import { Kit } from '@/types/kit'
import { useQuery } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'

interface SearchBoxProps {
  allKits: Kit[]
  onSearch: (query: string) => void
  value: string
}

export function SearchBox({ allKits, onSearch, value }: SearchBoxProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState(value)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  // Use React Query for search suggestions with built-in debouncing
  const { data: suggestions = [] } = useQuery({
    queryKey: ['kitSuggestions', inputValue],
    queryFn: () =>
      inputValue
        ? allKits
            .filter(kit =>
              kit.title.toLowerCase().includes(inputValue.toLowerCase())
            )
            .slice(0, 5)
        : [],
    staleTime: 1000 * 60 * 5, // Cache suggestions for 5 minutes
    enabled: !!inputValue && isOpen,
  })

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    setIsOpen(true)
    setHighlightedIndex(-1)
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex(i => 
        i < suggestions.length - 1 ? i + 1 : i
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex(i => (i > 0 ? i - 1 : 0))
    } else if (e.key === 'Enter' && highlightedIndex !== -1) {
      e.preventDefault()
      const selected = suggestions[highlightedIndex]
      if (selected) {
        setInputValue(selected.title)
        setIsOpen(false)
        onSearch(selected.title)
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: Kit) => {
    setInputValue(suggestion.title)
    setIsOpen(false)
    onSearch(suggestion.title)
  }

  // Handle outside clicks using ref callback
  const handleClickOutside = (event: MouseEvent) => {
    if (
      containerRef.current &&
      !containerRef.current.contains(event.target as Node)
    ) {
      setIsOpen(false)
    }
  }

  // Set up click outside handler
  if (typeof window !== 'undefined') {
    document.addEventListener('mousedown', handleClickOutside)
  }

  // Update search when input value changes
  const { data: searchResults } = useQuery({
    queryKey: ['kitSearch', inputValue],
    queryFn: () => {
      onSearch(inputValue)
      return null
    },
    staleTime: 300, // Debounce time
    enabled: inputValue !== value,
  })

  return (
    <div ref={containerRef} className="relative flex-1">
      <div className="relative">
        <input
          type="search"
          placeholder="Search kits..."
          className="w-full border rounded-md px-3 py-2 pl-10 min-w-[200px]"
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Suggestions dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute mt-1 w-full bg-white rounded-md shadow-lg border max-h-60 overflow-auto z-10">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.url}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 focus:outline-none ${
                index === highlightedIndex ? 'bg-gray-100' : ''
              }`}
              onClick={() => handleSuggestionClick(suggestion)}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              {suggestion.title}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
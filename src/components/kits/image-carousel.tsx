"use client"

import { useState } from 'react'

interface ImageCarouselProps {
  images: string[]
  title: string
}

export function ImageCarousel({ images, title }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (!images.length) {
    return (
      <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
        No Image Available
      </div>
    )
  }

  return (
    <div>
      <div className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden">
        <img
          src={images[currentIndex]}
          alt={`${title} - image ${currentIndex + 1}`}
          className="w-full h-full object-cover"
        />
      </div>
      {images.length > 1 && (
        <div className="mt-4 grid grid-cols-4 gap-2">
          {images.map((img, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`aspect-square rounded-md overflow-hidden border-2 hover:border-blue-500 focus:border-blue-500 transition-colors ${
                index === currentIndex ? 'border-blue-500' : 'border-transparent'
              }`}
            >
              <img
                src={img}
                alt={`${title} view ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
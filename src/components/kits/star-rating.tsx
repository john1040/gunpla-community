'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/utils/cn';

interface StarRatingProps {
  initialRating?: number | null;
  onRate?: (rating: number) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function StarRating({ 
  initialRating, 
  onRate, 
  disabled = false,
  size = 'md'
}: StarRatingProps) {
  const [rating, setRating] = useState<number | undefined>(
    initialRating !== null && initialRating !== undefined ? initialRating : undefined
  );
  const [hover, setHover] = useState<number | undefined>(undefined);

  // Update internal rating when initialRating changes
  useEffect(() => {
    if (initialRating !== null && initialRating !== undefined) {
      setRating(initialRating);
    }
  }, [initialRating]);

  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  const handleClick = (index: number) => {
    if (disabled) return;
    
    const newRating = index + 1;
    setRating(newRating);
    
    if (onRate) {
      onRate(newRating);
    }
  };

  return (
    <div className="flex">
      {[...Array(5)].map((_, index) => {
        const starValue = index + 1;
        const filled = (hover !== undefined ? hover >= starValue : rating !== undefined && rating >= starValue);
        
        return (
          <button
            key={index}
            type="button"
            className={`${sizeClasses[size]} focus:outline-none ${
              disabled ? 'cursor-default' : 'cursor-pointer'
            } transition-colors duration-150 ${
              filled ? 'text-yellow-400' : 'text-gray-300'
            }`}
            onClick={() => handleClick(index)}
            onMouseEnter={() => !disabled && setHover(starValue)}
            onMouseLeave={() => !disabled && setHover(undefined)}
            disabled={disabled}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  size?: 'sm' | 'md';
  label?: string;
}

export function StarRating({ rating, size = 'sm', label }: StarRatingProps) {
  const iconClass = size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5';
  const rounded = Math.round(rating);

  return (
    <div
      className="inline-flex items-center gap-0.5"
      aria-label={label ?? `تقييم ${rating.toLocaleString('ar-EG')} من ٥ نجوم`}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= rounded;
        return (
          <Star
            key={star}
            className={`${iconClass} ${
              filled
                ? 'fill-[#d4aa63] text-[#b98a3e] dark:fill-[#d4aa63] dark:text-[#d4aa63]'
                : 'text-[#d9cbb9] dark:text-[#4a3933]'
            }`}
            aria-hidden="true"
          />
        );
      })}
    </div>
  );
}

interface StarPickerProps {
  value: number;
  onChange: (value: number) => void;
}

export function StarPicker({ value, onChange }: StarPickerProps) {
  return (
    <div className="inline-flex items-center gap-1" role="radiogroup" aria-label="اختر عدد النجوم">
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= value;
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} من ٥ نجوم`}
            onClick={() => onChange(star)}
            className="p-1 rounded hover:scale-110 transition-transform cursor-pointer focus-visible:outline-2 focus-visible:outline-[#b98a3e]"
          >
            <Star
              className={`w-5 h-5 ${
                active
                  ? 'fill-[#d4aa63] text-[#b98a3e] dark:fill-[#d4aa63] dark:text-[#d4aa63]'
                  : 'text-[#d9cbb9] dark:text-[#4a3933]'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}

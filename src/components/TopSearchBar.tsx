import { useEffect, useRef, useState } from 'react';
import { ArrowDown, Plus, Search, X } from 'lucide-react';
import {
  formatEGP,
  getProductPricing,
  matchProductSearch,
  type Product,
  type SeasonalOffer,
} from '../data/catalog';

interface TopSearchBarProps {
  query: string;
  products: Product[];
  seasonalOffer: SeasonalOffer;
  nowMs: number;
  onChangeQuery: (next: string) => void;
  onSelectProduct: (product: Product) => void;
  onQuickAdd: (product: Product) => void;
}

const QUICK_NOTES = ['فانيليا', 'عنبر', 'رمان', 'ورد طائفي', 'خشب الصندل'];

export function TopSearchBar({
  query,
  products,
  seasonalOffer,
  nowMs,
  onChangeQuery,
  onSelectProduct,
  onQuickAdd,
}: TopSearchBarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKey);
    };
  }, []);

  const trimmed = query.trim();
  const matches = trimmed
    ? products
        .map((product) => ({ product, result: matchProductSearch(product, trimmed) }))
        .filter((entry) => entry.result.matched)
    : [];

  const jumpToProductsGrid = () => {
    setDropdownOpen(false);
    const el = document.getElementById('products');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div
      ref={containerRef}
      className="relative z-20 border-b border-[#e8dccd] dark:border-[#362722] bg-[#faf6f0] dark:bg-[#16100e]"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative flex-1">
          <label htmlFor="top-product-search" className="sr-only">
            ابحث عن المنتجات بالاسم أو بالنوتة العطرية
          </label>
          <Search
            className="w-4 h-4 text-[#7a655f] dark:text-[#b9a79b] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            id="top-product-search"
            type="search"
            value={query}
            onFocus={() => setDropdownOpen(true)}
            onChange={(e) => {
              onChangeQuery(e.target.value);
              setDropdownOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && trimmed) {
                jumpToProductsGrid();
              }
            }}
            placeholder="ابحث باسم المنتج أو النوتة العطرية (مثل: فانيليا، عنبر، برغموت، رمان)..."
            className="w-full pr-10 pl-10 py-2 min-h-[42px] rounded-xl border border-[#e8dccd] dark:border-[#3a2b26] bg-[#fffdf9] dark:bg-[#211815] text-[#2a1a17] dark:text-[#f3e9df] text-xs sm:text-sm placeholder:text-[#8c7770] dark:placeholder:text-[#968377] focus:outline-none focus:border-[#b98a3e]"
          />
          {trimmed && (
            <button
              type="button"
              onClick={() => {
                onChangeQuery('');
                setDropdownOpen(false);
              }}
              aria-label="مسح البحث"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center text-[#7a655f] dark:text-[#b9a79b] hover:text-[#9b3046] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {dropdownOpen && trimmed && (
            <div
              role="region"
              aria-label="نتائج البحث السريع"
              className="absolute left-0 right-0 top-full mt-2 rounded-2xl bg-[#fffdf9] dark:bg-[#211815] border border-[#e8dccd] dark:border-[#3a2b26] shadow-2xl overflow-hidden z-40"
            >
              {matches.length === 0 ? (
                <div className="p-5 text-center space-y-2">
                  <p className="text-sm font-semibold text-[#2a1a17] dark:text-[#f3e9df]">
                    لم نجد منتجات مطابقة لـ «{trimmed}»
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onChangeQuery('');
                      setDropdownOpen(false);
                    }}
                    className="text-xs font-bold text-[#9b3046] dark:text-[#d4aa63] underline underline-offset-4 cursor-pointer"
                  >
                    عرض كل المنتجات
                  </button>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-[#e8dccd] dark:divide-[#3a2b26] max-h-80 overflow-y-auto">
                    {matches.map(({ product, result }) => {
                      const pricing = getProductPricing(product, seasonalOffer, nowMs);
                      const isOutOfStock = (product.stock ?? 10) <= 0;

                      return (
                        <div
                          key={product.id}
                          className="p-3.5 sm:px-4 flex items-center justify-between gap-3 hover:bg-[#faf6f0] dark:hover:bg-[#1a1310] transition-colors"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setDropdownOpen(false);
                              onSelectProduct(product);
                            }}
                            className="text-right min-w-0 flex-1 cursor-pointer"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-bold text-[#2a1a17] dark:text-[#f3e9df]">
                                {product.name}
                              </span>
                              <span className="text-xs text-[#7a655f] dark:text-[#b9a79b]">
                                · {product.spec}
                              </span>
                              {pricing.isDiscounted && (
                                <span className="text-[11px] font-bold text-[#9b3046] dark:text-[#f29aa9]">
                                  خصم {pricing.discountPercent.toLocaleString('ar-EG')}٪
                                </span>
                              )}
                            </div>
                            {result.reason && (
                              <p className="text-xs text-[#6f5a53] dark:text-[#b9a79b] truncate mt-0.5">
                                {result.reason}
                              </p>
                            )}
                          </button>

                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-left tabular-nums">
                              <span className="block text-sm font-bold text-[#9e732b] dark:text-[#d4aa63]">
                                {formatEGP(pricing.finalPrice)}
                              </span>
                              {pricing.isDiscounted && (
                                <span className="block text-[11px] line-through text-[#7a655f]">
                                  {formatEGP(pricing.originalPrice)}
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              disabled={isOutOfStock}
                              onClick={() => {
                                onQuickAdd(product);
                                setDropdownOpen(false);
                              }}
                              className="h-8 px-3 rounded-full bg-[#9b3046] hover:bg-[#822639] disabled:opacity-45 text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                            >
                              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>{isOutOfStock ? 'نفذ' : 'أضف'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="px-4 py-2.5 bg-[#faf6f0] dark:bg-[#16100e] border-t border-[#e8dccd] dark:border-[#3a2b26] flex items-center justify-between text-xs">
                    <span className="text-[#6f5a53] dark:text-[#b9a79b] tabular-nums">
                      تم العثور على {matches.length.toLocaleString('ar-EG')} نتائج
                    </span>
                    <button
                      type="button"
                      onClick={jumpToProductsGrid}
                      className="font-bold text-[#9b3046] dark:text-[#d4aa63] inline-flex items-center gap-1 hover:underline underline-offset-4 cursor-pointer"
                    >
                      <span>عرض في قسم المنتجات</span>
                      <ArrowDown className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs shrink-0">
          <span className="text-[#7a655f] dark:text-[#b9a79b] ml-1">نوتات شائعة:</span>
          {QUICK_NOTES.map((note) => {
            const active = trimmed === note;
            return (
              <button
                key={note}
                type="button"
                onClick={() => {
                  onChangeQuery(active ? '' : note);
                  setDropdownOpen(!active);
                }}
                className={`px-2.5 py-1 rounded-md border transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'border-[#9b3046] bg-[#9b3046]/10 text-[#9b3046] dark:border-[#d4aa63] dark:bg-[#d4aa63]/15 dark:text-[#f3e9df] font-bold'
                    : 'border-[#e8dccd] dark:border-[#3a2b26] bg-[#fffdf9] dark:bg-[#211815] text-[#5c4943] dark:text-[#b9a79b] hover:border-[#b98a3e]'
                }`}
              >
                {note}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

import { Clock, Plus, Sparkles } from 'lucide-react';
import {
  formatEGP,
  getProductPricing,
  type Product,
  type SeasonalOffer,
} from '../data/catalog';

interface SeasonalOfferBannerProps {
  offer: SeasonalOffer;
  products: Product[];
  nowMs: number;
  onSelectProduct: (product: Product) => void;
  onQuickAdd: (product: Product) => void;
}

function formatCountdownParts(remainingMs: number) {
  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    days: days.toLocaleString('ar-EG'),
    hours: hours.toLocaleString('ar-EG').padStart(2, '٠'),
    minutes: minutes.toLocaleString('ar-EG').padStart(2, '٠'),
    seconds: seconds.toLocaleString('ar-EG').padStart(2, '٠'),
  };
}

export function SeasonalOfferBanner({
  offer,
  products,
  nowMs,
  onSelectProduct,
  onQuickAdd,
}: SeasonalOfferBannerProps) {
  if (!offer.active || offer.discountPercent <= 0) return null;

  const endsAtMs = new Date(offer.endsAt).getTime();
  const remainingMs = endsAtMs - nowMs;
  if (!Number.isFinite(endsAtMs) || remainingMs <= 0) return null;

  const discountedProducts = products.filter((p) => offer.productIds.includes(p.id));
  if (discountedProducts.length === 0) return null;

  const timer = formatCountdownParts(remainingMs);

  return (
    <section
      aria-label="العروض الموسمية"
      className="border-b border-[#d9c3a0]/35 bg-[#2a1719] text-[#faf4eb]"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#e5be7b]">
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                <span>العروض الموسمية</span>
              </span>
              <span aria-hidden="true" className="text-[#d9c3a0]/40">
                ·
              </span>
              <span className="text-xs font-bold text-[#faf4eb] bg-[#9b3046] px-2 py-0.5 rounded-md tabular-nums">
                خصم {offer.discountPercent.toLocaleString('ar-EG')}٪
              </span>
            </div>

            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className="font-display text-xl sm:text-2xl font-bold text-[#faf4eb]">
                {offer.title}
              </h2>
              <p className="text-xs sm:text-sm text-[#dfd1c3]">{offer.subtitle}</p>
            </div>
          </div>

          <div
            aria-label="العد التنازلي لنهاية العرض"
            className="flex items-center gap-2 shrink-0 self-start md:self-auto"
          >
            <div className="inline-flex items-center gap-1.5 text-xs text-[#d9c3a0] ml-1">
              <Clock className="w-3.5 h-3.5" aria-hidden="true" />
              <span>ينتهي خلال</span>
            </div>
            {[
              { value: timer.days, label: 'يوم' },
              { value: timer.hours, label: 'ساعة' },
              { value: timer.minutes, label: 'دقيقة' },
              { value: timer.seconds, label: 'ثانية' },
            ].map((unit) => (
              <div
                key={unit.label}
                className="min-w-[46px] px-2 py-1.5 rounded-lg bg-white/8 border border-[#d9c3a0]/25 text-center"
              >
                <span className="block text-sm font-bold tabular-nums leading-none text-[#faf4eb]">
                  {unit.value}
                </span>
                <span className="block text-[10px] text-[#d9c3a0] mt-1">{unit.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {discountedProducts.map((product) => {
            const pricing = getProductPricing(product, offer, nowMs);
            const isOutOfStock = (product.stock ?? 10) <= 0;

            return (
              <div
                key={product.id}
                className="rounded-xl bg-white/6 border border-[#d9c3a0]/20 px-3.5 py-2.5 flex items-center justify-between gap-3"
              >
                <button
                  type="button"
                  onClick={() => onSelectProduct(product)}
                  className="text-right min-w-0 cursor-pointer group"
                >
                  <p className="text-xs sm:text-sm font-bold text-[#faf4eb] group-hover:text-[#e5be7b] truncate transition-colors">
                    {product.name}
                  </p>
                  <p className="text-xs flex items-center gap-2 tabular-nums">
                    <span className="font-bold text-[#e5be7b]">
                      {formatEGP(pricing.finalPrice)}
                    </span>
                    <span className="line-through text-[#dfd1c3]/60 text-[11px]">
                      {formatEGP(pricing.originalPrice)}
                    </span>
                  </p>
                </button>

                <button
                  type="button"
                  disabled={isOutOfStock}
                  onClick={() => onQuickAdd(product)}
                  aria-label={`إضافة ${product.name} بالخصم`}
                  className="h-8 px-3 rounded-full bg-[#e5be7b] hover:bg-[#d4aa63] disabled:opacity-45 text-[#1c110f] text-xs font-bold inline-flex items-center gap-1 shrink-0 cursor-pointer transition-colors whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{isOutOfStock ? 'نفذ' : 'أضف'}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

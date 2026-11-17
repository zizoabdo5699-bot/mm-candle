import { useEffect, useState } from 'react';
import { Plus, Sparkles, Check } from 'lucide-react';
import { STORE_CONFIG, type StoreRuntimeConfig } from '../config';
import { formatEGP, type CustomPerfumeDetails, type Product } from '../data/catalog';
import type { CartItem } from './CartDrawer';

interface CustomPerfumeSectionProps {
  config?: StoreRuntimeConfig['customPerfume'];
  onAddCustomToCart: (item: CartItem) => void;
}

export function CustomPerfumeSection({
  config = STORE_CONFIG.customPerfume,
  onAddCustomToCart,
}: CustomPerfumeSectionProps) {
  const sizes = config.sizes.length > 0 ? config.sizes : STORE_CONFIG.customPerfume.sizes;
  const suggestedScents =
    config.suggestedScents.length > 0
      ? config.suggestedScents
      : STORE_CONFIG.customPerfume.suggestedScents;

  const [scentName, setScentName] = useState('');
  const [bottleName, setBottleName] = useState('');
  const [selectedSizeId, setSelectedSizeId] = useState<string>(sizes[0]?.id || '50ml');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!sizes.some((s) => s.id === selectedSizeId) && sizes[0]) {
      setSelectedSizeId(sizes[0].id);
    }
  }, [sizes, selectedSizeId]);

  const selectedSize = sizes.find((s) => s.id === selectedSizeId) || sizes[0];

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanScent = scentName.trim();
    const cleanBottle = bottleName.trim();

    if (cleanScent.length < 2) {
      setErrorMsg('يرجى كتابة اسم العطر أو الرائحة التي ترغب بها.');
      return;
    }
    if (cleanBottle.length < 1) {
      setErrorMsg('يرجى كتابة الاسم المطلوب طباعته على الزجاجة.');
      return;
    }

    setErrorMsg(null);
    const customDetails: CustomPerfumeDetails = {
      kind: 'perfume',
      scentName: cleanScent,
      bottleName: cleanBottle,
      sizeLabel: selectedSize.label,
      sizeMl: selectedSize.ml,
    };

    const customProduct: Product = {
      id: -1,
      slug: 'classic-candle',
      name: `عطر مخصص — ${selectedSize.label}`,
      subtitle: `${cleanScent} · الاسم: ${cleanBottle}`,
      description: `زجاجة عطر مخصصة بحجم ${selectedSize.label} برائحة ${cleanScent} ومطبوع عليها «${cleanBottle}».`,
      price: selectedSize.price,
      category: 'gifts',
      categoryLabel: 'عطر مخصص',
      spec: selectedSize.label,
      longevity: 'تركيبة عطرية مركزة حسب الطلب',
      rating: 5,
      reviewCount: 1,
      stock: 999,
      scents: [cleanScent],
    };

    const key = `custom-perfume::${cleanScent.toLowerCase()}::${cleanBottle.toLowerCase()}::${selectedSize.id}`;
    onAddCustomToCart({
      key,
      product: customProduct,
      scent: `${cleanScent} (الاسم على الزجاجة: ${cleanBottle})`,
      quantity: 1,
      isCustom: true,
      customDetails,
    });

    setScentName('');
    setBottleName('');
  };

  return (
    <section
      id="custom-perfume"
      className="border-b border-[#e8dccd] dark:border-[#3a2b26] bg-[#faf6f0] dark:bg-[#16100e]"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="mb-10 max-w-2xl space-y-2">
          <p className="text-xs font-semibold text-[#9e732b] dark:text-[#d4aa63] inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            <span>تركيبة خاصة باسمك</span>
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#2a1a17] dark:text-[#f3e9df]">
            اصنع عطرك
          </h2>
          <p className="text-sm sm:text-base text-[#5c4943] dark:text-[#c7b7ab]">
            اكتب اسم العطر أو الرائحة التي تحبها، وأضف الاسم الذي تريده على الزجاجة، ثم اختر الحجم
            ليظهر السعر فورًا.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Form Column */}
          <form
            onSubmit={handleAdd}
            className="lg:col-span-7 rounded-2xl bg-[#fffdf9] dark:bg-[#211815] border border-[#e8dccd] dark:border-[#3a2b26] p-6 sm:p-8 space-y-6"
          >
            {errorMsg && (
              <div
                role="alert"
                className="p-3.5 rounded-xl border border-[#9b3046]/30 bg-[#9b3046]/10 text-xs font-semibold text-[#9b3046] dark:text-[#f29aa9]"
              >
                {errorMsg}
              </div>
            )}

            <div className="space-y-2.5">
              <label
                htmlFor="perfume-scent-input"
                className="block text-sm font-bold text-[#2a1a17] dark:text-[#f3e9df]"
              >
                ١. اسم العطر أو الرائحة المطلوبة
              </label>
              <input
                id="perfume-scent-input"
                type="text"
                maxLength={80}
                placeholder="اكتب اسم الرائحة أو اسم العطر الذي تريد محاكاته (مثال: سوفاج، مسك أبيض...)"
                value={scentName}
                onChange={(e) => {
                  setScentName(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                className="w-full px-4 py-3 min-h-[46px] rounded-xl border border-[#e8dccd] dark:border-[#3a2b26] bg-[#faf6f0] dark:bg-[#16100e] text-[#2a1a17] dark:text-[#f3e9df] text-sm focus:outline-none focus:border-[#b98a3e]"
              />

              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-[#7a655f] dark:text-[#b9a79b] ml-1">
                  اقتراحات شائعة:
                </span>
                {suggestedScents.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => {
                      setScentName(suggestion);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    className={`px-2.5 py-1 rounded-md border text-xs transition-colors cursor-pointer ${
                      scentName === suggestion
                        ? 'border-[#9b3046] bg-[#9b3046]/10 text-[#9b3046] dark:border-[#d4aa63] dark:text-[#d4aa63] font-bold'
                        : 'border-[#e8dccd] dark:border-[#3a2b26] text-[#5c4943] dark:text-[#b9a79b] hover:border-[#b98a3e]'
                    }`}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="perfume-bottle-name"
                className="block text-sm font-bold text-[#2a1a17] dark:text-[#f3e9df]"
              >
                ٢. الاسم المكتوب على الزجاجة
              </label>
              <input
                id="perfume-bottle-name"
                type="text"
                maxLength={35}
                placeholder="مثال: سارة محمود، أو إهداء خاص..."
                value={bottleName}
                onChange={(e) => {
                  setBottleName(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                className="w-full px-4 py-3 min-h-[46px] rounded-xl border border-[#e8dccd] dark:border-[#3a2b26] bg-[#faf6f0] dark:bg-[#16100e] text-[#2a1a17] dark:text-[#f3e9df] text-sm focus:outline-none focus:border-[#b98a3e]"
              />
            </div>

            <div className="space-y-3">
              <span className="block text-sm font-bold text-[#2a1a17] dark:text-[#f3e9df]">
                ٣. اختر حجم الزجاجة
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {sizes.map((size) => {
                  const active = size.id === selectedSize.id;
                  return (
                    <button
                      key={size.id}
                      type="button"
                      onClick={() => setSelectedSizeId(size.id)}
                      aria-pressed={active}
                      className={`p-3.5 rounded-xl border text-right transition-colors cursor-pointer flex flex-col justify-between gap-2 ${
                        active
                          ? 'border-[#9b3046] bg-[#9b3046]/8 dark:border-[#d4aa63] dark:bg-[#d4aa63]/12'
                          : 'border-[#e8dccd] dark:border-[#3a2b26] bg-[#faf6f0] dark:bg-[#16100e] hover:border-[#b98a3e]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-sm font-bold text-[#2a1a17] dark:text-[#f3e9df]">
                          {size.label}
                        </span>
                        {active && (
                          <Check
                            className="w-4 h-4 text-[#9b3046] dark:text-[#d4aa63] shrink-0"
                            aria-hidden="true"
                          />
                        )}
                      </div>
                      <span className="text-sm font-bold text-[#9e732b] dark:text-[#d4aa63] tabular-nums">
                        {formatEGP(size.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-[#6f5a53] dark:text-[#b9a79b]">
                {selectedSize.description}
              </p>
            </div>

            <div className="pt-4 border-t border-[#e8dccd] dark:border-[#3a2b26] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="block text-xs text-[#7a655f] dark:text-[#b9a79b]">
                  السعر المحدد للحجم ({selectedSize.label})
                </span>
                <span className="text-2xl font-bold text-[#9e732b] dark:text-[#d4aa63] tabular-nums">
                  {formatEGP(selectedSize.price)}
                </span>
              </div>

              <button
                type="submit"
                className="min-h-[46px] px-7 py-3 rounded-full bg-[#9b3046] hover:bg-[#822639] text-white text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>أضف للطلب</span>
              </button>
            </div>
          </form>

          {/* Live Bottle Preview & Summary */}
          <div className="lg:col-span-5 rounded-2xl bg-[#fffdf9] dark:bg-[#211815] border border-[#e8dccd] dark:border-[#3a2b26] p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between border-b border-[#e8dccd] dark:border-[#3a2b26] pb-3">
              <h3 className="font-display text-xl font-bold text-[#2a1a17] dark:text-[#f3e9df]">
                معاينة زجاجة عطرك
              </h3>
              <span className="text-xs font-bold text-[#9e732b] dark:text-[#d4aa63] tabular-nums">
                {selectedSize.label} · {formatEGP(selectedSize.price)}
              </span>
            </div>

            <div className="rounded-2xl bg-[#f4ece0] dark:bg-[#271d1a] p-6 flex items-center justify-center">
              <div className="w-48 flex flex-col items-center">
                {/* Cap & Atomizer */}
                <div className="w-12 h-9 rounded-t-md bg-gradient-to-b from-[#e5be7b] to-[#9e732b] border border-[#7c581e]/40 shadow-sm" />
                <div className="w-16 h-3 rounded-sm bg-[#2a1a17] dark:bg-[#140d0b]" />
                {/* Glass Bottle */}
                <div className="w-44 h-52 rounded-2xl bg-[#fffdf9]/90 border-2 border-[#d4aa63]/70 shadow-lg p-3 flex flex-col items-center justify-center text-center relative overflow-hidden">
                  <div
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-[#d4aa63]/25 to-transparent"
                  />
                  <div className="relative z-10 w-full rounded-xl border border-[#b98a3e]/70 bg-[#fffaf2] px-3 py-4 space-y-1.5 shadow-xs">
                    <p
                      dir="ltr"
                      className="font-brand text-[10px] tracking-[0.2em] text-[#9e732b] font-bold"
                    >
                      M&amp;M PARFUMS
                    </p>
                    <p className="font-display text-lg font-bold text-[#2a1a17] truncate">
                      {bottleName.trim() || 'اسمك على الزجاجة'}
                    </p>
                    <p className="text-[11px] font-semibold text-[#9b3046] truncate">
                      {scentName.trim() || 'اسم العطر المختار'}
                    </p>
                    <p className="text-[10px] text-[#7a655f] tabular-nums pt-0.5">
                      {selectedSize.label}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <dl className="space-y-2 text-xs sm:text-sm pt-1">
              <div className="flex justify-between gap-3">
                <dt className="text-[#7a655f] dark:text-[#b9a79b]">اسم العطر:</dt>
                <dd className="font-semibold text-[#2a1a17] dark:text-[#f3e9df] text-left">
                  {scentName.trim() || 'لم يُحدد بعد'}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[#7a655f] dark:text-[#b9a79b]">الاسم على الزجاجة:</dt>
                <dd className="font-semibold text-[#2a1a17] dark:text-[#f3e9df] text-left">
                  {bottleName.trim() || 'لم يُحدد بعد'}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[#7a655f] dark:text-[#b9a79b]">الحجم المختار:</dt>
                <dd className="font-semibold text-[#2a1a17] dark:text-[#f3e9df] tabular-nums">
                  {selectedSize.label}
                </dd>
              </div>
              <div className="flex justify-between gap-3 pt-2 border-t border-[#e8dccd] dark:border-[#3a2b26]">
                <dt className="font-bold text-[#2a1a17] dark:text-[#f3e9df]">السعر:</dt>
                <dd className="font-bold text-[#9e732b] dark:text-[#d4aa63] tabular-nums">
                  {formatEGP(selectedSize.price)}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}

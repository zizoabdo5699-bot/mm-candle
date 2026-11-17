import { useEffect, useState } from 'react';
import { Flame, Plus, Check } from 'lucide-react';
import { STORE_CONFIG, type StoreRuntimeConfig } from '../config';
import { formatEGP, type CustomCandleDetails, type Product } from '../data/catalog';
import type { CartItem } from './CartDrawer';

interface CustomCandleSectionProps {
  config?: StoreRuntimeConfig['customCandle'];
  onAddCustomToCart: (item: CartItem) => void;
}

export function CustomCandleSection({
  config = STORE_CONFIG.customCandle,
  onAddCustomToCart,
}: CustomCandleSectionProps) {
  const sizes = config.sizes.length > 0 ? config.sizes : STORE_CONFIG.customCandle.sizes;
  const colors = config.colors.length > 0 ? config.colors : STORE_CONFIG.customCandle.colors;
  const scents = config.scents.length > 0 ? config.scents : STORE_CONFIG.customCandle.scents;
  const jarTypes =
    config.jarTypes.length > 0 ? config.jarTypes : STORE_CONFIG.customCandle.jarTypes;

  const [selectedSizeId, setSelectedSizeId] = useState<string>(sizes[1]?.id || sizes[0]?.id);
  const [selectedColorId, setSelectedColorId] = useState<string>(colors[0]?.id);
  const [selectedScent, setSelectedScent] = useState<string>(scents[0]);
  const [selectedJarId, setSelectedJarId] = useState<string>(jarTypes[0]?.id);

  useEffect(() => {
    if (!sizes.some((s) => s.id === selectedSizeId) && sizes[0]) {
      setSelectedSizeId(sizes[0].id);
    }
    if (!colors.some((c) => c.id === selectedColorId) && colors[0]) {
      setSelectedColorId(colors[0].id);
    }
    if (!scents.includes(selectedScent) && scents[0]) {
      setSelectedScent(scents[0]);
    }
    if (!jarTypes.some((j) => j.id === selectedJarId) && jarTypes[0]) {
      setSelectedJarId(jarTypes[0].id);
    }
  }, [sizes, colors, scents, jarTypes, selectedSizeId, selectedColorId, selectedScent, selectedJarId]);

  const selectedSize = sizes.find((s) => s.id === selectedSizeId) || sizes[0];
  const selectedColor = colors.find((c) => c.id === selectedColorId) || colors[0];
  const selectedJar = jarTypes.find((j) => j.id === selectedJarId) || jarTypes[0];

  const totalPrice = selectedSize.price + selectedJar.extraPrice;

  const handleAdd = () => {
    const customDetails: CustomCandleDetails = {
      kind: 'candle',
      sizeLabel: selectedSize.label,
      sizeWeight: selectedSize.weight,
      colorLabel: selectedColor.label,
      colorHex: selectedColor.hex,
      scent: selectedScent,
      jarType: selectedJar.label,
    };

    const customProduct: Product = {
      id: -2,
      slug: 'classic-candle',
      name: `شمعة مخصصة — ${selectedSize.label}`,
      subtitle: `${selectedColor.label} · جار ${selectedJar.label} · ${selectedScent}`,
      description: `شمعة مصنوعة حسب الطلب بحجم ${selectedSize.label} (${selectedSize.weight})، بلون ${selectedColor.label}، ورائحة ${selectedScent} داخل جار ${selectedJar.label}.`,
      price: totalPrice,
      category: 'candles',
      categoryLabel: 'شمعة مخصصة',
      spec: `${selectedSize.weight} · جار ${selectedJar.label}`,
      longevity: selectedSize.burnTime,
      rating: 5,
      reviewCount: 1,
      stock: 999,
      scents: [selectedScent],
    };

    const key = `custom-candle::${selectedSize.id}::${selectedColor.id}::${selectedScent}::${selectedJar.id}`;
    onAddCustomToCart({
      key,
      product: customProduct,
      scent: selectedScent,
      quantity: 1,
      isCustom: true,
      customDetails,
    });
  };

  return (
    <section
      id="custom-candle"
      className="border-b border-[#e8dccd] dark:border-[#3a2b26] bg-[#f4ece0]/55 dark:bg-[#1c1411]"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="mb-10 max-w-2xl space-y-2">
          <p className="text-xs font-semibold text-[#9e732b] dark:text-[#d4aa63] inline-flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5" aria-hidden="true" />
            <span>مصنوعة يدويًا على ذوقك</span>
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#2a1a17] dark:text-[#f3e9df]">
            اصنع شمعتك
          </h2>
          <p className="text-sm sm:text-base text-[#5c4943] dark:text-[#c7b7ab]">
            اختر الحجم، اللون، الرائحة، ونوع الجار المناسب لمكانك، وشاهد ملخص شمعتك المخصصة قبل
            إضافتها للطلب.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls Column */}
          <div className="lg:col-span-7 rounded-2xl bg-[#fffdf9] dark:bg-[#211815] border border-[#e8dccd] dark:border-[#3a2b26] p-6 sm:p-8 space-y-6">
            {/* 1. Size */}
            <div className="space-y-3">
              <span className="block text-sm font-bold text-[#2a1a17] dark:text-[#f3e9df]">
                ١. اختر الحجم
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {sizes.map((size) => {
                  const active = size.id === selectedSize.id;
                  return (
                    <button
                      key={size.id}
                      type="button"
                      onClick={() => setSelectedSizeId(size.id)}
                      aria-pressed={active}
                      className={`p-3.5 rounded-xl border text-right transition-colors cursor-pointer space-y-1 ${
                        active
                          ? 'border-[#9b3046] bg-[#9b3046]/8 dark:border-[#d4aa63] dark:bg-[#d4aa63]/12'
                          : 'border-[#e8dccd] dark:border-[#3a2b26] bg-[#faf6f0] dark:bg-[#16100e] hover:border-[#b98a3e]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-[#2a1a17] dark:text-[#f3e9df]">
                          {size.label} ({size.weight})
                        </span>
                        {active && (
                          <Check
                            className="w-4 h-4 text-[#9b3046] dark:text-[#d4aa63] shrink-0"
                            aria-hidden="true"
                          />
                        )}
                      </div>
                      <p className="text-[11px] text-[#7a655f] dark:text-[#b9a79b]">
                        {size.burnTime}
                      </p>
                      <p className="text-sm font-bold text-[#9e732b] dark:text-[#d4aa63] tabular-nums pt-1">
                        {formatEGP(size.price)}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Color */}
            <div className="space-y-3">
              <span className="block text-sm font-bold text-[#2a1a17] dark:text-[#f3e9df]">
                ٢. اختر اللون
              </span>
              <div className="flex flex-wrap gap-2.5">
                {colors.map((color) => {
                  const active = color.id === selectedColor.id;
                  return (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => setSelectedColorId(color.id)}
                      aria-pressed={active}
                      className={`px-3.5 py-2 min-h-[42px] rounded-xl border text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer ${
                        active
                          ? 'border-[#9b3046] bg-[#9b3046]/10 text-[#9b3046] dark:border-[#d4aa63] dark:bg-[#d4aa63]/15 dark:text-[#f3e9df]'
                          : 'border-[#e8dccd] dark:border-[#3a2b26] bg-[#faf6f0] dark:bg-[#16100e] text-[#5c4943] dark:text-[#b9a79b] hover:border-[#b98a3e]'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className="w-4 h-4 rounded-full border border-black/15 shrink-0"
                        style={{ backgroundColor: color.hex }}
                      />
                      <span>{color.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Scent */}
            <div className="space-y-3">
              <span className="block text-sm font-bold text-[#2a1a17] dark:text-[#f3e9df]">
                ٣. اختر رائحة الشمعة
              </span>
              <div className="flex flex-wrap gap-2">
                {scents.map((scent) => {
                  const active = scent === selectedScent;
                  return (
                    <button
                      key={scent}
                      type="button"
                      onClick={() => setSelectedScent(scent)}
                      aria-pressed={active}
                      className={`px-3.5 py-2 min-h-[40px] rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                        active
                          ? 'border-[#9b3046] bg-[#9b3046] text-white'
                          : 'border-[#e8dccd] dark:border-[#3a2b26] bg-[#faf6f0] dark:bg-[#16100e] text-[#5c4943] dark:text-[#b9a79b] hover:border-[#b98a3e]'
                      }`}
                    >
                      {active && <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
                      <span>{scent}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Jar Type */}
            <div className="space-y-3">
              <span className="block text-sm font-bold text-[#2a1a17] dark:text-[#f3e9df]">
                ٤. اختر نوع الجار
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {jarTypes.map((jar) => {
                  const active = jar.id === selectedJar.id;
                  return (
                    <button
                      key={jar.id}
                      type="button"
                      onClick={() => setSelectedJarId(jar.id)}
                      aria-pressed={active}
                      className={`p-3.5 rounded-xl border text-right transition-colors cursor-pointer space-y-1 ${
                        active
                          ? 'border-[#9b3046] bg-[#9b3046]/8 dark:border-[#d4aa63] dark:bg-[#d4aa63]/12'
                          : 'border-[#e8dccd] dark:border-[#3a2b26] bg-[#faf6f0] dark:bg-[#16100e] hover:border-[#b98a3e]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-[#2a1a17] dark:text-[#f3e9df]">
                          {jar.label}
                        </span>
                        <span className="text-xs font-bold text-[#9e732b] dark:text-[#d4aa63] tabular-nums">
                          {jar.extraPrice > 0 ? `+ ${formatEGP(jar.extraPrice)}` : 'مشمول'}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#7a655f] dark:text-[#b9a79b]">
                        {jar.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Summary & Live Candle Visual */}
          <div className="lg:col-span-5 rounded-2xl bg-[#fffdf9] dark:bg-[#211815] border border-[#e8dccd] dark:border-[#3a2b26] p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between border-b border-[#e8dccd] dark:border-[#3a2b26] pb-3">
              <h3 className="font-display text-xl font-bold text-[#2a1a17] dark:text-[#f3e9df]">
                ملخص اختياراتك
              </h3>
              <span className="text-base font-bold text-[#9e732b] dark:text-[#d4aa63] tabular-nums">
                {formatEGP(totalPrice)}
              </span>
            </div>

            {/* Dynamic Candle SVG Preview */}
            <div className="rounded-2xl bg-[#f4ece0] dark:bg-[#271d1a] p-5 flex items-center justify-center">
              <svg viewBox="0 0 220 210" className="w-44 h-44 drop-shadow-sm" fill="none">
                <ellipse cx="110" cy="184" rx="58" ry="9" fill="#c7b299" opacity="0.5" />
                {/* Wick & Flame */}
                <path d="M110 74V62" stroke="#3b2621" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M110 32C117 44 118 53 110 62C102 53 103 44 110 32Z" fill="#d49334" />
                <path
                  d="M110 42C113.5 48.5 114.5 54 110 59C105.5 54 106.5 48.5 110 42Z"
                  fill="#fff3c4"
                />
                {/* Jar Outer Shell depending on jarType */}
                <rect
                  x="60"
                  y="76"
                  width="100"
                  height="104"
                  rx="14"
                  fill={
                    selectedJar.label === 'خشب'
                      ? '#a4754b'
                      : selectedJar.label === 'ملون'
                      ? '#3e262b'
                      : '#fffdf9'
                  }
                  stroke={selectedJar.label === 'خشب' ? '#704b2a' : '#c8a870'}
                  strokeWidth="2.2"
                />
                {/* Wood grain accent when wood jar */}
                {selectedJar.label === 'خشب' && (
                  <>
                    <path d="M72 86V172" stroke="#855a35" strokeWidth="1.4" opacity="0.6" />
                    <path d="M148 86V172" stroke="#855a35" strokeWidth="1.4" opacity="0.6" />
                  </>
                )}
                {/* Inner Wax Fill reflecting chosen color */}
                <rect
                  x="68"
                  y="84"
                  width="84"
                  height="88"
                  rx="10"
                  fill={selectedColor.hex}
                  opacity={selectedJar.label === 'ملون' ? 0.72 : 0.95}
                />
                {/* Wax top ellipse */}
                <ellipse
                  cx="110"
                  cy="80"
                  rx="44"
                  ry="8"
                  fill={selectedColor.hex}
                  stroke="#d4aa63"
                  strokeWidth="1.2"
                />
                {/* Label */}
                <rect
                  x="78"
                  y="108"
                  width="64"
                  height="48"
                  rx="7"
                  fill="#fffaf3"
                  stroke="#b98a3e"
                  strokeWidth="1.2"
                />
                <text
                  x="110"
                  y="131"
                  textAnchor="middle"
                  fill="#2a1a17"
                  fontSize="13"
                  fontWeight="700"
                  fontFamily="Cormorant Garamond, Georgia, serif"
                >
                  M&amp;M
                </text>
                <text
                  x="110"
                  y="145"
                  textAnchor="middle"
                  fill="#8c6d3b"
                  fontSize="6.5"
                  fontFamily="Cairo, sans-serif"
                >
                  {selectedJar.label}
                </text>
              </svg>
            </div>

            <dl className="space-y-2.5 text-xs sm:text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-[#7a655f] dark:text-[#b9a79b]">الحجم:</dt>
                <dd className="font-semibold text-[#2a1a17] dark:text-[#f3e9df]">
                  {selectedSize.label} ({selectedSize.weight})
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[#7a655f] dark:text-[#b9a79b]">اللون:</dt>
                <dd className="font-semibold text-[#2a1a17] dark:text-[#f3e9df] inline-flex items-center gap-1.5">
                  <span
                    aria-hidden="true"
                    className="w-3 h-3 rounded-full border border-black/15"
                    style={{ backgroundColor: selectedColor.hex }}
                  />
                  <span>{selectedColor.label}</span>
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[#7a655f] dark:text-[#b9a79b]">الرائحة:</dt>
                <dd className="font-semibold text-[#2a1a17] dark:text-[#f3e9df] text-left">
                  {selectedScent}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[#7a655f] dark:text-[#b9a79b]">نوع الجار:</dt>
                <dd className="font-semibold text-[#2a1a17] dark:text-[#f3e9df]">
                  {selectedJar.label}{' '}
                  {selectedJar.extraPrice > 0 ? `(+${formatEGP(selectedJar.extraPrice)})` : ''}
                </dd>
              </div>
              <div className="flex justify-between gap-3 pt-3 border-t border-[#e8dccd] dark:border-[#3a2b26]">
                <dt className="font-bold text-[#2a1a17] dark:text-[#f3e9df]">الإجمالي:</dt>
                <dd className="text-xl font-bold text-[#9e732b] dark:text-[#d4aa63] tabular-nums">
                  {formatEGP(totalPrice)}
                </dd>
              </div>
            </dl>

            <button
              type="button"
              onClick={handleAdd}
              className="w-full min-h-[46px] px-6 py-3 rounded-full bg-[#9b3046] hover:bg-[#822639] text-white text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>أضف للطلب · {formatEGP(totalPrice)}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

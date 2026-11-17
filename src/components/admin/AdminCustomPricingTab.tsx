import { useEffect, useState } from 'react';
import { Save, Plus, Trash2, Sparkles, Flame } from 'lucide-react';
import type { StoreRuntimeConfig } from '../../config';
import { formatEGP } from '../../data/catalog';

interface AdminCustomPricingTabProps {
  storeConfig: StoreRuntimeConfig;
  saving: boolean;
  onSaveStoreConfig: (nextConfig: StoreRuntimeConfig) => Promise<void>;
}

export function AdminCustomPricingTab({
  storeConfig,
  saving,
  onSaveStoreConfig,
}: AdminCustomPricingTabProps) {
  const [draft, setDraft] = useState<StoreRuntimeConfig>(() =>
    JSON.parse(JSON.stringify(storeConfig)) as StoreRuntimeConfig
  );
  const [newPerfumeScent, setNewPerfumeScent] = useState('');
  const [newCandleScent, setNewCandleScent] = useState('');

  useEffect(() => {
    setDraft(JSON.parse(JSON.stringify(storeConfig)) as StoreRuntimeConfig);
  }, [storeConfig]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    void onSaveStoreConfig(draft);
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-2xl font-bold text-[#2a1a17] dark:text-[#f3e9df]">
            التحكم في أسعار وخيارات «اصنع عطرك» و«اصنع شمعتك»
          </h3>
          <p className="text-xs sm:text-sm text-[#6f5a53] dark:text-[#b9a79b]">
            أي تعديل تحفظه هنا ينعكس فورًا على الأسعار والأحجام والألوان والروائح في المتجر.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 min-h-[42px] rounded-full bg-[#9b3046] hover:bg-[#822639] disabled:opacity-60 text-white text-xs sm:text-sm font-bold inline-flex items-center gap-2 cursor-pointer whitespace-nowrap"
        >
          <Save className="w-4 h-4" aria-hidden="true" />
          <span>{saving ? 'جاري الحفظ...' : 'حفظ جميع التعديلات'}</span>
        </button>
      </div>

      {/* 1. Custom Perfume Section Settings */}
      <div className="rounded-2xl border border-[#e8dccd] dark:border-[#3a2b26] bg-[#fffdf9] dark:bg-[#211815] p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e8dccd] dark:border-[#3a2b26] pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#9b3046] dark:text-[#d4aa63]" aria-hidden="true" />
            <h4 className="font-display text-xl font-bold text-[#2a1a17] dark:text-[#f3e9df]">
              قسم: اصنع عطرك
            </h4>
          </div>

          <button
            type="button"
            onClick={() =>
              setDraft((prev) => ({
                ...prev,
                customPerfume: {
                  ...prev.customPerfume,
                  sizes: [
                    ...prev.customPerfume.sizes,
                    {
                      id: `custom-${Date.now()}`,
                      ml: 75,
                      label: '75 مل',
                      price: 300,
                      description: 'حجم متوسط جديد',
                    },
                  ],
                },
              }))
            }
            className="px-3.5 py-1.5 rounded-lg border border-[#e8dccd] dark:border-[#3a2b26] hover:border-[#9b3046] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>إضافة حجم زجاجة</span>
          </button>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold text-[#5c4943] dark:text-[#c7b7ab]">
            أحجام وأسعار الزجاجات
          </p>
          <div className="space-y-2.5">
            {draft.customPerfume.sizes.map((size, idx) => (
              <div
                key={size.id}
                className="p-3.5 rounded-xl border border-[#e8dccd] dark:border-[#3a2b26] bg-[#faf6f0] dark:bg-[#16100e] grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
              >
                <div className="sm:col-span-2">
                  <label className="block text-[11px] text-[#7a655f] dark:text-[#b9a79b] mb-1">
                    الحجم (مل)
                  </label>
                  <input
                    type="number"
                    min={5}
                    value={size.ml}
                    onChange={(e) => {
                      const ml = Math.max(5, Number(e.target.value) || 0);
                      setDraft((prev) => {
                        const sizes = [...prev.customPerfume.sizes];
                        sizes[idx] = { ...sizes[idx], ml };
                        return { ...prev, customPerfume: { ...prev.customPerfume, sizes } };
                      });
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-[#e8dccd] dark:border-[#3a2b26] bg-[#fffdf9] dark:bg-[#211815] text-sm tabular-nums"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] text-[#7a655f] dark:text-[#b9a79b] mb-1">
                    الاسم الظاهر
                  </label>
                  <input
                    type="text"
                    value={size.label}
                    onChange={(e) =>
                      setDraft((prev) => {
                        const sizes = [...prev.customPerfume.sizes];
                        sizes[idx] = { ...sizes[idx], label: e.target.value };
                        return { ...prev, customPerfume: { ...prev.customPerfume, sizes } };
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#e8dccd] dark:border-[#3a2b26] bg-[#fffdf9] dark:bg-[#211815] text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] text-[#7a655f] dark:text-[#b9a79b] mb-1">
                    السعر (ج.م)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={size.price}
                    onChange={(e) => {
                      const price = Math.max(1, Number(e.target.value) || 0);
                      setDraft((prev) => {
                        const sizes = [...prev.customPerfume.sizes];
                        sizes[idx] = { ...sizes[idx], price };
                        return { ...prev, customPerfume: { ...prev.customPerfume, sizes } };
                      });
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-[#e8dccd] dark:border-[#3a2b26] bg-[#fffdf9] dark:bg-[#211815] text-sm font-bold text-[#9e732b] dark:text-[#d4aa63] tabular-nums"
                  />
                </div>

                <div className="sm:col-span-5">
                  <label className="block text-[11px] text-[#7a655f] dark:text-[#b9a79b] mb-1">
                    الوصف المختصر
                  </label>
                  <input
                    type="text"
                    value={size.description}
                    onChange={(e) =>
                      setDraft((prev) => {
                        const sizes = [...prev.customPerfume.sizes];
                        sizes[idx] = { ...sizes[idx], description: e.target.value };
                        return { ...prev, customPerfume: { ...prev.customPerfume, sizes } };
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#e8dccd] dark:border-[#3a2b26] bg-[#fffdf9] dark:bg-[#211815] text-sm"
                  />
                </div>

                <div className="sm:col-span-1 flex justify-end">
                  <button
                    type="button"
                    disabled={draft.customPerfume.sizes.length <= 1}
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        customPerfume: {
                          ...prev.customPerfume,
                          sizes: prev.customPerfume.sizes.filter((_, i) => i !== idx),
                        },
                      }))
                    }
                    aria-label={`حذف حجم ${size.label}`}
                    className="w-9 h-9 rounded-lg border border-[#e8dccd] dark:border-[#3a2b26] text-[#7a655f] hover:text-[#9b3046] disabled:opacity-30 flex items-center justify-center cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Perfume Suggested Scents */}
        <div className="space-y-2.5 pt-2 border-t border-[#e8dccd] dark:border-[#3a2b26]">
          <p className="text-xs font-semibold text-[#5c4943] dark:text-[#c7b7ab]">
            الاقتراحات السريعة للروائح العطرية
          </p>
          <div className="flex flex-wrap gap-2">
            {draft.customPerfume.suggestedScents.map((scent, idx) => (
              <div
                key={`${scent}-${idx}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e8dccd] dark:border-[#3a2b26] bg-[#faf6f0] dark:bg-[#16100e] text-xs"
              >
                <span>{scent}</span>
                <button
                  type="button"
                  disabled={draft.customPerfume.suggestedScents.length <= 1}
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      customPerfume: {
                        ...prev.customPerfume,
                        suggestedScents: prev.customPerfume.suggestedScents.filter(
                          (_, i) => i !== idx
                        ),
                      },
                    }))
                  }
                  aria-label={`إزالة ${scent}`}
                  className="text-[#7a655f] hover:text-[#9b3046] disabled:opacity-30 cursor-pointer"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2 max-w-md">
            <input
              type="text"
              placeholder="إضافة اقتراح عطر جديد..."
              value={newPerfumeScent}
              onChange={(e) => setNewPerfumeScent(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-[#e8dccd] dark:border-[#3a2b26] bg-[#faf6f0] dark:bg-[#16100e] text-xs"
            />
            <button
              type="button"
              onClick={() => {
                const clean = newPerfumeScent.trim();
                if (!clean) return;
                setDraft((prev) => ({
                  ...prev,
                  customPerfume: {
                    ...prev.customPerfume,
                    suggestedScents: [...prev.customPerfume.suggestedScents, clean],
                  },
                }));
                setNewPerfumeScent('');
              }}
              className="px-3.5 py-2 rounded-lg bg-[#2a1a17] dark:bg-[#352722] text-white text-xs font-bold cursor-pointer"
            >
              إضافة
            </button>
          </div>
        </div>
      </div>

      {/* 2. Custom Candle Section Settings */}
      <div className="rounded-2xl border border-[#e8dccd] dark:border-[#3a2b26] bg-[#fffdf9] dark:bg-[#211815] p-5 sm:p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e8dccd] dark:border-[#3a2b26] pb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-[#9e732b] dark:text-[#d4aa63]" aria-hidden="true" />
            <h4 className="font-display text-xl font-bold text-[#2a1a17] dark:text-[#f3e9df]">
              قسم: اصنع شمعتك
            </h4>
          </div>
        </div>

        {/* Candle Sizes */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-[#5c4943] dark:text-[#c7b7ab]">
              أحجام وأسعار الشمع الأساسية
            </p>
            <button
              type="button"
              onClick={() =>
                setDraft((prev) => ({
                  ...prev,
                  customCandle: {
                    ...prev.customCandle,
                    sizes: [
                      ...prev.customCandle.sizes,
                      {
                        id: `csize-${Date.now()}`,
                        label: 'جامبو',
                        weight: '٤٥٠ جم',
                        burnTime: 'حتى ٨٥ ساعة احتراق',
                        price: 400,
                      },
                    ],
                  },
                }))
              }
              className="px-3 py-1 rounded-lg border border-[#e8dccd] dark:border-[#3a2b26] text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة حجم</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {draft.customCandle.sizes.map((size, idx) => (
              <div
                key={size.id}
                className="p-3.5 rounded-xl border border-[#e8dccd] dark:border-[#3a2b26] bg-[#faf6f0] dark:bg-[#16100e] grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
              >
                <div className="sm:col-span-3">
                  <label className="block text-[11px] text-[#7a655f] dark:text-[#b9a79b] mb-1">
                    اسم الحجم
                  </label>
                  <input
                    type="text"
                    value={size.label}
                    onChange={(e) =>
                      setDraft((prev) => {
                        const sizes = [...prev.customCandle.sizes];
                        sizes[idx] = { ...sizes[idx], label: e.target.value };
                        return { ...prev, customCandle: { ...prev.customCandle, sizes } };
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#e8dccd] dark:border-[#3a2b26] bg-[#fffdf9] dark:bg-[#211815] text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] text-[#7a655f] dark:text-[#b9a79b] mb-1">
                    الوزن
                  </label>
                  <input
                    type="text"
                    value={size.weight}
                    onChange={(e) =>
                      setDraft((prev) => {
                        const sizes = [...prev.customCandle.sizes];
                        sizes[idx] = { ...sizes[idx], weight: e.target.value };
                        return { ...prev, customCandle: { ...prev.customCandle, sizes } };
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#e8dccd] dark:border-[#3a2b26] bg-[#fffdf9] dark:bg-[#211815] text-sm"
                  />
                </div>
                <div className="sm:col-span-4">
                  <label className="block text-[11px] text-[#7a655f] dark:text-[#b9a79b] mb-1">
                    مدة الاحتراق
                  </label>
                  <input
                    type="text"
                    value={size.burnTime}
                    onChange={(e) =>
                      setDraft((prev) => {
                        const sizes = [...prev.customCandle.sizes];
                        sizes[idx] = { ...sizes[idx], burnTime: e.target.value };
                        return { ...prev, customCandle: { ...prev.customCandle, sizes } };
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#e8dccd] dark:border-[#3a2b26] bg-[#fffdf9] dark:bg-[#211815] text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] text-[#7a655f] dark:text-[#b9a79b] mb-1">
                    السعر الأساسي (ج.م)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={size.price}
                    onChange={(e) => {
                      const price = Math.max(1, Number(e.target.value) || 0);
                      setDraft((prev) => {
                        const sizes = [...prev.customCandle.sizes];
                        sizes[idx] = { ...sizes[idx], price };
                        return { ...prev, customCandle: { ...prev.customCandle, sizes } };
                      });
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-[#e8dccd] dark:border-[#3a2b26] bg-[#fffdf9] dark:bg-[#211815] text-sm font-bold text-[#9e732b] dark:text-[#d4aa63] tabular-nums"
                  />
                </div>
                <div className="sm:col-span-1 flex justify-end">
                  <button
                    type="button"
                    disabled={draft.customCandle.sizes.length <= 1}
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        customCandle: {
                          ...prev.customCandle,
                          sizes: prev.customCandle.sizes.filter((_, i) => i !== idx),
                        },
                      }))
                    }
                    className="w-9 h-9 rounded-lg border border-[#e8dccd] dark:border-[#3a2b26] text-[#7a655f] hover:text-[#9b3046] disabled:opacity-30 flex items-center justify-center cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Jar Types Extra Pricing */}
        <div className="space-y-3 pt-3 border-t border-[#e8dccd] dark:border-[#3a2b26]">
          <p className="text-xs font-semibold text-[#5c4943] dark:text-[#c7b7ab]">
            أنواع الجار والتكلفة الإضافية لكل نوع
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {draft.customCandle.jarTypes.map((jar, idx) => (
              <div
                key={jar.id}
                className="p-3.5 rounded-xl border border-[#e8dccd] dark:border-[#3a2b26] bg-[#faf6f0] dark:bg-[#16100e] space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={jar.label}
                    onChange={(e) =>
                      setDraft((prev) => {
                        const jarTypes = [...prev.customCandle.jarTypes];
                        jarTypes[idx] = { ...jarTypes[idx], label: e.target.value };
                        return { ...prev, customCandle: { ...prev.customCandle, jarTypes } };
                      })
                    }
                    className="w-28 px-2.5 py-1.5 rounded-lg border border-[#e8dccd] dark:border-[#3a2b26] bg-[#fffdf9] dark:bg-[#211815] text-sm font-bold"
                  />
                  <span className="text-xs font-bold text-[#9e732b] dark:text-[#d4aa63] tabular-nums">
                    {jar.extraPrice > 0 ? `+ ${formatEGP(jar.extraPrice)}` : 'مشمول'}
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] text-[#7a655f] dark:text-[#b9a79b] mb-1">
                    الإضافة على السعر (ج.م)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={jar.extraPrice}
                    onChange={(e) => {
                      const extraPrice = Math.max(0, Number(e.target.value) || 0);
                      setDraft((prev) => {
                        const jarTypes = [...prev.customCandle.jarTypes];
                        jarTypes[idx] = { ...jarTypes[idx], extraPrice };
                        return { ...prev, customCandle: { ...prev.customCandle, jarTypes } };
                      });
                    }}
                    className="w-full px-3 py-1.5 rounded-lg border border-[#e8dccd] dark:border-[#3a2b26] bg-[#fffdf9] dark:bg-[#211815] text-sm font-bold tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-[#7a655f] dark:text-[#b9a79b] mb-1">
                    وصف الجار
                  </label>
                  <input
                    type="text"
                    value={jar.description}
                    onChange={(e) =>
                      setDraft((prev) => {
                        const jarTypes = [...prev.customCandle.jarTypes];
                        jarTypes[idx] = { ...jarTypes[idx], description: e.target.value };
                        return { ...prev, customCandle: { ...prev.customCandle, jarTypes } };
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-lg border border-[#e8dccd] dark:border-[#3a2b26] bg-[#fffdf9] dark:bg-[#211815] text-xs"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Candle Colors */}
        <div className="space-y-3 pt-3 border-t border-[#e8dccd] dark:border-[#3a2b26]">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-[#5c4943] dark:text-[#c7b7ab]">
              الألوان المتاحة للشمعة
            </p>
            <button
              type="button"
              onClick={() =>
                setDraft((prev) => ({
                  ...prev,
                  customCandle: {
                    ...prev.customCandle,
                    colors: [
                      ...prev.customCandle.colors,
                      { id: `color-${Date.now()}`, label: 'لون جديد', hex: '#c8a870' },
                    ],
                  },
                }))
              }
              className="px-3 py-1 rounded-lg border border-[#e8dccd] dark:border-[#3a2b26] text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة لون</span>
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {draft.customCandle.colors.map((c, idx) => (
              <div
                key={c.id}
                className="flex items-center gap-2 p-2.5 rounded-xl border border-[#e8dccd] dark:border-[#3a2b26] bg-[#faf6f0] dark:bg-[#16100e]"
              >
                <input
                  type="color"
                  aria-label={`لون ${c.label}`}
                  value={c.hex}
                  onChange={(e) =>
                    setDraft((prev) => {
                      const colors = [...prev.customCandle.colors];
                      colors[idx] = { ...colors[idx], hex: e.target.value };
                      return { ...prev, customCandle: { ...prev.customCandle, colors } };
                    })
                  }
                  className="w-9 h-9 rounded-lg border border-[#e8dccd] bg-transparent cursor-pointer shrink-0"
                />
                <input
                  type="text"
                  value={c.label}
                  onChange={(e) =>
                    setDraft((prev) => {
                      const colors = [...prev.customCandle.colors];
                      colors[idx] = { ...colors[idx], label: e.target.value };
                      return { ...prev, customCandle: { ...prev.customCandle, colors } };
                    })
                  }
                  className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg border border-[#e8dccd] dark:border-[#3a2b26] bg-[#fffdf9] dark:bg-[#211815] text-xs"
                />
                <button
                  type="button"
                  disabled={draft.customCandle.colors.length <= 1}
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      customCandle: {
                        ...prev.customCandle,
                        colors: prev.customCandle.colors.filter((_, i) => i !== idx),
                      },
                    }))
                  }
                  className="p-1.5 text-[#7a655f] hover:text-[#9b3046] disabled:opacity-30 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Candle Scents */}
        <div className="space-y-2.5 pt-3 border-t border-[#e8dccd] dark:border-[#3a2b26]">
          <p className="text-xs font-semibold text-[#5c4943] dark:text-[#c7b7ab]">
            الروائح المتاحة لقسم اصنع شمعتك
          </p>
          <div className="flex flex-wrap gap-2">
            {draft.customCandle.scents.map((scent, idx) => (
              <div
                key={`${scent}-${idx}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e8dccd] dark:border-[#3a2b26] bg-[#faf6f0] dark:bg-[#16100e] text-xs"
              >
                <span>{scent}</span>
                <button
                  type="button"
                  disabled={draft.customCandle.scents.length <= 1}
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      customCandle: {
                        ...prev.customCandle,
                        scents: prev.customCandle.scents.filter((_, i) => i !== idx),
                      },
                    }))
                  }
                  className="text-[#7a655f] hover:text-[#9b3046] disabled:opacity-30 cursor-pointer"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2 max-w-md">
            <input
              type="text"
              placeholder="إضافة رائحة شمعة جديدة..."
              value={newCandleScent}
              onChange={(e) => setNewCandleScent(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-[#e8dccd] dark:border-[#3a2b26] bg-[#faf6f0] dark:bg-[#16100e] text-xs"
            />
            <button
              type="button"
              onClick={() => {
                const clean = newCandleScent.trim();
                if (!clean) return;
                setDraft((prev) => ({
                  ...prev,
                  customCandle: {
                    ...prev.customCandle,
                    scents: [...prev.customCandle.scents, clean],
                  },
                }));
                setNewCandleScent('');
              }}
              className="px-3.5 py-2 rounded-lg bg-[#2a1a17] dark:bg-[#352722] text-white text-xs font-bold cursor-pointer"
            >
              إضافة
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 min-h-[44px] rounded-full bg-[#9b3046] hover:bg-[#822639] disabled:opacity-60 text-white text-sm font-bold inline-flex items-center gap-2 cursor-pointer"
        >
          <Save className="w-4 h-4" aria-hidden="true" />
          <span>{saving ? 'جاري الحفظ...' : 'حفظ أسعار وخيارات التخصيص'}</span>
        </button>
      </div>
    </form>
  );
}

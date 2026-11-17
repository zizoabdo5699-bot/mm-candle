import { useEffect, useState } from 'react';
import { Bell, BellOff, BellRing, Plus, Save, Trash2, Truck, Settings } from 'lucide-react';
import type { StoreRuntimeConfig } from '../../config';

interface AdminSettingsTabProps {
  storeConfig: StoreRuntimeConfig;
  saving: boolean;
  browserNotifPermission: NotificationPermission | 'unsupported';
  browserNotifsEnabled: boolean;
  onToggleBrowserNotifs: () => Promise<void>;
  onRequestBrowserPermission: () => Promise<void>;
  onTestBrowserNotif: () => void;
  onSaveStoreConfig: (nextConfig: StoreRuntimeConfig) => Promise<void>;
}

export function AdminSettingsTab({
  storeConfig,
  saving,
  browserNotifPermission,
  browserNotifsEnabled,
  onToggleBrowserNotifs,
  onRequestBrowserPermission,
  onTestBrowserNotif,
  onSaveStoreConfig,
}: AdminSettingsTabProps) {
  const [draft, setDraft] = useState<StoreRuntimeConfig>(() =>
    JSON.parse(JSON.stringify(storeConfig)) as StoreRuntimeConfig
  );

  useEffect(() => {
    setDraft(JSON.parse(JSON.stringify(storeConfig)) as StoreRuntimeConfig);
  }, [storeConfig]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void onSaveStoreConfig(draft);
  };

  const isActive = browserNotifsEnabled && browserNotifPermission === 'granted';

  return (
    <div className="space-y-6">
      {/* 1. Browser Notifications Card */}
      <div className="rounded-2xl border border-[#e8dccd] dark:border-[#3a2b26] bg-[#fffdf9] dark:bg-[#211815] p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                isActive
                  ? 'bg-[#1f8a4c]/15 text-[#1f8a4c] dark:text-[#57c986]'
                  : 'bg-[#9b3046]/12 text-[#9b3046] dark:text-[#d4aa63]'
              }`}
            >
              {isActive ? (
                <BellRing className="w-5 h-5" aria-hidden="true" />
              ) : (
                <BellOff className="w-5 h-5" aria-hidden="true" />
              )}
            </div>
            <div className="space-y-1">
              <h3 className="font-display text-xl font-bold text-[#2a1a17] dark:text-[#f3e9df]">
                إشعارات المتصفح للطلبات الجديدة
              </h3>
              <p className="text-xs sm:text-sm text-[#6f5a53] dark:text-[#b9a79b]">
                تلقي تنبيهات فورية على سطح المكتب أو الهاتف عند وصول طلب جديد موضحًا به رقم الطلب،
                اسم العميل، عدد المنتجات، والإجمالي.
              </p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={isActive}
            disabled={browserNotifPermission === 'unsupported'}
            onClick={() => void onToggleBrowserNotifs()}
            className={`px-4 py-2.5 min-h-[42px] rounded-full text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-45 ${
              isActive
                ? 'bg-[#1f8a4c] hover:bg-[#19723e] text-white'
                : 'bg-[#9b3046] hover:bg-[#822639] text-white'
            }`}
          >
            {isActive ? (
              <>
                <BellOff className="w-4 h-4" aria-hidden="true" />
                <span>تعطيل الإشعارات</span>
              </>
            ) : (
              <>
                <Bell className="w-4 h-4" aria-hidden="true" />
                <span>تمكين إشعارات المتصفح</span>
              </>
            )}
          </button>
        </div>

        <div className="rounded-xl border border-[#e8dccd] dark:border-[#3a2b26] bg-[#faf6f0] dark:bg-[#16100e] p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <p className="font-bold text-[#2a1a17] dark:text-[#f3e9df]">
              الحالة الحالية:{' '}
              <span
                className={
                  isActive
                    ? 'text-[#1f8a4c] dark:text-[#57c986]'
                    : browserNotifPermission === 'denied'
                    ? 'text-[#9b3046] dark:text-[#f29aa9]'
                    : 'text-[#b45309] dark:text-[#fbbf24]'
                }
              >
                {browserNotifPermission === 'unsupported'
                  ? 'المتصفح الحالي لا يدعم إشعارات النظام'
                  : browserNotifPermission === 'denied'
                  ? 'محظورة من إعدادات المتصفح (اسمح بها من أيقونة القفل في شريط العنوان)'
                  : browserNotifPermission === 'default'
                  ? 'بانتظار موافقتك على إذن المتصفح'
                  : browserNotifsEnabled
                  ? 'مفعّلة وجاهزة لإرسال تنبيهات الطلبات الجديدة'
                  : 'معطّلة يدويًا من لوحة الإعدادات'}
              </span>
            </p>
            <p className="text-[#7a655f] dark:text-[#b9a79b]">
              يتم فحص الطلبات الجديدة تلقائيًا كل ١٠ ثوانٍ أثناء فتح لوحة الأدمن.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {browserNotifPermission === 'default' && (
              <button
                type="button"
                onClick={() => void onRequestBrowserPermission()}
                className="px-3.5 py-2 rounded-lg bg-[#9e732b] hover:bg-[#825e21] text-white font-bold cursor-pointer"
              >
                طلب إذن المتصفح الآن
              </button>
            )}
            {browserNotifPermission === 'granted' && (
              <button
                type="button"
                onClick={onTestBrowserNotif}
                className="px-3.5 py-2 rounded-lg border border-[#e8dccd] dark:border-[#3a2b26] bg-[#fffdf9] dark:bg-[#211815] hover:border-[#b98a3e] font-bold text-[#2a1a17] dark:text-[#f3e9df] cursor-pointer"
              >
                إرسال إشعار تجريبي
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. General Store Settings + Shipping Zones */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-[#e8dccd] dark:border-[#3a2b26] bg-[#fffdf9] dark:bg-[#211815] p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between gap-3 border-b border-[#e8dccd] dark:border-[#3a2b26] pb-3">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-[#9b3046] dark:text-[#d4aa63]" aria-hidden="true" />
              <h4 className="font-display text-xl font-bold text-[#2a1a17] dark:text-[#f3e9df]">
                الإعدادات العامة للمتجر
              </h4>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-full bg-[#9b3046] hover:bg-[#822639] disabled:opacity-60 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#2a1a17] dark:text-[#f3e9df] mb-1.5">
                رقم واتساب المتجر (بصيغة دولية)
              </label>
              <input
                type="text"
                dir="ltr"
                value={draft.whatsappNumber}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    whatsappNumber: e.target.value.replace(/\D/g, ''),
                  }))
                }
                className="w-full px-3 py-2 min-h-[40px] rounded-xl border border-[#e8dccd] dark:border-[#3a2b26] bg-[#faf6f0] dark:bg-[#16100e] text-sm tabular-nums text-right"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2a1a17] dark:text-[#f3e9df] mb-1.5">
                حد الشحن المجاني (ج.م)
              </label>
              <input
                type="number"
                min={0}
                value={draft.freeShippingThreshold}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    freeShippingThreshold: Math.max(0, Number(e.target.value) || 0),
                  }))
                }
                className="w-full px-3 py-2 min-h-[40px] rounded-xl border border-[#e8dccd] dark:border-[#3a2b26] bg-[#faf6f0] dark:bg-[#16100e] text-sm font-bold tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2a1a17] dark:text-[#f3e9df] mb-1.5">
                رسوم تغليف الهدايا الخاص (ج.م)
              </label>
              <input
                type="number"
                min={0}
                value={draft.giftWrapFee}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    giftWrapFee: Math.max(0, Number(e.target.value) || 0),
                  }))
                }
                className="w-full px-3 py-2 min-h-[40px] rounded-xl border border-[#e8dccd] dark:border-[#3a2b26] bg-[#faf6f0] dark:bg-[#16100e] text-sm font-bold tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2a1a17] dark:text-[#f3e9df] mb-1.5">
                حد التنبيه لانخفاض المخزون
              </label>
              <input
                type="number"
                min={1}
                value={draft.lowStockThreshold}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    lowStockThreshold: Math.max(1, Number(e.target.value) || 1),
                  }))
                }
                className="w-full px-3 py-2 min-h-[40px] rounded-xl border border-[#e8dccd] dark:border-[#3a2b26] bg-[#faf6f0] dark:bg-[#16100e] text-sm font-bold tabular-nums"
              />
            </div>
          </div>
        </div>

        {/* Shipping Regions */}
        <div className="rounded-2xl border border-[#e8dccd] dark:border-[#3a2b26] bg-[#fffdf9] dark:bg-[#211815] p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e8dccd] dark:border-[#3a2b26] pb-3">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-[#9e732b] dark:text-[#d4aa63]" aria-hidden="true" />
              <h4 className="font-display text-xl font-bold text-[#2a1a17] dark:text-[#f3e9df]">
                أسعار ومناطق الشحن ({draft.governorates.length.toLocaleString('ar-EG')})
              </h4>
            </div>

            <button
              type="button"
              onClick={() =>
                setDraft((prev) => ({
                  ...prev,
                  governorates: [
                    ...prev.governorates,
                    { name: 'منطقة جديدة', zone: 'القاهرة الكبرى', fee: 80, eta: '٢٤ - ٤٨ ساعة' },
                  ],
                }))
              }
              className="px-3.5 py-1.5 rounded-lg border border-[#e8dccd] dark:border-[#3a2b26] hover:border-[#b98a3e] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>إضافة منطقة شحن</span>
            </button>
          </div>

          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pl-1">
            {draft.governorates.map((gov, idx) => (
              <div
                key={`${gov.name}-${idx}`}
                className="p-3 rounded-xl border border-[#e8dccd] dark:border-[#3a2b26] bg-[#faf6f0] dark:bg-[#16100e] grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center"
              >
                <div className="sm:col-span-5">
                  <input
                    type="text"
                    aria-label="اسم المنطقة"
                    value={gov.name}
                    onChange={(e) =>
                      setDraft((prev) => {
                        const governorates = [...prev.governorates];
                        governorates[idx] = { ...governorates[idx], name: e.target.value };
                        return { ...prev, governorates };
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-lg border border-[#e8dccd] dark:border-[#3a2b26] bg-[#fffdf9] dark:bg-[#211815] text-xs font-semibold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <input
                    type="text"
                    aria-label="النطاق"
                    value={gov.zone}
                    onChange={(e) =>
                      setDraft((prev) => {
                        const governorates = [...prev.governorates];
                        governorates[idx] = { ...governorates[idx], zone: e.target.value };
                        return { ...prev, governorates };
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-lg border border-[#e8dccd] dark:border-[#3a2b26] bg-[#fffdf9] dark:bg-[#211815] text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <input
                    type="number"
                    min={0}
                    aria-label="تكلفة الشحن"
                    value={gov.fee}
                    onChange={(e) =>
                      setDraft((prev) => {
                        const governorates = [...prev.governorates];
                        governorates[idx] = {
                          ...governorates[idx],
                          fee: Math.max(0, Number(e.target.value) || 0),
                        };
                        return { ...prev, governorates };
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-lg border border-[#e8dccd] dark:border-[#3a2b26] bg-[#fffdf9] dark:bg-[#211815] text-xs font-bold tabular-nums text-[#9e732b] dark:text-[#d4aa63]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <input
                    type="text"
                    aria-label="مدة التوصيل"
                    value={gov.eta}
                    onChange={(e) =>
                      setDraft((prev) => {
                        const governorates = [...prev.governorates];
                        governorates[idx] = { ...governorates[idx], eta: e.target.value };
                        return { ...prev, governorates };
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-lg border border-[#e8dccd] dark:border-[#3a2b26] bg-[#fffdf9] dark:bg-[#211815] text-xs"
                  />
                </div>

                <div className="sm:col-span-1 flex justify-end">
                  <button
                    type="button"
                    disabled={draft.governorates.length <= 1}
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        governorates: prev.governorates.filter((_, i) => i !== idx),
                      }))
                    }
                    aria-label={`حذف ${gov.name}`}
                    className="w-8 h-8 rounded-lg border border-[#e8dccd] dark:border-[#3a2b26] text-[#7a655f] hover:text-[#9b3046] disabled:opacity-30 flex items-center justify-center cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 min-h-[42px] rounded-full bg-[#9b3046] hover:bg-[#822639] disabled:opacity-60 text-white text-xs sm:text-sm font-bold inline-flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" aria-hidden="true" />
              <span>{saving ? 'جاري الحفظ...' : 'حفظ إعدادات المتجر والشحن'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

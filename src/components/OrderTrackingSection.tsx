import { useState } from 'react';
import {
  PackageCheck,
  PackageSearch,
  Truck,
  CheckCircle2,
  Search,
  XCircle,
  Clock,
} from 'lucide-react';
import { formatEGP, type OrderStatus, type TrackableOrder } from '../data/catalog';

const STEPS: { status: OrderStatus; label: string; hint: string }[] = [
  { status: 'مقبول', label: 'مقبول', hint: 'تم تأكيد ومراجعة طلبك من الإدارة' },
  { status: 'قيد التجهيز', label: 'قيد التجهيز', hint: 'يتم صب وتغليف طلبك بعناية' },
  { status: 'جاري الشحن', label: 'جاري الشحن', hint: 'الطلب مع شركة التوصيل في طريقه إليك' },
  { status: 'تم التوصيل', label: 'تم التوصيل', hint: 'تم تسليم الطلب بنجاح' },
];

interface OrderTrackingSectionProps {
  recentOrderNumber?: string;
}

export function OrderTrackingSection({ recentOrderNumber }: OrderTrackingSectionProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackedOrder, setTrackedOrder] = useState<TrackableOrder | null>(null);

  const runLookup = async (orderNumberToSearch: string) => {
    const trimmed = orderNumberToSearch.trim();
    if (!trimmed) {
      setError('يرجى إدخال رقم الطلب أولًا.');
      setTrackedOrder(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/track/${encodeURIComponent(trimmed)}`);
      const payload = (await res.json()) as { order?: TrackableOrder; error?: string };
      if (!res.ok || !payload.order) {
        setTrackedOrder(null);
        setError(payload.error || 'لم يتم العثور على طلب مسجل بهذا الرقم.');
      } else {
        setTrackedOrder(payload.order);
      }
    } catch {
      setTrackedOrder(null);
      setError('تعذر الاتصال بخدمة التتبع حاليًا. حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void runLookup(query);
  };

  const activeStepIndex = trackedOrder
    ? STEPS.findIndex((s) => s.status === trackedOrder.status)
    : -1;

  return (
    <section
      id="track"
      className="border-t border-[#e8dccd] dark:border-[#3a2b26] bg-[#f4ece0]/55 dark:bg-[#1c1411]"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 space-y-4">
            <p className="text-xs font-semibold text-[#9e732b] dark:text-[#d4aa63]">
              متابعة الطلبات
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#2a1a17] dark:text-[#f3e9df]">
              تتبع حالة طلبك
            </h2>
            <p className="text-sm sm:text-base text-[#5c4943] dark:text-[#c7b7ab] leading-relaxed">
              أدخل رقم طلبك المرسل بعد التأكيد لمعرفة المرحلة الحالية للطلب من التجهيز وحتى
              الاستلام.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3 pt-1">
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <label htmlFor="track-order-input" className="sr-only">
                    رقم الطلب
                  </label>
                  <input
                    id="track-order-input"
                    type="text"
                    dir="ltr"
                    placeholder="أدخل رقم الطلب (MM-XXXX)"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full px-4 py-2.5 min-h-[46px] rounded-xl border border-[#e8dccd] dark:border-[#3a2b26] bg-[#fffdf9] dark:bg-[#211815] text-[#2a1a17] dark:text-[#f3e9df] text-sm text-right uppercase tabular-nums focus:outline-none focus:border-[#b98a3e]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="min-h-[46px] px-6 py-2.5 rounded-full bg-[#9b3046] hover:bg-[#822639] disabled:opacity-60 text-white text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Search className="w-4 h-4" aria-hidden="true" />
                  <span>{loading ? 'جاري البحث...' : 'تحقق من الحالة'}</span>
                </button>
              </div>

              {recentOrderNumber && (
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#7a655f] dark:text-[#b9a79b]">
                  <span>طلبك الأخير:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setQuery(recentOrderNumber);
                      void runLookup(recentOrderNumber);
                    }}
                    className="font-bold text-[#1f6f43] dark:text-[#57c986] hover:underline underline-offset-4 tabular-nums cursor-pointer"
                  >
                    #{recentOrderNumber}
                  </button>
                </div>
              )}
            </form>
          </div>

          <div className="lg:col-span-7">
            <div className="rounded-2xl bg-[#fffdf9] dark:bg-[#211815] border border-[#e8dccd] dark:border-[#3a2b26] p-6 sm:p-8 min-h-[240px] flex flex-col justify-center">
              {error ? (
                <div role="alert" className="text-center space-y-2 py-4">
                  <PackageSearch
                    className="w-8 h-8 mx-auto text-[#9b3046] dark:text-[#e07a8e]"
                    aria-hidden="true"
                  />
                  <p className="text-sm font-bold text-[#9b3046] dark:text-[#e07a8e]">{error}</p>
                  <p className="text-xs text-[#7a655f] dark:text-[#b9a79b]">
                    تحقق من كتابة رقم الطلب بشكل صحيح، أو أرسل طلبًا جديدًا من الأسفل.
                  </p>
                </div>
              ) : !trackedOrder ? (
                <div className="text-center space-y-2 py-4">
                  <PackageSearch
                    className="w-8 h-8 mx-auto text-[#9e732b] dark:text-[#d4aa63]"
                    aria-hidden="true"
                  />
                  <p className="text-sm font-bold text-[#2a1a17] dark:text-[#f3e9df]">
                    أدخل رقم الطلب لعرض التفاصيل وحالة الشحن
                  </p>
                  <p className="text-xs text-[#7a655f] dark:text-[#b9a79b]">
                    تُحدَّث حالات الطلبات مباشرة من إدارة المتجر.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#e8dccd] dark:border-[#3a2b26]">
                    <div>
                      <p className="text-xs text-[#7a655f] dark:text-[#b9a79b]">رقم الطلب</p>
                      <h3 className="text-xl font-bold text-[#2a1a17] dark:text-[#f3e9df] tabular-nums">
                        #{trackedOrder.orderNumber}
                      </h3>
                    </div>

                    <div className="text-left">
                      <span
                        className={`inline-flex items-center gap-1.5 text-sm font-bold ${
                          trackedOrder.status === 'مرفوض'
                            ? 'text-[#b91c1c] dark:text-[#f87171]'
                            : trackedOrder.status === 'تم التوصيل' ||
                              trackedOrder.status === 'مقبول'
                            ? 'text-[#1f8a4c] dark:text-[#57c986]'
                            : 'text-[#9b3046] dark:text-[#d4aa63]'
                        }`}
                      >
                        {trackedOrder.status === 'جديد' && (
                          <Clock className="w-4 h-4" aria-hidden="true" />
                        )}
                        {trackedOrder.status === 'مقبول' && (
                          <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                        )}
                        {trackedOrder.status === 'مرفوض' && (
                          <XCircle className="w-4 h-4" aria-hidden="true" />
                        )}
                        {trackedOrder.status === 'قيد التجهيز' && (
                          <PackageCheck className="w-4 h-4" aria-hidden="true" />
                        )}
                        {trackedOrder.status === 'جاري الشحن' && (
                          <Truck className="w-4 h-4" aria-hidden="true" />
                        )}
                        {trackedOrder.status === 'تم التوصيل' && (
                          <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                        )}
                        <span>{trackedOrder.status}</span>
                      </span>
                      <p className="text-xs text-[#7a655f] dark:text-[#b9a79b] tabular-nums">
                        آخر تحديث: {trackedOrder.updatedAt}
                      </p>
                    </div>
                  </div>

                  {trackedOrder.status === 'مرفوض' ? (
                    <div
                      role="alert"
                      className="rounded-xl border border-[#b91c1c]/30 bg-[#fee2e2]/60 dark:bg-[#3a1515]/60 p-4 text-xs sm:text-sm text-[#991b1b] dark:text-[#fca5a5]"
                    >
                      تم رفض هذا الطلب من إدارة المتجر. للمساعدة أو تعديل الطلب يمكنك التواصل معنا
                      مباشرة عبر واتساب.
                    </div>
                  ) : (
                    <>
                      {trackedOrder.status === 'جديد' && (
                        <div className="rounded-xl border border-[#b98a3e]/35 bg-[#faf6f0] dark:bg-[#1a1310] px-4 py-2.5 text-xs text-[#5c4943] dark:text-[#c7b7ab] flex items-center gap-2">
                          <Clock
                            className="w-4 h-4 text-[#9e732b] dark:text-[#d4aa63] shrink-0"
                            aria-hidden="true"
                          />
                          <span>تم استلام طلبك بنجاح وهو الآن قيد المراجعة والقبول من الإدارة.</span>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {STEPS.map((step, index) => {
                          const reached = index <= activeStepIndex;
                          const current = index === activeStepIndex;
                          return (
                            <div
                              key={step.status}
                              className={`rounded-xl p-3 border transition-colors ${
                                current
                                  ? 'border-[#9b3046] bg-[#9b3046]/8 dark:border-[#d4aa63] dark:bg-[#d4aa63]/10'
                                  : reached
                                  ? 'border-[#1f8a4c]/40 bg-[#eef8f2]/70 dark:bg-[#13261b]/60 dark:border-[#399962]/35'
                                  : 'border-[#e8dccd] dark:border-[#3a2b26] opacity-60'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="text-xs font-bold text-[#2a1a17] dark:text-[#f3e9df]">
                                  {index + 1}. {step.label}
                                </span>
                                {reached && (
                                  <CheckCircle2
                                    className={`w-4 h-4 shrink-0 ${
                                      current
                                        ? 'text-[#9b3046] dark:text-[#d4aa63]'
                                        : 'text-[#1f8a4c] dark:text-[#57c986]'
                                    }`}
                                    aria-hidden="true"
                                  />
                                )}
                              </div>
                              <p className="text-[11px] text-[#6f5a53] dark:text-[#b9a79b] leading-relaxed">
                                {step.hint}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {trackedOrder.items && trackedOrder.items.length > 0 && (
                    <div className="rounded-xl border border-[#e8dccd] dark:border-[#3a2b26] bg-[#faf6f0]/70 dark:bg-[#1a1310] p-3.5 space-y-1.5">
                      <p className="text-[11px] font-bold text-[#7a655f] dark:text-[#b9a79b]">
                        محتويات الطلب:
                      </p>
                      <ul className="space-y-1 text-xs text-[#2a1a17] dark:text-[#f3e9df]">
                        {trackedOrder.items.map((item, idx) => (
                          <li key={`${item.productId}-${idx}`} className="flex justify-between gap-2">
                            <span>
                              {item.name} ({item.scent}) × {item.quantity.toLocaleString('ar-EG')}
                            </span>
                            <span className="tabular-nums text-[#7a655f] dark:text-[#b9a79b]">
                              {formatEGP(item.price * item.quantity)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="pt-2 border-t border-[#e8dccd] dark:border-[#3a2b26] flex flex-wrap items-center justify-between gap-3 text-xs text-[#6f5a53] dark:text-[#b9a79b]">
                    <span>
                      العميل:{' '}
                      <strong className="text-[#2a1a17] dark:text-[#f3e9df]">
                        {trackedOrder.customerName}
                      </strong>{' '}
                      · {trackedOrder.governorate}
                    </span>
                    <span className="tabular-nums">
                      {trackedOrder.itemCount.toLocaleString('ar-EG')} منتجات · الإجمالي{' '}
                      <strong className="text-[#9e732b] dark:text-[#d4aa63]">
                        {formatEGP(trackedOrder.total)}
                      </strong>
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

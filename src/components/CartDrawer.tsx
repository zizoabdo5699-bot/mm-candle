import { useEffect } from 'react';
import { Minus, Plus, ShoppingBag, Trash2, X, ArrowLeft } from 'lucide-react';
import {
  FREE_SHIPPING_THRESHOLD,
  GOVERNORATES,
  estimateShipping,
  formatEGP,
  type CustomItemDetails,
  type Product,
} from '../data/catalog';

export interface CartItem {
  key: string;
  product: Product;
  scent: string;
  quantity: number;
  isCustom?: boolean;
  customDetails?: CustomItemDetails;
}

interface CartDrawerProps {
  open: boolean;
  items: CartItem[];
  governorate: string;
  onChangeGovernorate: (gov: string) => void;
  onClose: () => void;
  onUpdateQty: (key: string, delta: number) => void;
  onRemoveItem: (key: string) => void;
  onProceedToCheckout: () => void;
}

export function CartDrawer({
  open,
  items,
  governorate,
  onChangeGovernorate,
  onClose,
  onUpdateQty,
  onRemoveItem,
  onProceedToCheckout,
}: CartDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const subtotal = items.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const shipping = estimateShipping(subtotal, governorate);
  const remainingForFreeShipping = shipping.remainingForFree;
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/55 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="سلة المشتريات"
    >
      <aside
        className="w-full max-w-md h-full bg-[#fffdf9] dark:bg-[#1e1513] border-r border-[#e8dccd] dark:border-[#3a2b26] shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-[#e8dccd] dark:border-[#3a2b26] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-[#9b3046] dark:text-[#d4aa63]" aria-hidden="true" />
            <h2 className="font-display text-2xl font-bold text-[#2a1a17] dark:text-[#f3e9df]">
              سلة طلباتك
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق السلة"
            className="w-10 h-10 rounded-full border border-[#e8dccd] dark:border-[#3a2b26] text-[#5c4943] dark:text-[#b9a79b] hover:bg-[#f3e8da] dark:hover:bg-[#2d201c] flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-3.5 bg-[#faf6f0] dark:bg-[#16100e] border-b border-[#e8dccd] dark:border-[#3a2b26]">
          <p className="text-xs font-medium text-[#5c4943] dark:text-[#c7b7ab] mb-2">
            {remainingForFreeShipping === 0
              ? 'مبروك! طلبك مؤهل للشحن المجاني داخل مصر.'
              : `أضف بقيمة ${formatEGP(remainingForFreeShipping)} للحصول على شحن مجاني`}
          </p>
          <div className="h-1.5 w-full rounded-full bg-[#e8dccd] dark:bg-[#3a2b26] overflow-hidden">
            <div
              className="h-full bg-[#9e732b] dark:bg-[#d4aa63] transition-transform duration-300 origin-right"
              style={{ transform: `scaleX(${progress / 100})` }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-[#e8dccd] dark:divide-[#3a2b26]">
          {items.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <p className="text-base font-semibold text-[#2a1a17] dark:text-[#f3e9df]">
                سلتك فارغة حاليًا
              </p>
              <p className="text-sm text-[#7a655f] dark:text-[#b9a79b]">
                اختر شمعة أو معطر جو من القائمة لتبدأ طلبك.
              </p>
            </div>
          ) : (
            items.map((item) => {
              const reachedMaxStock =
                !item.isCustom && item.product.stock > 0 && item.quantity >= item.product.stock;

              return (
                <div key={item.key} className="py-4 flex items-start justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <h3 className="text-sm font-bold text-[#2a1a17] dark:text-[#f3e9df]">
                      {item.product.name}
                    </h3>
                    {item.customDetails?.kind === 'perfume' ? (
                      <div className="text-xs text-[#7a655f] dark:text-[#b9a79b] space-y-0.5">
                        <p>العطر المطلوب: {item.customDetails.scentName}</p>
                        <p>الاسم على الزجاجة: {item.customDetails.bottleName}</p>
                        <p>الحجم: {item.customDetails.sizeLabel}</p>
                      </div>
                    ) : item.customDetails?.kind === 'candle' ? (
                      <div className="text-xs text-[#7a655f] dark:text-[#b9a79b] space-y-0.5">
                        <p>
                          الحجم: {item.customDetails.sizeLabel} ({item.customDetails.sizeWeight})
                        </p>
                        <p>
                          اللون: {item.customDetails.colorLabel} · الجار: {item.customDetails.jarType}
                        </p>
                        <p>الرائحة: {item.customDetails.scent}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-[#7a655f] dark:text-[#b9a79b]">
                        الرائحة: {item.scent}
                      </p>
                    )}
                    <p className="text-sm font-semibold text-[#9e732b] dark:text-[#d4aa63] tabular-nums pt-1">
                      {formatEGP(item.product.price * item.quantity)}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="inline-flex items-center border border-[#e8dccd] dark:border-[#3a2b26] rounded-full bg-[#faf6f0] dark:bg-[#16100e]">
                      <button
                        type="button"
                        disabled={reachedMaxStock}
                        onClick={() => onUpdateQty(item.key, 1)}
                        aria-label={`زيادة كمية ${item.product.name}`}
                        className="w-8 h-8 flex items-center justify-center text-[#2a1a17] dark:text-[#f3e9df] hover:text-[#9b3046] disabled:opacity-35 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold tabular-nums text-[#2a1a17] dark:text-[#f3e9df]">
                        {item.quantity.toLocaleString('ar-EG')}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateQty(item.key, -1)}
                        aria-label={`إنقاص كمية ${item.product.name}`}
                        className="w-8 h-8 flex items-center justify-center text-[#2a1a17] dark:text-[#f3e9df] hover:text-[#9b3046] cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.key)}
                    className="inline-flex items-center gap-1 text-xs text-[#7a655f] dark:text-[#b9a79b] hover:text-[#9b3046] dark:hover:text-[#e07a8e] cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>إزالة</span>
                  </button>
                </div>
              </div>
              );
            })
          )}
        </div>

        <div className="p-6 border-t border-[#e8dccd] dark:border-[#3a2b26] bg-[#faf6f0] dark:bg-[#16100e] space-y-3.5">
          {items.length > 0 && (
            <div className="space-y-2 pb-2 border-b border-[#e8dccd] dark:border-[#3a2b26]">
              <div className="flex items-center justify-between gap-2 text-xs">
                <label
                  htmlFor="drawer-gov"
                  className="font-semibold text-[#5c4943] dark:text-[#b9a79b] whitespace-nowrap shrink-0"
                >
                  تقدير الشحن للمنطقة
                </label>
                <select
                  id="drawer-gov"
                  value={shipping.governorate.name}
                  onChange={(e) => onChangeGovernorate(e.target.value)}
                  className="max-w-[205px] truncate px-2.5 py-1.5 rounded-lg border border-[#e8dccd] dark:border-[#3a2b26] bg-[#fffdf9] dark:bg-[#211815] text-[#2a1a17] dark:text-[#f3e9df] text-xs focus:outline-none focus:border-[#b98a3e]"
                >
                  {GOVERNORATES.map((g) => (
                    <option key={g.name} value={g.name}>
                      {g.name} ({formatEGP(g.fee)})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-between text-xs text-[#6f5a53] dark:text-[#b9a79b]">
                <span>الشحن المقدر ({shipping.governorate.eta})</span>
                <span className="tabular-nums font-semibold">
                  {shipping.isFree ? 'مجاني' : formatEGP(shipping.fee)}
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-base font-bold text-[#2a1a17] dark:text-[#f3e9df]">
            <span>الإجمالي المقدر</span>
            <span className="tabular-nums text-[#9e732b] dark:text-[#d4aa63]">
              {formatEGP(subtotal + shipping.fee)}
            </span>
          </div>

          <button
            type="button"
            disabled={items.length === 0}
            onClick={onProceedToCheckout}
            className="w-full min-h-[46px] px-6 py-3 rounded-full bg-[#9b3046] hover:bg-[#822639] disabled:opacity-45 disabled:pointer-events-none text-white text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <span>إتمام الطلب وتأكيد البيانات</span>
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </aside>
    </div>
  );
}

import { useState } from 'react';
import {
  CheckCircle2,
  Copy,
  MessageCircle,
  Minus,
  Plus,
  Trash2,
  Check,
  Truck,
  Gift,
  Mail,
  X,
  ExternalLink,
} from 'lucide-react';
import { STORE_CONFIG, type StoreRuntimeConfig } from '../config';
import { estimateShipping, formatEGP, type Product } from '../data/catalog';
import type { CartItem } from './CartDrawer';

export interface CustomerDetails {
  name: string;
  phone: string;
  email?: string;
  governorate: string;
  address: string;
  notes: string;
  paymentMethod: 'cod' | 'wallet';
  hasGiftMessage?: boolean;
  giftMessage?: string;
  giftWrap?: boolean;
  sendViaWhatsapp?: boolean;
  sendViaEmail?: boolean;
}

export interface EmailOrderStatus {
  requested: boolean;
  sent: boolean;
  providerConfigured: boolean;
  recipient?: string;
  message?: string;
}

export interface ConfirmedOrder {
  orderNumber: string;
  createdAt: string;
  total: number;
  customerName: string;
  governorate: string;
  itemCount: number;
  whatsappUrl?: string;
  customerEmail?: string;
  emailHtml?: string;
  emailStatus?: EmailOrderStatus;
  mailtoUrl?: string;
}

interface CheckoutSectionProps {
  items: CartItem[];
  customer: CustomerDetails;
  lastOrder: ConfirmedOrder | null;
  storeConfig?: StoreRuntimeConfig;
  onChangeCustomer: (next: CustomerDetails) => void;
  onUpdateQty: (key: string, delta: number) => void;
  onRemoveItem: (key: string) => void;
  onConfirmOrder: (order: ConfirmedOrder) => void;
  onClearCart?: () => void;
  onProductsUpdated?: (products: Product[]) => void;
}

function generateOrderNumber(): string {
  return `MM-${Math.floor(1000 + Math.random() * 9000)}`;
}

function formatCartItemForWhatsapp(item: CartItem): string {
  const lineTotal = formatEGP(item.product.price * item.quantity);
  if (item.customDetails?.kind === 'perfume') {
    const d = item.customDetails;
    return `- ${item.product.name} [العطر: ${d.scentName} | الاسم على الزجاجة: ${d.bottleName} | الحجم: ${d.sizeLabel}] × ${item.quantity} = ${lineTotal}`;
  }
  if (item.customDetails?.kind === 'candle') {
    const d = item.customDetails;
    return `- ${item.product.name} [الحجم: ${d.sizeLabel} (${d.sizeWeight}) | اللون: ${d.colorLabel} | الرائحة: ${d.scent} | الجار: ${d.jarType}] × ${item.quantity} = ${lineTotal}`;
  }
  return `- ${item.product.name} (${item.scent}) × ${item.quantity} = ${lineTotal}`;
}

export function CheckoutSection({
  items,
  customer,
  lastOrder,
  storeConfig = STORE_CONFIG,
  onChangeCustomer,
  onUpdateQty,
  onRemoveItem,
  onConfirmOrder,
  onClearCart,
  onProductsUpdated,
}: CheckoutSectionProps) {
  const [copied, setCopied] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [emailPreviewOpen, setEmailPreviewOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pendingOrderNumber, setPendingOrderNumber] = useState<string>(() => generateOrderNumber());

  const subtotal = items.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const configuredGiftWrapFee = storeConfig.giftWrapFee;
  const giftWrapFee = items.length > 0 && customer.giftWrap ? configuredGiftWrapFee : 0;
  const giftMessageText = customer.hasGiftMessage ? (customer.giftMessage || '').trim() : '';
  const shipping = estimateShipping(
    subtotal,
    customer.governorate,
    storeConfig.governorates,
    storeConfig.freeShippingThreshold
  );
  const total = subtotal + giftWrapFee + shipping.fee;

  const phoneDigits = customer.phone.replace(/\D/g, '');
  const isPhoneValid = phoneDigits.length >= 10;
  const emailValue = (customer.email || '').trim();
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue);
  const isEmailReady = !customer.sendViaEmail || isEmailValid;
  const isFormValid =
    items.length > 0 &&
    customer.name.trim().length >= 2 &&
    isPhoneValid &&
    customer.address.trim().length >= 5 &&
    isEmailReady;

  const lines = items.map(formatCartItemForWhatsapp);

  const paymentLabel =
    customer.paymentMethod === 'cod' ? 'الدفع نقدًا عند الاستلام' : 'تحويل محفظة إلكترونية';

  const buildWhatsappMessage = (orderNum: string) =>
    [
      'طلب جديد من M&M Candle Co.',
      `رقم الطلب: #${orderNum}`,
      ...lines,
      `المجموع الفرعي: ${formatEGP(subtotal)}`,
      ...(customer.giftWrap ? [`تغليف هدايا خاص: ${formatEGP(configuredGiftWrapFee)}`] : []),
      `الشحن (${shipping.governorate.name} - ${shipping.governorate.eta}): ${
        shipping.isFree ? 'مجاني' : formatEGP(shipping.fee)
      }`,
      `الإجمالي النهائي: ${formatEGP(total)}`,
      `طريقة الدفع: ${paymentLabel}`,
      `الاسم: ${customer.name.trim()}`,
      `الموبايل: ${customer.phone.trim()}`,
      `العنوان: ${shipping.governorate.name} - ${customer.address.trim()}`,
      ...(giftMessageText ? [`رسالة الإهداء: «${giftMessageText}»`] : []),
      ...(customer.notes.trim() ? [`ملاحظات: ${customer.notes.trim()}`] : []),
    ].join('\n');

  const whatsappMessage = buildWhatsappMessage(pendingOrderNumber);

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(whatsappMessage);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  const handleCopyEmailHtml = async () => {
    if (!lastOrder?.emailHtml) return;
    try {
      await navigator.clipboard.writeText(lastOrder.emailHtml);
      setCopiedHtml(true);
      window.setTimeout(() => setCopiedHtml(false), 2200);
    } catch {
      setCopiedHtml(false);
    }
  };

  const handleConfirmClick = async () => {
    if (!isFormValid || submitting) return;
    setSubmitting(true);
    setSubmitError(null);

    const requestedOrderNumber = pendingOrderNumber;
    const createdAt = new Date().toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);
    const snapshotCustomer = {
      customerName: customer.name.trim(),
      phone: customer.phone.trim(),
      customerEmail: emailValue || undefined,
      sendViaEmail: Boolean(customer.sendViaEmail && isEmailValid),
      governorate: shipping.governorate.name,
      address: customer.address.trim(),
      notes: customer.notes.trim(),
      paymentMethod: customer.paymentMethod,
      giftWrap: Boolean(customer.giftWrap),
      giftWrapFee,
      giftMessage: giftMessageText,
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: requestedOrderNumber,
          ...snapshotCustomer,
          items: items.map((item) => ({
            productId: item.product.id,
            name: item.product.name,
            scent: item.scent,
            price: item.product.price,
            quantity: item.quantity,
            ...(item.isCustom ? { isCustom: true } : {}),
            ...(item.customDetails ? { customDetails: item.customDetails } : {}),
          })),
          itemCount,
          subtotal,
          shippingFee: shipping.fee,
          total,
        }),
      });

      const data = (await res.json()) as {
        order?: { orderNumber: string };
        products?: Product[];
        emailHtml?: string;
        emailStatus?: EmailOrderStatus;
        error?: string;
      };

      if (!res.ok) {
        setSubmitError(data.error || 'تعذر تسجيل الطلب حاليًا. يرجى المحاولة مجددًا.');
        return;
      }

      if (data.products && Array.isArray(data.products)) {
        onProductsUpdated?.(data.products);
      }

      const finalOrderNumber = data.order?.orderNumber || requestedOrderNumber;
      const finalMsg = buildWhatsappMessage(finalOrderNumber);
      const finalWaUrl = `https://wa.me/${storeConfig.whatsappNumber}?text=${encodeURIComponent(finalMsg)}`;
      const mailtoSubject = encodeURIComponent(
        `تأكيد طلبك #${finalOrderNumber} — M&M Candle Co.`
      );
      const mailtoBody = encodeURIComponent(finalMsg);
      const mailtoUrl =
        snapshotCustomer.sendViaEmail && snapshotCustomer.customerEmail
          ? `mailto:${encodeURIComponent(snapshotCustomer.customerEmail)}?subject=${mailtoSubject}&body=${mailtoBody}`
          : undefined;

      onConfirmOrder({
        orderNumber: finalOrderNumber,
        createdAt,
        total,
        customerName: snapshotCustomer.customerName,
        governorate: snapshotCustomer.governorate,
        itemCount,
        whatsappUrl: customer.sendViaWhatsapp ? finalWaUrl : undefined,
        customerEmail: snapshotCustomer.customerEmail,
        emailHtml: data.emailHtml,
        emailStatus: data.emailStatus,
        mailtoUrl,
      });

      setPendingOrderNumber(generateOrderNumber());
      onClearCart?.();

      if (customer.sendViaWhatsapp) {
        const link = document.createElement('a');
        link.href = finalWaUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch {
      setSubmitError('تعذر الاتصال بالخادم لتسجيل الطلب. يرجى المحاولة مرة أخرى.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="order" className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
      <div className="mb-8 max-w-2xl">
        <p className="text-xs font-semibold text-[#9e732b] dark:text-[#d4aa63] mb-2">
          إتمام الطلب والتوصيل
        </p>
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#2a1a17] dark:text-[#f3e9df]">
          طلبك جاهز للتأكيد
        </h2>
        <p className="mt-2 text-sm sm:text-base text-[#6f5a53] dark:text-[#b9a79b]">
          أكمل بيانات التوصيل لتسجيل طلبك مباشرة في المتجر، مع إمكانية إرساله عبر البريد الإلكتروني
          أو واتساب.
        </p>
      </div>

      {lastOrder && (
        <div
          role="status"
          className="mb-8 p-5 rounded-2xl border border-[#2d7a4f]/30 bg-[#eef8f2] dark:bg-[#13261b] dark:border-[#399962]/40 space-y-3"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle2
                className="w-5 h-5 text-[#1f6f43] dark:text-[#57c986] shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div className="space-y-1">
                <p className="text-sm font-bold text-[#154d2e] dark:text-[#b9f0cf]">
                  تم تسجيل الطلب #{lastOrder.orderNumber} في النظام بنجاح
                </p>
                <p className="text-xs text-[#26603f] dark:text-[#8fd3ac]">
                  باسم {lastOrder.customerName} · {lastOrder.governorate} ·{' '}
                  {lastOrder.itemCount.toLocaleString('ar-EG')} منتجات · الإجمالي{' '}
                  <span className="tabular-nums font-semibold">{formatEGP(lastOrder.total)}</span>
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {lastOrder.emailHtml && (
                <button
                  type="button"
                  onClick={() => setEmailPreviewOpen(true)}
                  className="px-3.5 py-2 rounded-full bg-[#9b3046] hover:bg-[#822639] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Mail className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>معاينة رسالة البريد الإلكتروني</span>
                </button>
              )}
              {lastOrder.whatsappUrl && (
                <a
                  href={lastOrder.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-full bg-[#1f8a4c] hover:bg-[#19723e] text-white text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap"
                >
                  <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>فتح رسالة واتساب</span>
                </a>
              )}
              <a
                href="#track"
                className="text-xs font-bold text-[#154d2e] dark:text-[#b9f0cf] underline underline-offset-4 whitespace-nowrap"
              >
                تتبع حالة الطلب
              </a>
              <span className="text-xs font-medium text-[#26603f] dark:text-[#8fd3ac] whitespace-nowrap">
                الساعة {lastOrder.createdAt}
              </span>
            </div>
          </div>

          {lastOrder.emailStatus?.requested && lastOrder.emailStatus.message && (
            <div className="pt-2 border-t border-[#2d7a4f]/20 flex flex-wrap items-center justify-between gap-2 text-xs text-[#154d2e] dark:text-[#b9f0cf]">
              <span>
                <strong>البريد الإلكتروني:</strong> {lastOrder.emailStatus.message}
              </span>
              {lastOrder.mailtoUrl && (
                <a
                  href={lastOrder.mailtoUrl}
                  className="inline-flex items-center gap-1 font-bold underline underline-offset-4 whitespace-nowrap"
                >
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>فتح في تطبيق البريد</span>
                </a>
              )}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Right Column (in RTL): Cart Items & Cost Breakdown */}
        <div className="lg:col-span-5 rounded-2xl bg-[#fffdf9] dark:bg-[#211815] border border-[#e8dccd] dark:border-[#3a2b26] p-6 space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-[#e8dccd] dark:border-[#3a2b26]">
            <h3 className="font-display text-2xl font-bold text-[#2a1a17] dark:text-[#f3e9df]">
              ملخص المنتجات
            </h3>
            <span className="text-xs text-[#7a655f] dark:text-[#b9a79b] tabular-nums">
              {items.reduce((acc, i) => acc + i.quantity, 0).toLocaleString('ar-EG')} قطع
            </span>
          </div>

          {items.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <p className="text-sm font-semibold text-[#2a1a17] dark:text-[#f3e9df]">
                لسه ما اخترتش حاجة.
              </p>
              <p className="text-xs text-[#7a655f] dark:text-[#b9a79b]">
                أضف منتجًا من القائمة بالأعلى لعرض التكلفة وتأكيد طلبك.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#e8dccd] dark:divide-[#3a2b26]">
              {items.map((item) => {
                const reachedMaxStock =
                  !item.isCustom && item.product.stock > 0 && item.quantity >= item.product.stock;

                return (
                  <div key={item.key} className="py-3.5 flex items-center justify-between gap-3">
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-sm font-bold text-[#2a1a17] dark:text-[#f3e9df] truncate">
                        {item.product.name}
                      </p>
                      {item.customDetails?.kind === 'perfume' ? (
                        <p className="text-xs text-[#7a655f] dark:text-[#b9a79b]">
                          العطر: {item.customDetails.scentName} · الاسم:{' '}
                          {item.customDetails.bottleName} ·{' '}
                          <span className="tabular-nums">{formatEGP(item.product.price)}</span>
                        </p>
                      ) : item.customDetails?.kind === 'candle' ? (
                        <p className="text-xs text-[#7a655f] dark:text-[#b9a79b]">
                          {item.customDetails.colorLabel} · جار {item.customDetails.jarType} ·{' '}
                          {item.customDetails.scent} ·{' '}
                          <span className="tabular-nums">{formatEGP(item.product.price)}</span>
                        </p>
                      ) : (
                        <p className="text-xs text-[#7a655f] dark:text-[#b9a79b] truncate">
                          {item.scent} ·{' '}
                          <span className="tabular-nums">{formatEGP(item.product.price)}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
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
                        aria-label={`حذف ${item.product.name}`}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[#7a655f] dark:text-[#b9a79b] hover:text-[#9b3046] cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-4 border-t border-[#e8dccd] dark:border-[#3a2b26] space-y-2.5 text-sm">
            <div className="flex justify-between text-[#6f5a53] dark:text-[#b9a79b]">
              <span>المجموع الفرعي</span>
              <span className="tabular-nums font-medium">{formatEGP(subtotal)}</span>
            </div>
            {customer.giftWrap && (
              <div className="flex justify-between text-[#9b3046] dark:text-[#d4aa63]">
                <span>تغليف هدايا خاص</span>
                <span className="tabular-nums font-medium">{formatEGP(configuredGiftWrapFee)}</span>
              </div>
            )}
            <div className="flex justify-between text-[#6f5a53] dark:text-[#b9a79b]">
              <span>الشحن المقدر ({shipping.governorate.name})</span>
              <span className="tabular-nums font-medium">
                {items.length === 0
                  ? `${formatEGP(shipping.governorate.fee)} (تقديري)`
                  : shipping.isFree
                  ? 'مجاني'
                  : formatEGP(shipping.fee)}
              </span>
            </div>
            <div className="flex justify-between text-xs text-[#7a655f] dark:text-[#b9a79b]">
              <span>مدة التوصيل المتوقعة</span>
              <span>{shipping.governorate.eta}</span>
            </div>
            <div className="pt-3 border-t border-[#e8dccd] dark:border-[#3a2b26] flex justify-between items-baseline text-lg font-bold text-[#2a1a17] dark:text-[#f3e9df]">
              <span>الإجمالي النهائي</span>
              <span className="tabular-nums text-[#9e732b] dark:text-[#d4aa63]">
                {formatEGP(total)}
              </span>
            </div>
            <p className="text-xs text-[#7a655f] dark:text-[#b9a79b]">
              شحن مجاني للطلبات من {formatEGP(storeConfig.freeShippingThreshold)} فأكثر · الدفع عند
              الاستلام متاح.
            </p>
          </div>
        </div>

        {/* Left Column (in RTL): Customer Delivery Form & Live Shipping Estimator */}
        <div className="lg:col-span-7 rounded-2xl bg-[#fffdf9] dark:bg-[#211815] border border-[#e8dccd] dark:border-[#3a2b26] p-6 sm:p-8 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="nm"
                className="block text-sm font-semibold text-[#2a1a17] dark:text-[#f3e9df] mb-1.5"
              >
                الاسم بالكامل
              </label>
              <input
                id="nm"
                type="text"
                autoComplete="name"
                placeholder="مثال: سارة محمود"
                value={customer.name}
                onChange={(e) => onChangeCustomer({ ...customer, name: e.target.value })}
                className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border border-[#e8dccd] dark:border-[#3a2b26] bg-[#faf6f0] dark:bg-[#16100e] text-[#2a1a17] dark:text-[#f3e9df] text-sm focus:outline-none focus:border-[#b98a3e]"
              />
            </div>

            <div>
              <label
                htmlFor="ph"
                className="block text-sm font-semibold text-[#2a1a17] dark:text-[#f3e9df] mb-1.5"
              >
                رقم الموبايل
              </label>
              <input
                id="ph"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                dir="ltr"
                placeholder="01XXXXXXXXX"
                value={customer.phone}
                onChange={(e) => onChangeCustomer({ ...customer, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border border-[#e8dccd] dark:border-[#3a2b26] bg-[#faf6f0] dark:bg-[#16100e] text-[#2a1a17] dark:text-[#f3e9df] text-sm text-right tabular-nums focus:outline-none focus:border-[#b98a3e]"
              />
              {customer.phone.trim().length > 0 && !isPhoneValid && (
                <p className="mt-1 text-xs text-[#9b3046] dark:text-[#e07a8e]">
                  يرجى إدخال رقم موبايل صحيح (١٠ أرقام على الأقل)
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="gov"
                className="block text-sm font-semibold text-[#2a1a17] dark:text-[#f3e9df] mb-1.5"
              >
                المنطقة / المحافظة (لحساب تكلفة الشحن)
              </label>
              <select
                id="gov"
                value={shipping.governorate.name}
                onChange={(e) => onChangeCustomer({ ...customer, governorate: e.target.value })}
                className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border border-[#e8dccd] dark:border-[#3a2b26] bg-[#faf6f0] dark:bg-[#16100e] text-[#2a1a17] dark:text-[#f3e9df] text-sm focus:outline-none focus:border-[#b98a3e]"
              >
                {storeConfig.governorates.map((g) => (
                  <option key={g.name} value={g.name}>
                    {g.name} — {formatEGP(g.fee)} ({g.eta})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="block text-sm font-semibold text-[#2a1a17] dark:text-[#f3e9df] mb-1.5">
                طريقة الدفع
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onChangeCustomer({ ...customer, paymentMethod: 'cod' })}
                  className={`min-h-[44px] px-3 rounded-xl text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                    customer.paymentMethod === 'cod'
                      ? 'border-[#9b3046] bg-[#9b3046]/10 text-[#9b3046] dark:border-[#d4aa63] dark:bg-[#d4aa63]/15 dark:text-[#f3e9df]'
                      : 'border-[#e8dccd] dark:border-[#3a2b26] text-[#6f5a53] dark:text-[#b9a79b]'
                  }`}
                >
                  عند الاستلام
                </button>
                <button
                  type="button"
                  onClick={() => onChangeCustomer({ ...customer, paymentMethod: 'wallet' })}
                  className={`min-h-[44px] px-3 rounded-xl text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                    customer.paymentMethod === 'wallet'
                      ? 'border-[#9b3046] bg-[#9b3046]/10 text-[#9b3046] dark:border-[#d4aa63] dark:bg-[#d4aa63]/15 dark:text-[#f3e9df]'
                      : 'border-[#e8dccd] dark:border-[#3a2b26] text-[#6f5a53] dark:text-[#b9a79b]'
                  }`}
                >
                  محفظة إلكترونية
                </button>
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor="ad"
              className="block text-sm font-semibold text-[#2a1a17] dark:text-[#f3e9df] mb-1.5"
            >
              العنوان بالتفصيل
            </label>
            <input
              id="ad"
              type="text"
              autoComplete="street-address"
              placeholder="الحي، اسم الشارع، رقم العمارة والشقة"
              value={customer.address}
              onChange={(e) => onChangeCustomer({ ...customer, address: e.target.value })}
              className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border border-[#e8dccd] dark:border-[#3a2b26] bg-[#faf6f0] dark:bg-[#16100e] text-[#2a1a17] dark:text-[#f3e9df] text-sm focus:outline-none focus:border-[#b98a3e]"
            />
          </div>

          {/* Gift Message & Special Gift Wrapping Options */}
          <div className="rounded-xl border border-[#e8dccd] dark:border-[#3a2b26] bg-[#faf6f0]/75 dark:bg-[#16100e]/75 p-4 space-y-3.5">
            <div className="flex items-center gap-2 text-sm font-bold text-[#2a1a17] dark:text-[#f3e9df]">
              <Gift className="w-4 h-4 text-[#9b3046] dark:text-[#d4aa63]" aria-hidden="true" />
              <span>خيارات الإهداء والتغليف</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-start gap-2.5 p-3 rounded-lg border border-[#e8dccd] dark:border-[#3a2b26] bg-[#fffdf9] dark:bg-[#211815] cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(customer.hasGiftMessage)}
                  onChange={(e) =>
                    onChangeCustomer({ ...customer, hasGiftMessage: e.target.checked })
                  }
                  className="mt-0.5 w-4 h-4 accent-[#9b3046] cursor-pointer"
                />
                <span className="text-xs leading-relaxed">
                  <strong className="block text-[#2a1a17] dark:text-[#f3e9df]">
                    إضافة رسالة إهداء
                  </strong>
                  <span className="text-[#7a655f] dark:text-[#b9a79b]">
                    تُكتب على بطاقة أنيقة مرفقة بالطلب (مجانًا)
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-lg border border-[#e8dccd] dark:border-[#3a2b26] bg-[#fffdf9] dark:bg-[#211815] cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(customer.giftWrap)}
                  onChange={(e) => onChangeCustomer({ ...customer, giftWrap: e.target.checked })}
                  className="mt-0.5 w-4 h-4 accent-[#9b3046] cursor-pointer"
                />
                <span className="text-xs leading-relaxed">
                  <strong className="block text-[#2a1a17] dark:text-[#f3e9df]">
                    تغليف هدايا خاص (+ {formatEGP(configuredGiftWrapFee)})
                  </strong>
                  <span className="text-[#7a655f] dark:text-[#b9a79b]">
                    علبة هدايا فاخرة وشريط ساتان نبيذي
                  </span>
                </span>
              </label>
            </div>

            {customer.hasGiftMessage && (
              <div>
                <label
                  htmlFor="gift-message"
                  className="block text-xs font-semibold text-[#2a1a17] dark:text-[#f3e9df] mb-1.5"
                >
                  نص رسالة الإهداء
                </label>
                <textarea
                  id="gift-message"
                  rows={2}
                  maxLength={300}
                  placeholder="اكتب عبارتك هنا (مثال: كل سنة وأنتِ بخير، أتمنى لك لحظات دافئة وهادئة...)"
                  value={customer.giftMessage || ''}
                  onChange={(e) => onChangeCustomer({ ...customer, giftMessage: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e8dccd] dark:border-[#3a2b26] bg-[#fffdf9] dark:bg-[#211815] text-[#2a1a17] dark:text-[#f3e9df] text-sm focus:outline-none focus:border-[#b98a3e]"
                />
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-semibold text-[#2a1a17] dark:text-[#f3e9df] mb-1.5"
            >
              ملاحظات إضافية للتوصيل (اختياري)
            </label>
            <input
              id="notes"
              type="text"
              placeholder="مثال: الاتصال قبل الوصول بنصف ساعة"
              value={customer.notes}
              onChange={(e) => onChangeCustomer({ ...customer, notes: e.target.value })}
              className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border border-[#e8dccd] dark:border-[#3a2b26] bg-[#faf6f0] dark:bg-[#16100e] text-[#2a1a17] dark:text-[#f3e9df] text-sm focus:outline-none focus:border-[#b98a3e]"
            />
          </div>

          {/* Live Pre-Confirmation Shipping Estimate Summary */}
          <div
            aria-live="polite"
            className="rounded-xl border border-[#e8dccd] dark:border-[#3a2b26] bg-[#faf6f0] dark:bg-[#16100e] p-4 space-y-2.5"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-bold text-[#2a1a17] dark:text-[#f3e9df]">
                <Truck className="w-4 h-4 text-[#9e732b] dark:text-[#d4aa63]" aria-hidden="true" />
                <span>تقدير تكلفة الشحن إلى {shipping.governorate.name}</span>
              </div>
              <span className="text-sm font-bold tabular-nums text-[#9e732b] dark:text-[#d4aa63]">
                {shipping.isFree ? 'مجاني' : formatEGP(shipping.governorate.fee)}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#6f5a53] dark:text-[#b9a79b]">
              <span>
                النطاق: {shipping.governorate.zone} · الوصول المتوقع: {shipping.governorate.eta}
              </span>
              {items.length > 0 && (
                <span className="font-semibold text-[#2a1a17] dark:text-[#f3e9df] tabular-nums">
                  الإجمالي شامل الشحن: {formatEGP(total)}
                </span>
              )}
            </div>

            {items.length > 0 && !shipping.isFree && (
              <p className="text-xs text-[#7a655f] dark:text-[#b9a79b]">
                متاح شحن مجاني عند إضافة منتجات بقيمة {formatEGP(shipping.remainingForFree)} إضافية.
              </p>
            )}
          </div>

          {/* Optional Email Order Confirmation Checkbox + Input */}
          <div className="rounded-xl border border-[#e8dccd] dark:border-[#3a2b26] bg-[#faf6f0] dark:bg-[#16100e] p-4 space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(customer.sendViaEmail)}
                onChange={(e) =>
                  onChangeCustomer({ ...customer, sendViaEmail: e.target.checked })
                }
                className="mt-0.5 w-4 h-4 accent-[#9b3046] cursor-pointer shrink-0"
              />
              <span className="text-xs sm:text-sm leading-relaxed">
                <strong className="inline-flex items-center gap-1.5 text-[#2a1a17] dark:text-[#f3e9df]">
                  <Mail className="w-4 h-4 text-[#9b3046] dark:text-[#d4aa63]" aria-hidden="true" />
                  <span>إرسال تفاصيل الطلب عبر البريد الإلكتروني</span>
                </strong>
                <span className="block text-xs text-[#7a655f] dark:text-[#b9a79b] mt-0.5">
                  احصل على رسالة تأكيد أنيقة تتضمن شعار المتجر وفاتورة طلبك الكاملة.
                </span>
              </span>
            </label>

            {customer.sendViaEmail && (
              <div>
                <label
                  htmlFor="cust-email"
                  className="block text-xs font-semibold text-[#2a1a17] dark:text-[#f3e9df] mb-1.5"
                >
                  البريد الإلكتروني للعميل
                </label>
                <input
                  id="cust-email"
                  type="email"
                  dir="ltr"
                  autoComplete="email"
                  placeholder="name@example.com"
                  value={customer.email || ''}
                  onChange={(e) => onChangeCustomer({ ...customer, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 min-h-[42px] rounded-xl border border-[#e8dccd] dark:border-[#3a2b26] bg-[#fffdf9] dark:bg-[#211815] text-[#2a1a17] dark:text-[#f3e9df] text-sm text-right focus:outline-none focus:border-[#b98a3e]"
                />
                {!isEmailValid && (
                  <p className="mt-1 text-xs text-[#9b3046] dark:text-[#e07a8e]">
                    يرجى إدخال بريد إلكتروني صحيح لإرسال تفاصيل الطلب.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Optional WhatsApp Sending Checkbox */}
          <label className="flex items-start gap-3 p-4 rounded-xl border border-[#e8dccd] dark:border-[#3a2b26] bg-[#faf6f0] dark:bg-[#16100e] cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(customer.sendViaWhatsapp)}
              onChange={(e) =>
                onChangeCustomer({ ...customer, sendViaWhatsapp: e.target.checked })
              }
              className="mt-0.5 w-4 h-4 accent-[#1f8a4c] cursor-pointer shrink-0"
            />
            <span className="text-xs sm:text-sm leading-relaxed">
              <strong className="inline-flex items-center gap-1.5 text-[#2a1a17] dark:text-[#f3e9df]">
                <MessageCircle className="w-4 h-4 text-[#1f8a4c]" aria-hidden="true" />
                <span>إرسال الطلب على واتساب</span>
              </strong>
              <span className="block text-xs text-[#7a655f] dark:text-[#b9a79b] mt-0.5">
                اختياري — يتم تسجيل طلبك في النظام مباشرة في جميع الأحوال، وإذا حددت هذا الخيار
                سيفتح واتساب بعد التسجيل برسالة جاهزة تحتوي على تفاصيل الطلب.
              </span>
            </span>
          </label>

          {submitError && (
            <div
              role="alert"
              className="p-3.5 rounded-xl border border-[#9b3046]/35 bg-[#9b3046]/10 text-xs sm:text-sm font-semibold text-[#9b3046] dark:text-[#f29aa9]"
            >
              {submitError}
            </div>
          )}

          <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              id="send"
              type="button"
              disabled={!isFormValid || submitting}
              onClick={() => void handleConfirmClick()}
              className={`flex-1 min-h-[48px] px-6 py-3 rounded-full text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${
                isFormValid && !submitting
                  ? customer.sendViaWhatsapp
                    ? 'bg-[#1f8a4c] hover:bg-[#19723e] text-white cursor-pointer'
                    : 'bg-[#9b3046] hover:bg-[#822639] text-white cursor-pointer'
                  : 'bg-[#9b3046]/40 text-white/80 cursor-not-allowed'
              }`}
            >
              {customer.sendViaWhatsapp && (
                <MessageCircle className="w-4 h-4" aria-hidden="true" />
              )}
              <span>
                {submitting
                  ? 'جاري تسجيل الطلب...'
                  : customer.sendViaWhatsapp
                  ? 'تأكيد وإرسال الطلب على واتساب'
                  : 'تأكيد وتسجيل الطلب'}
              </span>
            </button>

            <button
              type="button"
              disabled={items.length === 0}
              onClick={handleCopyMessage}
              className="min-h-[48px] px-5 py-3 rounded-full border border-[#e8dccd] dark:border-[#3a2b26] text-sm font-semibold text-[#2a1a17] dark:text-[#f3e9df] hover:border-[#b98a3e] disabled:opacity-40 inline-flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-[#1f8a4c]" aria-hidden="true" />
                  <span>تم النسخ</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" aria-hidden="true" />
                  <span>نسخ نص الطلب</span>
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-[#7a655f] dark:text-[#b9a79b]">
            {isFormValid
              ? customer.sendViaWhatsapp
                ? 'سيتم تسجيل طلبك في النظام ثم فتح واتساب برسالة جاهزة بتفاصيل الطلب.'
                : 'سيتم تسجيل طلبك مباشرة في النظام دون الحاجة لفتح واتساب.'
              : 'أضف منتجًا وأكمل الاسم والموبايل والعنوان لتأكيد الطلب.'}
          </p>
        </div>
      </div>

      {/* Branded HTML Email Preview Modal */}
      {emailPreviewOpen && lastOrder?.emailHtml && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs"
          onClick={() => setEmailPreviewOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="معاينة رسالة تأكيد الطلب بالبريد الإلكتروني"
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] rounded-2xl bg-[#fffdf9] dark:bg-[#211815] border border-[#e8dccd] dark:border-[#3a2b26] shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-[#e8dccd] dark:border-[#3a2b26] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#9b3046] dark:text-[#d4aa63]" aria-hidden="true" />
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#2a1a17] dark:text-[#f3e9df]">
                    رسالة تأكيد الطلب #{lastOrder.orderNumber}
                  </h3>
                  {lastOrder.customerEmail && (
                    <p dir="ltr" className="text-xs text-[#7a655f] dark:text-[#b9a79b] text-right">
                      إلى: {lastOrder.customerEmail}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleCopyEmailHtml()}
                  className="px-3 py-1.5 rounded-lg border border-[#e8dccd] dark:border-[#3a2b26] text-xs font-semibold inline-flex items-center gap-1.5 hover:border-[#b98a3e] cursor-pointer"
                >
                  {copiedHtml ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#1f8a4c]" />
                      <span>تم نسخ HTML</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>نسخ كود الرسالة</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setEmailPreviewOpen(false)}
                  aria-label="إغلاق المعاينة"
                  className="w-9 h-9 rounded-full border border-[#e8dccd] dark:border-[#3a2b26] flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden bg-[#faf6f0]">
              <iframe
                title={`معاينة بريد الطلب #${lastOrder.orderNumber}`}
                srcDoc={lastOrder.emailHtml}
                className="w-full h-[65vh] border-0"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

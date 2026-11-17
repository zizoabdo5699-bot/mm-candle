import { useEffect, useState } from 'react';
import {
  Lock,
  LogOut,
  Plus,
  Save,
  Trash2,
  X,
  Package,
  ShoppingBag,
  Percent,
  ImagePlus,
  Upload,
  Eye,
  EyeOff,
  Bell,
  Check,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import {
  LOW_STOCK_THRESHOLD,
  formatEGP,
  type AdminNotification,
  type OrderStatus,
  type Product,
  type ProductCategory,
  type SeasonalOffer,
  type TrackableOrder,
} from '../data/catalog';

interface AdminDashboardModalProps {
  open: boolean;
  products: Product[];
  seasonalOffer: SeasonalOffer;
  onClose: () => void;
  onProductsUpdated: (nextProducts: Product[]) => void;
  onSeasonalOfferUpdated: (nextOffer: SeasonalOffer) => void;
}

type OrderFilter = 'all' | 'جديد' | 'مقبول' | 'مرفوض';
const SHIPPING_STAGE_STATUSES: OrderStatus[] = ['قيد التجهيز', 'جاري الشحن', 'تم التوصيل'];

function toLocalDateTimeInputValue(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

async function compressImageToDataUrl(file: File): Promise<string> {
  const readRaw = () =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('read_failed'));
      reader.readAsDataURL(file);
    });

  try {
    const rawUrl = await readRaw();
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('decode_failed'));
      el.src = rawUrl;
    });

    const maxSide = 1000;
    const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return rawUrl;
    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', 0.85);
  } catch {
    return readRaw();
  }
}

export function AdminDashboardModal({
  open,
  products,
  seasonalOffer,
  onClose,
  onProductsUpdated,
  onSeasonalOfferUpdated,
}: AdminDashboardModalProps) {
  const [token, setToken] = useState<string>(() => {
    try {
      return window.localStorage.getItem('mm_admin_token') || '';
    } catch {
      return '';
    }
  });
  const [adminEmail, setAdminEmail] = useState<string>('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPasscode, setLoginPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const [tab, setTab] = useState<'products' | 'offers' | 'orders' | 'notifications'>('products');
  const [orders, setOrders] = useState<TrackableOrder[]>([]);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [orderFilter, setOrderFilter] = useState<OrderFilter>('all');
  const [confirmDeleteOrder, setConfirmDeleteOrder] = useState<string | null>(null);
  const [highlightedOrder, setHighlightedOrder] = useState<string | null>(null);
  const [highlightedProductId, setHighlightedProductId] = useState<number | null>(null);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  // Seasonal offer form draft
  const [offerActive, setOfferActive] = useState<boolean>(seasonalOffer.active);
  const [offerTitle, setOfferTitle] = useState<string>(seasonalOffer.title);
  const [offerSubtitle, setOfferSubtitle] = useState<string>(seasonalOffer.subtitle);
  const [offerDiscount, setOfferDiscount] = useState<string>(String(seasonalOffer.discountPercent));
  const [offerProductIds, setOfferProductIds] = useState<number[]>(seasonalOffer.productIds);
  const [offerEndsAt, setOfferEndsAt] = useState<string>(() =>
    toLocalDateTimeInputValue(seasonalOffer.endsAt)
  );

  // Local editable drafts for existing products
  const [drafts, setDrafts] = useState<
    Record<
      number,
      {
        name: string;
        subtitle: string;
        price: string;
        stock: string;
        spec: string;
        tag: string;
        image: string;
      }
    >
  >({});
  const [uploadingTarget, setUploadingTarget] = useState<number | 'new' | null>(null);

  // New product creation state
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newStock, setNewStock] = useState('10');
  const [newCategory, setNewCategory] = useState<ProductCategory>('candles');
  const [newSpec, setNewSpec] = useState('٢٠٠ جم');
  const [newScents, setNewScents] = useState('فانيليا مدغشقر الدافئة، عنبر وخشب الصندل');
  const [newImage, setNewImage] = useState('');

  useEffect(() => {
    setOfferActive(seasonalOffer.active);
    setOfferTitle(seasonalOffer.title);
    setOfferSubtitle(seasonalOffer.subtitle);
    setOfferDiscount(String(seasonalOffer.discountPercent));
    setOfferProductIds(seasonalOffer.productIds);
    setOfferEndsAt(toLocalDateTimeInputValue(seasonalOffer.endsAt));
  }, [seasonalOffer]);

  useEffect(() => {
    const nextDrafts: Record<
      number,
      {
        name: string;
        subtitle: string;
        price: string;
        stock: string;
        spec: string;
        tag: string;
        image: string;
      }
    > = {};
    for (const p of products) {
      nextDrafts[p.id] = {
        name: p.name,
        subtitle: p.subtitle,
        price: String(p.price),
        stock: String(p.stock ?? 10),
        spec: p.spec,
        tag: p.tag || '',
        image: p.image || '',
      };
    }
    setDrafts(nextDrafts);
  }, [products]);

  useEffect(() => {
    if (!open || !token) return;
    let cancelled = false;

    const verifyAndLoad = async () => {
      try {
        const meRes = await fetch('/api/admin/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!meRes.ok) {
          if (!cancelled) {
            setToken('');
            setAdminEmail('');
            window.localStorage.removeItem('mm_admin_token');
          }
          return;
        }
        const meData = (await meRes.json()) as { email: string };
        if (!cancelled) setAdminEmail(meData.email);

        const ordersRes = await fetch('/api/admin/orders', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (ordersRes.ok) {
          const ordersData = (await ordersRes.json()) as {
            orders: TrackableOrder[];
            notifications?: AdminNotification[];
          };
          if (!cancelled) {
            setOrders(ordersData.orders || []);
            if (Array.isArray(ordersData.notifications)) {
              setNotifications(ordersData.notifications);
            }
          }
        }
      } catch {
        // ignore network error on modal open
      }
    };

    void verifyAndLoad();
    return () => {
      cancelled = true;
    };
  }, [open, token]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const notify = (msg: string) => {
    setStatusFeedback(msg);
    window.setTimeout(() => setStatusFeedback(null), 2800);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail.trim(),
          passcode: loginPasscode.trim(),
        }),
      });
      const rawText = await res.text();
      let data: { token?: string; email?: string; error?: string } = {};
      try {
        data = rawText ? (JSON.parse(rawText) as typeof data) : {};
      } catch {
        data = {};
      }
      if (!res.ok || !data.token) {
        if (data.error) {
          setAuthError(data.error);
        } else {
          setAuthError(
            `تعذر الاتصال بخادم الإدارة (رمز ${res.status}). يرجى تحديث الصفحة والمحاولة مجددًا.`
          );
        }
      } else {
        window.localStorage.setItem('mm_admin_token', data.token);
        setToken(data.token);
        setAdminEmail(data.email || loginEmail.trim());
        setLoginPasscode('');
      }
    } catch {
      setAuthError('حدث خطأ في الاتصال بالخادم. يرجى تحديث الصفحة ثم المحاولة مجددًا.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    window.localStorage.removeItem('mm_admin_token');
    setToken('');
    setAdminEmail('');
    setOrders([]);
    setNotifications([]);
  };

  const uploadImageToServer = async (file: File): Promise<string | null> => {
    try {
      const dataUrl = await compressImageToDataUrl(file);
      const res = await fetch('/api/admin/upload-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ dataUrl }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        notify(data.error || 'تعذر رفع الصورة.');
        return null;
      }
      return data.url;
    } catch {
      notify('حدث خطأ أثناء رفع الصورة.');
      return null;
    }
  };

  const handleUploadNewProductImage = async (file: File) => {
    setUploadingTarget('new');
    const url = await uploadImageToServer(file);
    setUploadingTarget(null);
    if (url) {
      setNewImage(url);
      notify('تم رفع الصورة وتجهيزها للمنتج الجديد.');
    }
  };

  const handleUploadExistingProductImage = async (productId: number, file: File) => {
    setUploadingTarget(productId);
    const url = await uploadImageToServer(file);
    if (!url) {
      setUploadingTarget(null);
      return;
    }

    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ image: url }),
      });
      const data = (await res.json()) as { products?: Product[]; error?: string };
      if (res.ok && data.products) {
        onProductsUpdated(data.products);
        notify('تم رفع صورة المنتج وحفظها في المتجر.');
      } else {
        notify(data.error || 'تعذر ربط الصورة بالمنتج.');
      }
    } finally {
      setUploadingTarget(null);
    }
  };

  const handleClearExistingImage = async (productId: number) => {
    const res = await fetch(`/api/admin/products/${productId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ image: null }),
    });
    const data = (await res.json()) as { products?: Product[]; error?: string };
    if (res.ok && data.products) {
      onProductsUpdated(data.products);
      notify('تمت إزالة الصورة المخصصة والعودة للتصميم الافتراضي.');
    } else {
      notify(data.error || 'تعذر إزالة الصورة.');
    }
  };

  const handleSaveProduct = async (productId: number) => {
    const draft = drafts[productId];
    if (!draft) return;
    const parsedPrice = Number(draft.price);
    const parsedStock = Number(draft.stock);
    if (
      !draft.name.trim() ||
      !Number.isFinite(parsedPrice) ||
      parsedPrice <= 0 ||
      !Number.isFinite(parsedStock) ||
      parsedStock < 0
    ) {
      notify('يرجى إدخال اسم وسعر ومخزون صحيح للمنتج.');
      return;
    }

    const res = await fetch(`/api/admin/products/${productId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: draft.name.trim(),
        subtitle: draft.subtitle.trim(),
        price: parsedPrice,
        stock: Math.round(parsedStock),
        spec: draft.spec.trim(),
        tag: draft.tag.trim(),
        image: draft.image.trim() || null,
      }),
    });
    const data = (await res.json()) as { products?: Product[]; error?: string };
    if (res.ok && data.products) {
      onProductsUpdated(data.products);
      notify(`تم تحديث «${draft.name.trim()}» بنجاح.`);
    } else {
      notify(data.error || 'تعذر حفظ التعديل.');
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    const res = await fetch(`/api/admin/products/${product.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = (await res.json()) as { products?: Product[]; error?: string };
    if (res.ok && data.products) {
      onProductsUpdated(data.products);
      notify(`تم حذف «${product.name}».`);
    } else {
      notify(data.error || 'تعذر حذف المنتج.');
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedPrice = Number(newPrice);
    const parsedStock = Number(newStock);
    if (!newName.trim() || !Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      notify('يرجى إدخال اسم المنتج والسعر بشكل صحيح.');
      return;
    }

    const scents = newScents
      .split(/[،,]/)
      .map((s) => s.trim())
      .filter(Boolean);

    const res = await fetch('/api/admin/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: newName.trim(),
        subtitle: newSubtitle.trim(),
        price: parsedPrice,
        stock: Number.isFinite(parsedStock) && parsedStock >= 0 ? Math.round(parsedStock) : 10,
        category: newCategory,
        spec: newSpec.trim(),
        scents,
        image: newImage.trim() || undefined,
      }),
    });

    const data = (await res.json()) as { products?: Product[]; error?: string };
    if (res.ok && data.products) {
      onProductsUpdated(data.products);
      setNewName('');
      setNewSubtitle('');
      setNewPrice('');
      setNewStock('10');
      setNewImage('');
      setShowNewForm(false);
      notify('تمت إضافة المنتج الجديد للمتجر.');
    } else {
      notify(data.error || 'تعذر إضافة المنتج.');
    }
  };

  const handleOrderStatusChange = async (orderNumber: string, status: OrderStatus) => {
    const res = await fetch(`/api/admin/orders/${encodeURIComponent(orderNumber)}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    const data = (await res.json()) as {
      orders?: TrackableOrder[];
      products?: Product[];
      notifications?: AdminNotification[];
      error?: string;
    };
    if (res.ok && data.orders) {
      setOrders(data.orders);
      if (data.products) onProductsUpdated(data.products);
      if (data.notifications) setNotifications(data.notifications);
      notify(`تم تحديث حالة الطلب #${orderNumber} إلى «${status}».`);
    } else {
      notify(data.error || 'تعذر تحديث حالة الطلب.');
    }
  };

  const handleDeleteOrder = async (orderNumber: string) => {
    const res = await fetch(`/api/admin/orders/${encodeURIComponent(orderNumber)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = (await res.json()) as {
      orders?: TrackableOrder[];
      products?: Product[];
      notifications?: AdminNotification[];
      error?: string;
    };
    if (res.ok && data.orders) {
      setOrders(data.orders);
      if (data.products) onProductsUpdated(data.products);
      if (data.notifications) setNotifications(data.notifications);
      setConfirmDeleteOrder(null);
      notify(`تم حذف الطلب #${orderNumber}.`);
    } else {
      notify(data.error || 'تعذر حذف الطلب.');
    }
  };

  const handleQuickRestockProduct = async (product: Product, amount = 10) => {
    const nextStock = (product.stock ?? 0) + amount;
    const res = await fetch(`/api/admin/products/${product.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ stock: nextStock }),
    });
    const data = (await res.json()) as { products?: Product[]; error?: string };
    if (res.ok && data.products) {
      onProductsUpdated(data.products);
      notify(`تمت إضافة ${amount.toLocaleString('ar-EG')} قطع إلى مخزون «${product.name}».`);
    } else {
      notify(data.error || 'تعذر تحديث المخزون.');
    }
  };

  const handleRestockFromNotification = async (notif: AdminNotification, amount = 10) => {
    const res = await fetch(`/api/admin/notifications/${encodeURIComponent(notif.id)}/restock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ amount }),
    });
    const data = (await res.json()) as {
      products?: Product[];
      notifications?: AdminNotification[];
      error?: string;
    };
    if (res.ok) {
      if (data.products) onProductsUpdated(data.products);
      if (data.notifications) setNotifications(data.notifications);
      notify(`تمت تعبئة مخزون «${notif.productName}» (+${amount.toLocaleString('ar-EG')}).`);
    } else {
      notify(data.error || 'تعذر تعبئة المخزون.');
    }
  };

  const handleMarkNotificationRead = async (id: string) => {
    const res = await fetch(`/api/admin/notifications/${encodeURIComponent(id)}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = (await res.json()) as { notifications?: AdminNotification[] };
    if (res.ok && data.notifications) {
      setNotifications(data.notifications);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    const res = await fetch(`/api/admin/notifications/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = (await res.json()) as { notifications?: AdminNotification[] };
    if (res.ok && data.notifications) {
      setNotifications(data.notifications);
    }
  };

  const handleToggleOfferProduct = (productId: number) => {
    setOfferProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const handleExtendOfferHours = (hours: number) => {
    const nextIso = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
    setOfferEndsAt(toLocalDateTimeInputValue(nextIso));
  };

  const handleSaveSeasonalOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    const discountNum = Number(offerDiscount);
    if (!Number.isFinite(discountNum) || discountNum < 1 || discountNum > 90) {
      notify('يرجى إدخال نسبة خصم صحيحة بين ١٪ و٩٠٪.');
      return;
    }
    const parsedEnd = new Date(offerEndsAt);
    if (Number.isNaN(parsedEnd.getTime())) {
      notify('يرجى اختيار تاريخ ووقت انتهاء صحيح.');
      return;
    }
    if (offerActive && offerProductIds.length === 0) {
      notify('يرجى تحديد منتج واحد على الأقل لتطبيق العرض عليه.');
      return;
    }

    const res = await fetch('/api/admin/seasonal-offer', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        active: offerActive,
        title: offerTitle.trim(),
        subtitle: offerSubtitle.trim(),
        discountPercent: Math.round(discountNum),
        productIds: offerProductIds,
        endsAt: parsedEnd.toISOString(),
      }),
    });

    const data = (await res.json()) as { offer?: SeasonalOffer; error?: string };
    if (res.ok && data.offer) {
      onSeasonalOfferUpdated(data.offer);
      notify('تم حفظ إعدادات العرض الموسمي وتحديث المتجر.');
    } else {
      notify(data.error || 'تعذر حفظ العرض الموسمي.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="لوحة إدارة المتجر"
    >
      <div
        className="w-full max-w-4xl max-h-[92dvh] rounded-2xl bg-[#fffdf9] dark:bg-[#211815] border border-[#e8dccd] dark:border-[#3a2b26] shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-[#e8dccd] dark:border-[#3a2b26] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Lock className="w-5 h-5 text-[#9b3046] dark:text-[#d4aa63]" aria-hidden="true" />
            <div>
              <h2 className="font-display text-2xl font-bold text-[#2a1a17] dark:text-[#f3e9df]">
                إدارة المتجر (الأدمن)
              </h2>
              {adminEmail && (
                <p dir="ltr" className="text-xs text-[#7a655f] dark:text-[#b9a79b] text-right">
                  {adminEmail}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {token && (
              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-2 rounded-lg border border-[#e8dccd] dark:border-[#3a2b26] text-xs font-semibold text-[#6f5a53] dark:text-[#b9a79b] hover:text-[#9b3046] inline-flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                <span>خروج</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="إغلاق لوحة الإدارة"
              className="w-10 h-10 rounded-full border border-[#e8dccd] dark:border-[#3a2b26] text-[#5c4943] dark:text-[#b9a79b] hover:bg-[#f3e8da] dark:hover:bg-[#2d201c] flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {!token ? (
            <form onSubmit={handleLogin} className="max-w-md mx-auto py-8 space-y-4">
              <div className="space-y-1">
                <h3 className="font-display text-2xl font-bold text-[#2a1a17] dark:text-[#f3e9df]">
                  تسجيل دخول الأدمن
                </h3>
                <p className="text-xs sm:text-sm text-[#6f5a53] dark:text-[#b9a79b]">
                  الدخول مقتصر على البريد الإلكتروني المصرح له بإدارة المنتجات والأسعار والطلبات.
                </p>
              </div>

              {authError && (
                <div
                  role="alert"
                  className="p-3 rounded-xl border border-[#9b3046]/30 bg-[#9b3046]/10 text-xs font-semibold text-[#9b3046] dark:text-[#f29aa9]"
                >
                  {authError}
                </div>
              )}

              <div>
                <label
                  htmlFor="admin-email"
                  className="block text-xs font-semibold text-[#2a1a17] dark:text-[#f3e9df] mb-1.5"
                >
                  البريد الإلكتروني أو اسم الأدمن
                </label>
                <input
                  id="admin-email"
                  type="text"
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  dir="ltr"
                  required
                  placeholder="zizo.abdo5699@gmail.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border border-[#e8dccd] dark:border-[#3a2b26] bg-[#faf6f0] dark:bg-[#16100e] text-[#2a1a17] dark:text-[#f3e9df] text-sm text-right focus:outline-none focus:border-[#b98a3e]"
                />
              </div>

              <div>
                <label
                  htmlFor="admin-passcode"
                  className="block text-xs font-semibold text-[#2a1a17] dark:text-[#f3e9df] mb-1.5"
                >
                  كلمة المرور
                </label>
                <div className="relative">
                  <input
                    id="admin-passcode"
                    type={showPasscode ? 'text' : 'password'}
                    autoComplete="current-password"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    dir="ltr"
                    required
                    value={loginPasscode}
                    onChange={(e) => setLoginPasscode(e.target.value)}
                    className="w-full pl-11 pr-3.5 py-2.5 min-h-[44px] rounded-xl border border-[#e8dccd] dark:border-[#3a2b26] bg-[#faf6f0] dark:bg-[#16100e] text-[#2a1a17] dark:text-[#f3e9df] text-sm text-right focus:outline-none focus:border-[#b98a3e]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasscode((prev) => !prev)}
                    aria-label={showPasscode ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-[#7a655f] dark:text-[#b9a79b] hover:text-[#2a1a17] dark:hover:text-[#f3e9df] cursor-pointer"
                  >
                    {showPasscode ? (
                      <EyeOff className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <Eye className="w-4 h-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full min-h-[46px] px-6 py-3 rounded-full bg-[#9b3046] hover:bg-[#822639] disabled:opacity-60 text-white text-sm font-bold transition-colors cursor-pointer"
              >
                {authLoading ? 'جاري التحقق...' : 'دخول للوحة التحكم'}
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              {(() => {
                const unreadNotifsCount = notifications.filter((n) => !n.read).length;
                const lowStockProducts = products.filter(
                  (p) => (p.stock ?? 0) <= LOW_STOCK_THRESHOLD
                );
                const alertBadgeCount = unreadNotifsCount + lowStockProducts.length;

                return (
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[#f1e7d8] dark:bg-[#241a17] border border-[#e8dccd] dark:border-[#3a2b26]">
                      <button
                        type="button"
                        onClick={() => setTab('products')}
                        className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold inline-flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                          tab === 'products'
                            ? 'bg-[#fffdf9] dark:bg-[#352722] text-[#2a1a17] dark:text-[#f3e9df] shadow-xs'
                            : 'text-[#6f5a53] dark:text-[#b9a79b]'
                        }`}
                      >
                        <ShoppingBag className="w-4 h-4" aria-hidden="true" />
                        <span>المنتجات والأسعار ({products.length.toLocaleString('ar-EG')})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTab('offers')}
                        className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold inline-flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                          tab === 'offers'
                            ? 'bg-[#fffdf9] dark:bg-[#352722] text-[#2a1a17] dark:text-[#f3e9df] shadow-xs'
                            : 'text-[#6f5a53] dark:text-[#b9a79b]'
                        }`}
                      >
                        <Percent className="w-4 h-4" aria-hidden="true" />
                        <span>العروض الموسمية</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTab('orders')}
                        className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold inline-flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                          tab === 'orders'
                            ? 'bg-[#fffdf9] dark:bg-[#352722] text-[#2a1a17] dark:text-[#f3e9df] shadow-xs'
                            : 'text-[#6f5a53] dark:text-[#b9a79b]'
                        }`}
                      >
                        <Package className="w-4 h-4" aria-hidden="true" />
                        <span>إدارة الطلبات ({orders.length.toLocaleString('ar-EG')})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTab('notifications')}
                        className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold inline-flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                          tab === 'notifications'
                            ? 'bg-[#fffdf9] dark:bg-[#352722] text-[#2a1a17] dark:text-[#f3e9df] shadow-xs'
                            : 'text-[#6f5a53] dark:text-[#b9a79b]'
                        }`}
                      >
                        <Bell className="w-4 h-4" aria-hidden="true" />
                        <span>التنبيهات والمخزون</span>
                        {alertBadgeCount > 0 && (
                          <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-[#9b3046] text-white text-[11px] font-bold tabular-nums inline-flex items-center justify-center">
                            {alertBadgeCount.toLocaleString('ar-EG')}
                          </span>
                        )}
                      </button>
                    </div>

                    {tab === 'products' && (
                      <button
                        type="button"
                        onClick={() => setShowNewForm((prev) => !prev)}
                        className="px-4 py-2 min-h-[40px] rounded-full bg-[#9b3046] hover:bg-[#822639] text-white text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <Plus className="w-4 h-4" aria-hidden="true" />
                        <span>{showNewForm ? 'إغلاق النموذج' : 'إضافة منتج جديد'}</span>
                      </button>
                    )}
                  </div>
                );
              })()}

              {/* Compact Interactive Alert Strip on any tab when unread notifications or low/out-of-stock exist */}
              {tab !== 'notifications' &&
                (notifications.some((n) => !n.read) ||
                  products.some((p) => (p.stock ?? 0) <= LOW_STOCK_THRESHOLD)) && (
                  <div className="rounded-xl border border-[#b45309]/35 bg-[#fef3c7]/65 dark:bg-[#3a2210]/65 dark:border-[#f59e0b]/35 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#9a3412] dark:text-[#fbbf24]">
                      <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>
                        يوجد{' '}
                        {notifications.filter((n) => !n.read).length > 0 &&
                          `${notifications
                            .filter((n) => !n.read)
                            .length.toLocaleString('ar-EG')} إشعارات مخزون جديدة`}
                        {notifications.filter((n) => !n.read).length > 0 &&
                          products.some((p) => (p.stock ?? 0) <= LOW_STOCK_THRESHOLD) &&
                          ' · '}
                        {products.some((p) => (p.stock ?? 0) <= LOW_STOCK_THRESHOLD) &&
                          `${products
                            .filter((p) => (p.stock ?? 0) <= LOW_STOCK_THRESHOLD)
                            .length.toLocaleString('ar-EG')} منتجات بمخزون منخفض أو نافذ`}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTab('notifications')}
                      className="px-3.5 py-1.5 rounded-full bg-[#9a3412] hover:bg-[#7c2d12] text-white text-xs font-bold cursor-pointer whitespace-nowrap"
                    >
                      عرض التنبيهات واتخاذ إجراء
                    </button>
                  </div>
                )}

              {statusFeedback && (
                <div
                  role="status"
                  className="p-3.5 rounded-xl border border-[#2d7a4f]/30 bg-[#eef8f2] dark:bg-[#13261b] text-xs font-semibold text-[#154d2e] dark:text-[#b9f0cf]"
                >
                  {statusFeedback}
                </div>
              )}

              {tab === 'products' && (
                <div className="space-y-4">
                  {showNewForm && (
                    <form
                      onSubmit={handleCreateProduct}
                      className="rounded-2xl border border-[#e8dccd] dark:border-[#3a2b26] bg-[#faf6f0] dark:bg-[#16100e] p-5 space-y-4"
                    >
                      <h3 className="text-sm font-bold text-[#2a1a17] dark:text-[#f3e9df]">
                        إضافة منتج جديد للمتجر
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <input
                          type="text"
                          required
                          placeholder="اسم المنتج"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          className="px-3 py-2 min-h-[40px] rounded-xl border border-[#e8dccd] dark:border-[#3a2b26] bg-[#fffdf9] dark:bg-[#211815] text-sm"
                        />
                        <input
                          type="number"
                          required
                          min={1}
                          placeholder="السعر بالجنيه"
                          value={newPrice}
                          onChange={(e) => setNewPrice(e.target.value)}
                          className="px-3 py-2 min-h-[40px] rounded-xl border border-[#e8dccd] dark:border-[#3a2b26] bg-[#fffdf9] dark:bg-[#211815] text-sm tabular-nums"
                        />
                        <input
                          type="number"
                          required
                          min={0}
                          placeholder="الكمية بالمخزون"
                          value={newStock}
                          onChange={(e) => setNewStock(e.target.value)}
                          className="px-3 py-2 min-h-[40px] rounded-xl border border-[#e8dccd] dark:border-[#3a2b26] bg-[#fffdf9] dark:bg-[#211815] text-sm tabular-nums"
                        />
                        <select
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value as ProductCategory)}
                          className="px-3 py-2 min-h-[40px] rounded-xl border border-[#e8dccd] dark:border-[#3a2b26] bg-[#fffdf9] dark:bg-[#211815] text-sm"
                        >
                          <option value="candles">الشموع</option>
                          <option value="diffusers">المعطرات</option>
                          <option value="gifts">الهدايا</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="وصف مختصر"
                          value={newSubtitle}
                          onChange={(e) => setNewSubtitle(e.target.value)}
                          className="px-3 py-2 min-h-[40px] rounded-xl border border-[#e8dccd] dark:border-[#3a2b26] bg-[#fffdf9] dark:bg-[#211815] text-sm"
                        />
                        <input
                          type="text"
                          placeholder="الحجم / الوزن (مثال: ٢٥٠ جم)"
                          value={newSpec}
                          onChange={(e) => setNewSpec(e.target.value)}
                          className="px-3 py-2 min-h-[40px] rounded-xl border border-[#e8dccd] dark:border-[#3a2b26] bg-[#fffdf9] dark:bg-[#211815] text-sm"
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="الروائح المتاحة مفصولة بفاصلة"
                        value={newScents}
                        onChange={(e) => setNewScents(e.target.value)}
                        className="w-full px-3 py-2 min-h-[40px] rounded-xl border border-[#e8dccd] dark:border-[#3a2b26] bg-[#fffdf9] dark:bg-[#211815] text-sm"
                      />

                      <div className="rounded-xl border border-[#e8dccd] dark:border-[#3a2b26] bg-[#fffdf9] dark:bg-[#211815] p-3.5 flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="w-16 h-16 rounded-lg border border-[#e8dccd] dark:border-[#3a2b26] bg-[#faf6f0] dark:bg-[#16100e] overflow-hidden flex items-center justify-center shrink-0">
                          {newImage ? (
                            <img
                              src={newImage}
                              alt="معاينة صورة المنتج الجديد"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImagePlus
                              className="w-6 h-6 text-[#9e732b] dark:text-[#d4aa63]"
                              aria-hidden="true"
                            />
                          )}
                        </div>

                        <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2">
                          <label className="min-h-[38px] px-3.5 py-2 rounded-lg border border-[#9b3046] dark:border-[#d4aa63] text-[#9b3046] dark:text-[#f3e9df] hover:bg-[#9b3046]/10 text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap">
                            <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>
                              {uploadingTarget === 'new' ? 'جاري الرفع...' : 'رفع صورة من الجهاز'}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              disabled={uploadingTarget === 'new'}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) void handleUploadNewProductImage(file);
                                e.target.value = '';
                              }}
                              className="sr-only"
                            />
                          </label>

                          <input
                            type="text"
                            dir="ltr"
                            placeholder="أو رابط الصورة (اختياري)"
                            value={newImage}
                            onChange={(e) => setNewImage(e.target.value)}
                            className="flex-1 px-3 py-2 min-h-[38px] rounded-lg border border-[#e8dccd] dark:border-[#3a2b26] bg-[#faf6f0] dark:bg-[#16100e] text-xs text-right"
                          />

                          {newImage && (
                            <button
                              type="button"
                              onClick={() => setNewImage('')}
                              className="text-xs font-semibold text-[#9b3046] dark:text-[#f29aa9] hover:underline cursor-pointer px-2"
                            >
                              إزالة
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={uploadingTarget === 'new'}
                          className="px-5 py-2 min-h-[40px] rounded-full bg-[#1f8a4c] hover:bg-[#19723e] disabled:opacity-50 text-white text-xs sm:text-sm font-bold cursor-pointer"
                        >
                          إضافة للمتجر
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="divide-y divide-[#e8dccd] dark:divide-[#3a2b26] border border-[#e8dccd] dark:border-[#3a2b26] rounded-2xl overflow-hidden">
                    {products.map((product) => {
                      const d = drafts[product.id] || {
                        name: product.name,
                        subtitle: product.subtitle,
                        price: String(product.price),
                        stock: String(product.stock ?? 10),
                        spec: product.spec,
                        tag: product.tag || '',
                        image: product.image || '',
                      };
                      const stockNum = Number(d.stock);
                      const isOut = Number.isFinite(stockNum) && stockNum <= 0;
                      const isLow =
                        Number.isFinite(stockNum) && stockNum > 0 && stockNum <= LOW_STOCK_THRESHOLD;
                      const isUploadingThis = uploadingTarget === product.id;

                      return (
                        <div
                          key={product.id}
                          className={`p-4 space-y-3 transition-colors ${
                            highlightedProductId === product.id
                              ? 'bg-[#fef3c7]/50 dark:bg-[#3a2210]/40'
                              : 'bg-[#fffdf9] dark:bg-[#211815]'
                          }`}
                        >
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                            <div className="md:col-span-3">
                              <label className="block text-[11px] text-[#7a655f] dark:text-[#b9a79b] mb-1">
                                اسم المنتج
                              </label>
                              <input
                                type="text"
                                value={d.name}
                                onChange={(e) =>
                                  setDrafts((prev) => ({
                                    ...prev,
                                    [product.id]: { ...d, name: e.target.value },
                                  }))
                                }
                                className="w-full px-3 py-2 rounded-lg border border-[#e8dccd] dark:border-[#3a2b26] bg-[#faf6f0] dark:bg-[#16100e] text-sm"
                              />
                            </div>

                            <div className="md:col-span-3">
                              <label className="block text-[11px] text-[#7a655f] dark:text-[#b9a79b] mb-1">
                                الوصف المختصر
                              </label>
                              <input
                                type="text"
                                value={d.subtitle}
                                onChange={(e) =>
                                  setDrafts((prev) => ({
                                    ...prev,
                                    [product.id]: { ...d, subtitle: e.target.value },
                                  }))
                                }
                                className="w-full px-3 py-2 rounded-lg border border-[#e8dccd] dark:border-[#3a2b26] bg-[#faf6f0] dark:bg-[#16100e] text-sm"
                              />
                            </div>

                            <div className="md:col-span-2">
                              <label className="block text-[11px] text-[#7a655f] dark:text-[#b9a79b] mb-1">
                                السعر (ج.م)
                              </label>
                              <input
                                type="number"
                                min={1}
                                value={d.price}
                                onChange={(e) =>
                                  setDrafts((prev) => ({
                                    ...prev,
                                    [product.id]: { ...d, price: e.target.value },
                                  }))
                                }
                                className="w-full px-3 py-2 rounded-lg border border-[#e8dccd] dark:border-[#3a2b26] bg-[#faf6f0] dark:bg-[#16100e] text-sm font-bold tabular-nums"
                              />
                            </div>

                            <div className="md:col-span-2">
                              <label className="block text-[11px] text-[#7a655f] dark:text-[#b9a79b] mb-1">
                                المخزون{' '}
                                {isOut ? (
                                  <span className="text-[#9b3046] dark:text-[#f29aa9] font-bold">
                                    (نفذ)
                                  </span>
                                ) : isLow ? (
                                  <span className="text-[#b45309] dark:text-[#fbbf24] font-bold">
                                    (قليل)
                                  </span>
                                ) : null}
                              </label>
                              <input
                                type="number"
                                min={0}
                                value={d.stock}
                                onChange={(e) =>
                                  setDrafts((prev) => ({
                                    ...prev,
                                    [product.id]: { ...d, stock: e.target.value },
                                  }))
                                }
                                className="w-full px-3 py-2 rounded-lg border border-[#e8dccd] dark:border-[#3a2b26] bg-[#faf6f0] dark:bg-[#16100e] text-sm font-bold tabular-nums"
                              />
                            </div>

                            <div className="md:col-span-2 flex items-center gap-2 justify-end">
                              <button
                                type="button"
                                onClick={() => void handleSaveProduct(product.id)}
                                className="px-3.5 py-2 min-h-[38px] rounded-lg bg-[#9b3046] hover:bg-[#822639] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                              >
                                <Save className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>حفظ</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleDeleteProduct(product)}
                                aria-label={`حذف ${product.name}`}
                                className="w-9 h-9 rounded-lg border border-[#e8dccd] dark:border-[#3a2b26] text-[#7a655f] hover:text-[#9b3046] flex items-center justify-center cursor-pointer shrink-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Product Image Controls */}
                          <div className="pt-2.5 border-t border-[#f0e5d7] dark:border-[#2e211d] flex flex-wrap items-center gap-3">
                            <div className="w-12 h-12 rounded-lg border border-[#e8dccd] dark:border-[#3a2b26] bg-[#faf6f0] dark:bg-[#16100e] overflow-hidden flex items-center justify-center shrink-0">
                              {d.image ? (
                                <img
                                  src={d.image}
                                  alt={d.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <ImagePlus
                                  className="w-5 h-5 text-[#9e732b] dark:text-[#d4aa63]"
                                  aria-hidden="true"
                                />
                              )}
                            </div>

                            <label className="min-h-[36px] px-3 py-1.5 rounded-lg border border-[#9b3046]/60 dark:border-[#d4aa63]/60 text-[#9b3046] dark:text-[#f3e9df] hover:bg-[#9b3046]/10 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
                              <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>
                                {isUploadingThis
                                  ? 'جاري الرفع...'
                                  : d.image
                                  ? 'تغيير الصورة'
                                  : 'رفع صورة للمنتج'}
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                disabled={isUploadingThis}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) void handleUploadExistingProductImage(product.id, file);
                                  e.target.value = '';
                                }}
                                className="sr-only"
                              />
                            </label>

                            <input
                              type="text"
                              dir="ltr"
                              placeholder="أو ضع رابط الصورة هنا ثم اضغط حفظ"
                              value={d.image}
                              onChange={(e) =>
                                setDrafts((prev) => ({
                                  ...prev,
                                  [product.id]: { ...d, image: e.target.value },
                                }))
                              }
                              className="flex-1 min-w-[180px] px-3 py-1.5 min-h-[36px] rounded-lg border border-[#e8dccd] dark:border-[#3a2b26] bg-[#faf6f0] dark:bg-[#16100e] text-xs text-right"
                            />

                            {d.image && (
                              <button
                                type="button"
                                onClick={() => void handleClearExistingImage(product.id)}
                                className="text-xs font-semibold text-[#7a655f] dark:text-[#b9a79b] hover:text-[#9b3046] dark:hover:text-[#f29aa9] cursor-pointer whitespace-nowrap"
                              >
                                حذف الصورة
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {tab === 'offers' && (
                <form
                  onSubmit={(e) => void handleSaveSeasonalOffer(e)}
                  className="rounded-2xl border border-[#e8dccd] dark:border-[#3a2b26] bg-[#faf6f0] dark:bg-[#16100e] p-5 space-y-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#e8dccd] dark:border-[#3a2b26]">
                    <div>
                      <h3 className="text-base font-bold text-[#2a1a17] dark:text-[#f3e9df]">
                        إعدادات العرض الموسمي في أعلى الصفحة
                      </h3>
                      <p className="text-xs text-[#6f5a53] dark:text-[#b9a79b]">
                        حدد المنتجات المشمولة ونسبة الخصم وموعد انتهاء العد التنازلي.
                      </p>
                    </div>

                    <label className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-lg border border-[#e8dccd] dark:border-[#3a2b26] bg-[#fffdf9] dark:bg-[#211815] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={offerActive}
                        onChange={(e) => setOfferActive(e.target.checked)}
                        className="w-4 h-4 accent-[#9b3046] cursor-pointer"
                      />
                      <span className="text-xs font-bold text-[#2a1a17] dark:text-[#f3e9df]">
                        تفعيل العرض الآن
                      </span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="offer-title"
                        className="block text-xs font-semibold text-[#2a1a17] dark:text-[#f3e9df] mb-1.5"
                      >
                        عنوان العرض
                      </label>
                      <input
                        id="offer-title"
                        type="text"
                        required
                        value={offerTitle}
                        onChange={(e) => setOfferTitle(e.target.value)}
                        className="w-full px-3 py-2 min-h-[42px] rounded-xl border border-[#e8dccd] dark:border-[#3a2b26] bg-[#fffdf9] dark:bg-[#211815] text-sm"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="offer-discount"
                        className="block text-xs font-semibold text-[#2a1a17] dark:text-[#f3e9df] mb-1.5"
                      >
                        نسبة الخصم (%)
                      </label>
                      <input
                        id="offer-discount"
                        type="number"
                        min={1}
                        max={90}
                        required
                        value={offerDiscount}
                        onChange={(e) => setOfferDiscount(e.target.value)}
                        className="w-full px-3 py-2 min-h-[42px] rounded-xl border border-[#e8dccd] dark:border-[#3a2b26] bg-[#fffdf9] dark:bg-[#211815] text-sm font-bold tabular-nums"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="offer-subtitle"
                      className="block text-xs font-semibold text-[#2a1a17] dark:text-[#f3e9df] mb-1.5"
                    >
                      وصف قصير للعرض
                    </label>
                    <input
                      id="offer-subtitle"
                      type="text"
                      value={offerSubtitle}
                      onChange={(e) => setOfferSubtitle(e.target.value)}
                      className="w-full px-3 py-2 min-h-[42px] rounded-xl border border-[#e8dccd] dark:border-[#3a2b26] bg-[#fffdf9] dark:bg-[#211815] text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label
                        htmlFor="offer-ends"
                        className="block text-xs font-semibold text-[#2a1a17] dark:text-[#f3e9df]"
                      >
                        موعد انتهاء العرض (للعد التنازلي)
                      </label>
                      <div className="flex items-center gap-2 text-xs">
                        {[
                          { label: '+٢٤ ساعة', hours: 24 },
                          { label: '+٣ أيام', hours: 72 },
                          { label: '+٧ أيام', hours: 168 },
                        ].map((preset) => (
                          <button
                            key={preset.hours}
                            type="button"
                            onClick={() => handleExtendOfferHours(preset.hours)}
                            className="px-2.5 py-1 rounded-lg border border-[#e8dccd] dark:border-[#3a2b26] bg-[#fffdf9] dark:bg-[#211815] hover:border-[#b98a3e] font-semibold cursor-pointer"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <input
                      id="offer-ends"
                      type="datetime-local"
                      dir="ltr"
                      required
                      value={offerEndsAt}
                      onChange={(e) => setOfferEndsAt(e.target.value)}
                      className="w-full px-3 py-2 min-h-[42px] rounded-xl border border-[#e8dccd] dark:border-[#3a2b26] bg-[#fffdf9] dark:bg-[#211815] text-sm text-right"
                    />
                  </div>

                  <div className="space-y-2.5">
                    <span className="block text-xs font-semibold text-[#2a1a17] dark:text-[#f3e9df]">
                      اختر المنتجات المشمولة بالخصم
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {products.map((product) => {
                        const checked = offerProductIds.includes(product.id);
                        const pct = Math.max(0, Math.min(90, Number(offerDiscount) || 0));
                        const discounted = Math.max(
                          1,
                          Math.round(product.price * (1 - pct / 100))
                        );

                        return (
                          <label
                            key={product.id}
                            className={`flex items-center justify-between gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                              checked
                                ? 'border-[#9b3046] bg-[#9b3046]/[0.06] dark:border-[#d4aa63] dark:bg-[#d4aa63]/10'
                                : 'border-[#e8dccd] dark:border-[#3a2b26] bg-[#fffdf9] dark:bg-[#211815]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => handleToggleOfferProduct(product.id)}
                                className="w-4 h-4 accent-[#9b3046] cursor-pointer shrink-0"
                              />
                              <span className="text-xs sm:text-sm font-bold text-[#2a1a17] dark:text-[#f3e9df] truncate">
                                {product.name}
                              </span>
                            </div>
                            <span className="text-xs tabular-nums shrink-0">
                              {checked && pct > 0 ? (
                                <>
                                  <strong className="text-[#9b3046] dark:text-[#d4aa63]">
                                    {formatEGP(discounted)}
                                  </strong>{' '}
                                  <span className="line-through text-[#7a655f]">
                                    {formatEGP(product.price)}
                                  </span>
                                </>
                              ) : (
                                <span className="text-[#7a655f]">{formatEGP(product.price)}</span>
                              )}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="px-6 py-2.5 min-h-[42px] rounded-full bg-[#9b3046] hover:bg-[#822639] text-white text-xs sm:text-sm font-bold inline-flex items-center gap-2 cursor-pointer"
                    >
                      <Save className="w-4 h-4" aria-hidden="true" />
                      <span>حفظ العرض الموسمي</span>
                    </button>
                  </div>
                </form>
              )}

              {tab === 'orders' && (() => {
                const matchesFilter = (order: TrackableOrder, f: OrderFilter) => {
                  if (f === 'all') return true;
                  if (f === 'جديد') return order.status === 'جديد' || order.status === 'قيد التجهيز';
                  if (f === 'مقبول') {
                    return (
                      order.status === 'مقبول' ||
                      order.status === 'جاري الشحن' ||
                      order.status === 'تم التوصيل'
                    );
                  }
                  return order.status === 'مرفوض';
                };

                const filteredOrders = orders.filter((o) => matchesFilter(o, orderFilter));

                return (
                  <div className="space-y-4">
                    {/* Order Status Filter */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="inline-flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[#f1e7d8] dark:bg-[#241a17] border border-[#e8dccd] dark:border-[#3a2b26]">
                        {(
                          [
                            { id: 'all', label: 'الكل' },
                            { id: 'جديد', label: 'جديد' },
                            { id: 'مقبول', label: 'مقبول' },
                            { id: 'مرفوض', label: 'مرفوض' },
                          ] as { id: OrderFilter; label: string }[]
                        ).map((f) => {
                          const active = orderFilter === f.id;
                          const count = orders.filter((o) => matchesFilter(o, f.id)).length;
                          return (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() => setOrderFilter(f.id)}
                              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                                active
                                  ? 'bg-[#fffdf9] dark:bg-[#352722] text-[#2a1a17] dark:text-[#f3e9df] shadow-xs'
                                  : 'text-[#6f5a53] dark:text-[#b9a79b]'
                              }`}
                            >
                              {f.label} ({count.toLocaleString('ar-EG')})
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {filteredOrders.length === 0 ? (
                      <p className="py-10 text-center text-sm text-[#7a655f] dark:text-[#b9a79b]">
                        لا توجد طلبات مطابقة لهذا التصنيف حاليًا.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {filteredOrders.map((order) => {
                          const isAccepted = order.status === 'مقبول';
                          const isRejected = order.status === 'مرفوض';
                          const isConfirmingDelete = confirmDeleteOrder === order.orderNumber;
                          const isHighlighted = highlightedOrder === order.orderNumber;

                          return (
                            <div
                              key={order.orderNumber}
                              className={`p-4 sm:p-5 rounded-2xl border space-y-4 transition-colors ${
                                isHighlighted
                                  ? 'border-[#9b3046] bg-[#fef3c7]/35 dark:bg-[#3a2210]/35'
                                  : 'border-[#e8dccd] dark:border-[#3a2b26] bg-[#fffdf9] dark:bg-[#211815]'
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                <div className="space-y-1">
                                  <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-[#2a1a17] dark:text-[#f3e9df]">
                                    <span className="tabular-nums">#{order.orderNumber}</span>
                                    <span aria-hidden="true">·</span>
                                    <span>{order.customerName}</span>
                                    {order.phone && (
                                      <>
                                        <span aria-hidden="true">·</span>
                                        <span dir="ltr" className="text-xs font-medium tabular-nums">
                                          {order.phone}
                                        </span>
                                      </>
                                    )}
                                    <span
                                      className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                                        order.status === 'مرفوض'
                                          ? 'bg-[#9b3046]/15 text-[#9b3046] dark:text-[#f29aa9]'
                                          : order.status === 'مقبول' || order.status === 'تم التوصيل'
                                          ? 'bg-[#1f8a4c]/15 text-[#154d2e] dark:text-[#8fd3ac]'
                                          : 'bg-[#b98a3e]/20 text-[#8a5d14] dark:text-[#f3d18d]'
                                      }`}
                                    >
                                      {order.status}
                                    </span>
                                  </div>

                                  <p className="text-xs text-[#6f5a53] dark:text-[#b9a79b] tabular-nums">
                                    {order.governorate}
                                    {order.address ? ` — ${order.address}` : ''} ·{' '}
                                    {order.itemCount.toLocaleString('ar-EG')} منتجات ·{' '}
                                    <strong className="text-[#9e732b] dark:text-[#d4aa63]">
                                      {formatEGP(order.total)}
                                    </strong>{' '}
                                    · {order.createdAt}
                                  </p>

                                  {order.paymentMethod && (
                                    <p className="text-[11px] text-[#7a655f] dark:text-[#b9a79b]">
                                      الدفع:{' '}
                                      {order.paymentMethod === 'wallet'
                                        ? 'محفظة إلكترونية'
                                        : 'عند الاستلام'}
                                      {order.notes ? ` · ملاحظات: ${order.notes}` : ''}
                                    </p>
                                  )}

                                  {(order.giftWrap || order.giftMessage) && (
                                    <p className="text-xs text-[#9b3046] dark:text-[#d4aa63]">
                                      {order.giftWrap ? 'تغليف هدايا خاص' : ''}
                                      {order.giftWrap && order.giftMessage ? ' · ' : ''}
                                      {order.giftMessage ? `رسالة إهداء: «${order.giftMessage}»` : ''}
                                    </p>
                                  )}
                                </div>

                                {/* 3 Core Action Buttons + Optional Shipping Stage */}
                                <div className="flex flex-wrap items-center gap-2 shrink-0">
                                  <button
                                    type="button"
                                    disabled={isAccepted}
                                    onClick={() =>
                                      void handleOrderStatusChange(order.orderNumber, 'مقبول')
                                    }
                                    className="px-3 py-2 min-h-[36px] rounded-lg bg-[#1f8a4c] hover:bg-[#19723e] disabled:opacity-45 text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                  >
                                    <Check className="w-3.5 h-3.5" aria-hidden="true" />
                                    <span>قبول</span>
                                  </button>

                                  <button
                                    type="button"
                                    disabled={isRejected}
                                    onClick={() =>
                                      void handleOrderStatusChange(order.orderNumber, 'مرفوض')
                                    }
                                    className="px-3 py-2 min-h-[36px] rounded-lg border border-[#9b3046] text-[#9b3046] dark:text-[#f29aa9] hover:bg-[#9b3046] hover:text-white disabled:opacity-45 text-xs font-bold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap transition-colors"
                                  >
                                    <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                                    <span>رفض</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      setConfirmDeleteOrder(
                                        isConfirmingDelete ? null : order.orderNumber
                                      )
                                    }
                                    className="px-3 py-2 min-h-[36px] rounded-lg border border-[#e8dccd] dark:border-[#3a2b26] text-[#6f5a53] dark:text-[#b9a79b] hover:border-[#9b3046] hover:text-[#9b3046] text-xs font-bold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                                    <span>حذف</span>
                                  </button>

                                  {!isRejected && (
                                    <select
                                      aria-label={`تحديث مرحلة الشحن للطلب ${order.orderNumber}`}
                                      value={
                                        SHIPPING_STAGE_STATUSES.includes(order.status)
                                          ? order.status
                                          : ''
                                      }
                                      onChange={(e) => {
                                        if (e.target.value) {
                                          void handleOrderStatusChange(
                                            order.orderNumber,
                                            e.target.value as OrderStatus
                                          );
                                        }
                                      }}
                                      className="px-2.5 py-2 min-h-[36px] rounded-lg border border-[#e8dccd] dark:border-[#3a2b26] bg-[#faf6f0] dark:bg-[#16100e] text-xs font-semibold text-[#2a1a17] dark:text-[#f3e9df]"
                                    >
                                      <option value="" disabled>
                                        مرحلة الشحن...
                                      </option>
                                      {SHIPPING_STAGE_STATUSES.map((st) => (
                                        <option key={st} value={st}>
                                          {st}
                                        </option>
                                      ))}
                                    </select>
                                  )}
                                </div>
                              </div>

                              {/* Inline Delete Confirmation Prompt */}
                              {isConfirmingDelete && (
                                <div
                                  role="alert"
                                  className="rounded-xl border border-[#9b3046]/40 bg-[#9b3046]/10 p-3 flex flex-wrap items-center justify-between gap-3"
                                >
                                  <span className="text-xs font-bold text-[#9b3046] dark:text-[#f29aa9]">
                                    هل أنت متأكد من حذف الطلب #{order.orderNumber} نهائيًا؟
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => void handleDeleteOrder(order.orderNumber)}
                                      className="px-3.5 py-1.5 rounded-lg bg-[#9b3046] hover:bg-[#822639] text-white text-xs font-bold cursor-pointer"
                                    >
                                      تأكيد الحذف
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteOrder(null)}
                                      className="px-3 py-1.5 rounded-lg border border-[#e8dccd] dark:border-[#3a2b26] bg-[#fffdf9] dark:bg-[#211815] text-xs font-semibold cursor-pointer"
                                    >
                                      إلغاء
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* Order Line Items (Standard + Custom Perfume + Custom Candle Full Details) */}
                              <div className="rounded-xl border border-[#f0e5d7] dark:border-[#2e211d] bg-[#faf6f0]/75 dark:bg-[#16100e]/75 divide-y divide-[#f0e5d7] dark:divide-[#2e211d]">
                                {order.items.map((item, idx) => {
                                  const custom = item.customDetails as
                                    | {
                                        kind?: string;
                                        scentName?: string;
                                        bottleName?: string;
                                        sizeLabel?: string;
                                        sizeWeight?: string;
                                        colorLabel?: string;
                                        scent?: string;
                                        jarType?: string;
                                      }
                                    | undefined;

                                  return (
                                    <div
                                      key={`${order.orderNumber}-item-${idx}`}
                                      className="px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs"
                                    >
                                      <div className="space-y-0.5">
                                        <div className="flex flex-wrap items-center gap-2 font-bold text-[#2a1a17] dark:text-[#f3e9df]">
                                          <span>{item.name}</span>
                                          {custom?.kind === 'perfume' && (
                                            <span className="px-2 py-0.5 rounded bg-[#9b3046]/12 text-[#9b3046] dark:text-[#f29aa9] text-[10px]">
                                              عطر مخصص
                                            </span>
                                          )}
                                          {custom?.kind === 'candle' && (
                                            <span className="px-2 py-0.5 rounded bg-[#b98a3e]/20 text-[#8a5d14] dark:text-[#f3d18d] text-[10px]">
                                              شمعة مخصصة
                                            </span>
                                          )}
                                        </div>

                                        {custom?.kind === 'perfume' ? (
                                          <p className="text-[#5c4943] dark:text-[#c7b7ab]">
                                            العطر: <strong>{custom.scentName}</strong> · الاسم على
                                            الزجاجة: <strong>{custom.bottleName}</strong> · الحجم:{' '}
                                            <strong>{custom.sizeLabel}</strong>
                                          </p>
                                        ) : custom?.kind === 'candle' ? (
                                          <p className="text-[#5c4943] dark:text-[#c7b7ab]">
                                            الحجم: <strong>{custom.sizeLabel}</strong> (
                                            {custom.sizeWeight}) · اللون:{' '}
                                            <strong>{custom.colorLabel}</strong> · الرائحة:{' '}
                                            <strong>{custom.scent}</strong> · الجار:{' '}
                                            <strong>{custom.jarType}</strong>
                                          </p>
                                        ) : (
                                          <p className="text-[#7a655f] dark:text-[#b9a79b]">
                                            الرائحة: {item.scent}
                                          </p>
                                        )}
                                      </div>

                                      <div className="tabular-nums font-bold text-[#9e732b] dark:text-[#d4aa63] shrink-0">
                                        {item.quantity.toLocaleString('ar-EG')} ×{' '}
                                        {formatEGP(item.price)}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}

              {tab === 'notifications' && (() => {
                const lowOrOutProducts = products.filter(
                  (p) => (p.stock ?? 0) <= LOW_STOCK_THRESHOLD
                );

                return (
                  <div className="space-y-6">
                    {/* Live Low / Out-of-Stock Products Section */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-bold text-[#2a1a17] dark:text-[#f3e9df]">
                        تنبيهات المخزون المنخفض والنافذ ({lowOrOutProducts.length.toLocaleString('ar-EG')})
                      </h3>

                      {lowOrOutProducts.length === 0 ? (
                        <div className="rounded-xl border border-[#2d7a4f]/25 bg-[#eef8f2]/70 dark:bg-[#13261b]/50 p-4 text-xs font-semibold text-[#154d2e] dark:text-[#b9f0cf]">
                          جميع المنتجات متوفرة بكميات آمنة في المخزون حاليًا.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {lowOrOutProducts.map((prod) => {
                            const isOut = (prod.stock ?? 0) <= 0;
                            return (
                              <div
                                key={prod.id}
                                className={`rounded-xl border p-4 space-y-3 ${
                                  isOut
                                    ? 'border-[#9b3046]/45 bg-[#9b3046]/8'
                                    : 'border-[#b45309]/35 bg-[#fef3c7]/55 dark:bg-[#3a2210]/45'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <p className="text-sm font-bold text-[#2a1a17] dark:text-[#f3e9df]">
                                      {prod.name}
                                    </p>
                                    <p className="text-xs font-semibold tabular-nums mt-0.5 text-[#9a3412] dark:text-[#fbbf24]">
                                      {isOut
                                        ? 'نفذ من المخزون (٠ قطعة) — متوقف عن الطلب'
                                        : `مخزون منخفض: متبقي ${prod.stock.toLocaleString('ar-EG')} قطع فقط`}
                                    </p>
                                  </div>
                                  <span
                                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                      isOut
                                        ? 'bg-[#9b3046] text-white'
                                        : 'bg-[#b45309] text-white'
                                    }`}
                                  >
                                    {isOut ? 'نفذ' : 'منخفض'}
                                  </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => void handleQuickRestockProduct(prod, 10)}
                                    className="px-3 py-1.5 rounded-lg bg-[#1f8a4c] hover:bg-[#19723e] text-white text-xs font-bold cursor-pointer"
                                  >
                                    +١٠ للمخزون
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setHighlightedProductId(prod.id);
                                      setTab('products');
                                    }}
                                    className="px-3 py-1.5 rounded-lg border border-[#e8dccd] dark:border-[#3a2b26] bg-[#fffdf9] dark:bg-[#211815] text-xs font-semibold cursor-pointer"
                                  >
                                    تعديل الكمية يدويًا
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Order-triggered Interactive Stock Notifications */}
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-sm font-bold text-[#2a1a17] dark:text-[#f3e9df]">
                          إشعارات الطلبات وتحديثات المخزون (
                          {notifications.length.toLocaleString('ar-EG')})
                        </h3>
                        {notifications.length > 0 && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => void handleMarkNotificationRead('all')}
                              className="px-3 py-1.5 rounded-lg border border-[#e8dccd] dark:border-[#3a2b26] text-xs font-semibold hover:border-[#b98a3e] cursor-pointer"
                            >
                              تحديد الكل كمقروء
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDeleteNotification('clear-read')}
                              className="px-3 py-1.5 rounded-lg border border-[#e8dccd] dark:border-[#3a2b26] text-xs font-semibold text-[#9b3046] hover:border-[#9b3046] cursor-pointer"
                            >
                              مسح المقروءة
                            </button>
                          </div>
                        )}
                      </div>

                      {notifications.length === 0 ? (
                        <p className="py-8 text-center text-xs sm:text-sm text-[#7a655f] dark:text-[#b9a79b] rounded-xl border border-[#e8dccd] dark:border-[#3a2b26] bg-[#faf6f0] dark:bg-[#16100e]">
                          لا توجد إشعارات خصم مخزون من الطلبات حتى الآن.
                        </p>
                      ) : (
                        <div className="space-y-2.5">
                          {notifications.map((notif) => {
                            const liveProduct = products.find((p) => p.id === notif.productId);
                            const currentStock = liveProduct ? liveProduct.stock : notif.remainingStock;
                            const isOut = currentStock <= 0;
                            const isLow = currentStock > 0 && currentStock <= LOW_STOCK_THRESHOLD;

                            return (
                              <div
                                key={notif.id}
                                className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                  !notif.read
                                    ? 'border-[#9b3046]/45 bg-[#fffdf9] dark:bg-[#261b18] shadow-xs'
                                    : 'border-[#e8dccd] dark:border-[#3a2b26] bg-[#faf6f0]/60 dark:bg-[#16100e]/60 opacity-85'
                                }`}
                              >
                                <div className="space-y-1">
                                  <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-bold text-[#2a1a17] dark:text-[#f3e9df]">
                                    <span>{notif.productName}</span>
                                    <span
                                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                        isOut
                                          ? 'bg-[#9b3046] text-white'
                                          : isLow
                                          ? 'bg-[#b45309] text-white'
                                          : 'bg-[#1f8a4c]/15 text-[#154d2e] dark:text-[#8fd3ac]'
                                      }`}
                                    >
                                      {isOut
                                        ? 'نفذ من المخزون'
                                        : isLow
                                        ? `مخزون منخفض (${currentStock.toLocaleString('ar-EG')})`
                                        : `المتبقي: ${currentStock.toLocaleString('ar-EG')}`}
                                    </span>
                                    {!notif.read && (
                                      <span className="px-2 py-0.5 rounded bg-[#9b3046]/15 text-[#9b3046] dark:text-[#f29aa9] text-[10px]">
                                        جديد
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-[#6f5a53] dark:text-[#b9a79b] tabular-nums">
                                    الطلب #{notif.orderNumber} · تم خصم{' '}
                                    {notif.quantityOrdered.toLocaleString('ar-EG')} قطعة · المتبقي الآن:{' '}
                                    <strong>{currentStock.toLocaleString('ar-EG')}</strong> ·{' '}
                                    {notif.createdAt}
                                  </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => void handleRestockFromNotification(notif, 10)}
                                    className="px-3 py-1.5 rounded-lg bg-[#1f8a4c] hover:bg-[#19723e] text-white text-xs font-bold cursor-pointer whitespace-nowrap"
                                  >
                                    +١٠ للمخزون
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOrderFilter('all');
                                      setHighlightedOrder(notif.orderNumber);
                                      setTab('orders');
                                    }}
                                    className="px-3 py-1.5 rounded-lg border border-[#e8dccd] dark:border-[#3a2b26] bg-[#fffdf9] dark:bg-[#211815] text-xs font-semibold cursor-pointer whitespace-nowrap"
                                  >
                                    عرض الطلب
                                  </button>
                                  {!notif.read && (
                                    <button
                                      type="button"
                                      onClick={() => void handleMarkNotificationRead(notif.id)}
                                      className="px-3 py-1.5 rounded-lg border border-[#e8dccd] dark:border-[#3a2b26] text-xs font-semibold hover:border-[#b98a3e] cursor-pointer whitespace-nowrap"
                                    >
                                      تمت المراجعة
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => void handleDeleteNotification(notif.id)}
                                    aria-label="حذف الإشعار"
                                    className="w-8 h-8 rounded-lg border border-[#e8dccd] dark:border-[#3a2b26] text-[#7a655f] hover:text-[#9b3046] flex items-center justify-center cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

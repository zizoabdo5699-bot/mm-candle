import { useEffect, useRef, useState } from 'react';
import {
  Moon,
  Sun,
  Plus,
  SlidersHorizontal,
  MessageCircle,
  ArrowDown,
  ShoppingBag,
  Flame,
  X,
  Lock,
  Heart,
} from 'lucide-react';
import { STORE_CONFIG, type StoreRuntimeConfig } from './config';
import {
  INITIAL_REVIEWS,
  INITIAL_SCENT_POLL,
  INITIAL_SEASONAL_OFFER,
  PRODUCTS,
  SCENT_PROFILES,
  formatEGP,
  getProductPricing,
  matchProductSearch,
  type CustomerReview,
  type Product,
  type ProductCategory,
  type ScentPollOption,
  type SeasonalOffer,
} from './data/catalog';
import { Navbar } from './components/Navbar';
import { TopSearchBar } from './components/TopSearchBar';
import { ProductArtwork } from './components/ProductArtwork';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer, type CartItem } from './components/CartDrawer';
import { StarRating } from './components/StarRating';
import { CustomerReviewsSection } from './components/CustomerReviewsSection';
import { OrderTrackingSection } from './components/OrderTrackingSection';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { ScentPollSection } from './components/ScentPollSection';
import { SeasonalOfferBanner } from './components/SeasonalOfferBanner';
import { CustomPerfumeSection } from './components/CustomPerfumeSection';
import { CustomCandleSection } from './components/CustomCandleSection';
import {
  CheckoutSection,
  type ConfirmedOrder,
  type CustomerDetails,
} from './components/CheckoutSection';

type FilterTab = 'all' | ProductCategory;

const DEFAULT_CUSTOMER: CustomerDetails = {
  name: '',
  phone: '',
  email: '',
  governorate: 'وسط البلد - العباسية - بولاق أبو العلا - التحرير',
  address: '',
  notes: '',
  paymentMethod: 'cod',
  hasGiftMessage: false,
  giftMessage: '',
  giftWrap: false,
  sendViaWhatsapp: false,
  sendViaEmail: false,
};

function readJsonStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = window.localStorage.getItem('mm_theme');
      if (saved === 'light' || saved === 'dark') return saved;
      return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  const [cart, setCart] = useState<CartItem[]>(() => readJsonStorage('mm_cart', []));
  const [customer, setCustomer] = useState<CustomerDetails>(() =>
    readJsonStorage('mm_customer', DEFAULT_CUSTOMER)
  );
  const [lastOrder, setLastOrder] = useState<ConfirmedOrder | null>(() =>
    readJsonStorage('mm_last_order', null)
  );

  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [seasonalOffer, setSeasonalOffer] = useState<SeasonalOffer>(INITIAL_SEASONAL_OFFER);
  const [storeConfig, setStoreConfig] = useState<StoreRuntimeConfig>(STORE_CONFIG);
  const [scentPoll, setScentPoll] = useState<ScentPollOption[]>(INITIAL_SCENT_POLL);
  const [favorites, setFavorites] = useState<number[]>(() =>
    readJsonStorage<number[]>('mm_favorites', [])
  );
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [adminOpen, setAdminOpen] = useState<boolean>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return window.location.hash === '#admin' || params.get('admin') === '1';
    } catch {
      return false;
    }
  });
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeScentId, setActiveScentId] = useState<string>(SCENT_PROFILES[0].id);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [reminderToast, setReminderToast] = useState<string | null>(null);
  const lastExitReminderRef = useRef<number>(0);
  const [logoFallback, setLogoFallback] = useState(false);
  const [userReviews, setUserReviews] = useState<CustomerReview[]>(() =>
    readJsonStorage('mm_user_reviews', [])
  );
  const [reviewProductFilter, setReviewProductFilter] = useState<number | 'all'>('all');

  const syncWithCatalog = (
    nextProducts: Product[],
    nextOffer: SeasonalOffer = seasonalOffer
  ) => {
    const now = Date.now();
    setProducts(nextProducts);
    setSeasonalOffer(nextOffer);
    setCart((prev) =>
      prev.map((item) => {
        const fresh = nextProducts.find((p) => p.id === item.product.id);
        if (!fresh) return item;
        const pricing = getProductPricing(fresh, nextOffer, now);
        return { ...item, product: { ...fresh, price: pricing.finalPrice } };
      })
    );
    setSelectedProduct((prev) =>
      prev ? nextProducts.find((p) => p.id === prev.id) ?? null : null
    );
  };

  useEffect(() => {
    let cancelled = false;
    fetch('/api/products')
      .then((res) => (res.ok ? res.json() : null))
      .then(
        (
          data: {
            products?: Product[];
            seasonalOffer?: SeasonalOffer;
            storeConfig?: StoreRuntimeConfig;
            scentPoll?: ScentPollOption[];
          } | null
        ) => {
          if (cancelled || !data) return;
          if (data.storeConfig) {
            setStoreConfig(data.storeConfig);
          }
          if (data.scentPoll && Array.isArray(data.scentPoll)) {
            setScentPoll(data.scentPoll);
          }
          if (data.products && Array.isArray(data.products)) {
            syncWithCatalog(
              data.products,
              data.seasonalOffer ? data.seasonalOffer : seasonalOffer
            );
          }
        }
      )
      .catch(() => {
        // fallback to default products if offline
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!seasonalOffer.active) return;
    const interval = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(interval);
  }, [seasonalOffer.active]);

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#admin') {
        setAdminOpen(true);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
      window.localStorage.setItem('mm_theme', theme);
    } catch {
      // ignore storage errors
    }
  }, [theme]);

  useEffect(() => {
    try {
      window.localStorage.setItem('mm_cart', JSON.stringify(cart));
    } catch {
      // ignore storage errors
    }
  }, [cart]);

  useEffect(() => {
    try {
      window.localStorage.setItem('mm_customer', JSON.stringify(customer));
    } catch {
      // ignore storage errors
    }
  }, [customer]);

  useEffect(() => {
    try {
      if (lastOrder) {
        window.localStorage.setItem('mm_last_order', JSON.stringify(lastOrder));
      }
    } catch {
      // ignore storage errors
    }
  }, [lastOrder]);

  useEffect(() => {
    try {
      window.localStorage.setItem('mm_user_reviews', JSON.stringify(userReviews));
    } catch {
      // ignore storage errors
    }
  }, [userReviews]);

  useEffect(() => {
    try {
      window.localStorage.setItem('mm_favorites', JSON.stringify(favorites));
    } catch {
      // ignore storage errors
    }
  }, [favorites]);

  useEffect(() => {
    if (!toast) return;
    setReminderToast(null);
    const timer = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!reminderToast) return;
    const timer = window.setTimeout(() => setReminderToast(null), 6500);
    return () => window.clearTimeout(timer);
  }, [reminderToast]);

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Welcome-back reminder if user previously closed the site with items in cart
  useEffect(() => {
    try {
      const leftAt = window.localStorage.getItem('mm_cart_left_at');
      if (leftAt && totalItems > 0) {
        const countLabel =
          totalItems === 1
            ? 'منتج واحد'
            : totalItems === 2
            ? 'منتجان'
            : `${totalItems.toLocaleString('ar-EG')} منتجات`;
        setReminderToast(
          `أهلاً بعودتك! سلتك ما زالت تحتفظ بـ ${countLabel} — يمكنك إكمال طلبك الآن.`
        );
      }
      window.localStorage.removeItem('mm_cart_left_at');
    } catch {
      // ignore storage errors
    }
    // run once on initial mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Gentle cart reminder when user moves to close, switches away, or closes the page with items in cart
  useEffect(() => {
    if (totalItems === 0) {
      setReminderToast(null);
      try {
        window.localStorage.removeItem('mm_cart_left_at');
      } catch {
        // ignore storage errors
      }
      return;
    }

    const countLabel =
      totalItems === 1
        ? 'منتج واحد'
        : totalItems === 2
        ? 'منتجان'
        : `${totalItems.toLocaleString('ar-EG')} منتجات`;

    const markAbandoned = () => {
      try {
        window.localStorage.setItem('mm_cart_left_at', String(Date.now()));
      } catch {
        // ignore storage errors
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        markAbandoned();
        setReminderToast(
          `لسه عندك ${countLabel} في السلة — تقدر ترجع وتكمل طلبك في أي وقت.`
        );
      }
    };

    const handlePageHide = () => {
      markAbandoned();
      setReminderToast(
        `لسه عندك ${countLabel} في السلة — تقدر ترجع وتكمل طلبك في أي وقت.`
      );
    };

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY > 12 || cartOpen || adminOpen) return;
      const now = Date.now();
      if (now - lastExitReminderRef.current < 45000) return;
      lastExitReminderRef.current = now;
      markAbandoned();
      setReminderToast(
        `مهلاً! لديك ${countLabel} في سلتك — لا تنسَ العودة لإكمال الطلب لاحقًا.`
      );
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', markAbandoned);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', markAbandoned);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [totalItems, cartOpen, adminOpen]);

  const allReviews = [...userReviews, ...INITIAL_REVIEWS];

  const getProductRating = (product: Product) => {
    const added = userReviews.filter((r) => r.productId === product.id);
    const totalCount = product.reviewCount + added.length;
    const weightedSum =
      product.rating * product.reviewCount + added.reduce((sum, r) => sum + r.rating, 0);
    return {
      average: Number((weightedSum / totalCount).toFixed(1)),
      count: totalCount,
    };
  };

  const totalReviewCount = products.reduce((acc, p) => acc + getProductRating(p).count, 0);
  const overallAverage =
    totalReviewCount > 0
      ? Number(
          (
            products.reduce((acc, p) => {
              const summary = getProductRating(p);
              return acc + summary.average * summary.count;
            }, 0) / totalReviewCount
          ).toFixed(1)
        )
      : 5.0;

  const handleAddReview = (newReview: Omit<CustomerReview, 'id' | 'date'>) => {
    const entry: CustomerReview = {
      ...newReview,
      id: `user-${Date.now()}`,
      date: 'الآن',
    };
    setUserReviews((prev) => [entry, ...prev]);
    setReviewProductFilter('all');
  };

  const handleJumpToProductReviews = (productId: number) => {
    setReviewProductFilter(productId);
    const el = document.getElementById('reviews');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  const filteredProducts = products.filter((product) => {
    const matchesCategory = activeFilter === 'all' || product.category === activeFilter;
    if (!matchesCategory) return false;
    return matchProductSearch(product, searchQuery).matched;
  });

  const activeScent =
    SCENT_PROFILES.find((profile) => profile.id === activeScentId) ?? SCENT_PROFILES[0];

  const handleAddToCart = (product: Product, scent: string, quantity = 1) => {
    const freshProduct = products.find((p) => p.id === product.id) ?? product;
    const availableStock = freshProduct.stock ?? 0;
    if (availableStock <= 0) {
      setToast(`عذرًا، «${freshProduct.name}» نفذ من المخزون حاليًا`);
      return;
    }
    const existingForProduct = cart
      .filter((item) => !item.isCustom && item.product.id === freshProduct.id)
      .reduce((sum, item) => sum + item.quantity, 0);
    if (existingForProduct + quantity > availableStock) {
      setToast(
        `المتوفر في المخزون من «${freshProduct.name}» هو ${availableStock.toLocaleString('ar-EG')} فقط`
      );
      return;
    }

    const pricing = getProductPricing(freshProduct, seasonalOffer, nowMs);
    const pricedProduct: Product = { ...freshProduct, price: pricing.finalPrice };
    const key = `${freshProduct.id}::${scent}`;
    setCart((prev) => {
      const existing = prev.find((item) => item.key === key);
      if (existing) {
        return prev.map((item) =>
          item.key === key
            ? { ...item, product: pricedProduct, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { key, product: pricedProduct, scent, quantity }];
    });
    setToast(`تمت إضافة «${freshProduct.name}» إلى السلة`);
  };

  const handleAddCustomToCart = (customItem: CartItem) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.key === customItem.key);
      if (existing) {
        return prev.map((item) =>
          item.key === customItem.key
            ? { ...item, quantity: item.quantity + customItem.quantity }
            : item
        );
      }
      return [...prev, customItem];
    });
    setToast(`تمت إضافة «${customItem.product.name}» إلى السلة`);
  };

  const handleUpdateQty = (key: string, delta: number) => {
    if (delta > 0) {
      const target = cart.find((item) => item.key === key);
      if (target && !target.isCustom) {
        const fresh = products.find((p) => p.id === target.product.id) ?? target.product;
        const availableStock = fresh.stock ?? 0;
        const totalOfProduct = cart
          .filter((item) => !item.isCustom && item.product.id === target.product.id)
          .reduce((sum, item) => sum + item.quantity, 0);
        if (totalOfProduct + delta > availableStock) {
          setToast(
            `الحد الأقصى المتوفر من «${fresh.name}» هو ${availableStock.toLocaleString('ar-EG')}`
          );
          return;
        }
      }
    }

    setCart((prev) =>
      prev
        .map((item) =>
          item.key === key ? { ...item, quantity: item.quantity + delta } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveItem = (key: string) => {
    setCart((prev) => prev.filter((item) => item.key !== key));
  };

  const handleProceedToCheckout = () => {
    setCartOpen(false);
    const orderEl = document.getElementById('order');
    orderEl?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleToggleFavorite = (productId: number) => {
    const targetProduct = products.find((p) => p.id === productId);
    setFavorites((prev) => {
      const exists = prev.includes(productId);
      const next = exists ? prev.filter((id) => id !== productId) : [...prev, productId];
      if (targetProduct) {
        setToast(
          exists
            ? `تمت إزالة «${targetProduct.name}» من المفضلة`
            : `تمت إضافة «${targetProduct.name}» إلى المفضلة`
        );
      }
      return next;
    });
  };

  const openAdmin = () => {
    setAdminOpen(true);
    try {
      if (window.location.hash !== '#admin') {
        window.history.replaceState(null, '', '#admin');
      }
    } catch {
      // ignore
    }
  };

  const closeAdmin = () => {
    setAdminOpen(false);
    try {
      if (window.location.hash === '#admin') {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    } catch {
      // ignore
    }
  };

  const favoriteProducts = products.filter((p) => favorites.includes(p.id));

  return (
    <div
      id="top"
      className="min-h-screen bg-[#faf6f0] dark:bg-[#16100e] text-[#2a1a17] dark:text-[#f3e9df] transition-colors duration-200"
    >
      <Navbar cartCount={totalItems} onOpenCart={() => setCartOpen(true)} />

      {/* Top Product & Scent Note Search Bar */}
      <TopSearchBar
        query={searchQuery}
        products={products}
        seasonalOffer={seasonalOffer}
        nowMs={nowMs}
        onChangeQuery={setSearchQuery}
        onSelectProduct={setSelectedProduct}
        onQuickAdd={(product) => handleAddToCart(product, product.scents[0], 1)}
      />

      {/* Top Seasonal Offers Banner with Live Countdown */}
      <SeasonalOfferBanner
        offer={seasonalOffer}
        products={products}
        nowMs={nowMs}
        onSelectProduct={setSelectedProduct}
        onQuickAdd={(product) => handleAddToCart(product, product.scents[0], 1)}
      />

      {/* Section 1: Storefront Hero */}
      <section
        className="relative overflow-hidden text-[#f3e9df]"
        style={{
          background:
            'radial-gradient(115% 95% at 50% 0%, #3d1c23 0%, #1c110f 58%, #2a2013 100%)',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20 grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          <div className="lg:col-span-7 flex flex-col justify-center items-start gap-6">
            <p className="text-xs sm:text-sm font-medium text-[#d9c3a0]">
              إصدارات يدوية بكميات محدودة · القاهرة، مصر
            </p>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.2] text-balance text-[#faf4eb]">
              شموع مصنوعة يدويًا بحب… لتضيء لحظاتك
            </h1>

            <p className="text-base sm:text-lg text-[#dfd1c3] max-w-xl leading-relaxed">
              تشكيلة منتقاة من الشموع العطرية الطبيعية ومعطرات الجو بالعيدان، مصممة بعناية لتضفي
              دفئًا وهدوءًا يدوم في كل ركن من بيتك.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <a
                href="#products"
                className="min-h-[46px] px-7 py-3 rounded-full bg-[#a63a50] hover:bg-[#8f2e42] text-white text-sm sm:text-base font-bold inline-flex items-center gap-2 transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4aa63]"
              >
                <span>اطلب دلوقتي</span>
                <ArrowDown className="w-4 h-4" aria-hidden="true" />
              </a>

              <a
                href="#atelier"
                className="min-h-[46px] px-6 py-3 rounded-full border border-[#d9c3a0]/35 hover:border-[#d4aa63] text-[#f3e9df] text-sm sm:text-base font-semibold inline-flex items-center transition-colors whitespace-nowrap"
              >
                استكشف الروائح
              </a>

              <button
                type="button"
                onClick={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
                aria-label={theme === 'light' ? 'تفعيل الوضع الليلي' : 'تفعيل الوضع النهاري'}
                className="min-h-[46px] px-4 py-3 rounded-full border border-white/15 hover:border-[#d4aa63]/60 text-[#dfd1c3] text-xs font-medium inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
              >
                {theme === 'light' ? (
                  <>
                    <Moon className="w-4 h-4" aria-hidden="true" />
                    <span>الوضع الليلي</span>
                  </>
                ) : (
                  <>
                    <Sun className="w-4 h-4" aria-hidden="true" />
                    <span>الوضع النهاري</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={openAdmin}
                className="min-h-[46px] px-4 py-3 rounded-full border border-[#d9c3a0]/30 hover:border-[#d4aa63] bg-white/5 text-[#f3e9df] text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Lock className="w-3.5 h-3.5 text-[#d4aa63]" aria-hidden="true" />
                <span>دخول الأدمن</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 flex items-center justify-center">
            <div className="w-full max-w-[300px] sm:max-w-[340px] rounded-3xl p-3 bg-white/5 border border-[#d9c3a0]/20 shadow-2xl">
              {!logoFallback ? (
                <img
                  src="/images/brand-logo.jpg"
                  alt="شعار M&M Candle Co."
                  referrerPolicy="no-referrer"
                  onError={() => setLogoFallback(true)}
                  className="w-full h-auto rounded-2xl object-cover"
                />
              ) : (
                <div className="aspect-[3/4] rounded-2xl bg-[#faf5ee] text-[#2a1a17] flex flex-col items-center justify-center p-8 text-center">
                  <span className="font-brand text-4xl font-bold">M&amp;M</span>
                  <span className="mt-2 text-xs tracking-widest text-[#9e732b]">CANDLE CO.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Featured Products */}
      <main>
        <section id="products" className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <p className="text-xs font-semibold text-[#9e732b] dark:text-[#d4aa63] mb-2">
                المجموعة المختارة
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#2a1a17] dark:text-[#f3e9df]">
                منتجاتنا
              </h2>
            </div>

            <div
              role="tablist"
              aria-label="تصفية المنتجات"
              className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#f1e7d8] dark:bg-[#241a17] border border-[#e8dccd] dark:border-[#3a2b26] self-start md:self-auto"
            >
              {(
                [
                  { id: 'all', label: 'الكل' },
                  { id: 'candles', label: 'الشموع' },
                  { id: 'diffusers', label: 'المعطرات' },
                  { id: 'gifts', label: 'الهدايا' },
                ] as const
              ).map((tab) => {
                const active = activeFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveFilter(tab.id)}
                    className={`px-4 py-2 min-h-[40px] rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-[#fffdf9] dark:bg-[#352722] text-[#2a1a17] dark:text-[#f3e9df] shadow-xs'
                        : 'text-[#6f5a53] dark:text-[#b9a79b] hover:text-[#2a1a17] dark:hover:text-[#f3e9df]'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {searchQuery.trim() && (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e8dccd] dark:border-[#3a2b26] bg-[#fffdf9] dark:bg-[#211815] px-4 py-3 text-xs sm:text-sm">
              <p className="text-[#5c4943] dark:text-[#c7b7ab]">
                نتائج البحث عن{' '}
                <strong className="text-[#2a1a17] dark:text-[#f3e9df]">
                  «{searchQuery.trim()}»
                </strong>{' '}
                — {filteredProducts.length.toLocaleString('ar-EG')} منتج
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="font-bold text-[#9b3046] dark:text-[#d4aa63] hover:underline underline-offset-4 cursor-pointer"
              >
                مسح البحث
              </button>
            </div>
          )}

          {filteredProducts.length === 0 ? (
            <div className="rounded-2xl border border-[#e8dccd] dark:border-[#3a2b26] bg-[#fffdf9] dark:bg-[#211815] p-10 text-center space-y-3">
              <p className="text-base font-bold text-[#2a1a17] dark:text-[#f3e9df]">
                لا توجد منتجات مطابقة لبحثك الحالي
              </p>
              <p className="text-xs sm:text-sm text-[#6f5a53] dark:text-[#b9a79b]">
                جرّب البحث باسم منتج آخر أو نوتة عطرية مثل: فانيليا، عنبر، برغموت، أو رمان.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setActiveFilter('all');
                }}
                className="mt-2 min-h-[40px] px-5 py-2 rounded-full bg-[#9b3046] hover:bg-[#822639] text-white text-xs sm:text-sm font-bold cursor-pointer"
              >
                إظهار كل المنتجات
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product) => {
              const ratingSummary = getProductRating(product);
              const stockCount = product.stock ?? 0;
              const isOutOfStock = stockCount <= 0;
              const isLowStock = stockCount > 0 && stockCount <= storeConfig.lowStockThreshold;
              const pricing = getProductPricing(product, seasonalOffer, nowMs);
              const isFav = favorites.includes(product.id);
              return (
                <article
                  key={product.id}
                  className="group rounded-2xl bg-[#fffdf9] dark:bg-[#211815] border border-[#e8dccd] dark:border-[#3a2b26] overflow-hidden flex flex-col transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="relative aspect-square w-full overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setSelectedProduct(product)}
                      aria-label={`عرض تفاصيل ${product.name}`}
                      className="relative w-full h-full overflow-hidden text-right cursor-pointer focus-visible:outline-2 focus-visible:outline-[#b98a3e]"
                    >
                      <ProductArtwork product={product} />
                      {pricing.isDiscounted && (
                        <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-md bg-[#9b3046] text-white text-[11px] font-bold shadow-md tabular-nums">
                          خصم {pricing.discountPercent.toLocaleString('ar-EG')}٪
                        </span>
                      )}
                      {isLowStock && (
                        <span className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-[#9a3412] text-[#fef3c7] text-[11px] font-bold inline-flex items-center gap-1 shadow-md">
                          <Flame className="w-3 h-3 shrink-0" aria-hidden="true" />
                          <span>قليل المخزون</span>
                        </span>
                      )}
                      {isOutOfStock && (
                        <span className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-[#2a1a17]/95 text-[#faf6f0] text-[11px] font-bold shadow-md">
                          نفذ
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleFavorite(product.id)}
                      aria-label={
                        isFav ? `إزالة ${product.name} من المفضلة` : `إضافة ${product.name} إلى المفضلة`
                      }
                      aria-pressed={isFav}
                      title={isFav ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
                      className={`absolute top-3 left-3 z-10 w-9 h-9 rounded-full flex items-center justify-center shadow-md border transition-all cursor-pointer ${
                        isFav
                          ? 'bg-[#9b3046] border-[#9b3046] text-white scale-105'
                          : 'bg-[#fffdf9]/90 dark:bg-[#211815]/90 border-[#e8dccd] dark:border-[#3a2b26] text-[#6f5a53] dark:text-[#d9c3a0] hover:text-[#9b3046] dark:hover:text-[#f3e9df]'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} aria-hidden="true" />
                    </button>
                  </div>

                  <div className="p-5 flex flex-col flex-1 gap-3">
                    <div className="flex items-center justify-between gap-2 text-xs text-[#7a655f] dark:text-[#b9a79b]">
                      <div className="flex items-center gap-1.5 truncate">
                        <span>{product.categoryLabel}</span>
                        <span aria-hidden="true">·</span>
                        <span>{product.spec}</span>
                      </div>
                      {product.tag && (
                        <span className="text-[#9b3046] dark:text-[#d4aa63] font-medium whitespace-nowrap">
                          {product.tag}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="text-lg font-bold text-[#2a1a17] dark:text-[#f3e9df]">
                        <button
                          type="button"
                          onClick={() => setSelectedProduct(product)}
                          className="text-right hover:text-[#9b3046] dark:hover:text-[#d4aa63] transition-colors cursor-pointer"
                        >
                          {product.name}
                        </button>
                      </h3>

                      <button
                        type="button"
                        onClick={() => handleJumpToProductReviews(product.id)}
                        className="inline-flex items-center gap-1.5 text-xs text-[#6f5a53] dark:text-[#b9a79b] hover:text-[#2a1a17] dark:hover:text-[#f3e9df] transition-colors cursor-pointer"
                      >
                        <StarRating rating={ratingSummary.average} />
                        <span className="font-bold text-[#2a1a17] dark:text-[#f3e9df] tabular-nums">
                          {ratingSummary.average.toLocaleString('ar-EG', {
                            minimumFractionDigits: 1,
                            maximumFractionDigits: 1,
                          })}
                        </span>
                        <span className="tabular-nums">
                          ({ratingSummary.count.toLocaleString('ar-EG')})
                        </span>
                      </button>

                      <p className="text-xs sm:text-sm text-[#6f5a53] dark:text-[#b9a79b] leading-relaxed">
                        {product.subtitle}
                      </p>
                    </div>

                    {isLowStock && (
                      <div className="rounded-lg border border-[#b45309]/25 bg-[#fef3c7]/65 dark:bg-[#3a2210]/65 dark:border-[#f59e0b]/30 px-3 py-1.5 flex items-center gap-1.5 text-xs font-semibold text-[#9a3412] dark:text-[#fbbf24]">
                        <Flame className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span>
                          متبقي {stockCount.toLocaleString('ar-EG')}{' '}
                          {stockCount === 1 ? 'قطعة فقط' : stockCount === 2 ? 'قطعتان فقط' : 'قطع فقط'}
                        </span>
                      </div>
                    )}

                    <div className="mt-auto pt-3 border-t border-[#e8dccd] dark:border-[#3a2b26] flex items-center justify-between gap-2">
                      <div className="flex items-baseline gap-2 tabular-nums">
                        <span className="text-base font-bold text-[#9e732b] dark:text-[#d4aa63]">
                          {formatEGP(pricing.finalPrice)}
                        </span>
                        {pricing.isDiscounted && (
                          <span className="text-xs line-through text-[#7a655f] dark:text-[#b9a79b]">
                            {formatEGP(pricing.originalPrice)}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedProduct(product)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#6f5a53] dark:text-[#b9a79b] hover:text-[#2a1a17] dark:hover:text-[#f3e9df] cursor-pointer whitespace-nowrap"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>اختر الرائحة</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      disabled={isOutOfStock}
                      onClick={() => handleAddToCart(product, product.scents[0], 1)}
                      className="w-full min-h-[42px] px-4 py-2 rounded-full border border-[#9b3046] dark:border-[#c44d65] text-[#9b3046] dark:text-[#f3e9df] hover:bg-[#9b3046] hover:text-white dark:hover:bg-[#b8465c] disabled:opacity-45 disabled:pointer-events-none text-sm font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <Plus className="w-4 h-4" aria-hidden="true" />
                      <span>{isOutOfStock ? 'نفذ — غير متوفر' : 'أضف للطلب'}</span>
                    </button>
                  </div>
                </article>
              );
              })}
            </div>
          )}
        </section>

        {/* Section 2B: Custom Perfume Builder */}
        <CustomPerfumeSection
          config={storeConfig.customPerfume}
          onAddCustomToCart={handleAddCustomToCart}
        />

        {/* Section 2C: Custom Candle Builder */}
        <CustomCandleSection
          config={storeConfig.customCandle}
          onAddCustomToCart={handleAddCustomToCart}
        />

        {/* Section 3: Craftsmanship & Interactive Scent Atelier */}
        <section
          id="atelier"
          className="border-y border-[#e8dccd] dark:border-[#3a2b26] bg-[#f4ece0]/65 dark:bg-[#1c1411]"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div id="craft" className="lg:col-span-5 space-y-6">
              <div>
                <p className="text-xs font-semibold text-[#9e732b] dark:text-[#d4aa63] mb-2">
                  لماذا M&amp;M Candle Co.
                </p>
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#2a1a17] dark:text-[#f3e9df]">
                  حرفية الصب اليدوي وتوازن العطر
                </h2>
              </div>

              <p className="text-sm sm:text-base text-[#5c4943] dark:text-[#c7b7ab] leading-relaxed">
                كل شمعة ومعطر جو يُحضّر يدويًا في استوديو M&amp;M بكميات مدروسة لضمان نقاء
                الاحتراق، وثبات العطر دون دخان أو مواد صناعية قاسية.
              </p>

              <dl className="divide-y divide-[#e8dccd] dark:divide-[#3a2b26] border-t border-[#e8dccd] dark:border-[#3a2b26]">
                <div className="py-4 flex justify-between gap-4">
                  <dt className="text-sm font-bold text-[#2a1a17] dark:text-[#f3e9df]">
                    شمع صويا طبيعي ١٠٠٪
                  </dt>
                  <dd className="text-xs sm:text-sm text-[#6f5a53] dark:text-[#b9a79b]">
                    احتراق نظيف وبطيء يدوم أطول
                  </dd>
                </div>
                <div className="py-4 flex justify-between gap-4">
                  <dt className="text-sm font-bold text-[#2a1a17] dark:text-[#f3e9df]">
                    زيوت عطرية مركزة
                  </dt>
                  <dd className="text-xs sm:text-sm text-[#6f5a53] dark:text-[#b9a79b]">
                    انتشار متوازن في المساحات الكبيرة
                  </dd>
                </div>
                <div className="py-4 flex justify-between gap-4">
                  <dt className="text-sm font-bold text-[#2a1a17] dark:text-[#f3e9df]">
                    تجهيز هدايا حسب الطلب
                  </dt>
                  <dd className="text-xs sm:text-sm text-[#6f5a53] dark:text-[#b9a79b]">
                    شريط ساتان وبطاقة إهداء خاصة
                  </dd>
                </div>
              </dl>
            </div>

            <div className="lg:col-span-7 rounded-2xl bg-[#fffdf9] dark:bg-[#211815] border border-[#e8dccd] dark:border-[#3a2b26] p-6 sm:p-8 space-y-6">
              <div>
                <h3 className="font-display text-2xl font-bold text-[#2a1a17] dark:text-[#f3e9df]">
                  دليل النوتات العطرية
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-[#6f5a53] dark:text-[#b9a79b]">
                  اختر نوتة عطرية لتتعرّف على طبقاتها وتضيف المنتج المناسب لطلبك.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {SCENT_PROFILES.map((profile) => {
                  const active = profile.id === activeScent.id;
                  return (
                    <button
                      key={profile.id}
                      type="button"
                      onClick={() => setActiveScentId(profile.id)}
                      className={`px-4 py-2 min-h-[40px] rounded-lg text-xs sm:text-sm font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                        active
                          ? 'bg-[#9b3046] border-[#9b3046] text-white'
                          : 'bg-[#faf6f0] dark:bg-[#16100e] border-[#e8dccd] dark:border-[#3a2b26] text-[#5c4943] dark:text-[#b9a79b] hover:border-[#b98a3e]'
                      }`}
                    >
                      {profile.name}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-base font-bold text-[#2a1a17] dark:text-[#f3e9df]">
                    {activeScent.name}
                  </span>
                  <span className="text-xs text-[#9e732b] dark:text-[#d4aa63]">
                    {activeScent.family}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-[#e8dccd] dark:border-[#3a2b26]">
                  <div>
                    <span className="block text-xs text-[#7a655f] dark:text-[#b9a79b] mb-1">
                      مقدمة العطر
                    </span>
                    <p className="text-sm font-semibold text-[#2a1a17] dark:text-[#f3e9df]">
                      {activeScent.topNote}
                    </p>
                  </div>
                  <div>
                    <span className="block text-xs text-[#7a655f] dark:text-[#b9a79b] mb-1">
                      قلب العطر
                    </span>
                    <p className="text-sm font-semibold text-[#2a1a17] dark:text-[#f3e9df]">
                      {activeScent.heartNote}
                    </p>
                  </div>
                  <div>
                    <span className="block text-xs text-[#7a655f] dark:text-[#b9a79b] mb-1">
                      قاعدة العطر
                    </span>
                    <p className="text-sm font-semibold text-[#2a1a17] dark:text-[#f3e9df]">
                      {activeScent.baseNote}
                    </p>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-[#5c4943] dark:text-[#c7b7ab]">
                  {activeScent.mood}
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-2">
                  {activeScent.productIds.map((pid) => {
                    const matched = products.find((p) => p.id === pid);
                    if (!matched) return null;
                    const isMatchedOut = (matched.stock ?? 0) <= 0;
                    return (
                      <button
                        key={matched.id}
                        type="button"
                        disabled={isMatchedOut}
                        onClick={() => handleAddToCart(matched, activeScent.name, 1)}
                        className="px-4 py-2 min-h-[40px] rounded-full border border-[#e8dccd] dark:border-[#3a2b26] hover:border-[#9b3046] dark:hover:border-[#d4aa63] disabled:opacity-45 disabled:pointer-events-none text-xs font-semibold text-[#2a1a17] dark:text-[#f3e9df] inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#9b3046] dark:text-[#d4aa63]" aria-hidden="true" />
                        <span>
                          {isMatchedOut
                            ? `${matched.name} (نفذ)`
                            : `أضف ${matched.name} بهذا العطر`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Customer Reviews */}
        <CustomerReviewsSection
          products={products}
          reviews={allReviews}
          selectedProductFilter={reviewProductFilter}
          onChangeProductFilter={setReviewProductFilter}
          onAddReview={handleAddReview}
          overallAverage={overallAverage}
          totalReviewCount={totalReviewCount}
        />

        {/* Section 5: Order Tracking */}
        <OrderTrackingSection recentOrderNumber={lastOrder?.orderNumber} />

        {/* Section 6: Order & WhatsApp Checkout */}
        <CheckoutSection
          items={cart}
          customer={customer}
          lastOrder={lastOrder}
          storeConfig={storeConfig}
          onChangeCustomer={setCustomer}
          onUpdateQty={handleUpdateQty}
          onRemoveItem={handleRemoveItem}
          onConfirmOrder={setLastOrder}
          onClearCart={() => setCart([])}
          onProductsUpdated={syncWithCatalog}
        />

        {/* Section 7: Scent of the Month Community Poll */}
        <ScentPollSection externalOptions={scentPoll} />
      </main>

      {/* Footer */}
      <footer className="border-t border-[#e8dccd] dark:border-[#3a2b26] pt-8 pb-24 sm:pb-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-[#7a655f] dark:text-[#b9a79b]">
          <p dir="ltr" className="font-medium">
            M&amp;M Candle Co. · Handcrafted Candles
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <a
              href={`https://wa.me/${storeConfig.whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-[#2a1a17] dark:hover:text-[#f3e9df] transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-[#1f8a4c]" aria-hidden="true" />
              <span>تواصل مباشر عبر واتساب</span>
            </a>
            <button
              type="button"
              onClick={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
              className="hover:text-[#2a1a17] dark:hover:text-[#f3e9df] transition-colors cursor-pointer"
            >
              {theme === 'light' ? 'الوضع الليلي' : 'الوضع النهاري'}
            </button>
            <button
              type="button"
              onClick={openAdmin}
              className="px-3.5 py-2 rounded-lg border border-[#e8dccd] dark:border-[#3a2b26] bg-[#fffdf9] dark:bg-[#211815] text-[#2a1a17] dark:text-[#f3e9df] hover:border-[#9b3046] dark:hover:border-[#d4aa63] text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-[#9b3046] dark:text-[#d4aa63]" aria-hidden="true" />
              <span>دخول الأدمن</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Quick-View / Scent Selection Modal */}
      <ProductDetailModal
        product={selectedProduct}
        ratingSummary={selectedProduct ? getProductRating(selectedProduct) : undefined}
        seasonalOffer={seasonalOffer}
        nowMs={nowMs}
        lowStockThreshold={storeConfig.lowStockThreshold}
        isFavorite={selectedProduct ? favorites.includes(selectedProduct.id) : false}
        onToggleFavorite={handleToggleFavorite}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
      />

      {/* Slide-over Cart Drawer */}
      <CartDrawer
        open={cartOpen}
        items={cart}
        favoriteProducts={favoriteProducts}
        seasonalOffer={seasonalOffer}
        nowMs={nowMs}
        storeConfig={storeConfig}
        governorate={customer.governorate}
        onChangeGovernorate={(gov) => setCustomer((prev) => ({ ...prev, governorate: gov }))}
        onClose={() => setCartOpen(false)}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveItem}
        onToggleFavorite={handleToggleFavorite}
        onAddFavoriteToCart={(prod) => handleAddToCart(prod, prod.scents[0], 1)}
        onProceedToCheckout={handleProceedToCheckout}
      />

      {/* Full-Page Admin Control Center */}
      <AdminDashboardModal
        open={adminOpen}
        products={products}
        seasonalOffer={seasonalOffer}
        storeConfig={storeConfig}
        scentPoll={scentPoll}
        onClose={closeAdmin}
        onProductsUpdated={(nextProducts) => syncWithCatalog(nextProducts, seasonalOffer)}
        onSeasonalOfferUpdated={(nextOffer) => syncWithCatalog(products, nextOffer)}
        onStoreConfigUpdated={setStoreConfig}
        onScentPollUpdated={setScentPoll}
      />

      {/* Floating Action Button for Quick Cart Access */}
      {!cartOpen && !selectedProduct && !adminOpen && (
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          aria-label={`فتح سلة التسوق (${totalItems.toLocaleString('ar-EG')} منتجات)`}
          style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
          className="fixed left-4 sm:left-6 z-40 h-12 px-4 rounded-full bg-[#9b3046] hover:bg-[#822639] text-white shadow-xl border border-[#d4aa63]/35 inline-flex items-center gap-2.5 transition-transform duration-150 ease-out hover:-translate-y-0.5 active:scale-95 cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4aa63]"
        >
          <span className="relative inline-flex items-center">
            <ShoppingBag className="w-5 h-5" aria-hidden="true" />
          </span>
          <span className="text-sm font-bold">السلة</span>
          <span
            aria-hidden="true"
            className="min-w-[24px] h-6 px-1.5 rounded-full bg-[#faf6f0] text-[#2a1a17] text-xs font-bold tabular-nums inline-flex items-center justify-center"
          >
            {totalItems.toLocaleString('ar-EG')}
          </span>
        </button>
      )}

      {/* Non-intrusive Add-to-Cart Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 left-4 sm:left-6 z-40 max-w-sm px-4 py-3 rounded-xl bg-[#2a1a17] dark:bg-[#f3e9df] text-[#faf6f0] dark:text-[#2a1a17] text-xs sm:text-sm font-semibold shadow-xl flex items-center gap-3"
        >
          <span>{toast}</span>
          <button
            type="button"
            onClick={() => {
              setToast(null);
              setCartOpen(true);
            }}
            className="text-[#d4aa63] dark:text-[#9b3046] underline underline-offset-4 cursor-pointer whitespace-nowrap"
          >
            عرض السلة
          </button>
        </div>
      )}

      {/* Gentle Exit / Return Cart Reminder Toast */}
      {!toast && reminderToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 left-4 sm:left-6 z-40 max-w-md px-4 py-3.5 rounded-xl bg-[#fffdf9] dark:bg-[#2a1e1a] border border-[#b98a3e]/50 text-[#2a1a17] dark:text-[#f3e9df] text-xs sm:text-sm shadow-2xl flex items-center gap-3"
        >
          <ShoppingBag
            className="w-4 h-4 text-[#9b3046] dark:text-[#d4aa63] shrink-0"
            aria-hidden="true"
          />
          <span className="font-medium leading-snug">{reminderToast}</span>
          <button
            type="button"
            onClick={() => {
              setReminderToast(null);
              handleProceedToCheckout();
            }}
            className="text-xs font-bold text-[#9b3046] dark:text-[#d4aa63] underline underline-offset-4 cursor-pointer whitespace-nowrap shrink-0"
          >
            إكمال الطلب
          </button>
          <button
            type="button"
            onClick={() => setReminderToast(null)}
            aria-label="إغلاق التذكير"
            className="p-1 text-[#7a655f] dark:text-[#b9a79b] hover:text-[#2a1a17] dark:hover:text-[#f3e9df] cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

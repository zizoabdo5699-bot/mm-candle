import { useEffect, useState } from 'react';
import { Minus, Plus, X, Check, Flame, Leaf, ShieldAlert } from 'lucide-react';
import {
  LOW_STOCK_THRESHOLD,
  formatEGP,
  getProductPricing,
  type Product,
  type SeasonalOffer,
} from '../data/catalog';
import { ProductArtwork } from './ProductArtwork';
import { StarRating } from './StarRating';

interface ProductDetailModalProps {
  product: Product | null;
  ratingSummary?: { average: number; count: number };
  seasonalOffer?: SeasonalOffer | null;
  nowMs?: number;
  onClose: () => void;
  onAddToCart: (product: Product, scent: string, quantity: number) => void;
}

type ModalTab = 'details' | 'ingredients';

function getProductComposition(product: Product): {
  ingredients: string[];
  safetyTips: string[];
} {
  if (product.slug === 'reed-diffuser') {
    return {
      ingredients: [
        'قاعدة مذيب نباتية آمنة وخالية من الكحول القاسي',
        'زيوت عطرية مركزة طبيعية خالية من الفثالات والبارابين',
        'عيدان فايبر سوداء مسامية لانتشار عطري متوازن',
        'زجاجة سميكة قابلة لإعادة الاستخدام مع غطاء معدني',
      ],
      safetyTips: [
        'يُحفظ بعيدًا عن متناول الأطفال والحيوانات الأليفة ومصادر اللهب المباشر.',
        'تجنبي سكب الزيت العطري على الأسطح الخشبية المطلية أو الأقمشة لتفادي البقع.',
        'اغسلي اليدين بالماء والصابون بعد تقليب العيدان إذا لامس الزيت بشرتك.',
        'يوضع في مكان معتدل الحرارة بعيدًا عن أشعة الشمس المباشرة لإطالة ثبات العطر.',
      ],
    };
  }

  if (product.slug === 'decor-candle') {
    return {
      ingredients: [
        'مزيج طبيعي من شمع الصويا وشمع النحل النقي ١٠٠٪',
        'فتيل قطني طبيعي مجدول خالٍ من الرصاص والزنك',
        'زيوت عطرية نقية خالية من البارابين والمواد الكيميائية القاسية',
        'أصباغ معدنية طبيعية آمنة للاحتراق النظيف',
      ],
      safetyTips: [
        'قصّي الفتيل إلى طول ٥ مم قبل كل إشعال لمنع الدخان وضمان لهب مستقر.',
        'ضعي الشمعة الديكورية على طبق أو قاعدة مقاومة للحرارة لالتقاط أي شمع ذائب.',
        'لا تتركي الشمعة مشتعلة لأكثر من ٤ ساعات متواصلة، ولا تتركيها دون مراقبة.',
        'تُبعد عن تيارات الهواء والمواد القابلة للاشتعال والأطفال والحيوانات الأليفة.',
        'توقفي عن الإشعال عندما يتبقى حوالي ١ سم من الشمع في القاعدة.',
      ],
    };
  }

  if (product.slug === 'gift-box') {
    return {
      ingredients: [
        'شمعة من شمع الصويا الطبيعي ١٠٠٪ بفتيل قطني نقي خالٍ من الرصاص',
        'معطر جو بقاعدة نباتية لطيفة وعيدان فايبر عالية الامتصاص',
        'زيوت عطرية مركزة مستخلصة بعناية، خالية من الفثالات والبارابين',
        'علبة هدايا فاخرة من الورق المقوى الصديق للبيئة وشريط ساتان',
      ],
      safetyTips: [
        'قصّي فتيل الشمعة إلى ٥ مم قبل كل استخدام واتركيها تذوب بالتساوي في المرة الأولى.',
        'لا تتركي الشمعة مشتعلة أكثر من ٤ ساعات متواصلة أو في غرفة بدون مراقبة.',
        'ضعي الشمعة على سطح مقاوم للحرارة وبعيدًا عن الستائر وتيارات الهواء.',
        'يُحفظ المعطر والشمعة بعيدًا عن متناول الأطفال والحيوانات الأليفة ودرجات الحرارة العالية.',
      ],
    };
  }

  return {
    ingredients: [
      'شمع صويا طبيعي ١٠٠٪ نباتي وخالٍ تمامًا من البارافين البترولي',
      'فتيل قطني نقي خالٍ من الرصاص لاحتراق هادئ بدون دخان أسود',
      'زيوت عطرية مركزة عالية النقاء خالية من الفثالات والبارابين',
      'وعاء زجاجي مقاوم للحرارة قابل لإعادة الاستخدام أو التدوير',
    ],
    safetyTips: [
      'قصّي الفتيل إلى ٥ مم قبل كل إشعال لتجنب الدخان الأسود والحفاظ على ثبات اللهب.',
      'في الإشعال الأول، اتركي الشمعة تعمل لمدة ٢–٣ ساعات حتى يذوب السطح بالكامل.',
      'لا تتركي الشمعة مشتعلة لأكثر من ٤ ساعات متواصلة، وأطفئيها قبل النوم أو مغادرة المكان.',
      'ضعي الشمعة على سطح مستوٍ مقاوم للحرارة بعيدًا عن التيارات الهوائية والأطفال والحيوانات الأليفة.',
      'توقفي عن الاستخدام عندما يتبقى أقل من ١ سم من الشمع في قاع الكوب الزجاجي.',
    ],
  };
}

export function ProductDetailModal({
  product,
  ratingSummary,
  seasonalOffer,
  nowMs,
  onClose,
  onAddToCart,
}: ProductDetailModalProps) {
  const [selectedScent, setSelectedScent] = useState('');
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState<ModalTab>('details');

  useEffect(() => {
    if (product) {
      setSelectedScent(product.scents[0]);
      setQty(1);
      setActiveTab('details');
    }
  }, [product]);

  useEffect(() => {
    if (!product) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [product, onClose]);

  if (!product) return null;

  const avg = ratingSummary?.average ?? product.rating;
  const count = ratingSummary?.count ?? product.reviewCount;
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD;
  const pricing = getProductPricing(product, seasonalOffer, nowMs);
  const composition = getProductComposition(product);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-product-title"
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] rounded-2xl bg-[#fffdf9] dark:bg-[#211815] border border-[#e8dccd] dark:border-[#3a2b26] shadow-2xl overflow-y-auto md:overflow-hidden grid grid-cols-1 md:grid-cols-2"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="إغلاق النافذة"
          className="absolute top-3 left-3 z-10 w-10 h-10 rounded-full bg-[#faf6f0]/90 dark:bg-[#16100e]/90 border border-[#e8dccd] dark:border-[#3a2b26] text-[#2a1a17] dark:text-[#f3e9df] flex items-center justify-center hover:bg-[#efe4d4] dark:hover:bg-[#322420] cursor-pointer focus-visible:outline-2 focus-visible:outline-[#b98a3e]"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="aspect-[4/3] md:aspect-auto md:min-h-[420px] bg-[#f4ece0] dark:bg-[#271d1a]">
          <ProductArtwork product={product} />
        </div>

        <div className="p-6 sm:p-8 flex flex-col justify-between gap-5 md:overflow-y-auto md:max-h-[90vh]">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs text-[#7a655f] dark:text-[#b9a79b]">
              <span>{product.categoryLabel}</span>
              <span aria-hidden="true">·</span>
              <span>{product.spec}</span>
              <span aria-hidden="true">·</span>
              <span>{product.longevity}</span>
            </div>

            <div>
              <h3
                id="modal-product-title"
                className="font-display text-2xl sm:text-3xl font-bold text-[#2a1a17] dark:text-[#f3e9df]"
              >
                {product.name}
              </h3>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-baseline gap-2.5">
                  <p className="text-2xl font-bold text-[#9e732b] dark:text-[#d4aa63] tabular-nums">
                    {formatEGP(pricing.finalPrice)}
                  </p>
                  {pricing.isDiscounted && (
                    <>
                      <span className="text-sm line-through text-[#7a655f] dark:text-[#b9a79b] tabular-nums">
                        {formatEGP(pricing.originalPrice)}
                      </span>
                      <span className="text-xs font-bold text-[#9b3046] dark:text-[#f29aa9]">
                        وفر {pricing.discountPercent.toLocaleString('ar-EG')}٪
                      </span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#6f5a53] dark:text-[#b9a79b]">
                  <StarRating rating={avg} />
                  <span className="font-bold text-[#2a1a17] dark:text-[#f3e9df] tabular-nums">
                    {avg.toLocaleString('ar-EG', {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    })}
                  </span>
                  <span className="tabular-nums">
                    ({count.toLocaleString('ar-EG')} تقييم)
                  </span>
                </div>
              </div>
            </div>

            {(isLowStock || isOutOfStock) && (
              <div
                role="status"
                className="rounded-lg border border-[#b45309]/30 bg-[#fef3c7]/70 dark:bg-[#3a2210]/70 dark:border-[#f59e0b]/35 px-3.5 py-2 flex items-center gap-2 text-xs font-bold text-[#9a3412] dark:text-[#fbbf24]"
              >
                <Flame className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>
                  {isOutOfStock
                    ? 'نفذ — غير متوفر حاليًا في المخزون'
                    : `قليل المخزون · متبقي ${product.stock.toLocaleString('ar-EG')} ${
                        product.stock === 1 ? 'قطعة فقط' : product.stock === 2 ? 'قطعتان فقط' : 'قطع فقط'
                      } — اطلب الآن`}
                </span>
              </div>
            )}

            {/* Modal Section Tabs */}
            <div
              role="tablist"
              aria-label="أقسام تفاصيل المنتج"
              className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#f1e7d8] dark:bg-[#2a1e1a] border border-[#e8dccd] dark:border-[#3a2b26]"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'details'}
                onClick={() => setActiveTab('details')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === 'details'
                    ? 'bg-[#fffdf9] dark:bg-[#352722] text-[#2a1a17] dark:text-[#f3e9df] shadow-xs'
                    : 'text-[#6f5a53] dark:text-[#b9a79b] hover:text-[#2a1a17] dark:hover:text-[#f3e9df]'
                }`}
              >
                التفاصيل والرائحة
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'ingredients'}
                onClick={() => setActiveTab('ingredients')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === 'ingredients'
                    ? 'bg-[#fffdf9] dark:bg-[#352722] text-[#2a1a17] dark:text-[#f3e9df] shadow-xs'
                    : 'text-[#6f5a53] dark:text-[#b9a79b] hover:text-[#2a1a17] dark:hover:text-[#f3e9df]'
                }`}
              >
                المكونات والتحذيرات
              </button>
            </div>

            {activeTab === 'details' ? (
              <div role="tabpanel" className="space-y-4">
                <p className="text-sm leading-relaxed text-[#5c4943] dark:text-[#c7b7ab]">
                  {product.description}
                </p>

                <div className="pt-1">
                  <span className="block text-xs font-semibold text-[#2a1a17] dark:text-[#f3e9df] mb-2.5">
                    اختر الرائحة المفضلة
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {product.scents.map((scent) => {
                      const active = selectedScent === scent;
                      return (
                        <button
                          key={scent}
                          type="button"
                          onClick={() => setSelectedScent(scent)}
                          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                            active
                              ? 'border-[#9b3046] bg-[#9b3046]/10 text-[#9b3046] dark:border-[#d4aa63] dark:bg-[#d4aa63]/15 dark:text-[#f3e9df]'
                              : 'border-[#e8dccd] dark:border-[#3a2b26] text-[#5c4943] dark:text-[#b9a79b] hover:border-[#b98a3e]'
                          }`}
                        >
                          {active && <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
                          <span>{scent}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div role="tabpanel" className="space-y-4">
                <div className="rounded-xl border border-[#e8dccd] dark:border-[#3a2b26] bg-[#faf6f0] dark:bg-[#1a1310] p-3.5 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#2a1a17] dark:text-[#f3e9df]">
                    <Leaf
                      className="w-4 h-4 text-[#1f8a4c] dark:text-[#6ee7b7] shrink-0"
                      aria-hidden="true"
                    />
                    <span>المكونات الطبيعية المستخدمة</span>
                  </div>
                  <ul className="space-y-1.5 text-xs leading-relaxed text-[#5c4943] dark:text-[#c7b7ab] pr-4 list-disc marker:text-[#9e732b] dark:marker:text-[#d4aa63]">
                    {composition.ingredients.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-[#b45309]/25 dark:border-[#f59e0b]/25 bg-[#fef3c7]/45 dark:bg-[#2d1d11]/60 p-3.5 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#9a3412] dark:text-[#fbbf24]">
                    <ShieldAlert className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>نصائح السلامة والتحذيرات</span>
                  </div>
                  <ul className="space-y-1.5 text-xs leading-relaxed text-[#6b3410] dark:text-[#ecd8c3] pr-4 list-disc marker:text-[#b45309] dark:marker:text-[#fbbf24]">
                    {composition.safetyTips.map((tip) => (
                      <li key={tip}>{tip}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[#e8dccd] dark:border-[#3a2b26] flex items-center gap-3">
            <div className="inline-flex items-center border border-[#e8dccd] dark:border-[#3a2b26] rounded-full bg-[#faf6f0] dark:bg-[#16100e]">
              <button
                type="button"
                disabled={isOutOfStock}
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="إنقاص الكمية"
                className="w-10 h-10 flex items-center justify-center text-[#2a1a17] dark:text-[#f3e9df] hover:text-[#9b3046] disabled:opacity-40 cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center text-sm font-bold tabular-nums text-[#2a1a17] dark:text-[#f3e9df]">
                {qty.toLocaleString('ar-EG')}
              </span>
              <button
                type="button"
                disabled={isOutOfStock || qty >= product.stock}
                onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                aria-label="زيادة الكمية"
                className="w-10 h-10 flex items-center justify-center text-[#2a1a17] dark:text-[#f3e9df] hover:text-[#9b3046] disabled:opacity-40 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              disabled={isOutOfStock}
              onClick={() => {
                onAddToCart(product, selectedScent || product.scents[0], qty);
                onClose();
              }}
              className="flex-1 min-h-[44px] px-5 py-2.5 rounded-full bg-[#9b3046] hover:bg-[#822639] disabled:opacity-45 text-white text-sm font-bold transition-colors cursor-pointer whitespace-nowrap"
            >
              {isOutOfStock
                ? 'نفذ — غير متوفر'
                : `أضف للسلة · ${formatEGP(pricing.finalPrice * qty)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

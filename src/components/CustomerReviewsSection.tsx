import { useState } from 'react';
import { MessageSquarePlus, X } from 'lucide-react';
import type { CustomerReview, Product } from '../data/catalog';
import { StarPicker, StarRating } from './StarRating';

interface CustomerReviewsSectionProps {
  products: Product[];
  reviews: CustomerReview[];
  selectedProductFilter: number | 'all';
  onChangeProductFilter: (filter: number | 'all') => void;
  onAddReview: (review: Omit<CustomerReview, 'id' | 'date'>) => void;
  overallAverage: number;
  totalReviewCount: number;
}

export function CustomerReviewsSection({
  products,
  reviews,
  selectedProductFilter,
  onChangeProductFilter,
  onAddReview,
  overallAverage,
  totalReviewCount,
}: CustomerReviewsSectionProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [productId, setProductId] = useState<number>(() => products[0]?.id ?? 1);
  const [scent, setScent] = useState<string>(() => products[0]?.scents[0] ?? '');
  const [rating, setRating] = useState<number>(5);
  const [author, setAuthor] = useState('');
  const [city, setCity] = useState('');
  const [comment, setComment] = useState('');
  const [submittedNotice, setSubmittedNotice] = useState(false);

  const visibleReviews =
    selectedProductFilter === 'all'
      ? reviews
      : reviews.filter((r) => r.productId === selectedProductFilter);

  const activeProductForForm = products.find((p) => p.id === productId) ?? products[0];

  const handleProductChange = (newId: number) => {
    setProductId(newId);
    const prod = products.find((p) => p.id === newId);
    if (prod) setScent(prod.scents[0] ?? '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (author.trim().length < 2 || comment.trim().length < 6) return;

    onAddReview({
      productId,
      author: author.trim(),
      city: city.trim() || 'مصر',
      scent,
      rating,
      comment: comment.trim(),
    });

    setAuthor('');
    setCity('');
    setComment('');
    setRating(5);
    setFormOpen(false);
    setSubmittedNotice(true);
    window.setTimeout(() => setSubmittedNotice(false), 3500);
  };

  return (
    <section
      id="reviews"
      className="border-b border-[#e8dccd] dark:border-[#3a2b26] bg-[#faf6f0] dark:bg-[#16100e]"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <p className="text-xs font-semibold text-[#9e732b] dark:text-[#d4aa63]">
              آراء وتجارب العملاء
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#2a1a17] dark:text-[#f3e9df]">
              تقييمات عملائنا
            </h2>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-sm text-[#5c4943] dark:text-[#c7b7ab]">
              <StarRating rating={overallAverage} size="md" />
              <span className="font-bold text-[#2a1a17] dark:text-[#f3e9df] tabular-nums">
                {overallAverage.toLocaleString('ar-EG', {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                })}{' '}
                من ٥
              </span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                بناءً على {totalReviewCount.toLocaleString('ar-EG')} تقييمًا موثقًا
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setFormOpen((prev) => !prev)}
            className="min-h-[42px] px-5 py-2.5 rounded-full border border-[#9b3046] dark:border-[#d4aa63] text-[#9b3046] dark:text-[#f3e9df] hover:bg-[#9b3046] hover:text-white dark:hover:bg-[#d4aa63] dark:hover:text-[#16100e] text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition-colors cursor-pointer self-start md:self-auto whitespace-nowrap shrink-0"
          >
            {formOpen ? (
              <>
                <X className="w-4 h-4" aria-hidden="true" />
                <span>إلغاء</span>
              </>
            ) : (
              <>
                <MessageSquarePlus className="w-4 h-4" aria-hidden="true" />
                <span>أضف تقييمك</span>
              </>
            )}
          </button>
        </div>

        {submittedNotice && (
          <div
            role="status"
            className="p-4 rounded-xl border border-[#2d7a4f]/30 bg-[#eef8f2] dark:bg-[#13261b] dark:border-[#399962]/40 text-xs sm:text-sm font-semibold text-[#154d2e] dark:text-[#b9f0cf]"
          >
            شكرًا لك! تمت إضافة تقييمك بنجاح وتحديث تقييم المنتج.
          </div>
        )}

        {formOpen && (
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl bg-[#fffdf9] dark:bg-[#211815] border border-[#e8dccd] dark:border-[#3a2b26] p-6 space-y-4"
          >
            <h3 className="font-display text-2xl font-bold text-[#2a1a17] dark:text-[#f3e9df]">
              شاركنا تجربتك مع M&amp;M Candle Co.
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="rev-product"
                  className="block text-xs font-semibold text-[#2a1a17] dark:text-[#f3e9df] mb-1.5"
                >
                  المنتج
                </label>
                <select
                  id="rev-product"
                  value={productId}
                  onChange={(e) => handleProductChange(Number(e.target.value))}
                  className="w-full px-3 py-2.5 min-h-[42px] rounded-xl border border-[#e8dccd] dark:border-[#3a2b26] bg-[#faf6f0] dark:bg-[#16100e] text-[#2a1a17] dark:text-[#f3e9df] text-sm focus:outline-none focus:border-[#b98a3e]"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="rev-scent"
                  className="block text-xs font-semibold text-[#2a1a17] dark:text-[#f3e9df] mb-1.5"
                >
                  الرائحة المختارة
                </label>
                <select
                  id="rev-scent"
                  value={scent}
                  onChange={(e) => setScent(e.target.value)}
                  className="w-full px-3 py-2.5 min-h-[42px] rounded-xl border border-[#e8dccd] dark:border-[#3a2b26] bg-[#faf6f0] dark:bg-[#16100e] text-[#2a1a17] dark:text-[#f3e9df] text-sm focus:outline-none focus:border-[#b98a3e]"
                >
                  {(activeProductForForm?.scents ?? []).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="block text-xs font-semibold text-[#2a1a17] dark:text-[#f3e9df] mb-1.5">
                  تقييمك بالنجوم
                </span>
                <div className="min-h-[42px] flex items-center">
                  <StarPicker value={rating} onChange={setRating} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="rev-author"
                  className="block text-xs font-semibold text-[#2a1a17] dark:text-[#f3e9df] mb-1.5"
                >
                  الاسم
                </label>
                <input
                  id="rev-author"
                  type="text"
                  required
                  placeholder="مثال: نورهان عادل"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full px-3.5 py-2.5 min-h-[42px] rounded-xl border border-[#e8dccd] dark:border-[#3a2b26] bg-[#faf6f0] dark:bg-[#16100e] text-[#2a1a17] dark:text-[#f3e9df] text-sm focus:outline-none focus:border-[#b98a3e]"
                />
              </div>

              <div>
                <label
                  htmlFor="rev-city"
                  className="block text-xs font-semibold text-[#2a1a17] dark:text-[#f3e9df] mb-1.5"
                >
                  المدينة أو الحي (اختياري)
                </label>
                <input
                  id="rev-city"
                  type="text"
                  placeholder="مثال: الزمالك، القاهرة"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 min-h-[42px] rounded-xl border border-[#e8dccd] dark:border-[#3a2b26] bg-[#faf6f0] dark:bg-[#16100e] text-[#2a1a17] dark:text-[#f3e9df] text-sm focus:outline-none focus:border-[#b98a3e]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="rev-comment"
                className="block text-xs font-semibold text-[#2a1a17] dark:text-[#f3e9df] mb-1.5"
              >
                رأيك في المنتج
              </label>
              <textarea
                id="rev-comment"
                required
                rows={3}
                placeholder="احكيلنا عن تجربتك مع الثبات، العطر، والتغليف..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#e8dccd] dark:border-[#3a2b26] bg-[#faf6f0] dark:bg-[#16100e] text-[#2a1a17] dark:text-[#f3e9df] text-sm focus:outline-none focus:border-[#b98a3e]"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={author.trim().length < 2 || comment.trim().length < 6}
                className="min-h-[44px] px-6 py-2.5 rounded-full bg-[#9b3046] hover:bg-[#822639] disabled:opacity-45 text-white text-sm font-bold transition-colors cursor-pointer whitespace-nowrap"
              >
                نشر التقييم
              </button>
            </div>
          </form>
        )}

        {/* Product Review Filter Bar */}
        <div
          role="tablist"
          aria-label="تصفية التقييمات حسب المنتج"
          className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[#f1e7d8] dark:bg-[#241a17] border border-[#e8dccd] dark:border-[#3a2b26] w-fit"
        >
          <button
            type="button"
            role="tab"
            aria-selected={selectedProductFilter === 'all'}
            onClick={() => onChangeProductFilter('all')}
            className={`px-3.5 py-2 min-h-[38px] rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              selectedProductFilter === 'all'
                ? 'bg-[#fffdf9] dark:bg-[#352722] text-[#2a1a17] dark:text-[#f3e9df] shadow-xs'
                : 'text-[#6f5a53] dark:text-[#b9a79b] hover:text-[#2a1a17] dark:hover:text-[#f3e9df]'
            }`}
          >
            كل المنتجات
          </button>
          {products.map((prod) => {
            const active = selectedProductFilter === prod.id;
            return (
              <button
                key={prod.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onChangeProductFilter(prod.id)}
                className={`px-3.5 py-2 min-h-[38px] rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-[#fffdf9] dark:bg-[#352722] text-[#2a1a17] dark:text-[#f3e9df] shadow-xs'
                    : 'text-[#6f5a53] dark:text-[#b9a79b] hover:text-[#2a1a17] dark:hover:text-[#f3e9df]'
                }`}
              >
                {prod.name}
              </button>
            );
          })}
        </div>

        {/* Reviews Grid */}
        {visibleReviews.length === 0 ? (
          <div className="rounded-2xl bg-[#fffdf9] dark:bg-[#211815] border border-[#e8dccd] dark:border-[#3a2b26] p-10 text-center text-sm text-[#6f5a53] dark:text-[#b9a79b]">
            لا توجد تقييمات لهذا المنتج حاليًا. كن أول من يشارك تجربته!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleReviews.map((review) => {
              const prod = products.find((p) => p.id === review.productId);
              return (
                <article
                  key={review.id}
                  className="rounded-2xl bg-[#fffdf9] dark:bg-[#211815] border border-[#e8dccd] dark:border-[#3a2b26] p-6 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <StarRating rating={review.rating} />
                      <span className="text-xs text-[#7a655f] dark:text-[#b9a79b] tabular-nums">
                        {review.date}
                      </span>
                    </div>

                    <p className="text-sm leading-relaxed text-[#3b2924] dark:text-[#e6dad0]">
                      «{review.comment}»
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#e8dccd] dark:border-[#3a2b26] space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#2a1a17] dark:text-[#f3e9df]">
                      <span>{review.author}</span>
                      <span aria-hidden="true" className="text-[#b9a79b]">
                        ·
                      </span>
                      <span className="font-medium text-[#7a655f] dark:text-[#b9a79b]">
                        {review.city}
                      </span>
                    </div>
                    <p className="text-xs text-[#9e732b] dark:text-[#d4aa63]">
                      {prod?.name} · {review.scent}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

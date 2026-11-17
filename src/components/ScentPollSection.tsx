import { useEffect, useState } from 'react';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { INITIAL_SCENT_POLL, type ScentPollOption } from '../data/catalog';

const STORAGE_KEY = 'mm_scent_poll_vote';

interface ScentPollSectionProps {
  externalOptions?: ScentPollOption[] | null;
}

export function ScentPollSection({ externalOptions }: ScentPollSectionProps = {}) {
  const [options, setOptions] = useState<ScentPollOption[]>(
    externalOptions && externalOptions.length > 0 ? externalOptions : INITIAL_SCENT_POLL
  );
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    try {
      return window.localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  });
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  useEffect(() => {
    if (externalOptions && externalOptions.length > 0) {
      setOptions(externalOptions);
    }
  }, [externalOptions]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/scent-poll')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { options?: ScentPollOption[] } | null) => {
        if (!cancelled && data?.options && Array.isArray(data.options)) {
          setOptions(data.options);
        }
      })
      .catch(() => {
        // fallback to initial options if offline
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const totalVotes = options.reduce((sum, opt) => sum + opt.votes, 0);

  const handleVote = async (optionId: string) => {
    if (submittingId || selectedId === optionId) return;
    const previousOptionId = selectedId;

    setSubmittingId(optionId);
    // Optimistic update
    setOptions((prev) =>
      prev.map((opt) => {
        if (opt.id === optionId) return { ...opt, votes: opt.votes + 1 };
        if (previousOptionId && opt.id === previousOptionId && opt.votes > 0) {
          return { ...opt, votes: opt.votes - 1 };
        }
        return opt;
      })
    );
    setSelectedId(optionId);
    try {
      window.localStorage.setItem(STORAGE_KEY, optionId);
    } catch {
      // ignore storage errors
    }

    try {
      const res = await fetch('/api/scent-poll/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId, previousOptionId }),
      });
      if (res.ok) {
        const data = (await res.json()) as { options?: ScentPollOption[] };
        if (data.options && Array.isArray(data.options)) {
          setOptions(data.options);
        }
      }
    } catch {
      // keep optimistic state if network unavailable
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <section
      id="scent-poll"
      className="border-t border-[#e8dccd] dark:border-[#3a2b26] bg-[#f4ece0]/55 dark:bg-[#1c1411]"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="rounded-2xl bg-[#fffdf9] dark:bg-[#211815] border border-[#e8dccd] dark:border-[#3a2b26] p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-[#9e732b] dark:text-[#d4aa63] inline-flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                <span>شارك في اختيار الإصدار القادم</span>
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#2a1a17] dark:text-[#f3e9df]">
                تصويت رائحة الشهر القادمة
              </h2>
              <p className="text-xs sm:text-sm text-[#6f5a53] dark:text-[#b9a79b]">
                اختر الرائحة التي تتمنى إطلاقها في مجموعتنا الشهرية الجديدة، وصوتك يحدد النتيجة.
              </p>
            </div>

            <div className="text-xs font-semibold text-[#7a655f] dark:text-[#b9a79b] tabular-nums shrink-0">
              إجمالي المشاركات: {totalVotes.toLocaleString('ar-EG')} صوت
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {options.map((opt) => {
              const isSelected = selectedId === opt.id;
              const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => void handleVote(opt.id)}
                  aria-pressed={isSelected}
                  className={`relative overflow-hidden text-right rounded-xl border p-4 transition-colors cursor-pointer ${
                    isSelected
                      ? 'border-[#9b3046] dark:border-[#d4aa63] bg-[#9b3046]/[0.04] dark:bg-[#d4aa63]/[0.07]'
                      : 'border-[#e8dccd] dark:border-[#3a2b26] bg-[#faf6f0]/60 dark:bg-[#16100e]/60 hover:border-[#b98a3e]'
                  }`}
                >
                  {selectedId && (
                    <span
                      aria-hidden="true"
                      style={{ width: `${pct}%` }}
                      className={`absolute inset-y-0 right-0 transition-all duration-500 ${
                        isSelected
                          ? 'bg-[#9b3046]/10 dark:bg-[#d4aa63]/15'
                          : 'bg-[#e8dccd]/40 dark:bg-[#3a2b26]/35'
                      }`}
                    />
                  )}

                  <div className="relative flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {isSelected && (
                          <CheckCircle2
                            className="w-4 h-4 text-[#9b3046] dark:text-[#d4aa63] shrink-0"
                            aria-hidden="true"
                          />
                        )}
                        <span className="text-sm font-bold text-[#2a1a17] dark:text-[#f3e9df]">
                          {opt.name}
                        </span>
                      </div>
                      <p className="text-xs text-[#6f5a53] dark:text-[#b9a79b]">{opt.notes}</p>
                    </div>

                    {selectedId ? (
                      <div className="text-left shrink-0 tabular-nums">
                        <span className="block text-sm font-bold text-[#9b3046] dark:text-[#d4aa63]">
                          {pct.toLocaleString('ar-EG')}٪
                        </span>
                        <span className="block text-[11px] text-[#7a655f] dark:text-[#b9a79b]">
                          {opt.votes.toLocaleString('ar-EG')} صوت
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs font-semibold text-[#9b3046] dark:text-[#d4aa63] shrink-0">
                        صوّت
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {selectedId && (
            <p className="text-xs text-[#26603f] dark:text-[#8fd3ac] font-medium">
              شكرًا لمشاركتك! تم تسجيل صوتك بنجاح (يمكنك النقر على خيار آخر لتعديل تصويتك).
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

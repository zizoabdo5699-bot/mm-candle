import { useEffect, useState } from 'react';
import { Plus, Save, Sparkles, Trash2 } from 'lucide-react';
import type { ScentPollOption } from '../../data/catalog';

interface AdminPollTabProps {
  options: ScentPollOption[];
  saving: boolean;
  onSavePoll: (nextOptions: ScentPollOption[]) => Promise<void>;
}

export function AdminPollTab({ options, saving, onSavePoll }: AdminPollTabProps) {
  const [draft, setDraft] = useState<ScentPollOption[]>(() =>
    JSON.parse(JSON.stringify(options)) as ScentPollOption[]
  );

  useEffect(() => {
    setDraft(JSON.parse(JSON.stringify(options)) as ScentPollOption[]);
  }, [options]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void onSavePoll(draft);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-2xl border border-[#e8dccd] dark:border-[#3a2b26] bg-[#fffdf9] dark:bg-[#211815] p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e8dccd] dark:border-[#3a2b26] pb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#9b3046] dark:text-[#d4aa63]" aria-hidden="true" />
              <h3 className="font-display text-xl font-bold text-[#2a1a17] dark:text-[#f3e9df]">
                إدارة تصويت «رائحة الشهر القادمة»
              </h3>
            </div>
            <p className="text-xs text-[#6f5a53] dark:text-[#b9a79b]">
              أضف روائح جديدة للتصويت، عدّل أوصافها، أو أعد ضبط الأصوات.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setDraft((prev) => [
                ...prev,
                {
                  id: `scent-${Date.now()}`,
                  name: 'عطر جديد للتصويت',
                  notes: 'وصف النوتات العطرية',
                  votes: 0,
                },
              ])
            }
            className="px-3.5 py-2 rounded-lg border border-[#e8dccd] dark:border-[#3a2b26] hover:border-[#b98a3e] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>إضافة خيار للتصويت</span>
          </button>
        </div>

        <div className="space-y-3">
          {draft.map((opt, idx) => (
            <div
              key={opt.id}
              className="p-3.5 rounded-xl border border-[#e8dccd] dark:border-[#3a2b26] bg-[#faf6f0] dark:bg-[#16100e] grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
            >
              <div className="sm:col-span-4">
                <label className="block text-[11px] text-[#7a655f] dark:text-[#b9a79b] mb-1">
                  اسم الرائحة
                </label>
                <input
                  type="text"
                  required
                  value={opt.name}
                  onChange={(e) =>
                    setDraft((prev) => {
                      const next = [...prev];
                      next[idx] = { ...next[idx], name: e.target.value };
                      return next;
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#e8dccd] dark:border-[#3a2b26] bg-[#fffdf9] dark:bg-[#211815] text-sm font-semibold"
                />
              </div>

              <div className="sm:col-span-5">
                <label className="block text-[11px] text-[#7a655f] dark:text-[#b9a79b] mb-1">
                  وصف النوتات
                </label>
                <input
                  type="text"
                  value={opt.notes}
                  onChange={(e) =>
                    setDraft((prev) => {
                      const next = [...prev];
                      next[idx] = { ...next[idx], notes: e.target.value };
                      return next;
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#e8dccd] dark:border-[#3a2b26] bg-[#fffdf9] dark:bg-[#211815] text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] text-[#7a655f] dark:text-[#b9a79b] mb-1">
                  عدد الأصوات
                </label>
                <input
                  type="number"
                  min={0}
                  value={opt.votes}
                  onChange={(e) =>
                    setDraft((prev) => {
                      const next = [...prev];
                      next[idx] = {
                        ...next[idx],
                        votes: Math.max(0, Number(e.target.value) || 0),
                      };
                      return next;
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#e8dccd] dark:border-[#3a2b26] bg-[#fffdf9] dark:bg-[#211815] text-sm font-bold tabular-nums"
                />
              </div>

              <div className="sm:col-span-1 flex justify-end">
                <button
                  type="button"
                  disabled={draft.length <= 2}
                  onClick={() => setDraft((prev) => prev.filter((_, i) => i !== idx))}
                  aria-label={`حذف ${opt.name}`}
                  className="w-9 h-9 rounded-lg border border-[#e8dccd] dark:border-[#3a2b26] text-[#7a655f] hover:text-[#9b3046] disabled:opacity-30 flex items-center justify-center cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
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
            <span>{saving ? 'جاري الحفظ...' : 'حفظ خيارات التصويت'}</span>
          </button>
        </div>
      </div>
    </form>
  );
}

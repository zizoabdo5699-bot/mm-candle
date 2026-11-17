import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, ShoppingBag, Package, AlertTriangle, BarChart3 } from 'lucide-react';
import { formatEGP, type Product, type TrackableOrder } from '../../data/catalog';

interface AdminAnalyticsTabProps {
  orders: TrackableOrder[];
  products: Product[];
  lowStockThreshold: number;
  onGoToOrders: () => void;
  onGoToNotifications: () => void;
}

function normalizeArabicDigits(value: string): string {
  return value
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06f0-\u06f9]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}

function toLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function extractOrderDateKey(order: TrackableOrder): string | null {
  if (order.createdAtISO) {
    const dt = new Date(order.createdAtISO);
    if (!Number.isNaN(dt.getTime())) {
      return toLocalDateKey(dt);
    }
  }
  const normalized = normalizeArabicDigits(order.createdAt || '');
  // Match YYYY/MM/DD or YYYY-MM-DD
  const ymd = /(\d{4})[/-](\d{1,2})[/-](\d{1,2})/.exec(normalized);
  if (ymd) {
    const y = ymd[1];
    const m = ymd[2].padStart(2, '0');
    const d = ymd[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  // Match DD/MM/YYYY
  const dmy = /(\d{1,2})[/-](\d{1,2})[/-](\d{4})/.exec(normalized);
  if (dmy) {
    const y = dmy[3];
    const m = dmy[2].padStart(2, '0');
    const d = dmy[1].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return null;
}

interface DayChartPoint {
  dateKey: string;
  label: string;
  fullDate: string;
  sales: number;
  orders: number;
}

export function AdminAnalyticsTab({
  orders,
  products,
  lowStockThreshold,
  onGoToOrders,
  onGoToNotifications,
}: AdminAnalyticsTabProps) {
  const [chartType, setChartType] = useState<'bar' | 'area'>('bar');

  const analytics = useMemo(() => {
    const validOrders = orders.filter((o) => o.status !== 'مرفوض');
    const totalSales = validOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const totalOrders = validOrders.length;
    const rejectedCount = orders.filter((o) => o.status === 'مرفوض').length;
    const pendingReviewCount = orders.filter((o) => o.status === 'جديد').length;
    const avgOrderValue = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;
    const totalUnitsSold = validOrders.reduce((sum, o) => sum + (Number(o.itemCount) || 0), 0);

    // Last 7 days array ending today
    const now = new Date();
    const dayBuckets: DayChartPoint[] = [];
    const bucketMap = new Map<string, DayChartPoint>();

    for (let i = 6; i >= 0; i -= 1) {
      const dt = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const key = toLocalDateKey(dt);
      const point: DayChartPoint = {
        dateKey: key,
        label: dt.toLocaleDateString('ar-EG', { weekday: 'short', day: 'numeric' }),
        fullDate: dt.toLocaleDateString('ar-EG', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        sales: 0,
        orders: 0,
      };
      dayBuckets.push(point);
      bucketMap.set(key, point);
    }

    let last7DaysSales = 0;
    let last7DaysOrders = 0;

    for (const order of validOrders) {
      const key = extractOrderDateKey(order);
      if (key && bucketMap.has(key)) {
        const bucket = bucketMap.get(key)!;
        const orderTotal = Number(order.total) || 0;
        bucket.sales += orderTotal;
        bucket.orders += 1;
        last7DaysSales += orderTotal;
        last7DaysOrders += 1;
      }
    }

    // Top-selling items across valid orders
    const productStats = new Map<string, { name: string; qty: number; revenue: number }>();
    for (const order of validOrders) {
      for (const item of order.items || []) {
        const existing = productStats.get(item.name) || {
          name: item.name,
          qty: 0,
          revenue: 0,
        };
        existing.qty += Number(item.quantity) || 1;
        existing.revenue += (Number(item.price) || 0) * (Number(item.quantity) || 1);
        productStats.set(item.name, existing);
      }
    }

    const topItems = Array.from(productStats.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const lowStockCount = products.filter((p) => (p.stock ?? 0) <= lowStockThreshold).length;

    return {
      totalSales,
      totalOrders,
      rejectedCount,
      pendingReviewCount,
      avgOrderValue,
      totalUnitsSold,
      dayBuckets,
      last7DaysSales,
      last7DaysOrders,
      topItems,
      lowStockCount,
    };
  }, [orders, products, lowStockThreshold]);

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid (Single elevation, crisp border, tabular-nums) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-[#e8dccd] dark:border-[#3a2b26] bg-[#fffdf9] dark:bg-[#211815] p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#7a655f] dark:text-[#b9a79b]">
            <span>إجمالي المبيعات</span>
            <TrendingUp className="w-4 h-4 text-[#9e732b] dark:text-[#d4aa63]" aria-hidden="true" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-[#2a1a17] dark:text-[#f3e9df] tabular-nums">
            {formatEGP(analytics.totalSales)}
          </p>
          <p className="text-xs text-[#6f5a53] dark:text-[#b9a79b] tabular-nums">
            آخر ٧ أيام: {formatEGP(analytics.last7DaysSales)}
          </p>
        </div>

        <div className="rounded-2xl border border-[#e8dccd] dark:border-[#3a2b26] bg-[#fffdf9] dark:bg-[#211815] p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#7a655f] dark:text-[#b9a79b]">
            <span>عدد الطلبات الفعّالة</span>
            <Package className="w-4 h-4 text-[#9b3046] dark:text-[#d4aa63]" aria-hidden="true" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-[#2a1a17] dark:text-[#f3e9df] tabular-nums">
            {analytics.totalOrders.toLocaleString('ar-EG')}
          </p>
          <div className="flex items-center justify-between text-xs text-[#6f5a53] dark:text-[#b9a79b] tabular-nums">
            <span>آخر ٧ أيام: {analytics.last7DaysOrders.toLocaleString('ar-EG')}</span>
            {analytics.pendingReviewCount > 0 && (
              <button
                type="button"
                onClick={onGoToOrders}
                className="font-bold text-[#9b3046] dark:text-[#d4aa63] hover:underline cursor-pointer"
              >
                {analytics.pendingReviewCount.toLocaleString('ar-EG')} جديد
              </button>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-[#e8dccd] dark:border-[#3a2b26] bg-[#fffdf9] dark:bg-[#211815] p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#7a655f] dark:text-[#b9a79b]">
            <span>متوسط قيمة الطلب</span>
            <ShoppingBag className="w-4 h-4 text-[#9e732b] dark:text-[#d4aa63]" aria-hidden="true" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-[#2a1a17] dark:text-[#f3e9df] tabular-nums">
            {formatEGP(analytics.avgOrderValue)}
          </p>
          <p className="text-xs text-[#6f5a53] dark:text-[#b9a79b] tabular-nums">
            إجمالي القطع المطلوبة: {analytics.totalUnitsSold.toLocaleString('ar-EG')}
          </p>
        </div>

        <div className="rounded-2xl border border-[#e8dccd] dark:border-[#3a2b26] bg-[#fffdf9] dark:bg-[#211815] p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#7a655f] dark:text-[#b9a79b]">
            <span>حالة المخزون</span>
            <AlertTriangle
              className={`w-4 h-4 ${
                analytics.lowStockCount > 0
                  ? 'text-[#b45309] dark:text-[#fbbf24]'
                  : 'text-[#1f8a4c] dark:text-[#57c986]'
              }`}
              aria-hidden="true"
            />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-[#2a1a17] dark:text-[#f3e9df] tabular-nums">
            {analytics.lowStockCount.toLocaleString('ar-EG')}
          </p>
          <div className="flex items-center justify-between text-xs text-[#6f5a53] dark:text-[#b9a79b]">
            <span>منتجات بمخزون منخفض/نافذ</span>
            {analytics.lowStockCount > 0 && (
              <button
                type="button"
                onClick={onGoToNotifications}
                className="font-bold text-[#9b3046] dark:text-[#d4aa63] hover:underline cursor-pointer"
              >
                تعبئة الآن
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Recharts 7-Day Performance Chart */}
      <div className="rounded-2xl border border-[#e8dccd] dark:border-[#3a2b26] bg-[#fffdf9] dark:bg-[#211815] p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#9b3046] dark:text-[#d4aa63]" aria-hidden="true" />
              <h3 className="font-display text-xl sm:text-2xl font-bold text-[#2a1a17] dark:text-[#f3e9df]">
                أداء المبيعات خلال آخر ٧ أيام
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-[#6f5a53] dark:text-[#b9a79b]">
              عرض يومي لإجمالي قيمة الطلبات الفعّالة (باستثناء الطلبات المرفوضة).
            </p>
          </div>

          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#f1e7d8] dark:bg-[#241a17] border border-[#e8dccd] dark:border-[#3a2b26] self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setChartType('bar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                chartType === 'bar'
                  ? 'bg-[#fffdf9] dark:bg-[#352722] text-[#2a1a17] dark:text-[#f3e9df] shadow-xs'
                  : 'text-[#6f5a53] dark:text-[#b9a79b]'
              }`}
            >
              أعمدة المبيعات
            </button>
            <button
              type="button"
              onClick={() => setChartType('area')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                chartType === 'area'
                  ? 'bg-[#fffdf9] dark:bg-[#352722] text-[#2a1a17] dark:text-[#f3e9df] shadow-xs'
                  : 'text-[#6f5a53] dark:text-[#b9a79b]'
              }`}
            >
              منحنى الأداء
            </button>
          </div>
        </div>

        <div className="h-[320px] w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart
                data={analytics.dayBuckets}
                margin={{ top: 12, right: 16, left: 8, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e8dccd" opacity={0.45} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#7a655f', fontSize: 12 }}
                  axisLine={{ stroke: '#d9c3a0' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#7a655f', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val: number) => `${val}`}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(155, 48, 70, 0.08)' }}
                  content={({ active, payload }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    const point = payload[0].payload as DayChartPoint;
                    return (
                      <div
                        dir="rtl"
                        className="rounded-xl border border-[#e8dccd] bg-[#fffdf9] px-3.5 py-2.5 shadow-lg text-xs space-y-1 text-[#2a1a17]"
                      >
                        <p className="font-bold text-[#9b3046]">{point.fullDate}</p>
                        <p className="tabular-nums">
                          المبيعات: <strong>{formatEGP(point.sales)}</strong>
                        </p>
                        <p className="tabular-nums">
                          عدد الطلبات: <strong>{point.orders.toLocaleString('ar-EG')}</strong>
                        </p>
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="sales"
                  name="المبيعات"
                  fill="#9b3046"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={44}
                />
              </BarChart>
            ) : (
              <AreaChart
                data={analytics.dayBuckets}
                margin={{ top: 12, right: 16, left: 8, bottom: 8 }}
              >
                <defs>
                  <linearGradient id="salesFillGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9b3046" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#9b3046" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8dccd" opacity={0.45} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#7a655f', fontSize: 12 }}
                  axisLine={{ stroke: '#d9c3a0' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#7a655f', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    const point = payload[0].payload as DayChartPoint;
                    return (
                      <div
                        dir="rtl"
                        className="rounded-xl border border-[#e8dccd] bg-[#fffdf9] px-3.5 py-2.5 shadow-lg text-xs space-y-1 text-[#2a1a17]"
                      >
                        <p className="font-bold text-[#9b3046]">{point.fullDate}</p>
                        <p className="tabular-nums">
                          المبيعات: <strong>{formatEGP(point.sales)}</strong>
                        </p>
                        <p className="tabular-nums">
                          عدد الطلبات: <strong>{point.orders.toLocaleString('ar-EG')}</strong>
                        </p>
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#9b3046"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#salesFillGradient)"
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Daily Breakdown Row */}
        <div className="grid grid-cols-2 sm:grid-cols-7 gap-2 pt-2 border-t border-[#e8dccd] dark:border-[#3a2b26]">
          {analytics.dayBuckets.map((day) => (
            <div
              key={day.dateKey}
              className="rounded-xl border border-[#e8dccd] dark:border-[#3a2b26] bg-[#faf6f0] dark:bg-[#16100e] px-2.5 py-2 text-center space-y-0.5"
            >
              <span className="block text-[11px] text-[#7a655f] dark:text-[#b9a79b] truncate">
                {day.label}
              </span>
              <span className="block text-xs font-bold text-[#9e732b] dark:text-[#d4aa63] tabular-nums">
                {formatEGP(day.sales)}
              </span>
              <span className="block text-[10px] text-[#6f5a53] dark:text-[#b9a79b] tabular-nums">
                {day.orders.toLocaleString('ar-EG')} طلب
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Selling Products & Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 rounded-2xl border border-[#e8dccd] dark:border-[#3a2b26] bg-[#fffdf9] dark:bg-[#211815] p-5 space-y-4">
          <h4 className="font-display text-lg font-bold text-[#2a1a17] dark:text-[#f3e9df]">
            المنتجات الأكثر مبيعًا
          </h4>
          {analytics.topItems.length === 0 ? (
            <p className="text-xs text-[#7a655f] dark:text-[#b9a79b] py-4">
              لا توجد بيانات مبيعات مسجلة حتى الآن.
            </p>
          ) : (
            <div className="divide-y divide-[#e8dccd] dark:divide-[#3a2b26]">
              {analytics.topItems.map((item) => (
                <div
                  key={item.name}
                  className="py-3 flex items-center justify-between gap-3 text-xs sm:text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-[#2a1a17] dark:text-[#f3e9df] truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-[#7a655f] dark:text-[#b9a79b] tabular-nums">
                      الكمية المباعة: {item.qty.toLocaleString('ar-EG')} قطعة
                    </p>
                  </div>
                  <span className="font-bold text-[#9e732b] dark:text-[#d4aa63] tabular-nums shrink-0">
                    {formatEGP(item.revenue)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 rounded-2xl border border-[#e8dccd] dark:border-[#3a2b26] bg-[#fffdf9] dark:bg-[#211815] p-5 space-y-4">
          <h4 className="font-display text-lg font-bold text-[#2a1a17] dark:text-[#f3e9df]">
            توزيع حالات الطلبات
          </h4>
          <div className="space-y-2.5 text-xs sm:text-sm">
            {(['جديد', 'قيد التجهيز', 'مقبول', 'جاري الشحن', 'تم التوصيل', 'مرفوض'] as const).map(
              (st) => {
                const count = orders.filter((o) => o.status === st).length;
                return (
                  <div
                    key={st}
                    className="flex items-center justify-between py-1.5 border-b last:border-b-0 border-[#f0e5d7] dark:border-[#2e211d]"
                  >
                    <span className="font-medium text-[#5c4943] dark:text-[#c7b7ab]">{st}</span>
                    <span className="font-bold text-[#2a1a17] dark:text-[#f3e9df] tabular-nums">
                      {count.toLocaleString('ar-EG')}
                    </span>
                  </div>
                );
              }
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

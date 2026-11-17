import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import express, { type NextFunction, type Request, type Response } from 'express';
import nodemailer from 'nodemailer';
import { STORE_CONFIG, type StoreRuntimeConfig } from './src/config.ts';

dotenv.config();

type OrderStatus =
  | 'جديد'
  | 'مقبول'
  | 'مرفوض'
  | 'قيد التجهيز'
  | 'جاري الشحن'
  | 'تم التوصيل';
type ProductCategory = 'candles' | 'diffusers' | 'gifts';
type ProductSlug = 'classic-candle' | 'reed-diffuser' | 'gift-box' | 'decor-candle';

interface StoreProduct {
  id: number;
  slug: ProductSlug;
  name: string;
  subtitle: string;
  description: string;
  price: number;
  category: ProductCategory;
  categoryLabel: string;
  spec: string;
  longevity: string;
  rating: number;
  reviewCount: number;
  image?: string;
  tag?: string;
  stock: number;
  scents: string[];
}

interface OrderLineItem {
  productId: number;
  name: string;
  scent: string;
  price: number;
  quantity: number;
  isCustom?: boolean;
  customDetails?: Record<string, unknown>;
}

interface StoreOrder {
  orderNumber: string;
  customerName: string;
  phone: string;
  customerEmail?: string;
  sendViaEmail?: boolean;
  emailSent?: boolean;
  governorate: string;
  address: string;
  notes: string;
  paymentMethod: 'cod' | 'wallet';
  items: OrderLineItem[];
  itemCount: number;
  subtotal: number;
  shippingFee: number;
  giftWrap?: boolean;
  giftWrapFee?: number;
  giftMessage?: string;
  total: number;
  status: OrderStatus;
  stockDeducted?: boolean;
  createdAt: string;
  createdAtISO?: string;
  updatedAt: string;
}

interface AdminNotification {
  id: string;
  type: 'stock_deducted' | 'low_stock' | 'out_of_stock';
  orderNumber: string;
  productId: number;
  productName: string;
  quantityOrdered: number;
  remainingStock: number;
  level: 'normal' | 'low' | 'out';
  read: boolean;
  createdAt: string;
}

interface ScentPollOption {
  id: string;
  name: string;
  notes: string;
  votes: number;
}

interface SeasonalOffer {
  active: boolean;
  title: string;
  subtitle: string;
  discountPercent: number;
  productIds: number[];
  endsAt: string;
}

interface StoreData {
  products: StoreProduct[];
  orders: StoreOrder[];
  scentPoll: ScentPollOption[];
  seasonalOffer: SeasonalOffer;
  notifications: AdminNotification[];
  storeConfig: StoreRuntimeConfig;
}

const DEFAULT_LOW_STOCK_THRESHOLD = STORE_CONFIG.lowStockThreshold;
const VALID_STATUSES: OrderStatus[] = [
  'جديد',
  'مقبول',
  'مرفوض',
  'قيد التجهيز',
  'جاري الشحن',
  'تم التوصيل',
];

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  candles: 'الشموع',
  diffusers: 'المعطرات',
  gifts: 'الهدايا',
};

const INITIAL_PRODUCTS: StoreProduct[] = [
  {
    id: 1,
    slug: 'classic-candle',
    name: 'شمعة عطرية كلاسيك',
    subtitle: 'شمعة بعطر هادئ، مصبوبة يدويًا',
    description:
      'شمعة صويا طبيعية ١٠٠٪ بفتيل قطني نقي، مصبوبة يدويًا على دفعات صغيرة لتمنحك احتراقًا متوازنًا وعطرًا ثابتًا يملأ الغرفة بدفء وهدوء.',
    price: 180,
    category: 'candles',
    categoryLabel: 'الشموع',
    spec: '٢٠٠ جم',
    longevity: 'حتى ٤٠ ساعة احتراق',
    rating: 4.9,
    reviewCount: 24,
    tag: 'الأكثر طلبًا',
    stock: 3,
    scents: ['فانيليا مدغشقر الدافئة', 'عنبر وخشب الصندل', 'زهر اللافندر الهادئ'],
  },
  {
    id: 2,
    slug: 'reed-diffuser',
    name: 'معطر جو بالعيدان',
    subtitle: 'عيدان سوداء وغطاء ذهبي بعطر فاخر',
    description:
      'زجاجة فاخرة بغطاء ذهبي مصقول وعيدان فايبر سوداء عالية الامتصاص، تطلق عبيرًا مستمرًا يجدد أجواء المنزل والمكتب طوال اليوم بدون حرارة.',
    price: 250,
    category: 'diffusers',
    categoryLabel: 'المعطرات',
    spec: '١٥٠ مل',
    longevity: 'ثبات حتى ٨ أسابيع',
    rating: 5.0,
    reviewCount: 19,
    image: '/images/reed-diffuser.jpg',
    tag: 'إصدار مميز',
    stock: 12,
    scents: ['رمان وعنبر أحمر', 'ورد طائفي وعود', 'مسك وزهر البرتقال'],
  },
  {
    id: 3,
    slug: 'gift-box',
    name: 'بوكس هدية',
    subtitle: 'شمعة ومعطر في تغليف هدية',
    description:
      'مجموعة هدايا متكاملة تضم شمعة عطرية كلاسيك ومعطر جو بالعيدان داخل علبة فاخرة مزينة بشريط ساتان نبيذي وبطاقة إهداء مخصصة.',
    price: 420,
    category: 'gifts',
    categoryLabel: 'الهدايا',
    spec: 'شمعة ٢٠٠ جم + معطر ١٥٠ مل',
    longevity: 'تغليف هدايا فاخر',
    rating: 4.9,
    reviewCount: 16,
    tag: 'تشكيلة متكاملة',
    stock: 4,
    scents: ['فانيليا وعنبر', 'ورد طائفي ومسك', 'خشب الصندل والياسمين'],
  },
  {
    id: 4,
    slug: 'decor-candle',
    name: 'شمعة ديكور',
    subtitle: 'قطعة تزيّن ركنك وتضيء المكان',
    description:
      'شمعة نحتية بتفاصيل معمارية دافئة مصممة لتكون قطعة ديكور أنيقة على الطاولات والأرفف، مصبوبة بشمع النحل والصويا الطبيعي.',
    price: 220,
    category: 'candles',
    categoryLabel: 'الشموع',
    spec: '٢٦٠ جم',
    longevity: 'شمع طبيعي نقي',
    rating: 4.8,
    reviewCount: 12,
    stock: 9,
    scents: ['بدون عطر (شمع طبيعي)', 'فانيليا خفيفة', 'خشب الأرز الأبيض'],
  },
];

const INITIAL_ORDERS: StoreOrder[] = [
  {
    orderNumber: 'MM-1042',
    customerName: 'سارة محمود',
    phone: '01012345678',
    governorate: 'القاهرة',
    address: 'المعادي، شارع ٩',
    notes: '',
    paymentMethod: 'cod',
    items: [
      {
        productId: 1,
        name: 'شمعة عطرية كلاسيك',
        scent: 'فانيليا مدغشقر الدافئة',
        price: 180,
        quantity: 2,
      },
    ],
    itemCount: 2,
    subtotal: 360,
    shippingFee: 50,
    total: 410,
    status: 'قيد التجهيز',
    createdAt: '٢٠٢٦/١١/١٦ - ١٠:١٥ ص',
    updatedAt: '٢٠٢٦/١١/١٦ - ١٠:١٥ ص',
  },
  {
    orderNumber: 'MM-1038',
    customerName: 'كريم عبد الرحمن',
    phone: '01198765432',
    governorate: 'الجيزة',
    address: 'الشيخ زايد، الحي الرابع',
    notes: 'تغليف هدية',
    paymentMethod: 'cod',
    items: [
      {
        productId: 3,
        name: 'بوكس هدية',
        scent: 'ورد طائفي ومسك',
        price: 420,
        quantity: 1,
      },
    ],
    itemCount: 1,
    subtotal: 420,
    shippingFee: 50,
    total: 470,
    status: 'جاري الشحن',
    createdAt: '٢٠٢٦/١١/١٥ - ٠٣:٤٠ م',
    updatedAt: '٢٠٢٦/١١/١٦ - ٠٩:٠٠ ص',
  },
  {
    orderNumber: 'MM-1025',
    customerName: 'مريم طارق',
    phone: '01234567890',
    governorate: 'الإسكندرية',
    address: 'سموحة، شارع فوزي معاذ',
    notes: '',
    paymentMethod: 'wallet',
    items: [
      {
        productId: 2,
        name: 'معطر جو بالعيدان',
        scent: 'رمان وعنبر أحمر',
        price: 250,
        quantity: 3,
      },
    ],
    itemCount: 3,
    subtotal: 750,
    shippingFee: 0,
    total: 750,
    status: 'تم التوصيل',
    createdAt: '٢٠٢٦/١١/١٢ - ٠١:٢٠ م',
    updatedAt: '٢٠٢٦/١١/١٤ - ٠٤:١٠ م',
  },
];

const INITIAL_SCENT_POLL: ScentPollOption[] = [
  {
    id: 'caramel-espresso',
    name: 'كراميل وإسبريسو محمّص',
    notes: 'دفء القهوة المحمصة مع الكراميل المملح',
    votes: 27,
  },
  {
    id: 'damask-rose-amber',
    name: 'ورد دمشقي وعنبر دافئ',
    notes: 'عبير شرقي كلاسيكي بلمسة عصرية ناعمة',
    votes: 22,
  },
  {
    id: 'lavender-chamomile',
    name: 'لافندر وبابونج ليلي',
    notes: 'نفحات عشبية هادئة للاسترخاء قبل النوم',
    votes: 18,
  },
  {
    id: 'white-fig-cedar',
    name: 'تين أبيض وخشب الأرز',
    notes: 'توازن فاخر بين الفاكهة الناعمة والأخشاب',
    votes: 14,
  },
];

const INITIAL_SEASONAL_OFFER: SeasonalOffer = {
  active: true,
  title: 'عروض الدفء الشتوية',
  subtitle: 'خصم خاص لفترة محدودة على مختارات الشموع وبوكسات الهدايا',
  discountPercent: 15,
  productIds: [1, 3],
  endsAt: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
};

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

function cloneDefaultStoreConfig(): StoreRuntimeConfig {
  return JSON.parse(JSON.stringify(STORE_CONFIG)) as StoreRuntimeConfig;
}

function mergeStoreConfig(raw?: Partial<StoreRuntimeConfig> | null): StoreRuntimeConfig {
  const defaults = cloneDefaultStoreConfig();
  if (!raw || typeof raw !== 'object') return defaults;

  return {
    whatsappNumber:
      typeof raw.whatsappNumber === 'string' && raw.whatsappNumber.trim()
        ? raw.whatsappNumber.replace(/\D/g, '') || defaults.whatsappNumber
        : defaults.whatsappNumber,
    lowStockThreshold:
      typeof raw.lowStockThreshold === 'number' && Number.isFinite(raw.lowStockThreshold) && raw.lowStockThreshold >= 0
        ? Math.round(raw.lowStockThreshold)
        : defaults.lowStockThreshold,
    freeShippingThreshold:
      typeof raw.freeShippingThreshold === 'number' && Number.isFinite(raw.freeShippingThreshold) && raw.freeShippingThreshold >= 0
        ? Math.round(raw.freeShippingThreshold)
        : defaults.freeShippingThreshold,
    giftWrapFee:
      typeof raw.giftWrapFee === 'number' && Number.isFinite(raw.giftWrapFee) && raw.giftWrapFee >= 0
        ? Math.round(raw.giftWrapFee)
        : defaults.giftWrapFee,
    governorates:
      Array.isArray(raw.governorates) && raw.governorates.length > 0
        ? raw.governorates.map((g) => ({
            name: String(g.name || '').trim() || 'منطقة غير محددة',
            zone: String(g.zone || '').trim() || 'مصر',
            fee: Math.max(0, Math.round(Number(g.fee) || 0)),
            eta: String(g.eta || '').trim() || '٢ - ٣ أيام عمل',
          }))
        : defaults.governorates,
    customPerfume: {
      sizes:
        Array.isArray(raw.customPerfume?.sizes) && raw.customPerfume.sizes.length > 0
          ? raw.customPerfume.sizes.map((s, idx) => ({
              id: String(s.id || `size-${idx}`).trim(),
              ml: Math.max(5, Math.round(Number(s.ml) || 50)),
              label: String(s.label || `${s.ml || 50} مل`).trim(),
              price: Math.max(1, Math.round(Number(s.price) || 250)),
              description: String(s.description || '').trim(),
            }))
          : defaults.customPerfume.sizes,
      suggestedScents:
        Array.isArray(raw.customPerfume?.suggestedScents) &&
        raw.customPerfume.suggestedScents.length > 0
          ? raw.customPerfume.suggestedScents.map((s) => String(s).trim()).filter(Boolean)
          : defaults.customPerfume.suggestedScents,
    },
    customCandle: {
      sizes:
        Array.isArray(raw.customCandle?.sizes) && raw.customCandle.sizes.length > 0
          ? raw.customCandle.sizes.map((s, idx) => ({
              id: String(s.id || `csize-${idx}`).trim(),
              label: String(s.label || 'حجم').trim(),
              weight: String(s.weight || '٢٠٠ جم').trim(),
              burnTime: String(s.burnTime || 'حتى ٤٠ ساعة').trim(),
              price: Math.max(1, Math.round(Number(s.price) || 180)),
            }))
          : defaults.customCandle.sizes,
      colors:
        Array.isArray(raw.customCandle?.colors) && raw.customCandle.colors.length > 0
          ? raw.customCandle.colors.map((c, idx) => ({
              id: String(c.id || `color-${idx}`).trim(),
              label: String(c.label || 'لون').trim(),
              hex: /^#[0-9a-fA-F]{3,8}$/.test(String(c.hex || '').trim())
                ? String(c.hex).trim()
                : '#f7efe3',
            }))
          : defaults.customCandle.colors,
      scents:
        Array.isArray(raw.customCandle?.scents) && raw.customCandle.scents.length > 0
          ? raw.customCandle.scents.map((s) => String(s).trim()).filter(Boolean)
          : defaults.customCandle.scents,
      jarTypes:
        Array.isArray(raw.customCandle?.jarTypes) && raw.customCandle.jarTypes.length > 0
          ? raw.customCandle.jarTypes.map((j, idx) => ({
              id: String(j.id || `jar-${idx}`).trim(),
              label: String(j.label || 'سادة').trim(),
              extraPrice: Math.max(0, Math.round(Number(j.extraPrice) || 0)),
              description: String(j.description || '').trim(),
            }))
          : defaults.customCandle.jarTypes,
    },
  };
}

// ---------------------------------------------------------------------------
// طبقة التخزين: Supabase (دائم) أو ملف محلي (للتجربة على الجهاز فقط)
// ---------------------------------------------------------------------------
const SUPABASE_URL = (process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
const SUPABASE_KEY = (process.env.SUPABASE_SERVICE_KEY || '').trim();
const USE_SUPABASE = Boolean(SUPABASE_URL && SUPABASE_KEY);
const SUPABASE_BUCKET = 'products';

function sbHeaders(extra: Record<string, string> = {}): Record<string, string> {
  // المفاتيح الجديدة (sb_secret_...) تتبعت في apikey بس، والقديمة (JWT) كمان في Authorization
  const auth: Record<string, string> = SUPABASE_KEY.startsWith('sb_')
    ? {}
    : { Authorization: `Bearer ${SUPABASE_KEY}` };
  return { apikey: SUPABASE_KEY, ...auth, ...extra };
}

function defaultStore(): StoreData {
  return {
    products: INITIAL_PRODUCTS,
    orders: INITIAL_ORDERS,
    scentPoll: INITIAL_SCENT_POLL,
    seasonalOffer: INITIAL_SEASONAL_OFFER,
    notifications: [],
    storeConfig: cloneDefaultStoreConfig(),
  };
}

function normalizeStore(parsed: Partial<StoreData>): StoreData {
  const products = (Array.isArray(parsed.products) ? parsed.products : INITIAL_PRODUCTS).map(
    (prod) => {
      if (typeof prod.stock === 'number' && Number.isFinite(prod.stock)) {
        return prod;
      }
      const seeded = INITIAL_PRODUCTS.find((p) => p.id === prod.id);
      return { ...prod, stock: seeded ? seeded.stock : 8 };
    }
  );
  const orders = (Array.isArray(parsed.orders) ? parsed.orders : INITIAL_ORDERS).map((order) => ({
    ...order,
    stockDeducted:
      typeof order.stockDeducted === 'boolean' ? order.stockDeducted : order.status !== 'مرفوض',
  }));
  const scentPoll =
    Array.isArray(parsed.scentPoll) && parsed.scentPoll.length > 0
      ? parsed.scentPoll
      : INITIAL_SCENT_POLL;
  const seasonalOffer =
    parsed.seasonalOffer && typeof parsed.seasonalOffer.title === 'string'
      ? parsed.seasonalOffer
      : INITIAL_SEASONAL_OFFER;
  const notifications = Array.isArray(parsed.notifications) ? parsed.notifications : [];
  const storeConfig = mergeStoreConfig(parsed.storeConfig);
  return { products, orders, scentPoll, seasonalOffer, notifications, storeConfig };
}

function readLocalStore(): StoreData | null {
  try {
    if (!fs.existsSync(DATA_FILE)) return null;
    return normalizeStore(JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) as Partial<StoreData>);
  } catch {
    return null;
  }
}

function writeLocalStore(data: StoreData): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

let storeCache: StoreData | null = null;
let persistChain: Promise<void> = Promise.resolve();

async function sbUpsertStore(data: StoreData): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/store_data?on_conflict=id`, {
    method: 'POST',
    headers: sbHeaders({
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    }),
    body: JSON.stringify({ id: 1, data, updated_at: new Date().toISOString() }),
  });
  if (!res.ok) {
    throw new Error(`Supabase save failed (${res.status}): ${await res.text()}`);
  }
}

// تحميل الداتا مرة واحدة عند تشغيل السيرفر. لو Supabase فشل، السيرفر يقف
// (أفضل من إنه يشتغل بداتا فاضية ويكتب فوق الداتا الحقيقية).
async function initStore(): Promise<void> {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });

  if (!USE_SUPABASE) {
    storeCache = readLocalStore() ?? defaultStore();
    writeLocalStore(storeCache);
    console.log('Storage: local file (data/store.json) - للتجربة فقط');
    return;
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/store_data?id=eq.1&select=data`, {
    headers: sbHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Supabase load failed (${res.status}): ${await res.text()}`);
  }
  const rows = (await res.json()) as Array<{ data: Partial<StoreData> }>;
  if (rows.length > 0 && rows[0].data) {
    storeCache = normalizeStore(rows[0].data);
    // نحفظ النسخة المطبّعة عشان الحقول الجديدة (زي storeConfig) تتضاف للداتا القديمة
    await sbUpsertStore(storeCache);
    console.log('Storage: Supabase (loaded existing data)');
  } else {
    storeCache = readLocalStore() ?? defaultStore();
    await sbUpsertStore(storeCache);
    console.log('Storage: Supabase (first run, seeded initial data)');
  }
}

function ensureStoreFile(): StoreData {
  if (!storeCache) throw new Error('Store not initialised yet');
  // نسخة مستقلة في كل طلب، عشان أي تعديل ناقص ما يتحفظش بالغلط
  return structuredClone(storeCache);
}

function saveStoreData(data: StoreData): void {
  storeCache = structuredClone(data);
  if (!USE_SUPABASE) {
    writeLocalStore(storeCache);
    return;
  }
  const snapshot = structuredClone(storeCache);
  // طابور: الحفظ بالترتيب، مع إعادة المحاولة 3 مرات
  persistChain = persistChain.then(async () => {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await sbUpsertStore(snapshot);
        return;
      } catch (err) {
        console.error(`Save attempt ${attempt} failed:`, err);
        await new Promise((r) => setTimeout(r, 500 * attempt));
      }
    }
    console.error('!! Failed to persist store to Supabase after 3 attempts');
  });
}

const PRIMARY_ADMIN_EMAIL = 'zizo.abdo5699@gmail.com';
const ENV_ADMIN_EMAIL = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const ALLOWED_ADMIN_EMAILS = new Set(
  [PRIMARY_ADMIN_EMAIL, ENV_ADMIN_EMAIL].filter((value) => value.length > 0)
);
if (process.env.NODE_ENV === 'production' && (!process.env.ADMIN_PASSCODE || !process.env.SESSION_SECRET)) {
  console.error('ADMIN_PASSCODE و SESSION_SECRET لازم يتضافوا في Environment قبل التشغيل.');
  process.exit(1);
}
const ADMIN_PASSCODE = (process.env.ADMIN_PASSCODE || 'mmcandle2026').trim();
const TOKEN_SECRET = process.env.SESSION_SECRET || 'mm-candle-store-secret-2026';

function signAdminToken(email: string): string {
  const exp = Date.now() + 1000 * 60 * 60 * 24 * 7;
  const payload = Buffer.from(JSON.stringify({ email, exp })).toString('base64url');
  const sig = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifyAdminToken(token: string): string | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      email?: string;
      exp?: number;
    };
    if (!parsed.email || !parsed.exp || Date.now() > parsed.exp) return null;
    if (!ALLOWED_ADMIN_EMAILS.has(parsed.email.trim().toLowerCase())) return null;
    return parsed.email;
  } catch {
    return null;
  }
}

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const verifiedEmail = token ? verifyAdminToken(token) : null;
  if (!verifiedEmail) {
    res.status(401).json({ error: 'غير مصرح. يرجى تسجيل الدخول بحساب الأدمن.' });
    return;
  }
  (req as Request & { adminEmail?: string }).adminEmail = verifiedEmail;
  next();
}

function normalizeOrderNumber(input: string): string {
  const cleaned = input.trim().replace(/^#/, '').toUpperCase();
  if (/^\d+$/.test(cleaned)) {
    return `MM-${cleaned}`;
  }
  return cleaned;
}

function formatArabicTimestamp(): string {
  return new Date().toLocaleString('ar-EG', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatOrderEmailEGP(amount: number): string {
  return `${Math.round(amount).toLocaleString('ar-EG')} ج.م`;
}

function buildOrderConfirmationEmailHtml(order: StoreOrder, logoUrl: string): string {
  const itemRowsHtml = order.items
    .map((item) => {
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
      let specText = item.scent ? `الرائحة: ${escapeHtml(item.scent)}` : '';
      if (custom?.kind === 'perfume') {
        specText = `العطر: ${escapeHtml(String(custom.scentName || ''))} · الاسم على الزجاجة: ${escapeHtml(String(custom.bottleName || ''))} · الحجم: ${escapeHtml(String(custom.sizeLabel || ''))}`;
      } else if (custom?.kind === 'candle') {
        specText = `الحجم: ${escapeHtml(String(custom.sizeLabel || ''))} (${escapeHtml(String(custom.sizeWeight || ''))}) · اللون: ${escapeHtml(String(custom.colorLabel || ''))} · الجار: ${escapeHtml(String(custom.jarType || ''))} · الرائحة: ${escapeHtml(String(custom.scent || ''))}`;
      }

      return `
        <tr>
          <td style="padding:14px 12px;border-bottom:1px solid #eadfd1;text-align:right;">
            <div style="font-weight:700;color:#2a1a17;font-size:14px;">${escapeHtml(item.name)}</div>
            ${specText ? `<div style="color:#6f5a53;font-size:12px;margin-top:4px;">${specText}</div>` : ''}
          </td>
          <td style="padding:14px 10px;border-bottom:1px solid #eadfd1;text-align:center;color:#2a1a17;font-weight:600;font-size:13px;">
            ${item.quantity.toLocaleString('ar-EG')}
          </td>
          <td style="padding:14px 12px;border-bottom:1px solid #eadfd1;text-align:left;color:#9e732b;font-weight:700;font-size:13px;white-space:nowrap;">
            ${formatOrderEmailEGP(item.price * item.quantity)}
          </td>
        </tr>
      `;
    })
    .join('');

  const paymentLabel =
    order.paymentMethod === 'wallet' ? 'تحويل محفظة إلكترونية' : 'الدفع نقدًا عند الاستلام';

  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8" />
<title>تأكيد الطلب #${escapeHtml(order.orderNumber)} — M&amp;M Candle Co.</title>
</head>
<body style="margin:0;padding:24px 12px;background-color:#faf6f0;font-family:'Cairo',Tahoma,Arial,sans-serif;color:#2a1a17;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;margin:0 auto;background-color:#fffdf9;border:1px solid #e8dccd;border-radius:18px;overflow:hidden;">
    <tr>
      <td style="background:linear-gradient(135deg,#3d1c23 0%,#1c110f 65%,#2a2013 100%);padding:28px 24px;text-align:center;color:#faf4eb;">
        <img src="${escapeHtml(logoUrl)}" alt="شعار M&amp;M Candle Co." width="84" height="84" style="display:block;margin:0 auto 14px;border-radius:16px;border:2px solid rgba(212,170,99,0.55);object-fit:cover;" />
        <p style="margin:0 0 6px;font-size:11px;letter-spacing:2px;color:#d4aa63;font-weight:700;">M&amp;M CANDLE CO.</p>
        <h1 style="margin:0;font-size:22px;font-weight:700;color:#faf4eb;">تم استلام طلبك بنجاح</h1>
        <p style="margin:8px 0 0;font-size:13px;color:#dfd1c3;">شموع ومعطرات يدوية مصنوعة بحب لتضيء لحظاتك</p>
      </td>
    </tr>
    <tr>
      <td style="padding:24px;">
        <div style="background-color:#faf6f0;border:1px solid #e8dccd;border-radius:12px;padding:14px 16px;margin-bottom:20px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr>
              <td style="font-size:13px;color:#6f5a53;">رقم الطلب: <strong style="color:#9b3046;font-size:15px;">#${escapeHtml(order.orderNumber)}</strong></td>
              <td style="font-size:12px;color:#6f5a53;text-align:left;">${escapeHtml(order.createdAt)}</td>
            </tr>
          </table>
        </div>

        <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#2a1a17;">
          أهلًا <strong>${escapeHtml(order.customerName)}</strong>، شكرًا لاختيارك <strong>M&amp;M Candle Co.</strong>. هذه تفاصيل طلبك المسجل لدينا:
        </p>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #e8dccd;border-radius:12px;overflow:hidden;margin-bottom:20px;">
          <thead>
            <tr style="background-color:#f4ece0;color:#5c4943;font-size:12px;">
              <th style="padding:10px 12px;text-align:right;">المنتج والمواصفات</th>
              <th style="padding:10px 10px;text-align:center;">الكمية</th>
              <th style="padding:10px 12px;text-align:left;">السعر</th>
            </tr>
          </thead>
          <tbody>
            ${itemRowsHtml}
          </tbody>
        </table>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#faf6f0;border:1px solid #e8dccd;border-radius:12px;padding:14px 16px;margin-bottom:20px;font-size:13px;">
          <tr>
            <td style="padding:4px 0;color:#6f5a53;">المجموع الفرعي</td>
            <td style="padding:4px 0;text-align:left;font-weight:600;">${formatOrderEmailEGP(order.subtotal)}</td>
          </tr>
          ${
            order.giftWrap && (order.giftWrapFee || 0) > 0
              ? `<tr>
                  <td style="padding:4px 0;color:#9b3046;">تغليف هدايا خاص</td>
                  <td style="padding:4px 0;text-align:left;font-weight:600;color:#9b3046;">${formatOrderEmailEGP(order.giftWrapFee || 0)}</td>
                </tr>`
              : ''
          }
          <tr>
            <td style="padding:4px 0;color:#6f5a53;">تكلفة الشحن (${escapeHtml(order.governorate)})</td>
            <td style="padding:4px 0;text-align:left;font-weight:600;">${order.shippingFee === 0 ? 'مجاني' : formatOrderEmailEGP(order.shippingFee)}</td>
          </tr>
          <tr>
            <td style="padding:10px 0 2px;border-top:1px solid #e8dccd;font-weight:700;font-size:15px;color:#2a1a17;">الإجمالي النهائي</td>
            <td style="padding:10px 0 2px;border-top:1px solid #e8dccd;text-align:left;font-weight:700;font-size:16px;color:#9e732b;">${formatOrderEmailEGP(order.total)}</td>
          </tr>
        </table>

        <div style="border:1px solid #e8dccd;border-radius:12px;padding:14px 16px;font-size:13px;line-height:1.8;color:#5c4943;">
          <div><strong style="color:#2a1a17;">عنوان التوصيل:</strong> ${escapeHtml(order.governorate)}${order.address ? ` — ${escapeHtml(order.address)}` : ''}</div>
          <div><strong style="color:#2a1a17;">رقم الموبايل:</strong> <span dir="ltr">${escapeHtml(order.phone)}</span></div>
          <div><strong style="color:#2a1a17;">طريقة الدفع:</strong> ${escapeHtml(paymentLabel)}</div>
          ${order.giftMessage ? `<div><strong style="color:#9b3046;">رسالة الإهداء:</strong> «${escapeHtml(order.giftMessage)}»</div>` : ''}
          ${order.notes ? `<div><strong style="color:#2a1a17;">ملاحظات التوصيل:</strong> ${escapeHtml(order.notes)}</div>` : ''}
        </div>

        <p style="margin:20px 0 0;font-size:12px;color:#7a655f;text-align:center;">
          يمكنك متابعة حالة طلبك في أي وقت من قسم «تتبع الطلب» على الموقع باستخدام الرقم <strong>#${escapeHtml(order.orderNumber)}</strong>.
        </p>
      </td>
    </tr>
    <tr>
      <td style="background-color:#f4ece0;padding:14px 20px;text-align:center;font-size:11px;color:#7a655f;border-top:1px solid #e8dccd;">
        M&amp;M Candle Co. · القاهرة، مصر · شكرًا لدعمكم الحرف اليدوية
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function tryDispatchOrderEmail(
  recipient: string,
  subject: string,
  html: string
): Promise<{ sent: boolean; providerConfigured: boolean; message: string }> {
  const smtpHost = (process.env.SMTP_HOST || '').trim();
  const smtpUser = (process.env.SMTP_USER || '').trim();
  const smtpPass = (process.env.SMTP_PASS || '').trim();
  const smtpPort = Number(process.env.SMTP_PORT || 587) || 587;
  const smtpFrom = (process.env.SMTP_FROM || smtpUser || 'M&M Candle Co. <orders@mmcandle.local>').trim();

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
      });
      await transporter.sendMail({
        from: smtpFrom,
        to: recipient,
        subject,
        html,
      });
      return {
        sent: true,
        providerConfigured: true,
        message: `تم إرسال تفاصيل الطلب بنجاح إلى ${recipient}.`,
      };
    } catch {
      return {
        sent: false,
        providerConfigured: true,
        message: 'تعذر الإرسال عبر خادم البريد حاليًا، ولكن تم تجهيز نسخة الرسالة لمعاينتها فورًا.',
      };
    }
  }

  const resendKey = (process.env.RESEND_API_KEY || '').trim();
  if (resendKey) {
    try {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: smtpFrom,
          to: [recipient],
          subject,
          html,
        }),
      });
      if (r.ok) {
        return {
          sent: true,
          providerConfigured: true,
          message: `تم إرسال تفاصيل الطلب بنجاح إلى ${recipient}.`,
        };
      }
      return {
        sent: false,
        providerConfigured: true,
        message: 'تعذر الإرسال عبر خدمة البريد حاليًا، وتم تجهيز نسخة الرسالة للمعاينة.',
      };
    } catch {
      return {
        sent: false,
        providerConfigured: true,
        message: 'تعذر الإرسال عبر خدمة البريد حاليًا، وتم تجهيز نسخة الرسالة للمعاينة.',
      };
    }
  }

  return {
    sent: false,
    providerConfigured: false,
    message:
      'تم تجهيز رسالة البريد الإلكتروني المصممة بشعار المتجر؛ يمكنك معاينتها أو إرسالها من تطبيق البريد لعدم تفعيل مزود SMTP على الخادم.',
  };
}

async function startServer() {
  await initStore();
  const app = express();
  app.use(express.json({ limit: '8mb' }));
  app.get('/healthz', (_req, res) => {
    res.json({ ok: true });
  });
  app.use('/api/uploads', express.static(UPLOADS_DIR));

  // Public: list products + active seasonal offer + runtime store config + poll
  app.get('/api/products', (_req, res) => {
    const data = ensureStoreFile();
    res.json({
      products: data.products,
      seasonalOffer: data.seasonalOffer,
      storeConfig: data.storeConfig,
      scentPoll: data.scentPoll,
    });
  });

  // Public: get runtime store configuration (custom prices, shipping, thresholds)
  app.get('/api/store-config', (_req, res) => {
    const data = ensureStoreFile();
    res.json({ storeConfig: data.storeConfig });
  });

  // Public: get seasonal offer
  app.get('/api/seasonal-offer', (_req, res) => {
    const data = ensureStoreFile();
    res.json({ offer: data.seasonalOffer });
  });

  // Public: confirm/register order in store confirmed orders list
  app.post('/api/orders', async (req, res) => {
    const body = req.body as Partial<StoreOrder> & {
      customerEmail?: string;
      sendViaEmail?: boolean;
    };
    if (
      !body ||
      typeof body.customerName !== 'string' ||
      body.customerName.trim().length < 2 ||
      typeof body.phone !== 'string' ||
      body.phone.trim().length < 8 ||
      !Array.isArray(body.items) ||
      body.items.length === 0
    ) {
      res.status(400).json({ error: 'بيانات الطلب غير مكتملة.' });
      return;
    }

    const data = ensureStoreFile();
    const lowStockThreshold = data.storeConfig.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD;
    const safeItems: OrderLineItem[] = body.items.slice(0, 30).map((item) => ({
      productId: Number(item.productId) || 0,
      name: String(item.name || '').trim().slice(0, 140),
      scent: String(item.scent || '').trim().slice(0, 140),
      price: Math.max(0, Number(item.price) || 0),
      quantity: Math.max(1, Math.round(Number(item.quantity) || 1)),
      ...(item.isCustom ? { isCustom: true } : {}),
      ...(item.customDetails && typeof item.customDetails === 'object'
        ? { customDetails: item.customDetails }
        : {}),
    }));

    // Validate stock for standard catalog items
    const requestedByProduct = new Map<number, number>();
    for (const item of safeItems) {
      if (item.isCustom || item.productId <= 0) continue;
      requestedByProduct.set(
        item.productId,
        (requestedByProduct.get(item.productId) || 0) + item.quantity
      );
    }

    for (const [pid, qty] of requestedByProduct.entries()) {
      const prod = data.products.find((p) => p.id === pid);
      if (!prod) continue;
      if (prod.stock <= 0) {
        res.status(400).json({ error: `عذرًا، المنتج «${prod.name}» نفذ من المخزون حاليًا.` });
        return;
      }
      if (prod.stock < qty) {
        res.status(400).json({
          error: `الكمية المتوفرة من «${prod.name}» هي ${prod.stock.toLocaleString('ar-EG')} فقط.`,
        });
        return;
      }
    }

    let orderNumber =
      typeof body.orderNumber === 'string' && body.orderNumber.trim()
        ? normalizeOrderNumber(body.orderNumber)
        : `MM-${Math.floor(1000 + Math.random() * 9000)}`;

    while (data.orders.some((o) => o.orderNumber === orderNumber)) {
      orderNumber = `MM-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const now = formatArabicTimestamp();
    const nowISO = new Date().toISOString();
    const cleanEmail =
      typeof body.customerEmail === 'string' ? body.customerEmail.trim().slice(0, 160) : '';
    const wantsEmail = Boolean(body.sendViaEmail) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail);

    const newOrder: StoreOrder = {
      orderNumber,
      customerName: body.customerName.trim().slice(0, 120),
      phone: body.phone.trim().slice(0, 30),
      ...(cleanEmail ? { customerEmail: cleanEmail } : {}),
      ...(wantsEmail ? { sendViaEmail: true } : {}),
      governorate: typeof body.governorate === 'string' ? body.governorate.trim() : 'القاهرة',
      address: typeof body.address === 'string' ? body.address.trim().slice(0, 240) : '',
      notes: typeof body.notes === 'string' ? body.notes.trim().slice(0, 240) : '',
      paymentMethod: body.paymentMethod === 'wallet' ? 'wallet' : 'cod',
      items: safeItems,
      itemCount:
        Number(body.itemCount) || safeItems.reduce((acc, i) => acc + i.quantity, 0),
      subtotal: Number(body.subtotal) || 0,
      shippingFee: Number(body.shippingFee) || 0,
      giftWrap: Boolean(body.giftWrap),
      giftWrapFee: Number(body.giftWrapFee) || 0,
      giftMessage: typeof body.giftMessage === 'string' ? body.giftMessage.trim().slice(0, 300) : '',
      total: Number(body.total) || 0,
      status: 'جديد',
      stockDeducted: true,
      createdAt: now,
      createdAtISO: nowISO,
      updatedAt: now,
    };

    const reqOrigin = `${req.protocol}://${req.get('host') || 'localhost:3000'}`;
    const appBaseUrl = (process.env.APP_URL || '').trim().replace(/\/$/, '') || reqOrigin;
    const absoluteLogoUrl = `${appBaseUrl}/images/brand-logo.jpg`;
    const previewLogoUrl = '/images/brand-logo.jpg';

    let emailHtml: string | undefined;
    let emailStatus:
      | {
          requested: boolean;
          sent: boolean;
          providerConfigured: boolean;
          recipient?: string;
          message?: string;
        }
      | undefined;

    if (wantsEmail) {
      const dispatchHtml = buildOrderConfirmationEmailHtml(newOrder, absoluteLogoUrl);
      emailHtml = buildOrderConfirmationEmailHtml(newOrder, previewLogoUrl);
      const dispatchResult = await tryDispatchOrderEmail(
        cleanEmail,
        `تأكيد طلبك #${orderNumber} — M&M Candle Co.`,
        dispatchHtml
      );
      newOrder.emailSent = dispatchResult.sent;
      emailStatus = {
        requested: true,
        sent: dispatchResult.sent,
        providerConfigured: dispatchResult.providerConfigured,
        recipient: cleanEmail,
        message: dispatchResult.message,
      };
    }

    const newNotifications: AdminNotification[] = [];
    for (const [pid, qty] of requestedByProduct.entries()) {
      const prod = data.products.find((p) => p.id === pid);
      if (!prod) continue;
      prod.stock = Math.max(0, prod.stock - qty);
      const level: AdminNotification['level'] =
        prod.stock === 0 ? 'out' : prod.stock <= lowStockThreshold ? 'low' : 'normal';
      const type: AdminNotification['type'] =
        prod.stock === 0
          ? 'out_of_stock'
          : prod.stock <= lowStockThreshold
          ? 'low_stock'
          : 'stock_deducted';
      newNotifications.push({
        id: `notif-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
        type,
        orderNumber,
        productId: prod.id,
        productName: prod.name,
        quantityOrdered: qty,
        remainingStock: prod.stock,
        level,
        read: false,
        createdAt: now,
      });
    }

    if (newNotifications.length > 0) {
      data.notifications = [...newNotifications, ...data.notifications].slice(0, 100);
    }

    data.orders.unshift(newOrder);
    saveStoreData(data);
    res.status(201).json({
      order: newOrder,
      products: data.products,
      ...(emailHtml ? { emailHtml } : {}),
      ...(emailStatus ? { emailStatus } : {}),
    });
  });

  // Public: track confirmed order by order number
  app.get('/api/orders/track/:orderNumber', (req, res) => {
    const queryNumber = normalizeOrderNumber(req.params.orderNumber || '');
    if (!queryNumber) {
      res.status(400).json({ error: 'يرجى إدخال رقم الطلب.' });
      return;
    }

    const data = ensureStoreFile();
    const found = data.orders.find((o) => o.orderNumber.toUpperCase() === queryNumber);
    if (!found) {
      res.status(404).json({ error: 'لم يتم العثور على طلب مؤكد بهذا الرقم.' });
      return;
    }

    res.json({
      order: {
        orderNumber: found.orderNumber,
        customerName: found.customerName,
        governorate: found.governorate,
        itemCount: found.itemCount,
        total: found.total,
        status: found.status,
        createdAt: found.createdAt,
        updatedAt: found.updatedAt,
        items: found.items,
      },
    });
  });

  // Admin auth: login with dedicated admin email or configured secret identifier
  const normalizeArabicDigits = (value: string) =>
    value
      .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
      .replace(/[\u06f0-\u06f9]/g, (d) => String(d.charCodeAt(0) - 0x06f0));

  app.post('/api/admin/login', (req, res) => {
    const { email, passcode } = (req.body || {}) as { email?: string; passcode?: string };
    const normalizedEmail =
      typeof email === 'string' ? normalizeArabicDigits(email).trim().toLowerCase() : '';
    const rawPasscode = typeof passcode === 'string' ? normalizeArabicDigits(passcode).trim() : '';

    if (!ALLOWED_ADMIN_EMAILS.has(normalizedEmail)) {
      res.status(403).json({
        error: 'هذا البريد الإلكتروني غير مصرح له بصلاحيات الأدمن.',
      });
      return;
    }

    if (rawPasscode !== normalizeArabicDigits(ADMIN_PASSCODE)) {
      res.status(401).json({
        error: 'كلمة المرور غير صحيحة.',
      });
      return;
    }

    const token = signAdminToken(normalizedEmail);
    res.json({ token, email: normalizedEmail });
  });

  app.get('/api/admin/me', requireAdmin, (req, res) => {
    const adminEmail = (req as Request & { adminEmail?: string }).adminEmail || PRIMARY_ADMIN_EMAIL;
    res.json({ email: adminEmail });
  });

  // Admin: upload product image from device (base64 data URL)
  app.post('/api/admin/upload-image', requireAdmin, (req, res) => {
    const { dataUrl } = (req.body || {}) as { dataUrl?: string };
    if (typeof dataUrl !== 'string') {
      res.status(400).json({ error: 'يرجى اختيار ملف صورة صالح.' });
      return;
    }

    const match = /^data:image\/(jpeg|jpg|png|webp|gif);base64,([A-Za-z0-9+/=]+)$/i.exec(
      dataUrl.trim()
    );
    if (!match) {
      res.status(400).json({ error: 'صيغة الصورة غير مدعومة. استخدم JPG أو PNG أو WebP.' });
      return;
    }

    const ext = match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase();
    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.length === 0 || buffer.length > 5 * 1024 * 1024) {
      res.status(400).json({ error: 'حجم الصورة كبير جدًا (الحد الأقصى ٥ ميجابايت).' });
      return;
    }

    const filename = `product-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;

    if (USE_SUPABASE) {
      try {
        const up = await fetch(`${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${filename}`, {
          method: 'POST',
          headers: sbHeaders({
            'Content-Type': ext === 'jpg' ? 'image/jpeg' : `image/${ext}`,
            'x-upsert': 'true',
          }),
          body: buffer,
        });
        if (!up.ok) {
          console.error('Image upload failed:', up.status, await up.text());
          res.status(502).json({ error: 'تعذر رفع الصورة، حاول مرة أخرى.' });
          return;
        }
        res.status(201).json({
          url: `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${filename}`,
        });
      } catch (err) {
        console.error('Image upload error:', err);
        res.status(502).json({ error: 'تعذر رفع الصورة، حاول مرة أخرى.' });
      }
      return;
    }

    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    fs.writeFileSync(path.join(UPLOADS_DIR, filename), buffer);
    res.status(201).json({ url: `/api/uploads/${filename}` });
  });

  // Admin: update existing product
  app.put('/api/admin/products/:id', requireAdmin, (req, res) => {
    const id = Number(req.params.id);
    const data = ensureStoreFile();
    const index = data.products.findIndex((p) => p.id === id);
    if (index === -1) {
      res.status(404).json({ error: 'المنتج غير موجود.' });
      return;
    }

    const existing = data.products[index];
    const body = req.body as Partial<StoreProduct> & { image?: string | null };
    const nextCategory =
      body.category && CATEGORY_LABELS[body.category] ? body.category : existing.category;
    const nextPrice =
      typeof body.price === 'number' && Number.isFinite(body.price) && body.price > 0
        ? Math.round(body.price)
        : existing.price;
    const nextStock =
      typeof body.stock === 'number' && Number.isFinite(body.stock) && body.stock >= 0
        ? Math.round(body.stock)
        : existing.stock;
    let nextImage = existing.image;
    if (body.image === null || body.image === '') {
      nextImage = undefined;
    } else if (typeof body.image === 'string' && body.image.trim()) {
      nextImage = body.image.trim();
    }

    const updated: StoreProduct = {
      ...existing,
      name: typeof body.name === 'string' && body.name.trim() ? body.name.trim() : existing.name,
      subtitle:
        typeof body.subtitle === 'string' && body.subtitle.trim()
          ? body.subtitle.trim()
          : existing.subtitle,
      description:
        typeof body.description === 'string' && body.description.trim()
          ? body.description.trim()
          : existing.description,
      price: nextPrice,
      stock: nextStock,
      category: nextCategory,
      categoryLabel: CATEGORY_LABELS[nextCategory],
      spec: typeof body.spec === 'string' && body.spec.trim() ? body.spec.trim() : existing.spec,
      longevity:
        typeof body.longevity === 'string' && body.longevity.trim()
          ? body.longevity.trim()
          : existing.longevity,
      image: nextImage,
      tag: typeof body.tag === 'string' ? body.tag.trim() || undefined : existing.tag,
      scents:
        Array.isArray(body.scents) && body.scents.length > 0
          ? body.scents.map((s) => String(s).trim()).filter(Boolean)
          : existing.scents,
    };

    data.products[index] = updated;
    saveStoreData(data);
    res.json({ product: updated, products: data.products });
  });

  // Admin: create new product
  app.post('/api/admin/products', requireAdmin, (req, res) => {
    const body = req.body as Partial<StoreProduct>;
    if (
      !body ||
      typeof body.name !== 'string' ||
      !body.name.trim() ||
      typeof body.price !== 'number' ||
      !Number.isFinite(body.price) ||
      body.price <= 0
    ) {
      res.status(400).json({ error: 'يرجى إدخال اسم المنتج وسعر صحيح.' });
      return;
    }

    const data = ensureStoreFile();
    const nextId = data.products.reduce((max, p) => Math.max(max, p.id), 0) + 1;
    const category: ProductCategory =
      body.category && CATEGORY_LABELS[body.category] ? body.category : 'candles';
    const slugByCategory: Record<ProductCategory, ProductSlug> = {
      candles: 'classic-candle',
      diffusers: 'reed-diffuser',
      gifts: 'gift-box',
    };

    const created: StoreProduct = {
      id: nextId,
      slug: slugByCategory[category],
      name: body.name.trim(),
      subtitle:
        typeof body.subtitle === 'string' && body.subtitle.trim()
          ? body.subtitle.trim()
          : 'مصنوع يدويًا بعناية فائقة',
      description:
        typeof body.description === 'string' && body.description.trim()
          ? body.description.trim()
          : 'منتج يدوي من استوديو M&M Candle Co. بزيوت عطرية طبيعية وثبات طويل.',
      price: Math.round(body.price),
      stock:
        typeof body.stock === 'number' && Number.isFinite(body.stock) && body.stock >= 0
          ? Math.round(body.stock)
          : 10,
      category,
      categoryLabel: CATEGORY_LABELS[category],
      spec: typeof body.spec === 'string' && body.spec.trim() ? body.spec.trim() : '٢٠٠ جم',
      longevity:
        typeof body.longevity === 'string' && body.longevity.trim()
          ? body.longevity.trim()
          : 'جودة يدوية فاخرة',
      rating: 5.0,
      reviewCount: 1,
      image:
        typeof body.image === 'string' && body.image.trim()
          ? body.image.trim()
          : category === 'diffusers'
          ? '/images/reed-diffuser.jpg'
          : undefined,
      tag: typeof body.tag === 'string' && body.tag.trim() ? body.tag.trim() : undefined,
      scents:
        Array.isArray(body.scents) && body.scents.length > 0
          ? body.scents.map((s) => String(s).trim()).filter(Boolean)
          : ['فانيليا مدغشقر الدافئة', 'عنبر وخشب الصندل'],
    };

    data.products.push(created);
    saveStoreData(data);
    res.status(201).json({ product: created, products: data.products });
  });

  // Admin: delete product
  app.delete('/api/admin/products/:id', requireAdmin, (req, res) => {
    const id = Number(req.params.id);
    const data = ensureStoreFile();
    const nextProducts = data.products.filter((p) => p.id !== id);
    if (nextProducts.length === data.products.length) {
      res.status(404).json({ error: 'المنتج غير موجود.' });
      return;
    }
    data.products = nextProducts;
    saveStoreData(data);
    res.json({ products: data.products });
  });

  // Admin: list all orders + notifications
  app.get('/api/admin/orders', requireAdmin, (_req, res) => {
    const data = ensureStoreFile();
    res.json({ orders: data.orders, notifications: data.notifications });
  });

  // Admin: update order status (accept / reject / shipping stages) with real stock sync
  app.patch('/api/admin/orders/:orderNumber/status', requireAdmin, (req, res) => {
    const orderNumber = normalizeOrderNumber(req.params.orderNumber || '');
    const { status } = (req.body || {}) as { status?: OrderStatus };
    if (!status || !VALID_STATUSES.includes(status)) {
      res.status(400).json({ error: 'حالة الطلب غير صالحة.' });
      return;
    }

    const data = ensureStoreFile();
    const index = data.orders.findIndex((o) => o.orderNumber === orderNumber);
    if (index === -1) {
      res.status(404).json({ error: 'الطلب غير موجود.' });
      return;
    }

    const existing = data.orders[index];
    const wasDeducted = existing.stockDeducted !== false;
    let nextStockDeducted = wasDeducted;
    const now = formatArabicTimestamp();

    // If rejecting an order whose stock was deducted, restore stock
    if (status === 'مرفوض' && wasDeducted) {
      for (const item of existing.items) {
        if (item.isCustom || item.productId <= 0) continue;
        const prod = data.products.find((p) => p.id === item.productId);
        if (prod) {
          prod.stock += Math.max(1, Number(item.quantity) || 1);
        }
      }
      nextStockDeducted = false;
    }

    // If accepting (or moving to shipping) an order whose stock wasn't deducted yet (e.g. previously rejected)
    if (status !== 'مرفوض' && !wasDeducted) {
      const requested = new Map<number, number>();
      for (const item of existing.items) {
        if (item.isCustom || item.productId <= 0) continue;
        requested.set(
          item.productId,
          (requested.get(item.productId) || 0) + Math.max(1, Number(item.quantity) || 1)
        );
      }

      for (const [pid, qty] of requested.entries()) {
        const prod = data.products.find((p) => p.id === pid);
        if (prod && prod.stock < qty) {
          res.status(400).json({
            error: `المخزون الحالي من «${prod.name}» (${prod.stock.toLocaleString(
              'ar-EG'
            )}) غير كافٍ لقبول الطلب.`,
          });
          return;
        }
      }

      const lowStockThreshold = data.storeConfig.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD;
      for (const [pid, qty] of requested.entries()) {
        const prod = data.products.find((p) => p.id === pid);
        if (prod) {
          prod.stock = Math.max(0, prod.stock - qty);
          const level: AdminNotification['level'] =
            prod.stock === 0 ? 'out' : prod.stock <= lowStockThreshold ? 'low' : 'normal';
          const type: AdminNotification['type'] =
            prod.stock === 0
              ? 'out_of_stock'
              : prod.stock <= lowStockThreshold
              ? 'low_stock'
              : 'stock_deducted';
          data.notifications.unshift({
            id: `notif-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
            type,
            orderNumber: existing.orderNumber,
            productId: prod.id,
            productName: prod.name,
            quantityOrdered: qty,
            remainingStock: prod.stock,
            level,
            read: false,
            createdAt: now,
          });
        }
      }
      data.notifications = data.notifications.slice(0, 100);
      nextStockDeducted = true;
    }

    data.orders[index] = {
      ...existing,
      status,
      stockDeducted: nextStockDeducted,
      updatedAt: now,
    };
    saveStoreData(data);
    res.json({
      order: data.orders[index],
      orders: data.orders,
      products: data.products,
      notifications: data.notifications,
    });
  });

  // Admin: delete an order
  app.delete('/api/admin/orders/:orderNumber', requireAdmin, (req, res) => {
    const orderNumber = normalizeOrderNumber(req.params.orderNumber || '');
    const data = ensureStoreFile();
    const index = data.orders.findIndex((o) => o.orderNumber === orderNumber);
    if (index === -1) {
      res.status(404).json({ error: 'الطلب غير موجود.' });
      return;
    }

    const existing = data.orders[index];
    // If deleting an unreviewed ('جديد') order whose stock was deducted, restore stock
    if (existing.status === 'جديد' && existing.stockDeducted !== false) {
      for (const item of existing.items) {
        if (item.isCustom || item.productId <= 0) continue;
        const prod = data.products.find((p) => p.id === item.productId);
        if (prod) {
          prod.stock += Math.max(1, Number(item.quantity) || 1);
        }
      }
    }

    data.orders.splice(index, 1);
    saveStoreData(data);
    res.json({
      orders: data.orders,
      products: data.products,
      notifications: data.notifications,
    });
  });

  // Admin: get stock notifications
  app.get('/api/admin/notifications', requireAdmin, (_req, res) => {
    const data = ensureStoreFile();
    res.json({ notifications: data.notifications });
  });

  // Admin: mark notification(s) as read
  app.patch('/api/admin/notifications/:id/read', requireAdmin, (req, res) => {
    const id = req.params.id;
    const data = ensureStoreFile();
    if (id === 'all') {
      data.notifications = data.notifications.map((n) => ({ ...n, read: true }));
    } else {
      data.notifications = data.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
    }
    saveStoreData(data);
    res.json({ notifications: data.notifications });
  });

  // Admin: interactive restock directly from a notification
  app.post('/api/admin/notifications/:id/restock', requireAdmin, (req, res) => {
    const id = req.params.id;
    const amountRaw = Number((req.body || {}).amount);
    const amount = Number.isFinite(amountRaw) && amountRaw > 0 ? Math.min(500, Math.round(amountRaw)) : 10;

    const data = ensureStoreFile();
    const notif = data.notifications.find((n) => n.id === id);
    if (!notif) {
      res.status(404).json({ error: 'الإشعار غير موجود.' });
      return;
    }

    const prod = data.products.find((p) => p.id === notif.productId);
    if (!prod) {
      res.status(404).json({ error: 'المنتج المرتبط بهذا الإشعار غير موجود.' });
      return;
    }

    prod.stock += amount;
    const lowStockThreshold = data.storeConfig.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD;
    data.notifications = data.notifications.map((n) => {
      if (n.id === id) {
        return {
          ...n,
          read: true,
          remainingStock: prod.stock,
          level: prod.stock === 0 ? 'out' : prod.stock <= lowStockThreshold ? 'low' : 'normal',
        };
      }
      return n;
    });

    saveStoreData(data);
    res.json({
      product: prod,
      products: data.products,
      notifications: data.notifications,
    });
  });

  // Admin: delete notification(s)
  app.delete('/api/admin/notifications/:id', requireAdmin, (req, res) => {
    const id = req.params.id;
    const data = ensureStoreFile();
    if (id === 'clear-read') {
      data.notifications = data.notifications.filter((n) => !n.read);
    } else {
      data.notifications = data.notifications.filter((n) => n.id !== id);
    }
    saveStoreData(data);
    res.json({ notifications: data.notifications });
  });

  // Public: get Scent of the Month poll options
  app.get('/api/scent-poll', (_req, res) => {
    const data = ensureStoreFile();
    res.json({ options: data.scentPoll });
  });

  // Public: submit or change vote for Scent of the Month
  app.post('/api/scent-poll/vote', (req, res) => {
    const { optionId, previousOptionId } = (req.body || {}) as {
      optionId?: string;
      previousOptionId?: string;
    };
    if (typeof optionId !== 'string' || !optionId.trim()) {
      res.status(400).json({ error: 'يرجى اختيار رائحة صالحة للتصويت.' });
      return;
    }

    const data = ensureStoreFile();
    const target = data.scentPoll.find((opt) => opt.id === optionId);
    if (!target) {
      res.status(404).json({ error: 'خيار الرائحة غير موجود.' });
      return;
    }

    if (previousOptionId && previousOptionId !== optionId) {
      const prev = data.scentPoll.find((opt) => opt.id === previousOptionId);
      if (prev && prev.votes > 0) {
        prev.votes -= 1;
      }
    }

    if (previousOptionId !== optionId) {
      target.votes += 1;
      saveStoreData(data);
    }

    res.json({ options: data.scentPoll });
  });

  // Admin: configure Seasonal Offer
  app.put('/api/admin/seasonal-offer', requireAdmin, (req, res) => {
    const body = (req.body || {}) as Partial<SeasonalOffer>;
    const discountNum = Number(body.discountPercent);
    if (!Number.isFinite(discountNum) || discountNum < 1 || discountNum > 90) {
      res.status(400).json({ error: 'يرجى إدخال نسبة خصم صحيحة بين ١٪ و٩٠٪.' });
      return;
    }

    const endMs = body.endsAt ? new Date(body.endsAt).getTime() : NaN;
    if (!Number.isFinite(endMs)) {
      res.status(400).json({ error: 'يرجى تحديد تاريخ انتهاء صحيح للعرض.' });
      return;
    }

    const data = ensureStoreFile();
    const validProductIds = Array.isArray(body.productIds)
      ? body.productIds
          .map((id) => Number(id))
          .filter((id) => data.products.some((p) => p.id === id))
      : [];

    data.seasonalOffer = {
      active: Boolean(body.active),
      title:
        typeof body.title === 'string' && body.title.trim()
          ? body.title.trim().slice(0, 120)
          : 'العرض الموسمي',
      subtitle:
        typeof body.subtitle === 'string' && body.subtitle.trim()
          ? body.subtitle.trim().slice(0, 200)
          : 'خصم خاص لفترة محدودة على المنتجات المختارة',
      discountPercent: Math.round(discountNum),
      productIds: validProductIds,
      endsAt: new Date(endMs).toISOString(),
    };

    saveStoreData(data);
    res.json({ offer: data.seasonalOffer });
  });

  // Admin: update full runtime store configuration (custom perfume & candle prices/options, shipping, thresholds)
  app.put('/api/admin/store-config', requireAdmin, (req, res) => {
    const body = (req.body || {}) as Partial<StoreRuntimeConfig>;
    const data = ensureStoreFile();
    const merged = mergeStoreConfig({
      ...data.storeConfig,
      ...body,
      customPerfume: body.customPerfume
        ? { ...data.storeConfig.customPerfume, ...body.customPerfume }
        : data.storeConfig.customPerfume,
      customCandle: body.customCandle
        ? { ...data.storeConfig.customCandle, ...body.customCandle }
        : data.storeConfig.customCandle,
    });
    data.storeConfig = merged;
    saveStoreData(data);
    res.json({ storeConfig: data.storeConfig });
  });

  // Admin: update Scent of the Month poll options
  app.put('/api/admin/scent-poll', requireAdmin, (req, res) => {
    const body = (req.body || {}) as { options?: ScentPollOption[] };
    if (!Array.isArray(body.options) || body.options.length < 2) {
      res.status(400).json({ error: 'يجب أن يحتوي التصويت على خيارين على الأقل.' });
      return;
    }
    const cleanOptions: ScentPollOption[] = body.options
      .slice(0, 12)
      .map((opt, idx) => ({
        id:
          typeof opt.id === 'string' && opt.id.trim()
            ? opt.id.trim().slice(0, 60)
            : `scent-${Date.now()}-${idx}`,
        name: String(opt.name || '').trim().slice(0, 100),
        notes: String(opt.notes || '').trim().slice(0, 180),
        votes: Math.max(0, Math.round(Number(opt.votes) || 0)),
      }))
      .filter((opt) => opt.name.length > 0);

    if (cleanOptions.length < 2) {
      res.status(400).json({ error: 'يرجى إدخال اسم صالح لخيارين على الأقل.' });
      return;
    }

    const data = ensureStoreFile();
    data.scentPoll = cleanOptions;
    saveStoreData(data);
    res.json({ options: data.scentPoll });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`M&M Candle Co. server running on http://0.0.0.0:${port}`);
  });
}

startServer();

import { STORE_CONFIG, type CandleJarType } from '../config';

export type ProductCategory = 'candles' | 'diffusers' | 'gifts';

export interface Product {
  id: number;
  slug: 'classic-candle' | 'reed-diffuser' | 'gift-box' | 'decor-candle';
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

export const LOW_STOCK_THRESHOLD = STORE_CONFIG.lowStockThreshold;

export type OrderStatus =
  | 'جديد'
  | 'مقبول'
  | 'مرفوض'
  | 'قيد التجهيز'
  | 'جاري الشحن'
  | 'تم التوصيل';

export interface CustomPerfumeDetails {
  kind: 'perfume';
  scentName: string;
  bottleName: string;
  sizeLabel: string;
  sizeMl: number;
}

export interface CustomCandleDetails {
  kind: 'candle';
  sizeLabel: string;
  sizeWeight: string;
  colorLabel: string;
  colorHex: string;
  scent: string;
  jarType: CandleJarType;
}

export type CustomItemDetails = CustomPerfumeDetails | CustomCandleDetails;

export interface OrderLineItem {
  productId: number;
  name: string;
  scent: string;
  price: number;
  quantity: number;
  isCustom?: boolean;
  customDetails?: CustomItemDetails;
}

export interface TrackableOrder {
  orderNumber: string;
  customerName: string;
  phone?: string;
  governorate: string;
  address?: string;
  notes?: string;
  paymentMethod?: 'cod' | 'wallet';
  itemCount: number;
  subtotal?: number;
  shippingFee?: number;
  total: number;
  status: OrderStatus;
  stockDeducted?: boolean;
  createdAt: string;
  updatedAt: string;
  items: OrderLineItem[];
  giftWrap?: boolean;
  giftMessage?: string;
}

export interface AdminNotification {
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

export interface CustomerReview {
  id: string;
  productId: number;
  author: string;
  city: string;
  scent: string;
  rating: number;
  comment: string;
  date: string;
}

export interface ScentProfile {
  id: string;
  name: string;
  family: string;
  topNote: string;
  heartNote: string;
  baseNote: string;
  mood: string;
  productIds: number[];
}

export const WHATSAPP_NUMBER = STORE_CONFIG.whatsappNumber;
export const FREE_SHIPPING_THRESHOLD = STORE_CONFIG.freeShippingThreshold;
export const GIFT_WRAP_FEE = STORE_CONFIG.giftWrapFee;

export interface GovernorateRate {
  name: string;
  zone: string;
  fee: number;
  eta: string;
}

export const GOVERNORATES: GovernorateRate[] = [
  { name: 'فيصل - الهرم', zone: 'الجيزة', fee: 75, eta: '٢٤ - ٤٨ ساعة' },
  {
    name: 'أكتوبر - زايد - حدائق الأهرام - حدائق أكتوبر',
    zone: 'الجيزة',
    fee: 80,
    eta: '٢٤ - ٤٨ ساعة',
  },
  { name: 'ضواحي الجيزة', zone: 'الجيزة', fee: 85, eta: '٢ - ٣ أيام عمل' },
  { name: 'إمبابة - المهندسين - الوراق', zone: 'الجيزة', fee: 75, eta: '٢٤ - ٤٨ ساعة' },
  {
    name: 'وسط البلد - العباسية - بولاق أبو العلا - التحرير',
    zone: 'القاهرة',
    fee: 75,
    eta: '٢٤ - ٤٨ ساعة',
  },
  {
    name: 'مصر الجديدة - روكسي - ألماظة - جسر السويس - النزهة الجديدة - عين شمس',
    zone: 'القاهرة',
    fee: 75,
    eta: '٢٤ - ٤٨ ساعة',
  },
  { name: 'عزبة النخل - المطرية - المرج', zone: 'القاهرة', fee: 75, eta: '٢٤ - ٤٨ ساعة' },
  { name: 'شبرا مصر - شبرا الخيمة', zone: 'القاهرة الكبرى', fee: 75, eta: '٢٤ - ٤٨ ساعة' },
  { name: 'المدن الجديدة والتجمعات', zone: 'القاهرة الجديدة', fee: 80, eta: '٢٤ - ٤٨ ساعة' },
  { name: 'مدينة بدر', zone: 'القاهرة الجديدة', fee: 90, eta: '٢ - ٣ أيام عمل' },
  {
    name: 'مدينة نصر - زهراء مدينة نصر - حدائق القبة',
    zone: 'القاهرة',
    fee: 75,
    eta: '٢٤ - ٤٨ ساعة',
  },
  {
    name: 'المعادي - حدائق المعادي - المقطم - الفسطاط الجديدة',
    zone: 'القاهرة',
    fee: 75,
    eta: '٢٤ - ٤٨ ساعة',
  },
  {
    name: 'دار السلام - البساتين - فايدة كامل - السيدة عائشة',
    zone: 'القاهرة',
    fee: 75,
    eta: '٢٤ - ٤٨ ساعة',
  },
  {
    name: 'العمرانية - بولاق الدكرور - المنيب - صفط اللبن',
    zone: 'الجيزة',
    fee: 75,
    eta: '٢٤ - ٤٨ ساعة',
  },
  { name: 'السيدة زينب - المنيل', zone: 'القاهرة', fee: 75, eta: '٢٤ - ٤٨ ساعة' },
  { name: 'حلوان - ١٥ مايو', zone: 'جنوب القاهرة', fee: 80, eta: '٢٤ - ٤٨ ساعة' },
  { name: 'الدلتا والقنال (وجه بحري)', zone: 'وجه بحري', fee: 90, eta: '٢ - ٣ أيام عمل' },
  { name: 'الصعيد (وجه قبلي)', zone: 'وجه قبلي', fee: 105, eta: '٣ - ٤ أيام عمل' },
  {
    name: 'البحر الأحمر - الغردقة - الوادي الجديد',
    zone: 'المحافظات الساحلية والحدودية',
    fee: 150,
    eta: '٣ - ٥ أيام عمل',
  },
];

export interface ShippingEstimate {
  governorate: GovernorateRate;
  fee: number;
  isFree: boolean;
  remainingForFree: number;
}

export function estimateShipping(subtotal: number, governorateName: string): ShippingEstimate {
  const direct = GOVERNORATES.find((g) => g.name === governorateName);
  const legacyFallback =
    governorateName === 'القاهرة'
      ? GOVERNORATES[4]
      : governorateName === 'البحر الأحمر'
      ? GOVERNORATES[18]
      : undefined;
  const governorate = direct ?? legacyFallback ?? GOVERNORATES[0];
  const isFree = subtotal >= FREE_SHIPPING_THRESHOLD;
  return {
    governorate,
    fee: subtotal === 0 ? 0 : isFree ? 0 : governorate.fee,
    isFree: subtotal > 0 && isFree,
    remainingForFree: Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal),
  };
}

export const PRODUCTS: Product[] = [
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

export const INITIAL_REVIEWS: CustomerReview[] = [
  {
    id: 'rev-1',
    productId: 2,
    author: 'ندى الشربيني',
    city: 'المعادي، القاهرة',
    scent: 'رمان وعنبر أحمر',
    rating: 5,
    comment:
      'شكل الزجاجة مع الغطاء الذهبي فخم جدًا في الريسبشن، والرائحة ثابتة ومالية المكان من أول يوم بدون ما تكون مزعجة.',
    date: 'نوفمبر ٢٠٢٦',
  },
  {
    id: 'rev-2',
    productId: 1,
    author: 'كريم عبد الرحمن',
    city: 'الشيخ زايد، الجيزة',
    scent: 'عنبر وخشب الصندل',
    rating: 5,
    comment:
      'أول مرة أجرب شمعة صويا طبيعية وما تعملش دخان أسود. عطر العنبر مع خشب الصندل هادي ومريح جدًا بالليل.',
    date: 'نوفمبر ٢٠٢٦',
  },
  {
    id: 'rev-3',
    productId: 3,
    author: 'مريم طارق',
    city: 'سموحة، الإسكندرية',
    scent: 'ورد طائفي ومسك',
    rating: 5,
    comment:
      'طلبته هدية لخطوبة صاحبتي، التغليف بالشريط النبيذي والكارت المكتوب يدويًا وصل في ميعاده وكان شكله راقي فوق التوقع.',
    date: 'أكتوبر ٢٠٢٦',
  },
  {
    id: 'rev-4',
    productId: 4,
    author: 'سلمى حسام',
    city: 'مدينة نصر، القاهرة',
    scent: 'فانيليا خفيفة',
    rating: 5,
    comment:
      'حطيتها على رف المكتبة في الصالة وأضافت لمسة ديكور دافئة جدًا، وتفاصيل الصب اليدوي نظيفة ومتقنة.',
    date: 'أكتوبر ٢٠٢٦',
  },
  {
    id: 'rev-5',
    productId: 1,
    author: 'أحمد فوزي',
    city: 'المنصورة، الدقهلية',
    scent: 'فانيليا مدغشقر الدافئة',
    rating: 5,
    comment:
      'الشحن وصل مغلف كويس جدًا خلال يومين، ورائحة الفانيليا دافية وثابتة حتى بعد ما بطفي الشمعة.',
    date: 'أكتوبر ٢٠٢٦',
  },
  {
    id: 'rev-6',
    productId: 2,
    author: 'ياسمين نبيل',
    city: 'مصر الجديدة، القاهرة',
    scent: 'ورد طائفي وعود',
    rating: 5,
    comment:
      'استخدمت ٣ عيدان بس في أوضة النوم والعطر فضل منتشر أكتر من شهرين بنفس القوة. هطلب علبة هدية قريب.',
    date: 'سبتمبر ٢٠٢٦',
  },
];

export const SCENT_PROFILES: ScentProfile[] = [
  {
    id: 'amber-sandalwood',
    name: 'عنبر وخشب الصندل',
    family: 'عائلة دافئة خشبية',
    topNote: 'البرغموت والفلفل الوردي',
    heartNote: 'العنبر الذهبي واللبان',
    baseNote: 'خشب الصندل والفانيليا المدخنة',
    mood: 'مثالية لأمسيات الاسترخاء وأوقات القراءة الهادئة.',
    productIds: [1, 3],
  },
  {
    id: 'crimson-pomegranate',
    name: 'رمان وعنبر أحمر',
    family: 'عائلة فاكهية شرقية',
    topNote: 'الرمان الأحمر والتوت البري',
    heartNote: 'الورد الدمشقي والقرنفل',
    baseNote: 'العنبر الدافئ وخشب الغاياك',
    mood: 'رائحة غنية تمنح غرف الاستقبال حضورًا فخمًا يدوم.',
    productIds: [2],
  },
  {
    id: 'madagascar-vanilla',
    name: 'فانيليا مدغشقر الدافئة',
    family: 'عائلة ناعمة حلوة',
    topNote: 'الحليب الدافئ واللوز',
    heartNote: 'قرون الفانيليا الطبيعية',
    baseNote: 'المسك الأبيض والكراميل الخفيف',
    mood: 'دفء منزلي حميم يرحب بضيوفك منذ اللحظة الأولى.',
    productIds: [1, 3, 4],
  },
  {
    id: 'taif-oud',
    name: 'ورد طائفي وعود',
    family: 'عائلة زهرية شرقية',
    topNote: 'الزعفران وزهر البرتقال',
    heartNote: 'الورد الطائفي الفاخر',
    baseNote: 'العود المعتق والمسك الناعم',
    mood: 'نفحات كلاسيكية أصيلة تليق بالمناسبات والهدايا.',
    productIds: [2, 3],
  },
];

export interface ScentPollOption {
  id: string;
  name: string;
  notes: string;
  votes: number;
}

export const INITIAL_SCENT_POLL: ScentPollOption[] = [
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

export interface SeasonalOffer {
  active: boolean;
  title: string;
  subtitle: string;
  discountPercent: number;
  productIds: number[];
  endsAt: string;
}

export const INITIAL_SEASONAL_OFFER: SeasonalOffer = {
  active: true,
  title: 'عروض الدفء الشتوية',
  subtitle: 'خصم خاص لفترة محدودة على مختارات الشموع وبوكسات الهدايا',
  discountPercent: 15,
  productIds: [1, 3],
  endsAt: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
};

export interface ProductPricing {
  originalPrice: number;
  finalPrice: number;
  discountPercent: number;
  isDiscounted: boolean;
}

export function getProductPricing(
  product: Product,
  offer?: SeasonalOffer | null,
  nowMs: number = Date.now()
): ProductPricing {
  if (
    !offer ||
    !offer.active ||
    offer.discountPercent <= 0 ||
    offer.discountPercent >= 100 ||
    !offer.productIds.includes(product.id)
  ) {
    return {
      originalPrice: product.price,
      finalPrice: product.price,
      discountPercent: 0,
      isDiscounted: false,
    };
  }

  const endTime = new Date(offer.endsAt).getTime();
  if (!Number.isFinite(endTime) || endTime <= nowMs) {
    return {
      originalPrice: product.price,
      finalPrice: product.price,
      discountPercent: 0,
      isDiscounted: false,
    };
  }

  const finalPrice = Math.max(1, Math.round(product.price * (1 - offer.discountPercent / 100)));
  return {
    originalPrice: product.price,
    finalPrice,
    discountPercent: offer.discountPercent,
    isDiscounted: finalPrice < product.price,
  };
}

export function matchProductSearch(
  product: Product,
  rawQuery: string
): { matched: boolean; reason?: string } {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return { matched: true };

  if (product.name.toLowerCase().includes(q)) {
    return { matched: true, reason: product.categoryLabel };
  }
  if (
    product.subtitle.toLowerCase().includes(q) ||
    product.description.toLowerCase().includes(q) ||
    product.categoryLabel.toLowerCase().includes(q)
  ) {
    return { matched: true, reason: product.subtitle };
  }

  const matchedScent = product.scents.find((s) => s.toLowerCase().includes(q));
  if (matchedScent) {
    return { matched: true, reason: `رائحة: ${matchedScent}` };
  }

  const matchedProfile = SCENT_PROFILES.find(
    (profile) =>
      profile.productIds.includes(product.id) &&
      (profile.name.toLowerCase().includes(q) ||
        profile.family.toLowerCase().includes(q) ||
        profile.topNote.toLowerCase().includes(q) ||
        profile.heartNote.toLowerCase().includes(q) ||
        profile.baseNote.toLowerCase().includes(q))
  );
  if (matchedProfile) {
    return {
      matched: true,
      reason: `نوتات ${matchedProfile.name}: ${matchedProfile.topNote} · ${matchedProfile.heartNote}`,
    };
  }

  return { matched: false };
}

export function formatEGP(amount: number): string {
  return `${amount.toLocaleString('ar-EG')} ج.م`;
}

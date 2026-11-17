// ============================================================================
// ملف الإعدادات الموحّد لمتجر M&M Candle Co.
// القيم الافتراضية هنا تُستخدم كبداية، ويمكن تعديلها مباشرة من لوحة الأدمن
// لتُحفظ تلقائيًا في قاعدة بيانات المتجر وتنعكس فورًا على الواجهة.
// ============================================================================

export type CandleJarType = string;

export interface CustomPerfumeSizeOption {
  id: string;
  ml: number;
  label: string;
  price: number;
  description: string;
}

export interface CustomCandleSizeOption {
  id: string;
  label: string;
  weight: string;
  burnTime: string;
  price: number;
}

export interface CustomCandleColorOption {
  id: string;
  label: string;
  hex: string;
}

export interface CustomCandleJarOption {
  id: string;
  label: CandleJarType;
  extraPrice: number;
  description: string;
}

export interface GovernorateRate {
  name: string;
  zone: string;
  fee: number;
  eta: string;
}

export interface StoreRuntimeConfig {
  whatsappNumber: string;
  lowStockThreshold: number;
  freeShippingThreshold: number;
  giftWrapFee: number;
  governorates: GovernorateRate[];
  customPerfume: {
    sizes: CustomPerfumeSizeOption[];
    suggestedScents: string[];
  };
  customCandle: {
    sizes: CustomCandleSizeOption[];
    colors: CustomCandleColorOption[];
    scents: string[];
    jarTypes: CustomCandleJarOption[];
  };
}

export const DEFAULT_GOVERNORATES: GovernorateRate[] = [
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

export const STORE_CONFIG: StoreRuntimeConfig = {
  // رقم الواتساب بصيغة دولية بدون + أو مسافات
  whatsappNumber: '201117249416',

  // حد التنبيه لانخفاض المخزون (٥ قطع أو أقل)
  lowStockThreshold: 5,

  // الشحن المجاني وتغليف الهدايا
  freeShippingThreshold: 750,
  giftWrapFee: 35,

  governorates: DEFAULT_GOVERNORATES,

  // ==========================================================================
  // إعدادات قسم: اصنع عطرك
  // ==========================================================================
  customPerfume: {
    sizes: [
      { id: '50ml', ml: 50, label: '50 مل', price: 250, description: 'حجم عملي مثالي للتجربة والحقيبة' },
      { id: '100ml', ml: 100, label: '100 مل', price: 350, description: 'الحجم الكلاسيكي الأكثر طلبًا' },
      { id: '150ml', ml: 150, label: '150 مل', price: 450, description: 'يدوم لفترة أطول للاستخدام اليومي' },
      { id: '200ml', ml: 200, label: '200 مل', price: 500, description: 'الحجم الفاخر الاقتصادي' },
    ],

    suggestedScents: [
      'مسك أبيض وفانيليا',
      'عود وعنبر ملكي',
      'سوفاج (عطر مستوحى)',
      'بلاك أوبيوم (عطر مستوحى)',
      'ورد طائفي وخشب الصندل',
      'لافندر وبرغموت',
    ],
  },

  // ==========================================================================
  // إعدادات قسم: اصنع شمعتك
  // ==========================================================================
  customCandle: {
    sizes: [
      {
        id: 'small-120',
        label: 'صغير',
        weight: '١٢٠ جم',
        burnTime: 'حتى ٢٥ ساعة احتراق',
        price: 160,
      },
      {
        id: 'medium-200',
        label: 'متوسط',
        weight: '٢٠٠ جم',
        burnTime: 'حتى ٤٠ ساعة احتراق',
        price: 220,
      },
      {
        id: 'large-320',
        label: 'كبير',
        weight: '٣٢٠ جم',
        burnTime: 'حتى ٦٥ ساعة احتراق',
        price: 300,
      },
    ],

    colors: [
      { id: 'ivory', label: 'كريمي عاجي', hex: '#f7efe3' },
      { id: 'wine', label: 'نبيذي دافئ', hex: '#9b3046' },
      { id: 'blush', label: 'وردي ناعم', hex: '#e5b4bc' },
      { id: 'amber', label: 'كهرماني ذهبي', hex: '#d49334' },
      { id: 'sage', label: 'أخضر مريمي', hex: '#95ab95' },
      { id: 'espresso', label: 'بني قهوة', hex: '#5a3a30' },
    ],

    scents: [
      'فانيليا مدغشقر الدافئة',
      'عنبر وخشب الصندل',
      'زهر اللافندر الهادئ',
      'رمان وعنبر أحمر',
      'ورد طائفي وعود',
      'مسك وزهر البرتقال',
      'كراميل وإسبريسو محمّص',
      'بدون عطر (شمع طبيعي نقي)',
    ],

    jarTypes: [
      {
        id: 'plain',
        label: 'سادة',
        extraPrice: 0,
        description: 'جار زجاجي شفاف كلاسيكي',
      },
      {
        id: 'colored',
        label: 'ملون',
        extraPrice: 25,
        description: 'جار زجاجي ملون بلمسة فاخرة',
      },
      {
        id: 'wood',
        label: 'خشب',
        extraPrice: 45,
        description: 'وعاء خشبي طبيعي يدوم كقطعة ديكور',
      },
    ],
  },
};

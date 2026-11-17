// ============================================================================
// ملف الإعدادات الموحّد لمتجر M&M Candle Co.
// يمكنك تعديل الأسعار، الأحجام، الألوان، الروائح، ونوع الجار بسهولة من هنا.
// ============================================================================

export type CandleJarType = 'سادة' | 'ملون' | 'خشب';

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

export const STORE_CONFIG = {
  // رقم الواتساب بصيغة دولية بدون + أو مسافات
  whatsappNumber: '201117249416',

  // حد التنبيه لانخفاض المخزون (٥ قطع أو أقل)
  lowStockThreshold: 5,

  // الشحن المجاني وتغليف الهدايا
  freeShippingThreshold: 750,
  giftWrapFee: 35,

  // ==========================================================================
  // إعدادات قسم: اصنع عطرك
  // ==========================================================================
  customPerfume: {
    // أحجام وأسعار الزجاجات (تلقائيًا حسب الحجم)
    sizes: [
      { id: '50ml', ml: 50, label: '50 مل', price: 250, description: 'حجم عملي مثالي للتجربة والحقيبة' },
      { id: '100ml', ml: 100, label: '100 مل', price: 350, description: 'الحجم الكلاسيكي الأكثر طلبًا' },
      { id: '150ml', ml: 150, label: '150 مل', price: 450, description: 'يدوم لفترة أطول للاستخدام اليومي' },
      { id: '200ml', ml: 200, label: '200 مل', price: 500, description: 'الحجم الفاخر الاقتصادي' },
    ] as CustomPerfumeSizeOption[],

    // اقتراحات سريعة لمساعدة العميل (اختياري ويمكنه كتابة أي عطر)
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
  // عدّل أسعار الأحجام وإضافات الجار والألوان والروائح من هنا مباشرة
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
    ] as CustomCandleSizeOption[],

    colors: [
      { id: 'ivory', label: 'كريمي عاجي', hex: '#f7efe3' },
      { id: 'wine', label: 'نبيذي دافئ', hex: '#9b3046' },
      { id: 'blush', label: 'وردي ناعم', hex: '#e5b4bc' },
      { id: 'amber', label: 'كهرماني ذهبي', hex: '#d49334' },
      { id: 'sage', label: 'أخضر مريمي', hex: '#95ab95' },
      { id: 'espresso', label: 'بني قهوة', hex: '#5a3a30' },
    ] as CustomCandleColorOption[],

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
    ] as CustomCandleJarOption[],
  },
};

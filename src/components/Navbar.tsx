import { ShoppingBag } from 'lucide-react';

interface NavbarProps {
  cartCount: number;
  onOpenCart: () => void;
}

export function Navbar({ cartCount, onOpenCart }: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#e8dccd] dark:border-[#362722] bg-[#faf6f0]/95 dark:bg-[#16100e]/95 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        <a
          href="#top"
          dir="ltr"
          className="font-brand text-xl sm:text-2xl font-bold tracking-tight text-[#2a1a17] dark:text-[#f3e9df] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#b98a3e] rounded"
        >
          M&amp;M Candle Co.
        </a>

        <nav
          aria-label="التنقل الرئيسي"
          className="hidden md:flex items-center gap-5 text-sm font-medium text-[#6f5a53] dark:text-[#b9a79b]"
        >
          <a
            href="#products"
            className="hover:text-[#2a1a17] dark:hover:text-[#f3e9df] hover:underline underline-offset-8 decoration-[#b98a3e] transition-colors whitespace-nowrap shrink-0"
          >
            المنتجات
          </a>
          <a
            href="#custom-perfume"
            className="hover:text-[#2a1a17] dark:hover:text-[#f3e9df] hover:underline underline-offset-8 decoration-[#b98a3e] transition-colors whitespace-nowrap shrink-0"
          >
            اصنع عطرك
          </a>
          <a
            href="#custom-candle"
            className="hover:text-[#2a1a17] dark:hover:text-[#f3e9df] hover:underline underline-offset-8 decoration-[#b98a3e] transition-colors whitespace-nowrap shrink-0"
          >
            اصنع شمعتك
          </a>
          <a
            href="#atelier"
            className="hover:text-[#2a1a17] dark:hover:text-[#f3e9df] hover:underline underline-offset-8 decoration-[#b98a3e] transition-colors whitespace-nowrap shrink-0"
          >
            العطور
          </a>
          <a
            href="#reviews"
            className="hover:text-[#2a1a17] dark:hover:text-[#f3e9df] hover:underline underline-offset-8 decoration-[#b98a3e] transition-colors whitespace-nowrap shrink-0"
          >
            التقييمات
          </a>
          <a
            href="#track"
            className="hover:text-[#2a1a17] dark:hover:text-[#f3e9df] hover:underline underline-offset-8 decoration-[#b98a3e] transition-colors whitespace-nowrap shrink-0"
          >
            تتبع الطلب
          </a>
          <a
            href="#order"
            className="hover:text-[#2a1a17] dark:hover:text-[#f3e9df] hover:underline underline-offset-8 decoration-[#b98a3e] transition-colors whitespace-nowrap shrink-0"
          >
            اطلب الآن
          </a>
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onOpenCart}
            className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] rounded-full bg-[#9b3046] hover:bg-[#822639] text-white text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b98a3e]"
          >
            <ShoppingBag className="w-4 h-4" aria-hidden="true" />
            <span>السلة</span>
            <span className="tabular-nums">({cartCount.toLocaleString('ar-EG')})</span>
          </button>
        </div>
      </div>
    </header>
  );
}

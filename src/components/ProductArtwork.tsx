import { useEffect, useState } from 'react';
import type { Product } from '../data/catalog';

interface ProductArtworkProps {
  product: Product;
  className?: string;
}

export function ProductArtwork({ product, className = '' }: ProductArtworkProps) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [product.image]);

  if (product.image && !imgError) {
    return (
      <div className={`relative w-full h-full overflow-hidden bg-[#f2e8da] dark:bg-[#2a1f1c] ${className}`}>
        <img
          src={product.image}
          alt={product.name}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
        />
      </div>
    );
  }

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center bg-[#f4ece0] dark:bg-[#271d1a] overflow-hidden ${className}`}
      role="img"
      aria-label={product.name}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-60 dark:opacity-35"
        style={{
          background:
            'radial-gradient(circle at 50% 35%, rgba(185,138,62,0.16), transparent 65%)',
        }}
      />
      {product.slug === 'classic-candle' && <ClassicCandleSvg />}
      {product.slug === 'reed-diffuser' && <ReedDiffuserFallbackSvg />}
      {product.slug === 'gift-box' && <GiftBoxSvg />}
      {product.slug === 'decor-candle' && <DecorCandleSvg />}
    </div>
  );
}

function ClassicCandleSvg() {
  return (
    <svg viewBox="0 0 240 240" className="w-[78%] h-[78%] drop-shadow-sm" fill="none">
      <ellipse cx="120" cy="198" rx="64" ry="10" fill="#d9c6b0" opacity="0.55" />
      {/* Glass Jar */}
      <rect x="66" y="92" width="108" height="104" rx="14" fill="#fffdf9" stroke="#c8a870" strokeWidth="2" />
      <rect x="72" y="98" width="96" height="92" rx="10" fill="#f7efe3" />
      {/* Wax Top Surface */}
      <ellipse cx="120" cy="96" rx="50" ry="9" fill="#fdfaf5" stroke="#dfd0bc" strokeWidth="1.5" />
      {/* Wick & Flame */}
      <path d="M120 94V82" stroke="#3b2621" strokeWidth="2.5" strokeLinecap="round" />
      <path
        d="M120 52C127 64 129 73 120 82C111 73 113 64 120 52Z"
        fill="#d49334"
      />
      <path
        d="M120 62C123.5 68.5 124.5 74 120 79.5C115.5 74 116.5 68.5 120 62Z"
        fill="#fff3c4"
      />
      {/* Brand Label Arch */}
      <rect x="82" y="114" width="76" height="62" rx="8" fill="#fffaf3" stroke="#b98a3e" strokeWidth="1.2" />
      <text
        x="120"
        y="142"
        textAnchor="middle"
        fill="#2a1a17"
        fontSize="16"
        fontWeight="700"
        fontFamily="Cormorant Garamond, Georgia, serif"
      >
        M&amp;M
      </text>
      <text
        x="120"
        y="156"
        textAnchor="middle"
        fill="#8c6d3b"
        fontSize="6.5"
        letterSpacing="1.6"
        fontFamily="Cairo, sans-serif"
      >
        CANDLE CO.
      </text>
      <line x1="94" y1="163" x2="146" y2="163" stroke="#b98a3e" strokeWidth="0.8" />
    </svg>
  );
}

function GiftBoxSvg() {
  return (
    <svg viewBox="0 0 240 240" className="w-[78%] h-[78%] drop-shadow-sm" fill="none">
      <ellipse cx="120" cy="196" rx="76" ry="11" fill="#d9c6b0" opacity="0.55" />
      {/* Box Body */}
      <rect x="52" y="102" width="136" height="90" rx="10" fill="#faf4ea" stroke="#b98a3e" strokeWidth="1.8" />
      {/* Box Lid */}
      <rect x="46" y="84" width="148" height="26" rx="7" fill="#fffdf8" stroke="#b98a3e" strokeWidth="1.8" />
      {/* Burgundy Ribbon Vertical */}
      <rect x="110" y="84" width="20" height="108" fill="#8f2438" />
      {/* Burgundy Ribbon Horizontal */}
      <rect x="52" y="136" width="136" height="16" fill="#8f2438" />
      {/* Gold Trim */}
      <line x1="110" y1="84" x2="110" y2="192" stroke="#d4aa63" strokeWidth="1" />
      <line x1="130" y1="84" x2="130" y2="192" stroke="#d4aa63" strokeWidth="1" />
      {/* Ribbon Bow */}
      <path d="M120 84C102 64 78 66 84 82C89 92 108 88 120 84Z" fill="#7c1d2f" stroke="#5b1220" strokeWidth="1" />
      <path d="M120 84C138 64 162 66 156 82C151 92 132 88 120 84Z" fill="#9c293f" stroke="#5b1220" strokeWidth="1" />
      <circle cx="120" cy="83" r="7" fill="#6b1727" stroke="#d4aa63" strokeWidth="1" />
      {/* Gift Tag */}
      <rect x="142" y="118" width="34" height="44" rx="5" fill="#fffdf9" stroke="#b98a3e" strokeWidth="1.2" />
      <text
        x="159"
        y="141"
        textAnchor="middle"
        fill="#2a1a17"
        fontSize="10"
        fontWeight="700"
        fontFamily="Cormorant Garamond, Georgia, serif"
      >
        M&amp;M
      </text>
      <text x="159" y="152" textAnchor="middle" fill="#8c6d3b" fontSize="5" fontFamily="Cairo, sans-serif">
        GIFT SET
      </text>
    </svg>
  );
}

function DecorCandleSvg() {
  return (
    <svg viewBox="0 0 240 240" className="w-[78%] h-[78%] drop-shadow-sm" fill="none">
      <ellipse cx="120" cy="198" rx="68" ry="10" fill="#d9c6b0" opacity="0.55" />
      {/* Ceramic Tray */}
      <ellipse cx="120" cy="188" rx="62" ry="12" fill="#e6d6c1" stroke="#b98a3e" strokeWidth="1.5" />
      {/* Sculpted Ribbed Pillar Candle */}
      <rect x="84" y="88" width="72" height="98" rx="16" fill="#fcf8f0" stroke="#d4c0a5" strokeWidth="1.6" />
      <path d="M98 92V182" stroke="#eadcc9" strokeWidth="3" strokeLinecap="round" />
      <path d="M112 90V184" stroke="#eadcc9" strokeWidth="3" strokeLinecap="round" />
      <path d="M128 90V184" stroke="#eadcc9" strokeWidth="3" strokeLinecap="round" />
      <path d="M142 92V182" stroke="#eadcc9" strokeWidth="3" strokeLinecap="round" />
      {/* Small Accent Candle */}
      <rect x="136" y="138" width="40" height="48" rx="10" fill="#efe3d2" stroke="#c8b090" strokeWidth="1.4" />
      {/* Wicks & Flames */}
      <path d="M120 88V76" stroke="#3b2621" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M120 46C127 58 128 67 120 76C112 67 113 58 120 46Z" fill="#d49334" />
      <path d="M120 56C123 62 124 68 120 73C116 68 117 62 120 56Z" fill="#fff3c4" />
      <path d="M156 138V130" stroke="#3b2621" strokeWidth="2" strokeLinecap="round" />
      <path d="M156 112C160 119 161 125 156 130C151 125 152 119 156 112Z" fill="#d49334" />
    </svg>
  );
}

function ReedDiffuserFallbackSvg() {
  return (
    <svg viewBox="0 0 240 240" className="w-[78%] h-[78%]" fill="none">
      <line x1="120" y1="100" x2="90" y2="34" stroke="#221714" strokeWidth="4" strokeLinecap="round" />
      <line x1="120" y1="100" x2="108" y2="30" stroke="#221714" strokeWidth="4" strokeLinecap="round" />
      <line x1="120" y1="100" x2="124" y2="30" stroke="#221714" strokeWidth="4" strokeLinecap="round" />
      <line x1="120" y1="100" x2="142" y2="36" stroke="#221714" strokeWidth="4" strokeLinecap="round" />
      <rect x="102" y="88" width="36" height="24" rx="4" fill="#d4aa63" />
      <rect x="74" y="112" width="92" height="86" rx="18" fill="#a63a50" stroke="#7c1d2f" strokeWidth="2" />
      <circle cx="120" cy="156" r="28" fill="#fdf8f0" stroke="#d4aa63" strokeWidth="1.5" />
      <text x="120" y="160" textAnchor="middle" fill="#2a1a17" fontSize="14" fontWeight="700">
        M&amp;M
      </text>
    </svg>
  );
}

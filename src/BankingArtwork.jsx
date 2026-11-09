import React, { useId } from 'react';

export function DigitalBankingArtwork() {
  const title = useId();
  const description = useId();

  return <svg className="banking-artwork" viewBox="0 0 540 350" role="img" aria-labelledby={`${title} ${description}`}>
    <title id={title}>Banking tools at a glance</title>
    <desc id={description}>An illustrated debit card, monthly statement, and transfer tile in Northpoint's colors.</desc>
    <defs>
      <pattern id={`${title}-dots`} width="10" height="10" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1" fill="#8aa2bd" opacity=".32" />
      </pattern>
    </defs>

    <path d="M54 256C30 190 98 85 194 55c101-32 209-32 270 28 52 52 42 134-6 181-67 65-135 39-220 48C149 322 76 318 54 256Z" fill="#e9eff7" />
    <path d="M22 290C88 232 111 133 204 106c99-29 161 70 266 33 25-9 46-25 60-44M19 307c67-59 104-163 194-183 96-22 170 73 270 24 20-10 35-21 50-38M25 327c78-67 110-163 197-186 95-24 172 67 270 17 16-8 28-17 40-28" fill="none" stroke="#a7bcd6" strokeWidth="1" />
    <path d="M33 81h87v73H33zm435 209h58v43h-58z" fill={`url(#${title}-dots)`} />

    <g transform="rotate(5 320 155)">
      <rect x="190" y="34" width="263" height="238" rx="13" fill="#102b3d" opacity=".08" transform="translate(8 9)" />
      <rect x="190" y="34" width="263" height="238" rx="13" fill="#fffdf8" stroke="#c6d4e4" />
      <text x="214" y="68" className="banking-art-title">Statement</text>
      <text x="214" y="86" className="banking-art-caption">Monthly activity</text>
      <path d="M214 112h214m-214 27h214m-214 27h214" stroke="#dde3ec" />
      <path d="M215 163l30-12 34 5 34-19 32 3 37-17 45 3v44H215z" fill="#e4eefb" />
      <path d="M215 163l30-12 34 5 34-19 32 3 37-17 45 3" fill="none" stroke="#2f6fd0" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="427" cy="126" r="3.6" fill="#2f6fd0" />
      <path d="M214 188h214m-214 29h214m-214 28h214" stroke="#e3e8ef" />
      <path d="M232 203h62m-62 29h48m118-29h25m-31 29h31" stroke="#9fb4cf" strokeWidth="3" strokeLinecap="round" />
      <circle cx="220" cy="203" r="3" fill="#5f7fb0" /><circle cx="220" cy="232" r="3" fill="#a69776" />
    </g>

    <g transform="rotate(-10 166 223)">
      <rect x="49" y="150" width="226" height="133" rx="15" fill="#102b3d" opacity=".13" transform="translate(4 7)" />
      <rect x="49" y="150" width="226" height="133" rx="15" fill="#153445" />
      <path d="M69 185c7 0 9-12 16-12s10 12 18 12m-34-7c7 0 9-12 16-12s10 12 18 12" stroke="#bcd6f5" strokeWidth="1.7" fill="none" strokeLinecap="round" />
      <text x="113" y="182" className="banking-art-brand">Northpoint</text>
      <rect x="71" y="208" width="31" height="23" rx="4" fill="#e3d8b9" />
      <path d="M71 216h10l3 3h5l4-3h9m-31 7h10l3-4m18 4h-9l-4-4m-5-11v7m5-7v7" stroke="#9b8d6c" strokeWidth="1" fill="none" />
      <path d="M148 256c48-14 71-47 109-43m-110 53c48-14 72-47 110-43m-110 53c48-14 72-47 110-43" stroke="#9fc0e0" opacity=".46" fill="none" />
      <text x="71" y="257" className="banking-art-card-caption">DEBIT CARD</text>
    </g>

    <g>
      <rect x="346" y="238" width="162" height="65" rx="12" fill="#102b3d" opacity=".09" transform="translate(4 6)" />
      <rect x="346" y="238" width="162" height="65" rx="12" fill="#fffdf8" stroke="#c6d4e4" />
      <rect x="360" y="253" width="34" height="34" rx="9" fill="#e4eefb" />
      <path d="M367 265h19m-5-4 5 4-5 4m6 6h-19m5-4-5 4 5 4" stroke="#2f6fd0" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <text x="404" y="267" className="banking-art-tile">Transfers</text>
      <text x="404" y="283" className="banking-art-caption">Review &amp; send</text>
    </g>
  </svg>;
}

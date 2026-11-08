import React from 'react';

const shapes = {
  logo: 'M3 16c4 0 5-9 9-9s5 9 9 9M3 11c4 0 5-7 9-7s5 7 9 7M3 20h18',
  shield: 'M12 22s7-3.5 7-10V5l-7-3-7 3v7c0 6.5 7 10 7 10zM9 12l2 2 4-4',
  card: 'M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM3 10h18M7 15h4',
  savings: 'M6 9a6 6 0 0 1 5-2h3l3-2v4l3 2h2v5h-3l-2 4h-3v-2H9v2H6l-2-4v-3L2 11m14 1h.01M9 4h4',
  house: 'm2 11 10-8 10 8m-18-1v11h6v-7h4v7h6V10',
  plane: 'm3 8 7 2 6-6c2-2 5-2 4 1l-5 7 2 8-2 1-4-6-4 3 1 3H6l-2-4-3-2v-2l3 1 3-3-6-2z',
  car: 'M3 16v-5l3-5h12l3 5v5M3 11h18M5 16h14M5 16v2m14-2v2M7 13h1m8 0h1',
  search: 'M10.5 3a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15zm5.4 13 5.1 5.1',
  book: 'M12 6c-3-2-6-2-10-1v14c4-1 7-1 10 1 3-2 6-2 10-1V5c-4-1-7-1-10 1zm0 0v14',
  chart: 'M3 3v17h18M7 15l4-5 4 3 6-7',
  briefcase: 'M3 7h18v13H3zM8 7V4h8v3M3 12h18M8 11v3m8-3v3',
  arrow: 'M4 12h15m-6-6 6 6-6 6',
  chevron: 'm9 5 7 7-7 7',
  send: 'M3 8h17m-5-5 5 5-5 5m6 3H4m5-5-5 5 5 5',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  down: 'M12 4v15m-6-6 6 6 6-6',
  check: 'm5 12 4 4L19 6',
  lock: 'M6 10h12v11H6zM8 10V7a4 4 0 0 1 8 0v3m-4 4v3',
  info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 8v5m0-8h.01',
  menu: 'M4 6h16M4 12h16M4 18h16',
  grid: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  users: 'M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M14 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zm7 14v-2a4 4 0 0 0-3-4m-1-12a4 4 0 0 1 0 8',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zm0-15v5l4 2',
  plus: 'M12 5v14M5 12h14',
  download: 'M12 3v12m-4-4 4 4 4-4M5 16v4h14v-4',
  bell: 'M5 17h14l-2-4V9a5 5 0 0 0-10 0v4l-2 4zm5 3a2 2 0 0 0 4 0',
};

export function Icon({ name, className }) {
  return <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={shapes[name]} /></svg>;
}

export function MobileBankingArt() {
  return <svg className="hero-art" viewBox="0 0 405 390" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id="halo" x1="58" y1="24" x2="329" y2="357" gradientUnits="userSpaceOnUse"><stop stopColor="#8AE0F6" /><stop offset="1" stopColor="#DFF8FF" /></linearGradient>
      <linearGradient id="debit" x1="29" y1="178" x2="179" y2="298" gradientUnits="userSpaceOnUse"><stop stopColor="#B0F1CC" /><stop offset="1" stopColor="#40DAB4" /></linearGradient>
      <pattern id="dot-grid" width="11" height="11" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.15" fill="#0955A9" fillOpacity=".35" /></pattern>
    </defs>
    <circle cx="206" cy="195" r="153" fill="url(#halo)" />
    <circle cx="206" cy="195" r="172" stroke="#A8E8F9" strokeOpacity=".56" />
    <path d="M25 262c41 30 125 42 226 23 72-14 117-42 133-64M61 118c55-53 165-73 259-36M42 137c-13 18-22 37-26 54" stroke="#E5FAFF" strokeWidth="1.35" strokeDasharray="3 7" />
    <path d="M232 318h87v-51h-87zM72 103h57V67H72z" fill="url(#dot-grid)" />
    <circle cx="74" cy="147" r="6" fill="#BAF2D2" /><circle cx="325" cy="118" r="5" fill="#0755A7" /><circle cx="349" cy="250" r="4" fill="#B9F8DD" />
    <path d="M337 58v24m-12-12h24M39 198v16m-8-8h16M103 315v18m-9-9h18" stroke="#E1FAFF" strokeWidth="2" strokeLinecap="round" />
    <g transform="rotate(11 225 188)">
      <rect x="153" y="57" width="151" height="266" rx="26" fill="#104778" fillOpacity=".23" transform="translate(9 10)" />
      <rect x="153" y="57" width="151" height="266" rx="26" fill="#102744" />
      <rect x="162" y="67" width="133" height="246" rx="19" fill="#F5FBFF" />
      <rect x="208" y="73" width="41" height="6" rx="3" fill="#102744" />
      <circle cx="182" cy="96" r="7" fill="#0566C4" /><path d="M180 96h4m-2-2v4" stroke="#E7F7FF" strokeLinecap="round" />
      <path d="M196 94h37m-37 5h22" stroke="#A1BCD4" strokeWidth="2" strokeLinecap="round" />
      <rect x="174" y="113" width="109" height="73" rx="10" fill="#085BB2" />
      <path d="M185 166c8-4 12-19 22-15s16 6 23-3 12-6 18-4 11-2 23-12" stroke="#8EF1CA" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M185 126h38m-38 7h26" stroke="#D7EDFF" strokeWidth="2" strokeLinecap="round" />
      <path d="M177 205h54m-54 34h54" stroke="#C7D9E9" strokeWidth="2" strokeLinecap="round" />
      <circle cx="185" cy="219" r="8" fill="#E1F7EB" /><circle cx="185" cy="253" r="8" fill="#DDEEFF" />
      <path d="M199 217h33m-33 5h23m-23 29h33m-33 5h23" stroke="#9CB7D0" strokeWidth="2" strokeLinecap="round" />
      <path d="M255 219h23m-23 34h23M210 298h36" stroke="#1C4D79" strokeWidth="2.5" strokeLinecap="round" />
    </g>
    <g transform="rotate(-13 133 241)">
      <rect x="58" y="197" width="150" height="90" rx="13" fill="#153C64" fillOpacity=".24" transform="translate(4 7)" />
      <rect x="58" y="197" width="150" height="90" rx="13" fill="url(#debit)" />
      <path d="M175 198c-30 18-39 49-73 89h94c7 0 12-5 12-12v-65c0-8-5-12-12-12z" fill="#119B8B" fillOpacity=".18" />
      <path d="M72 215h32m-32 5h22" stroke="#105549" strokeWidth="2" strokeLinecap="round" />
      <rect x="73" y="236" width="25" height="17" rx="3" fill="#F0F9C9" stroke="#4FA291" />
      <path d="M81 236v17m8-17v17m-16-8h25" stroke="#77AF93" />
      <path d="M74 269h32m9 0h16" stroke="#1C7268" strokeWidth="3" strokeLinecap="round" />
      <circle cx="176" cy="260" r="9" fill="#157466" /><circle cx="186" cy="260" r="9" fill="#267F71" fillOpacity=".65" />
    </g>
    <circle cx="328" cy="175" r="25" fill="#1063AF" /><circle cx="325" cy="172" r="24" fill="#DDF9D0" />
    <path d="m316 172 6 6 12-13" stroke="#165A5F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>;
}

export function FeatureArt({ variant }) {
  if (variant === 'transfer') return <svg viewBox="0 0 540 330" role="img" aria-label="Illustration of a transfer between two accounts">
    <rect width="540" height="330" rx="26" fill="#DCEEFF" />
    <circle cx="414" cy="96" r="90" fill="#BFDDFA" /><circle cx="106" cy="258" r="63" fill="#C5F2E6" />
    <path d="M115 139c51-58 107-76 166-41s115 47 167-8M123 259c72-36 108-31 173-11 54 17 99 5 142-32" fill="none" stroke="#7CAEE3" strokeDasharray="5 8" />
    <g transform="rotate(-9 160 155)"><rect x="65" y="95" width="176" height="108" rx="15" fill="#0C59AA" /><rect x="81" y="113" width="26" height="20" rx="4" fill="#98DCFF" /><path d="M84 165h70m-70 12h36" stroke="#D8F0FF" strokeWidth="4" strokeLinecap="round" /></g>
    <g transform="rotate(8 380 190)"><rect x="299" y="135" width="176" height="108" rx="15" fill="#0F2C4E" /><rect x="315" y="153" width="26" height="20" rx="4" fill="#93F0C5" /><path d="M318 205h70m-70 12h36" stroke="#D8F0FF" strokeWidth="4" strokeLinecap="round" /></g>
    <circle cx="271" cy="164" r="39" fill="#F5FCFF" stroke="#95C2EF" /><path d="M252 157h36l-9-9m9 9-9 9m10 7h-36l9 9m-9-9 9-9" fill="none" stroke="#0966C4" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>;
  return <svg viewBox="0 0 540 330" role="img" aria-label="Illustration of a savings plan and spending chart">
    <rect width="540" height="330" rx="26" fill="#E2F5EF" />
    <circle cx="169" cy="157" r="112" fill="#CBEDDF" /><circle cx="410" cy="220" r="75" fill="#BBE4DA" />
    <path d="M67 263c45-17 97-21 152-10 76 15 140 5 247-54" fill="none" stroke="#78B8AB" strokeDasharray="5 8" />
    <g transform="rotate(-8 226 164)"><rect x="123" y="72" width="206" height="182" rx="16" fill="#FAFFFD" stroke="#92C9B9" /><path d="M147 111h87m-87 11h46" stroke="#328376" strokeWidth="4" strokeLinecap="round" /><path d="M148 221h152" stroke="#C5DFD8" strokeWidth="2" /><rect x="159" y="181" width="23" height="40" rx="4" fill="#9DDACC" /><rect x="195" y="165" width="23" height="56" rx="4" fill="#72C7B4" /><rect x="231" y="151" width="23" height="70" rx="4" fill="#40A995" /><rect x="267" y="133" width="23" height="88" rx="4" fill="#12796E" /></g>
    <g transform="rotate(12 373 181)"><rect x="324" y="112" width="106" height="141" rx="13" fill="#113E56" /><circle cx="377" cy="160" r="23" fill="#B7EED1" /><path d="m366 160 7 7 15-16M349 198h54m-54 13h38" fill="none" stroke="#DDF8ED" strokeWidth="3" strokeLinecap="round" /><path d="m366 160 7 7 15-16" fill="none" stroke="#1E786C" strokeWidth="3" strokeLinecap="round" /></g>
  </svg>;
}

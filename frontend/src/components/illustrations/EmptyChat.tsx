export function EmptyChat({ className }: { className?: string }) {
  return (
    <svg width="160" height="120" viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <rect x="20" y="20" width="80" height="50" rx="10" fill="#6366f1" fillOpacity="0.08" stroke="#6366f1" strokeOpacity="0.3" strokeWidth="1.5"/>
      <path d="M30 70 L20 85 L45 75 Z" fill="#6366f1" fillOpacity="0.2" stroke="#6366f1" strokeOpacity="0.2" strokeWidth="1"/>
      <line x1="33" y1="38" x2="87" y2="38" stroke="#6366f1" strokeOpacity="0.5" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="33" y1="48" x2="75" y2="48" stroke="#6366f1" strokeOpacity="0.5" strokeWidth="1.5" strokeLinecap="round"/>
      <rect x="60" y="55" width="80" height="45" rx="10" fill="#a855f7" fillOpacity="0.08" stroke="#a855f7" strokeOpacity="0.3" strokeWidth="1.5"/>
      <path d="M130 100 L140 110 L115 105 Z" fill="#a855f7" fillOpacity="0.2" stroke="#a855f7" strokeOpacity="0.2" strokeWidth="1"/>
      <line x1="73" y1="70" x2="127" y2="70" stroke="#a855f7" strokeOpacity="0.5" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="73" y1="80" x2="110" y2="80" stroke="#a855f7" strokeOpacity="0.5" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="138" cy="25" r="5" fill="#14b8a6" fillOpacity="0.4"/>
      <circle cx="148" cy="30" r="3" fill="#14b8a6" fillOpacity="0.3"/>
      <circle cx="143" cy="40" r="4" fill="#14b8a6" fillOpacity="0.2"/>
    </svg>
  );
}

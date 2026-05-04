export function EmptyInvitations({ className }: { className?: string }) {
  return (
    <svg width="160" height="120" viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <rect x="20" y="30" width="120" height="75" rx="8" fill="#6366f1" fillOpacity="0.06" stroke="#6366f1" strokeOpacity="0.25" strokeWidth="1.5"/>
      <path d="M20 42 L80 72 L140 42" stroke="#6366f1" strokeOpacity="0.4" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="20" y="30" width="120" height="14" rx="8" fill="#6366f1" fillOpacity="0.12"/>
      <circle cx="130" cy="38" r="10" fill="#f59e0b" fillOpacity="0.15" stroke="#f59e0b" strokeOpacity="0.5" strokeWidth="1.5"/>
      <line x1="130" y1="34" x2="130" y2="42" stroke="#f59e0b" strokeOpacity="0.8" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="126" y1="38" x2="134" y2="38" stroke="#f59e0b" strokeOpacity="0.8" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

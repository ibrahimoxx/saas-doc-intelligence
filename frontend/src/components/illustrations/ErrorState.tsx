export function ErrorState({ className }: { className?: string }) {
  return (
    <svg width="160" height="120" viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <path d="M80 15 L145 110 L15 110 Z" fill="#ef4444" fillOpacity="0.06" stroke="#ef4444" strokeOpacity="0.25" strokeWidth="1.5" strokeLinejoin="round"/>
      <line x1="80" y1="50" x2="80" y2="80" stroke="#ef4444" strokeOpacity="0.5" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="80" cy="93" r="3" fill="#ef4444" fillOpacity="0.6"/>
      <circle cx="30" cy="25" r="5" fill="#f59e0b" fillOpacity="0.2"/>
      <circle cx="140" cy="35" r="4" fill="#a855f7" fillOpacity="0.2"/>
      <circle cx="145" cy="105" r="6" fill="#6366f1" fillOpacity="0.15"/>
    </svg>
  );
}

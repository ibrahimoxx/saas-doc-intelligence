export function NotFound({ className }: { className?: string }) {
  return (
    <svg width="200" height="150" viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <text x="10" y="110" fontFamily="Outfit, sans-serif" fontWeight="900" fontSize="100" fill="#6366f1" fillOpacity="0.06" letterSpacing="-8">404</text>
      <circle cx="100" cy="75" r="35" fill="#6366f1" fillOpacity="0.06" stroke="#6366f1" strokeOpacity="0.2" strokeWidth="1.5"/>
      <line x1="82" y1="57" x2="118" y2="93" stroke="#6366f1" strokeOpacity="0.4" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="118" y1="57" x2="82" y2="93" stroke="#6366f1" strokeOpacity="0.4" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="155" cy="30" r="6" fill="#a855f7" fillOpacity="0.3"/>
      <circle cx="45" cy="120" r="4" fill="#14b8a6" fillOpacity="0.3"/>
      <circle cx="170" cy="110" r="8" fill="#f59e0b" fillOpacity="0.2"/>
    </svg>
  );
}

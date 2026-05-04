export function EmptyActivity({ className }: { className?: string }) {
  return (
    <svg width="160" height="120" viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <rect x="15" y="25" width="130" height="12" rx="6" fill="#6366f1" fillOpacity="0.08" stroke="#6366f1" strokeOpacity="0.2" strokeWidth="1"/>
      <rect x="15" y="45" width="100" height="12" rx="6" fill="#a855f7" fillOpacity="0.08" stroke="#a855f7" strokeOpacity="0.2" strokeWidth="1"/>
      <rect x="15" y="65" width="115" height="12" rx="6" fill="#14b8a6" fillOpacity="0.08" stroke="#14b8a6" strokeOpacity="0.2" strokeWidth="1"/>
      <rect x="15" y="85" width="85" height="12" rx="6" fill="#6366f1" fillOpacity="0.08" stroke="#6366f1" strokeOpacity="0.2" strokeWidth="1"/>
      <circle cx="8" cy="31" r="4" fill="#6366f1" fillOpacity="0.4"/>
      <circle cx="8" cy="51" r="4" fill="#a855f7" fillOpacity="0.4"/>
      <circle cx="8" cy="71" r="4" fill="#14b8a6" fillOpacity="0.4"/>
      <circle cx="8" cy="91" r="4" fill="#6366f1" fillOpacity="0.4"/>
      <circle cx="135" cy="25" r="10" fill="#f59e0b" fillOpacity="0.15" stroke="#f59e0b" strokeOpacity="0.4" strokeWidth="1.5"/>
      <line x1="135" y1="21" x2="135" y2="29" stroke="#f59e0b" strokeOpacity="0.7" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="131" y1="25" x2="139" y2="25" stroke="#f59e0b" strokeOpacity="0.7" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

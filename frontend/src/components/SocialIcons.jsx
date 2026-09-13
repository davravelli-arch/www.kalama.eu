export const InstagramIcon = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <defs>
      <radialGradient id="ig-grad" cx="30%" cy="107%" r="150%">
        <stop offset="0%" stopColor="#FDF497" />
        <stop offset="5%" stopColor="#FDF497" />
        <stop offset="45%" stopColor="#FD5949" />
        <stop offset="60%" stopColor="#D6249F" />
        <stop offset="90%" stopColor="#285AEB" />
      </radialGradient>
    </defs>
    <rect x="2" y="2" width="20" height="20" rx="5.5" fill="url(#ig-grad)" />
    <circle cx="12" cy="12" r="4.2" fill="none" stroke="#fff" strokeWidth="1.8" />
    <circle cx="17.3" cy="6.7" r="1.2" fill="#fff" />
    <rect x="2" y="2" width="20" height="20" rx="5.5" fill="none" stroke="#fff" strokeWidth="1.6" opacity="0" />
    <rect x="4.2" y="4.2" width="15.6" height="15.6" rx="4" fill="none" stroke="#fff" strokeWidth="1.8" />
  </svg>
);

export const FacebookIcon = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="11" fill="#1877F2" />
    <path fill="#fff" d="M13.4 21.5v-7.2h2.4l.4-2.9h-2.8V9.6c0-.8.3-1.4 1.4-1.4h1.5V5.6c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.1H8v2.9h2.4v7.2h3z" />
  </svg>
);

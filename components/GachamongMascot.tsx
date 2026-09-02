export function GachamongMascot({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="mBody" cx="40%" cy="28%" r="80%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="60%" stopColor="#fff8ec" />
          <stop offset="100%" stopColor="#e9dcc2" />
        </radialGradient>
      </defs>
      <ellipse cx="100" cy="176" rx="46" ry="8" fill="#0f0a1e" opacity=".25" />
      <path
        d="M60 108 C42 108 34 88 46 74 C36 56 50 34 72 34 C78 14 100 4 118 16 C138 6 160 22 156 44 C176 50 180 76 162 88 C170 108 152 128 132 122 C130 148 112 162 96 162 C78 162 62 148 60 124 C52 122 48 114 60 108 Z"
        fill="url(#mBody)"
        stroke="#e9dcc2"
        strokeWidth="2"
      />
      <ellipse cx="72" cy="108" rx="24" ry="16" fill="#ffb9cf" opacity=".55" />
      <ellipse cx="128" cy="108" rx="24" ry="16" fill="#ffb9cf" opacity=".55" />
      <circle cx="78" cy="94" r="6.5" fill="#3a2c22" />
      <circle cx="122" cy="94" r="6.5" fill="#3a2c22" />
      <path d="M83 116 Q100 132 117 116" fill="none" stroke="#3a2c22" strokeWidth="4.5" strokeLinecap="round" />
    </svg>
  );
}

type P = { className?: string };

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function BoxIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path {...stroke} d="M3 8h18v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8Z" />
      <path {...stroke} d="M3 8 5 4h14l2 4" />
      <path {...stroke} d="M10 12h4" />
    </svg>
  );
}

export function CameraIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        {...stroke}
        d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"
      />
      <circle {...stroke} cx="12" cy="13.5" r="3.5" />
    </svg>
  );
}

export function SearchIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <circle {...stroke} cx="11" cy="11" r="6.5" />
      <path {...stroke} d="m16 16 4.5 4.5" />
    </svg>
  );
}

export function GearIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <circle {...stroke} cx="12" cy="12" r="3" />
      <path
        {...stroke}
        d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 9 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z"
      />
    </svg>
  );
}

export function PlusIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path {...stroke} d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function ChevronLeft({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path {...stroke} d="m14.5 5-7 7 7 7" />
    </svg>
  );
}

export function CheckIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path {...stroke} d="m5 12.5 4.5 4.5L19 7" />
    </svg>
  );
}

export function PhotoIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <rect {...stroke} x="3" y="5" width="18" height="14" rx="2" />
      <circle {...stroke} cx="8.5" cy="10" r="1.5" />
      <path {...stroke} d="m4 17 5-4.5 4 3.5 3-2.5 4 3.5" />
    </svg>
  );
}

export function LinkIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path {...stroke} d="M10 13.5a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 1 0-5-5l-1.5 1.5" />
      <path {...stroke} d="M14 10.5a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 1 0 5 5l1.5-1.5" />
    </svg>
  );
}

export function PencilIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path {...stroke} d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z" />
      <path {...stroke} d="m14 6 4 4" />
    </svg>
  );
}

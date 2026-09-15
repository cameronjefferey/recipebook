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

export function ChevronRight({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path {...stroke} d="m9.5 5 7 7-7 7" />
    </svg>
  );
}

export function BookIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        {...stroke}
        d="M12 6.8C10.6 5.3 8.6 4.7 4 4.7v12.6c4.6 0 6.6.6 8 2 1.4-1.4 3.4-2 8-2V4.7c-4.6 0-6.6.6-8 2.1Z"
      />
      <path {...stroke} d="M12 6.8v12.5" />
    </svg>
  );
}

/** Rolled for inspiration, when nothing in particular is wanted. */
export function DieIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <rect {...stroke} x="4" y="4" width="16" height="16" rx="3.5" />
      <circle cx="9" cy="9" r="1.4" fill="currentColor" />
      <circle cx="15" cy="15" r="1.4" fill="currentColor" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" />
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

/** Two dots joined to a third: a book passed to somebody. */
export function ShareIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <circle {...stroke} cx="18" cy="5.5" r="2.5" />
      <circle {...stroke} cx="6" cy="12" r="2.5" />
      <circle {...stroke} cx="18" cy="18.5" r="2.5" />
      <path {...stroke} d="m8.2 10.8 7.6-4M8.2 13.2l7.6 4" />
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

export function CalendarIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <rect {...stroke} x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path {...stroke} d="M3.5 9.5h17" />
      <path {...stroke} d="M8 3v4M16 3v4" />
    </svg>
  );
}

/** A grocery basket, for the list that comes out of the week's plan. */
export function CartIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path {...stroke} d="M4 8h16l-1.6 9.2a2 2 0 0 1-2 1.8H7.6a2 2 0 0 1-2-1.8L4 8Z" />
      <path {...stroke} d="M8 8 9.5 4h5L16 8" />
      <path {...stroke} d="M9.5 12v4M14.5 12v4" />
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

/* ============================== stand-ins for a recipe with no photo yet */

/** Mains: a pot, lid slightly askew from whatever's simmering under it. */
export function PotIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path {...stroke} d="M5 11h14v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4v-5Z" />
      <path {...stroke} d="M3.5 11h17M2 8.5l2 1M22 8.5l-2 1" />
      <path {...stroke} d="M12 5.5c.9-1 2.2-1 2.6 0" />
    </svg>
  );
}

/** Desserts: a cupcake, one swirl of frosting and a cherry on top. */
export function CupcakeIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path {...stroke} d="M6.5 12h11l-1.3 7.2a2 2 0 0 1-2 1.8h-4.4a2 2 0 0 1-2-1.8L6.5 12Z" />
      <path {...stroke} d="M7 12a5 5 0 0 1 10 0" />
      <circle cx="12" cy="4.3" r="1.1" fill="currentColor" />
    </svg>
  );
}

/** Salads: a bowl with a leaf and a tomato tossed in. */
export function SaladIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path {...stroke} d="M3.5 12h17a7.5 7.5 0 0 1-15 4.5A7.5 7.5 0 0 1 3.5 12Z" />
      <path {...stroke} d="M9 12c-.5-2.3.5-4 2.5-4.6M13.5 12c1-1.6.9-3.3-.3-4.6" />
      <circle cx="15.5" cy="9.3" r="1.2" fill="currentColor" />
    </svg>
  );
}

/** Soups: a bowl with a little steam rising off it. */
export function SoupIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path {...stroke} d="M4 12h16a6 6 0 0 1-12 0H4Z" />
      <path {...stroke} d="M4 12a2 2 0 0 1 0-4" />
      <path {...stroke} d="M10 4.5c-1 1-1 1.8 0 2.8M14 4.5c-1 1-1 1.8 0 2.8" />
    </svg>
  );
}

/** Breads: a loaf, scored the way a real one is before it goes in. */
export function BreadIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        {...stroke}
        d="M4 13c0-4 2.5-7 8-7s8 3 8 7-2 5-8 5-8-1-8-5Z"
      />
      <path {...stroke} d="M9 8.5c-.6 1.4-.6 3 0 4.3M15 8.5c.6 1.4.6 3 0 4.3" />
    </svg>
  );
}

/** Drinks: a glass, a straw leaning against the rim. */
export function DrinkIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path {...stroke} d="M7.5 8h9l-1.2 10.3a2 2 0 0 1-2 1.7h-2.6a2 2 0 0 1-2-1.7L7.5 8Z" />
      <path {...stroke} d="M6.5 8h11M16 4.5 12.5 8" />
    </svg>
  );
}

/** Sauces: a jar with a lid, the kind a batch gets put up in. */
export function JarIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path {...stroke} d="M6.5 9.5h11V18a2.5 2.5 0 0 1-2.5 2.5h-6A2.5 2.5 0 0 1 6.5 18V9.5Z" />
      <path {...stroke} d="M8 9.5V6a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v3.5" />
      <path {...stroke} d="M9.5 5V3.8M14.5 5V3.8" />
    </svg>
  );
}

/** Snacks: a wedge, bitten — this one didn't last long. */
export function SnackIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path {...stroke} d="M12 4 4 20h16L12 4Z" />
      <path {...stroke} d="M12 9.5v6.5M9 12l6 1.5M9 15l6-1.5" />
    </svg>
  );
}

/** Breakfast: an egg, sunny side up in the pan. */
export function EggIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path {...stroke} d="M4 15a8 5 0 0 1 16 0 8 5 0 0 1-16 0Z" />
      <circle {...stroke} cx="13" cy="14.3" r="3" />
    </svg>
  );
}

/** Sides: a small plate, set beside the main event. */
export function SidePlateIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <circle {...stroke} cx="12" cy="12" r="8" />
      <circle {...stroke} cx="12" cy="12" r="4" />
    </svg>
  );
}

/** No category at all, or one that named nothing above: a fork and spoon. */
export function UtensilsIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path {...stroke} d="M7 3v7a2 2 0 1 0 4 0V3M9 10v11" />
      <path {...stroke} d="M16 3c-1.4 0-2.5 1.8-2.5 5s1.1 4 2.5 4v9" />
    </svg>
  );
}

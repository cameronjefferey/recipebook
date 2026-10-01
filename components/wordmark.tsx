export function Wordmark({ size = "lg" }: { size?: "sm" | "lg" }) {
  const big = size === "lg";
  return (
    <div className="text-center">
      <div
        className={`font-display leading-tight text-ink ${
          big ? "text-[2.4rem]" : "text-xl"
        }`}
      >
        The Pink Recipe Box
      </div>
      {big ? (
        <div className="hand mt-1 text-browned">every recipe worth keeping</div>
      ) : null}
    </div>
  );
}

/** The lid of the box, used as a decorative rule. */
export function BoxRule() {
  return (
    <div className="my-6 flex items-center gap-3">
      <span className="h-px flex-1 bg-line" />
      <span className="h-1.5 w-1.5 bg-ink" />
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

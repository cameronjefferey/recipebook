type Line = { text: string; uncertain: boolean };

export function LineEditor({
  label,
  hint,
  lines,
  multiline,
  onChange,
  onRemove,
  onAdd,
}: {
  label: string;
  hint?: string;
  lines: Line[];
  multiline?: boolean;
  onChange: (index: number, text: string) => void;
  onRemove: (index: number) => void;
  onAdd: () => void;
}) {
  return (
    <div>
      <span className="mb-1.5 block text-[0.8rem] font-bold tracking-wide text-browned uppercase">
        {label}
      </span>
      {hint ? <p className="mb-2 text-[0.85rem] text-muted">{hint}</p> : null}

      <ul className="space-y-2">
        {lines.map((line, j) => {
          const heading = line.text.trim().startsWith("#");
          return (
            <li key={j} className="flex items-start gap-2">
              {multiline ? (
                <textarea
                  value={line.text}
                  rows={2}
                  onChange={(e) => onChange(j, e.target.value)}
                  className={`min-h-12 flex-1 rounded-xl border bg-page px-3 py-2 text-[1rem] focus:outline-none ${
                    line.uncertain
                      ? "border-butter bg-butter/15 focus:border-pink"
                      : "border-line focus:border-pink"
                  }`}
                />
              ) : (
                <input
                  value={line.text}
                  onChange={(e) => onChange(j, e.target.value)}
                  className={`h-12 flex-1 rounded-xl border bg-page px-3 text-[1rem] focus:outline-none ${
                    heading ? "font-bold" : ""
                  } ${
                    line.uncertain
                      ? "border-butter bg-butter/15 focus:border-pink"
                      : "border-line focus:border-pink"
                  }`}
                />
              )}
              <button
                type="button"
                onClick={() => onRemove(j)}
                aria-label={`Remove line ${j + 1}`}
                className="tap shrink-0 text-muted"
              >
                ×
              </button>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={onAdd}
        className="tap mt-2 inline-flex items-center text-[0.95rem] font-bold text-pink"
      >
        Add a line
      </button>
    </div>
  );
}

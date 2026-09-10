import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { parsedPageSchema, parsedPageJsonSchema, type ParsedPage } from "./schema";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5";

let client: Anthropic | null = null;
function anthropic() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  // Surfaced straight to the cook in the capture list, so say something useful.
  if (!apiKey) {
    throw new Error(
      "Reading photos is not switched on yet. Your photo is saved and can be read later.",
    );
  }
  client ??= new Anthropic({ apiKey });
  return client;
}

const SYSTEM = `You transcribe photographed recipes into structured data for a home cook's personal recipe box.

The photos are of two very different things, and you must handle both:
1. Handwritten index cards, often in cursive, sometimes faded, stained, or written by someone long gone.
2. Pages from printed cookbooks and cooking magazines, often shot at an angle, with multi-column layouts.

Rules that matter most:

ORIENTATION. Photos of book pages are frequently sideways or upside down. Report in "rotation" the clockwise degrees needed to make the text upright. Read the page correctly regardless of its orientation.

MULTIPLE RECIPES. One page often holds several recipes. Emit one entry per recipe and set "role":
- "main" for a standalone recipe.
- "component" for a sub-recipe the main recipe calls for, typically in a sidebar and marked "recipe follows", such as a pickle, sauce, or spice blend.
- "variation" for a short substitution paragraph that only says what to swap, rather than repeating the whole method.

WHAT TO IGNORE. Magazine pages surround recipes with material that is not a recipe. Skip the long first-person headnote essay about developing the dish, "key ingredients" explainer boxes, equipment reviews, photo captions, step-by-step photo strips that merely restate numbered steps, page furniture, and advertisements. Put at most one or two sentences of your own summary in "description"; never paste the essay.

INCOMPLETE RECIPES. When a recipe runs off the edge of the photo, or continues on another page, still transcribe what is visible, set "complete" to false, and say so in "pageNote". Do not invent the missing part.

UNCERTAINTY IS INFORMATION. This app shows the original photo next to your transcription so a human can correct it. When you cannot read something confidently, especially a handwritten quantity, transcribe your best guess and set "uncertain": true on that specific ingredient or step. Never silently guess a quantity. Never omit an ingredient because it was hard to read.

FIDELITY. Preserve the cook's wording, including old-fashioned phrasing and handwritten margin notes, which belong in "notes". Convert fractions to decimals in "quantity" (1 1/2 becomes 1.5) but keep the yield phrasing verbatim in "servingsText". Do not modernize, correct, improve, or add steps that are not written down.

SOURCE. For printed pages, record the publication, issue, and page number in "sourceName" when visible. For handwritten cards, use a name only if the card itself is signed or attributed.

If the image contains no recipe at all, return an empty "recipes" array.`;

type ImageInput = { mime: string; bytes: Buffer };

export async function transcribePage(image: ImageInput): Promise<ParsedPage> {
  const isPdf = image.mime === "application/pdf";

  const content = isPdf
    ? ([
        {
          type: "document" as const,
          source: {
            type: "base64" as const,
            media_type: "application/pdf" as const,
            data: image.bytes.toString("base64"),
          },
        },
      ] as const)
    : ([
        {
          type: "image" as const,
          source: {
            type: "base64" as const,
            media_type: image.mime as "image/jpeg" | "image/png" | "image/webp",
            data: image.bytes.toString("base64"),
          },
        },
      ] as const);

  const response = await anthropic().messages.create({
    model: MODEL,
    max_tokens: 8000,
    system: SYSTEM,
    tools: [
      {
        name: "record_page",
        description: "Record every recipe found on this page.",
        input_schema: parsedPageJsonSchema,
      },
    ],
    tool_choice: { type: "tool", name: "record_page" },
    messages: [
      {
        role: "user",
        content: [
          ...content,
          {
            type: "text",
            text: "Transcribe every recipe on this page using the record_page tool.",
          },
        ],
      },
    ],
  });

  const block = response.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") {
    throw new Error("The model did not return a transcription.");
  }

  const parsed = parsedPageSchema.safeParse(block.input);
  if (!parsed.success) {
    throw new Error(`Transcription did not match the expected shape: ${parsed.error.message}`);
  }
  return parsed.data;
}

/** Used by URL import when a page has no schema.org/Recipe markup. */
export async function transcribeText(
  text: string,
  sourceName: string,
): Promise<ParsedPage> {
  const response = await anthropic().messages.create({
    model: MODEL,
    max_tokens: 8000,
    system: SYSTEM,
    tools: [
      {
        name: "record_page",
        description: "Record every recipe found in this text.",
        input_schema: parsedPageJsonSchema,
      },
    ],
    tool_choice: { type: "tool", name: "record_page" },
    messages: [
      {
        role: "user",
        content: `This is the text of a recipe web page from ${sourceName}. Rotation is always 0. Extract the recipe using the record_page tool, ignoring navigation, comments, and the blogger's personal story.\n\n${text.slice(0, 120_000)}`,
      },
    ],
  });

  const block = response.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") {
    throw new Error("The model did not return a transcription.");
  }
  const parsed = parsedPageSchema.safeParse(block.input);
  if (!parsed.success) {
    throw new Error(`Transcription did not match the expected shape: ${parsed.error.message}`);
  }
  return parsed.data;
}

import { sharedImage } from "@/lib/sharing";

/**
 * Photographs for a guest. The token is the only credential, and it is checked
 * against the image itself: an image is served only when it hangs off a recipe
 * that sits in the very book this token was issued for.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string; id: string }> },
) {
  const { token, id } = await params;

  const image = await sharedImage(token, id);
  if (!image) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(image.bytes), {
    headers: {
      "Content-Type": image.mime,
      // Private: a shared link is not secret enough to sit in a shared cache,
      // and originals never change, so the browser may keep it.
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}

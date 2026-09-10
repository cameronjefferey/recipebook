export type Downscaled = {
  blob: Blob;
  width: number;
  height: number;
};

/**
 * Shrink a phone photo before upload. Modern phone cameras produce 4-8 MB
 * files, which are slow to send over cellular from a kitchen and wasteful to
 * keep in Postgres. 2000px on the long edge stays comfortably legible when
 * zooming into handwriting, and lands around 400 KB.
 */
export async function downscale(
  file: File,
  maxEdge = 2000,
  quality = 0.82,
): Promise<Downscaled> {
  // PDFs and anything unexpected pass through untouched.
  if (!file.type.startsWith("image/")) {
    return { blob: file, width: 0, height: 0 };
  }

  // `from-image` applies the EXIF orientation, so photos taken in landscape
  // are not silently stored sideways.
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });

  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return { blob: file, width: bitmap.width, height: bitmap.height };
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality),
  );

  return blob ? { blob, width, height } : { blob: file, width, height };
}

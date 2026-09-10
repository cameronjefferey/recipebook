import { ImageResponse } from "next/og";

export const dynamic = "force-static";

export function generateStaticParams() {
  return [{ size: "192" }, { size: "512" }];
}

/**
 * The icon is drawn rather than shipped as a binary so the palette stays in
 * one place. Content sits inside the middle 80% to survive maskable cropping.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ size: string }> },
) {
  const { size: raw } = await params;
  const size = raw === "512" ? 512 : 192;
  const u = size / 100;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#c2566f",
        }}
      >
        {/* the box */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: 58 * u,
            height: 46 * u,
            borderRadius: 4 * u,
            background: "#fdf6ea",
            overflow: "hidden",
          }}
        >
          {/* the lid */}
          <div style={{ display: "flex", height: 11 * u, background: "#e8909f" }} />
          {/* cards standing up inside */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 5 * u,
              padding: 9 * u,
            }}
          >
            <div style={{ display: "flex", height: 3.5 * u, width: "82%", background: "#c2566f", borderRadius: 99 }} />
            <div style={{ display: "flex", height: 3.5 * u, width: "62%", background: "#8a6242", borderRadius: 99 }} />
            <div style={{ display: "flex", height: 3.5 * u, width: "72%", background: "#8a6242", borderRadius: 99 }} />
          </div>
        </div>
      </div>
    ),
    { width: size, height: size },
  );
}

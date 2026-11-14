import { ImageResponse } from "next/og";
import { ICON_FILES, iconFile, svgDataUri } from "@/lib/brand/iconFiles";

export const runtime = "nodejs";
export const dynamicParams = false;

export function generateStaticParams(): { file: string }[] {
  return Object.keys(ICON_FILES).map((file) => ({ file }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ file: string }> },
): Promise<Response> {
  const { file } = await params;
  const icon = iconFile(file);
  if (!icon) return new Response("Not found", { status: 404 });
  if (icon.contentType === "image/svg+xml") {
    return new Response(icon.svg, {
      headers: { "Content-Type": "image/svg+xml; charset=utf-8" },
    });
  }
  return new ImageResponse(
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={svgDataUri(icon.svg)}
      width={icon.size}
      height={icon.size}
      alt=""
    />,
    { width: icon.size, height: icon.size },
  );
}

import { createOgImage, ogTagline } from "@/lib/og";

export const revalidate = false;

export function GET() {
  return createOgImage(ogTagline);
}

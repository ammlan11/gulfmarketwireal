import { createHash } from "crypto";

export function generateArticleId(url: string): string {
  return createHash("sha256").update(url).digest("hex");
}

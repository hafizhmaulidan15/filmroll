import { headers } from "next/headers";

export async function getVisitorToken(): Promise<string | null> {
  const headersList = await headers();
  return headersList.get("x-visitor-token");
}

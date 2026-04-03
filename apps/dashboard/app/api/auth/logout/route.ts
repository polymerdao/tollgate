import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.headers.set(
    "Set-Cookie",
    "tollgate_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0"
  );
  return response;
}

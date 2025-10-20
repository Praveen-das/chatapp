import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest, { params: { invitationId } }: { params: { invitationId: string } }) {
  const cookieStore = cookies();
  cookieStore.set("invitationId", invitationId, {
    path: "/",
    httpOnly: false,
    maxAge: 60,
  });
  redirect("/");
}

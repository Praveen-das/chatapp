import axiosClient from "@lib/axiosClient";
import type { NextApiRequest, NextApiResponse } from "next";
import { NextResponse } from "next/server";

export async function POST(req: NextApiRequest) {

  const response = await axiosClient.post('/db/user',{
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = response.data;

  return NextResponse.json(data);
}

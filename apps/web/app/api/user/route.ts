import axios from "axios";
import type { NextApiRequest, NextApiResponse } from "next";
import { NextResponse } from "next/server";

export async function POST(req: NextApiRequest) {
  const backendUrl = `http://localhost:3001/message/user`;

  const response = await axios.post(backendUrl,{
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = response.data;

  return NextResponse.json(data);
}

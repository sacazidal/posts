import { createClient } from "@/app/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req) {
  const supabase = await createClient();

  try {
    const { username, desc, date } = await req.json();

    const { data, error } = await supabase
      .from("posts")
      .insert([{ username, desc, date }])
      .select();

    if (error) {
      throw error;
    }

    return NextResponse.json(data[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { createClient } from "@/app/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("date", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

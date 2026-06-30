import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { toDbRecord, fromDbRecord } from "@/lib/supabase/db-convert"

async function getSupabase() {
  const supabase = await createClient()
  if (!supabase) return null
  return supabase
}

async function requireUser(supabase: NonNullable<Awaited<ReturnType<typeof getSupabase>>>) {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await getSupabase()
  if (!supabase) return NextResponse.json({ error: "Supabase not configured" }, { status: 503 })

  const user = await requireUser(supabase)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data, error } = await supabase
    .from("diagrams")
    .select("*")
    .eq("id", id)
    .eq("created_by", user.id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json(fromDbRecord(data))
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await getSupabase()
  if (!supabase) return NextResponse.json({ error: "Supabase not configured" }, { status: 503 })

  const user = await requireUser(supabase)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()

  const { data, error } = await supabase
    .from("diagrams")
    .upsert({
      ...toDbRecord(body),
      created_by: user.id,
      updated_at: new Date().toISOString(),
    }, { onConflict: "id", ignoreDuplicates: false })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(fromDbRecord(data))
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await getSupabase()
  if (!supabase) return NextResponse.json({ error: "Supabase not configured" }, { status: 503 })

  const user = await requireUser(supabase)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { error } = await supabase
    .from("diagrams")
    .delete()
    .eq("id", id)
    .eq("created_by", user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}

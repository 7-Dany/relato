import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

async function getSupabase() {
  const supabase = await createClient()
  if (!supabase) return null
  return supabase
}

async function requireUser(supabase: NonNullable<Awaited<ReturnType<typeof getSupabase>>>) {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function POST(request: NextRequest) {
  const supabase = await getSupabase()
  if (!supabase) return NextResponse.json({ error: "Supabase not configured" }, { status: 503 })

  const user = await requireUser(supabase)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const { diagram_id, permission = "view" } = body

  if (!diagram_id) {
    return NextResponse.json({ error: "diagram_id is required" }, { status: 400 })
  }

  if (!["view", "edit"].includes(permission)) {
    return NextResponse.json({ error: "permission must be 'view' or 'edit'" }, { status: 400 })
  }

  // Verify ownership
  const { data: diagram } = await supabase
    .from("diagrams")
    .select("id")
    .eq("id", diagram_id)
    .eq("created_by", user.id)
    .single()

  if (!diagram) {
    return NextResponse.json({ error: "Diagram not found" }, { status: 404 })
  }

  // Generate unique token
  const token = crypto.randomUUID()

  const { data, error } = await supabase
    .from("diagram_shares")
    .insert({
      diagram_id,
      token,
      permission,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}

export async function GET(request: NextRequest) {
  const supabase = await getSupabase()
  if (!supabase) return NextResponse.json({ error: "Supabase not configured" }, { status: 503 })

  const user = await requireUser(supabase)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const diagramId = request.nextUrl.searchParams.get("diagram_id")

  let query = supabase
    .from("diagram_shares")
    .select("*")
    .eq("created_by", user.id)

  if (diagramId) {
    query = query.eq("diagram_id", diagramId)
  }

  const { data, error } = await query.order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

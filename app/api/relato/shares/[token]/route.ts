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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const supabase = await getSupabase()
  if (!supabase) return NextResponse.json({ error: "Supabase not configured" }, { status: 503 })

  // Fetch share + diagram in one go
  const { data: share, error: shareError } = await supabase
    .from("diagram_shares")
    .select("*, diagrams(*)")
    .eq("token", token)
    .single()

  if (shareError || !share) {
    return NextResponse.json({ error: "Share link not found" }, { status: 404 })
  }

  // Check expiry
  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    return NextResponse.json({ error: "Share link has expired" }, { status: 410 })
  }

  return NextResponse.json({
    id: share.id,
    token: share.token,
    permission: share.permission,
    diagram: share.diagrams,
    created_at: share.created_at,
  })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const supabase = await getSupabase()
  if (!supabase) return NextResponse.json({ error: "Supabase not configured" }, { status: 503 })

  const user = await requireUser(supabase)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { error } = await supabase
    .from("diagram_shares")
    .delete()
    .eq("token", token)
    .eq("created_by", user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}

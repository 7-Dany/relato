-- Fix: diagrams table had select/insert/update RLS policies but no delete
-- policy, so DELETE requests were silently denied by RLS (0 rows affected,
-- no error) instead of actually removing the row.

create policy "Users can delete their own diagrams"
  on public.diagrams for delete
  using (created_by = auth.uid());

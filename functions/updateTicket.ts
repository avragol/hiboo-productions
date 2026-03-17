import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { id, ...data } = body;
    if (!id) return Response.json({ error: "id is required" }, { status: 400 });
    const updated = await base44.asServiceRole.entities.Ticket.update(id, data);
    return Response.json({ ticket: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

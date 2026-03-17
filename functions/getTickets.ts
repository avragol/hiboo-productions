import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const tickets = await base44.asServiceRole.entities.Ticket.list();
    // Sort by newest first
    tickets.sort((a: any, b: any) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime());
    return Response.json({ tickets });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

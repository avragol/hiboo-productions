import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const body = await req.json().catch(() => ({}));
    const { ticket_id } = body;

    if (!ticket_id) {
      return Response.json({ error: "ticket_id is required" }, { status: 400 });
    }

    const ticket = await base44.asServiceRole.entities.Ticket.get(ticket_id);
    if (!ticket) {
      return Response.json({ error: "Ticket not found" }, { status: 404 });
    }

    const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN");
    const REPO = "avragol/hiboo-productions";

    const priorityEmoji: Record<string, string> = { "דחוף": "🔴", "רגילה": "🟡", "נמוכה": "🟢" };
    const emoji = priorityEmoji[ticket.priority] || "🟡";

    let issueBody = `## תיאור\n${ticket.description || "אין תיאור"}\n\n`;
    issueBody += `**עדיפות:** ${emoji} ${ticket.priority}\n\n`;

    if (ticket.attachments?.length > 0) {
      issueBody += `## קבצים מצורפים\n`;
      ticket.attachments.forEach((url: string, i: number) => {
        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
        issueBody += isImage ? `![קובץ ${i + 1}](${url})\n` : `[קובץ ${i + 1}](${url})\n`;
      });
      issueBody += "\n";
    }

    issueBody += `---\n*נפתח דרך מערכת ניהול נחיתת ההיבו*`;

    const ghRes = await fetch(`https://api.github.com/repos/${REPO}/issues`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({
        title: `${emoji} ${ticket.title}`,
        body: issueBody,
      }),
    });

    if (!ghRes.ok) {
      const err = await ghRes.text();
      return Response.json({ error: "GitHub API error", details: err }, { status: 500 });
    }

    const issue = await ghRes.json();

    await base44.asServiceRole.entities.Ticket.update(ticket_id, {
      github_issue_url: issue.html_url,
      github_issue_number: issue.number,
      status: "פתוח",
    });

    return Response.json({ success: true, issue_url: issue.html_url, issue_number: issue.number });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

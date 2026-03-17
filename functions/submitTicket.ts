import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const body = await req.json().catch(() => ({}));
    const { title, description, priority, attachments } = body;

    if (!title || title.trim() === "") {
      return Response.json({ error: "title is required" }, { status: 400 });
    }

    // Create ticket in DB
    const ticket = await base44.asServiceRole.entities.Ticket.create({
      title: title.trim(),
      description: (description || "").trim(),
      priority: priority || "רגילה",
      attachments: attachments || [],
      status: "פתוח",
    });

    // Open GitHub issue
    const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN");
    const REPO = "avragol/hiboo-productions";

    const priorityEmoji: Record<string, string> = { "דחוף": "🔴", "רגילה": "🟡", "נמוכה": "🟢" };
    const emoji = priorityEmoji[priority] || "🟡";

    let issueBody = `## תיאור\n${description || "אין תיאור"}\n\n`;
    issueBody += `**עדיפות:** ${emoji} ${priority}\n\n`;

    if (attachments && attachments.length > 0) {
      issueBody += `## קבצים מצורפים\n`;
      attachments.forEach((url: string, i: number) => {
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
        title: `${emoji} ${title.trim()}`,
        body: issueBody,
      }),
    });

    let issueUrl = null;
    let issueNumber = null;

    if (ghRes.ok) {
      const issue = await ghRes.json();
      issueUrl = issue.html_url;
      issueNumber = issue.number;

      await base44.asServiceRole.entities.Ticket.update(ticket.id, {
        github_issue_url: issueUrl,
        github_issue_number: issueNumber,
      });
    }

    return Response.json({
      success: true,
      ticket_id: ticket.id,
      issue_url: issueUrl,
      issue_number: issueNumber,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

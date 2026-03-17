import { base44 } from "@base44/sdk";

const client = base44({
  appId: process.env.BASE44_APP_ID!,
  serviceToken: process.env.BASE44_SERVICE_TOKEN!,
  apiUrl: process.env.BASE44_API_URL,
});

export default async function createGithubIssue(req: Request) {
  const { ticket_id } = await req.json();

  if (!ticket_id) {
    return new Response(JSON.stringify({ error: "ticket_id is required" }), { status: 400 });
  }

  // Fetch ticket
  const ticket = await client.asServiceRole.entities.Ticket.get(ticket_id);
  if (!ticket) {
    return new Response(JSON.stringify({ error: "Ticket not found" }), { status: 404 });
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const REPO = "avragol/hiboo-productions";

  const priorityEmoji: Record<string, string> = {
    "דחוף": "🔴",
    "רגילה": "🟡",
    "נמוכה": "🟢",
  };

  const emoji = priorityEmoji[ticket.priority] || "🟡";

  let body = `## תיאור\n${ticket.description || "אין תיאור"}\n\n`;
  body += `**עדיפות:** ${emoji} ${ticket.priority}\n\n`;

  if (ticket.attachments && ticket.attachments.length > 0) {
    body += `## קבצים מצורפים\n`;
    ticket.attachments.forEach((url: string, i: number) => {
      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
      if (isImage) {
        body += `![קובץ ${i + 1}](${url})\n`;
      } else {
        body += `[קובץ ${i + 1}](${url})\n`;
      }
    });
    body += "\n";
  }

  body += `---\n*נפתח דרך מערכת ניהול נחיתת ההיבו*`;

  const issueTitle = `${emoji} ${ticket.title}`;

  const res = await fetch(`https://api.github.com/repos/${REPO}/issues`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: issueTitle,
      body,
      labels: [ticket.priority === "דחוף" ? "urgent" : "enhancement"],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return new Response(JSON.stringify({ error: "GitHub API error", details: err }), { status: 500 });
  }

  const issue = await res.json();

  // Update ticket with github info
  await client.asServiceRole.entities.Ticket.update(ticket_id, {
    github_issue_url: issue.html_url,
    github_issue_number: issue.number,
    status: "פתוח",
  });

  return new Response(JSON.stringify({ success: true, issue_url: issue.html_url, issue_number: issue.number }), { status: 200 });
}

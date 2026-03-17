import { useState, useEffect } from "react";

const GOLD = "#c9a84c";
const API = "https://avrahams-developer-7c30c73a.base44.app/functions";

const STATUS_LABELS = ["הכל", "פתוח", "בטיפול", "סגור"];
const STATUS_COLORS = { "פתוח": "#4caf50", "בטיפול": "#c9a84c", "סגור": "#888" };
const PRIORITY_COLORS = { "דחוף": "#ef4444", "רגילה": "#c9a84c", "נמוכה": "#4caf50" };
const PRIORITY_EMOJI = { "דחוף": "🔴", "רגילה": "🟡", "נמוכה": "🟢" };

export default function TicketBoard() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("הכל");
  const [expanded, setExpanded] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [error, setError] = useState("");

  const fetchTickets = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/getTickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setTickets(data.tickets || []);
    } catch (e) {
      setError("שגיאה בטעינה: " + e.message);
    }
    setLoading(false);
  };

  useEffect(() => { fetchTickets(); }, []);

  const updateStatus = async (id, status) => {
    setUpdating(id);
    try {
      const res = await fetch(`${API}/updateTicket`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    } catch (e) {
      alert("שגיאה בעדכון: " + e.message);
    }
    setUpdating(null);
  };

  // Tickets come flat: ticket.title, ticket.status, etc.
  const filtered = filter === "הכל" ? tickets : tickets.filter(t => t.status === filter);

  const counts = {
    "הכל": tickets.length,
    "פתוח": tickets.filter(t => t.status === "פתוח").length,
    "בטיפול": tickets.filter(t => t.status === "בטיפול").length,
    "סגור": tickets.filter(t => t.status === "סגור").length,
  };

  const formatDate = (d) => {
    if (!d) return "";
    const date = new Date(d);
    return date.toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>לוח טיקטים</h1>
          <div style={styles.logo}>HIBOO Productions</div>
        </div>

        <div style={styles.topBar}>
          <button onClick={fetchTickets} style={styles.refreshBtn} disabled={loading}>
            {loading ? "⟳" : "↺"} רענן
          </button>
        </div>

        <div style={styles.filterRow}>
          {STATUS_LABELS.map(s => (
            <button key={s} onClick={() => setFilter(s)}
              style={{
                ...styles.filterBtn,
                borderColor: filter === s ? GOLD : "#333",
                color: filter === s ? GOLD : "#666",
                background: filter === s ? `${GOLD}11` : "transparent",
              }}>
              <span style={styles.badge}>{counts[s]}</span> {s}
            </button>
          ))}
        </div>

        {error && <div style={styles.error}>{error}</div>}
        {loading && <div style={styles.empty}>טוען...</div>}
        {!loading && filtered.length === 0 && <div style={styles.empty}>אין טיקטים להציג</div>}

        <div style={styles.list}>
          {filtered.map(ticket => {
            const isOpen = expanded === ticket.id;
            const prio = ticket.priority || "רגילה";
            const status = ticket.status || "פתוח";
            return (
              <div key={ticket.id} style={styles.card}>
                <div style={styles.cardHeader} onClick={() => setExpanded(isOpen ? null : ticket.id)}>
                  <div style={styles.cardLeft}>
                    <span style={{ fontSize: 18 }}>{PRIORITY_EMOJI[prio] || "🟡"}</span>
                    <div>
                      <div style={styles.cardTitle}>{ticket.title}</div>
                      <div style={styles.cardMeta}>{formatDate(ticket.created_date)}</div>
                    </div>
                  </div>
                  <div style={styles.cardRight}>
                    <span style={{
                      ...styles.statusBadge,
                      background: `${STATUS_COLORS[status] || "#888"}22`,
                      color: STATUS_COLORS[status] || "#888",
                      border: `1px solid ${STATUS_COLORS[status] || "#888"}44`
                    }}>
                      {status}
                    </span>
                    <span style={{ color: "#555", fontSize: 12 }}>{isOpen ? "▲" : "▼"}</span>
                  </div>
                </div>

                {isOpen && (
                  <div style={styles.cardBody}>
                    {ticket.description ? (
                      <div style={styles.description}>{ticket.description}</div>
                    ) : (
                      <div style={{ color: "#444", fontSize: "0.85rem", padding: "0.75rem 0" }}>אין תיאור</div>
                    )}

                    {ticket.attachments && ticket.attachments.length > 0 && (
                      <div style={styles.attachments}>
                        <div style={styles.attachLabel}>קבצים:</div>
                        <div style={styles.attachGrid}>
                          {ticket.attachments.map((url, i) => (
                            /\.(jpg|jpeg|png|gif|webp)/i.test(url)
                              ? <a key={i} href={url} target="_blank" rel="noreferrer"><img src={url} style={styles.thumb} alt="" /></a>
                              : <a key={i} href={url} target="_blank" rel="noreferrer" style={styles.fileLink}>📄 קובץ {i + 1}</a>
                          ))}
                        </div>
                      </div>
                    )}

                    {ticket.github_issue_url && (
                      <a href={ticket.github_issue_url} target="_blank" rel="noreferrer" style={styles.ghLink}>
                        🔗 GitHub Issue #{ticket.github_issue_number}
                      </a>
                    )}

                    <div style={styles.actions}>
                      <div style={styles.actionsLabel}>שנה סטטוס:</div>
                      <div style={styles.actionsRow}>
                        {["פתוח", "בטיפול", "סגור"].map(s => (
                          <button key={s}
                            disabled={status === s || updating === ticket.id}
                            onClick={() => updateStatus(ticket.id, s)}
                            style={{
                              ...styles.actionBtn,
                              opacity: status === s ? 0.4 : 1,
                              borderColor: STATUS_COLORS[s],
                              color: STATUS_COLORS[s],
                            }}>
                            {updating === ticket.id ? "..." : s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100dvh", background: "#0a0a0a", padding: "1.5rem 1rem 3rem",
    fontFamily: "'Heebo', sans-serif", direction: "rtl", color: "#e8e8e8",
  },
  container: { maxWidth: 680, margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" },
  title: { fontSize: "1.6rem", fontWeight: 700, color: "#e8e8e8", margin: 0 },
  logo: { fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", color: GOLD },
  topBar: { display: "flex", justifyContent: "flex-end", marginBottom: "1rem" },
  refreshBtn: {
    padding: "0.4rem 1rem", background: "transparent", border: "1px solid #2a2a2a",
    color: "#888", cursor: "pointer", fontSize: "0.85rem", fontFamily: "'Heebo', sans-serif",
  },
  filterRow: { display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" },
  filterBtn: {
    padding: "0.5rem 0.9rem", border: "1px solid", cursor: "pointer",
    fontSize: "0.82rem", fontFamily: "'Heebo', sans-serif", display: "flex", alignItems: "center", gap: 6,
  },
  badge: {
    background: "#222", color: "#888", borderRadius: 10, padding: "0 6px",
    fontSize: "0.75rem", minWidth: 18, textAlign: "center",
  },
  error: { color: "#ef4444", background: "#ef444411", border: "1px solid #ef444433", padding: "0.75rem", marginBottom: "1rem", fontSize: "0.85rem" },
  empty: { textAlign: "center", color: "#555", padding: "3rem 0", fontSize: "0.9rem" },
  list: { display: "flex", flexDirection: "column", gap: "0.75rem" },
  card: { background: "#111", border: "1px solid #1e1e1e" },
  cardHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "1rem", cursor: "pointer", gap: 12,
  },
  cardLeft: { display: "flex", gap: 12, alignItems: "center", flex: 1, minWidth: 0 },
  cardRight: { display: "flex", alignItems: "center", gap: 10, flexShrink: 0 },
  cardTitle: { fontWeight: 600, fontSize: "0.95rem", color: "#e8e8e8" },
  cardMeta: { fontSize: "0.75rem", color: "#555", marginTop: 2 },
  statusBadge: { fontSize: "0.75rem", padding: "2px 8px", borderRadius: 3 },
  cardBody: { padding: "0 1rem 1rem", borderTop: "1px solid #1a1a1a" },
  description: { color: "#aaa", fontSize: "0.9rem", padding: "1rem 0", lineHeight: 1.6, whiteSpace: "pre-wrap" },
  attachments: { marginBottom: "1rem" },
  attachLabel: { fontSize: "0.75rem", color: "#555", marginBottom: "0.5rem" },
  attachGrid: { display: "flex", gap: 8, flexWrap: "wrap" },
  thumb: { width: 80, height: 80, objectFit: "cover", border: "1px solid #222" },
  fileLink: { color: GOLD, fontSize: "0.85rem" },
  ghLink: { display: "inline-block", color: GOLD, fontSize: "0.85rem", marginBottom: "1rem", textDecoration: "none" },
  actions: { marginTop: "0.75rem" },
  actionsLabel: { fontSize: "0.75rem", color: "#555", marginBottom: "0.5rem" },
  actionsRow: { display: "flex", gap: 8 },
  actionBtn: {
    padding: "0.4rem 0.9rem", border: "1px solid", background: "transparent",
    cursor: "pointer", fontSize: "0.82rem", fontFamily: "'Heebo', sans-serif",
  },
};

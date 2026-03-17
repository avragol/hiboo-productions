import { useState, useEffect } from "react";
import { Ticket } from "../api/entities";

const GOLD = "#c9a84c";

const priorityColor = { "דחוף": "#ef4444", "רגילה": "#c9a84c", "נמוכה": "#4caf50" };
const statusColor   = { "פתוח": "#c9a84c", "בטיפול": "#3b82f6", "סגור": "#4caf50" };

export default function TicketBoard() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("הכל");
  const [selected, setSelected] = useState(null);

  const load = async () => {
    setLoading(true);
    const data = await Ticket.list({ sort: { created_date: -1 } });
    setTickets(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id, status) => {
    await Ticket.update(id, { status });
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    if (selected?.id === id) setSelected(s => ({ ...s, status }));
  };

  const filtered = filter === "הכל" ? tickets : tickets.filter(t => t.status === filter);

  const counts = {
    "הכל": tickets.length,
    "פתוח": tickets.filter(t => t.status === "פתוח").length,
    "בטיפול": tickets.filter(t => t.status === "בטיפול").length,
    "סגור": tickets.filter(t => t.status === "סגור").length,
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.logo}>HIBOO Productions</div>
        <h1 style={styles.title}>לוח טיקטים</h1>
        <button onClick={load} style={styles.refreshBtn}>↻ רענן</button>
      </div>

      {/* Filters */}
      <div style={styles.filters}>
        {["הכל", "פתוח", "בטיפול", "סגור"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ ...styles.filterBtn, borderColor: filter === f ? GOLD : "#2a2a2a", color: filter === f ? GOLD : "#888" }}>
            {f} <span style={styles.badge}>{counts[f]}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div style={styles.empty}>טוען...</div>
      ) : filtered.length === 0 ? (
        <div style={styles.empty}>אין טיקטים {filter !== "הכל" ? `בסטטוס "${filter}"` : ""}</div>
      ) : (
        <div style={styles.list}>
          {filtered.map(t => (
            <div key={t.id} style={{ ...styles.card, borderColor: selected?.id === t.id ? GOLD : "#2a2a2a" }}
              onClick={() => setSelected(selected?.id === t.id ? null : t)}>
              <div style={styles.cardTop}>
                <div style={styles.cardLeft}>
                  <span style={{ ...styles.chip, borderColor: priorityColor[t.priority], color: priorityColor[t.priority] }}>
                    {t.priority === "דחוף" ? "🔴" : t.priority === "רגילה" ? "🟡" : "🟢"} {t.priority}
                  </span>
                  <span style={{ ...styles.chip, borderColor: statusColor[t.status], color: statusColor[t.status] }}>
                    {t.status}
                  </span>
                </div>
                <span style={styles.date}>{new Date(t.created_date).toLocaleDateString("he-IL")}</span>
              </div>
              <div style={styles.cardTitle}>{t.title}</div>
              {t.description && <div style={styles.cardDesc}>{t.description.slice(0, 120)}{t.description.length > 120 ? "..." : ""}</div>}

              {/* Expanded */}
              {selected?.id === t.id && (
                <div style={styles.expanded} onClick={e => e.stopPropagation()}>
                  {t.description && (
                    <div style={styles.expandSection}>
                      <div style={styles.expandLabel}>תיאור מלא</div>
                      <div style={styles.expandText}>{t.description}</div>
                    </div>
                  )}

                  {t.attachments && t.attachments.length > 0 && (
                    <div style={styles.expandSection}>
                      <div style={styles.expandLabel}>קבצים מצורפים</div>
                      <div style={styles.attachments}>
                        {t.attachments.map((url, i) => {
                          const isImg = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
                          return isImg ? (
                            <a key={i} href={url} target="_blank" rel="noreferrer">
                              <img src={url} alt={`קובץ ${i+1}`} style={styles.thumbImg} />
                            </a>
                          ) : (
                            <a key={i} href={url} target="_blank" rel="noreferrer" style={styles.fileLink}>
                              📄 קובץ {i+1}
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {t.github_issue_url && (
                    <a href={t.github_issue_url} target="_blank" rel="noreferrer" style={styles.ghLink}>
                      GitHub Issue #{t.github_issue_number} →
                    </a>
                  )}

                  <div style={styles.statusRow}>
                    <span style={styles.expandLabel}>שנה סטטוס:</span>
                    {["פתוח", "בטיפול", "סגור"].map(s => (
                      <button key={s} onClick={() => updateStatus(t.id, s)}
                        style={{ ...styles.statusBtn, borderColor: statusColor[s], color: t.status === s ? "#000" : statusColor[s], background: t.status === s ? statusColor[s] : "transparent" }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100dvh",
    background: "#0a0a0a",
    padding: "2rem",
    fontFamily: "'Heebo', sans-serif",
    direction: "rtl",
    maxWidth: 800,
    margin: "0 auto",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    marginBottom: "2rem",
    flexWrap: "wrap",
  },
  logo: {
    fontSize: "0.7rem",
    letterSpacing: "0.2em",
    color: GOLD,
    textTransform: "uppercase",
  },
  title: {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#e8e8e8",
    flex: 1,
  },
  refreshBtn: {
    background: "none",
    border: "1px solid #2a2a2a",
    color: "#888",
    padding: "0.4rem 0.8rem",
    cursor: "pointer",
    fontFamily: "'Heebo', sans-serif",
    fontSize: "0.85rem",
  },
  filters: {
    display: "flex",
    gap: "0.5rem",
    marginBottom: "1.5rem",
    flexWrap: "wrap",
  },
  filterBtn: {
    background: "none",
    border: "1px solid",
    padding: "0.4rem 0.9rem",
    cursor: "pointer",
    fontFamily: "'Heebo', sans-serif",
    fontSize: "0.82rem",
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    transition: "all 0.2s",
  },
  badge: {
    background: "#1e1e1e",
    borderRadius: 99,
    padding: "0 6px",
    fontSize: "0.75rem",
  },
  list: { display: "flex", flexDirection: "column", gap: "0.75rem" },
  card: {
    background: "#111",
    border: "1px solid",
    padding: "1.25rem 1.5rem",
    cursor: "pointer",
    transition: "border-color 0.2s",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0.6rem",
  },
  cardLeft: { display: "flex", gap: "0.5rem", flexWrap: "wrap" },
  chip: {
    fontSize: "0.72rem",
    border: "1px solid",
    padding: "0.15rem 0.6rem",
    letterSpacing: "0.05em",
  },
  date: { fontSize: "0.75rem", color: "#555" },
  cardTitle: { fontSize: "1rem", fontWeight: 700, color: "#e8e8e8", marginBottom: "0.3rem" },
  cardDesc: { fontSize: "0.85rem", color: "#888", lineHeight: 1.5 },
  expanded: {
    marginTop: "1.2rem",
    borderTop: "1px solid #1e1e1e",
    paddingTop: "1.2rem",
  },
  expandSection: { marginBottom: "1rem" },
  expandLabel: { fontSize: "0.72rem", color: GOLD, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.4rem" },
  expandText: { fontSize: "0.9rem", color: "#ccc", lineHeight: 1.7 },
  attachments: { display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "0.5rem" },
  thumbImg: { width: 100, height: 70, objectFit: "cover", border: "1px solid #2a2a2a" },
  fileLink: { color: GOLD, fontSize: "0.85rem" },
  ghLink: {
    display: "inline-block",
    color: GOLD,
    fontSize: "0.82rem",
    marginBottom: "1rem",
    textDecoration: "none",
  },
  statusRow: { display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" },
  statusBtn: {
    border: "1px solid",
    padding: "0.3rem 0.8rem",
    cursor: "pointer",
    fontFamily: "'Heebo', sans-serif",
    fontSize: "0.8rem",
    transition: "all 0.2s",
  },
  empty: { color: "#555", textAlign: "center", marginTop: "4rem", fontSize: "0.95rem" },
};

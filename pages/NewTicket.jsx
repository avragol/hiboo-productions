import { useState } from "react";

const GOLD = "#c9a84c";
const API_BASE = "https://avrahams-developer-7c30c73a.base44.app/functions";

export default function NewTicket() {
  const [priority, setPriority] = useState("רגילה");
  const [fileNames, setFileNames] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [issueUrl, setIssueUrl] = useState("");
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    setFileNames(Array.from(e.target.files).map(f => f.name));
  };

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`https://base44.app/api/apps/69b9d2a219ee88eeb7697c80/files/upload/public`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("upload failed");
    const data = await res.json();
    return data.file_url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const titleEl = e.target.querySelector('[name="title"]');
    const descEl = e.target.querySelector('[name="description"]');
    const filesEl = e.target.querySelector('[name="files"]');

    const title = titleEl?.value?.trim() || "";
    const description = descEl?.value?.trim() || "";
    const files = filesEl?.files ? Array.from(filesEl.files) : [];

    if (!title) {
      setError("חסרה כותרת");
      return;
    }

    setError("");
    setUploading(true);

    try {
      // Upload files first
      const attachments = [];
      for (const file of files) {
        try {
          const url = await uploadFile(file);
          attachments.push(url);
        } catch {}
      }

      // Submit to backend function
      const res = await fetch(`${API_BASE}/submitTicket`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, priority, attachments }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "שגיאת שרת");
      }

      setIssueUrl(data.issue_url);
      setSubmitted(true);
    } catch (err) {
      setError("שגיאה: " + err.message);
    }

    setUploading(false);
  };

  const priorityColor = { "דחוף": "#ef4444", "רגילה": "#c9a84c", "נמוכה": "#4caf50" };

  if (submitted) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h2 style={{ color: GOLD, marginBottom: 8 }}>הבקשה נשלחה!</h2>
          <p style={{ color: "#aaa", marginBottom: 24 }}>הצוות הטכני קיבל את הטיקט ויחזור אליך בהקדם.</p>
          {issueUrl && (
            <a href={issueUrl} target="_blank" rel="noreferrer" style={{ color: GOLD, fontSize: 13 }}>
              צפה בטיקט בגיטהאב →
            </a>
          )}
          <button
            onClick={() => { setSubmitted(false); setFileNames([]); setIssueUrl(""); setPriority("רגילה"); }}
            style={{ ...styles.btn, marginTop: 24 }}>
            פתח בקשה נוספת
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>HIBOO Productions</div>
        <h1 style={styles.title}>בקשה חדשה</h1>
        <p style={styles.sub}>רוצה לשנות משהו באתר? מלא כאן ואנחנו נטפל 👇</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>מה תרצה לשנות? *</label>
            <input
              name="title"
              style={styles.input}
              placeholder='למשל: "שנה את התמונה של הבוקר שלי"'
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>תיאור מפורט</label>
            <textarea
              name="description"
              style={{ ...styles.input, height: 120, resize: "vertical" }}
              placeholder="הסבר בפירוט מה בדיוק צריך לשנות, להוסיף, או להסיר..."
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>רמת דחיפות</label>
            <div style={styles.priorityRow}>
              {["נמוכה", "רגילה", "דחוף"].map(p => (
                <button type="button" key={p}
                  onClick={() => setPriority(p)}
                  style={{
                    ...styles.priorityBtn,
                    borderColor: priority === p ? priorityColor[p] : "#333",
                    color: priority === p ? priorityColor[p] : "#888",
                    background: priority === p ? `${priorityColor[p]}11` : "transparent",
                  }}>
                  {p === "דחוף" ? "🔴" : p === "רגילה" ? "🟡" : "🟢"} {p}
                </button>
              ))}
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>קבצים מצורפים (תמונות, מסמכים)</label>
            <label style={styles.fileBtn}>
              📎 {fileNames.length > 0 ? `${fileNames.length} קבצים נבחרו` : "בחר קבצים"}
              <input
                name="files"
                type="file"
                multiple
                onChange={handleFileChange}
                style={{ display: "none" }}
                accept="image/*,.pdf,.doc,.docx"
              />
            </label>
            {fileNames.length > 0 && (
              <div style={styles.fileList}>
                {fileNames.map((name, i) => (
                  <div key={i} style={styles.fileItem}>
                    {/\.(jpg|jpeg|png|gif|webp)$/i.test(name) ? "🖼️" : "📄"} {name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button type="submit" style={{ ...styles.btn, opacity: uploading ? 0.7 : 1 }} disabled={uploading}>
            {uploading ? "שולח..." : "שלח בקשה →"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100dvh",
    background: "#0a0a0a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem 1rem",
    fontFamily: "'Heebo', sans-serif",
    direction: "rtl",
  },
  card: {
    background: "#111",
    border: "1px solid #2a2a2a",
    padding: "2.5rem 2rem",
    width: "100%",
    maxWidth: 520,
    textAlign: "center",
  },
  logo: { fontSize: "0.75rem", letterSpacing: "0.25em", textTransform: "uppercase", color: GOLD, marginBottom: "1rem" },
  title: { fontSize: "1.8rem", fontWeight: 700, color: "#e8e8e8", marginBottom: "0.5rem" },
  sub: { fontSize: "0.95rem", color: "#888", marginBottom: "2rem" },
  form: { textAlign: "right" },
  field: { marginBottom: "1.4rem" },
  label: { display: "block", fontSize: "0.8rem", color: "#aaa", marginBottom: "0.5rem", letterSpacing: "0.05em" },
  input: {
    width: "100%", background: "#181818", border: "1px solid #2a2a2a", color: "#e8e8e8",
    padding: "0.75rem 1rem", fontSize: "0.95rem", fontFamily: "'Heebo', sans-serif",
    outline: "none", boxSizing: "border-box", direction: "rtl",
  },
  priorityRow: { display: "flex", gap: "0.75rem" },
  priorityBtn: {
    flex: 1, padding: "0.6rem", border: "1px solid", cursor: "pointer",
    fontSize: "0.85rem", fontFamily: "'Heebo', sans-serif", transition: "all 0.2s",
  },
  fileBtn: {
    display: "inline-block", padding: "0.6rem 1.2rem", border: "1px solid #2a2a2a",
    color: "#888", cursor: "pointer", fontSize: "0.85rem", background: "#181818",
  },
  fileList: { marginTop: "0.75rem" },
  fileItem: { fontSize: "0.82rem", color: "#aaa", padding: "0.3rem 0", borderBottom: "1px solid #1e1e1e" },
  error: { color: "#ef4444", fontSize: "0.85rem", marginBottom: "1rem", padding: "0.5rem", border: "1px solid #ef444433", background: "#ef444411" },
  btn: {
    width: "100%", padding: "0.9rem", background: GOLD, color: "#000", border: "none",
    fontSize: "1rem", fontWeight: 700, fontFamily: "'Heebo', sans-serif", cursor: "pointer",
    marginTop: "0.5rem", letterSpacing: "0.05em",
  },
};

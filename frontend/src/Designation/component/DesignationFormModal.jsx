import { useState, useEffect } from "react";

export default function DesignationFormModal({ open, onClose, onSubmit, initialData }) {
  const [name, setName] = useState("");
  const [level, setLevel] = useState("");

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setLevel(initialData.level ?? "");
    } else {
      setName("");
      setLevel("");
    }
  }, [initialData]);

  const handleSubmit = () => {
    onSubmit({
      name,
      level: level !== "" ? Number(level) : null,
    });
  };

  if (!open) return null;

  const styles = {
    overlay: {
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1300,
    },
    modal: {
      background: "#fff",
      borderRadius: 8,
      width: "90%",
      maxWidth: 600,
      padding: 20,
      boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
    },
    title: {
      fontSize: "1.25rem",
      fontWeight: 600,
      marginBottom: 12,
    },
    content: {
      marginBottom: 16,
      display: "flex",
      flexDirection: "column",
      gap: 12,
    },
    label: {
      display: "flex",
      flexDirection: "column",
      fontSize: "0.9rem",
    },
    input: {
      padding: "8px 10px",
      fontSize: "1rem",
      borderRadius: 4,
      border: "1px solid #ccc",
      marginTop: 6,
      outline: "none",
      boxShadow: "none",
    },
    actions: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 8,
    },
    btn: {
      padding: "8px 14px",
      borderRadius: 6,
      border: "none",
      cursor: "pointer",
    },
    primary: {
      backgroundColor: "#1976d2",
      color: "#fff",
    },
    cancel: {
      backgroundColor: "transparent",
      color: "#333",
      border: "1px solid #ccc",
    },
  };

  return (
    <div style={styles.overlay} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={styles.modal} role="dialog" aria-modal="true">
        <div style={styles.title}>{initialData ? "Edit Designation" : "New Designation"}</div>

        <div style={styles.content}>
          <label style={styles.label}>
            Designation Name
            <input
              style={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </label>

          <label style={styles.label}>
            Level (Optional)
            <input
              style={styles.input}
              type="number"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
            />
          </label>
        </div>

        <div style={styles.actions}>
          <button style={{ ...styles.btn, ...styles.cancel }} onClick={onClose}>Cancel</button>
          <button style={{ ...styles.btn, ...styles.primary }} onClick={handleSubmit}>{initialData ? "Update" : "Create"}</button>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef, useId } from "react";
import { createPortal } from "react-dom";

export default function DepartmentFormModal({ open, onClose, onSubmit, initialData }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const nameInputRef = useRef(null);
  const nameFieldId = useId();
  const descFieldId = useId();

  // Reset or hydrate whenever the modal opens, and when switching create ↔ edit
  useEffect(() => {
    if (!open) return;
    if (initialData) {
      setName(initialData.name || "");
      setDescription(initialData.description || "");
    } else {
      setName("");
      setDescription("");
    }
  }, [open, initialData]);

  // Focus after layout (portal + shell layout): double rAF + short timeout so the field is reliably editable
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      nameInputRef.current?.focus({ preventScroll: true });
    };
    let id2 = 0;
    const id1 = requestAnimationFrame(() => {
      id2 = requestAnimationFrame(run);
    });
    const t = window.setTimeout(run, 50);
    return () => {
      cancelled = true;
      cancelAnimationFrame(id1);
      if (id2) cancelAnimationFrame(id2);
      window.clearTimeout(t);
    };
  }, [open]);

  const handleSubmit = () => {
    onSubmit({ name, description });
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
      zIndex: 10050,
      pointerEvents: "auto",
    },
    modal: {
      background: "#fff",
      borderRadius: 8,
      width: "94%",
      maxWidth: 560,
      padding: 20,
      boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
      pointerEvents: "auto",
      position: "relative",
      zIndex: 1,
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
      pointerEvents: "auto",
      WebkitUserSelect: "text",
      userSelect: "text",
    },
    textarea: {
      padding: "8px 10px",
      fontSize: "1rem",
      borderRadius: 4,
      border: "1px solid #ccc",
      marginTop: 6,
      minHeight: 80,
      resize: "vertical",
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

  const modalTree = (
    <div
      style={styles.overlay}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={styles.modal}
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div style={styles.title}>{initialData ? "Edit Department" : "New Department"}</div>

        <div style={styles.content}>
          <label style={styles.label} htmlFor={nameFieldId}>
            Department Name
            <input
              type="text"
              id={nameFieldId}
              data-testid="dept-form-name"
              data-no-readonly-trick="true"
              name="department_name"
              ref={nameInputRef}
              style={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={false}
              readOnly={false}
              required
              autoComplete="off"
            />
          </label>

          <label style={styles.label} htmlFor={descFieldId}>
            Description
            <textarea
              id={descFieldId}
              name="department_description"
              style={styles.textarea}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
        </div>

        <div style={styles.actions}>
          <button type="button" style={{ ...styles.btn, ...styles.cancel }} onClick={onClose}>Cancel</button>
          <button type="button" style={{ ...styles.btn, ...styles.primary }} onClick={handleSubmit}>{initialData ? "Update" : "Create"}</button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalTree, document.body);
}

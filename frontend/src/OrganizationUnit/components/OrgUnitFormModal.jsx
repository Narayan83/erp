import { useState, useEffect } from "react";
import "../Pages/OrganizationUnits.scss";

export default function OrgUnitFormModal({
  open,
  onClose,
  onSubmit,
  initialData,
  orgUnits, // for parent dropdown
}) {
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setParentId(initialData.parent_id || "");
    } else {
      setName("");
      setParentId("");
    }
  }, [initialData]);

  const handleSubmit = () => {
    onSubmit({
      name,
      parent_id: parentId ? Number(parentId) : null,
    });
  };

  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal app-modal">
        <div className="modal-header">
          <h3>{initialData ? "Edit Organization Unit" : "New Organization Unit"}</h3>
        </div>

        <div className="modal-body">
          <label className="form-label">Organization Unit Name</label>
          <input
            className="form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <label className="form-label">Parent Unit (Optional)</label>
          <select
            className="form-input"
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
          >
            <option value="">None</option>
            {orgUnits.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={() => onClose(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            {initialData ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

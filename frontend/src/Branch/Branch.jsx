import React, { useState } from "react";
import "./branch.scss";

const emptyAccount = () => ({ bankName: "", accountNumber: "", ifsc: "" });

export default function Branch() {
  const [branchName, setBranchName] = useState("");
  const [remark, setRemark] = useState("");
  const [bankAccounts, setBankAccounts] = useState([emptyAccount()]);
  const [errors, setErrors] = useState({});
  const [branches, setBranches] = useState([]); // saved branches in-memory
  const [editingIndex, setEditingIndex] = useState(null);

  const addAccount = () => {
    setBankAccounts((prev) => [...prev, emptyAccount()]);
  };

  const removeAccount = (idx) => {
    setBankAccounts((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateAccount = (idx, field, value) => {
    setBankAccounts((prev) =>
      prev.map((acc, i) => (i === idx ? { ...acc, [field]: value } : acc))
    );
  };

  const validate = () => {
    const e = {};
    if (!branchName.trim()) e.branchName = "Branch name is required";
    bankAccounts.forEach((acc, i) => {
      if (!acc.bankName.trim() && !acc.accountNumber.trim() && !acc.ifsc.trim()) {
        e[`bank_${i}`] = "At least one field required for this account or remove it";
      }
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    if (!validate()) return;

    const payload = {
      branchName: branchName.trim(),
      remark: remark.trim(),
      bankAccounts: bankAccounts.filter(
        (a) => a.bankName.trim() || a.accountNumber.trim() || a.ifsc.trim()
      ),
    };

    // add an id to the record so keys are stable
    const branchRecord = {
      ...payload,
      id: editingIndex !== null && branches[editingIndex] ? branches[editingIndex].id : Date.now(),
    };

    if (editingIndex !== null && editingIndex >= 0 && editingIndex < branches.length) {
      const updated = branches.map((b, i) => (i === editingIndex ? branchRecord : b));
      setBranches(updated);
      alert("Branch updated.");
      console.log("Updated branches:", updated);
    } else {
      const updated = [...branches, branchRecord];
      setBranches(updated);
      alert("Branch saved.");
      console.log("Saved branches:", updated);
    }

    // reset form
    setBranchName("");
    setRemark("");
    setBankAccounts([emptyAccount()]);
    setEditingIndex(null);
  };

  const editBranch = (idx) => {
    const b = branches[idx];
    if (!b) return;
    setBranchName(b.branchName || "");
    setRemark(b.remark || "");
    // deep clone bank accounts to avoid mutating the saved object reference
    const clonedAccounts = b.bankAccounts && b.bankAccounts.length ? JSON.parse(JSON.stringify(b.bankAccounts)) : [emptyAccount()];
    setBankAccounts(clonedAccounts);
    setEditingIndex(idx);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteBranch = (idx) => {
    const b = branches[idx];
    if (!b) return;
    const ok = window.confirm(`Delete branch ${b.branchName || "(unnamed)"}?`);
    if (!ok) return;
    setBranches((prev) => prev.filter((_, i) => i !== idx));
    // if currently editing this one, reset form
    if (editingIndex === idx) {
      setBranchName("");
      setRemark("");
      setBankAccounts([emptyAccount()]);
      setEditingIndex(null);
    }
  };

  const cancelEdit = () => {
    setBranchName("");
    setRemark("");
    setBankAccounts([emptyAccount()]);
    setEditingIndex(null);
  };

  return (
    <div className="branch-page">
      <h2>Branch</h2>
      <form className="branch-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <label>Branch Name<span className="required">*</span></label>
          <input
            type="text"
            value={branchName}
            onChange={(e) => setBranchName(e.target.value)}
            placeholder="Enter branch name"
          />
          {errors.branchName && <div className="error">{errors.branchName}</div>}
        </div>

        <div className="form-row">
          <label>Remark</label>
          <textarea
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            placeholder="Optional remark about this branch"
            rows={3}
          />
        </div>

        <div className="accounts-section">
          <div className="accounts-header">
            <h3>Bank Accounts</h3>
            <button type="button" className="btn-add" onClick={addAccount}>
              + Add account
            </button>
          </div>

          {bankAccounts.map((acc, idx) => (
            <div className="account-row" key={idx}>
              <div className="account-fields">
                <div className="form-row small">
                  <label>Bank Name</label>
                  <input
                    type="text"
                    value={acc.bankName}
                    onChange={(e) => updateAccount(idx, "bankName", e.target.value)}
                    placeholder="e.g., Axis Bank"
                  />
                </div>

                <div className="form-row small">
                  <label>Account Number</label>
                  <input
                    type="text"
                    value={acc.accountNumber}
                    onChange={(e) => updateAccount(idx, "accountNumber", e.target.value)}
                    placeholder="Account number"
                  />
                </div>

                <div className="form-row small">
                  <label>IFSC</label>
                  <input
                    type="text"
                    value={acc.ifsc}
                    onChange={(e) => updateAccount(idx, "ifsc", e.target.value)}
                    placeholder="IFSC code"
                  />
                </div>
              </div>

              <div className="account-actions">
                <button
                  type="button"
                  className="btn-remove"
                  onClick={() => removeAccount(idx)}
                  disabled={bankAccounts.length === 1}
                >
                  Remove
                </button>
                {errors[`bank_${idx}`] && (
                  <div className="error small">{errors[`bank_${idx}`]}</div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary">
            Save Branch
          </button>
        </div>
      </form>

      {/* Saved branches table */}
      <div className="branches-list">
        <h3>Saved Branches</h3>
        {branches.length === 0 ? (
          <div className="empty">No branches added yet.</div>
        ) : (
          <table className="branch-table">
            <thead>
              <tr>
                <th>Branch Name</th>
                <th>Remark</th>
                <th>Bank Details</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {branches.map((b, idx) => (
                <tr key={idx}>
                  <td>{b.branchName}</td>
                  <td>{b.remark}</td>
                  <td>
                    {b.bankAccounts && b.bankAccounts.length ? (
                      <ul className="bank-list">
                        {b.bankAccounts.map((ba, i) => (
                          <li key={i}>
                            <strong>{ba.bankName || "-"}</strong>
                            {ba.accountNumber ? ` — ${ba.accountNumber}` : ""}
                            {ba.ifsc ? ` (IFSC: ${ba.ifsc})` : ""}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span>-</span>
                    )}
                  </td>
                  <td>
                    <button className="btn-edit" onClick={() => editBranch(idx)}>Edit</button>
                    <button className="btn-delete" onClick={() => deleteBranch(idx)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

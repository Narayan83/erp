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

  const addAccount = () => setBankAccounts((prev) => [...prev, emptyAccount()]);

  const removeAccount = (idx) =>
    setBankAccounts((prev) => prev.filter((_, i) => i !== idx));

  const updateAccount = (idx, field, value) =>
    setBankAccounts((prev) => prev.map((acc, i) => (i === idx ? { ...acc, [field]: value } : acc)));

  const validate = () => {
    const e = {};
    if (!branchName.trim()) e.branchName = "Please provide branch name.";
    bankAccounts.forEach((acc, i) => {
      if (!acc.bankName.trim() && !acc.accountNumber.trim() && !acc.ifsc.trim()) {
        e[`bank_${i}`] = "Remove empty account or enter at least one detail.";
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
      bankAccounts: bankAccounts.filter((a) => a.bankName.trim() || a.accountNumber.trim() || a.ifsc.trim()),
    };

    // keep stable id
    const branchRecord = {
      ...payload,
      id: editingIndex !== null && branches[editingIndex] ? branches[editingIndex].id : Date.now(),
    };

    if (editingIndex !== null && editingIndex >= 0 && editingIndex < branches.length) {
      const updated = branches.map((b, i) => (i === editingIndex ? branchRecord : b));
      setBranches(updated);
      setEditingIndex(null);
      // subtle UX: replace alert with console + small inline hint (keep alert for now)
      alert("Branch updated");
    } else {
      const updated = [...branches, branchRecord];
      setBranches(updated);
      alert("Branch saved");
    }

    // reset
    setBranchName("");
    setRemark("");
    setBankAccounts([emptyAccount()]);
  };

  const editBranch = (idx) => {
    const b = branches[idx];
    if (!b) return;
    setBranchName(b.branchName || "");
    setRemark(b.remark || "");
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
    <div className="branch-page card">
      <div className="card-header">
        <div>
          <h2 className="title">Bank & Branch Details</h2>
          <p className="subtitle">Manage branch information and linked bank accounts.</p>
        </div>
      </div>

      <form className="branch-form grid" onSubmit={handleSubmit}>
        <div className="card-section form-grid">
          <div className="form-row">
            <label htmlFor="branchName">Branch Name <span className="required">*</span></label>
            <input id="branchName" type="text" value={branchName} onChange={(e) => setBranchName(e.target.value)} placeholder="Enter branch name" />
            {errors.branchName && <div className="error">{errors.branchName}</div>}
          </div>

          <div className="form-row">
            <label htmlFor="remark">Remark</label>
            <textarea id="remark" value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="Optional remark" rows={3} />
          </div>
        </div>

        <div className="card-section">
          <div className="accounts-header">
            <h3>Bank Accounts</h3>
            <div className="controls">
              <button type="button" className="btn btn-outline" onClick={addAccount}>+ Add account</button>
            </div>
          </div>

          <div className="accounts-list">
            {bankAccounts.map((acc, idx) => (
              <div className="account-row" key={idx}>
                <div className="account-fields">
                  <div className="form-row small">
                    <label>Bank Name</label>
                    <input type="text" value={acc.bankName} onChange={(e) => updateAccount(idx, "bankName", e.target.value)} placeholder="e.g., Axis Bank" />
                  </div>

                  <div className="form-row small">
                    <label>Account Number</label>
                    <input type="text" value={acc.accountNumber} onChange={(e) => updateAccount(idx, "accountNumber", e.target.value)} placeholder="Account number" />
                  </div>

                  <div className="form-row small">
                    <label>IFSC</label>
                    <input type="text" value={acc.ifsc} onChange={(e) => updateAccount(idx, "ifsc", e.target.value)} placeholder="IFSC code" />
                  </div>
                </div>

                <div className="account-actions">
                  <button type="button" className="btn btn-danger" onClick={() => removeAccount(idx)} disabled={bankAccounts.length === 1}>Remove</button>
                  {errors[`bank_${idx}`] && <div className="error small">{errors[`bank_${idx}`]}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="form-actions actions-right">
          {editingIndex !== null ? (
            <>
              <button type="button" className="btn btn-outline" onClick={cancelEdit}>Cancel</button>
              <button type="submit" className="btn btn-primary">Update Branch</button>
            </>
          ) : (
            <button type="submit" className="btn btn-primary">Save Branch</button>
          )}
        </div>
      </form>

      <div className="branches-list card-section">
        <div className="list-header">
          <h3>Saved Branches</h3>
          <div className="count">{branches.length} saved</div>
        </div>

        {branches.length === 0 ? (
          <div className="empty">No branches added yet.</div>
        ) : (
          <div className="table-responsive">
            <table className="branch-table">
              <thead>
                <tr>
                  <th>Branch</th>
                  <th>Remark</th>
                  <th>Bank Details</th>
                  <th className="actions-col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {branches.map((b) => (
                  <tr key={b.id}>
                    <td className="branch-name">{b.branchName}</td>
                    <td className="remark">{b.remark || "-"}</td>
                    <td className="bank-details">
                      {b.bankAccounts && b.bankAccounts.length ? (
                        <ul className="bank-list">
                          {b.bankAccounts.map((ba, i) => (
                            <li key={i}>
                              <div className="bank-line">
                                <strong className="bank-name">{ba.bankName || "-"}</strong>
                                <span className="sep">•</span>
                                <span className="acct">{ba.accountNumber || "-"}</span>
                                <span className="ifsc">{ba.ifsc ? `IFSC: ${ba.ifsc}` : ""}</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span>-</span>
                      )}
                    </td>
                    <td className="actions-col">
                      <button className="btn btn-ghost" onClick={() => editBranch(branches.indexOf(b))}>Edit</button>
                      <button className="btn btn-danger" onClick={() => deleteBranch(branches.indexOf(b))}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

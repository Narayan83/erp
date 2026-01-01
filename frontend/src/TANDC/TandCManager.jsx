import React, { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../config/Config";
import "./tandcmanager.scss";

export default function TandCManager() {
  const [tandcs, setTandcs] = useState([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ tandc_name: "", tandc_type: "" });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  // Fetch all T&Cs
  const fetchTandcs = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/tandc/`, {
        params: { page, limit, filter: search },
      });
      setTandcs(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTandcs();
  }, [page, search]);

  const handleOpen = (tandc = null) => {
    if (tandc) {
      setEditId(tandc.ID);
      setFormData({ tandc_name: tandc.TandcName, tandc_type: tandc.TandcType });
    } else {
      setEditId(null);
      setFormData({ tandc_name: "", tandc_type: "" });
    }
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    try {
      if (editId) {
        await axios.put(`${BASE_URL}/api/tandc/${editId}`, {
          TandcName: formData.tandc_name,
          TandcType: formData.tandc_type,
        });
      } else {
        await axios.post(`${BASE_URL}/api/tandc`, {
          TandcName: formData.tandc_name,
          TandcType: formData.tandc_type,
        });
      }
      handleClose();
      fetchTandcs();
    } catch (err) {
      console.error(err);
      alert("Error saving T&C");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this T&C?")) {
      try {
        await axios.delete(`${BASE_URL}/api/tandc/${id}`);
        fetchTandcs();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <section className="right-content">
      <div className="tandc-page-container">
        <div className="tandc-page-header">
          <h5>Terms & Conditions</h5>
          <div className="add-button-wrapper">
            <button className="btn-add" onClick={() => handleOpen()}>
              + Add T&C
            </button>
          </div>
        </div>

        <div className="search-field-wrapper">
          <input
            type="text"
            className="search-input"
            placeholder="Search T&C..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>T&C Name</th>
                <th>T&C Type</th>
                <th align="right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tandcs.map((tandc) => (
                <tr key={tandc.ID}>
                  <td>{tandc.ID}</td>
                  <td>{tandc.TandcName}</td>
                  <td>{tandc.TandcType}</td>
                  <td className="actions-cell">
                    <button
                      className="icon-button"
                      onClick={() => handleOpen(tandc)}
                      title="Edit"
                    >
                      ✎
                    </button>
                    <button
                      className="icon-button delete-btn"
                      onClick={() => handleDelete(tandc.ID)}
                      title="Delete"
                    >
                      🗑
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pagination-wrapper">
          <div className="pagination-info">
            <span>Rows per page: {limit}</span>
            <span>Page {page}</span>
          </div>
        </div>

        {!open ? null : (
          <div className={`dialog-overlay ${open ? "" : "hidden"}`}>
            <div className="dialog-wrapper">
              <div className="dialog-header">
                {editId ? "Edit T&C" : "Add New T&C"}
              </div>
              <div className="dialog-content">
                <div className="form-group">
                  <label htmlFor="tandc_name">T&C Name</label>
                  <input
                    id="tandc_name"
                    type="text"
                    name="tandc_name"
                    value={formData.tandc_name}
                    onChange={handleChange}
                    placeholder="Enter T&C name"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="tandc_type">T&C Type</label>
                  <input
                    id="tandc_type"
                    type="text"
                    name="tandc_type"
                    value={formData.tandc_type}
                    onChange={handleChange}
                    placeholder="Enter T&C type"
                  />
                </div>
              </div>
              <div className="dialog-footer">
                <button className="btn-secondary" onClick={handleClose}>
                  Cancel
                </button>
                <button className="btn-primary" onClick={handleSubmit}>
                  {editId ? "Update" : "Add"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

import React, { useState } from "react";
import "../../styles/existing_menus.scss";
import { FaEdit, FaTrash } from "react-icons/fa";

const initialMenus = [
  { name: "about", remarks: "Menu: About" },
  { name: "admin", remarks: "Menu: Admin" },
  { name: "assigned_documents", remarks: "Menu: Assigned Documents" },
  { name: "audit_logs", remarks: "Menu: Audit Logs" },
  { name: "bulk_upload", remarks: "Menu: Bulk Upload" },
  { name: "data_validation", remarks: "Menu: Data Validation" },
  { name: "existing_menus", remarks: "Menu: Existing Menus" },
  { name: "feedback", remarks: "Menu: Feedback" },
  { name: "home", remarks: "Menu: Home" },
];

export default function ExistingMenus() {
  const [menus, setMenus] = useState(initialMenus);
  const [search, setSearch] = useState("");

  const handleDelete = (name) => {
    setMenus(menus.filter((menu) => menu.name !== name));
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  const handleRefresh = () => {
    setMenus(initialMenus);
    setSearch("");
  };

  const filteredMenus = menus.filter((menu) =>
    menu.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="existing-menus-container">
      <section className="title-section">
        <div>
          <h1 className="page-title">Existing Menus</h1>
          <div className="subtitle">Manage all your available menus</div>
        </div>
        <div className="actions-row">
          <input
            type="text"
            className="search-input"
            placeholder="Search menu..."
            value={search}
            onChange={handleSearch}
          />
          <button className="refresh-btn" onClick={handleRefresh}>
            Refresh
          </button>
        </div>
      </section>
      <table className="menus-table">
        <thead>
          <tr>
            <th>Menu Name &#8593;</th>
            <th>Permissions</th>
            <th>Remarks</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredMenus.map((menu) => (
            <tr key={menu.name}>
              <td>{menu.name}</td>
              <td></td>
              <td>{menu.remarks}</td>
              <td>
                <button className="action-btn edit-btn" title="Edit">
                  <FaEdit />
                </button>
                <button
                  className="action-btn delete-btn"
                  title="Delete"
                  onClick={() => handleDelete(menu.name)}
                >
                  <FaTrash />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

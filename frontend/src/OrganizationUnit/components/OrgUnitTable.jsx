import { FaEdit, FaTrash } from "react-icons/fa";
import "../Pages/OrganizationUnits.scss";

export default function OrgUnitTable({ rows, onEdit, onDelete }) {
  return (
    <div className="org-table-container">
      <table className="org-table">
        <thead>
          <tr>
            <th style={{ width: 80 }}>ID</th>
            <th>Name</th>
            <th>Parent</th>
            <th style={{ width: 150 }}>Actions</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{row.id}</td>
              <td>{row.name}</td>
              <td>{row.parent ? row.parent.name : "-"}</td>

              <td>
                <button className="icon-btn" onClick={() => onEdit(row)} title="Edit">
                  <FaEdit />
                </button>

                <button className="icon-btn danger" onClick={() => onDelete(row.id)} title="Delete">
                  <FaTrash />
                </button>
              </td>
            </tr>
          ))}

          {rows.length === 0 && (
            <tr>
              <td colSpan={4} style={{ textAlign: "center" }}>
                No records found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

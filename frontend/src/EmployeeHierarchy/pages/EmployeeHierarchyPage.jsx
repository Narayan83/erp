import { useEffect, useState } from "react";
import { IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import {
  getHierarchy,
  deleteHierarchy
} from "../components/employeeHierarchyService";
import EmployeeHierarchyModal from "../components/EmployeeHierarchyModal";
import Pagination from "../../CommonComponents/Pagination";

import "./EmployeeHierarchy.scss"; // styles for page and modal

export default function EmployeeHierarchyPage() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [openModal, setOpenModal] = useState(false);
  const [editData, setEditData] = useState(null);

  const loadData = async () => {
    const res = await getHierarchy(page, limit);
    setData(res.data);
    setTotal(res.total);
  };

  useEffect(() => {
    loadData();
  }, [page, limit]);

  const handleDelete = async (id) => {
    if (!confirm("Delete this relation?")) return;

    await deleteHierarchy(id);
    loadData();
  };

  return (
    <div className="employee-hierarchy right-content">
      <div className="page-header">
        <h2>Employee Hierarchy</h2>
        <div>
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditData(null);
              setOpenModal(true);
            }}
          >
            Add New
          </button>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="simple-table">
          <thead>
            <tr>
              <th className="col-sno">S. No.</th>
              <th className="col-manager">Manager/HighLevel Employee</th>
              <th className="col-sub">Sub/Child Employee</th>
              <th className="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={item.id}>
                <td className="col-sno">{(page - 1) * limit + index + 1}</td>
                <td className="col-manager">{item.Manager?.User?.firstname} {item.parent?.User?.lastname}</td>
                <td className="col-sub">{item.Employee?.User?.firstname} {item.child?.User?.lastname}</td>
                <td className="col-actions">
                  <IconButton onClick={() => { setEditData(item); setOpenModal(true); }}>
                    <EditIcon color="primary" />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(item.id)}>
                    <DeleteIcon color="error" />
                  </IconButton>
                </td>
              </tr>
            ))} 

            {data.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: "center" }}>No records found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination" style={{ marginTop: 12 }}>

        <Pagination
          page={page}
          total={total}
          rowsPerPage={limit}
          onPageChange={(p) => setPage(p)}
          onRowsPerPageChange={(rows) => { setLimit(rows); setPage(1); }}
          isZeroBased={false}
        />
      </div>

      {/* Modal */}
      <EmployeeHierarchyModal
        open={openModal}
        onClose={(refresh) => {
          setOpenModal(false);
          if (refresh) loadData();
        }}
        editData={editData}
      />
    </div>
  );
}

import { useEffect, useState } from "react";
import {
  getDesignations,
  createDesignation,
  updateDesignation,
  deleteDesignation,
} from "../component/designationApi";

import DesignationFormModal from "../component/DesignationFormModal";
import DesignationTable from "../component/DesignationTable";
import Pagination from "../../CommonComponents/Pagination";
import './Designations.scss';

export default function Designations() {
  const [designations, setDesignations] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  // pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const loadData = async () => {
    const res = await getDesignations();
    setDesignations(res.data.data || res.data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = () => {
    setEditData(null);
    setModalOpen(true);
  };

  const handleEdit = (row) => {
    setEditData(row);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Delete this designation?")) {
      await deleteDesignation(id);
      loadData();
    }
  };

  const handleSubmit = async (data) => {
    if (editData) {
      await updateDesignation(editData.id, data);
    } else {
      await createDesignation(data);
    }

    setModalOpen(false);
    loadData();
  };

  return (
    <div className="designations-page">
      <div className="page-header">
        <h2>Designations</h2>
        <button className="btn primary" onClick={handleCreate}>+ Add Designation</button>
      </div>

      <div className="table-wrap">
        <DesignationTable
          rows={designations}
          onEdit={handleEdit}
          onDelete={handleDelete}
          page={page}
          rowsPerPage={rowsPerPage}
        />
      </div>

      <div className="pagination" style={{ marginTop: 12 }}>
        <Pagination
          page={page}
          total={designations.length}
          rowsPerPage={rowsPerPage}
          onPageChange={(p) => setPage(p)}
          onRowsPerPageChange={(r) => { setRowsPerPage(r); setPage(0); }}
        />
      </div>

      <DesignationFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        initialData={editData}
      />
    </div>
  );
}

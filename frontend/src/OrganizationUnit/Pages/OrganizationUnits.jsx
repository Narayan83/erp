import { useEffect, useState } from "react";
import {
  getOrgUnits,
  createOrgUnit,
  updateOrgUnit,
  deleteOrgUnit,
} from "../components/orgUnitApi";

import OrgUnitFormModal from "../components/OrgUnitFormModal";
import OrgUnitTable from "../components/OrgUnitTable";
import Pagination from "../../CommonComponents/Pagination";

import "./OrganizationUnits.scss";

export default function OrganizationUnits() {
  const [units, setUnits] = useState([]);
  const [allUnits, setAllUnits] = useState([]); // for parent dropdown
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  // pagination
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const loadData = async () => {
    const res = await getOrgUnits({
      page: page + 1,
      limit,
    });

    setUnits(res.data.data || []);
    setTotal(res.data.total || 0);

    // load all for parent dropdown
    const all = await getOrgUnits();
    setAllUnits(all.data.data || all.data);
  };

  useEffect(() => {
    loadData();
  }, [page, limit]);

  const handleCreate = () => {
    setEditData(null);
    setModalOpen(true);
  };

  const handleEdit = (row) => {
    setEditData(row);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Delete this organization unit?")) {
      await deleteOrgUnit(id);
      loadData();
    }
  };

  const handleSubmit = async (data) => {
    if (editData) {
      await updateOrgUnit(editData.id, data);
    } else {
      await createOrgUnit(data);
    }

    setModalOpen(false);
    loadData();
  };

  return (
    <div className="org-units p-2">
      <div className="page-header">
        <h2>Organization Units</h2>

        <div>
          <button className="btn btn-primary" onClick={handleCreate}>
            + Add Organization Unit
          </button>
        </div>
      </div>

      <div className="table-wrapper" style={{ marginTop: 16 }}>
        <OrgUnitTable
          rows={units}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      <div className="pagination" style={{ marginTop: 12 }}>

        <Pagination
          page={page}
          total={total}
          rowsPerPage={limit}
          onPageChange={(p) => setPage(p)}
          onRowsPerPageChange={(rows) => { setLimit(rows); setPage(0); }}
        />
      </div>

      <OrgUnitFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        initialData={editData}
        orgUnits={allUnits}
      />
    </div>
  );
}

import { useEffect, useState, useMemo } from "react";
import { IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

import {
  getHierarchy,
  deleteHierarchy
} from "../components/employeeHierarchyService";
import EmployeeHierarchyModal from "../components/EmployeeHierarchyModal";
import Pagination from "../../CommonComponents/Pagination";

import "./EmployeeHierarchy.scss"; // styles for page and modal

function getEmployeeMeta(node) {
  const empCode = node?.empcode || "-";
  const department = node?.Department?.name || node?.department?.name || "-";
  const designation = node?.Designation?.name || node?.designation?.name || "-";
  return { empCode, department, designation };
}

const TreeNode = ({ node, onEdit, onDelete, seen }) => {
  const [expanded, setExpanded] = useState(true);
  const { empCode, department, designation } = getEmployeeMeta(node);

  if (seen.has(node.id)) {
    return (
      <div style={{ marginLeft: 24, padding: "4px 0", color: "#d32f2f", fontSize: "0.9rem" }}>
        [Cycle detected for {node.User?.firstname} {node.User?.lastname}]
      </div>
    );
  }

  const nextSeen = new Set(seen);
  nextSeen.add(node.id);

  return (
    <div className="tree-node" style={{ marginLeft: node.hierarchyItem ? 32 : 0 }}>
      <div className="tree-node-content" style={{ display: "flex", alignItems: "center", padding: "6px 0", borderBottom: node.hierarchyItem ? "1px dashed #eee" : "1px solid #ddd", gap: 12 }}>
        {node.children && node.children.length > 0 ? (
          <IconButton size="small" onClick={() => setExpanded(!expanded)} style={{ padding: 2 }}>
            {expanded ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
          </IconButton>
        ) : (
           <span style={{ width: 28, display: "inline-block" }}></span>
        )}
        
        <div style={{ flex: 1, fontWeight: node.hierarchyItem ? 'normal' : 'bold' }}>
          <div>
            {node.User?.firstname} {node.User?.lastname}
            {node.hierarchyItem && node.hierarchyItem.relation_type ? <span style={{ fontSize: "0.8rem", color: "#777", marginLeft: 8 }}>({node.hierarchyItem.relation_type})</span> : ''}
          </div>
          <div style={{ fontSize: "0.82rem", color: "#607080", marginTop: 2, fontWeight: 500 }}>
            {`Code: ${empCode} | Dept: ${department} | Desig: ${designation}`}
          </div>
        </div>

        {node.hierarchyItem && (
          <div className="tree-node-actions">
            <IconButton size="small" onClick={() => onEdit(node.hierarchyItem)}>
              <EditIcon color="primary" fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={() => onDelete(node.hierarchyItem.id)}>
              <DeleteIcon color="error" fontSize="small" />
            </IconButton>
          </div>
        )}
      </div>

      {expanded && node.children && node.children.length > 0 && (
        <div className="tree-node-children">
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} onEdit={onEdit} onDelete={onDelete} seen={nextSeen} />
          ))}
        </div>
      )}
    </div>
  );
};

export default function EmployeeHierarchyPage() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(100);

  const [openModal, setOpenModal] = useState(false);
  const [editData, setEditData] = useState(null);

  const loadData = async () => {
    try {
      const res = await getHierarchy(page, limit);
      setData(res.data || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, limit]);

  const handleDelete = async (id) => {
    if (!confirm("Delete this relation?")) return;

    await deleteHierarchy(id);
    loadData();
  };

  const treeData = useMemo(() => {
    const nodes = {};
    
    // First pass: create nodes for all managers and employees
    data.forEach(rel => {
      if (!nodes[rel.manager_id] && rel.Manager) {
        nodes[rel.manager_id] = { ...rel.Manager, children: [], isRoot: true };
      }
      if (!nodes[rel.employee_id] && rel.Employee) {
        nodes[rel.employee_id] = { ...rel.Employee, children: [], isRoot: true };
      }
    });

    // Second pass: attach children to parents
    data.forEach(rel => {
      if (nodes[rel.manager_id] && nodes[rel.employee_id]) {
        nodes[rel.employee_id].hierarchyId = rel.id;
        nodes[rel.employee_id].hierarchyItem = rel;
        nodes[rel.employee_id].isRoot = false; // It has a manager, so not a root
        
        // Prevent duplicate appending
        if (!nodes[rel.manager_id].children.some(c => c.id === rel.employee_id)) {
           nodes[rel.manager_id].children.push(nodes[rel.employee_id]);
        }
      }
    });

    // Identify roots
    const roots = [];
    Object.values(nodes).forEach(node => {
      if (node.isRoot) {
        roots.push(node);
      }
    });

    return roots;
  }, [data]);

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

      <div className="tree-wrapper" style={{ padding: 20, marginTop: 20, backgroundColor: "#fff", borderRadius: 8, boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
        {treeData.length > 0 ? (
          treeData.map((root) => (
            <TreeNode 
              key={root.id} 
              node={root} 
              onEdit={(item) => { setEditData(item); setOpenModal(true); }} 
              onDelete={handleDelete}
              seen={new Set()}
            />
          ))
        ) : (
          <div style={{ textAlign: "center", padding: 20, color: "#666" }}>
            No hierarchy records found
          </div>
        )}
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

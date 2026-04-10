import React, { useState, useEffect, useRef } from "react";
import { BASE_URL, getAuthHeaders } from "../../../config/Config";
import "./termsandcond.scss";

// export default function TermsConditionSelector({ open, handleClose,initialSelections = [], // Add this prop for prefill
//   initialEndCustomer = "", // Prefill end customer
//   initialSubDealer = "" }) {
//   const [tandc, setTandc] = useState([]); // fetched data
//   const [tandcSelections, setTandcSelections] = useState([]); // selected IDs
//   const [openTandCModal, setOpenTandCModal] = useState(open);
//   const [searchTerm, setSearchTerm] = useState("");
//    const [endCustomer, setEndCustomer] = useState("");
//   const [subDealer, setSubDealer] = useState("");


//   useEffect(() => {
//     setEndCustomer(initialEndCustomer);
//     setSubDealer(initialSubDealer);
//   }, [initialEndCustomer, initialSubDealer]);


//   // Prefill selections when initialSelections prop changes or data loads
//   useEffect(() => {
//     if (initialSelections.length > 0 && tandc.length > 0) {
//       // If initialSelections are IDs (numbers/strings)
//       const prefillSelections = tandc.filter(item => 
//         initialSelections.includes(item.ID)
//       );
//       setTandcSelections(prefillSelections);
//     } else if (initialSelections.length > 0) {
//       // If initialSelections are already full objects
//       setTandcSelections(initialSelections);
//     }

//     console.log(initialSelections)
//   }, [initialSelections, tandc]);

//   useEffect(()=>{
//     console.log(tandcSelections)
//   },[tandcSelections])

//   const fetchData = async () => {
//        try {
//             const res = await fetch(`${BASE_URL}/api/tandc`);
//            const data = await res.json();
//            console.log(data);
//             setTandc(data.data || []);
//           } catch (err) {
//             console.error("Error fetching TandC:", err);
//           }
//     };

//   // Fetch T&C data (replace with your actual API)
//   useEffect(() => {
//     console.log('dasda sdas das')
//     if(initialSelections == null || initialSelections == ''){
//         fetchData(); 
//     }
    
//   }, []);

//   // open & close handlers
//   const handleTandCOpen = () => {setOpenTandCModal(true);  };
//   const handleTandCClose = () =>{ setOpenTandCModal(false); handleClose(tandcSelections)};

//   // toggle selection
// // toggle selection of full object
//   const handleSelectTandC = (item) => {
//     setTandcSelections((prev) => {
//       // if already selected, remove it
//       if (prev.find((t) => t.ID === item.ID)) {
//         return prev.filter((t) => t.ID !== item.ID);
//       }
//       // otherwise, add it
//       return [...prev, item];
//     });
//   };

//   // filter list by search term
//   const filteredTandc = tandc.filter((item) =>
//     item.TandcName.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   return (
//     <div className="customer-info-container flex-column">
//       <h5>Terms & Condition</h5>

//       <div style={{ marginBottom: "10px" }}>
//         <TextField label="End Customer Name" size="small" sx={{ width: "100%" }} />
//       </div>
//       <div style={{ marginBottom: "10px" }}>
//         <TextField label="Sub Dealer Name" size="small" sx={{ width: "100%" }} />
//       </div>

//       {tandcSelections && tandcSelections.length > 0 && (
//         <Box sx={{ mt: 2 }}>
//           <Typography variant="subtitle2">Selected Terms & Conditions:</Typography>
//           {tandcSelections.map((item) => {
//             const tcItem = tandc.find((t) => t.ID === item.ID);
//             return (
//               <Typography key={tcItem.ID} variant="body2" sx={{ ml: 2 }}>
//                 {tcItem?.TandcName}
//               </Typography>
//             );
//           })}
//         </Box>
//       )}




//       <div className="mt-2">
//         <button className="btn btn-secondary rounded-0" onClick={handleTandCOpen}>
//           + Add Terms / Condition
//         </button>
//       </div>

//       {/* Modal */}
//       <Modal open={openTandCModal} onClose={handleTandCClose}>
//         <Box
//           sx={{
//             position: "absolute",
//             top: "50%",
//             left: "50%",
//             transform: "translate(-50%, -50%)",
//             width: 400,
//             bgcolor: "background.paper",
//             boxShadow: 24,
//             p: 3,
//             borderRadius: 2,
//             maxHeight: "80vh",
//             overflowY: "auto",
//           }}
//         >
//           <Typography variant="h6" sx={{ mb: 2 }}>
//             Select Terms & Conditions
//           </Typography>

//           {/* Search bar */}
//           <TextField
//             size="small"
//             placeholder="Search terms..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             fullWidth
//             sx={{ mb: 2 }}
//             InputProps={{
//               startAdornment: (
//                 <InputAdornment position="start">
//                   <SearchIcon />
//                 </InputAdornment>
//               ),
//             }}
//           />

//           {/* Filtered list */}
//           {filteredTandc.length > 0 ? (
//             filteredTandc.map((item) => (
//               <FormControlLabel
//                 key={item.ID}
//                 control={
//                   <Checkbox
//                      checked={tandcSelections.some((t) => t.ID === item.ID)}
//                     onChange={() => handleSelectTandC(item)}
//                   />
//                 }
//                 label={item.TandcName}
//               />
//             ))
//           ) : (
//             <Typography variant="body2" color="text.secondary">
//               No results found.
//             </Typography>
//           )}

//           <Box sx={{ mt: 2, textAlign: "right" }}>
//             <Button variant="contained" size="small" onClick={handleTandCClose}>
//               Done
//             </Button>
//           </Box>
//         </Box>
//       </Modal>
//     </div>
//   );
// }












export default function TermsConditionSelector({ open, handleClose, initialSelections = [], end_customer_name, end_dealer_name }) {
  const [tandc, setTandc] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [newTermName, setNewTermName] = useState("");
  const [saveForFuture, setSaveForFuture] = useState(false);
  const [endCustomer, setEndCustomer] = useState(end_customer_name || "");
  const [endDealer, setEndDealer] = useState(end_dealer_name || "");
  const [showEndCustomer, setShowEndCustomer] = useState(true);
  const [showEndDealer, setShowEndDealer] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editingValue, setEditingValue] = useState("");
  const handleCloseRef = useRef(handleClose);
  const lastEmittedStateRef = useRef("");

  const normalizeSelectionItem = (item) => {
    if (item == null) return null;
    if (typeof item === "string" || typeof item === "number") {
      return { ID: String(item), TandcName: "" };
    }
    if (typeof item === "object") {
      const idValue = item.ID ?? item.id ?? item.tandc_id ?? item.value ?? item.term_id;
      if (idValue == null || idValue === "") {
        // If this is a plain custom term object without ID, keep its text so edit/revise still shows it.
        const termText = item.TandcName ?? item.name ?? item.term ?? item.value ?? "";
        return termText ? { ID: `custom-${termText}`, TandcName: String(termText) } : null;
      }
      return {
        ...item,
        ID: String(idValue),
        TandcName: item.TandcName ?? item.name ?? item.term ?? "",
      };
    }
    return null;
  };

  const normalizeSelections = (rawSelections) => {
    let parsed = rawSelections;
    if (typeof rawSelections === "string") {
      try {
        parsed = JSON.parse(rawSelections);
      } catch {
        parsed = [rawSelections];
      }
    }

    if (!Array.isArray(parsed)) parsed = parsed ? [parsed] : [];

    return parsed
      .map(normalizeSelectionItem)
      .filter(Boolean)
      .filter((item, index, arr) => arr.findIndex((x) => String(x.ID) === String(item.ID)) === index);
  };

  const sameId = (a, b) => String(a) === String(b);

  const toComparableSelectionShape = (items = []) =>
    items.map((item) => ({
      ID: String(item?.ID ?? ""),
      TandcName: String(item?.TandcName ?? ""),
    }));

  const areSelectionsEqual = (left = [], right = []) => {
    if (left.length !== right.length) return false;

    const a = toComparableSelectionShape(left);
    const b = toComparableSelectionShape(right);

    for (let i = 0; i < a.length; i += 1) {
      if (a[i].ID !== b[i].ID || a[i].TandcName !== b[i].TandcName) {
        return false;
      }
    }

    return true;
  };

  useEffect(() => {
    // Always sync from parent for edit/revise flows (different docs can be opened in same mounted component).
    const normalized = normalizeSelections(initialSelections);
    setSelectedItems((prev) => (areSelectionsEqual(prev, normalized) ? prev : normalized));
  }, [initialSelections]);

  useEffect(() => {
    handleCloseRef.current = handleClose;
  }, [handleClose]);

  useEffect(() => {
    setEndCustomer(end_customer_name || "");
    setEndDealer(end_dealer_name || "");
  }, [end_customer_name, end_dealer_name]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/tandc`, { headers: getAuthHeaders() });
        const data = await res.json();
        const masterTandc = data.data || [];
        setTandc(masterTandc);
        
        // Sync existing selected items with master data names
        setSelectedItems((prev) => {
          if (!prev.length || !masterTandc.length) return prev;

          const next = prev.map((sel) => {
            const master = masterTandc.find((m) => sameId(m.ID, sel.ID));
            return master ? { ...sel, TandcName: master.TandcName } : sel;
          });

          return areSelectionsEqual(prev, next) ? prev : next;
        });
      } catch (err) {
        console.error("Error fetching TandC:", err);
      }
    };
    fetchData();
  }, []);

  // Notify parent whenever selections or names change, but avoid emitting duplicate payloads.
  useEffect(() => {
    const payloadKey = JSON.stringify({
      items: toComparableSelectionShape(selectedItems),
      endCustomer: String(endCustomer || ""),
      endDealer: String(endDealer || ""),
    });

    if (payloadKey === lastEmittedStateRef.current) return;

    lastEmittedStateRef.current = payloadKey;
    if (typeof handleCloseRef.current === "function") {
      handleCloseRef.current(selectedItems, endCustomer, endDealer);
    }
  }, [selectedItems, endCustomer, endDealer]);

  const toggleItem = (item) => {
    setSelectedItems((prev) => {
      const normalized = normalizeSelectionItem(item);
      if (!normalized) return prev;
      if (prev.find((p) => sameId(p.ID, normalized.ID))) return prev.filter((p) => !sameId(p.ID, normalized.ID));
      return [...prev, normalized];
    });
  };

  const handleAddNewTerm = async () => {
    if (!newTermName.trim()) {
      alert("Please enter a term/condition name");
      return;
    }

    try {
      const payload = {
        TandcName: newTermName,
        SaveForFuture: saveForFuture,
      };

      const response = await fetch(`${BASE_URL}/api/tandc`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to add term/condition");
      }

      const result = await response.json();
      const newItem = result.data || { ID: result.ID, TandcName: newTermName };

      // Add to tandc list
      setTandc((prev) => [...prev, newItem]);
      // Add to selected items
      setSelectedItems((prev) => [...prev, newItem]);

      // Reset and close modal
      setNewTermName("");
      setSaveForFuture(false);
      setOpenAddModal(false);
    } catch (err) {
      console.error("Error adding new term/condition:", err);
      alert("Failed to add term/condition");
    }
  };

  const filtered = tandc.filter((it) => it.TandcName && it.TandcName.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleDone = () => {
    setOpenModal(false);
    if (typeof handleClose === "function") handleClose(selectedItems, endCustomer, endDealer);
  };

  return (
    <div>
      <h5>Terms & Conditions</h5>
      
      {selectedItems && selectedItems.length > 0 && (
        <div className="selected-terms">
          {selectedItems.map((it) => (
            <div key={it.ID} className="selected-term">
              {editingId === it.ID ? (
                <div style={{ display: "flex", gap: 8, alignItems: "center", width: "100%" }}>
                  <input
                    className="form-control edit-input"
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    aria-label={`Edit ${it.TandcName}`}
                  />
                  <button
                    type="button"
                    className="btn-save"
                    title="Save"
                    onClick={async () => {
                      const id = it.ID;
                      const newName = editingValue.trim();
                      if (!newName) {
                        alert("Term cannot be empty");
                        return;
                      }

                      // optimistic update (local only, do not save to master)
                      const updatedItems = selectedItems.map((p) => (sameId(p.ID, id) ? { ...p, TandcName: newName } : p));
                      setSelectedItems(updatedItems);
                      setEditingId(null);
                      setEditingValue("");
                      
                      // Immediately sync to parent to ensure changes are captured
                      if (typeof handleClose === "function") {
                        handleClose(updatedItems, endCustomer, endDealer);
                      }
                    }}
                  >
                    ✓
                  </button>
                  <button
                    type="button"
                    className="btn-cancel"
                    title="Cancel"
                    onClick={() => {
                      setEditingId(null);
                      setEditingValue("");
                    }}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <>
                  <span className="term-text">{it.TandcName}</span>
                  <div className="term-actions">
                    <button
                      type="button"
                      className="btn-edit"
                      aria-label={`Edit ${it.TandcName}`}
                      title="Edit"
                      onClick={() => {
                        setEditingId(it.ID);
                        setEditingValue(it.TandcName || "");
                      }}
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      className="btn-delete"
                      aria-label={`Remove ${it.TandcName}`}
                      title="Remove"
                      onClick={() => setSelectedItems((prev) => prev.filter((p) => !sameId(p.ID, it.ID)))}
                    >
                      ✕
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-2">
        <button className="btn btn-add-term" onClick={() => setOpenModal(true)}>Add Term / Condition</button>
      </div>

      {openModal && (
        <div className="custom-modal">
          <div className="modal-box modal-width-450">
            <div className="modal-header">
              <h6>Select Term / Condition</h6>
              <button className="btn btn-close" onClick={() => setOpenModal(false)}>❌</button>
            </div>
            <div className="modal-body">
              <div className="search-container">
                <span className="search-icon">
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
                  </svg>
                </span>
                <input 
                  className="form-control" 
                  placeholder="Search" 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                />
              </div>

              <div className="terms-scroll-area">
                <div className="terms-list">
                  {filtered.length > 0 ? (
                    filtered.map((item) => (
                      <label className="term-item" key={item.ID}>
                        <input 
                          type="checkbox" 
                          checked={!!selectedItems.find((p) => sameId(p.ID, item.ID))} 
                          onChange={() => toggleItem(item)} 
                        />
                        <span className="term-name">{item.TandcName}</span>
                      </label>
                    ))
                  ) : (
                    <div className="muted p-3 text-center">No results found.</div>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ gap: '12px' }}>
              <button className="btn btn-add-new-term" onClick={() => setOpenAddModal(true)}>
                + Add New Term / Condition
              </button>
              <button className="btn btn-primary" onClick={handleDone}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {openAddModal && (
        <div className="custom-modal">
          <div className="modal-box modal-width-450">
            <div className="modal-header">
              <h6>Enter Term / Condition</h6>
              <button className="btn btn-close" onClick={() => setOpenAddModal(false)}>❌</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: 12 }}>
                <textarea
                  className="form-control"
                  placeholder="Enter New Term / Condition"
                  value={newTermName}
                  onChange={(e) => setNewTermName(e.target.value)}
                  rows="4"
                  style={{ resize: "vertical", minHeight: "80px" }}
                />
              </div>

              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={saveForFuture}
                    onChange={(e) => setSaveForFuture(e.target.checked)}
                  />
                  <span>Save for Future Use</span>
                </label>
              </div>
            </div>
            <div className="modal-footer" style={{ justifyContent: "flex-start", paddingTop: 0 }}>
              <button className="btn btn-add" onClick={handleAddNewTerm}>
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                </svg>
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
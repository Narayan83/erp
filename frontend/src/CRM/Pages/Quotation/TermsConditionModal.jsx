import React, { useState, useEffect } from "react";
import { BASE_URL } from "../../../config/Config";
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
  const [selectedItems, setSelectedItems] = useState(initialSelections || []);
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

  useEffect(() => {
    // Only prefill when there are actual initial selections provided.
    if (Array.isArray(initialSelections) && initialSelections.length > 0) {
      setSelectedItems(initialSelections);
    }
  }, [initialSelections]);

  useEffect(() => {
    setEndCustomer(end_customer_name || "");
    setEndDealer(end_dealer_name || "");
  }, [end_customer_name, end_dealer_name]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/tandc`);
        const data = await res.json();
        setTandc(data.data || []);
      } catch (err) {
        console.error("Error fetching TandC:", err);
      }
    };
    fetchData();
  }, []);

  const toggleItem = (item) => {
    setSelectedItems((prev) => {
      if (prev.find((p) => p.ID === item.ID)) return prev.filter((p) => p.ID !== item.ID);
      return [...prev, item];
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
        headers: {
          "Content-Type": "application/json",
        },
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
    <div className="customer-info-container flex-column terms-cond">
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

                      // optimistic update
                      setSelectedItems((prev) => prev.map((p) => (p.ID === id ? { ...p, TandcName: newName } : p)));
                      setTandc((prev) => prev.map((t) => (t.ID === id ? { ...t, TandcName: newName } : t)));
                      setEditingId(null);
                      setEditingValue("");

                      // try persisting update, but don't block UI
                      try {
                        await fetch(`${BASE_URL}/api/tandc/${id}`, {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ TandcName: newName }),
                        });
                      } catch (err) {
                        console.error("Failed to persist TandC edit", err);
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
                  <div style={{ display: "flex", gap: 6 }}>
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
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" stroke="currentColor" strokeWidth="0" fill="currentColor" />
                        <path d="M20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" stroke="currentColor" strokeWidth="0" fill="currentColor" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="btn-delete"
                      aria-label={`Remove ${it.TandcName}`}
                      title="Remove"
                      onClick={() => setSelectedItems((prev) => prev.filter((p) => p.ID !== it.ID))}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
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
          <div className="modal-box modal-width-450 modal-scroll">
            <div className="modal-header">
              <h6>Select Terms & Conditions</h6>
              <button className="btn btn-close" onClick={() => setOpenModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: 8 }}>
                <input className="form-control" placeholder="Search terms..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>

              <div className="terms-list">
                {filtered.length > 0 ? (
                  filtered.map((item) => (
                    <label className="term-item" key={item.ID}>
                      <input type="checkbox" checked={!!selectedItems.find((p) => p.ID === item.ID)} onChange={() => toggleItem(item)} />
                      <span className="term-name">{item.TandcName}</span>
                    </label>
                  ))
                ) : (
                  <div className="muted">No results found.</div>
                )}
              </div>

              <div className="modal-footer">
                <button className="btn btn-add-new-term" onClick={() => setOpenAddModal(true)}>
                  + Add New Term/Condition
                </button>
                <button className="btn btn-primary" style={{ marginLeft: 8 }} onClick={handleDone}>
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {openAddModal && (
        <div className="custom-modal">
          <div className="modal-box modal-width-450">
            <div className="modal-header">
              <h6>Enter Term / Condition</h6>
              <button className="btn btn-close" onClick={() => setOpenAddModal(false)}>✕</button>
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

              <div className="checkbox-group" style={{ marginBottom: 12 }}>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={saveForFuture}
                    onChange={(e) => setSaveForFuture(e.target.checked)}
                  />
                  <span>Save for Future Use</span>
                </label>
              </div>

              <div className="modal-footer" style={{ justifyContent: "flex-start" }}>
                <button className="btn btn-add" onClick={handleAddNewTerm}>Add</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
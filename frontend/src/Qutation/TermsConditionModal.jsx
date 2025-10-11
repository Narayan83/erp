import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Modal,
  Checkbox,
  FormControlLabel,
  TextField,
  InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import axios  from "axios";
import { BASE_URL } from "../Config";

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












export default function TermsConditionSelector({ open, handleClose, initialSelections = [],end_customer_name,end_dealer_name }) {
  const [tandc, setTandc] = useState([]);
  const [tandcSelections, setTandcSelections] = useState([]);
  const [openTandCModal, setOpenTandCModal] = useState(open);
  const [searchTerm, setSearchTerm] = useState("");
  const [endCustomer, setEndCustomer] = useState(end_customer_name || "");
  const [endDealer, setEndDealer] = useState(end_dealer_name || "");

  // Properly handle initialSelections prop
  useEffect(() => {
    if (initialSelections && initialSelections.length > 0) {
      setTandcSelections(initialSelections);
    }
  }, [initialSelections]);

  // Sync modal state with parent
  useEffect(() => {
    setOpenTandCModal(open);
  }, [open]);


  // Add useEffect to update state when props change
  useEffect(() => {
    setEndCustomer(end_customer_name || "");
    setEndDealer(end_dealer_name || "");
  }, [end_customer_name, end_dealer_name]);


  const fetchData = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/tandc`);
      const data = await res.json();
      setTandc(data.data || []);
    } catch (err) {
      console.error("Error fetching TandC:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTandCOpen = () => setOpenTandCModal(true);
  
  const handleTandCClose = () => {
    setOpenTandCModal(false);
    handleClose(tandcSelections,endCustomer,endDealer);
  };

  const handleSelectTandC = (item) => {
    setTandcSelections((prev) => {
      if (prev.find((t) => t.ID === item.ID)) {
        return prev.filter((t) => t.ID !== item.ID);
      }
      return [...prev, item];
    });
  };

  const filteredTandc = tandc.filter((item) =>
    item.TandcName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="customer-info-container flex-column">
      <h5>Terms & Condition</h5>

      <div style={{ marginBottom: "10px" }}>
        <TextField label="End Customer Name" size="small" sx={{ width: "100%" }} value={endCustomer} onChange={(e)=>setEndCustomer(e.target.value)} />
      </div>
      <div style={{ marginBottom: "10px" }}>
        <TextField label="Sub Dealer Name" size="small" sx={{ width: "100%" }} value={endDealer} onChange={(e)=>setEndDealer(e.target.value)} />
      </div>

      {tandcSelections.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2">Selected Terms & Conditions:</Typography>
          {tandcSelections.map((item) => (
            <Typography key={item.ID} variant="body2" sx={{ ml: 2 }}>
              {item.TandcName}
            </Typography>
          ))}
        </Box>
      )}

      <div className="mt-2">
        <button className="btn btn-secondary rounded-0" onClick={handleTandCOpen}>
          + Add Terms / Condition
        </button>
      </div>

      <Modal open={openTandCModal} onClose={handleTandCClose}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 3,
            borderRadius: 2,
            maxHeight: "80vh",
            overflowY: "auto",
          }}
        >
          <Typography variant="h6" sx={{ mb: 2 }}>
            Select Terms & Conditions
          </Typography>

          <TextField
            size="small"
            placeholder="Search terms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          />

          {filteredTandc.length > 0 ? (
            filteredTandc.map((item) => (
              <FormControlLabel
                key={item.ID}
                control={
                  <Checkbox
                    checked={tandcSelections.some((t) => t.ID === item.ID)}
                    onChange={() => handleSelectTandC(item)}
                  />
                }
                label={item.TandcName}
              />
            ))
          ) : (
            <Typography variant="body2" color="text.secondary">
              No results found.
            </Typography>
          )}

          <Box sx={{ mt: 2, textAlign: "right" }}>
            <Button variant="contained" size="small" onClick={handleTandCClose}>
              Done
            </Button>
          </Box>
        </Box>
      </Modal>
    </div>
  );
}
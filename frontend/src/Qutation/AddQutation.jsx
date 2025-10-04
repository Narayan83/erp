import React, { useState, useEffect,useMemo } from "react";
import { CiSearch } from "react-icons/ci";
import { IoMdPrint } from "react-icons/io";
import { IoDocumentText } from "react-icons/io5";
import { FaYoutube } from "react-icons/fa";
import { MdModelTraining } from "react-icons/md";
import { CgMenuGridO } from "react-icons/cg";
import { IoSettingsSharp } from "react-icons/io5";
import { MdSummarize } from "react-icons/md";
import { FaLongArrowAltLeft } from "react-icons/fa";
import { FaSave } from "react-icons/fa";
import { IoMdAdd } from "react-icons/io";
import { useForm, Controller } from "react-hook-form";
import { debounce } from "lodash";
import { MdDeleteOutline } from "react-icons/md";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Modal,
  Box,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button
} from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import { BASE_URL } from "../Config";

const AddQutation = () => {
  const [open, setOpen] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"

  const [saving, setSaving] = useState(false);
  const [quotationDate, setQuotationDate] = useState(today);
  const [validTill, setValidTill] = useState(today);




  const [openProdTable, setOpenProdTable] = useState(false); // modal state
  const [prodsearch, setProdSearch] = useState(""); // search text
  const [products, setProducts] = useState([]); // fetched products
  const [tableItems, setTableItems] = useState([]); // items in main table
  const [grandTotal , setGrandTotal] = useState(0);


const [productSelections, setProductSelections] = useState({});

const [tandc,setTandc]=useState([]);
const [openTandCModal, setOpenTandCModal] = useState(false);
const [tandcSearch, setTandcSearch] = useState('');
const [tandcSelections, setTandcSelections] = useState([]); 

useEffect(()=>{
  console.log(selectedEmployee);
},[selectedEmployee])

  // Fetch customers from API using role endpoint
  const fetchCustomers = async (query = "") => {
    try {
      const response = await fetch(
        `${BASE_URL}/api/users/roles/customer?page=1&limit=10&filter=${query}`
      );
      const data = await response.json();
      setCustomers(data.data || []);
    } catch (err) {
      console.error("Error fetching customers:", err);
    }
  };


  // Fetch employees from API
  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/users/roles/employee?page=1&limit=20`);
      const data = await res.json();
      setEmployees(data.data || []);
    } catch (err) {
      console.error("Error fetching employees:", err);
    }
  };


  // Fetch products from API
  const fetchProducts = async (query = "") => {
    try {
      const res = await fetch(`${BASE_URL}/api/products?page=1&limit=10&code=${query}`);
     const data = await res.json();
     console.log(data);
      setProducts(data.data || []);
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  };



    // Fetch tandc from API
  const fetchTandC = async (query = "") => {
    try {
      const res = await fetch(`${BASE_URL}/api/tandc`);
     const data = await res.json();
     console.log(data);
      setTandc(data.data || []);
    } catch (err) {
      console.error("Error fetching TandC:", err);
    }
  };






  // Debounced fetch for smoother typing
  const debouncedFetch = useMemo(() => debounce(fetchProducts, 500), []);

  useEffect(() => {
    fetchCustomers();
    fetchEmployees();
    fetchProducts();
    fetchTandC();
  }, []);

    useEffect(() => {
     console.log(selectedCustomer);
     console.log(products);
  }, [selectedCustomer]);

  const handleProductSearch = (e) => {
    const value = e.target.value;
    setProdSearch(value);
    debouncedFetch(value);
  };

  // Open modal and fetch products initially
  const handleProdOpen = () => {
    setOpenProdTable(true);
    fetchProducts();
  };


  const handleProdClose = () => setOpenProdTable(false);

  const handleTandCOpen = () => setOpenTandCModal(true);
const handleTandCClose = () => setOpenTandCModal(false);

   useEffect(()=>{
     const grandTotal = tableItems.reduce((sum, item) => sum + item.amount, 0);
     setGrandTotal(grandTotal);
   },[tableItems])

  // Add product to table with calculations
  const handleSelectProduct = (prod) => {
    const qty = 1; // default quantity
    const selectedVariant = prod.Variants?.[0] || null;
    const rate = selectedVariant?.PurchaseCost || 0;
    const discount = 0;
    const taxable = rate * qty - discount;
    const cgst = (taxable * (prod.Tax?.Percentage || 0)) / 2 / 100;
    const sgst = (taxable * (prod.Tax?.Percentage || 0)) / 2 / 100;
    const amount = taxable + cgst + sgst;
    const desc = '';

    setTableItems((prev) => [
      ...prev,
      {
        id: prod.ID,
        name: prod.Name,
        hsn: prod.HsnSacCode,
        unit: prod.Unit?.name,
        variantId: selectedVariant?.ID || null,
        qty,
        rate,
        discount,
        taxable,
        cgst,
        sgst,
        amount,
        desc,
        leadTime: prod.LeadTime,
      },
    ]);

    setOpenProdTable(false);
  };

  // // Build payload and submit quotation to backend
  // const handleSaveQuotation = async (skipNavigate = false) => {
  //   // basic validation
  //   if (!selectedCustomer) {
  //     alert("Please select a customer before saving the quotation.");
  //     return;
  //   }
  //   if (tableItems.length === 0) {
  //     alert("Please add at least one item to the quotation.");
  //     return;
  //   }
  //   if (!selectedEmployee) {
  //     alert("Please select Sales Credit (Employee) before saving.");
  //     return;
  //   }

  //   const payload = {
  //     quotation: {
  //       quotation_number: selectedCustomer ? `${selectedCustomer.id}ERQUOTE-2025` : "",
  //       quotation_date: quotationDate ? `${quotationDate}T00:00:00Z` : new Date().toISOString(),
  //       // backend expects numeric IDs (uint) — avoid sending null which breaks parsing
  //       customer_id: selectedCustomer ? Number(selectedCustomer.id) : 0,
  //       marketing_person_id: selectedEmployee ? Number(selectedEmployee) : 0,
  //       // send RFC3339 if selected, else null
  //       valid_until: validTill ? `${validTill}T00:00:00Z` : null,
  //       total_amount: Number(grandTotal) || 0,
  //       tax_amount: 0,
  //       grand_total: Number(grandTotal) || 0,
  //       status: "Draft",
  //       created_by: selectedEmployee ? Number(selectedEmployee) : 0,
  //     },
  //     quotation_items: tableItems.map((it) => ({
  //       product_id: Number(it.id) || 0,
  //       product_variant_id: Number(it.variantId) || 0,
  //       description: it.name,
  //       quantity: Number(it.qty) || 0,
  //       rate: Number(it.rate) || 0,
  //       tax_percent: 0,
  //       tax_amount: Number((it.cgst || 0) + (it.sgst || 0)) || 0,
  //       line_total: Number(it.amount) || 0,
  //     })),
  //   };

  //   // helpful debug info
  //   console.log('Quotation payload', payload);

  //   try {
  //     setSaving(true);
  //     const res = await axios.post(`${BASE_URL}/api/quotations`, payload);
  //     console.log("Saved quotation response:", res.data);
  //     alert("Quotation saved successfully.");
  //     // navigate to quotation list unless caller requested otherwise
  //     if (!skipNavigate) navigate("/quotation-list");
  //   } catch (err) {
  //     console.error("Failed to save quotation:", err);
  //     // show backend response body if available for easier debugging
  //     console.error('Backend response data:', err?.response?.data);
  //     alert("Failed to save quotation. See console for details.");
  //   } finally {
  //     setSaving(false);
  //   }
  // };



  const handleSaveQuotation = async () => {
  if (!selectedCustomer) return alert("Select a customer.");
  if (!selectedEmployee) return alert("Select a sales credit.");
  if (!tableItems.length) return alert("Add at least one item.");

const payload = {
  quotation: {
    quotation_number: `${selectedEmployee}ERQUOTE${2025}1`,
    quotation_date: new Date(quotationDate).toISOString(), // convert to ISO string
    customer_id: Number(selectedCustomer.id),
    sales_credit_person_id: selectedEmployee ? Number(selectedEmployee) : null,
    valid_until: new Date(validTill).toISOString(), // convert to ISO string
    total_amount: grandTotal,
    tax_amount: 0,
    grand_total: grandTotal,
    status: "Draft",
    created_by: Number(selectedEmployee),
    billing_address_id: 1,
    shipping_address_id: 1,
    t_and_c_id: 1,
  },
  quotation_items: tableItems.map((it) => ({
    product_id: it.id,
    product_variant_id: it.variantId,
    description: it.name,
    quantity: it.qty,
    rate: it.rate,
    tax_percent: 0,
    tax_amount: it.cgst + it.sgst,
    line_total: it.amount,
  })),
};

  try {
    setSaving(true);
    const res = await axios.post(`${BASE_URL}/api/quotations`, payload);
    alert("Quotation saved successfully.");
    navigate("/quotation-list");
  } catch (err) {
    console.error(err?.response?.data || err);
    alert("Failed to save quotation.");
  } finally {
    setSaving(false);
  }
};




  // Handle open/close modal
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  // Handle search
  const handleSearch = (e) => {
    console.log("search cliked");
    const value = e.target.value;
    setSearch(value);
    fetchCustomers(value);
  };

  // Handle select customer
  const handleSelectCustomer = (cust) => {
    setSelectedCustomer(cust);
    handleClose();
  };

  //go to add user

  const addUserNavigate = () => {
    navigate("/users/add");
  };

  const openSearch = () => {
    fetchCustomers();
    setOpen(true);
  };

  return (
    <section className="right-content">
      <div className="qutation-create-header">
        <h5>Create Qutation</h5>
        <div className="qutation-create-header-buttons">
          <button>
            {" "}
            <span>
              {" "}
              <IoMdPrint />{" "}
            </span>{" "}
            Print Settings{" "}
          </button>
          <button onClick={() => navigate(-1)}>
            {" "}
            <span>
              {" "}
              <FaLongArrowAltLeft />{" "}
            </span>{" "}
            Back{" "}
          </button>
          <button onClick={() => handleSaveQuotation()} disabled={saving}>
            {" "}
            <span>
              {" "}
              <FaSave />{" "}
            </span>{" "}
            Save qutation{" "}
          </button>
        </div>
      </div>
      <div className="container">
        <div className="row">
          <div className="col-md-12">
            <h5>Customer Information</h5>
          </div>
        </div>
      </div>
      <div className="customer-info-container">
        <div className="form-container">
          <div className="form-cust-inputs">
            <TextField
              label="Customer"
              size="small"
              sx={{ width: "260px" }}
              value={selectedCustomer ? selectedCustomer.firstname : ""}
              onClick={() => openSearch()}
            />

            <div className="search-and-add-customer">
              <button onClick={() => openSearch()}>
                <CiSearch />
              </button>
              <button onClick={() => addUserNavigate()}>
                {" "}
                <IoMdAdd />{" "}
              </button>
            </div>
          </div>

          <div className="form-cust-inputs">
            <FormControl size="small">
              <InputLabel>Copy From</InputLabel>
              <Select label="Copy From" sx={{ width: "260px" }}>
                <MenuItem disabled value="">
                  None
                </MenuItem>
              </Select>
            </FormControl>
          </div>
        </div>

        <div className="form-container">
          <div className="form-cust-inputs">
            <FormControl size="small">
              <InputLabel>Branch</InputLabel>
              <Select label="Copy From" sx={{ width: "260px" }}>
                <MenuItem disabled value="">
                  None
                </MenuItem>
              </Select>
            </FormControl>
          </div>

          <div className="form-cust-input">
            <FormControl size="small">
              <InputLabel>Series</InputLabel>
              <Select label="Copy From" sx={{ width: "260px" }}>
                <MenuItem disabled value="">
                  None
                </MenuItem>
              </Select>
            </FormControl>
          </div>
        </div>
      </div>

      <div className="customer-info-container">
        <div className="container">
          <div className="row">
            <div className="col-md-12">
              <h5>Party Details</h5>
              <div className="container">
                <div className="row">
                  <div className="col-md-3">
                    <div>
                      <TextField
                        label="Contact Person"
                        size="small"
                        
                        sx={{ width: "260px" }}
                      />
                    </div>
                    <div className="mt-2">
                      {selectedCustomer && (
                        <TextField
                          label="Address"
                          size="small"
                          multiline
                          rows={3}
                          fullWidth
                          value={
                            selectedCustomer
                              ? `${selectedCustomer.address1 || ""}, ${
                                  selectedCustomer.address2 || ""
                                }, ${selectedCustomer.address3 || ""}, ${
                                  selectedCustomer.state || ""
                                }, ${selectedCustomer.country || ""}, ${
                                  selectedCustomer.pincode || ""
                                }`
                              : ""
                          }
                        />
                      )}

                      {
                        !selectedCustomer && (
                          <button className="btn btn-warning rounded-0">
                        {" "}
                        + Click here to add Address{" "}
                      </button>
                        ) 
                      }

                      
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div>
                       <FormControl size="small" sx={{ width: "260px" }}>
                              <InputLabel>Sales Credit</InputLabel>
                              <Select
                                value={selectedEmployee}
                                onChange={(e) => setSelectedEmployee(e.target.value)}
                                label="Sales Credit"
                              >
                                <MenuItem disabled value="">
                                  None
                                </MenuItem>
                                {employees.map((emp) => (
                                  <MenuItem key={emp.id} value={emp.id}>
                                    {emp.firstname} {emp.lastname}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                    </div>
                    <label className="mt-4">Shipping Address</label>
                    <div className="form-check ">
                      <input
                        className="form-check-input border-1"
                        type="checkbox"
                        value=""
                        id="checkDefault"
                      />
                      <label
                        className="form-check-label"
                        htmlFor="checkDefault"
                      >
                        Same as Billing Address
                      </label>
                    </div>
                  </div>

                  <div className="col-md-3">
                    <h5>Document Details</h5>
                    <div className="mt-2">
                      <TextField
                        label="Qutation No"
                        size="small"
                        sx={{ width: "260px" }}
                        value={selectedCustomer?`${selectedCustomer.id}ERQUOTE-2025`:'' }
                      />
                    </div>
                    <div className="mt-2">
                      <TextField
                        label="Reference"
                        size="small"
                        sx={{ width: "260px" }}
                      />
                    </div>
                    <div className="mt-2">
                      <div>
                      <TextField
                        label="Quotation Date"
                        size="small"
                        type="date"
                        value={quotationDate}
                        onChange={(e)=> setQuotationDate(e.target.value)}
                        sx={{ width: "260px" }}
                        InputLabelProps={{ shrink: true }} // keeps the label above the date
                      />
                    </div>
                    </div>
                    <div className="mt-2">
                      <div>
        <TextField
          label="Valid Till"
          size="small"
          type="date"
          value={validTill}
          onChange={(e)=> setValidTill(e.target.value)}
          sx={{ width: "260px" }}
          InputLabelProps={{ shrink: true }}
        />
      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

     <div className="customer-info-container">
        <div className="container">
          <h5>Items list.</h5>
          <div className="row">
            <div className="col-md-12">
              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Image</th>
                    <th>Items Description</th>
                    <th>HSN/SAC</th>
                    <th>Qty</th>
                    <th>Unit</th>
                    <th>Rate</th>
                    <th>Discount</th>
                    <th>Taxable</th>
                    <th>CGST</th>
                    <th>SGST</th>
                    <th>Amount</th>
                    <th>Lead Time</th>
                     <th>remove</th>
                  </tr>
                </thead>
               <tbody>
  {tableItems.map((item, index) => (
    <tr key={index}>
      <td>{index + 1}</td>
      <td>{/* image if available */}</td>
      <td>
        <TextField
          value={item.name}
          size="small"
          onChange={(e) =>
            setTableItems((prev) => {
              const newItems = [...prev];
              newItems[index].name = e.target.value;
              return newItems;
            })
          }
        />
      </td>
      <td>
        <TextField
          value={item.hsn}
          size="small"
          onChange={(e) =>
            setTableItems((prev) => {
              const newItems = [...prev];
              newItems[index].hsn = e.target.value;
              return newItems;
            })
          }
        />
      </td>
      <td>
        <TextField
          value={item.qty}
          size="small"
          type="number"
          onChange={(e) =>
            setTableItems((prev) => {
              const newItems = [...prev];
              newItems[index].qty = Number(e.target.value);
              // recalc taxable, cgst, sgst, amount
              const taxable = newItems[index].rate * newItems[index].qty - newItems[index].discount;
              const cgst = (taxable * (item.cgst + item.sgst) / 2) / 100; // adjust if needed
              const sgst = (taxable * (item.cgst + item.sgst) / 2) / 100;
              newItems[index].taxable = taxable;
              newItems[index].cgst = cgst;
              newItems[index].sgst = sgst;
              newItems[index].amount = taxable + cgst + sgst;
              return newItems;
            })
          }
        />
      </td>
      <td>
        <TextField
          value={item.unit}
          size="small"
          onChange={(e) =>
            setTableItems((prev) => {
              const newItems = [...prev];
              newItems[index].unit = e.target.value;
              return newItems;
            })
          }
        />
      </td>
      <td>
        <TextField
          value={item.rate}
          size="small"
          type="number"
          onChange={(e) =>
            setTableItems((prev) => {
              const newItems = [...prev];
              newItems[index].rate = Number(e.target.value);
              const taxable = newItems[index].rate * newItems[index].qty - newItems[index].discount;
              const cgst = (taxable * (item.cgst + item.sgst) / 2) / 100;
              const sgst = (taxable * (item.cgst + item.sgst) / 2) / 100;
              newItems[index].taxable = taxable;
              newItems[index].cgst = cgst;
              newItems[index].sgst = sgst;
              newItems[index].amount = taxable + cgst + sgst;
              return newItems;
            })
          }
        />
      </td>
      <td>
        <TextField
          value={item.discount}
          size="small"
          type="number"
          onChange={(e) =>
            setTableItems((prev) => {
              const newItems = [...prev];
              newItems[index].discount = Number(e.target.value);
              const taxable = newItems[index].rate * newItems[index].qty - newItems[index].discount;
              const cgst = (taxable * (item.cgst + item.sgst) / 2) / 100;
              const sgst = (taxable * (item.cgst + item.sgst) / 2) / 100;
              newItems[index].taxable = taxable;
              newItems[index].cgst = cgst;
              newItems[index].sgst = sgst;
              newItems[index].amount = taxable + cgst + sgst;
              return newItems;
            })
          }
        />
      </td>
      <td>{item.taxable}</td>
      <td>{item.cgst}</td>
      <td>{item.sgst}</td>
      <td>{item.amount}</td>
      <td>{item.leadTime}</td>
      <td>
        <Button
          size="small"
          color="error"
          onClick={() =>
            setTableItems((prev) => prev.filter((_, i) => i !== index))
          }
        >
          <MdDeleteOutline />
        </Button>
      </td>
    </tr>
  ))}
</tbody>

              </table>
            </div>
            <div className="col-md-12">
              <button className="btn btn-secondary rounded-0" onClick={handleProdOpen}>
                + Add Item
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="row">
          <div className="col-md-8">
            <div className="customer-info-container flex-column">
              <h5>Terms & Condition</h5>
              <div style={{marginBottom:'10px'}}>
                <TextField
                  label="End Customer Name"
                  size="small"
                  sx={{ width: "100%" }}
                />
              </div>
              <div style={{marginBottom:'10px'}}>
                <TextField
                  label="Sub Dealer Name"
                  size="small"
                  sx={{ width: "100%" }}
                />
              </div>

              {tandcSelections.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2">Selected Terms & Conditions:</Typography>
                  {tandcSelections.map((id) => {
                    const tcItem = tandc.find((t) => t.id === id);
                    return (
                      <Typography key={id} variant="body2" sx={{ ml: 2 }}>
                        {tcItem?.TandcName}
                      </Typography>
                    );
                  })}
                </Box>
              )}


              <div className="mt-2">
                <button className="btn btn-secondary rounded-0"  onClick={handleTandCOpen}>
                  {" "}
                  + Add Terms/ Condition{" "}
                </button>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="customer-info-container flex-column">
              <div className="row">
                <div className="col-md-6">
                  <strong>Total</strong>
                </div>
                <div className="col-md-6">
                  <strong>{grandTotal}</strong>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <strong>Grand Total</strong>
                </div>
                <div className="col-md-6">
                  <strong>{grandTotal}</strong>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <button className="btn btn-warning rounded-0">
                    {" "}
                    + add Charges{" "}
                  </button>
                </div>
                <div className="col-md-6">
                  <button className="btn btn-warning rounded-0">
                    {" "}
                    + add Discount{" "}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      { selectedCustomer &&(

        <div className="container">
          <div className="row">
              <div className="customer-info-container">
                <div className="col-md-3">

                  <h5>Notes</h5>

                  <textarea cols={50}>

                  </textarea>




                </div>

                <div className="col-md-4">
                  <h5>Bank Details</h5>
                  <TextField
                    label="Bank Details"

                    value={
                      selectedCustomer ? `${ selectedCustomer.account_number },${ selectedCustomer.ifsc_code },${ selectedCustomer.bank_name },${ selectedCustomer.branch_name },${ selectedCustomer.branch_address }`:""
                    }
                  
                  
                  />
                </div>
              </div>
          </div>

          <div className="row">
            <div className="customer-info-container">
              <div className="col-md-6">
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" value="" id="1" />
                <label className="form-check-label" htmlFor="1">
                  Save Template
                </label>
              </div>


               <div className="form-check">
                  <input className="form-check-input" type="checkbox" value="" id="2" />
                <label className="form-check-label" htmlFor="2">
                  Share By Email
                </label>
              </div>


              <div className="form-check">
                  <input className="form-check-input" type="checkbox" value="" id="3" />
                <label className="form-check-label" htmlFor="3">
                  Share By Whats App
                </label>
              </div>


              <div className="form-check">
                  <input className="form-check-input" type="checkbox" value="" id="4" />
                <label className="form-check-label" htmlFor="4">
                  Print Document After save
                </label>
              </div>



              <div className="form-check">
                  <input className="form-check-input" type="checkbox" value="" id="5" />
                <label className="form-check-label" htmlFor="5">
                  Alert me on Openning
                </label>
              </div>



              <div>
                <button className="btn btn-warning rounded-0 ml-4" onClick={handleSaveQuotation} disabled={saving}> SAVE </button>
                <button className="btn btn-warning rounded-0 ml-4" onClick={async ()=>{
                  await handleSaveQuotation();
                  // reset form for new quotation
                  setSelectedCustomer(null);
                  setTableItems([]);
                  setGrandTotal(0);
                }} disabled={saving}> SAVE & Add New </button>
              </div>


              </div>
            </div>

          </div>
        </div>



       )

      }

      {/* modal  */}

      {/* Modal for search + table */}
      <Modal open={open} onClose={handleClose}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 600,
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 3,
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" gutterBottom>
            Select Customer
          </Typography>

          <TextField
            size="small"
            placeholder="Search customer..."
            value={search}
            onChange={handleSearch}
            fullWidth
            sx={{ mb: 2 }}
          />

          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>First Name</TableCell>
                <TableCell>Last Name</TableCell>
                <TableCell>Email</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {customers.map((cust) => (
                <TableRow
                  key={cust.id}
                  hover
                  sx={{ cursor: "pointer" }}
                  onClick={() => handleSelectCustomer(cust)}
                >
                  <TableCell>{cust.firstname}</TableCell>
                  <TableCell>{cust.lastname}</TableCell>
                  <TableCell>{cust.email}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Modal>



      {/* Product Modal */}
      {/* <Modal open={openProdTable} onClose={handleProdClose}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 600,
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 3,
            borderRadius: 2,
            maxHeight: "80vh",
            overflowY: "auto",
          }}
        >
          <Typography variant="h6" gutterBottom>
            Select Product
          </Typography>

          <TextField
            size="small"
            placeholder="Search product..."
            value={search}
            onChange={handleProductSearch}
            fullWidth
            sx={{ mb: 2 }}
          />

          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>HSN/SAC</TableCell>
                <TableCell>Unit</TableCell>
                <TableCell>Stock</TableCell>
                <TableCell>Select</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((prod) => (
                <TableRow key={prod.ID}>
                  <TableCell>{prod.Name}</TableCell>
                  <TableCell>{prod.HsnSacCode}</TableCell>
                  <TableCell>{prod.Unit?.name}</TableCell>
                  <TableCell>{prod.Stock}</TableCell>
                  <TableCell>
                    <Button variant="contained" size="small" onClick={() => handleSelectProduct(prod)}>
                      Add
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Modal> */}





{/* Product Modal */}
      <Modal open={openProdTable} onClose={handleProdClose}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 800,
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 3,
            borderRadius: 2,
            maxHeight: "80vh",
            overflowY: "auto",
          }}
        >
          <h5>Select Products</h5>
          <TextField
            fullWidth
            size="small"
            placeholder="Search Products"
            value={prodsearch}
            onChange={handleProductSearch}
          />

          {products.map((prod) => {
            const sel = productSelections[prod.ID] || {
              checked: false,
              qty: 1,
              rate: prod.Variants?.[0]?.PurchaseCost || 0,
              discount: 0,
              gst: prod.Tax?.Percentage || 0,
              hsn: prod.HsnSacCode || "",
              unit: prod.Unit?.name || "",
              leadTime: prod.LeadTime || "",
              variantId: prod.Variants?.[0]?.ID || null,
            };

            return (
              <Box key={prod.ID} sx={{ mb: 2 }}>
                <div
                  className="d-flex align-items-center justify-content-between"
                  style={{border:'1px solid #ccc',padding:'5px',margin:'5px'}}
                >
                  <div className="d-flex align-items-center gap-2 " >
                    <input
                      type="checkbox"
                      checked={sel.checked}
                      onChange={(e) =>
                        setProductSelections((prev) => ({
                          ...prev,
                          [prod.ID]: { ...sel, checked: e.target.checked },
                        }))
                      }
                    />
                    <Typography variant="subtitle1" >
                      {prod.Code}
                    </Typography>
                    <Typography variant="subtitle1" >
                      {prod.Name}
                    </Typography>
                  </div>
                  <Typography variant="body2" color="text.secondary">
                    Stock: {prod.Stock}
                  </Typography>
                </div>

                {sel.checked && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
                      gap: "8px",
                    }}
                  >
                    <TextField
                      label="Qty"
                      size="small"
                      type="number"
                      value={sel.qty}
                      onChange={(e) =>
                        setProductSelections((prev) => ({
                          ...prev,
                          [prod.ID]: { ...sel, qty: Number(e.target.value) },
                        }))
                      }
                    />
                    <TextField
                      label="Rate"
                      size="small"
                      type="number"
                      value={sel.rate}
                      onChange={(e) =>
                        setProductSelections((prev) => ({
                          ...prev,
                          [prod.ID]: { ...sel, rate: Number(e.target.value) },
                        }))
                      }
                    />
                    <TextField
                      label="Discount"
                      size="small"
                      type="number"
                      value={sel.discount}
                      onChange={(e) =>
                        setProductSelections((prev) => ({
                          ...prev,
                          [prod.ID]: { ...sel, discount: Number(e.target.value) },
                        }))
                      }
                    />
                    <TextField
                      label="HSN"
                      size="small"
                      value={sel.hsn}
                      onChange={(e) =>
                        setProductSelections((prev) => ({
                          ...prev,
                          [prod.ID]: { ...sel, hsn: e.target.value },
                        }))
                      }
                    />
                    <TextField
                      label="GST %"
                      size="small"
                      type="number"
                      value={sel.gst}
                      onChange={(e) =>
                        setProductSelections((prev) => ({
                          ...prev,
                          [prod.ID]: { ...sel, gst: Number(e.target.value) },
                        }))
                      }
                    />
                    <TextField
                      label="Unit"
                      size="small"
                      value={sel.unit}
                      onChange={(e) =>
                        setProductSelections((prev) => ({
                          ...prev,
                          [prod.ID]: { ...sel, unit: e.target.value },
                        }))
                      }
                    />

                    <TextField
                      label="Lead Time"
                      size="small"
                      value={sel.leadTime}
                      onChange={(e) =>
                        setProductSelections((prev) => ({
                          ...prev,
                          [prod.ID]: { ...sel, leadTime: e.target.value },
                        }))
                      }
                    />

                     <TextField
                      label="Description"
                      size="small"
                      value={sel.desc}
                      onChange={(e) =>
                        setProductSelections((prev) => ({
                          ...prev,
                          [prod.ID]: { ...sel, desc: e.target.value },
                        }))
                      }
                    />
                  </div>
                )}
              </Box>
            );
          })}

          <Button
  variant="contained"
  onClick={() => {
    const selectedItems = Object.entries(productSelections)
      .filter(([_, sel]) => sel.checked)
      .map(([prodID, sel]) => {
        const prod = products.find((p) => p.ID === Number(prodID));
        const taxable = sel.rate * sel.qty - sel.discount;
        const cgst = (taxable * (prod.Tax?.Percentage || 0)) / 2 / 100;
        const sgst = (taxable * (prod.Tax?.Percentage || 0)) / 2 / 100;
        const amount = taxable + cgst + sgst;
        const desc = '';

        return {
          id: prod.ID,
          name: prod.Name,
          hsn: sel.hsn,
          unit: sel.unit,
          variantId: sel.variantId,
          qty: sel.qty,
          rate: sel.rate,
          discount: sel.discount,
          taxable,
          cgst,
          sgst,
          amount,
          desc,
          leadTime: sel.leadTime,
        };
      });

    setTableItems((prev) => {
      const merged = [...prev];

      selectedItems.forEach((newItem) => {
        const existingIndex = merged.findIndex(
          (item) => item.id === newItem.id
        );
        if (existingIndex >= 0) {
          // If product already exists, increase quantity
          merged[existingIndex].qty = newItem.qty;
          const taxable = merged[existingIndex].rate * merged[existingIndex].qty - merged[existingIndex].discount;
          const cgst = (taxable * (merged[existingIndex].cgst + merged[existingIndex].sgst) / 2) / 100;
          const sgst = (taxable * (merged[existingIndex].cgst + merged[existingIndex].sgst) / 2) / 100;
          merged[existingIndex].taxable = taxable;
          merged[existingIndex].cgst = cgst;
          merged[existingIndex].sgst = sgst;
          merged[existingIndex].amount = taxable + cgst + sgst;
        } else {
          merged.push(newItem);
        }
      });

      return merged;
    });

    handleProdClose();
  }}
  sx={{ mt: 2 }}
>
  Add Selected
</Button>
        </Box>
      </Modal>











<Modal open={openTandCModal} onClose={handleTandCClose}>
  <Box
    sx={{
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: 600,
      bgcolor: "background.paper",
      boxShadow: 24,
      p: 3,
      borderRadius: 2,
      maxHeight: "80vh",
      overflowY: "auto",
    }}
  >
    <Typography variant="h6" gutterBottom>
      Select Terms & Conditions
    </Typography>

    <TextField
      fullWidth
      size="small"
      placeholder="Search Terms & Conditions"
      value={tandcSearch}
      onChange={fetchTandC}
      sx={{ mb: 2 }}
    />

    {tandc.length === 0 ? (
      <Typography>No Terms&Conditions found.</Typography>
    ) : (
      tandc.map((tc) => {
        const sel = tandcSelections[tc.id] || { checked: false };
        return (
          <Box key={tc.id} sx={{ mb: 1 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                border: "1px solid #ccc",
                padding: "5px",
              }}
            >
              <div>
               <input
                  type="checkbox"
                  checked={tandcSelections.includes(tc.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setTandcSelections((prev) => [...prev, tc.id]);
                    } else {
                      setTandcSelections((prev) => prev.filter((id) => id !== tc.id));
                    }
                  }}
                />
                <span>{tc.TandcName}</span>
              </div>
            </div>
            {sel.checked && (
              <Typography variant="body2" sx={{ ml: 3 }}>
                {tc.tandc_name}
              </Typography>
            )}
          </Box>
        );
      })
    )}

    <Button
      variant="contained"
      sx={{ mt: 2 }}
      onClick={() => {
        const selectedItems = Object.entries(tandcSelections)
          .filter(([_, sel]) => sel.checked)
          .map(([id, _]) => tandc.find((t) => t.id === Number(id)));
        
        // optional: merge into state for quotation
        console.log("Selected T&C:", selectedItems);
        setTandcSelections({});
        handleTandCClose();
      }}
    >
      Add Selected
    </Button>
  </Box>
</Modal>







    </section>
  );
};

export default AddQutation;

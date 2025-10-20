import React, { useState, useEffect,useMemo } from "react";
import { CiSearch } from "react-icons/ci";
import { IoMdPrint } from "react-icons/io";
import { IoDocumentText } from "react-icons/io5";
import { FaYoutube } from "react-icons/fa";
import { MdEdit, MdModelTraining } from "react-icons/md";
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
import TermsConditionSelector from "./TermsConditionModal";
import { useParams } from "react-router-dom"; 


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
  const [note,setNote]=useState("");
  const [contactPerson,setContactPerson] = useState("");
  const [references,setReferences]=useState("");
  const [endcustomer,setEndCustomer]=useState("");
  const [enddealer,setEndDealer]=useState("");


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
const [qutationNo,setQutationNo] = useState([]);
const [currentScpCount,setCurrentScpCount] = useState({});




const [openChargeDialog, setOpenChargeDialog] = useState(false);
const [openDiscountDialog, setOpenDiscountDialog] = useState(false);
const [chargeType, setChargeType] = useState("percent"); 
const [chargeValue, setChargeValue] = useState(0);
const [discountType, setDiscountType] = useState("percent");
const [discountValue, setDiscountValue] = useState(0);
const [finalTotal, setFinalTotal] = useState(0);

// charges and discounts arrays
const [extrcharges, setExtraCharges] = useState([]); 
const [additiondiscounts, setAdditiondiscounts] = useState([]); 

const [selectedFile, setSelectedFile]  = useState(null); 




  const { id } = useParams(); 
  const [isEditMode, setIsEditMode] = useState(false);
  const [quotationData, setQuotationData] = useState(null);

useEffect(()=>{
  console.log(selectedEmployee);
},[selectedEmployee])


useEffect(()=>{
  console.log(tandcSelections)
},[tandcSelections])


  useEffect(() => {
    console.log(quotationData);
  if (isEditMode && quotationData) {
    console.log('Edit Mode - Loaded Data:', quotationData);
    console.log('Extra Charges:', quotationData.ExtraCharges);
    console.log('Discounts:', quotationData.Discounts);
    console.log('Terms & Conditions:', quotationData.terms_and_conditions);
  }
}, [quotationData, isEditMode]);


useEffect(()=>{console.log(customers)},[customers]);

// useEffect(() => {
//   setOpenTandCModal(open);
// }, [open]);

  // Fetch customers from API using role endpoint
  const fetchCustomers = async (query = "") => {
    try {
      const response = await fetch(
        `${BASE_URL}/api/users/roles/customer?page=1&limit=10&filter=${query}`
      );
      const data = await response.json();
      console.log(data);
      setCustomers(data || []);
    } catch (err) {
      console.error("Error fetching customers:", err);
    }
  };


  // Fetch employees from API
  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/users/roles/employee?page=1&limit=20`);
      const data = await res.json();
      setEmployees(data || []);
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

  
  useEffect(()=>{
    console.log(tandc);
  },[tandc])






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



//   const handleSaveQuotation = async () => {
//   if (!selectedCustomer) return alert("Select a customer.");
//   if (!selectedEmployee) return alert("Select a sales credit.");
//   if (!tableItems.length) return alert("Add at least one item.");


// const payload = {
//   quotation: {
//     quotation_number: qutationNo,
//     quotation_date: new Date(quotationDate).toISOString(), // convert to ISO string
//     customer_id: Number(selectedCustomer.id),
//     sales_credit_person_id: selectedEmployee ? Number(selectedEmployee) : null,
//     qutation_scp_count: currentScpCount?currentScpCount.max_qutation_scp_count + 1:'0',
//     valid_until: new Date(validTill).toISOString(), // convert to ISO string
//     contact_person:contactPerson,
//     total_amount: grandTotal,
//     tax_amount: 0,
//     grand_total: finalTotal, 
//     extra_charges: extrcharges, 
//     discounts: additiondiscounts, 
//     status: "Draft",
//     created_by: Number(selectedEmployee),
//     billing_address_id: 1,
//     shipping_address_id: 1,
//     terms_and_conditions: tandcSelections,
//     note:note,
//     references:references,
//     end_customer_name:endcustomer,
//     end_dealer_name:enddealer,
//   },
//   quotation_items: tableItems.map((it) => ({
//     product_id: it.id,
//     product_variant_id: it.variantId,
//     description: it.name,
//     quantity: it.qty,
//     rate: it.rate,
//     tax_percent: 0,
//     tax_amount: it.cgst + it.sgst,
//     line_total: it.amount,
//   })),
// };


// const formData = new FormData();
// formData.append("quotation", JSON.stringify(payload.quotation));
// formData.append("quotation_items", JSON.stringify(payload.quotation_items));

// if(selectedFile){
//    formData.append("attachment", selectedFile);
// }

//   try {
//     setSaving(true);
//     const res = await axios.post(`${BASE_URL}/api/quotations`, formData,
//       {
//         headers: { "Content-Type": "multipart/form-data" },
//       }
//     );
//     alert("Quotation saved successfully.");
//     navigate("/quotation-list");
//   } catch (err) {
//     console.error(err?.response?.data || err);
//     alert("Failed to save quotation.");
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
      quotation_number: qutationNo,
      quotation_date: new Date(quotationDate).toISOString(),
      customer_id: Number(selectedCustomer.id),
      sales_credit_person_id: selectedEmployee ? Number(selectedEmployee) : null,
      qutation_scp_count: isEditMode ? currentScpCount?.max_qutation_scp_count : (currentScpCount?.max_qutation_scp_count + 1 || '0'),
      valid_until: new Date(validTill).toISOString(),
      contact_person: contactPerson,
      total_amount: grandTotal,
      tax_amount: 0,
      grand_total: finalTotal, 
      extra_charges: extrcharges, 
      discounts: additiondiscounts, 
      status: "Draft",
      created_by: Number(selectedEmployee),
      billing_address_id: null, 
      shipping_address_id: null, 
      terms_and_conditions: tandcSelections,
      note: note,
      references: references,
      end_customer_name: endcustomer,
      end_dealer_name: enddealer,
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

  const formData = new FormData();
  formData.append("quotation", JSON.stringify(payload.quotation));
  formData.append("quotation_items", JSON.stringify(payload.quotation_items));

  if (selectedFile) {
    formData.append("attachment", selectedFile);
  }

  try {
    setSaving(true);
    
    let res;
    if (isEditMode && id) {
      // UPDATE existing quotation
      res = await axios.put(`${BASE_URL}/api/quotations/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Quotation updated successfully.");
    } else {
      // CREATE new quotation
      res = await axios.post(`${BASE_URL}/api/quotations`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Quotation saved successfully.");
    }
    
    navigate("/quotation-list");
  } catch (err) {
    console.error(err?.response?.data || err);
    alert(`Failed to ${isEditMode ? 'update' : 'save'} quotation.`);
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

  useEffect(()=>{
    console.log(qutationNo);
  },[qutationNo])

  const  handleOnchabgeSalesCredit = async (e) =>{
      setSelectedEmployee(e.target.value)
      console.log(e.target.value);
       const res = await axios.get(`${BASE_URL}/api/quotations/max-scp-count/${e.target.value}`).then((res)=>{
          console.log(res.data)
          let result = res.data;
          setCurrentScpCount(result);
         const currentDate = new Date();
         const month =currentDate.getMonth() + 1;
         const year =  currentDate.getFullYear();
         const mm_year = `${month}/${year}`;
          if(result.max_qutation_scp_count == 0){
          
            let qtno = `EC${e.target.value}/001/${mm_year}`;
             setQutationNo(qtno)

            
          }else{
                let qtno = `EC${e.target.value}/00${ (result.max_qutation_scp_count + 1)}/${mm_year}`;
              setQutationNo(qtno)
          }
          
         

       }) 
      //alert("");
     
  }


  useEffect(() => {
  let total = grandTotal;

  // Apply all charges
  extrcharges.forEach((ch) => {
    if (ch.type === "percent") total += (grandTotal * ch.value) / 100;
    else total += ch.value;
  });




  // Apply all discounts
  additiondiscounts.forEach((ds) => {
    if (ds.type === "percent") total -= (grandTotal * ds.value) / 100;
    else total -= ds.value;
  });

  setFinalTotal(total);
}, [grandTotal, extrcharges, additiondiscounts]);










// edit mode


  useEffect(() => {
    if (id) {
      setIsEditMode(true);
      fetchQuotationData();
    }
  }, [id]);


const fetchQuotationData = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/quotations/${id}`);
      const data = response.data;
      setQuotationData(data);
      
      // Pre-fill all the form data
      console.log(data);
      prefillFormData(data);
    } catch (error) {
      console.error("Error fetching quotation data:", error);
      alert("Failed to load quotation data");
    }
  };




const prefillFormData = (data) => {
  // Pre-fill customer
  if (data.customer) {
    setSelectedCustomer(data.customer);
  }

  if(data.contact_person){
    setContactPerson(data.contact_person);
  }

  // Pre-fill employee/sales credit
  if (data.sales_credit_person_id) {
    setSelectedEmployee(data.sales_credit_person_id.toString());
  }

  // Pre-fill dates
  if (data.quotation_date) {
    setQuotationDate(data.quotation_date.split('T')[0]);
  }
  if (data.valid_until) {
    setValidTill(data.valid_until.split('T')[0]);
  }

  // Pre-fill quotation number
  if (data.quotation_number) {
    setQutationNo(data.quotation_number);
  }

  if(data.note){
    setNote(data.note);
  }

  if(data.references){
    setReferences(data.references);
  }

  if(data.end_customer_name){
    setEndCustomer(data.end_customer_name);
  }

  if(data.end_dealer_name){
    setEndDealer(data.end_dealer_name);
  }

  // Pre-fill table items
  if (data.quotation_items && data.quotation_items.length > 0) {
    const items = data.quotation_items.map(item => ({
      id: item.product_id,
      name: item.description,
      hsn: item.product?.HsnSacCode || '',
      unit: item.product?.Unit?.name || '',
      variantId: item.product_variant_id,
      qty: item.quantity,
      rate: item.rate,
      discount: 0,
      taxable: item.rate * item.quantity,
      cgst: item.tax_amount / 2,
      sgst: item.tax_amount / 2,
      amount: item.line_total,
      desc: item.description,
      leadTime: item.product?.LeadTime || '',
    }));
    setTableItems(items);
  }

  // Pre-fill terms and conditions - FIXED
  if (data.terms_and_conditions && Array.isArray(data.terms_and_conditions)) {
    setTandcSelections(data.terms_and_conditions);
  }

  // Pre-fill charges and discounts - FIXED
  if (data.ExtraCharges && Array.isArray(data.ExtraCharges)) {
    setExtraCharges(data.ExtraCharges);
  }
  if (data.Discounts && Array.isArray(data.Discounts)) {
    setAdditiondiscounts(data.Discounts);
  }

  // Pre-fill totals
  if (data.total_amount) {
    setGrandTotal(parseFloat(data.total_amount));
  }
  if (data.grand_total) {
    setFinalTotal(parseFloat(data.grand_total));
  }

  // Pre-fill SCP count
  if (data.qutation_scp_count) {
    setCurrentScpCount({
      max_qutation_scp_count: data.qutation_scp_count - 1
    });
  }
};


  return (
    <section className="right-content">
      <div className="qutation-create-header">
        <h5>Create Qutation</h5>
        <div className="qutation-create-header-buttons">
          <button>
           
            <span>
              
              <IoMdPrint />
            </span>
            Print Settings
          </button>
          <button onClick={() => navigate(-1)}>
           
            <span>
              
              <FaLongArrowAltLeft />
            </span>
            Back
          </button>
          <button onClick={() => handleSaveQuotation()} disabled={saving}>
           { isEditMode ?<span><MdEdit/> Update &nbsp;</span> :<span>
            
              <FaSave /> Save &nbsp;
            </span>}
            

             qutation
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
              <Select label="Copy From" sx={{ width: "260px" }} value="">
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
              <Select label="Copy From" sx={{ width: "260px" }} value="">
                <MenuItem disabled value="">
                  None
                </MenuItem>
              </Select>
            </FormControl>
          </div>

          <div className="form-cust-input">
            <FormControl size="small">
              <InputLabel>Series</InputLabel>
              <Select label="Copy From" sx={{ width: "260px" }} value="">
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
                        value={contactPerson}
                        onChange={(e)=>setContactPerson(e.target.value)}
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
                                onChange={(e) => handleOnchabgeSalesCredit(e) }
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
                        value={true}
                        id="checkDefault"
                        checked = {true}
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
                        value={qutationNo?qutationNo:''}
                      />
                    </div>
                    <div className="mt-2">
                      <TextField
                        label="Reference"
                        size="small"
                        sx={{ width: "260px" }}
                        value={references?references:''}
                        onChange={(e)=>setReferences(e.target.value)}
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
      <td>{item.taxable.toFixed(2)}</td>
      <td>{item.cgst.toFixed(2)}</td>
      <td>{item.sgst.toFixed(2)}</td>
      <td>{item.amount.toFixed(2)}</td>
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
            {/* <div className="customer-info-container flex-column">
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
            </div> */}

             {/* <TermsConditionSelector open={openTandCModal} handleClose={(p)=>{setTandcSelections(p)}}  initialSelections={isEditMode?tandcSelections:''}   /> */}


             <TermsConditionSelector 
              open={openTandCModal} 
              handleClose={(p,ec,ed) => { setTandcSelections(p);setEndCustomer(ec),setEndDealer(ed) }} 
              initialSelections={isEditMode ? tandcSelections : []}
              end_customer_name = {isEditMode?endcustomer:''} 
              end_dealer_name = {isEditMode?enddealer:''} 
            /> 
          </div>
          <div className="col-md-4">
           <div className="customer-info-container flex-column">
  <div className="row mb-2">
    <div className="col-12 d-flex justify-content-between">
      <strong>Subtotal</strong> <strong>  ₹ {grandTotal.toFixed(2)}</strong>
    </div>
   
  </div>

  {extrcharges.length > 0 && (
    <div className="mb-2">
      <strong>Extra Charges:</strong>
      {extrcharges.map((c, i) => (
        <div key={i} className="d-flex justify-content-between">
          <span>{c.title} ({c.type === "percent" ? `${c.value}%` : `₹${c.value}`})</span>
          <span>
            ₹{" "}
            {c.type === "percent"
              ? ((grandTotal * c.value) / 100).toFixed(2)
              : c.value.toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  )}

  {additiondiscounts.length > 0 && (
    <div className="mb-2">
      <strong>Discounts:</strong>
      {additiondiscounts.map((d, i) => (
        <div key={i} className="d-flex justify-content-between">
          <span>{d.title} ({d.type === "percent" ? `${d.value}%` : `₹${d.value}`})</span>
          <span>
            - ₹{" "}
            {d.type === "percent"
              ? ((grandTotal * d.value) / 100).toFixed(2)
              : d.value.toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  )}

  <div className="row border-top pt-2">
    <div className="col-12 d-flex justify-content-between">
      <strong>Final Total</strong> <strong>₹ {finalTotal.toFixed(2)}</strong>
    </div>
    
  </div>

  <div className="row mt-2">
    <div className="col-md-6">
      <button className="btn btn-warning rounded-0" 
            onClick={() => setOpenChargeDialog(true)}
            
            
            >
        + Add Charge
      </button>
    </div>
    <div className="col-md-6">
      <button className="btn btn-warning rounded-0" onClick={() => setOpenDiscountDialog(true)}>
        + Add Discount
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

                  <textarea cols={50}
                   value={note}
                   onChange={(e)=>setNote(e.target.value)}
                  
                  >

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
            <div className="col-md-12">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setSelectedFile(e.target.files[0])}
              />
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
                <button className="btn btn-warning rounded-0 ml-4" onClick={handleSaveQuotation} disabled={saving}> 

                { isEditMode ?<span><MdEdit/> Update &nbsp;</span> :<span>
            
              <FaSave /> Save &nbsp;
            </span>}
            
            
             qutation  
                  
                  
                </button>
                <button className="btn btn-warning rounded-0 ml-4" onClick={async ()=>{
                  await handleSaveQuotation();
                  // reset form for new quotation
                  setSelectedCustomer(null);
                  setTableItems([]);
                  setGrandTotal(0);
                }} disabled={saving}>
                  
                  { isEditMode ?<span><MdEdit/> Update &nbsp;</span> :<span>
            
              <FaSave /> Save &nbsp;
            </span>}
            
            
             qutation
                  
                  
                   & Add New </button>
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
                  <div>
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

                     
                  </div>

                  <div style={{width:"%"}}>
                    <TextField
                      label="Description"
                      size="small"
                      sx={{width:"100%",marginTop:"15px"}}
                      value={sel.desc}
                      onChange={(e) =>
                        setProductSelections((prev) => ({
                          ...prev,
                          [prod.ID]: { ...sel, desc: e.target.value },
                        }))
                      }
                    />
                  </div>
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








{/* Charges Dialog */}
<Modal open={openChargeDialog} onClose={() => setOpenChargeDialog(false)}>
  <Box
    sx={{
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: 450,
      bgcolor: "background.paper",
      boxShadow: 24,
      p: 3,
      borderRadius: 2,
      maxHeight: "80vh",
      overflowY: "auto",
    }}
  >
    <Typography variant="h6" gutterBottom>
      Add Extra Charges
    </Typography>

    {extrcharges.map((ch, i) => (
      <Box key={i} sx={{ display: "flex", gap: 1, mb: 1 }}>
        <TextField
          size="small"
          label="Title"
          value={ch.title}
          onChange={(e) =>
            setExtraCharges((prev) =>
              prev.map((c, idx) =>
                idx === i ? { ...c, title: e.target.value } : c
              )
            )
          }
        />
        <FormControl size="small" sx={{ width: 120 }}>
          <InputLabel>Type</InputLabel>
          <Select
            label="Type"
            value={ch.type}
            onChange={(e) =>
              setExtraCharges((prev) =>
                prev.map((c, idx) =>
                  idx === i ? { ...c, type: e.target.value } : c
                )
              )
            }
          >
            <MenuItem value="percent">%</MenuItem>
            <MenuItem value="item">₹</MenuItem>
          </Select>
        </FormControl>
        <TextField
          size="small"
          type="number"
          label="Value"
          value={ch.value}
          onChange={(e) =>
            setExtraCharges((prev) =>
              prev.map((c, idx) =>
                idx === i ? { ...c, value: Number(e.target.value) } : c
              )
            )
          }
        />
        <Button
          color="error"
          onClick={() =>
            setExtraCharges((prev) => prev.filter((_, idx) => idx !== i))
          }
        >
          ×
        </Button>
      </Box>
    ))}

    <Button
      variant="outlined"
      size="small"
      onClick={() =>
        setExtraCharges((prev) => [...prev, { title: "", type: "percent", value: 0 }])
      }
    >
      + Add Row
    </Button>

    <Box sx={{ textAlign: "right", mt: 2 }}>
      <Button variant="contained" onClick={() => setOpenChargeDialog(false)}>
        Done
      </Button>
    </Box>
  </Box>
</Modal>

{/* Discounts Dialog */}
<Modal open={openDiscountDialog} onClose={() => setOpenDiscountDialog(false)}>
  <Box
    sx={{
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: 450,
      bgcolor: "background.paper",
      boxShadow: 24,
      p: 3,
      borderRadius: 2,
      maxHeight: "80vh",
      overflowY: "auto",
    }}
  >
    <Typography variant="h6" gutterBottom>
      Add Discounts
    </Typography>

    {additiondiscounts.map((ds, i) => (
      <Box key={i} sx={{ display: "flex", gap: 1, mb: 1 }}>
        <TextField
          size="small"
          label="Title"
          value={ds.title}
          onChange={(e) =>
            setAdditiondiscounts((prev) =>
              prev.map((d, idx) =>
                idx === i ? { ...d, title: e.target.value } : d
              )
            )
          }
        />
        <FormControl size="small" sx={{ width: 120 }}>
          <InputLabel>Type</InputLabel>
          <Select
            label="Type"
            value={ds.type}
            onChange={(e) =>
              setAdditiondiscounts((prev) =>
                prev.map((d, idx) =>
                  idx === i ? { ...d, type: e.target.value } : d
                )
              )
            }
          >
            <MenuItem value="percent">%</MenuItem>
            <MenuItem value="item">₹</MenuItem>
          </Select>
        </FormControl>
        <TextField
          size="small"
          type="number"
          label="Value"
          value={ds.value}
          onChange={(e) =>
            setAdditiondiscounts((prev) =>
              prev.map((d, idx) =>
                idx === i ? { ...d, value: Number(e.target.value) } : d
              )
            )
          }
        />
        <Button
          color="error"
          // onClick={() =>
          //   // setDiscounts((prev) => prev.filter((_, idx) => idx !== i))
            
          // }

          onClick={() =>
             setAdditiondiscounts((prev) => prev.filter((_, idx) => idx !== i)) }
          >
          ×
        </Button>
      </Box>
    ))}

    <Button
      variant="outlined"
      size="small"
      onClick={() =>
        setAdditiondiscounts((prev) => [...prev, { title: "", type: "percent", value: 0 }])
      }
    >
      + Add Row

    </Button>

    <Box sx={{ textAlign: "right", mt: 2 }}>
      <Button variant="contained" onClick={() => setOpenDiscountDialog(false)}>
        Done
      </Button>
    </Box>
  </Box>
</Modal>














   


    </section>
    
  );
};

export default AddQutation;

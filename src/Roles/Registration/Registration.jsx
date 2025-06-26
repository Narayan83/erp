import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import Button from "@mui/material/Button";
import { MdOutlineClear } from "react-icons/md";
import {
  IoMdLock,
  IoMdMail,
  IoMdPerson,
  IoMdCall,
  IoMdGlobe,
  IoMdBusiness,
  IoMdHome,
  IoMdCard,
} from "react-icons/io";
import { FaUserTie, FaIndustry, FaIdCard } from "react-icons/fa";
import Skeleton from "@mui/material/Skeleton";
import { Today } from "@mui/icons-material";
// import "./Registration.scss";
import { BASE_URL } from "../../Config";

function Registration() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const mode = queryParams.get("mode") || "create";

  const initialFormState = {
    salutation: "Mr.",
    firstname: "",
    lastname: "",
    dob: "",
    gender: "Male",
    country_code: "+91",
    mobile_number: "",
    contact_no: "",
    email: "",
    website: "",
    business_name: "",
    title: "",
    companyname: "",
    designation: "",
    industry_segment: "",
    address1: "",
    address2: "",
    address3: "",
    address4: "",
    address5: "",
    state: "",
    country: "",
    pincode: "",
    contact_address1: "",
    contact_address2: "",
    contact_address3: "",
    contact_address4: "",
    contact_address5: "",
    contact_state: "",
    contact_country: "",
    contact_pincode: "",
    aadhar_number: "",
    pan_number: "",
    gstin: "",
    msme_no: "",
    password: "",
    confirmPassword: "",
    is_user: false,
    is_customer: false,
    is_supplier: false,
    is_dealer: false,
    is_other: false,

    role_ids: [],
    different_contact_address: false,
  };

  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);

  useEffect(() => {
    if (id) {
      fetchUserData();
    }
    setIsViewMode(mode === "view");
  }, [id, mode]);

  const fetchUserData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/registration_view/${id}`, {
        headers: {
          "Content-Type": "application/json",
        },
        // credentials: 'include' // If using cookies/sessions
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Handle case where data might be an array (if your backend returns array)
      const userData = Array.isArray(data) ? data[0] : data;

      if (!userData) {
        throw new Error("User data not found");
      }

      setFormData({
        salutation: userData.salutation || "Mr.",
        firstname: userData.firstname || "",
        lastname: userData.lastname || "",
        dob: userData.dob || "",
        gender: userData.gender || "Male",
        country_code: userData.country_code || "+91",
        mobile_number: userData.mobile_number || "",
        contact_no: userData.contact_no || "",
        email: userData.email || "",
        website: userData.website || "",
        business_name: userData.business_name || "",
        title: userData.title || "",
        companyname: userData.companyname || "",
        designation: userData.designation || "",
        industry_segment: userData.industry_segment || "",
        address1: userData.address1 || "",
        address2: userData.address2 || "",
        address3: userData.address3 || "",
        address4: userData.address4 || "",
        address5: userData.address5 || "",
        state: userData.state || "",
        country: userData.country || "",
        pincode: userData.pincode || "",
        contact_address1: userData.contact_address1 || "",
        contact_address2: userData.contact_address2 || "",
        contact_address3: userData.contact_address3 || "",
        contact_address4: userData.contact_address4 || "",
        contact_address5: userData.contact_address5 || "",
        contact_state: userData.contact_state || "",
        contact_country: userData.contact_country || "",
        contact_pincode: userData.contact_pincode || "",
        aadhar_number: userData.aadhar_number || "",
        pan_number: userData.pan_number || "",
        gstin: userData.gstin || "",
        msme_no: userData.msme_no || "",
        password: "", // Never pre-fill passwords
        confirmPassword: "", // Never pre-fill passwords
        is_user: userData.role_ids?.includes(1) || false,
        is_customer: userData.role_ids?.includes(2) || false,
        is_supplier: userData.role_ids?.includes(3) || false,
        is_dealer: userData.role_ids?.includes(4) || false,
        is_other: userData.role_ids?.includes(5) || false,
        role_ids: userData.role_ids || [],
        different_contact_address: Boolean(
          userData.contact_address1 ||
            userData.contact_address2 ||
            userData.contact_address3 ||
            userData.contact_address4 ||
            userData.contact_address5
        ),
      });
    } catch (err) {
      console.error("Error fetching user data:", err);
      setErrors((prev) => ({
        ...prev,
        form: err.message || "Failed to load user data",
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleTypeChange = (type) => {
    setFormData((prev) => {
      const newData = { ...prev };
      newData[`is_${type}`] = !prev[`is_${type}`];
      newData.role_ids = [];
      if (newData.is_user) newData.role_ids.push(1);
      if (newData.is_customer) newData.role_ids.push(2);
      if (newData.is_supplier) newData.role_ids.push(3);
      if (newData.is_is_dealer) newData.role_ids.push(4);
      if (newData.is_is_other) newData.role_ids.push(5);
      return newData;
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.is_user && !formData.is_customer && !formData.is_supplier&& !formData.is_dealer&& !formData.is_other) {
      newErrors.accountType = "Please select at least one account type";
    }

    if (!formData.firstname?.trim())
      newErrors.firstname = "First name is required";
    if (!formData.lastname?.trim())
      newErrors.lastname = "Last name is required";
    if (!formData.email?.trim()) newErrors.email = "Email is required";
    if (!formData.mobile_number?.trim())
      newErrors.mobile_number = "Mobile number is required";

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (formData.mobile_number && !/^\d{10}$/.test(formData.mobile_number)) {
      newErrors.mobile_number = "Mobile number must be 10 digits";
    }

    if (!id) {
      // Only validate password for new registrations
      if (!formData.password) newErrors.password = "Password is required";
      if (formData.password && formData.password.length < 6) {
        newErrors.password = "Password must be at least 6 characters";
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors((prev) => ({ ...prev, form: "" }));

    try {
      const url = id
        ? `${BASE_URL}/registration/${id}`
        : `${BASE_URL}/register`;
      const method = id ? "PUT" : "POST";

      // Prepare data - remove empty password fields if updating
      const dataToSend = { ...formData };
      if (id) {
        if (!dataToSend.password) delete dataToSend.password;
        if (!dataToSend.confirmPassword) delete dataToSend.confirmPassword;
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
      });

      const responseData = await response.json();

      if (!response.ok) {
        if (responseData.errors) {
          const serverErrors = {};
          responseData.errors.forEach((error) => {
            serverErrors[error.field] = error.message;
          });
          setErrors((prev) => ({ ...prev, ...serverErrors }));
        }
        throw new Error(
          responseData.message || (id ? "Update failed" : "Registration failed")
        );
      }

      navigate(id ? "/registration_view" : "/login", {
        state: {
          success: true,
          message: id
            ? "User updated successfully"
            : "Registration successful!",
        },
      });
    } catch (err) {
      console.error("Submission error:", err);
      setErrors((prev) => ({
        ...prev,
        form: err.message || "An error occurred. Please try again.",
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFormData(initialFormState);
    setErrors({});
  };

  // Render loading state
  if (isLoading && id) {
    return (
      <div className="login-container">
        <div className="login-content">
          <Skeleton variant="rectangular" width="100%" height={400} />
        </div>
      </div>
    );
  }

  return (
    <>
      <section className="right-content">
        <div className="login-header">
          <h2>
            {id
              ? isViewMode
                ? "View User"
                : "Edit User"
              : "Create an Account"}
          </h2>
          <p>
            {id ? "User details" : "Please fill in the details to register"}
          </p>
          <p> User/Customer/Supplier Registrations</p>
        </div>

        {errors.form && <div className="error-message">{errors.form}</div>}
        <div className="container">
          <form onSubmit={handleSubmit} className="card">
            {/* Account Type Selection */}
            <div className="row">
              <div className="col-md-12">
                <h5>Account Type (Select all that apply)</h5>
              </div>
              {/* user button */}
              <div className="col-sm-2 col-md-3 col-lg-4">
                <div className="form-container">
                  <div className="form-items">
                    <button
                      type="button"
                      className={`type-button ${
                        formData.is_user ? "active" : ""
                      }`}
                      onClick={() => handleTypeChange("user")}
                      disabled={isViewMode}
                    >
                      User
                    </button>
                  </div>
                </div>
              </div>
              {/* customer button */}
              <div className="col-sm-2 col-md-3 col-lg-4">
                <div className="form-container">
                  <div className="form-items">
                    <button
                      type="button"
                      className={`type-button ${
                        formData.is_customer ? "active" : ""
                      }`}
                      onClick={() => handleTypeChange("customer")}
                      disabled={isViewMode}
                    >
                      Customer
                    </button>
                  </div>
                </div>
              </div>
              {/* supplier button */}
              <div className="col-sm-2 col-md-3 col-lg-4">
                <div className="form-container">
                  <div className="form-items">
                    <button
                      type="button"
                      className={`type-button ${
                        formData.is_supplier ? "active" : ""
                      }`}
                      onClick={() => handleTypeChange("supplier")}
                      disabled={isViewMode}
                    >
                      Supplier
                    </button>
                  </div>
                </div>
              </div>
              {/* dealer button */}
              <div className="col-sm-2 col-md-3 col-lg-4">
                <div className="form-container">
                  <div className="form-items">
                    <button
                      type="button"
                      className={`type-button ${
                        formData.is_dealer ? "active" : ""
                      }`}
                      onClick={() => handleTypeChange("dealer")}
                      disabled={isViewMode}
                    >
                      Dealer
                    </button>
                  </div>
                </div>
              </div>
              {/* other button */}
              <div className="col-sm-2 col-md-3 col-lg-4">
                <div className="form-container">
                  <div className="form-items">
                    <button
                      type="button"
                      className={`type-button ${
                        formData.is_other ? "active" : ""
                      }`}
                      onClick={() => handleTypeChange("other")}
                      disabled={isViewMode}
                    >
                      other
                    </button>
                  </div>
                </div>
              </div>              

            </div>
            <div className="row">
              <div className="col-md-12">
                {errors.accountType && (
                  <span className="field-error">{errors.accountType}</span>
                )}
              </div>
            </div>
            {/* Personal Information */}
            <div className="row">
              <div className="col-md-12 mt-2 p-1 g-0">
                <h6>Personal Information</h6>
              </div>
            </div>
            <div className="row">
              <div className="col-sm-1 col-md-1 p-1 g-0">
                <div className="form-container">
                  <div className="form-items">
                    <label>Salutation</label>
                    <select
                      name="salutation"
                      value={formData.salutation}
                      onChange={handleChange}
                      disabled={isViewMode}
                    >
                      <option value="Mr.">Mr.</option>
                      <option value="Mrs.">Mrs.</option>
                      <option value="Ms.">Ms.</option>
                      <option value="Dr.">Dr.</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="col-sm-2 col-md-3 p-1 g-0">
                <div className="form-container">
                  <div className="form-items">
                    <label>First Name *</label>

                    <input
                      type="text"
                      placeholder="First Name *"
                      name="firstname"
                      value={formData.firstname || ""}
                      onChange={handleChange}
                      disabled={isViewMode}
                    />
                    {errors.firstname && (
                      <span className="field-error">{errors.firstname}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="col-sm-2 col-md-3 p-1 g-0">
                <div className="form-container">
                  <div className="form-items">
                    <label> Last Name * </label>

                    <input
                      type="text"
                      placeholder="Last Name *"
                      name="lastname"
                      value={formData.lastname || ""}
                      onChange={handleChange}
                      disabled={isViewMode}
                    />
                    {errors.lastname && (
                      <span className="field-error">{errors.lastname}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="col-sm-2 col-md-3 p-1 g-0">
                <div className="form-container">
                  <div className="form-items">
                    <label> Date of Birth </label>
                    <input
                      type="date"
                      placeholder="Date of Birth"
                      name="dob"
                      value={formData.dob || ""}
                      onChange={handleChange}
                      disabled={isViewMode}
                    />
                  </div>
                </div>
              </div>
              <div className="col-sm-2 col-md-2 p-1 g-0">
                <div className="form-container">
                  <div className="form-items">
                    <label> Gender </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      disabled={isViewMode}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-md-12 mt-2 p-1 g-0">
                <h6>Contact Information</h6>
              </div>
            </div>

            <div className="row">
              <div className="col-sm-1 col-md-1 p-1 g-0">
                <div className="form-container">
                  <div className="form-items">
                    <label> Country </label>
                    <select
                      name="country_code"
                      value={formData.country_code}
                      onChange={handleChange}
                      disabled={isViewMode}
                    >
                      <option value="+91">+91 (India)</option>
                      <option value="+1">+1 (USA)</option>
                      <option value="+44">+44 (UK)</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="col-sm-2 col-md-3 p-1 g-0">
                <div className="form-container">
                  <div className="form-items">
                    <label> Mobile Number *</label>
                    <input
                      type="text"
                      placeholder="Mobile Number *"
                      name="mobile_number"
                      value={formData.mobile_number || ""}
                      onChange={handleChange}
                      disabled={isViewMode}
                    />

                    {errors.mobile_number && (
                      <span className="field-error">
                        {errors.mobile_number}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="col-sm-2 col-md-3 p-1 g-0">
                <div className="form-container">
                  <div className="form-items">
                    <label>Other Contact Numbers </label>
                    <input
                      type="text"
                      placeholder="Other Contact Numbers"
                      name="contact_no"
                      value={formData.contact_no || ""}
                      onChange={handleChange}
                      disabled={isViewMode}
                    />
                  </div>
                </div>
              </div>
              <div className="col-sm-2 col-md-3 p-1 g-0">
                <div className="form-container">
                  <div className="form-items">
                    <label> Email </label>
                    <input
                      type="email"
                      placeholder="Email *"
                      name="email"
                      value={formData.email || ""}
                      onChange={handleChange}
                      disabled={isViewMode}
                    />
                  </div>
                </div>
              </div>
              <div className="col-sm-2 col-md-2 p-1 g-0">
                <div className="form-container">
                  <div className="form-items">
                    <label>Website</label>
                    <input
                      type="text"
                      placeholder="Website"
                      name="website"
                      value={formData.website || ""}
                      onChange={handleChange}
                      disabled={isViewMode}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="row mt-3">
              {/* Business Information (for customers/suppliers) */}
              {(formData.is_customer || formData.is_supplier|| formData.is_dealer|| formData.is_other) && (
                <div className="col-md-4 p-2 g-0 shadow-small">
                  <h6>Business Information</h6>

                  <div className="form-container">
                    <div className="form-items">
                      <label>Business Name </label>
                      <input
                        type="text"
                        placeholder="Business Name"
                        name="business_name"
                        value={formData.business_name || ""}
                        onChange={handleChange}
                        disabled={isViewMode}
                      />
                    </div>
                  </div>

                  <div className="form-container">
                    <div className="form-items">
                      <label>Title </label>
                      <input
                        type="text"
                        placeholder="Title"
                        name="title"
                        value={formData.title || ""}
                        onChange={handleChange}
                        disabled={isViewMode}
                      />
                    </div>
                  </div>
                  <div className="form-container">
                    <div className="form-items">
                      <label>Company Name</label>
                      <input
                        type="text"
                        placeholder="Company Name"
                        name="companyname"
                        value={formData.companyname || ""}
                        onChange={handleChange}
                        disabled={isViewMode}
                      />
                    </div>
                  </div>
                  <div className="form-container">
                    <div className="form-items">
                      <label>Designation </label>
                      <input
                        type="text"
                        placeholder="Designation"
                        name="designation"
                        value={formData.designation || ""}
                        onChange={handleChange}
                        disabled={isViewMode}
                      />
                    </div>
                  </div>
                  <div className="form-container">
                    <div className="form-items">
                      <label>Industry Segment</label>
                      <input
                        type="text"
                        placeholder="Industry Segment"
                        name="industry_segment"
                        value={formData.industry_segment || ""}
                        onChange={handleChange}
                        disabled={isViewMode}
                      />
                    </div>
                  </div>
                </div>
              )}
              {/* end of busines info  condition */}
              <div className="col-md-4 p-2 g-0 shadow-small">
                <h6>Primary Address</h6>
                {[1, 2, 3, 4, 5].map((num) => (
                  <div className="form-container">
                    <div className="form-items" key={`address${num}`}>
                      <input
                        type="text"
                        placeholder={`Address Line ${num}`}
                        name={`address${num}`}
                        value={formData[`address${num}`] || ""}
                        onChange={handleChange}
                        disabled={isViewMode}
                      />
                    </div>
                  </div>
                ))}
                {/* end of repeataion */}

                <div className="form-container">
                  <div className="form-items">
                    <label> State </label>
                    <input
                      type="text"
                      placeholder="State"
                      name="state"
                      value={formData.state || ""}
                      onChange={handleChange}
                      disabled={isViewMode}
                    />
                  </div>
                </div>

                <div className="form-container">
                  <div className="form-items">
                    <label>Country </label>
                    <input
                      type="text"
                      placeholder="Country"
                      name="country"
                      value={formData.country || ""}
                      onChange={handleChange}
                      disabled={isViewMode}
                    />
                  </div>
                </div>

                <div className="form-container">
                  <div className="form-items">
                    <label> Pincode </label>
                    <input
                      type="text"
                      placeholder="Pincode"
                      name="pincode"
                      value={formData.pincode || ""}
                      onChange={handleChange}
                      disabled={isViewMode}
                    />
                  </div>
                </div>

                {/* Contact Address (if different) */}

                <div className="form-container">
                  <div className="form-items">
                    <div className="checkbox-container d-flex align-items-center gap-1">
                      <input
                        type="checkbox"
                        name="different_contact_address"
                        checked={formData.different_contact_address}
                        onChange={handleChange}
                        disabled={isViewMode}
                        id="diff_adrs"
                      />
                      <label htmlFor="diff_adrs">
                        Contact address is different from primary address
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              {/* end of column two */}

              {formData.different_contact_address && (
                <div className="col-md-4 p-2 g-0 shadow-small">
                  <h6>Contact Address</h6>
                  {[1, 2, 3, 4, 5].map((num) => (
                    <div className="form-container">
                      <div className="form-items" key={`contact_address${num}`}>
                        <input
                          type="text"
                          placeholder={`Contact Address Line ${num}`}
                          name={`contact_address${num}`}
                          value={formData[`contact_address${num}`] || ""}
                          onChange={handleChange}
                          disabled={isViewMode}
                        />
                      </div>
                    </div>
                  ))}
                  {/* end of repeataion if contact address is  diffrent */}

                  <div className="form-container">
                    <div className="form-items">
                      <label> Contact State </label>
                      <input
                        type="text"
                        placeholder="Contact State"
                        name="contact_state"
                        value={formData.contact_state || ""}
                        onChange={handleChange}
                        disabled={isViewMode}
                      />
                    </div>
                  </div>

                  <div className="form-container">
                    <div className="form-items">
                      <label> Contact Country </label>
                      <input
                        type="text"
                        placeholder="Contact Country"
                        name="contact_country"
                        value={formData.contact_country || ""}
                        onChange={handleChange}
                        disabled={isViewMode}
                      />
                    </div>
                  </div>

                  <div className="form-container">
                    <div className="form-items">
                      <label> Contact Pincode </label>
                      <input
                        type="text"
                        placeholder="Contact Pincode"
                        name="contact_pincode"
                        value={formData.contact_pincode || ""}
                        onChange={handleChange}
                        disabled={isViewMode}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Legal Information */}

            <div className="row mt-2">
              <h6> Legal Information </h6>
              <div className="col-sm-2 col-md-3 p-1 g-0">
                <div className="form-container">
                  <div className="form-items">
                    <label>Aadhar Number</label>
                    <input
                      type="text"
                      placeholder="Aadhar Number"
                      name="aadhar_number"
                      value={formData.aadhar_number || ""}
                      onChange={handleChange}
                      disabled={isViewMode}
                    />
                  </div>
                </div>
              </div>
              <div className="col-sm-2 col-md-3 p-1 g-0">
                <div className="form-container">
                  <div className="form-items">
                    <label>PAN Number</label>

                    <input
                      type="text"
                      placeholder="PAN Number"
                      name="pan_number"
                      value={formData.pan_number || ""}
                      onChange={handleChange}
                      disabled={isViewMode}
                    />
                  </div>
                </div>
              </div>
              <div className="col-sm-2 col-md-3 p-1 g-0">
                <div className="form-container">
                  <div className="form-items">
                    <label>GSTIN</label>

                    <input
                      type="text"
                      placeholder="GSTIN"
                      name="gstin"
                      value={formData.gstin || ""}
                      onChange={handleChange}
                      disabled={isViewMode}
                    />
                  </div>
                </div>
              </div>
              <div className="col-sm-2 col-md-3 p-1 g-0">
                <div className="form-container">
                  <div className="form-items">
                    <label>MSME No</label>

                    <input
                      type="text"
                      placeholder="MSME No."
                      name="msme_no"
                      value={formData.msme_no || ""}
                      onChange={handleChange}
                      disabled={isViewMode}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Authentication (only for new registrations) */}

            {!id && (
              <div className="row mt-2">
                <h6> Authentication </h6>

                <div className="col-sm-2 col-md-3 p-1 g-0">
                  <div className="form-container">
                    <div className="form-items">
                      <label>Password</label>

                      <input
                        type="password"
                        placeholder="Password *"
                        name="password"
                        value={formData.password || ""}
                        onChange={handleChange}
                        className={errors.password ? "error" : ""}
                      />

                      {errors.password && (
                        <span className="field-error">{errors.password}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="col-sm-2 col-md-3 p-1 g-0">
                  <div className="form-container">
                    <div className="form-items">
                      <label>Confirm Password</label>

                      <input
                        type="password"
                        placeholder="Confirm Password *"
                        name="confirmPassword"
                        value={formData.confirmPassword || ""}
                        onChange={handleChange}
                        className={errors.confirmPassword ? "error" : ""}
                      />

                      {errors.confirmPassword && (
                        <span className="field-error">
                          {errors.confirmPassword}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Buttons */}
            {!isViewMode && (
              <div className="row">
                <div className="col-md-4">
                  <div className="form-container">
                    <div className="form-items">
                      <Button
                        variant="contained"
                        color="primary"
                        type="submit"
                        disabled={isLoading}
                        fullWidth
                      >
                        {isLoading
                          ? "Processing..."
                          : id
                          ? "Update"
                          : "Register"}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="form-container">
                    <div className="form-items">
                      <Button
                        variant="outlined"
                        color="secondary"
                        onClick={handleReset}
                        fullWidth
                        disabled={isLoading}
                      >
                        <MdOutlineClear className="mr-2" />
                        Reset
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isViewMode && (
              <div className="row">
                <div className="col-md-4">
                  <div className="form-container">
                    <div className="form-items">
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => navigate("/registration_view")}
                        fullWidth
                      >
                        Back to List
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {!id && (
              <div className="row">
                <div className="col-md-4">
                  <div className="form-container">
                    <div className="form-items">
                      <div className="login-footer">
                        <p>
                          Already have an account? <a href="/login">Sign in</a>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
      </section>
    </>
  );
}

export default Registration;

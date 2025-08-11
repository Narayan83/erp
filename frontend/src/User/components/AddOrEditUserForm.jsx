import React, { useEffect } from "react";
import {
  Grid,
  Typography,
  TextField,
  FormControlLabel,
  Checkbox,
  Button,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Box,
  Autocomplete,
} from "@mui/material";
import { useForm, Controller,useWatch  } from "react-hook-form";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../../Config" // adjust if needed
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import industries from "../industries.json";

const salutations = ["Mr", "Mrs", "Miss", "Dr", "Prof"];
const countries = [
  { name: "Afghanistan", code: "+93" },
  { name: "Albania", code: "+355" },
  { name: "Algeria", code: "+213" },
  { name: "Andorra", code: "+376" },
  { name: "Angola", code: "+244" },
  { name: "Argentina", code: "+54" },
  { name: "Armenia", code: "+374" },
  { name: "Australia", code: "+61" },
  { name: "Austria", code: "+43" },
  { name: "Azerbaijan", code: "+994" },
  { name: "Bahamas", code: "+1-242" },
  { name: "Bahrain", code: "+973" },
  { name: "Bangladesh", code: "+880" },
  { name: "Belarus", code: "+375" },
  { name: "Belgium", code: "+32" },
  { name: "Belize", code: "+501" },
  { name: "Benin", code: "+229" },
  { name: "Bhutan", code: "+975" },
  { name: "Bolivia", code: "+591" },
  { name: "Bosnia and Herzegovina", code: "+387" },
  { name: "Botswana", code: "+267" },
  { name: "Brazil", code: "+55" },
  { name: "Brunei", code: "+673" },
  { name: "Bulgaria", code: "+359" },
  { name: "Burkina Faso", code: "+226" },
  { name: "Burundi", code: "+257" },
  { name: "Cambodia", code: "+855" },
  { name: "Cameroon", code: "+237" },
  { name: "Canada", code: "+1" },
  { name: "Cape Verde", code: "+238" },
  { name: "Central African Republic", code: "+236" },
  { name: "Chad", code: "+235" },
  { name: "Chile", code: "+56" },
  { name: "China", code: "+86" },
  { name: "Colombia", code: "+57" },
  { name: "Comoros", code: "+269" },
  { name: "Congo", code: "+242" },
  { name: "Costa Rica", code: "+506" },
  { name: "Croatia", code: "+385" },
  { name: "Cuba", code: "+53" },
  { name: "Cyprus", code: "+357" },
  { name: "Czech Republic", code: "+420" },
  { name: "Denmark", code: "+45" },
  { name: "Djibouti", code: "+253" },
  { name: "Dominica", code: "+1-767" },
  { name: "Dominican Republic", code: "+1-809" },
  { name: "Ecuador", code: "+593" },
  { name: "Egypt", code: "+20" },
  { name: "El Salvador", code: "+503" },
  { name: "Equatorial Guinea", code: "+240" },
  { name: "Eritrea", code: "+291" },
  { name: "Estonia", code: "+372" },
  { name: "Eswatini", code: "+268" },
  { name: "Ethiopia", code: "+251" },
  { name: "Fiji", code: "+679" },
  { name: "Finland", code: "+358" },
  { name: "France", code: "+33" },
  { name: "Gabon", code: "+241" },
  { name: "Gambia", code: "+220" },
  { name: "Georgia", code: "+995" },
  { name: "Germany", code: "+49" },
  { name: "Ghana", code: "+233" },
  { name: "Greece", code: "+30" },
  { name: "Grenada", code: "+1-473" },
  { name: "Guatemala", code: "+502" },
  { name: "Guinea", code: "+224" },
  { name: "Guinea-Bissau", code: "+245" },
  { name: "Guyana", code: "+592" },
  { name: "Haiti", code: "+509" },
  { name: "Honduras", code: "+504" },
  { name: "Hungary", code: "+36" },
  { name: "Iceland", code: "+354" },
  { name: "India", code: "+91" },
  { name: "Indonesia", code: "+62" },
  { name: "Iran", code: "+98" },
  { name: "Iraq", code: "+964" },
  { name: "Ireland", code: "+353" },
  { name: "Israel", code: "+972" },
  { name: "Italy", code: "+39" },
  { name: "Jamaica", code: "+1-876" },
  { name: "Japan", code: "+81" },
  { name: "Jordan", code: "+962" },
  { name: "Kazakhstan", code: "+7" },
  { name: "Kenya", code: "+254" },
  { name: "Kiribati", code: "+686" },
  { name: "Kuwait", code: "+965" },
  { name: "Kyrgyzstan", code: "+996" },
  { name: "Laos", code: "+856" },
  { name: "Latvia", code: "+371" },
  { name: "Lebanon", code: "+961" },
  { name: "Lesotho", code: "+266" },
  { name: "Liberia", code: "+231" },
  { name: "Libya", code: "+218" },
  { name: "Liechtenstein", code: "+423" },
  { name: "Lithuania", code: "+370" },
  { name: "Luxembourg", code: "+352" },
  { name: "Madagascar", code: "+261" },
  { name: "Malawi", code: "+265" },
  { name: "Malaysia", code: "+60" },
  { name: "Maldives", code: "+960" },
  { name: "Mali", code: "+223" },
  { name: "Malta", code: "+356" },
  { name: "Marshall Islands", code: "+692" },
  { name: "Mauritania", code: "+222" },
  { name: "Mauritius", code: "+230" },
  { name: "Mexico", code: "+52" },
  { name: "Micronesia", code: "+691" },
  { name: "Moldova", code: "+373" },
  { name: "Monaco", code: "+377" },
  { name: "Mongolia", code: "+976" },
  { name: "Montenegro", code: "+382" },
  { name: "Morocco", code: "+212" },
  { name: "Mozambique", code: "+258" },
  { name: "Myanmar", code: "+95" },
  { name: "Namibia", code: "+264" },
  { name: "Nauru", code: "+674" },
  { name: "Nepal", code: "+977" },
  { name: "Netherlands", code: "+31" },
  { name: "New Zealand", code: "+64" },
  { name: "Nicaragua", code: "+505" },
  { name: "Niger", code: "+227" },
  { name: "Nigeria", code: "+234" },
  { name: "North Korea", code: "+850" },
  { name: "North Macedonia", code: "+389" },
  { name: "Norway", code: "+47" },
  { name: "Oman", code: "+968" },
  { name: "Pakistan", code: "+92" },
  { name: "Palau", code: "+680" },
  { name: "Palestine", code: "+970" },
  { name: "Panama", code: "+507" },
  { name: "Papua New Guinea", code: "+675" },
  { name: "Paraguay", code: "+595" },
  { name: "Peru", code: "+51" },
  { name: "Philippines", code: "+63" },
  { name: "Poland", code: "+48" },
  { name: "Portugal", code: "+351" },
  { name: "Qatar", code: "+974" },
  { name: "Romania", code: "+40" },
  { name: "Russia", code: "+7" },
  { name: "Rwanda", code: "+250" },
  { name: "Saint Kitts and Nevis", code: "+1-869" },
  { name: "Saint Lucia", code: "+1-758" },
  { name: "Saint Vincent and the Grenadines", code: "+1-784" },
  { name: "Samoa", code: "+685" },
  { name: "San Marino", code: "+378" },
  { name: "Sao Tome and Principe", code: "+239" },
  { name: "Saudi Arabia", code: "+966" },
  { name: "Senegal", code: "+221" },
  { name: "Serbia", code: "+381" },
  { name: "Seychelles", code: "+248" },
  { name: "Sierra Leone", code: "+232" },
  { name: "Singapore", code: "+65" },
  { name: "Slovakia", code: "+421" },
  { name: "Slovenia", code: "+386" },
  { name: "Solomon Islands", code: "+677" },
  { name: "Somalia", code: "+252" },
  { name: "South Africa", code: "+27" },
  { name: "South Korea", code: "+82" },
  { name: "South Sudan", code: "+211" },
  { name: "Spain", code: "+34" },
  { name: "Sri Lanka", code: "+94" },
  { name: "Sudan", code: "+249" },
  { name: "Suriname", code: "+597" },
  { name: "Sweden", code: "+46" },
  { name: "Switzerland", code: "+41" },
  { name: "Syria", code: "+963" },
  { name: "Taiwan", code: "+886" },
  { name: "Tajikistan", code: "+992" },
  { name: "Tanzania", code: "+255" },
  { name: "Thailand", code: "+66" },
  { name: "Togo", code: "+228" },
  { name: "Tonga", code: "+676" },
  { name: "Trinidad and Tobago", code: "+1-868" },
  { name: "Tunisia", code: "+216" },
  { name: "Turkey", code: "+90" },
  { name: "Turkmenistan", code: "+993" },
  { name: "Tuvalu", code: "+688" },
  { name: "Uganda", code: "+256" },
  { name: "Ukraine", code: "+380" },
  { name: "United Arab Emirates", code: "+971" },
  { name: "United Kingdom", code: "+44" },
  { name: "United States", code: "+1" },
  { name: "Uruguay", code: "+598" },
  { name: "Uzbekistan", code: "+998" },
  { name: "Vanuatu", code: "+678" },
  { name: "Vatican City", code: "+379" },
  { name: "Venezuela", code: "+58" },
  { name: "Vietnam", code: "+84" },
  { name: "Yemen", code: "+967" },
  { name: "Zambia", code: "+260" },
  { name: "Zimbabwe", code: "+263" },
];

const AddOrEditUserForm = ({ defaultValues = null, onSubmitUser }) => {
   const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState:  { isDirty, errors },
  } = useForm({
    defaultValues: {
    is_user: false,
    is_customer: false,
    is_supplier: false,
    is_employee: false,
    is_dealer: false,
    is_distributor: false,
    active: true,
    salutation: "",
    gender: "",
    // all your controlled values
  }
});

  // Additional addresses state and handlers
  const [additionalAddresses, setAdditionalAddresses] = React.useState([]);

  // Password visibility state
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const handleClickShowConfirmPassword = () => setShowConfirmPassword((show) => !show);
  const handleMouseDownPassword = (event) => { event.preventDefault(); };

  const handleAddAdditionalAddress = () => {
    setAdditionalAddresses([...additionalAddresses, {}]);
  };

  const handleRemoveAdditionalAddress = (idx) => {
    setAdditionalAddresses(additionalAddresses.filter((_, i) => i !== idx));
  };

  const handleAdditionalAddressChange = (idx, field, value) => {
    setAdditionalAddresses(addresses => {
      const updated = [...addresses];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };
    
  const isUser = watch("is_user", false); // default to false
  const sameAsPermanent = watch("same_as_permanent");


  // Watch permanent address fields
    const permanentAddress = useWatch({
      control,
      name: [
        "address1", "address2", "address3", "address4", "address5",
        "state", "country", "pincode"
      ],
    });


    useEffect(() => {
      console.log("defaultValues:", defaultValues);
    }, [defaultValues]);

  // Reset form with default values if editing
  useEffect(() => {
    if (defaultValues) {
      reset({
        ...defaultValues,
        dob: defaultValues.dob ? defaultValues.dob.split("T")[0] : "", 
        is_user: !!defaultValues.is_user,
        is_customer: !!defaultValues.is_customer,
        is_supplier: !!defaultValues.is_supplier,
        is_employee: !!defaultValues.is_employee,
        is_dealer: !!defaultValues.is_dealer,
        is_distributor: !!defaultValues.is_distributor,
        active: typeof defaultValues.active === 'boolean' ? defaultValues.active : true,
      });
    }
  }, [defaultValues, reset]);

  const onSubmit = async (data) => {
    try {
      // Ensure all required fields are present and empty strings are converted to undefined for pointer fields
      const payload = {
        ...data,
        id: defaultValues?.id || undefined,
        // Convert empty strings to undefined for pointer fields
        salutation: data.salutation || undefined,
        website: data.website || undefined,
        business_name: data.business_name || undefined,
        title: data.title || undefined,
        companyname: data.companyname || undefined,
        designation: data.designation || undefined,
        industry_segment: data.industry_segment || undefined,
        address1: data.address1 || undefined,
        address2: data.address2 || undefined,
        address3: data.address3 || undefined,
        address4: data.address4 || undefined,
        address5: data.address5 || undefined,
        state: data.state || undefined,
        country: data.country || undefined,
        pincode: data.pincode || undefined,
        aadhar_number: data.aadhar_number || undefined,
        pan_number: data.pan_number || undefined,
        gstin: data.gstin || undefined,
        msme_no: data.msme_no || undefined,
        bank_name: data.bank_name || undefined,
        branch_name: data.branch_name || undefined,
        branch_address: data.branch_address || undefined,
        account_number: data.account_number || undefined,
        ifsc_code: data.ifsc_code || undefined,
      };

      // Check required fields before sending
      const requiredFields = [
        "firstname",
        "lastname",
        "country_code",
        "mobile_number",
        "emergency_number",
        "alternate_number",
        "whatsapp_number",
        "email",
        "password"
      ];
      for (const field of requiredFields) {
        if (!payload[field]) {
          alert(`Field "${field}" is required.`);
          return;
        }
      }

      if (defaultValues?.id) {
        // Update user
        const response = await axios.put(`${BASE_URL}/api/users/${defaultValues.id}`, payload);
        alert("User updated successfully.");
        onSubmitUser(response.data);
      } else {
        // Add new user
        const response = await axios.post(`${BASE_URL}/api/users`, payload);
        alert("User added successfully.");
        onSubmitUser(response.data);
      }
    } catch (error) {
      console.error("Error submitting user form:", error);
      alert("Something went wrong. Please try again.");
    }
  };

  // Add support for key-value pairs in additional addresses
  const handleAddKeyValue = (idx) => {
    setAdditionalAddresses(addresses => {
      const updated = [...addresses];
      const prevKeyValues = Array.isArray(updated[idx].keyValues) ? updated[idx].keyValues : [];
      // Always create a new array to avoid mutation issues
      updated[idx] = {
        ...updated[idx],
        keyValues: [...prevKeyValues, { key: "", value: "" }]
      };
      return updated;
    });
  };

  const handleRemoveKeyValue = (addrIdx, kvIdx) => {
    setAdditionalAddresses(addresses => {
      const updated = [...addresses];
      updated[addrIdx].keyValues = (updated[addrIdx].keyValues || []).filter((_, i) => i !== kvIdx);
      return updated;
    });
  };

  const handleKeyValueChange = (addrIdx, kvIdx, field, value) => {
    setAdditionalAddresses(addresses => {
      const updated = [...addresses];
      if (!updated[addrIdx].keyValues) updated[addrIdx].keyValues = [];
      updated[addrIdx].keyValues[kvIdx] = {
        ...updated[addrIdx].keyValues[kvIdx],
        [field]: value
      };
      return updated;
    });
  };

  // Extract industry segments array
  const industrySegments = industries["industry segments"] || [];

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Typography variant="h5" gutterBottom>
        {defaultValues ? "Edit User" : "Add User"}
      </Typography>

      {/* === USER ROLES === */}
      <Grid container spacing={2}>
       <Grid size={{ xs: 12, md: 4 }}>
  <Typography variant="h6">Account Type (Select all that apply)</Typography>

  <Controller
    name="is_user"
    control={control}
    defaultValue={false}
    render={({ field }) => (
      <FormControlLabel
        control={<Checkbox checked={field.value} onChange={field.onChange} />}
        label="User"
      />
    )}
  />
  <Controller
    name="is_customer"
    control={control}
    defaultValue={false}
    render={({ field }) => (
      <FormControlLabel
        control={<Checkbox checked={field.value} onChange={field.onChange} />}
        label="Customer"
      />
    )}
  />
  <Controller
    name="is_supplier"
    control={control}
    defaultValue={false}
    render={({ field }) => (
      <FormControlLabel
        control={<Checkbox checked={field.value} onChange={field.onChange} />}
        label="Supplier"
      />
    )}
  />
  <Controller
    name="is_employee"
    control={control}
    defaultValue={false}
    render={({ field }) => (
      <FormControlLabel
        control={<Checkbox checked={field.value} onChange={field.onChange} />}
        label="Employee"
      />
    )}
  />
  <Controller
    name="is_dealer"
    control={control}
    defaultValue={false}
    render={({ field }) => (
      <FormControlLabel
        control={<Checkbox checked={field.value} onChange={field.onChange} />}
        label="Dealer"
      />
    )}
  />
  <Controller
    name="is_distributor"
    control={control}
    defaultValue={false}
    render={({ field }) => (
      <FormControlLabel
        control={<Checkbox checked={field.value} onChange={field.onChange} />}
        label="Distributor"
      />
    )}
  />
  <Controller
    name="active"
    control={control}
    defaultValue={true}
    render={({ field }) => (
      <FormControlLabel
        control={<Checkbox checked={!!field.value} onChange={e => field.onChange(e.target.checked)} />}
        label="Active"
      />
    )}
  />
</Grid>

         <Grid  size={{ xs: 12, md: 4 }}>
          <Box display="flex" alignItems="end" height="100%">
            <Button
            variant="outlined" onClick={() => navigate(`/users`)}  > View </Button>
          </Box>
         </Grid>

        {/* === PERSONAL INFO === */}
        <Grid size={{ xs: 12, md: 12 }}>
          <Typography variant="h6">Personal Information</Typography>
        </Grid>

        <Grid size={{ xs: 2, md: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Salutation</InputLabel>
            <Controller
              name="salutation"
              control={control}
              render={({ field }) => (
                <Select {...field} label="Salutation">
                  {salutations.map((salute) => (
                    <MenuItem key={salute} value={salute}>
                      {salute}
                    </MenuItem>
                  ))}
                </Select>
              )}
            />
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <TextField size="small" fullWidth label="First Name" {...register("firstname")} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <TextField size="small" fullWidth label="Last Name" {...register("lastname")} />
        </Grid>

        <Grid size={{ xs: 12, md: 2 }}>
          <TextField
            fullWidth
            label="Date of Birth"
            type="date"
            size="small"
            InputLabelProps={{ shrink: true }}
            {...register("dob")}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
        <FormControl fullWidth size="small">
          <InputLabel id="gender-label">Gender</InputLabel>
          <Controller
            name="gender"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                labelId="gender-label"
                label="Gender"
              >
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            )}
          />
        </FormControl>
      </Grid>
       


        <Grid size={{ xs: 12, md: 12 }}>
          <Typography variant="h6">Contact Information</Typography>
        </Grid>


        <Grid size={{ xs: 2, md: 2 }}>
          <Controller
            name="country"
            control={control}
            render={({ field }) => (
              <Autocomplete
                options={countries}
                getOptionLabel={(option) => option.name + ' (' + option.code + ')'}
                isOptionEqualToValue={(option, value) => option.name === value.name}
                value={countries.find((c) => c.name === field.value) || null}
                onChange={(_, newValue) => {
                  field.onChange(newValue ? newValue.name : "");
                  setValue("country_code", newValue ? newValue.code : "");
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Country" size="small" fullWidth />
                )}
                clearOnEscape
              />
            )}
          />
          {/* Hidden field to submit country code */}
          <Controller
            name="country_code"
            control={control}
            render={({ field }) => <input type="hidden" {...field} />}
          />
        </Grid>

         <Grid size={{ xs: 12, md: 3 }}>
          <TextField size="small" fullWidth label="Mobile Number" {...register("mobile_number", { required: true })} />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          {/* CHANGED: emergency_contact_no -> emergency_number */}
          <TextField size="small" fullWidth label="Emergency Contact Number" {...register("emergency_number", { required: true })} />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          {/* CHANGED: contact_no -> alternate_number */}
          <TextField size="small" fullWidth label="Alternate Contact No" {...register("alternate_number", { required: true })} />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <TextField size="small" fullWidth label="WhatsApp Number" {...register("whatsapp_number", { required: true })} />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <TextField size="small" fullWidth label="Email" {...register("email", { required: true })} />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <TextField size="small" fullWidth label="Website" {...register("website")} />
        </Grid>
      
        {/* === BUSINESS INFO === */}
        { !isUser &&(

           <>
            
                    <Grid size={{ xs: 12, md: 12 }}>
          <Typography variant="h6">Business Info</Typography>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <TextField size="small" fullWidth label="Business Name" {...register("business_name")} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <TextField size="small" fullWidth label="Company Name" {...register("companyname")} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <TextField size="small" fullWidth label="Designation" {...register("designation")} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <TextField size="small" fullWidth label="Title" {...register("title")} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          {/* Changed: Use dropdown for Industry Segment */}
          <Controller
            name="industry_segment"
            control={control}
            render={({ field }) => (
              <Autocomplete
                options={industrySegments}
                value={field.value || null}
                onChange={(_, newValue) => field.onChange(newValue || "")}
                renderInput={(params) => (
                  <TextField {...params} label="Industry Segment" size="small" fullWidth />
                )}
                clearOnEscape
                freeSolo={false}
              />
            )}
          />
        </Grid>
           </>
        )

        }
           
        

        {/* === PERMANENT ADDRESS === */}
        <Grid size={{ xs: 12, md: 12 }}>
          <Typography variant="h6">Permanent Address</Typography>
        </Grid>
        {[1, 2, 3, 4, 5].map((n) => (
          <Grid size={{ xs: 12, md: 3 }}  key={`address${n}`}>
            <TextField size="small" fullWidth label={`Address ${n}`} {...register(`address${n}`)} />
          </Grid>
        ))}
        <Grid size={{ xs: 12, md: 3 }} >
          {/* Show state dropdown if country is India, else show text field */}
          {watch("country") === "India" ? (
            <Controller
              name="state"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  options={[
                    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
                  ]}
                  value={field.value || null}
                  onChange={(_, newValue) => field.onChange(newValue || "")}
                  renderInput={(params) => (
                    <TextField {...params} label="State" size="small" fullWidth />
                  )}
                  clearOnEscape
                  freeSolo={false}
                />
              )}
            />
          ) : (
            <TextField size="small" fullWidth label="State" {...register("state")} />
          )}
        </Grid>
        {/* Country dropdown is already present above; removed redundant TextField */}
        <Grid size={{ xs: 12, md: 3 }}>
          <TextField size="small" fullWidth label="Pincode" {...register("pincode")} />
        </Grid>

        {/* === ADDITIONAL ADDRESSES CARD SECTION === */}
        <Grid size={{ xs: 12, md: 12 }}>
          <Typography variant="h6">Additional Address</Typography>
          <Box display="flex" flexWrap="wrap" gap={2} mb={2}>
            {additionalAddresses.map((address, idx) => (
              <Box key={idx} border={1} borderRadius={2} p={2} minWidth={250} position="relative">
                <Typography variant="subtitle1">Address {idx + 1}</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      size="small"
                      fullWidth
                      label="Address Name"
                      value={address.address_name || ""}
                      onChange={e => handleAdditionalAddressChange(idx, "address_name", e.target.value)}
                      sx={{ mb: 1 }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      size="small"
                      fullWidth
                      label="GSTIN"
                      value={address.gstin || ""}
                      onChange={e => handleAdditionalAddressChange(idx, "gstin", e.target.value)}
                      sx={{ mb: 1 }}
                    />
                  </Grid>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Grid item xs={12} md={6} key={`additional_${idx}_address${n}`}>
                      <TextField
                        size="small"
                        fullWidth
                        label={`Address ${n}`}
                        value={address[`address${n}`] || ""}
                        onChange={e => handleAdditionalAddressChange(idx, `address${n}`, e.target.value)}
                        sx={{ mb: 1 }}
                      />
                    </Grid>
                  ))}
                  <Grid item xs={12} md={6} sx={{ minWidth: 180 }}>
                    {/* Country dropdown */}
                    <Autocomplete
                      options={countries}
                      getOptionLabel={(option) => typeof option === 'string' ? option : (option.name + ' (' + option.code + ')')}
                      isOptionEqualToValue={(option, value) => option.name === value.name}
                      value={countries.find((c) => c.name === address.country) || null}
                      onChange={(_, newValue) => handleAdditionalAddressChange(idx, "country", newValue ? newValue.name : "")}
                      renderInput={(params) => (
                        <TextField {...params} label="Country" size="small" fullWidth />
                      )}
                      clearOnEscape
                      fullWidth
                      sx={{ minWidth: 180 }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6} sx={{ minWidth: 180 }}>
                    {/* State dropdown if country is India, else free text Autocomplete */}
                    {address.country === "India" ? (
                      <Autocomplete
                        options={[
                          "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
                        ]}
                        value={address.state || null}
                        onChange={(_, newValue) => handleAdditionalAddressChange(idx, "state", newValue || "")}
                        renderInput={(params) => (
                          <TextField {...params} label="State" size="small" fullWidth />
                        )}
                        clearOnEscape
                        freeSolo={false}
                        fullWidth
                        sx={{ minWidth: 180 }}
                      />
                    ) : (
                      <Autocomplete
                        options={[]}
                        value={address.state || ""}
                        onChange={(_, newValue) => handleAdditionalAddressChange(idx, "state", newValue || "")}
                        renderInput={(params) => (
                          <TextField {...params} label="State" size="small" fullWidth />
                        )}
                        freeSolo
                        clearOnEscape
                        fullWidth
                        sx={{ minWidth: 180 }}
                      />
                    )}
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      size="small"
                      fullWidth
                      label="Pincode"
                      value={address.pincode || ""}
                      onChange={e => handleAdditionalAddressChange(idx, "pincode", e.target.value)}
                      sx={{ mb: 1 }}
                    />
                  </Grid>
                  {/* === KEY-VALUE PAIRS SECTION === */}
                  <Grid item xs={12}>
                    {(address.keyValues || []).map((kv, kvIdx) => (
                      <Box key={kvIdx} display="flex" alignItems="center" gap={1} mb={1}>
                        <TextField
                          size="small"
                          label="Key"
                          value={kv.key}
                          onChange={e => handleKeyValueChange(idx, kvIdx, "key", e.target.value)}
                          sx={{ minWidth: 120 }}
                        />
                        <TextField
                          size="small"
                          label="Value"
                          value={kv.value}
                          onChange={e => handleKeyValueChange(idx, kvIdx, "value", e.target.value)}
                          sx={{ minWidth: 120 }}
                        />
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={() => handleRemoveKeyValue(idx, kvIdx)}
                        >
                          Remove
                        </Button>
                      </Box>
                    ))}
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleAddKeyValue(idx)}
                      sx={{ mt: 1 }}
                    >
                      Add Key-Value
                    </Button>
                  </Grid>
                </Grid>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={() => handleRemoveAdditionalAddress(idx)}
                  sx={{ position: 'absolute', top: 8, right: 8 }}
                >
                  Remove
                </Button>
              </Box>
            ))}
            <Box
              border={1}
              borderRadius={2}
              p={2}
              minWidth={250}
              display="flex"
              alignItems="center"
              justifyContent="center"
              sx={{ cursor: 'pointer', borderStyle: 'dashed', color: 'grey.500' }}
              onClick={handleAddAdditionalAddress}
            >
              <Typography variant="h6" color="primary" mr={1}>+</Typography>
              <Typography color="primary">Add Address</Typography>
            </Box>
          </Box>
        </Grid>


         {/* <Grid size={{ xs: 12, md: 6 }}>
          <FormControlLabel
            control={<Checkbox {...register("same_as_permanent")} />}
            label="Contact address same as Primary Address"
          />
        </Grid> */}

        {/* LEAGAL INFORMATION */}

        <Grid size={{ xs: 12, md: 12 }}>
          <Typography variant="h6"> Legal Information </Typography>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <TextField size="small" fullWidth label="Aadhar Number" {...register("aadhar_number")} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <TextField size="small" fullWidth label="PAN Number" {...register("pan_number")} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <TextField size="small" fullWidth label="GSTIN" {...register("gstin")} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <TextField size="small" fullWidth label="MSME No" {...register("msme_no")} />
        </Grid> 

       {/* BANK DETAILS */}

       <Grid size={{ xs: 12, md: 12 }}>
          <Typography variant="h6"> Bank Information </Typography>
        </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField size="small" fullWidth label="Bank Name" {...register("bank_name")} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField size="small" fullWidth label="Branch Name" {...register("branch_name")} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField size="small" fullWidth label="Branch Address" {...register("branch_address")} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField size="small" fullWidth label="Account Number" {...register("account_number")} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField size="small" fullWidth label="IFSC Code" {...register("ifsc_code")} />
          </Grid>


        {/* === AUTHENTICATION === */}
        <Grid size={{ xs: 12, md: 12 }}> 
           <Typography variant="h6"> Authentication </Typography>
        </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              size="small"
              fullWidth
              type={showPassword ? "text" : "password"}
              label="Password"
              {...register("password", {
                required: "Password is required",
                pattern: {
                  value: /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/,
                  message: "Password must be at least 8 characters, include an uppercase letter, a number, and a special character."
                }
              })}
              error={!!errors.password}
              // helperText={errors.password ? errors.password.message :
              //   "Password must be at least 8 characters, include an uppercase letter, a number, and a special character."}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      onMouseDown={handleMouseDownPassword}
                      edge="end"
                      size="small"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            <Typography variant="caption" color="textSecondary">
              Password requirements:
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                <li>At least one uppercase letter</li>
                <li>At least one number(0-9)</li>
                <li>At least one special character(!, @, #, $, %, etc)</li>
                <li>Minimum 8 characters</li>
              </ul>
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              size="small"
              fullWidth
              type={showConfirmPassword ? "text" : "password"}
              label="Confirm Password"
              {...register("confirmPassword", {
                validate: value => value === watch("password") || "Passwords do not match"
              })}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword ? errors.confirmPassword.message : ""}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle confirm password visibility"
                      onClick={handleClickShowConfirmPassword}
                      onMouseDown={handleMouseDownPassword}
                      edge="end"
                      size="small"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Grid>

        

        <Grid size={{ xs: 12, md: 12 }}>
          <Button type="submit" variant="contained" color="primary">
            {defaultValues ? "Update User" : "Add User"}
          </Button>
          <Button variant="outlined" onClick={() => reset({
            ...Object.fromEntries(Object.keys(watch()).map(k => [k, ""])),
            is_user: false,
            is_customer: false,
            is_supplier: false,
            country: "",
            country_code: ""
          })} style={{ marginLeft: 8 }}>
            Reset
          </Button>
        </Grid>
      </Grid>
    </form>
  );
};

export default AddOrEditUserForm;


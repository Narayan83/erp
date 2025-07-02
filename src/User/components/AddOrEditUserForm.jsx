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
} from "@mui/material";
import { useForm, Controller,useWatch  } from "react-hook-form";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../../Config" // adjust if needed

const salutations = ["Mr", "Mrs", "Miss", "Dr", "Prof"];
const countries = [
  { name: "India", code: "+91" },
  { name: "USA", code: "+1" },
  { name: "UK", code: "+44" },
  // add more as needed
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
    salutation: "",
    gender: "",
    // all your controlled values
  }
});
    
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


    useEffect(() => {
      if (sameAsPermanent) {
        // Map permanent to contact address fields
        setValue("contact_address1", permanentAddress[0] || "");
        setValue("contact_address2", permanentAddress[1] || "");
        setValue("contact_address3", permanentAddress[2] || "");
        setValue("contact_address4", permanentAddress[3] || "");
        setValue("contact_address5", permanentAddress[4] || "");
        setValue("contact_state", permanentAddress[5] || "");
        setValue("contact_country", permanentAddress[6] || "");
        setValue("contact_pincode", permanentAddress[7] || "");
      }else {
    // 🧹 Clear contact fields when unchecked
    setValue("contact_address1", "");
    setValue("contact_address2", "");
    setValue("contact_address3", "");
    setValue("contact_address4", "");
    setValue("contact_address5", "");
    setValue("contact_state", "");
    setValue("contact_country", "");
    setValue("contact_pincode", "");
  }
    }, [sameAsPermanent, permanentAddress, setValue]);

  // Reset form with default values if editing
  useEffect(() => {
    if (defaultValues) {
      reset({
        ...defaultValues,
        dob: defaultValues.dob ? defaultValues.dob.split("T")[0] : "", 
        is_user: !!defaultValues.is_user,
        is_customer: !!defaultValues.is_customer,
        is_supplier: !!defaultValues.is_supplier,
        contact_address1: !!defaultValues.contact_address1,
        contact_address2: !!defaultValues.contact_address2,
        contact_address3:!!defaultValues.contact_address3,
        contact_address4:!!defaultValues.contact_address4,
        contact_address5:!!defaultValues.contact_address5,
        contact_country:!!defaultValues.contact_country,
      });
    }
  }, [defaultValues, reset]);

  const onSubmit = async (data) => {
  try {
    const payload = {
      ...data,
      id: defaultValues?.id || undefined,
    };

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
          <FormControl fullWidth size="small">
            <InputLabel>Country</InputLabel>
         <Controller
              name="country"
              control={control}
              render={({ field: { onChange, ...rest } }) => (
                <FormControl fullWidth size="small">
                  <InputLabel>Country</InputLabel>
                  <Select
                    {...rest}
                    onChange={(e) => {
                      const selected = countries.find((c) => c.name === e.target.value);
                      onChange(selected.name); // set country name
                      setValue("country_code", selected.code); // set hidden field
                    }}
                    label="Country"
                    InputLabelProps={{ shrink: true }}
                  >
                    {countries.map((country) => (
                      <MenuItem key={country.code} value={country.name}>
                        {country.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />

            {/* Hidden field to submit country code */}
            <Controller
              name="country_code"
              control={control}
              render={({ field }) => <input type="hidden" {...field} />}
            />
          </FormControl>
        </Grid>

         <Grid size={{ xs: 12, md: 3 }}>
          <TextField size="small" fullWidth label="Mobile Number" {...register("mobile_number")} />
        </Grid>

       
       
        <Grid size={{ xs: 12, md: 3 }}>
          <TextField size="small" fullWidth label="Alternate Contact No" {...register("contact_no")} />
        </Grid>
         <Grid size={{ xs: 12, md: 3 }}>
          <TextField size="small" fullWidth label="Email" {...register("email")} />
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
          <TextField size="small" fullWidth label="Industry Segment" {...register("industry_segment")} />
        </Grid>
            
            
            
            </>
        )

        }
           
        

        {/* === PERMANENT ADDRESS === */}
        <Grid size={{ xs: 12, md: 12 }}>
          <Typography variant="h6">Primary Address</Typography>
        </Grid>
        {[1, 2, 3, 4, 5].map((n) => (
          <Grid size={{ xs: 12, md: 3 }}  key={`address${n}`}>
            <TextField size="small" fullWidth label={`Address ${n}`} {...register(`address${n}`)} />
          </Grid>
        ))}
        <Grid size={{ xs: 12, md: 3 }} >
          <TextField size="small" fullWidth label="State" {...register("state")} />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }} >
          <TextField size="small" fullWidth label="Country" {...register("country")} />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <TextField size="small" fullWidth label="Pincode" {...register("pincode")} />
        </Grid>


         <Grid size={{ xs: 12, md: 6 }}>
          <FormControlLabel
            control={<Checkbox {...register("same_as_permanent")} />}
            label="Contact address same as Primary Address"
          />
        </Grid>

        {/* === CONTACT ADDRESS === */}
        <Grid size={{ xs: 12, md: 12 }}>
          <Typography variant="h6">Contact Information</Typography>
        </Grid>
        {[1, 2, 3, 4, 5].map((n) => (
          <Grid size={{ xs: 12, md: 3 }} key={`contact_address${n}`}>
            <TextField size="small" InputLabelProps={{ shrink: true }} fullWidth label={`Contact Address ${n}`} {...register(`contact_address${n}`)} />
          </Grid>
        ))}
        <Grid size={{ xs: 12, md: 3 }}>
          <TextField size="small" InputLabelProps={{ shrink: true }} fullWidth label="Contact State" {...register("contact_state")} />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <TextField size="small" InputLabelProps={{ shrink: true }} fullWidth label="Contact Country" {...register("contact_country")} />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <TextField size="small" InputLabelProps={{ shrink: true }} fullWidth label="Contact Pincode" {...register("contact_pincode")} />
        </Grid>



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
        <Grid size={{ xs: 12, md: 12 }}>  
           <Typography variant="h6"> Authentication </Typography>
        </Grid>




        {/* === MISC === */}

          <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            size="small"
            fullWidth
            type="password"
            label="Password"
            {...register("password", {
              required: "Password is required",
            })}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
           <TextField
              size="small"
              fullWidth
              type="password"
              label="Confirm Password"
              // {...register("confirmPassword", {
              //   validate: (value) =>
              //     value === watch("password") || "Passwords do not match",
              // })}
            />

            {errors.confirmPassword && (
              <Typography color="error" variant="caption">
                {errors.confirmPassword.message}
              </Typography>
            )}
        </Grid>

        

        <Grid size={{ xs: 12, md: 12 }}>
          <Button type="submit" variant="contained" color="primary">
            {defaultValues ? "Update User" : "Add User"}
          </Button>
          <Button variant="outlined" onClick={() => reset()} style={{ marginLeft: 8 }}>
            Reset
          </Button>
        </Grid>
      </Grid>
    </form>
  );
};

export default AddOrEditUserForm;

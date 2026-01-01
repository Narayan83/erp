import React, { useState,useEffect } from "react";
import {
  Grid,
  Typography,
  Button,
  Divider,
  TextField,
  Autocomplete,
  IconButton,
  CircularProgress,
  Paper,
  Box,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";
import { useForm, Controller } from "react-hook-form";
import QuotationItemRow from "./QuotationItemRow"; // Adjust the import path as needed
import { BASE_URL } from "../../../Config";
import "../Quotation/_quotation.scss";
const QuotationForm = ({ initialData = null, onClose }) => {
  const { control, setValue, getValues, handleSubmit, watch, register } =
    useForm();
  const [customerOptions, setCustomerOptions] = useState([]);
  const [marketingOptions, setMarketingOptions] = useState([]);
  const [items, setItems] = useState([
    {
      product: null,
      product_id: null,
      product_variants: [],
      selected_variant: null,
      product_variant_id: null,
      quantity: 1,
      rate: 0,
      tax_percent: 0,
      tax_amount: 0,
      line_total: 0,
    },
  ]);

  const [discount, setDiscount] = useState(0);
  const [saved, setSaved] = useState(false);

  const [billingAddress, setBillingAddress] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");

  const quotationStatusOptions = [
    { label: "Draft", value: "Draft" },
    { label: "Sent", value: "Sent" },
    { label: "Accepted", value: "Accepted" },
    { label: "Rejected", value: "Rejected" },
  ];

  const handleCustomerSearch = async (query) => {
    const res = await axios.get(
      `${BASE_URL}/api/users?filter=${query}&isCustomer=true`
    );
    setCustomerOptions(res.data.data || []);
  };

  const formatAddress = (prefix, customer) => {
    const parts = [];
    for (let i = 1; i <= 5; i++) {
      if (customer[`${prefix}${i}`]) {
        parts.push(customer[`${prefix}${i}`]);
      }
    }
    if (customer[`${prefix}State`]) parts.push(customer[`${prefix}State`]);
    if (customer[`${prefix}Country`]) parts.push(customer[`${prefix}Country`]);
    if (customer[`${prefix}Pincode`])
      parts.push("Pincode: " + customer[`${prefix}Pincode`]);

    return parts.join(", ");
  };

  const handleMarketingSearch = async (query) => {
    const res = await axios.get(
      `${BASE_URL}/api/users?filter=${query}&isUser=true`
    );
    setMarketingOptions(res.data.data || []);
  };

  // Add new item row
  const addItem = () => {
    setItems([
      ...items,
      {
        product: null,
        product_id: null,
        product_variants: [],
        selected_variant: null,
        product_variant_id: null,
        quantity: 1,
        rate: 0,
        tax_percent: 0,
        tax_amount: 0,
        line_total: 0,
      },
    ]);
  };

  // Remove item row
  const removeItem = (index) => {
    const updated = [...items];
    updated.splice(index, 1);
    setItems(updated);
  };

  // Handle changes from child row
  const handleItemChange = (index, updatedItem) => {
    // console.log("Item changed at index:", index, "New data:", updatedItem);
    // const updated = [...items];
    // updated[index] = updatedItem;
    // setItems(updated);

    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updatedItem }; // ✅ force reference update
      return updated;
    });
  };

  // Calculate totals
  const totalAmount = items.reduce((sum, i) => sum + (i.line_total || 0), 0);
  const totalTax = items.reduce((sum, i) => sum + (i.tax_amount || 0), 0);
  const baseAmount = totalAmount - totalTax;
  const watchDiscount = watch("discount") || 0;
  const grandTotal = totalAmount - watchDiscount;

  const onSubmit = async (data) => {
    const payload = {
      quotation: {
        customer_id: data.customer_id,
        marketing_person_id: data.marketing_person_id,
        quotation_date:
          new Date(data.quotation_date).toISOString() ||
          new Date().toISOString().split("T")[0],
        valid_until:
          new Date(data.valid_until).toISOString() ||
          new Date().toISOString().split("T")[0],
        discount: Number(data.discount) || 0,
        status: data.status || "Draft",
        quotation_number: `Q-${Date.now()}`,
        tax_amount: totalTax,
        total_amount: baseAmount,
        grand_total: grandTotal,
        billing_address: billingAddress,
        shipping_address: shippingAddress,

        //Newly added fields
        currency: data.currency || "",
        exchange_rate: Number(data.exchangeRate) || 1,
        revised: !!data.revised,
        shipping_code: data.shippingCode || "",
        gst_applicable: !!data.gstApplicable,
        sales_credit: data.salesCredit || "",
        terms_and_conditions: data.termsAndConditions || "",
        reference: data.reference || "",
        note: data.note || "",
      },
      quotation_items: items.map((item) => ({
        product_id: item.product_id,
        product_variant_id: item.product_variant_id,
        quantity: item.quantity,
        description: "",
        rate: item.rate,
        tax_percent: item.tax_percent,
        tax_amount: item.tax_amount,
        line_total: item.line_total,
      })),
    };
    console.log("Submitting:", payload);
    // axios.post(`${BASE_URL}/api/quotations`, payload);

    try {
      if (initialData) {
        // Edit mode: PUT
        await axios.put(
          `${BASE_URL}/api/quotations/${initialData.quotation_id}`,
          payload,{
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        alert("Quotation updated successfully!");
      } else {
        // Create mode: POST
        await axios.post(`${BASE_URL}/api/quotations`, payload, {
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then((res) => {
        console.log("Saved:", res.data);
      })
      .catch((err) => {
        console.error("Error saving quotation:", err);
      });
        alert("Quotation created successfully!");
      }
      setSaved(true);
      if (onClose) onClose();
    } catch (error) {
      console.error("Error saving quotation:", error);
      alert("Failed to save quotation.");
    }

    
      

    // end of submit function
  };

  useEffect(() => {

    console.log("Initial data changed:", initialData);
    if (initialData) {
      setValue("customer_id", initialData.customer_id);
      setValue("customer", initialData.customer); // ✅ Needed to show name in Autocomplete
      setCustomerOptions(initialData.customer ? [initialData.customer] : []);
      setValue("customer", initialData.customer || null);
      setValue("marketing_person_id", initialData.marketing_person_id);
      setValue("marketing_person", initialData.marketing_person);
      setMarketingOptions(
        initialData.marketing_person ? [initialData.marketing_person] : []);
      setValue(
        "quotation_date",
        initialData.quotation_date?.split("T")[0] || ""
      );
      setValue("valid_until", initialData.valid_until?.split("T")[0] || "");
      setValue("discount", initialData.discount || 0);
      setValue("status", initialData.status || "Draft");

      setValue("currency", initialData.currency || "");
      setValue("exchangeRate", initialData.exchange_rate || 1);
      setValue("revised", initialData.revised || false);
      setValue("shippingCode", initialData.shipping_code || "");
      setValue("gstApplicable", initialData.gst_applicable || false);
      setValue("salesCredit", initialData.sales_credit || "");
      setValue("termsAndConditions", initialData.terms_and_conditions || "");
      setValue("reference", initialData.reference || "");
      setValue("note", initialData.note || "");

      setBillingAddress(initialData.billing_address || "");
      setShippingAddress(initialData.shipping_address || "");

      setItems(
        initialData.quotation_items?.map((item) => ({
          ...item,
          product: item.product || null,
          product_variants: item.product?.variants || [],
          selected_variant: item.product_variant || null,
        })) || []
      );
    }
  }, [initialData, setValue]);

    useEffect(() => {
      console.log("Items changed:", items);
    }, [items]);
  return (
    <section className="right-content">
      <Button variant="text" onClick={onClose}>
        ❌ Cancel Edit
      </Button>
      <div style={{ padding: 16 }}>
        <Typography variant="h5">Create Quotation</Typography>
        <Divider sx={{ my: 2 }} />

        <Grid container spacing={2}>
          {/* Customer */}
          <Grid item size={{ xs: 12, md: 2 }}>
            <Controller
              name="customer_id"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  options={customerOptions}
                  getOptionLabel={(option) =>
                    option.firstname + " " + option.lastname
                  }
                  onInputChange={(e, val) => handleCustomerSearch(val)}
                  value={watch("customer") || null} // ✅ Bind selected value
                  onChange={(e, value) => {
                    field.onChange(value?.id);
                    setValue("customer", value);

                    if (value) {
                      const billing = formatAddress("address", value);
                      const shipping = formatAddress("contact_address", value);
                      setBillingAddress(billing);
                      setShippingAddress(shipping);
                    } else {
                      setBillingAddress("");
                      setShippingAddress("");
                    }
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Customer" size="small" />
                  )}
                />
              )}
            />
          </Grid>

          {/* Marketing */}
          <Grid item size={{ xs: 12, md: 2 }}>
            <Controller
              name="marketing_person_id"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  options={marketingOptions}
                  getOptionLabel={(option) =>
                    option.firstname + " " + option.lastname
                  }
                  onInputChange={(e, val) => handleMarketingSearch(val)}
                  value={watch("marketing_person") || null} // ✅ Bind selected value
                  onChange={(e, value) => {
                    field.onChange(value?.id);
                    setValue("marketing_person", value);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Marketing Person"
                      size="small"
                    />
                  )}
                />
              )}
            />
          </Grid>

          {/* Quotation Meta Fields */}
          {[
            { name: "quotation_date", label: "Quotation Date" },
            { name: "valid_until", label: "Valid Until" },
          ].map(({ name, label }) => (
            <Grid item xs={12} md={6} key={name}>
              <Controller
                name={name}
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={label}
                    type="date"
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                )}
              />
            </Grid>
          ))}

          <Grid item size={{ xs: 12, md: 2 }}>
            <Controller
              name="status"
              control={control}
              defaultValue="Draft" // Optional: default status
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Quotation Status"
                  fullWidth
                  size="small"
                  SelectProps={{ native: true }}
                >
                  {quotationStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </TextField>
              )}
            />
          </Grid>
        </Grid>

        <Paper style={{ padding: 16, marginBottom: 25, marginTop: 16 }}>
          <Typography variant="h6" gutterBottom>
            Quotation Items
          </Typography>

          {items.map((item, index) => (
            <QuotationItemRow
              key={index}
              index={index}
              item={item}
              onChange={handleItemChange}
              onRemove={removeItem}
            />
          ))}
          <Button variant="outlined" onClick={addItem} sx={{ mb: 2 }}>
            Add Item
          </Button>
        </Paper>

        <Grid container spacing={2} sx={{ mt: 1 }}>
          {/* Billing Address */}
          <Grid item size={{ xs: 12, md: 6 }}>
            <TextField
              label="Billing Address"
              multiline
              minRows={4}
              fullWidth
              value={billingAddress}
              onChange={(e) => setBillingAddress(e.target.value)}
              InputProps={{
                endAdornment: (
                  <Button onClick={() => setBillingAddress("")} size="small">
                    Clear
                  </Button>
                ),
              }}
            />
          </Grid>

          {/* Shipping Address */}
          <Grid item size={{ xs: 12, md: 6 }}>
            <TextField
              label="Shipping Address"
              multiline
              minRows={4}
              fullWidth
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              InputProps={{
                endAdornment: (
                  <Button onClick={() => setShippingAddress("")} size="small">
                    Clear
                  </Button>
                ),
              }}
            />
          </Grid>
        </Grid>

        <Grid container spacing={2} sx={{ mb: 2, mt: 2 }}>
          {/* LEFT COLUMN */}
          <Grid item size={{ xs: 12, md: 6 }}>
            <Grid container spacing={2}>
              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  label="Currency"
                  name="currency"
                  size="small"
                  fullWidth
                  {...register("currency")}
                />
              </Grid>

              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  label="Exchange Rate"
                  name="exchangeRate"
                  type="number"
                  size="small"
                  fullWidth
                  {...register("exchangeRate", { valueAsNumber: true })}
                />
              </Grid>

              <Grid item size={{ xs: 12, md: 4 }}>
                <FormControlLabel
                  control={
                    <Controller
                      name="revised"
                      control={control}
                      defaultValue={false}
                      render={({ field }) => (
                        <Checkbox {...field} checked={field.value} />
                      )}
                    />
                  }
                  label="Revised"
                />
              </Grid>

              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  label="Shipping Code"
                  name="shippingCode"
                  size="small"
                  fullWidth
                  {...register("shippingCode")}
                />
              </Grid>

              <Grid item size={{ xs: 12, md: 4 }}>
                <FormControlLabel
                  control={
                    <Controller
                      name="gstApplicable"
                      control={control}
                      defaultValue={true}
                      render={({ field }) => (
                        <Checkbox {...field} checked={field.value} />
                      )}
                    />
                  }
                  label="GST Applicable"
                />
              </Grid>

              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  label="Sales Credit"
                  name="salesCredit"
                  size="small"
                  fullWidth
                  {...register("salesCredit")}
                />
              </Grid>

              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  label="Terms and Conditions"
                  name="termsAndConditions"
                  size="small"
                  fullWidth
                  multiline
                  minRows={3}
                  {...register("termsAndConditions")}
                />
              </Grid>

              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  label="Reference"
                  name="reference"
                  size="small"
                  multiline
                  minRows={3}
                  fullWidth
                  {...register("reference")}
                />
              </Grid>

              <Grid item size={{ xs: 12, md: 4 }}>
                <TextField
                  label="Note"
                  name="note"
                  size="small"
                  fullWidth
                  multiline
                  minRows={3}
                  {...register("note")}
                />
              </Grid>
            </Grid>
          </Grid>

          {/* RIGHT COLUMN */}
          <Grid item size={{ xs: 12, md: 6 }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: 2,
                width: { xs: "100%", md: "100%" },
                ml: "auto",
              }}
            >
              <TextField
                label="Base Amount"
                size="small"
                value={baseAmount.toFixed(2)}
                fullWidth
                disabled
                slotProps={{
                  htmlInput: {
                    sx: {
                      textAlign: "right", // Align the text right
                    },
                  },
                }}
              />

              <TextField
                label="Total Tax"
                size="small"
                value={totalTax.toFixed(2)}
                fullWidth
                disabled
                slotProps={{
                  htmlInput: {
                    sx: {
                      textAlign: "right", // Align the text right
                    },
                  },
                }}
              />

              <TextField
                label="Total"
                size="small"
                value={totalAmount.toFixed(2)}
                fullWidth
                disabled
                slotProps={{
                  htmlInput: {
                    sx: {
                      textAlign: "right", // Align the text right
                    },
                  },
                }}
              />

              <Controller
                name="discount"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Discount"
                    type="number"
                    size="small"
                    fullWidth
                    slotProps={{
                      htmlInput: {
                        sx: {
                          textAlign: "right", // Align the text right
                        },
                      },
                    }}
                    onChange={(e) =>
                      field.onChange(parseFloat(e.target.value) || 0)
                    }
                  />
                )}
              />

              <TextField
                label="Grand Total"
                size="small"
                value={grandTotal.toFixed(2)}
                fullWidth
                disabled
                slotProps={{
                  htmlInput: {
                    sx: {
                      textAlign: "right", // Align the text right
                    },
                  },
                }}
              />
            </Box>
          </Grid>
        </Grid>
      </div>

      <div className="actions">
        {!saved ? (
          <>
            <button className="btn primary" onClick={handleSubmit(onSubmit)}>
              💾 Save
            </button>
            <button className="btn secondary" onClick={() => window.print()}>
              🖨️ Print
            </button>
            <button
              className="btn secondary"
              onClick={() =>
                window.open(
                  `mailto:?subject=Quotation&body=See attached quotation.`
                )
              }
            >
              📤 Share by Email
            </button>
            <button
              className="btn secondary"
              onClick={() =>
                window.open(`https://wa.me/?text=See attached quotation.`)
              }
            >
              📲 Share by WhatsApp
            </button>
            <button className="btn secondary">⬇️ Export Excel</button>
            <button className="btn success" disabled>
              ⇢ Convert to PO
            </button>
            <button
              className="btn secondary"
              onClick={() => window.history.back()}
            >
              ⬅️ Back
            </button>
          </>
        ) : (
          // <>
          //   <button className="btn primary" onClick={handleEdit}>
          //     ✏️ Edit
          //   </button>
          //   <button className="btn danger" onClick={handleDelete}>
          //     🗑️ Delete
          //   </button>
          //   <button className="btn secondary" onClick={() => alert("Revised!")}>
          //     🔁 Revised
          //   </button>
          //   <button className="btn secondary" onClick={() => window.print()}>
          //     🖨️ Print
          //   </button>
          //   <button
          //     className="btn secondary"
          //     onClick={() =>
          //       window.open(
          //         `mailto:?subject=Quotation&body=See attached quotation.`
          //       )
          //     }
          //   >
          //     📤 Share by Email
          //   </button>
          //   <button
          //     className="btn secondary"
          //     onClick={() =>
          //       window.open(`https://wa.me/?text=See attached quotation.`)
          //     }
          //   >
          //     📲 Share by WhatsApp
          //   </button>
          //   <button className="btn secondary" onClick={handleExport}>
          //     ⬇️ Export Excel
          //   </button>
          //   <button className="btn success" disabled>
          //     ⇢ Convert to PO
          //   </button>
          //   <button
          //     className="btn secondary"
          //     onClick={() => window.history.back()}
          //   >
          //     ⬅️ Back
          //   </button>
          // </>
          <></>
        )}
      </div>
    </section>
  );
};

export default QuotationForm;

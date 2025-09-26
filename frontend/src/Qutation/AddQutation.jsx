import React from "react";
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

import {
  Grid,
  TextField,
  Button,
  MenuItem,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  Checkbox,
  FormControlLabel,
} from "@mui/material";

const AddQutation = () => {
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
          <button>
            {" "}
            <span>
              {" "}
              <FaLongArrowAltLeft />{" "}
            </span>{" "}
            Back{" "}
          </button>
          <button>
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
            <TextField label="Customer" size="small" sx={{ width: "260px" }} />

            <div className="search-and-add-customer">
              <button>
                {" "}
                <CiSearch />{" "}
              </button>
              <button>
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
                      <div >
                           <TextField label="Contact Person" size="small" sx={{ width: "260px" }} />

                      </div>
                      <div className="mt-2" >
                           <button className="btn btn-warning rounded-0"> + Click here to add Address  </button>

                      </div>

                  </div>

                  <div className="col-md-6">
                      <div >
                          <FormControl size="small">
                          <InputLabel>Sales Credit</InputLabel>
                          <Select label="Sales Credit" sx={{ width: "260px" }}>
                            <MenuItem disabled value="">
                              None
                            </MenuItem>
                          </Select>
                        </FormControl>

                      </div>
                      <label className="mt-4">Shipping Address</label>
                      <div class="form-check ">
                        <input class="form-check-input border-1" type="checkbox" value="" id="checkDefault" />
                        <label class="form-check-label" for="checkDefault">
                          Same as Billing Address
                        </label>
                      </div>

                  </div>

                   <div className="col-md-3">
                    <h5>Document Details</h5>
                    <div>
                        <TextField label="Qutation No" size="small" sx={{ width: "260px" }} />

                    </div>
                    <div>
                        <TextField label="Reference" size="small" sx={{ width: "260px" }} />
                    </div>
                    <div>
                        <TextField label="Qutation Date" size="small" sx={{ width: "260px" }} />
                    </div>
                    <div>
                        <TextField label="Valid Till" size="small" sx={{ width: "260px" }} />
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
                  <th>Amouunt</th>
                  <th>Lead Time</th>
                </thead>
                <tbody></tbody>
              </table>
            </div>
            <div className="col-md-12">
              <button className="btn btn-secondary rounded-0"> + Add Item</button>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="row">
          <div className="col-md-8">
             <div className="customer-info-container flex-column">
              <h5>Terms & Condition</h5>
              <div>
                <TextField label="End Customer Name" size="small" sx={{ width: "100%" }} />
              </div>
              <div>
                <TextField label="Sub Dealer Name" size="small" sx={{ width: "100%" }} />
              </div>
              <div className="mt-2">
                <button className="btn btn-secondary rounded-0"> + Add Terms/ Condition </button>

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
                  <strong>00.000</strong>
                </div>
                </div>

                <div className="row">
                <div className="col-md-6">
                  <strong>Grand Total</strong>
                </div>
                <div className="col-md-6">
                  <strong>00.000</strong>
                </div>
                </div>

                <div className="row">
                <div className="col-md-6">
                  <button className="btn btn-warning rounded-0"> + add Charges </button>
                </div>
                <div className="col-md-6">
                   <button className="btn btn-warning rounded-0"> + add Discount </button>
                </div>
                </div>


              </div>
              


            </div>

          </div>
        </div>
      
    </section>
  );
};

export default AddQutation;

import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom"; // ✅ include useParams
import { BASE_URL } from "../../Config";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import { IoMdSave, IoMdClose } from "react-icons/io";
import { MdOutlinePermIdentity } from "react-icons/md";
import Skeleton from "@mui/material/Skeleton";

// List of available permissions (customize based on your application needs)
const PERMISSIONS = ["create", "read", "update", "delete"];

function RoleCreation() {
  const [roleData, setRoleData] = useState({
    name: "",
    description: "",
    permissions: [],
    isDefault: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const { id } = useParams();

  useEffect(() => {
    const fetchRole = async () => {
      if (id) {
        setIsLoading(true);
        try {
          const token = localStorage.getItem("token") || "";
          const headers = {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          };

          const response = await fetch(`${BASE_URL}/roles/${id}`, {
            method: "GET",
            headers: headers,
            credentials: "include",
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || "Failed to fetch role");
          }

          // Populate form with fetched data
          setRoleData({
            name: data.name || "",
            description: data.description || "",
            permissions: data.permissions || [],
            isDefault: data.isDefault || false,
          });
        } catch (err) {
          console.error("Error fetching role:", err);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchRole();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setRoleData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handlePermissionChange = (event) => {
    const { value } = event.target;
    setRoleData((prev) => ({ ...prev, permissions: value }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!roleData.name.trim()) {
      newErrors.name = "Role name is required";
    } else if (roleData.name.length > 50) {
      newErrors.name = "Role name must be less than 50 characters";
    }

    if (roleData.description.length > 200) {
      newErrors.description = "Description must be less than 200 characters";
    }

    if (roleData.permissions.length === 0) {
      newErrors.permissions = "At least one permission is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Get token from localStorage (or use empty string if not present)
      const token = localStorage.getItem("token") || "";
      console.log("Current token:", token); // Debug log

      const headers = {
        "Content-Type": "application/json",
      };

      // Only add Authorization header if token exists
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      console.log("Request payload:", roleData); // Debug log

      const response = await fetch(`${BASE_URL}/roles`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(roleData),
        credentials: "include",
      });

      console.log("Response status:", response.status); // Debug log

      const data = await response.json();
      console.log("Response data:", data); // Debug log

      if (!response.ok) {
        throw new Error(data.message || "Failed to create role");
      }

      console.log("Role created successfully!");
      navigate("/roles");
    } catch (err) {
      console.error("Error details:", {
        message: err.message,
        stack: err.stack,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setRoleData({
      name: "",
      description: "",
      permissions: [],
      isDefault: false,
    });
    setErrors({});
  };

  return (
    <div className="page-container">
      <section className="right-content">
        <h1>
          <MdOutlinePermIdentity className="header-icon" />
          Create New Role
        </h1>
        <p>Define a new role with specific permissions</p>

        <div className="container">
          <div className="row">
            <div className="col-sm-12 col-md-6">
              <form onSubmit={handleSubmit} className="card">
                <div className="row">
                  <div className="col-md-12">
                    <div className="form-container">
                      <div className="form-items">
                        <label> Role Name </label>
                        <input
                          placeholder="e.g., Admin, Editor, Viewer"
                          name="name"
                          value={roleData.name}
                          onChange={handleInputChange}
                          required
                        />
                        {/* <TextField
                      fullWidth
                      label="Role Name"
                      name="name"
                      value={roleData.name}
                      onChange={handleInputChange}
                      error={!!errors.name}
                      helperText={errors.name}
                      required
                      margin="normal"
                      variant="outlined"
                      placeholder="e.g., Admin, Editor, Viewer"
                    /> */}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-12">
                    <div className="form-container">
                      <div className="form-items">
                        <label> Description </label>
                        <textarea
                          placeholder="Brief description of the role"
                          name="description"
                          value={roleData.description}
                          onChange={handleInputChange}
                          required
                        ></textarea>

                        {/* <TextField
                      fullWidth
                      label="Description"
                      name="description"
                      value={roleData.description}
                      onChange={handleInputChange}
                      error={!!errors.description}
                      helperText={errors.description}
                      margin="normal"
                      variant="outlined"
                      placeholder="Brief description of the role"
                      multiline
                      rows={3}
                    /> */}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-12">
                    <div className="form-container">
                      <div className="form-items">
                        <label> Permissions</label>
                        <FormControl
                          fullWidth
                          margin="normal"
                          error={!!errors.permissions}
                        >
                          <Select
                            sx={{
                              backgroundColor: "#fff", // $white
                              border: "1px solid #adb5bd", // $gray-500
                              borderRadius: "5px",
                              fontSize: "14px", // map-get($font-sizes, 2)
                              fontWeight: 600,
                              // This ensures FormControl doesn't add margin
                              "& .MuiInputBase-root": {
                                height: "31px", // your desired height
                                width: "100%",
                              },
                              "& .MuiSelect-select": {
                                padding: "8px",
                                display: "flex",
                                alignItems: "center",
                                height: "36px", // match the container
                              },
                            }}
                            multiple
                            value={
                              Array.isArray(roleData.permissions)
                                ? roleData.permissions
                                : []
                            }
                            onChange={handlePermissionChange}
                            renderValue={(selected) => (
                              <Box
                                sx={{
                                  display: "flex",
                                  flexWrap: "wrap",
                                  gap: 0.5,
                                }}
                              >
                                {selected.map((value) => (
                                  <Chip key={value} label={value} />
                                ))}
                              </Box>
                            )}
                          >
                            {PERMISSIONS.map((permission) => (
                              <MenuItem key={permission} value={permission}>
                                {permission}
                              </MenuItem>
                            ))}
                          </Select>
                          {errors.permissions && (
                            <p className="MuiFormHelperText-root Mui-error">
                              {errors.permissions}
                            </p>
                          )}
                        </FormControl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-12">
                    <div className="form-container">
                      <div className="form-items">
                        <label>Default Role</label>
                        <FormControl fullWidth margin="normal">
                          <Select
                            sx={{
                              backgroundColor: "#fff", // $white
                              border: "1px solid #adb5bd", // $gray-500
                              borderRadius: "5px",
                              fontSize: "14px", // map-get($font-sizes, 2)
                              fontWeight: 600,
                              // This ensures FormControl doesn't add margin
                              "& .MuiInputBase-root": {
                                height: "31px", // your desired height
                                width: "100%",
                              },
                              "& .MuiSelect-select": {
                                padding: "8px",
                                display: "flex",
                                alignItems: "center",
                                height: "36px", // match the container
                              },
                            }}
                            name="isDefault"
                            value={roleData.isDefault}
                            onChange={handleInputChange}
                            label="Default Role"
                          >
                            <MenuItem value={false}>No</MenuItem>
                            <MenuItem value={true}>Yes</MenuItem>
                          </Select>
                          <p className="helper-text">
                            Default roles are automatically assigned to new
                            users
                          </p>
                        </FormControl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-12">
                    <div className="form-container">
                      <div className="form-buttons">
                        <Button
                          variant="contained"
                          color="primary"
                          type="submit"
                          disabled={isLoading}
                          fullWidth
                          startIcon={<IoMdSave />}
                        >
                          {isLoading ? (
                            <>
                              <Skeleton
                                variant="circular"
                                width={20}
                                height={20}
                              />
                              <span className="mr-4"> Creating Role...</span>
                            </>
                          ) : (
                            <span>Create Role</span>
                          )}
                        </Button>

                        <Button
                          variant="outlined"
                          color="secondary"
                          onClick={handleReset}
                          fullWidth
                          startIcon={<IoMdClose />}
                        >
                          Reset
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default RoleCreation;

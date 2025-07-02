import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import debounce from "lodash.debounce";
import { Autocomplete, TextField, CircularProgress } from "@mui/material";
import { BASE_URL } from "../../../Config";

const AsyncCategoryAutocomplete = ({ value, onChange, categories }) => {
  const [inputValue, setInputValue] = useState("");
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);


  // Initial load of some categories
  const loadInitialCategories = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/categories`, {
        params: { page: 1, limit: 20 },
      });
      setOptions(res.data.data);
    } catch (err) {
      console.error("Failed to load initial categories", err);
    }
  };

  // Fetch categories from API with search term
  const fetchCategories = async (search) => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/api/categories-search/search`, {
        params: { search },
      });
      setOptions(res.data.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  // Debounced fetch
  const debouncedFetch = useMemo(() => debounce(fetchCategories, 500), []);
  useEffect(()=>{
    if(categories){
        setOptions(categories);
    }
  },[categories])
  // Trigger fetch when input changes
  useEffect(() => {
    if (inputValue) {
      debouncedFetch(inputValue);
    } else {
      setOptions([]);
    }
  }, [inputValue, debouncedFetch]);


  // Load initial options on mount
  useEffect(() => {
    loadInitialCategories();
  }, []);

  return (
    <Autocomplete
      getOptionLabel={(option) => option.Name}
      options={options}
      loading={loading}
      value={value}
      onChange={(event, newValue) => onChange(newValue)}
      onInputChange={(event, newInputValue) => setInputValue(newInputValue)}
      isOptionEqualToValue={(option, val) => option.ID === val?.ID}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Category"
          margin="normal"
          fullWidth
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
};

export default AsyncCategoryAutocomplete;

import React, { useEffect, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Autocomplete, IconButton, InputAdornment, Tooltip
} from "@mui/material";
import ClearIcon from '@mui/icons-material/Clear';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import { useForm, Controller } from "react-hook-form";
import axios from "axios";
import { BASE_URL }  from "../../../config/Config";

export default function TagDialog({ open, onClose, tag, onSuccess, onError }) {
  const { control, handleSubmit, reset, setValue } = useForm();
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openAuto, setOpenAuto] = useState(false);

  // Fetch tag names when dialog opens (to provide dropdown/autocomplete options)
  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${BASE_URL}/api/tags`);
        let data = [];
        if (Array.isArray(res.data)) data = res.data;
        else if (res.data && Array.isArray(res.data.data)) data = res.data.data;
        const names = data.map(t => t.Name).filter(Boolean);
        setOptions([...new Set(names)].sort());
      } catch (e) {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    };

    if (open) fetch();
  }, [open]);

  useEffect(() => {
    if (tag) setValue("name", tag.Name || "");
    else setValue("name", "");
  }, [tag, setValue, open]);

  const onSubmit = async (data) => {
    try {
      if (tag?.ID) {
        await axios.put(`${BASE_URL}/api/tags/${tag.ID}`, data);
      } else {
        await axios.post(`${BASE_URL}/api/tags`, data);
      }
      onSuccess();
    } catch (error) {
      console.error("Error saving Tag:", error);
      if (onError) onError("Error saving Tag.");
      else alert("Error saving Tag.");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{tag ? "Edit Tag" : "Add Tag"}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Controller
            name="name"
            control={control}
            rules={{ required: true }}
            render={({ field: { onChange, value, ref } }) => (
              <Autocomplete
                options={options}
                freeSolo
                loading={loading}
                open={openAuto}
                onOpen={() => setOpenAuto(true)}
                onClose={() => setOpenAuto(false)}
                // Use inputValue/onInputChange so typed text updates the RHF value
                inputValue={value || ""}
                onInputChange={(_, newInput) => onChange(newInput)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    inputRef={ref}
                    autoFocus
                    label="Tag Name"
                    fullWidth
                    margin="dense"
                    size="small"
                    required
                    onClick={() => setOpenAuto(true)}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {params.InputProps.endAdornment}
                          <InputAdornment position="end">
                            <Tooltip title={openAuto ? 'Close suggestions' : 'Open suggestions'}>
                              <IconButton
                                size="small"
                                aria-label={openAuto ? 'close suggestions' : 'open suggestions'}
                                onClick={(e) => { e.stopPropagation(); setOpenAuto(o => !o); }}
                                sx={{ color: 'primary.main' }}
                              >
                                {openAuto ? <ArrowDropUpIcon fontSize="small" /> : <ArrowDropDownIcon fontSize="small" />}
                              </IconButton>
                            </Tooltip>
                          </InputAdornment>
                        </>
                      )
                    }}
                  />
                )}
              />
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained">Save</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

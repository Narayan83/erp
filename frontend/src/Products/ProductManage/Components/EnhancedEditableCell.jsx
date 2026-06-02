import React, { useEffect, useState } from "react";
import { Box, TextField, TableCell, Autocomplete } from "@mui/material";

// Enhanced editable cell component with case-insensitive column matching
const EnhancedEditableCell = ({ 
  value, 
  rowIndex, 
  columnKey, 
  row, 
  onUpdate, 
  categories, 
  allSubcategories, 
  stores,
  hsnCodes,
  units,
  sizes,
  tags,
  taxes,
  error, // boolean - whether this cell has an error
  errorMessages // optional array of error messages for tooltip/reporting
}) => {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  // Convert column key to lowercase for case-insensitive comparison
  const columnKeyLower = columnKey.toLowerCase().trim();
  
  // Normalize column key by removing spaces and special characters
  const normalizedColumnKey = columnKeyLower
    .replace(/\s+/g, '') // Remove all spaces first
    .replace(/[^\w]/g, ''); // Remove non-alphanumeric characters
  
  // Map to standardized field names
  let standardizedKey = normalizedColumnKey;
  
  // HSN variations
  if (/^hsn/.test(normalizedColumnKey) || normalizedColumnKey === 'hsncode') {
    standardizedKey = 'hsn';
  }
  // Category variations
  else if (normalizedColumnKey === 'category') {
    standardizedKey = 'category';
  }
  // Subcategory variations
  else if (normalizedColumnKey === 'subcategory') {
    standardizedKey = 'subcategory';
  }
  // Store variations
  else if (normalizedColumnKey === 'store') {
    standardizedKey = 'store';
  }
  // Unit variations
  else if (normalizedColumnKey === 'unit') {
    standardizedKey = 'unit';
  }
  // Size variations
  else if (normalizedColumnKey === 'size') {
    standardizedKey = 'size';
  }
  // Product Type variations
  else if (normalizedColumnKey === 'producttype') {
    standardizedKey = 'producttype';
  }
  // Product Mode variations
  else if (normalizedColumnKey === 'productmode') {
    standardizedKey = 'productmode';
  }
  // Status variations
  else if (normalizedColumnKey === 'status') {
    standardizedKey = 'status';
  }
  // Importance variations
  else if (normalizedColumnKey === 'importance') {
    standardizedKey = 'importance';
  }
  // Tax variations
  else if (normalizedColumnKey === 'tax') {
    standardizedKey = 'tax';
  }
  // Tag variations
  else if (normalizedColumnKey === 'tag' || normalizedColumnKey === 'tags') {
    standardizedKey = 'tag';
  }
  
  console.log(`Column: "${columnKey}" → Normalized: "${normalizedColumnKey}" → Standardized: "${standardizedKey}"`);
  
  // Check if this field should have a dropdown
  const isCategory = normalizedColumnKey === 'category';
  const isSubcategory = normalizedColumnKey === 'subcategory';
  const isStore = normalizedColumnKey === 'store';
  const isProductType = normalizedColumnKey === 'producttype';
  const isStatus = normalizedColumnKey === 'status';
  const isImportance = normalizedColumnKey === 'importance';
  const isHsnCode = standardizedKey === 'hsn';
  const isUnit = normalizedColumnKey === 'unit';
  const isProductMode = normalizedColumnKey === 'productmode';
  const isTag = normalizedColumnKey === 'tag' || normalizedColumnKey === 'tags';
  const isSize = normalizedColumnKey === 'size';
  const isTax = normalizedColumnKey === 'tax';

  // Columns that should be center aligned (case-insensitive, normalized)
  const centerColumns = [
    'minstock', 'minimumstock', 'min_stock', 'minimum_stock',
    'moq', 'tax', 'gst', 'purchasecost', 'salesprice', 'stock', 'leadtime'
  ];
  const isCenterAligned = centerColumns.includes(normalizedColumnKey);
  
  // Debugging in useEffect to not interfere with rendering
  useEffect(() => {
    if (editing) {
      console.log(`Editing cell "${columnKey}" (normalized: "${normalizedColumnKey}"):`, {
        isCategory, isSubcategory, isStore, isProductType,
        isStatus, isImportance, isHsnCode, isUnit, isProductMode, isSize, isTax
      });
      
      // Debug dropdown data availability
      console.log("Available data for dropdowns:", {
        categories: Array.isArray(categories) ? `${categories.length} items` : categories,
        subcategories: Array.isArray(allSubcategories) ? `${allSubcategories.length} items` : allSubcategories,
        stores: Array.isArray(stores) ? `${stores.length} items` : stores,
        hsnCodes: Array.isArray(hsnCodes) ? `${hsnCodes.length} items` : hsnCodes,
        units: Array.isArray(units) ? `${units.length} items` : units,
        sizes: Array.isArray(sizes) ? `${sizes.length} items` : sizes,
        tags: Array.isArray(tags) ? `${tags.length} items` : tags,
        taxes: Array.isArray(taxes) ? `${taxes.length} items` : taxes
      });
      
      // Show sample data for debugging
      if (isCategory && categories?.length > 0) {
        console.log("Sample category data:", categories[0]);
      }
      if (isSubcategory && allSubcategories?.length > 0) {
        console.log("Sample subcategory data:", allSubcategories[0]);
      }
      if (isStore && stores?.length > 0) {
        console.log("Sample store data:", stores[0]);
      }
      if (isHsnCode && hsnCodes?.length > 0) {
        console.log("Sample HSN code data:", hsnCodes[0]);
      }
      if (isUnit && units?.length > 0) {
        console.log("Sample unit data:", units[0]);
      }
      if (isSize && sizes?.length > 0) {
        console.log("Sample size data:", sizes[0]);
      }
      if (isTag && tags?.length > 0) {
        console.log("Sample tag data:", tags[0]);
      }
      if (isTax && taxes?.length > 0) {
        console.log("Sample tax data:", taxes[0]);
      }
    }
  }, [editing, columnKey, normalizedColumnKey, categories, allSubcategories, 
      stores, hsnCodes, units, sizes, tags, taxes, isCategory, isSubcategory, isStore, 
      isProductType, isStatus, isImportance, isHsnCode, isUnit, isProductMode, isSize, isTag, isTax]);
  
  // Get dropdown options based on field type
  let options = [];
  
  // For Category - always provide options (empty array is fine, text input will work)
  if (isCategory) {
    if (Array.isArray(categories)) {
      options = categories.map(cat => {
        const name = cat.Name || cat.name || '';
        return { 
          value: name, 
          label: name 
        };
      }).filter(opt => opt.value);
    }
    // Even if no categories, options will be [] which allows text input
  } else if (isSubcategory) {
    // For Subcategory - always provide options (filtered or all)
    if (Array.isArray(allSubcategories)) {
      // Try to find category column using different possible names
      const possibleCategoryKeys = [
        'Category', 'category', 'CategoryName', 'categoryName', 
        'category_name', 'CATEGORY', 'Category *'
      ];
      
      let categoryValue = null;
      for (const key of possibleCategoryKeys) {
        if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
          categoryValue = row[key];
          break;
        }
      }
      
      if (categoryValue && Array.isArray(categories)) {
        // Try to find the category by name or ID
        const category = categories.find(c => {
          const catName = c.Name || c.name || '';
          const catId = String(c.ID || c.id || '');
          return catName === categoryValue || catId === String(categoryValue);
        });
        
        if (category) {
          const categoryId = category.ID || category.id;
          // Filter subcategories that belong to this category
          const filteredSubcategories = allSubcategories.filter(sub => {
            const subCatId = sub.CategoryID || sub.categoryID || sub.category_id;
            return String(subCatId) === String(categoryId);
          });
          
          options = filteredSubcategories.map(sub => { 
            const name = sub.Name || sub.name || '';
            return { 
              value: name, 
              label: name 
            };
          }).filter(opt => opt.value);
          
          console.log(`Subcategory options for category '${categoryValue}': ${options.length} items`);
        } else {
          // Category specified but not found - show all subcategories as suggestions
          console.warn(`Category '${categoryValue}' not found, showing all subcategories`);
          options = allSubcategories.map(sub => { 
            const name = sub.Name || sub.name || '';
            return { 
              value: name, 
              label: name 
            };
          }).filter(opt => opt.value);
        }
      } else {
        // No category selected - show all subcategories as suggestions
        console.log('No category selected, showing all subcategories as suggestions');
        options = allSubcategories.map(sub => { 
          const name = sub.Name || sub.name || '';
          return { 
            value: name, 
            label: name 
          };
        }).filter(opt => opt.value);
      }
    }
    // Even if no subcategories, options will be [] which allows text input
  } else if (isStore && Array.isArray(stores)) {
    options = stores.map(store => {
      const name = store.Name || store.name || '';
      return { 
        value: name, 
        label: name 
      };
    }).filter(opt => opt.value);
  } else if (isTag && Array.isArray(tags)) {
    options = tags.map(tag => {
      const name = tag.Name || tag.name || '';
      return {
        value: name,
        label: name
      };
    }).filter(opt => opt.value);
  } else if (isProductType) {
    options = [
      { value: 'All', label: 'All' },
      { value: 'Finished Goods', label: 'Finished Goods' },
      { value: 'Semi-Finished Goods', label: 'Semi-Finished Goods' },
      { value: 'Raw Materials', label: 'Raw Materials' }
    ];
  } else if (isStatus) {
    options = [
      { value: 'Active', label: 'Active' },
      { value: 'Inactive', label: 'Inactive' }
    ];
  } else if (isImportance) {
    options = [
      { value: 'Normal', label: 'Normal' },
      { value: 'High', label: 'High' },
      { value: 'Critical', label: 'Critical' }
    ];
  } else if (isHsnCode && Array.isArray(hsnCodes)) {
    console.log("Generating HSN dropdown options from:", hsnCodes.length, "HSN codes");
    
    if (hsnCodes.length > 0) {
      console.log("Sample HSN code item:", hsnCodes[0]);
      console.log("HSN code properties:", Object.keys(hsnCodes[0]));
      
      // Log the Tax object if available
      if (hsnCodes[0].Tax) {
        console.log("Tax properties:", Object.keys(hsnCodes[0].Tax));
      }
    }
    
    options = hsnCodes.map(hsn => {
      // Get the code from various possible field names
      const code = String(hsn.Code || hsn.code || '').trim();
      
      // Get tax percentage - check multiple possible structures
      let taxPercentage = '';
      if (hsn.Tax && typeof hsn.Tax.Percentage === 'number') {
        taxPercentage = hsn.Tax.Percentage;
      } else if (hsn.tax && typeof hsn.tax.Percentage === 'number') {
        taxPercentage = hsn.tax.Percentage;
      } else if (hsn.Tax && typeof hsn.Tax.percentage === 'number') {
        taxPercentage = hsn.Tax.percentage;
      } else if (hsn.tax && typeof hsn.tax.percentage === 'number') {
        taxPercentage = hsn.tax.percentage;
      }
      
      // Create a label with only the HSN code as requested
      const label = code;
      
      return { 
        value: code, 
        label: label 
      };
    }).filter(opt => opt.value && opt.value.length > 0);
    
    console.log("Generated HSN options:", options.length > 0 ? options.slice(0, 5) : "No options");
  } else if (isUnit && Array.isArray(units)) {
    options = units.map(unit => {
      const name = unit.Name || unit.name || '';
      return { 
        value: name, 
        label: name 
      };
    }).filter(opt => opt.value);
  } else if (isProductMode) {
    options = [
      { value: 'Purchase', label: 'Purchase' },
      { value: 'Internal Manufacturing', label: 'Internal Manufacturing' },
      { value: 'Both', label: 'Both' }
    ];
  } else if (isSize && Array.isArray(sizes)) {
    options = sizes.map(size => {
      const name = size.Name || size.name || '';
      return { 
        value: name, 
        label: name 
      };
    }).filter(opt => opt.value);
  } else if (isTax && Array.isArray(taxes)) {
    console.log("Generating Tax dropdown options from:", taxes.length, "taxes");
    
    if (taxes.length > 0) {
      console.log("Sample tax item:", taxes[0]);
      console.log("Tax properties:", Object.keys(taxes[0]));
    }
    
    options = taxes.map(tax => {
      // Get the name from various possible field names
      const name = tax.Name || tax.name || '';

      // For import table we only show the tax name (no percentage)
      return {
        value: name,
        label: name
      };
    }).filter(opt => opt.value && opt.value.length > 0);
    
    console.log("Generated Tax options:", options.length > 0 ? options.slice(0, 5) : "No options");
  }
  
  // Debugging for empty options (but not warning for fields that support free text like Category/Subcategory/HSN/Tax/Size)
  if ((isStore || isUnit) && options.length === 0) {
    console.warn(`No options found for dropdown field: ${columnKey} (${normalizedColumnKey})`);
  }
  
  // Category, Subcategory, Size, HSN and Tax are ALWAYS treated as combo-boxes (free-text + suggestions)
  // so users can either pick an existing value or enter a new one
  const isDropdown = (isCategory || isSubcategory || isSize || isHsnCode || isTax) || options.length > 0;
  
  const handleSave = () => {
    onUpdate(rowIndex, columnKey, editValue);
    setEditing(false);
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(value);
      setEditing(false);
    }
  };

  // Update editValue when value prop changes
  useEffect(() => {
    setEditValue(value);
  }, [value]);

  return (
    <TableCell 
      onClick={() => !editing && setEditing(true)}
      sx={{ 
        cursor: !editing ? 'pointer' : 'default',
        padding: editing ? '4px' : undefined,
        minWidth: '140px', // ensure minimum column width for th/td
        textAlign: isCenterAligned ? 'center' : undefined,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        // Visual error indicator: left red border + light red background
        borderLeft: error ? '4px solid rgba(244,67,54,0.6)' : undefined,
        backgroundColor: error ? 'rgba(255,235,238,0.6)' : undefined,
        '&:hover': !editing ? { 
          backgroundColor: error ? 'rgba(255,235,238,0.65)' : 'rgba(0, 0, 0, 0.04)',
        } : {}
      }}
      // keep content from shrinking too small when table layout is tight
    >
      {editing ? (
        isDropdown ? (
          <Box sx={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
            {/* For Category, Subcategory, and Size, use Autocomplete (combo box: dropdown + free text) */}
              {(isCategory || isSubcategory || isSize || isHsnCode || isTax) ? (
              <Autocomplete
                freeSolo
                autoFocus
                options={options.map(opt => opt.value)}
                value={editValue || ""}
                onChange={(event, newValue) => {
                  setEditValue(newValue || "");
                }}
                onInputChange={(event, newInputValue) => {
                  setEditValue(newInputValue);
                }}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    inputProps={{ ...(params.inputProps || {}), style: { textAlign: isCenterAligned ? 'center' : 'left' } }}
                    placeholder={options.length > 0 
                      ? `Type new or select ${isCategory ? 'category' : isSubcategory ? 'subcategory' : isHsnCode ? 'HSN code' : isTax ? 'tax' : 'size'}` 
                      : `Type ${isCategory ? 'category' : isSubcategory ? 'subcategory' : isHsnCode ? 'HSN code' : isTax ? 'tax' : 'size'} name`}
                    variant="outlined"
                    size="small"
                    sx={{
                      minWidth: '120px',
                      width: '100%',
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: '#f1f8e9',
                        '& fieldset': {
                          borderColor: '#4caf50',
                          borderWidth: '2px',
                        },
                        '&:hover fieldset': {
                          borderColor: '#4caf50',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#4caf50',
                        },
                      },
                      '& .MuiInputBase-input': {
                        padding: '8px !important',
                        fontSize: '14px',
                      },
                    }}
                  />
                )}
                sx={{ 
                  minWidth: '120px',
                  width: '100%',
                  '& .MuiAutocomplete-inputRoot': {
                    padding: '0 !important',
                  }
                }}
                ListboxProps={{
                  style: {
                    maxHeight: '200px',
                  }
                }}
              />
            ) : (
              <select
                autoFocus
                value={editValue || ""}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleSave}
                style={{
                  minWidth: '120px',
                  width: '100%',
                  textAlign: isCenterAligned ? 'center' : 'left',
                  padding: '8px',
                  border: '1px solid #1976d2',
                  borderRadius: '4px',
                  backgroundColor: '#f5f9ff',
                  fontSize: '14px',
                  color: '#333'
                }}
              >
                <option value="">-- Select --</option>
                {options.map((option, idx) => (
                  <option key={idx} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
          </Box>
        ) : (
          <TextField
            autoFocus
            fullWidth
            size="small"
            variant="outlined"
            value={editValue || ""}
            onChange={(e) => setEditValue(e.target.value)}
            inputProps={{ style: { textAlign: isCenterAligned ? 'center' : 'left' } }}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            sx={{ margin: '-8px 0' }}
          />
        )
      ) : (
        value
      )}
    </TableCell>
  );
};

export default EnhancedEditableCell;
import React, { useEffect, useState } from "react";
import { Box, TextField, TableCell } from "@mui/material";

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
  sizes
}) => {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  // Convert column key to lowercase for case-insensitive comparison
  const columnKeyLower = columnKey.toLowerCase();
  
  // Normalize column key by removing spaces and common variations
  const normalizedColumnKey = columnKeyLower
    .replace(/\s+/g, '') // Remove all spaces
    .replace(/^hsn(code|num|number)?$/, 'hsn') // Normalize HSN/HSN Code/HSN Number to hsn
    .replace(/^hsnno$/, 'hsn') // HSN No.
    .replace(/^category$/, 'category')
    .replace(/^subcategory$/, 'subcategory')
    .replace(/^store$/, 'store')
    .replace(/^producttype$/, 'producttype')
    .replace(/^status$/, 'status')
    .replace(/^importance$/, 'importance')
    .replace(/^unit$/, 'unit')
    .replace(/^productmode$/, 'productmode')
    .replace(/^size$/, 'size');
  
  console.log(`Column: "${columnKey}" → Normalized: "${normalizedColumnKey}"`);
  
  // Check if this field should have a dropdown
  const isCategory = normalizedColumnKey === 'category';
  const isSubcategory = normalizedColumnKey === 'subcategory';
  const isStore = normalizedColumnKey === 'store';
  const isProductType = normalizedColumnKey === 'producttype';
  const isStatus = normalizedColumnKey === 'status';
  const isImportance = normalizedColumnKey === 'importance';
  const isHsnCode = normalizedColumnKey === 'hsn';
  const isUnit = normalizedColumnKey === 'unit';
  const isProductMode = normalizedColumnKey === 'productmode';
  const isSize = normalizedColumnKey === 'size';
  
  // Debugging in useEffect to not interfere with rendering
  useEffect(() => {
    if (editing) {
      console.log(`Editing cell "${columnKey}" (normalized: "${normalizedColumnKey}"):`, {
        isCategory, isSubcategory, isStore, isProductType,
        isStatus, isImportance, isHsnCode, isUnit, isProductMode, isSize
      });
      
      // Debug dropdown data availability
      console.log("Available data for dropdowns:", {
        categories: Array.isArray(categories) ? `${categories.length} items` : categories,
        subcategories: Array.isArray(allSubcategories) ? `${allSubcategories.length} items` : allSubcategories,
        stores: Array.isArray(stores) ? `${stores.length} items` : stores,
        hsnCodes: Array.isArray(hsnCodes) ? `${hsnCodes.length} items` : hsnCodes,
        units: Array.isArray(units) ? `${units.length} items` : units,
        sizes: Array.isArray(sizes) ? `${sizes.length} items` : sizes
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
    }
  }, [editing, columnKey, normalizedColumnKey, categories, allSubcategories, 
      stores, hsnCodes, units, sizes, isCategory, isSubcategory, isStore, 
      isProductType, isStatus, isImportance, isHsnCode, isUnit, isProductMode, isSize]);
  
  // Get dropdown options based on field type
  let options = [];
  
  if (isCategory && Array.isArray(categories)) {
    options = categories.map(cat => {
      const name = cat.Name || cat.name || '';
      return { 
        value: name, 
        label: name 
      };
    }).filter(opt => opt.value);
  } else if (isSubcategory && Array.isArray(allSubcategories)) {
    // Try to find category column using different possible names
    const categoryValue = 
      row['Category'] || row['category'] || 
      row['CategoryName'] || row['categoryName'] || 
      row['category_name'] || row['CATEGORY'];
    
    if (categoryValue && Array.isArray(categories)) {
      // Try to find the category by name or ID
      const category = categories.find(c => {
        const catName = c.Name || c.name || '';
        const catId = String(c.ID || c.id || '');
        return catName === categoryValue || catId === String(categoryValue);
      });
      
      if (category) {
        const categoryId = category.ID || category.id;
        options = allSubcategories
          .filter(sub => {
            const subCatId = sub.CategoryID || sub.categoryID || sub.category_id;
            return String(subCatId) === String(categoryId);
          })
          .map(sub => { 
            const name = sub.Name || sub.name || '';
            return { 
              value: name, 
              label: name 
            };
          }).filter(opt => opt.value);
      } else {
        // If category not found, show all subcategories
        options = allSubcategories.map(sub => {
          const name = sub.Name || sub.name || '';
          return { 
            value: name, 
            label: name 
          };
        }).filter(opt => opt.value);
      }
    } else {
      // If no category column or no categories data, show all subcategories
      options = allSubcategories.map(sub => {
        const name = sub.Name || sub.name || '';
        return { 
          value: name, 
          label: name 
        };
      }).filter(opt => opt.value);
    }
  } else if (isStore && Array.isArray(stores)) {
    options = stores.map(store => {
      const name = store.Name || store.name || '';
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
      
      // Create a label with tax percentage if available
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
      { value: 'Internal Manufacturing', label: 'Internal Manufacturing' }
    ];
  } else if (isSize && Array.isArray(sizes)) {
    options = sizes.map(size => {
      const name = size.Name || size.name || '';
      return { 
        value: name, 
        label: name 
      };
    }).filter(opt => opt.value);
  }
  
  // Debugging for empty options
  if ((isCategory || isSubcategory || isStore || isHsnCode || isUnit || isSize) && options.length === 0) {
    console.warn(`No options found for dropdown field: ${columnKey} (${normalizedColumnKey})`);
  }
  
  const isDropdown = options.length > 0;
  
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
        '&:hover': !editing ? { 
          backgroundColor: 'rgba(0, 0, 0, 0.04)',
        } : {}
      }}
    >
      {editing ? (
        isDropdown ? (
          <Box sx={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
            <select
              autoFocus
              value={editValue || ""}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSave}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #1976d2', // Blue border to make it more visible
                borderRadius: '4px',
                backgroundColor: '#f5f9ff', // Light blue background
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
          </Box>
        ) : (
          <TextField
            autoFocus
            fullWidth
            size="small"
            variant="outlined"
            value={editValue || ""}
            onChange={(e) => setEditValue(e.target.value)}
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
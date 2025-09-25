import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Grid, TextField, MenuItem, Checkbox, FormControlLabel, Select, FormControl, InputLabel, Autocomplete
} from "@mui/material";
import { useForm } from "react-hook-form";
import { useEffect, useState, useCallback } from "react";
import Cropper from 'react-easy-crop';
import Slider from '@mui/material/Slider';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import axios from "axios";
import { BASE_URL } from "../../../Config"; // adjust if needed

export default function VariantFormDialog({ open, onClose, onSave, initialData = null, sizes = [] }) {
  const { register, handleSubmit, reset } = useForm();
  const [imagesPreview, setImagesPreview] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [sizeOptions, setSizeOptions] = useState([]);
  const [sizesLoading, setSizesLoading] = useState(false);
  const [sizesError, setSizesError] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState(null);
  const [cropIndex, setCropIndex] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [mainImageIndex, setMainImageIndex] = useState(null);

  useEffect(() => {
    if (!open) return;
    const fetchAllSizes = async () => {
      setSizesLoading(true);
      setSizesError(null);
      try {
        if (Array.isArray(sizes) && sizes.length > 0) {
          setSizeOptions(sizes);
        } else {
          const res = await axios.get(`${BASE_URL}/api/sizes`, { params: { page: 1, limit: 500, filter: "" } });
          setSizeOptions(res.data?.data || []);
        }
      } catch (e) {
        setSizesError("Failed to load sizes");
        setSizeOptions([]);
      } finally {
        setSizesLoading(false);
      }
    };
    fetchAllSizes();
  }, [open, sizes]);

  useEffect(() => {
    if (initialData) {
      reset(initialData);
      // Initialize file entries from initialData.images (may be strings referencing uploads)
      const initFiles = (initialData.images || []).map(img => {
        if (typeof img === 'string') {
          const normalized = img.replace(/\\/g, '/');
          const displayUrl = (normalized.startsWith('http://') || normalized.startsWith('https://'))
            ? normalized
            : `${BASE_URL}/${normalized.startsWith('uploads/') ? normalized : `uploads/${normalized}`}`;
          return { file: null, preview: displayUrl, original: img, name: normalized.split('/').pop() };
        }
        return { file: img, preview: URL.createObjectURL(img), original: null, name: img.name };
      });
      setImageFiles(initFiles);
      setImagesPreview(initFiles.map(f => f.preview));
      const colorMatch = ralColors.find(c => c.value === initialData.color);
      setSelectedColor(colorMatch || null);

      // Determine initial main image: prefer explicit initialData.mainImage, else default to first image if any
      let initialMain = null;
      if (initialData.mainImage) {
        const found = initFiles.findIndex(f => (f.original && f.original === initialData.mainImage) || f.name === initialData.mainImage);
        if (found >= 0) initialMain = found;
      }
      if (initialMain === null && initFiles.length > 0) {
        initialMain = 0;
      }
      setMainImageIndex(initialMain);
    } else {
      reset();
      setImagesPreview([]);
      setSelectedColor(null);
      setMainImageIndex(null);
    }
  }, [initialData, open, reset]);

  const onSubmit = (data) => {
    // Prepare images/files: keep original strings, and Files for uploads
    const images = imageFiles.map((entry) => entry.file ? entry.file : entry.original);
    const files = imageFiles.filter(entry => entry.file).map(entry => entry.file);

    const formData = {
      ...data,
      color: selectedColor?.value || '',
      images, // mixture of strings (existing) and File objects (new)
      files, // only File objects for convenience
      mainImage: mainImageIndex != null ? images[mainImageIndex] : null,
      mainImageIndex: mainImageIndex,
      isActive: data.isActive || false,
    };

    onSave(formData);

    // cleanup object URLs
    imageFiles.forEach(entry => {
      try { if (entry.preview && entry.file) URL.revokeObjectURL(entry.preview); } catch (e) {}
    });
    reset();
    setImageFiles([]);
    setImagesPreview([]);
    setSelectedColor(null);
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    // Create entries: always store file; preview is an object URL (useful for images) for all files
    const newFiles = files.map((file) => ({ file, preview: URL.createObjectURL(file), original: null, name: file.name }));
    setImageFiles(prev => {
      const result = [...prev, ...newFiles];
      // if no main image selected yet, set first uploaded as main
      if (mainImageIndex == null && result.length > 0) {
        setMainImageIndex(0);
      }
      return result;
    });
    setImagesPreview(prev => [...prev, ...newFiles.map(f => f.preview)]);
  };

  const openCropDialog = (index) => {
    const entry = imageFiles[index];
    if (!entry) return;
    // Only allow cropping for actual image File entries (not existing server-path strings)
    const isImageFile = entry.file && entry.file.type && entry.file.type.startsWith('image/');
    if (!isImageFile) return;
    setCropIndex(index);
    setCropSrc(entry.preview);
    setCropDialogOpen(true);
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // helper to create a cropped file from image and area
  const getCroppedImg = async (imageSrc, pixelCrop) => {
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
      img.src = imageSrc;
    });

    const canvas = document.createElement('canvas');
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) return resolve(null);
        const file = new File([blob], `cropped_${Date.now()}.png`, { type: blob.type });
        resolve(file);
      }, 'image/png');
    });
  };

  const applyCrop = async () => {
    if (cropIndex == null || !croppedAreaPixels) return;
    const src = imageFiles[cropIndex].preview;
    const croppedFile = await getCroppedImg(src, croppedAreaPixels);
    if (croppedFile) {
      const newEntry = { file: croppedFile, preview: URL.createObjectURL(croppedFile) };
      setImageFiles(prev => prev.map((it, idx) => idx === cropIndex ? newEntry : it));
      setImagesPreview(prev => prev.map((p, idx) => idx === cropIndex ? newEntry.preview : p));
    }
    setCropDialogOpen(false);
    setCropIndex(null);
    setCropSrc(null);
    setZoom(1);
  };

  const removeImage = (index) => {
    // revoke objectURL if present and was a File
    const entry = imageFiles[index];
    if (entry && entry.file && entry.preview) {
      try { URL.revokeObjectURL(entry.preview); } catch (e) {}
    }
    setImageFiles(prev => {
      const newArr = prev.filter((_, i) => i !== index);
      // adjust mainImageIndex
      setMainImageIndex(prevMain => {
        if (prevMain == null) return null;
        if (index === prevMain) {
          return newArr.length > 0 ? 0 : null;
        }
        if (index < prevMain) return prevMain - 1;
        return prevMain;
      });
      return newArr;
    });
    setImagesPreview(prev => prev.filter((_, i) => i !== index));
  };

  // Define RAL colors from CSV data
  const ralColors = [
    { name: 'RAL 1000 - Green beige', value: 'RAL 1000', hex: '#CDBA88' },
    { name: 'RAL 1001 - Beige', value: 'RAL 1001', hex: '#D0B084' },
    { name: 'RAL 1002 - Sand yellow', value: 'RAL 1002', hex: '#D2AA6D' },
    { name: 'RAL 1003 - Signal yellow', value: 'RAL 1003', hex: '#F9A900' },
    { name: 'RAL 1004 - Golden yellow', value: 'RAL 1004', hex: '#E49E00' },
    { name: 'RAL 1005 - Honey yellow', value: 'RAL 1005', hex: '#CB8F00' },
    { name: 'RAL 1006 - Maize yellow', value: 'RAL 1006', hex: '#E19000' },
    { name: 'RAL 1007 - Daffodil yellow', value: 'RAL 1007', hex: '#E88C00' },
    { name: 'RAL 1011 - Brown beige', value: 'RAL 1011', hex: '#AF8050' },
    { name: 'RAL 1012 - Lemon yellow', value: 'RAL 1012', hex: '#DDAF28' },
    { name: 'RAL 1013 - Oyster white', value: 'RAL 1013', hex: '#E3D9C7' },
    { name: 'RAL 1014 - Ivory', value: 'RAL 1014', hex: '#DDC49B' },
    { name: 'RAL 1015 - Light ivory', value: 'RAL 1015', hex: '#E6D2B5' },
    { name: 'RAL 1016 - Sulfur yellow', value: 'RAL 1016', hex: '#F1DD39' },
    { name: 'RAL 1017 - Saffron yellow', value: 'RAL 1017', hex: '#F6A951' },
    { name: 'RAL 1018 - Zinc yellow', value: 'RAL 1018', hex: '#FACA31' },
    { name: 'RAL 1019 - Grey beige', value: 'RAL 1019', hex: '#A48F7A' },
    { name: 'RAL 1020 - Olive yellow', value: 'RAL 1020', hex: '#A08F65' },
    { name: 'RAL 1021 - Colza yellow', value: 'RAL 1021', hex: '#F6B600' },
    { name: 'RAL 1023 - Traffic yellow', value: 'RAL 1023', hex: '#F7B500' },
    { name: 'RAL 1024 - Ochre yellow', value: 'RAL 1024', hex: '#BA8F4C' },
    { name: 'RAL 1026 - Luminous yellow', value: 'RAL 1026', hex: '#FFFF00' },
    { name: 'RAL 1027 - Curry', value: 'RAL 1027', hex: '#A77F0F' },
    { name: 'RAL 1028 - Melon yellow', value: 'RAL 1028', hex: '#FF9C00' },
    { name: 'RAL 1032 - Broom yellow', value: 'RAL 1032', hex: '#E2A300' },
    { name: 'RAL 1033 - Dahlia yellow', value: 'RAL 1033', hex: '#F99A1D' },
    { name: 'RAL 1034 - Pastel yellow', value: 'RAL 1034', hex: '#EB9C52' },
    { name: 'RAL 1035 - Pearl beige', value: 'RAL 1035', hex: '#8F8370' },
    { name: 'RAL 1036 - Pearl gold', value: 'RAL 1036', hex: '#806440' },
    { name: 'RAL 1037 - Sun yellow', value: 'RAL 1037', hex: '#F09200' },
    { name: 'RAL 2000 - Yellow orange', value: 'RAL 2000', hex: '#DA6E00' },
    { name: 'RAL 2001 - Red orange', value: 'RAL 2001', hex: '#BA481C' },
    { name: 'RAL 2002 - Vermilion', value: 'RAL 2002', hex: '#BF3922' },
    { name: 'RAL 2003 - Pastel orange', value: 'RAL 2003', hex: '#F67829' },
    { name: 'RAL 2004 - Pure orange', value: 'RAL 2004', hex: '#E25304' },
    { name: 'RAL 2005 - Luminous orange', value: 'RAL 2005', hex: '#FF4D08' },
    { name: 'RAL 2007 - Luminous bright orange', value: 'RAL 2007', hex: '#FFB200' },
    { name: 'RAL 2008 - Bright red orange', value: 'RAL 2008', hex: '#EC6B22' },
    { name: 'RAL 2009 - Traffic orange', value: 'RAL 2009', hex: '#DE5308' },
    { name: 'RAL 2010 - Signal orange', value: 'RAL 2010', hex: '#D05D29' },
    { name: 'RAL 2011 - Deep orange', value: 'RAL 2011', hex: '#E26E0F' },
    { name: 'RAL 2012 - Salmon orange', value: 'RAL 2012', hex: '#D5654E' },
    { name: 'RAL 2013 - Pearl orange', value: 'RAL 2013', hex: '#923E25' },
    { name: 'RAL 2017 - RAL orange', value: 'RAL 2017', hex: '#FC5500' },
    { name: 'RAL 3000 - Flame red', value: 'RAL 3000', hex: '#A72920' },
    { name: 'RAL 3001 - Signal red', value: 'RAL 3001', hex: '#9B2423' },
    { name: 'RAL 3002 - Carmine red', value: 'RAL 3002', hex: '#9B2321' },
    { name: 'RAL 3003 - Ruby red', value: 'RAL 3003', hex: '#861A22' },
    { name: 'RAL 3004 - Purple red', value: 'RAL 3004', hex: '#6B1C23' },
    { name: 'RAL 3005 - Wine red', value: 'RAL 3005', hex: '#59191F' },
    { name: 'RAL 3007 - Black red', value: 'RAL 3007', hex: '#3E2022' },
    { name: 'RAL 3009 - Oxide red', value: 'RAL 3009', hex: '#6D342D' },
    { name: 'RAL 3011 - Brown red', value: 'RAL 3011', hex: '#782423' },
    { name: 'RAL 3012 - Beige red', value: 'RAL 3012', hex: '#C5856D' },
    { name: 'RAL 3013 - Tomato red', value: 'RAL 3013', hex: '#972E25' },
    { name: 'RAL 3014 - Antique pink', value: 'RAL 3014', hex: '#CB7375' },
    { name: 'RAL 3015 - Light pink', value: 'RAL 3015', hex: '#D8A0A6' },
    { name: 'RAL 3016 - Coral red', value: 'RAL 3016', hex: '#A63D30' },
    { name: 'RAL 3017 - Rose', value: 'RAL 3017', hex: '#CA555D' },
    { name: 'RAL 3018 - Strawberry red', value: 'RAL 3018', hex: '#C63F4A' },
    { name: 'RAL 3020 - Traffic red', value: 'RAL 3020', hex: '#BB1F11' },
    { name: 'RAL 3022 - Salmon pink', value: 'RAL 3022', hex: '#CF6955' },
    { name: 'RAL 3024 - Luminous red', value: 'RAL 3024', hex: '#FF2D21' },
    { name: 'RAL 3026 - Luminous bright red', value: 'RAL 3026', hex: '#FF2A1C' },
    { name: 'RAL 3027 - Raspberry red', value: 'RAL 3027', hex: '#AB273C' },
    { name: 'RAL 3028 - Pure red', value: 'RAL 3028', hex: '#CC2C24' },
    { name: 'RAL 3031 - Orient red', value: 'RAL 3031', hex: '#A63437' },
    { name: 'RAL 3032 - Pearl ruby red', value: 'RAL 3032', hex: '#701D24' },
    { name: 'RAL 3033 - Pearl pink', value: 'RAL 3033', hex: '#A53A2E' },
    { name: 'RAL 4001 - Red lilac', value: 'RAL 4001', hex: '#816183' },
    { name: 'RAL 4002 - Red violet', value: 'RAL 4002', hex: '#8D3C4B' },
    { name: 'RAL 4003 - Heather violet', value: 'RAL 4003', hex: '#C4618C' },
    { name: 'RAL 4004 - Claret violet', value: 'RAL 4004', hex: '#651E38' },
    { name: 'RAL 4005 - Blue lilac', value: 'RAL 4005', hex: '#76689A' },
    { name: 'RAL 4006 - Traffic purple', value: 'RAL 4006', hex: '#903373' },
    { name: 'RAL 4007 - Purple violet', value: 'RAL 4007', hex: '#47243C' },
    { name: 'RAL 4008 - Signal violet', value: 'RAL 4008', hex: '#844C82' },
    { name: 'RAL 4009 - Pastel violet', value: 'RAL 4009', hex: '#9D8692' },
    { name: 'RAL 4010 - Telemagenta', value: 'RAL 4010', hex: '#BB4077' },
    { name: 'RAL 4011 - Pearl violet', value: 'RAL 4011', hex: '#6E6387' },
    { name: 'RAL 4012 - Pearl blackberry', value: 'RAL 4012', hex: '#6A6B7F' },
    { name: 'RAL 5000 - Violet blue', value: 'RAL 5000', hex: '#304F6E' },
    { name: 'RAL 5001 - Green blue', value: 'RAL 5001', hex: '#0E4C64' },
    { name: 'RAL 5002 - Ultramarine blue', value: 'RAL 5002', hex: '#00387A' },
    { name: 'RAL 5003 - Sapphire blue', value: 'RAL 5003', hex: '#1F3855' },
    { name: 'RAL 5004 - Black blue', value: 'RAL 5004', hex: '#191E28' },
    { name: 'RAL 5005 - Signal blue', value: 'RAL 5005', hex: '#005387' },
    { name: 'RAL 5007 - Brillant blue', value: 'RAL 5007', hex: '#376B8C' },
    { name: 'RAL 5008 - Grey blue', value: 'RAL 5008', hex: '#2B3A44' },
    { name: 'RAL 5009 - Azure blue', value: 'RAL 5009', hex: '#215F78' },
    { name: 'RAL 5010 - Gentian blue', value: 'RAL 5010', hex: '#004F7C' },
    { name: 'RAL 5011 - Steel blue', value: 'RAL 5011', hex: '#1A2B3C' },
    { name: 'RAL 5012 - Light blue', value: 'RAL 5012', hex: '#0089B6' },
    { name: 'RAL 5013 - Cobalt blue', value: 'RAL 5013', hex: '#193153' },
    { name: 'RAL 5014 - Pigeon blue', value: 'RAL 5014', hex: '#637D96' },
    { name: 'RAL 5015 - Sky blue', value: 'RAL 5015', hex: '#007CAF' },
    { name: 'RAL 5017 - Traffic blue', value: 'RAL 5017', hex: '#005B8C' },
    { name: 'RAL 5018 - Turquoise blue', value: 'RAL 5018', hex: '#048B8C' },
    { name: 'RAL 5019 - Capri blue', value: 'RAL 5019', hex: '#005E83' },
    { name: 'RAL 5020 - Ocean blue', value: 'RAL 5020', hex: '#00414B' },
    { name: 'RAL 5021 - Water blue', value: 'RAL 5021', hex: '#007577' },
    { name: 'RAL 5022 - Night blue', value: 'RAL 5022', hex: '#222D5A' },
    { name: 'RAL 5023 - Distant blue', value: 'RAL 5023', hex: '#41698C' },
    { name: 'RAL 5024 - Pastel blue', value: 'RAL 5024', hex: '#6093AC' },
    { name: 'RAL 5025 - Pearl gentian blue', value: 'RAL 5025', hex: '#20697C' },
    { name: 'RAL 5026 - Pearl night blue', value: 'RAL 5026', hex: '#0F3052' },
    { name: 'RAL 6000 - Patina green', value: 'RAL 6000', hex: '#3C7460' },
    { name: 'RAL 6001 - Emerald green', value: 'RAL 6001', hex: '#366735' },
    { name: 'RAL 6002 - Leaf green', value: 'RAL 6002', hex: '#325928' },
    { name: 'RAL 6003 - Olive green', value: 'RAL 6003', hex: '#50533C' },
    { name: 'RAL 6004 - Blue green', value: 'RAL 6004', hex: '#024442' },
    { name: 'RAL 6005 - Moss green', value: 'RAL 6005', hex: '#114232' },
    { name: 'RAL 6006 - Grey olive', value: 'RAL 6006', hex: '#3C392E' },
    { name: 'RAL 6007 - Bottle green', value: 'RAL 6007', hex: '#2C3222' },
    { name: 'RAL 6008 - Brown green', value: 'RAL 6008', hex: '#36342A' },
    { name: 'RAL 6009 - Fir green', value: 'RAL 6009', hex: '#27352A' },
    { name: 'RAL 6010 - Grass green', value: 'RAL 6010', hex: '#4D6F39' },
    { name: 'RAL 6011 - Reseda green', value: 'RAL 6011', hex: '#6B7C59' },
    { name: 'RAL 6012 - Black green', value: 'RAL 6012', hex: '#2F3D3A' },
    { name: 'RAL 6013 - Reed green', value: 'RAL 6013', hex: '#7C765A' },
    { name: 'RAL 6014 - Yellow olive', value: 'RAL 6014', hex: '#474135' },
    { name: 'RAL 6015 - Black olive', value: 'RAL 6015', hex: '#3D3D36' },
    { name: 'RAL 6016 - Turquoise green', value: 'RAL 6016', hex: '#00694C' },
    { name: 'RAL 6017 - May green', value: 'RAL 6017', hex: '#587F40' },
    { name: 'RAL 6018 - Yellow green', value: 'RAL 6018', hex: '#60993B' },
    { name: 'RAL 6019 - Pastel green', value: 'RAL 6019', hex: '#B9CEAC' },
    { name: 'RAL 6020 - Chrome green', value: 'RAL 6020', hex: '#37422F' },
    { name: 'RAL 6021 - Pale green', value: 'RAL 6021', hex: '#8A9977' },
    { name: 'RAL 6022 - Olive drab', value: 'RAL 6022', hex: '#3A3327' },
    { name: 'RAL 6024 - Traffic green', value: 'RAL 6024', hex: '#008351' },
    { name: 'RAL 6025 - Fern green', value: 'RAL 6025', hex: '#5E6E3B' },
    { name: 'RAL 6026 - Opal green', value: 'RAL 6026', hex: '#005F4E' },
    { name: 'RAL 6027 - Light green', value: 'RAL 6027', hex: '#7EBAB5' },
    { name: 'RAL 6028 - Pine green', value: 'RAL 6028', hex: '#315442' },
    { name: 'RAL 6029 - Mint green', value: 'RAL 6029', hex: '#006F3D' },
    { name: 'RAL 6032 - Signal green', value: 'RAL 6032', hex: '#237F52' },
    { name: 'RAL 6033 - Mint turquoise', value: 'RAL 6033', hex: '#45877F' },
    { name: 'RAL 6034 - Pastel turquoise', value: 'RAL 6034', hex: '#7AADAC' },
    { name: 'RAL 6035 - Pearl green', value: 'RAL 6035', hex: '#194D25' },
    { name: 'RAL 6036 - Pearl opal green', value: 'RAL 6036', hex: '#04574B' },
    { name: 'RAL 6037 - Pure green', value: 'RAL 6037', hex: '#008B29' },
    { name: 'RAL 6038 - Luminous green', value: 'RAL 6038', hex: '#00B51B' },
    { name: 'RAL 6039 - Fibrous green', value: 'RAL 6039', hex: '#B3C43E' },
    { name: 'RAL 7000 - Squirrel grey', value: 'RAL 7000', hex: '#7A888E' },
    { name: 'RAL 7001 - Silver grey', value: 'RAL 7001', hex: '#8C979C' },
    { name: 'RAL 7002 - Olive grey', value: 'RAL 7002', hex: '#817863' },
    { name: 'RAL 7003 - Moss grey', value: 'RAL 7003', hex: '#797669' },
    { name: 'RAL 7004 - Signal grey', value: 'RAL 7004', hex: '#9A9B9B' },
    { name: 'RAL 7005 - Mouse grey', value: 'RAL 7005', hex: '#6B6E6B' },
    { name: 'RAL 7006 - Beige grey', value: 'RAL 7006', hex: '#766A5E' },
    { name: 'RAL 7008 - Khaki grey', value: 'RAL 7008', hex: '#745F3D' },
    { name: 'RAL 7009 - Green grey', value: 'RAL 7009', hex: '#5D6058' },
    { name: 'RAL 7010 - Tarpaulin grey', value: 'RAL 7010', hex: '#585C56' },
    { name: 'RAL 7011 - Iron grey', value: 'RAL 7011', hex: '#52595D' },
    { name: 'RAL 7012 - Basalt grey', value: 'RAL 7012', hex: '#575D5E' },
    { name: 'RAL 7013 - Brown grey', value: 'RAL 7013', hex: '#575044' },
    { name: 'RAL 7015 - Slate grey', value: 'RAL 7015', hex: '#4F5358' },
    { name: 'RAL 7016 - Anthracite grey', value: 'RAL 7016', hex: '#383E42' },
    { name: 'RAL 7021 - Black grey', value: 'RAL 7021', hex: '#2F3234' },
    { name: 'RAL 7022 - Umbra grey', value: 'RAL 7022', hex: '#4C4A44' },
    { name: 'RAL 7023 - Concrete grey', value: 'RAL 7023', hex: '#808076' },
    { name: 'RAL 7024 - Graphite grey', value: 'RAL 7024', hex: '#45494E' },
    { name: 'RAL 7026 - Granite grey', value: 'RAL 7026', hex: '#374345' },
    { name: 'RAL 7030 - Stone grey', value: 'RAL 7030', hex: '#928E85' },
    { name: 'RAL 7031 - Blue grey', value: 'RAL 7031', hex: '#5B686D' },
    { name: 'RAL 7032 - Pebble grey', value: 'RAL 7032', hex: '#B5B0A1' },
    { name: 'RAL 7033 - Cement grey', value: 'RAL 7033', hex: '#7F8274' },
    { name: 'RAL 7034 - Yellow grey', value: 'RAL 7034', hex: '#92886F' },
    { name: 'RAL 7035 - Light grey', value: 'RAL 7035', hex: '#C5C7C4' },
    { name: 'RAL 7036 - Platinum grey', value: 'RAL 7036', hex: '#979392' },
    { name: 'RAL 7037 - Dusty grey', value: 'RAL 7037', hex: '#7A7B7A' },
    { name: 'RAL 7038 - Agate grey', value: 'RAL 7038', hex: '#B0B0A9' },
    { name: 'RAL 7039 - Quartz grey', value: 'RAL 7039', hex: '#6B665E' },
    { name: 'RAL 7040 - Window grey', value: 'RAL 7040', hex: '#989EA1' },
    { name: 'RAL 7042 - Traffic grey A', value: 'RAL 7042', hex: '#8E9291' },
    { name: 'RAL 7043 - Traffic grey B', value: 'RAL 7043', hex: '#4F5250' },
    { name: 'RAL 7044 - Silk grey', value: 'RAL 7044', hex: '#B7B3A8' },
    { name: 'RAL 7045 - Telegrey 1', value: 'RAL 7045', hex: '#8D9295' },
    { name: 'RAL 7046 - Telegrey 2', value: 'RAL 7046', hex: '#7E868A' },
    { name: 'RAL 7047 - Telegrey 4', value: 'RAL 7047', hex: '#C8C8C7' },
    { name: 'RAL 7048 - Pearl mouse grey', value: 'RAL 7048', hex: '#817B73' },
    { name: 'RAL 8000 - Green brown', value: 'RAL 8000', hex: '#89693F' },
    { name: 'RAL 8001 - Ochre brown', value: 'RAL 8001', hex: '#9D622B' },
    { name: 'RAL 8002 - Signal brown', value: 'RAL 8002', hex: '#794D3E' },
    { name: 'RAL 8003 - Clay brown', value: 'RAL 8003', hex: '#7E4B27' },
    { name: 'RAL 8004 - Copper brown', value: 'RAL 8004', hex: '#8D4931' },
    { name: 'RAL 8007 - Fawn brown', value: 'RAL 8007', hex: '#70462B' },
    { name: 'RAL 8008 - Olive brown', value: 'RAL 8008', hex: '#724A25' },
    { name: 'RAL 8011 - Nut brown', value: 'RAL 8011', hex: '#5A3827' },
    { name: 'RAL 8012 - Red brown', value: 'RAL 8012', hex: '#66332B' },
    { name: 'RAL 8014 - Sepia brown', value: 'RAL 8014', hex: '#4A3526' },
    { name: 'RAL 8015 - Chestnut brown', value: 'RAL 8015', hex: '#5E2F26' },
    { name: 'RAL 8016 - Mahogany brown', value: 'RAL 8016', hex: '#4C2B20' },
    { name: 'RAL 8017 - Chocolate brown', value: 'RAL 8017', hex: '#442F29' },
    { name: 'RAL 8019 - Grey brown', value: 'RAL 8019', hex: '#3D3635' },
    { name: 'RAL 8022 - Black brown', value: 'RAL 8022', hex: '#1A1719' },
    { name: 'RAL 8023 - Orange brown', value: 'RAL 8023', hex: '#A45729' },
    { name: 'RAL 8024 - Beige brown', value: 'RAL 8024', hex: '#795038' },
    { name: 'RAL 8025 - Pale brown', value: 'RAL 8025', hex: '#755847' },
    { name: 'RAL 8028 - Terra brown', value: 'RAL 8028', hex: '#513A2A' },
    { name: 'RAL 8029 - Pearl copper', value: 'RAL 8029', hex: '#7F4031' },
    { name: 'RAL 9001 - Cream', value: 'RAL 9001', hex: '#E9E0D2' },
    { name: 'RAL 9002 - Grey white', value: 'RAL 9002', hex: '#D6D5CB' },
    { name: 'RAL 9003 - Signal white', value: 'RAL 9003', hex: '#ECECE7' },
    { name: 'RAL 9004 - Signal black', value: 'RAL 9004', hex: '#2B2B2C' },
    { name: 'RAL 9005 - Jet black', value: 'RAL 9005', hex: '#0E0E10' },
    { name: 'RAL 9006 - White aluminium', value: 'RAL 9006', hex: '#A1A1A0' },
    { name: 'RAL 9007 - Grey aluminium', value: 'RAL 9007', hex: '#868581' },
    { name: 'RAL 9010 - Pure white', value: 'RAL 9010', hex: '#F1EDE1' },
    { name: 'RAL 9011 - Graphite black', value: 'RAL 9011', hex: '#27292B' },
    { name: 'RAL 9012 - Cleanroom white', value: 'RAL 9012', hex: '#F8F2E1' },
    { name: 'RAL 9016 - Traffic white', value: 'RAL 9016', hex: '#F1F1EA' },
    { name: 'RAL 9017 - Traffic black', value: 'RAL 9017', hex: '#29292A' },
    { name: 'RAL 9018 - Papyrus white', value: 'RAL 9018', hex: '#C8CBC4' },
    { name: 'RAL 9022 - Pearl light grey', value: 'RAL 9022', hex: '#858583' },
    { name: 'RAL 9023 - Pearl dark grey', value: 'RAL 9023', hex: '#787B7A' },
  ];

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{initialData ? "Edit Variant" : "Add Variant"}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid size={4}>
              <Autocomplete
                options={ralColors}
                getOptionLabel={(option) => option.name}
                value={selectedColor}
                onChange={(event, newValue) => setSelectedColor(newValue)}
                renderInput={(params) => <TextField {...params} label="Color" size="small" />}
                renderOption={(props, option) => (
                  <li {...props}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          backgroundColor: option.hex,
                          border: '1px solid #ccc',
                          marginRight: 8,
                          borderRadius: 2,
                        }}
                      />
                      {option.name}
                    </div>
                  </li>
                )}
                sx={{ width: '100%' }}
              />
            </Grid>
            <Grid size={4}>
              <TextField
                label="Size"
                select
                fullWidth
                size="small"
                {...register("size")}
                defaultValue=""
                helperText={sizesError || ""}
                error={Boolean(sizesError)}
              >
                <MenuItem value="" disabled>
                  {sizesLoading ? "Loading sizes..." : "Select Size"}
                </MenuItem>
                {!sizesLoading && sizeOptions.map((size) => (
                  <MenuItem key={size.id} value={size.code}>
                    {size.name} {size.code ? `(${size.code})` : ""}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={4}>
              <TextField label="SKU" fullWidth size="small" {...register("sku")} />
            </Grid>
            <Grid size={4}>
              <TextField label="Barcode" fullWidth size="small" {...register("barcode")} />
            </Grid>
            <Grid size={4}>
              <TextField label="Purchase Cost" type="number" fullWidth size="small" {...register("purchaseCost", { valueAsNumber: true })} />
            </Grid>
            <Grid size={4}>
              <TextField label="Sales Price" type="number" fullWidth size="small" {...register("stdSalesPrice", { valueAsNumber: true })} />
            </Grid>
            <Grid size={4}>
              <TextField label="Stock" type="number" fullWidth size="small" {...register("stock", { valueAsNumber: true })} />
            </Grid>
            <Grid size={4}>
              <TextField label="Lead Time (days)" type="number" fullWidth size="small" {...register("leadTime", { valueAsNumber: true })} />
            </Grid>
            <Grid size={12}>
              <Button variant="outlined" component="label">
                Upload Files
                <input type="file" multiple hidden onChange={handleFileUpload} />
              </Button>
              <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {imageFiles.map((entry, i) => {
                  const isImage = entry.preview && (entry.file ? entry.file.type && entry.file.type.startsWith('image/') : /\.(jpg|jpeg|png|gif|webp)$/i.test(entry.preview));
                  return (
                    <div key={i} style={{ width: 120, textAlign: 'center', position: 'relative' }}>
                      {isImage ? (
                        <img src={entry.preview} alt={entry.name || 'file'} width={120} height={80} style={{ objectFit: 'cover', borderRadius: 4, border: '1px solid #ccc' }} />
                      ) : (
                        <div style={{ width: 120, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #ccc', borderRadius: 4 }}>
                          <div style={{ fontSize: 12 }}>{entry.name || 'file'}</div>
                        </div>
                      )}

                      {/* main image star overlay for images */}
                      {isImage && (
                        <IconButton
                          size="small"
                          onClick={() => setMainImageIndex(i)}
                          title={i === mainImageIndex ? 'Main image' : 'Set as main image'}
                          sx={{
                            position: 'absolute',
                            right: 6,
                            top: 6,
                            background: 'rgba(255,255,255,0.8)'
                          }}
                        >
                          {i === mainImageIndex ? <StarIcon fontSize="small" color="warning" /> : <StarBorderIcon fontSize="small" />}
                        </IconButton>
                      )}

                      <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 4 }}>
                        {isImage && entry.file && <Button size="small" onClick={() => openCropDialog(i)}>Edit</Button>}
                        <Button size="small" color="error" onClick={() => removeImage(i)}>Remove</Button>
                      </div>
                      <div style={{ fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.name || (entry.file && entry.file.name)}</div>
                    </div>
                  );
                })}
              </div>
            </Grid>

            {/* Crop dialog */}
            <Dialog open={cropDialogOpen} onClose={() => setCropDialogOpen(false)} maxWidth="sm" fullWidth>
              <DialogTitle sx={{ m: 0, p: 2 }}>
                Edit Image
                <IconButton
                  aria-label="close"
                  onClick={() => setCropDialogOpen(false)}
                  sx={{ position: 'absolute', right: 8, top: 8 }}
                >
                  <CloseIcon />
                </IconButton>
              </DialogTitle>
              <DialogContent sx={{ position: 'relative', height: 400, bgcolor: '#111' }}>
                {cropSrc && (
                  <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                    <Cropper
                      image={cropSrc}
                      crop={crop}
                      zoom={zoom}
                      aspect={1}
                      onCropChange={setCrop}
                      onZoomChange={setZoom}
                      onCropComplete={onCropComplete}
                    />
                  </div>
                )}
              </DialogContent>
              <DialogActions sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: 2 }}>
                <Slider value={zoom} min={1} max={3} step={0.1} onChange={(e, v) => setZoom(v)} />
                <div style={{ display: 'flex', gap: 8, width: '100%', justifyContent: 'flex-end' }}>
                  <Button onClick={() => setCropDialogOpen(false)}>Cancel</Button>
                  <Button variant="contained" onClick={applyCrop}>Apply</Button>
                </div>
              </DialogActions>
            </Dialog>
            <Grid size={4}>
              <FormControlLabel
                control={<Checkbox {...register("isActive")} defaultChecked />}
                label="Is Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained">
            {initialData ? "Update Variant" : "Add Variant"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}


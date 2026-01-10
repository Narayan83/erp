import React, { useEffect, useState, useCallback, memo, useRef } from "react";
import {
  Box,
  Button,
  Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  CircularProgress,
  TablePagination,
  Popover,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider
} from "@mui/material";
import EnhancedEditableCell from "../Components/EnhancedEditableCell";
import { Edit, Delete, Visibility, ArrowUpward, ArrowDownward, ViewColumn, GetApp, Publish, Refresh, Star as StarIcon, StarBorder as StarBorderIcon, Close, ArrowBack } from "@mui/icons-material";
import axios from "axios";
import * as XLSX from 'xlsx';
// exceljs will be dynamically imported inside the download function to avoid bundling issues
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../../../config/Config";
import debounce from 'lodash/debounce';
import ConfirmDialog from "../../../CommonComponents/ConfirmDialog";
import "./product_list_page.scss";


// RAL colors data (complete list from color.csv)
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

const normalizeID = (val) => {
  if (val === "" || val === null || val === undefined) return null;
  const n = Number(val);
  return Number.isNaN(n) ? val : n;
};

// Normalize a possibly-relative image path into a full URL for rendering
const normalizeImageUrl = (img) => {
  if (!img || typeof img !== 'string') return null;
  const trimmed = img.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  if (lower.startsWith('http://') || lower.startsWith('https://') || lower.startsWith('data:')) {
    return trimmed;
  }
  // Replace backslashes with forward slashes
  const normalized = trimmed.replace(/\\/g, '/');
  if (normalized.startsWith('uploads/')) {
    return `${BASE_URL}/${normalized}`;
  }
  return `${BASE_URL}/uploads/${normalized}`;
};

// Helper function to get full color information from color code
const getColorInfo = (colorCode) => {
  if (!colorCode) return null;
  const colorEntry = ralColors.find(c => c.value === colorCode);
  return colorEntry || null;
};

// Pick a single "main" image for a product from its variants
const getMainImageForProduct = (p) => {
  if (!p || !Array.isArray(p.Variants) || p.Variants.length === 0) return null;

  // 1) Prefer any variant with an explicit MainImageIndex pointing at Images
  for (const v of p.Variants) {
    const idx = v?.MainImageIndex;
    const imgs = Array.isArray(v?.Images) ? v.Images : [];
    if (idx !== undefined && idx !== null && Number.isInteger(idx) && idx >= 0 && idx < imgs.length) {
      const url = normalizeImageUrl(imgs[idx]);
      if (url) return url;
    }
  }

  // 2) Next prefer any variant with an explicit MainImage string
  for (const v of p.Variants) {
    const main = v?.MainImage;
    const url = normalizeImageUrl(main);
    if (url) return url;
  }

  // 3) Fallback to the first available image across variants
  for (const v of p.Variants) {
    const imgs = Array.isArray(v?.Images) ? v.Images : [];
    if (imgs.length > 0) {
      const url = normalizeImageUrl(imgs[0]);
      if (url) return url;
    }
  }

  return null;
};

const DisplayPreferences = memo(function DisplayPreferences({ columns, setColumns, anchorEl, open, onClose }) {
  const selectAllRef = React.useRef(null);

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      const allSelected = Object.keys(columns).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {});
      setColumns(allSelected);
    } else {
      const allDeselected = Object.keys(columns).reduce((acc, key) => {
        acc[key] = false;
        return acc;
      }, {});
      allDeselected.name = true;
      allDeselected.actions = true;
      setColumns(allDeselected);
    }
  };

  const handleColumnToggle = (columnKey) => (event) => {
    const visibleCount = Object.values(columns).filter(Boolean).length;
    if (!event.target.checked && visibleCount <= 1 && columns[columnKey]) {
      return;
    }
    setColumns({
      ...columns,
      [columnKey]: event.target.checked,
    });
  };

  const allSelected = Object.values(columns).every(Boolean);
  const someSelected = Object.values(columns).some(Boolean) && !allSelected;

  React.useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  if (!open) return null;

  return (
    <div className="dp-modal-overlay" onClick={onClose}>
      <div className="dp-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="dp-modal-header">
          <div className="dp-modal-title">Display Columns</div>
          <button className="dp-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="dp-modal-body">
          <div className="display-preferences-popover">
            <div className="select-all" style={{ gridColumn: '1 / -1' }}>
              <label className="form-control-label">
                <input ref={selectAllRef} type="checkbox" checked={allSelected} onChange={handleSelectAll} />
                <span style={{ marginLeft: 8 }}>Select All</span>
              </label>
            </div>

            <label className="form-control-label"><input type="checkbox" checked={columns.name} onChange={handleColumnToggle('name')} /> <span>Name</span></label>
            <label className="form-control-label"><input type="checkbox" checked={columns.code} onChange={handleColumnToggle('code')} /> <span>Code</span></label>
            <label className="form-control-label"><input type="checkbox" checked={columns.category} onChange={handleColumnToggle('category')} /> <span>Category</span></label>
            <label className="form-control-label"><input type="checkbox" checked={columns.subcategory} onChange={handleColumnToggle('subcategory')} /> <span>Subcategory</span></label>
            <label className="form-control-label"><input type="checkbox" checked={columns.store} onChange={handleColumnToggle('store')} /> <span>Store</span></label>
            <label className="form-control-label"><input type="checkbox" checked={columns.productType} onChange={handleColumnToggle('productType')} /> <span>Product Type</span></label>

            <label className="form-control-label"><input type="checkbox" checked={columns.productMode} onChange={handleColumnToggle('productMode')} /> <span>Product Mode</span></label>
            <label className="form-control-label"><input type="checkbox" checked={columns.stock} onChange={handleColumnToggle('stock')} /> <span>Stock</span></label>
            <label className="form-control-label"><input type="checkbox" checked={columns.minimumStock} onChange={handleColumnToggle('minimumStock')} /> <span>Minimum Stock</span></label>
            <label className="form-control-label"><input type="checkbox" checked={columns.moq} onChange={handleColumnToggle('moq')} /> <span>MOQ</span></label>
            <label className="form-control-label"><input type="checkbox" checked={columns.leadTime} onChange={handleColumnToggle('leadTime')} /> <span>Lead Time</span></label>
            <label className="form-control-label"><input type="checkbox" checked={columns.note} onChange={handleColumnToggle('note')} /> <span>Note</span></label>

            <div className="subtitle" style={{ gridColumn: '1 / -1', marginTop: 12, marginBottom: 8 }}>Variant Columns</div>

            <label className="form-control-label"><input type="checkbox" checked={columns.color} onChange={handleColumnToggle('color')} /> <span>Color Code</span></label>
            <label className="form-control-label"><input type="checkbox" checked={columns.size} onChange={handleColumnToggle('size')} /> <span>Size</span></label>
            <label className="form-control-label"><input type="checkbox" checked={columns.sku} onChange={handleColumnToggle('sku')} /> <span>SKU</span></label>
            <label className="form-control-label"><input type="checkbox" checked={columns.barcode} onChange={handleColumnToggle('barcode')} /> <span>Barcode</span></label>
            <label className="form-control-label"><input type="checkbox" checked={columns.purchaseCost} onChange={handleColumnToggle('purchaseCost')} /> <span>Purchase Cost</span></label>
            <label className="form-control-label"><input type="checkbox" checked={columns.salesPrice} onChange={handleColumnToggle('salesPrice')} /> <span>Sales Price</span></label>
            <label className="form-control-label"><input type="checkbox" checked={columns.image} onChange={handleColumnToggle('image')} /> <span>Image</span></label>
          </div>
        </div>

        <div className="dp-modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
});

const ProductTableBody = memo(function ProductTableBody({ products, navigate, loading, visibleColumns, onView, page, limit, selectedIds, onToggleOne, onDelete, exportAnchorEl, setExportAnchorEl, exportMenuOpen, handleExport, commonSearch }) {
  // Image preview state
  const [previewImage, setPreviewImage] = useState(null);
  const [hoverTimer, setHoverTimer] = useState(null);

  // Handle image hover
  const handleImageMouseEnter = (imgSrc) => {
    const timer = setTimeout(() => {
      setPreviewImage(imgSrc);
    }, 500); // 500ms delay before showing preview
    setHoverTimer(timer);
  };

  const handleImageMouseLeave = () => {
    if (hoverTimer) {
      clearTimeout(hoverTimer);
      setHoverTimer(null);
    }
  };

  const handleClosePreview = () => {
    setPreviewImage(null);
  };

  const handleImageClick = (e, imgSrc) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(imgSrc, '_blank', 'noopener,noreferrer');
  };

  // Add extra safety check for null/undefined products
  if (!products) {
    return (
      <TableBody>
        <TableRow>
          <TableCell colSpan={Object.values(visibleColumns).filter(Boolean).length + 2} align="center" sx={{ py: 3 }}>
            <Typography color="error">Error loading products</Typography>
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }
  
  // When loading & no products yet, show placeholder rows
  if (loading && products.length === 0) {
    return (
      <TableBody>
        <TableRow>
          <TableCell colSpan={Object.values(visibleColumns).filter(Boolean).length + 2} align="center" sx={{ py: 4 }}>
            <CircularProgress size={28} />
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }
  return (
    <TableBody>
      {products.map((p, idx) => (
        <TableRow
          key={p.ID}
          hover
          sx={{ cursor: 'pointer' }}
          tabIndex={0}
          onClick={(e) => {
            // Ignore clicks on interactive elements inside the row
            if (e.target.closest('button') || e.target.closest('input') || e.target.closest('a')) return;
            onView && onView(p.ID);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onView && onView(p.ID);
            }
          }}
        >
          <TableCell sx={{ py: 0.5 }}>
            <Checkbox
              size="small"
              checked={selectedIds.includes(p.ID)}
              onChange={() => onToggleOne(p.ID)
              }
            />
          </TableCell>
          <TableCell className="sl-cell" sx={{ py: 0.5, whiteSpace: 'nowrap' }}>{page * limit + idx + 1}</TableCell>
          {visibleColumns.serialnumber && (
            <TableCell sx={{ py: 0.5, width: 20, whiteSpace: 'nowrap' }}>
              {p.SerialNumber ?? p.serial_number ?? ''}
            </TableCell>
          )}
          {visibleColumns.name && <TableCell sx={{ py: 0.5, width: 150, whiteSpace: 'nowrap' }}>{highlightText(p.Name, commonSearch)}</TableCell>}
          {visibleColumns.code && <TableCell sx={{ py: 0.5, width: 150, whiteSpace: 'nowrap' }}>{highlightText(p.Code, commonSearch)}</TableCell>}
          {visibleColumns.category && <TableCell sx={{ py: 0.5, width: 120, whiteSpace: 'nowrap' }}>{highlightText(p.Category?.Name, commonSearch)}</TableCell>}
          {visibleColumns.subcategory && <TableCell sx={{ py: 0.5, width: 120, whiteSpace: 'nowrap' }}>{highlightText(p.Subcategory?.Name || '', commonSearch)}</TableCell>}
          {visibleColumns.store && <TableCell sx={{ py: 0.5, width: 120, whiteSpace: 'nowrap' }}>{highlightText(p.Store?.Name, commonSearch)}</TableCell>}
          {visibleColumns.productType && <TableCell sx={{ py: 0.5, width: 120, whiteSpace: 'nowrap' }}>{highlightText(p.ProductType || '', commonSearch)}</TableCell>}
          {visibleColumns.productMode && <TableCell sx={{ py: 0.5, width: 120, whiteSpace: 'nowrap' }}>{highlightText(p.ProductMode ?? p.product_mode ?? '', commonSearch)}</TableCell>}
          {visibleColumns.stock && (
            // show common fallback fields for stock if p.Stock is not present
            <TableCell align="center" sx={{ py: 0.5, width: 100, whiteSpace: 'nowrap' }}>
              {(() => {
                const stock = p.Stock ?? p.StockQuantity ?? p.stock ?? p.quantity ?? p.qty ?? '';
                const minStock = p.MinimumStock ?? p.MinStock ?? p.minimum_stock ?? p.min_stock ?? 0;
                const isLowStock = stock !== '' && minStock !== '' && Number(stock) < Number(minStock);
                return (
                  <span style={{ color: isLowStock ? '#d32f2f' : 'inherit', fontWeight: isLowStock ? 'bold' : 'normal' }}>
                    {stock}
                  </span>
                );
              })()}
            </TableCell>
          )}
          {visibleColumns.minimumStock && (
            <TableCell align="center" sx={{ py: 0.5, width: 100, whiteSpace: 'nowrap' }}>
              {p.MinimumStock ?? p.MinStock ?? p.minimum_stock ?? p.min_stock ?? ''}
            </TableCell>
          )}
          {visibleColumns.moq && (
            <TableCell align="center" sx={{ py: 0.5, width: 100, whiteSpace: 'nowrap' }}>
              {p.MOQ ?? p.MinimumOrderQuantity ?? p.moq ?? ''}
            </TableCell>
          )}
          {visibleColumns.leadTime && (
            <TableCell align="center" sx={{ py: 0.5, width: 120, whiteSpace: 'nowrap' }}>
              {p.LeadTime ?? p.lead_time ?? p.leadtime ?? ''}
            </TableCell>
          )}
          {visibleColumns.note && (
            <TableCell sx={{ py: 0.5, width: 150, whiteSpace: 'nowrap' }}>
              {highlightText(p.Note ?? p.note ?? p.Notes ?? p.notes ?? '', commonSearch)}
            </TableCell>
          )}
          {visibleColumns.status && (
            <TableCell sx={{ py: 0.5, width: 100, whiteSpace: 'nowrap' }}>
              {highlightText(p.IsActive ? 'Active' : 'Inactive', commonSearch)}
            </TableCell>
          )}
          {visibleColumns.importance && (
            <TableCell sx={{ py: 0.5, width: 100, whiteSpace: 'nowrap' }}>
              {highlightText(p.Importance ?? 'Normal', commonSearch)}
            </TableCell>
          )}
          {visibleColumns.tag && (
            <TableCell sx={{ py: 0.5, width: 120, whiteSpace: 'nowrap' }}>
              {highlightText(Array.isArray(p.Tags) && p.Tags.length > 0 ? p.Tags.map(tag => tag?.Name || '').filter(Boolean).join(', ') : '', commonSearch)}
            </TableCell>
          )}
          {visibleColumns.description && (
            <TableCell sx={{ py: 0.5, width: 150, whiteSpace: 'nowrap' }}>
              {highlightText(p.Description || '', commonSearch)}
            </TableCell>
          )}
          {/* Variant columns */}
          {visibleColumns.color && (
            <TableCell sx={{ py: 0.5, width: 120, whiteSpace: 'nowrap' }}>
              {p.Variants && p.Variants.length > 0 ? (
                <Box display="flex" flexWrap="wrap" gap={0.5} alignItems="center">
                  {p.Variants.map((v, idx) => {
                    // Find color data by hex or RAL code
                    let colorData = ralColors.find(c => c.hex.toLowerCase() === (v.Color || '').toLowerCase());
                    if (!colorData) {
                      // Try to find by RAL code
                      colorData = ralColors.find(c => c.value.toLowerCase() === (v.Color || '').toLowerCase());
                    }
                    return (
                      <Box key={idx} display="flex" alignItems="center" gap={0.5}>
                        {/* Color visual indicator */}
                        <Box
                          sx={{
                            width: 16,
                            height: 16,
                            borderRadius: 1,
                            border: '1px solid #ccc',
                            backgroundColor: colorData ? colorData.hex : (v.Color || '#ffffff'),
                            flexShrink: 0
                          }}
                        />
                        {/* Color code and name */}
                        <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                          {highlightText(colorData ? `${colorData.value} - ${colorData.name.split(' - ')[1]}` : (v.Color || 'N/A'), commonSearch)}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              ) : (
                <Typography variant="caption" color="textSecondary">{highlightText('No colors', commonSearch)}</Typography>
              )}
            </TableCell>
          )}
          {visibleColumns.size && (
            <TableCell align="center" sx={{ py: 0.5, width: 120, whiteSpace: 'nowrap' }}>
              {highlightText(p.Variants && p.Variants.length > 0 ? p.Variants.map(v => v.Size?.Name || v.Size).join(', ') : '', commonSearch)}
            </TableCell>
          )}
          {visibleColumns.sku && (
            <TableCell sx={{ py: 0.5, width: 120, whiteSpace: 'nowrap' }}>
              {highlightText(p.Variants && p.Variants.length > 0 ? p.Variants.map(v => v.SKU).join(', ') : '', commonSearch)}
            </TableCell>
          )}
          {visibleColumns.barcode && (
            <TableCell sx={{ py: 0.5, width: 120, whiteSpace: 'nowrap' }}>
              {highlightText(p.Variants && p.Variants.length > 0 ? p.Variants.map(v => v.Barcode).join(', ') : '', commonSearch)}
            </TableCell>
          )}
          {visibleColumns.purchaseCost && (
            <TableCell align="center" sx={{ py: 0.5, width: 120, whiteSpace: 'nowrap' }}>
              {p.Variants && p.Variants.length > 0 ? p.Variants.map(v => `₹${v.PurchaseCost || 0}`).join(', ') : ''}
            </TableCell>
          )}
          {visibleColumns.salesPrice && (
            <TableCell align="center" sx={{ py: 0.5, width: 120, whiteSpace: 'nowrap' }}>
              {p.Variants && p.Variants.length > 0 ? p.Variants.map(v => `₹${v.StdSalesPrice || 0}`).join(', ') : ''}
            </TableCell>
          )}
          {visibleColumns.image && (
            <TableCell sx={{ py: 0.5, width: 120, whiteSpace: 'nowrap' }}>
              {(() => {
                const imgSrc = getMainImageForProduct(p);
                if (imgSrc) {
                  return (
                    <Box
                      sx={{ display: 'inline-block', position: 'relative' }}
                      onMouseEnter={() => handleImageMouseEnter(imgSrc)}
                      onMouseLeave={handleImageMouseLeave}
                    >
                      <img
                        src={imgSrc}
                        alt={`product-main-${p.ID}`}
                        onClick={(e) => handleImageClick(e, imgSrc)}
                        style={{
                          width: 40,
                          height: 40,
                          objectFit: 'cover',
                          borderRadius: 4,
                          border: '1px solid #ccc',
                          cursor: 'pointer',
                          transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.transform = 'scale(1.1)';
                          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                        onError={(e) => {
                          console.error('Failed to load main product image:', { src: e.target.src, productId: p.ID });
                          e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="100%" height="100%" fill="%23eee"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-size="8">No Img</text></svg>';
                        }}
                        title="Click to open in new tab, hover to preview"
                      />
                    </Box>
                  );
                }
                return <Typography variant="caption" color="textSecondary">{highlightText('No image', commonSearch)}</Typography>;
              })()}
            </TableCell>
          )}
          {visibleColumns.actions && (
            <TableCell align="center" sx={{ py: 0.5, width: 150, whiteSpace: 'nowrap' }}>
              <Box display="flex" justifyContent="center" alignItems="center" gap={1} className="action-buttons">
                <Tooltip title="View">
                  <IconButton 
                    size="small"
                    onClick={() => onView && onView(p.ID)}
                    sx={{ color: '#1976d2' }}
                  >
                    <Visibility fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Edit">
                  <IconButton 
                    size="small"
                    onClick={() => navigate(`/products/${p.ID}/edit`)}
                    sx={{ color: '#347539ff' }}
                  >
                    <Edit fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton 
                    size="small"
                    onClick={() => onDelete && onDelete(p.ID)}
                    sx={{ color: '#d32f2f' }}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </TableCell>
          )}
        </TableRow>
      ))}
      {loading && products.length > 0 && (
        <TableRow>
          <TableCell colSpan={Object.values(visibleColumns).filter(Boolean).length + 2} align="center" sx={{ py: 1 }}>
            <CircularProgress size={20} />
          </TableCell>
        </TableRow>
      )}
      {(!loading && products.length === 0) && (
        <TableRow>
          <TableCell colSpan={Object.values(visibleColumns).filter(Boolean).length + 2} align="center" sx={{ py: 3 }}>No products found.</TableCell>
        </TableRow>
      )}
      {/* Image Preview Dialog */}
      <Dialog
        className="image-preview-dialog"
        open={!!previewImage}
        onClose={handleClosePreview}
        maxWidth="md"
        fullWidth
      >
        <DialogContent className="preview-content">
          {previewImage && (
            <img
              src={previewImage}
              alt="Preview"
              className="preview-image"
              onClick={() => window.open(previewImage, '_blank', 'noopener,noreferrer')}
              title="Click to open in new tab"
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePreview} className="preview-button">
            Close
          </Button>
          <Button
            onClick={() => window.open(previewImage, '_blank', 'noopener,noreferrer')}
            className="preview-button"
          >
            Open in New Tab
          </Button>
        </DialogActions>
      </Dialog>
    </TableBody>
  );
});

const FiltersRow = memo(function FiltersRow({
  inputFilters,
  setInputFilters,
  filters,
  setFilters,
  setDebouncedFilters,
  categories,
  allSubcategories,
  stores,
  hsnCodes,
  units,
  sizes,
  setPage,
  visibleColumns,
  handleExport,
  setImportDialogOpen,
  autocompleteOptions,
  autocompleteLoading,
  autocompleteOpen,
  setAutocompleteOpen,
  setAutocompleteOptions,
  onAutocompleteInputChange,
  stockFilter,
  setStockFilter,
  exportAnchorEl,
  setExportAnchorEl,
  exportMenuOpen
}) {
  return (
    <TableRow>
      <TableCell sx={{ width: 60 }} />
      <TableCell className="sl-filter" />
      {visibleColumns.name && (
        <TableCell className="filter-cell" sx={{ width: 150 }}>
          <div className="filter-control">
            <input
              className="filter-input"
              placeholder="Search Name"
              value={inputFilters.name || ''}
              onChange={(e) => {
                const v = e.target.value;
                setInputFilters(f => ({ ...f, name: v }));
                onAutocompleteInputChange('names', v);
                if (v === '') { setFilters(prev => ({ ...prev, name: '' })); setPage(0); }
                if (v && v.length >= 1) setAutocompleteOpen(prev => ({ ...prev, names: true }));
              }}
              onFocus={() => { setAutocompleteOpen(prev => ({ ...prev, names: true })); onAutocompleteInputChange('names', inputFilters.name || ''); }}
              onBlur={() => { setTimeout(() => setAutocompleteOpen(prev => ({ ...prev, names: false })), 120); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { setFilters(prev => ({ ...prev, name: e.target.value })); setPage(0); } }}
            />
            {autocompleteLoading.names && <span className="filter-loading">Loading...</span>}
            {(autocompleteOpen.names && autocompleteOptions.names && autocompleteOptions.names.length > 0) && (
              <div className="filter-dropdown" role="listbox">
                {(autocompleteOptions.names || []).map((opt, idx) => (
                  <div
                    key={idx}
                    className="filter-dropdown-item"
                    onMouseDown={(ev) => {
                      ev.preventDefault();
                      setInputFilters(f => ({ ...f, name: opt }));
                      setFilters(prev => ({ ...prev, name: opt }));
                      setPage(0);
                      setAutocompleteOpen(prev => ({ ...prev, names: false }));
                    }}
                  >
                    {opt}
                  </div>
                ))}
              </div>
            )}
          </div>
        </TableCell>
      )}
      {visibleColumns.code && (
        <TableCell className="filter-cell" sx={{ width: 120 }}>
          <div className="filter-control">
            <input
              className="filter-input"
              placeholder="Code"
              value={inputFilters.code || ''}
              onChange={(e) => {
                const v = e.target.value;
                setInputFilters(f => ({ ...f, code: v }));
                onAutocompleteInputChange('codes', v);
                if (v === '') { setFilters(prev => ({ ...prev, code: '' })); setPage(0); }
                if (v && v.length >= 1) setAutocompleteOpen(prev => ({ ...prev, codes: true }));
              }}
              onFocus={() => { setAutocompleteOpen(prev => ({ ...prev, codes: true })); onAutocompleteInputChange('codes', inputFilters.code || ''); }}
              onBlur={() => { setTimeout(() => setAutocompleteOpen(prev => ({ ...prev, codes: false })), 120); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { setFilters(prev => ({ ...prev, code: e.target.value })); setPage(0); } }}
            />
            {autocompleteLoading.codes && <span className="filter-loading">Loading...</span>}
            {(autocompleteOpen.codes && autocompleteOptions.codes && autocompleteOptions.codes.length > 0) && (
              <div className="filter-dropdown" role="listbox">
                {(autocompleteOptions.codes || []).map((opt, idx) => (
                  <div
                    key={idx}
                    className="filter-dropdown-item"
                    onMouseDown={(ev) => {
                      ev.preventDefault();
                      setInputFilters(f => ({ ...f, code: opt }));
                      setFilters(prev => ({ ...prev, code: opt }));
                      setPage(0);
                      setAutocompleteOpen(prev => ({ ...prev, codes: false }));
                    }}
                  >
                    {opt}
                  </div>
                ))}
              </div>
            )}
          </div>
        </TableCell>
      )}
      {visibleColumns.category && (
        <TableCell className="filter-cell" sx={{ width: 120 }}>
          <select
            className="filter-select"
            value={filters.categoryID ?? ''}
            onChange={(e) => {
              const val = e.target.value ? Number(e.target.value) : null;
              setFilters(prev => {
                const next = { ...prev, categoryID: val, subcategoryID: null };
                setDebouncedFilters(next);
                return next;
              });
              setPage(0);
            }}
          >
            <option value="">All</option>
            {categories.map(c => <option key={c.ID} value={c.ID}>{c.Name}</option>)}
          </select>
        </TableCell>
      )}
      {visibleColumns.subcategory && (
        <TableCell className="filter-cell" sx={{ width: 120 }}>
          <select
            className="filter-select"
            value={filters.subcategoryID ?? ''}
            onChange={(e) => {
              const val = e.target.value ? Number(e.target.value) : null;
              setFilters(prev => {
                const next = { ...prev, subcategoryID: val };
                setDebouncedFilters(next);
                return next;
              });
              setPage(0);
            }}
            disabled={!filters.categoryID}
          >
            <option value="">All</option>
            {allSubcategories.filter(sub => {
              if (!filters.categoryID) return false;
              const catID = filters.categoryID.toString();
              const subCatID = sub.CategoryID?.toString();
              return catID === subCatID;
            }).map(s => <option key={s.ID} value={s.ID}>{s.Name}</option>)}
          </select>
        </TableCell>
      )}
       {visibleColumns.store && (
        <TableCell className="filter-cell" sx={{ width: 120 }}>
          <select
            className="filter-select"
            value={filters.storeID ?? ''}
            onChange={(e) => {
              const val = e.target.value ? Number(e.target.value) : null;
              setFilters(prev => {
                const next = { ...prev, storeID: val };
                setDebouncedFilters(next);
                return next;
              });
              setPage(0);
            }}
          >
            <option value="">All</option>
            {stores.map(s => <option key={s.ID} value={s.ID}>{s.Name}</option>)}
          </select>
        </TableCell>
      )}
      {visibleColumns.productType && (
        <TableCell className="filter-cell" sx={{ width: 120 }}>
          <select className="filter-select" value={filters.productType ?? ''} onChange={(e) => { const val = e.target.value; setFilters(prev => { const next = { ...prev, productType: val }; setDebouncedFilters(next); return next; }); setPage(0); }}>
            <option value="">All</option>
            <option value="Finished Goods">Finished Goods</option>
            <option value="Semi-Finished Goods">Semi-Finished Goods</option>
            <option value="Raw Materials">Raw Materials</option>
          </select>
        </TableCell>
      )}
      {visibleColumns.productMode && (
        <TableCell className="filter-cell" sx={{ width: 120 }}>
          <select className="filter-select" value={filters.productMode ?? ''} onChange={(e) => { const val = e.target.value; setFilters(prev => { const next = { ...prev, productMode: val }; setDebouncedFilters(next); return next; }); setPage(0); }}>
            <option value="">All</option>
            <option value="Purchase">Purchase</option>
            <option value="Internal Manufacturing">Internal Manufacturing</option>
            <option value="Both">Both</option>
          </select>
        </TableCell>
      )}
      {visibleColumns.stock && (
        <TableCell className="filter-cell" sx={{ width: 160 }}>
          <select
            className="filter-select"
            value={stockFilter || 'all'}
            onChange={(e) => { const val = e.target.value; setStockFilter(val); setPage(0); }}
            aria-label="Stock Filter"
          >
            <option value="all">All</option>
            <option value="less_than_minimum_stock">Less than Minimum Stock</option>
            <option value="greater_than_minimum_stock">Minimum Stock or More</option>
          </select>
        </TableCell>
      )}
      {visibleColumns.minimumStock && (
        <TableCell className="filter-cell" sx={{ width: 120 }}>
          <input
            className="filter-input"
            type="number"
            placeholder="Min Stock"
            value={inputFilters.minimumStock || ''}
            onChange={(e) => { const v = e.target.value; setInputFilters(f => ({ ...f, minimumStock: v })); if (v === '') { setFilters(prev => ({ ...prev, minimumStock: '' })); setPage(0); } }}
            onKeyDown={(e) => { if (e.key === 'Enter') { setFilters(prev => ({ ...prev, minimumStock: e.target.value })); setPage(0); } }}
          />
        </TableCell>
      )}
      {visibleColumns.moq && (
        <TableCell className="filter-cell" sx={{ width: 120 }}>
          <div className="filter-control">
            <input
              className="filter-input"
              placeholder="MOQ"
              value={inputFilters.moq || ''}
              onChange={(e) => {
                const v = e.target.value;
                setInputFilters(f => ({ ...f, moq: v }));
                if (v && v.length >= 1) { onAutocompleteInputChange('moqs', v); setAutocompleteOpen(prev => ({ ...prev, moqs: true })); }
                else { setAutocompleteOptions(prev => ({ ...prev, moqs: [] })); if (v === '') { setFilters(prev => ({ ...prev, moq: '' })); setPage(0); } }
              }}
              onFocus={() => setAutocompleteOpen(prev => ({ ...prev, moqs: true }))}
              onBlur={() => { setTimeout(() => setAutocompleteOpen(prev => ({ ...prev, moqs: false })), 120); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { setFilters(prev => ({ ...prev, moq: e.target.value })); setPage(0); } }}
            />
            {autocompleteLoading.moqs && <span className="filter-loading">Loading...</span>}
            {(autocompleteOpen.moqs && autocompleteOptions.moqs && autocompleteOptions.moqs.length > 0) && (
              <div className="filter-dropdown" role="listbox">
                {(autocompleteOptions.moqs || []).map((opt, idx) => (
                  <div
                    key={idx}
                    className="filter-dropdown-item"
                    onMouseDown={(ev) => {
                      ev.preventDefault();
                      setInputFilters(f => ({ ...f, moq: opt }));
                      setFilters(prev => ({ ...prev, moq: opt }));
                      setPage(0);
                      setAutocompleteOpen(prev => ({ ...prev, moqs: false }));
                    }}
                  >
                    {opt}
                  </div>
                ))}
              </div>
            )}
          </div>
        </TableCell>
      )}
      {visibleColumns.leadTime && (
        <TableCell className="filter-cell" sx={{ width: 120 }}>
          <div className="filter-control">
            <input
              className="filter-input"
              placeholder="Lead Time"
              value={inputFilters.leadTime || ''}
              onChange={(e) => {
                const v = e.target.value;
                setInputFilters(f => ({ ...f, leadTime: v }));
                if (v && v.length >= 1) { onAutocompleteInputChange('leadTimes', v); setAutocompleteOpen(prev => ({ ...prev, leadTimes: true })); }
                else { setAutocompleteOptions(prev => ({ ...prev, leadTimes: [] })); if (v === '') { setFilters(prev => ({ ...prev, leadTime: '' })); setPage(0); } }
              }}
              onFocus={() => setAutocompleteOpen(prev => ({ ...prev, leadTimes: true }))}
              onBlur={() => { setTimeout(() => setAutocompleteOpen(prev => ({ ...prev, leadTimes: false })), 120); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { setFilters(prev => ({ ...prev, leadTime: e.target.value })); setPage(0); } }}
            />
            {autocompleteLoading.leadTimes && <span className="filter-loading">Loading...</span>}
            {(autocompleteOpen.leadTimes && autocompleteOptions.leadTimes && autocompleteOptions.leadTimes.length > 0) && (
              <div className="filter-dropdown" role="listbox">
                {(autocompleteOptions.leadTimes || []).map((opt, idx) => (
                  <div
                    key={idx}
                    className="filter-dropdown-item"
                    onMouseDown={(ev) => {
                      ev.preventDefault();
                      setInputFilters(f => ({ ...f, leadTime: opt }));
                      setFilters(prev => ({ ...prev, leadTime: opt }));
                      setPage(0);
                      setAutocompleteOpen(prev => ({ ...prev, leadTimes: false }));
                    }}
                  >
                    {opt}
                  </div>
                ))}
              </div>
            )}
          </div>
        </TableCell>
      )}
      {visibleColumns.note && (
        <TableCell className="filter-cell" sx={{ width: 120 }}>
          <div className="filter-control">
            <input
              className="filter-input"
              placeholder="Note"
              value={inputFilters.note || ''}
              onChange={(e) => {
                const v = e.target.value;
                setInputFilters(f => ({ ...f, note: v }));
                if (v && v.length >= 1) { onAutocompleteInputChange('notes', v); setAutocompleteOpen(prev => ({ ...prev, notes: true })); }
                else { setAutocompleteOptions(prev => ({ ...prev, notes: [] })); if (v === '') { setFilters(prev => ({ ...prev, note: '' })); setPage(0); } }
              }}
              onFocus={() => setAutocompleteOpen(prev => ({ ...prev, notes: true }))}
              onBlur={() => { setTimeout(() => setAutocompleteOpen(prev => ({ ...prev, notes: false })), 120); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { setFilters(prev => ({ ...prev, note: e.target.value })); setPage(0); } }}
            />
            {autocompleteLoading.notes && <span className="filter-loading">Loading...</span>}
            {(autocompleteOpen.notes && autocompleteOptions.notes && autocompleteOptions.notes.length > 0) && (
              <div className="filter-dropdown" role="listbox">
                {(autocompleteOptions.notes || []).map((opt, idx) => (
                  <div
                    key={idx}
                    className="filter-dropdown-item"
                    onMouseDown={(ev) => {
                      ev.preventDefault();
                      setInputFilters(f => ({ ...f, note: opt }));
                      setFilters(prev => ({ ...prev, note: opt }));
                      setPage(0);
                      setAutocompleteOpen(prev => ({ ...prev, notes: false }));
                    }}
                  >
                    {opt}
                  </div>
                ))}
              </div>
            )}
          </div>
        </TableCell>
      )}
      {visibleColumns.status && (
        <TableCell className="filter-cell" sx={{ width: 120 }}>
          <select className="filter-select" value={filters.status ?? ''} onChange={(e) => { const val = e.target.value || null; setFilters(prev => { const next = { ...prev, status: val }; setDebouncedFilters(next); return next; }); setPage(0); }}>
            <option value="">All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </TableCell>
      )}
      {visibleColumns.importance && (
        <TableCell className="filter-cell" sx={{ width: 120 }}>
          <select className="filter-select" value={filters.importance ?? ''} onChange={(e) => { const val = e.target.value || null; setFilters(prev => { const next = { ...prev, importance: val }; setDebouncedFilters(next); return next; }); setPage(0); }}>
            <option value="">All</option>
            <option value="Normal">Normal</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </TableCell>
      )}
      {visibleColumns.tag && (
        <TableCell className="filter-cell" sx={{ width: 120 }}>
          <div className="filter-control">
            <input
              className="filter-input"
              placeholder="Tag"
              value={inputFilters.tag || ''}
              onChange={(e) => {
                const v = e.target.value;
                setInputFilters(f => ({ ...f, tag: v }));
                if (v && v.length >= 1) { onAutocompleteInputChange('tags', v); setAutocompleteOpen(prev => ({ ...prev, tags: true })); }
                else { setAutocompleteOptions(prev => ({ ...prev, tags: [] })); if (v === '') { setFilters(prev => ({ ...prev, tag: '' })); setPage(0); } }
              }}
              onFocus={() => setAutocompleteOpen(prev => ({ ...prev, tags: true }))}
              onBlur={() => { setTimeout(() => setAutocompleteOpen(prev => ({ ...prev, tags: false })), 120); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { setFilters(prev => ({ ...prev, tag: e.target.value })); setPage(0); } }}
            />
            {autocompleteLoading.tags && <span className="filter-loading">Loading...</span>}
            {(autocompleteOpen.tags && autocompleteOptions.tags && autocompleteOptions.tags.length > 0) && (
              <div className="filter-dropdown" role="listbox">
                {(autocompleteOptions.tags || []).map((opt, idx) => (
                  <div
                    key={idx}
                    className="filter-dropdown-item"
                    onMouseDown={(ev) => {
                      ev.preventDefault();
                      setInputFilters(f => ({ ...f, tag: opt }));
                      setFilters(prev => ({ ...prev, tag: opt }));
                      setPage(0);
                      setAutocompleteOpen(prev => ({ ...prev, tags: false }));
                    }}
                  >
                    {opt}
                  </div>
                ))}
              </div>
            )}
          </div>
        </TableCell>
      )}
      {visibleColumns.description && (
        <TableCell className="filter-cell" sx={{ width: 150 }}>
          <div className="filter-control">
            <input
              className="filter-input"
              placeholder="Description"
              value={inputFilters.description || ''}
              onChange={(e) => {
                const v = e.target.value;
                setInputFilters(f => ({ ...f, description: v }));
                if (v && v.length >= 1) { onAutocompleteInputChange('descriptions', v); setAutocompleteOpen(prev => ({ ...prev, descriptions: true })); }
                else { setAutocompleteOptions(prev => ({ ...prev, descriptions: [] })); if (v === '') { setFilters(prev => ({ ...prev, description: '' })); setPage(0); } }
              }}
              onFocus={() => setAutocompleteOpen(prev => ({ ...prev, descriptions: true }))}
              onBlur={() => { setTimeout(() => { setAutocompleteOpen(prev => ({ ...prev, descriptions: false })); if (inputFilters.description && inputFilters.description.trim() !== '') { setFilters(prev => ({ ...prev, description: inputFilters.description.trim() })); setPage(0); } }, 120); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { setFilters(prev => ({ ...prev, description: e.target.value })); setPage(0); } }}
            />
            {autocompleteLoading.descriptions && <span className="filter-loading">Loading...</span>}
            {(autocompleteOpen.descriptions && autocompleteOptions.descriptions && autocompleteOptions.descriptions.length > 0) && (
              <div className="filter-dropdown" role="listbox">
                {(autocompleteOptions.descriptions || []).map((opt, idx) => (
                  <div
                    key={idx}
                    className="filter-dropdown-item"
                    onMouseDown={(ev) => {
                      ev.preventDefault();
                      setInputFilters(f => ({ ...f, description: opt }));
                      setFilters(prev => ({ ...prev, description: opt }));
                      setPage(0);
                      setAutocompleteOpen(prev => ({ ...prev, descriptions: false }));
                    }}
                  >
                    {opt}
                  </div>
                ))}
              </div>
            )}
          </div>
        </TableCell>
      )}
      {/* Variant column filters */}
      {visibleColumns.color && (
        <TableCell className="filter-cell" sx={{ width: 120 }}>
          <div className="filter-control">
            <input
              className="filter-input"
              placeholder="Color Code"
              value={inputFilters.color || ''}
              onChange={(e) => {
                const v = e.target.value;
                setInputFilters(f => ({ ...f, color: v }));
                if (v && v.length >= 1) { onAutocompleteInputChange('colors', v); setAutocompleteOpen(prev => ({ ...prev, colors: true })); }
                else { setAutocompleteOptions(prev => ({ ...prev, colors: [] })); if (v === '') { setFilters(prev => ({ ...prev, color: '' })); setPage(0); } }
              }}
              onFocus={() => setAutocompleteOpen(prev => ({ ...prev, colors: true }))}
              onBlur={() => { setTimeout(() => setAutocompleteOpen(prev => ({ ...prev, colors: false })), 120); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { setFilters(prev => ({ ...prev, color: e.target.value })); setPage(0); } }}
            />
            {autocompleteLoading.colors && <span className="filter-loading">Loading...</span>}
            {(autocompleteOpen.colors && autocompleteOptions.colors && autocompleteOptions.colors.length > 0) && (
              <div className="filter-dropdown" role="listbox">
                {(autocompleteOptions.colors || []).map((opt, idx) => (
                  <div
                    key={idx}
                    className="filter-dropdown-item"
                    onMouseDown={(ev) => {
                      ev.preventDefault();
                      setInputFilters(f => ({ ...f, color: opt }));
                      setFilters(prev => ({ ...prev, color: opt }));
                      setPage(0);
                      setAutocompleteOpen(prev => ({ ...prev, colors: false }));
                    }}
                  >
                    {opt}
                  </div>
                ))}
              </div>
            )}
          </div>
        </TableCell>
      )}
      {visibleColumns.size && (
        <TableCell className="filter-cell" sx={{ width: 120 }}>
          <div className="filter-control">
            <input
              className="filter-input"
              placeholder="Size"
              value={inputFilters.size || ''}
              onChange={(e) => {
                const v = e.target.value;
                setInputFilters(f => ({ ...f, size: v }));
                if (v && v.length >= 1) { onAutocompleteInputChange('sizes', v); setAutocompleteOpen(prev => ({ ...prev, sizes: true })); }
                else { setAutocompleteOptions(prev => ({ ...prev, sizes: [] })); if (v === '') { setFilters(prev => ({ ...prev, size: '' })); setPage(0); } }
              }}
              onFocus={() => setAutocompleteOpen(prev => ({ ...prev, sizes: true }))}
              onBlur={() => { setTimeout(() => setAutocompleteOpen(prev => ({ ...prev, sizes: false })), 120); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { setFilters(prev => ({ ...prev, size: e.target.value })); setPage(0); } }}
            />
            {autocompleteLoading.sizes && <span className="filter-loading">Loading...</span>}
            {(autocompleteOpen.sizes && autocompleteOptions.sizes && autocompleteOptions.sizes.length > 0) && (
              <div className="filter-dropdown" role="listbox">
                {(autocompleteOptions.sizes || []).map((opt, idx) => (
                  <div
                    key={idx}
                    className="filter-dropdown-item"
                    onMouseDown={(ev) => {
                      ev.preventDefault();
                      setInputFilters(f => ({ ...f, size: opt }));
                      setFilters(prev => ({ ...prev, size: opt }));
                      setPage(0);
                      setAutocompleteOpen(prev => ({ ...prev, sizes: false }));
                    }}
                  >
                    {opt}
                  </div>
                ))}
              </div>
            )}
          </div>
        </TableCell>
      )}
      {visibleColumns.sku && (
        <TableCell className="filter-cell" sx={{ width: 120 }}>
          <div className="filter-control">
            <input
              className="filter-input"
              placeholder="SKU"
              value={inputFilters.sku || ''}
              onChange={(e) => {
                const v = e.target.value;
                setInputFilters(f => ({ ...f, sku: v }));
                if (v && v.length >= 1) { onAutocompleteInputChange('skus', v); setAutocompleteOpen(prev => ({ ...prev, skus: true })); }
                else { setAutocompleteOptions(prev => ({ ...prev, skus: [] })); if (v === '') { setFilters(prev => ({ ...prev, sku: '' })); setPage(0); } }
              }}
              onFocus={() => setAutocompleteOpen(prev => ({ ...prev, skus: true }))}
              onBlur={() => { setTimeout(() => setAutocompleteOpen(prev => ({ ...prev, skus: false })), 120); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { setFilters(prev => ({ ...prev, sku: e.target.value })); setPage(0); } }}
            />
            {autocompleteLoading.skus && <span className="filter-loading">Loading...</span>}
            {(autocompleteOpen.skus && autocompleteOptions.skus && autocompleteOptions.skus.length > 0) && (
              <div className="filter-dropdown" role="listbox">
                {(autocompleteOptions.skus || []).map((opt, idx) => (
                  <div
                    key={idx}
                    className="filter-dropdown-item"
                    onMouseDown={(ev) => {
                      ev.preventDefault();
                      setInputFilters(f => ({ ...f, sku: opt }));
                      setFilters(prev => ({ ...prev, sku: opt }));
                      setPage(0);
                      setAutocompleteOpen(prev => ({ ...prev, skus: false }));
                    }}
                  >
                    {opt}
                  </div>
                ))}
              </div>
            )}
          </div>
        </TableCell>
      )}
      {visibleColumns.barcode && (
        <TableCell className="filter-cell" sx={{ width: 120 }}>
          <div className="filter-control">
            <input
              className="filter-input"
              placeholder="Barcode"
              value={inputFilters.barcode || ''}
              onChange={(e) => {
                const v = e.target.value;
                setInputFilters(f => ({ ...f, barcode: v }));
                if (v && v.length >= 1) { onAutocompleteInputChange('barcodes', v); setAutocompleteOpen(prev => ({ ...prev, barcodes: true })); }
                else { setAutocompleteOptions(prev => ({ ...prev, barcodes: [] })); if (v === '') { setFilters(prev => ({ ...prev, barcode: '' })); setPage(0); } }
              }}
              onFocus={() => setAutocompleteOpen(prev => ({ ...prev, barcodes: true }))}
              onBlur={() => { setTimeout(() => setAutocompleteOpen(prev => ({ ...prev, barcodes: false })), 120); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { setFilters(prev => ({ ...prev, barcode: e.target.value })); setPage(0); } }}
            />
            {autocompleteLoading.barcodes && <span className="filter-loading">Loading...</span>}
            {(autocompleteOpen.barcodes && autocompleteOptions.barcodes && autocompleteOptions.barcodes.length > 0) && (
              <div className="filter-dropdown" role="listbox">
                {(autocompleteOptions.barcodes || []).map((opt, idx) => (
                  <div
                    key={idx}
                    className="filter-dropdown-item"
                    onMouseDown={(ev) => {
                      ev.preventDefault();
                      setInputFilters(f => ({ ...f, barcode: opt }));
                      setFilters(prev => ({ ...prev, barcode: opt }));
                      setPage(0);
                      setAutocompleteOpen(prev => ({ ...prev, barcodes: false }));
                    }}
                  >
                    {opt}
                  </div>
                ))}
              </div>
            )}
          </div>
        </TableCell>
      )}
      {visibleColumns.purchaseCost && (
        <TableCell className="filter-cell" sx={{ width: 120 }}>
          <div className="filter-control">
            <input
              className="filter-input"
              placeholder="Purchase Cost"
              type="number"
              value={inputFilters.purchaseCost || ''}
              onChange={(e) => {
                const v = e.target.value;
                setInputFilters(f => ({ ...f, purchaseCost: v }));
                if (v && v.length >= 1) { onAutocompleteInputChange('purchaseCosts', v); setAutocompleteOpen(prev => ({ ...prev, purchaseCosts: true })); }
                else { setAutocompleteOptions(prev => ({ ...prev, purchaseCosts: [] })); if (v === '') { setFilters(prev => ({ ...prev, purchaseCost: '' })); setPage(0); } }
              }}
              onFocus={() => setAutocompleteOpen(prev => ({ ...prev, purchaseCosts: true }))}
              onBlur={() => { setTimeout(() => setAutocompleteOpen(prev => ({ ...prev, purchaseCosts: false })), 120); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { setFilters(prev => ({ ...prev, purchaseCost: e.target.value })); setPage(0); } }}
            />
            {autocompleteLoading.purchaseCosts && <span className="filter-loading">Loading...</span>}
            {(autocompleteOpen.purchaseCosts && autocompleteOptions.purchaseCosts && autocompleteOptions.purchaseCosts.length > 0) && (
              <div className="filter-dropdown" role="listbox">
                {(autocompleteOptions.purchaseCosts || []).map((opt, idx) => (
                  <div
                    key={idx}
                    className="filter-dropdown-item"
                    onMouseDown={(ev) => {
                      ev.preventDefault();
                      setInputFilters(f => ({ ...f, purchaseCost: opt }));
                      setFilters(prev => ({ ...prev, purchaseCost: opt }));
                      setPage(0);
                      setAutocompleteOpen(prev => ({ ...prev, purchaseCosts: false }));
                    }}
                  >
                    {opt}
                  </div>
                ))}
              </div>
            )}
          </div>
        </TableCell>
      )}
      {visibleColumns.salesPrice && (
        <TableCell className="filter-cell" sx={{ width: 120 }}>
          <div className="filter-control">
            <input
              className="filter-input"
              placeholder="Sales Price"
              type="number"
              value={inputFilters.salesPrice || ''}
              onChange={(e) => {
                const v = e.target.value;
                setInputFilters(f => ({ ...f, salesPrice: v }));
                if (v && v.length >= 1) { onAutocompleteInputChange('salesPrices', v); setAutocompleteOpen(prev => ({ ...prev, salesPrices: true })); }
                else { setAutocompleteOptions(prev => ({ ...prev, salesPrices: [] })); if (v === '') { setFilters(prev => ({ ...prev, salesPrice: '' })); setPage(0); } }
              }}
              onFocus={() => setAutocompleteOpen(prev => ({ ...prev, salesPrices: true }))}
              onBlur={() => { setTimeout(() => setAutocompleteOpen(prev => ({ ...prev, salesPrices: false })), 120); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { setFilters(prev => ({ ...prev, salesPrice: e.target.value })); setPage(0); } }}
            />
            {autocompleteLoading.salesPrices && <span className="filter-loading">Loading...</span>}
            {(autocompleteOpen.salesPrices && autocompleteOptions.salesPrices && autocompleteOptions.salesPrices.length > 0) && (
              <div className="filter-dropdown" role="listbox">
                {(autocompleteOptions.salesPrices || []).map((opt, idx) => (
                  <div
                    key={idx}
                    className="filter-dropdown-item"
                    onMouseDown={(ev) => {
                      ev.preventDefault();
                      setInputFilters(f => ({ ...f, salesPrice: opt }));
                      setFilters(prev => ({ ...prev, salesPrice: opt }));
                      setPage(0);
                      setAutocompleteOpen(prev => ({ ...prev, salesPrices: false }));
                    }}
                  >
                    {opt}
                  </div>
                ))}
              </div>
            )}
          </div>
        </TableCell>
      )}
      {visibleColumns.image && <TableCell sx={{ width: 120 }}><Typography variant="caption" color="textSecondary">Images</Typography></TableCell>}
      {visibleColumns.actions && <TableCell sx={{ width: 150 }} />}
    </TableRow>
  );
});

const highlightText = (text, searchTerm) => {
  if (!searchTerm || !text) return text;
  
  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  
  return parts.map((part, index) => 
    regex.test(part) ? <span key={index} className="search-highlight">{part}</span> : part
  );
};

export default function ProductListPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allSubcategories, setAllSubcategories] = useState([]);
  const [stores, setStores] = useState([]);
  const [hsnCodes, setHsnCodes] = useState([]);
  const [units, setUnits] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [tags, setTags] = useState([]);
  const [taxes, setTaxes] = useState([]);
  
  // Define default filters
  const defaultFilters = { 
    name: "", code: "", categoryID: null, subcategoryID: null, storeID: null, 
    productType: "", productMode: "", stock: "", moq: "", leadTime: "", note: "", status: null, 
    importance: null, tag: "", description: "", color: "", size: "", sku: "", barcode: "", 
    purchaseCost: "", salesPrice: "" 
  };
  
  // Replace initial filters (use null for IDs)
  const [filters, setFilters] = useState(defaultFilters);
  
  // NEW: local input state to avoid re-fetch on every keystroke
  const [inputFilters, setInputFilters] = useState({ 
    name: "", code: "", productType: "", productMode: "", stock: "", minimumStock: "", moq: "", 
    leadTime: "", note: "", tag: "", description: "", color: "", size: "", sku: "", 
    barcode: "", purchaseCost: "", salesPrice: "" 
  });
  const [page, setPage] = useState(0);
  const [limit, setRowsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  // Sorting state for Name and Stock columns
  const [nameSort, setNameSort] = useState(null); // null | 'asc' | 'desc'
  const [stockSort, setStockSort] = useState(null); // null | 'asc' | 'desc'
  const [leadTimeSort, setLeadTimeSort] = useState(null); // null | 'asc' | 'desc'
  const [purchaseCostSort, setPurchaseCostSort] = useState(null); // null | 'asc' | 'desc'
  const [salesPriceSort, setSalesPriceSort] = useState(null); // null | 'asc' | 'desc'
  
  // Force refresh flag
  const [forceRefresh, setForceRefresh] = useState(0);
  
  // FIXED: Initialize debouncedFilters directly with defaultFilters instead of filters reference
  const [debouncedFilters, setDebouncedFilters] = useState({...defaultFilters});

  // Helper to decide if a read-only field should expand to multiline
  const shouldExpandField = (val, threshold = 120) => {
    if (val === null || val === undefined) return false;
    const s = String(val);
    return s.includes('\n') || s.length > threshold;
  };

  // New state for display preferences
  const [visibleColumns, setVisibleColumns] = useState(() => {
    // Default columns configuration
    const defaultColumns = {
      name: true,
      code: true,
      category: true,
      subcategory: true,
      store: true,
      productType: true,
      productMode: true,
      stock: true,
      minimumStock: true,
      moq: true,
      leadTime: true,
      note: true,
      status: true,
      importance: true,
      tag: true,
      description: true,
      // Variant columns
      color: true,
      size: true,
      sku: true,
      barcode: true,
      purchaseCost: true,
      salesPrice: true,
      image: true,
      actions: true
    };

    // Try to load saved preferences from localStorage
    const savedPreferences = localStorage.getItem('productListColumns');
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences);
        // Merge saved preferences with defaults to handle new columns
        return { ...defaultColumns, ...parsed };
      } catch (e) {
        console.error('Error parsing saved column preferences', e);
      }
    }
    // Return default to all columns visible
    return defaultColumns;
  });
  
  // State for display preferences popover
  const [displayPrefsAnchor, setDisplayPrefsAnchor] = useState(null);

  // Save column preferences to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('productListColumns', JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  // Selection state for checkboxes
  const [selectedIds, setSelectedIds] = useState([]);

  // Add state for stock filter dropdown
  const [stockFilter, setStockFilter] = useState('all');
  // Common search input to search across multiple fields
  const [commonSearch, setCommonSearch] = useState('');

  // Autocomplete state
  const [autocompleteOptions, setAutocompleteOptions] = useState({
    names: [],
    codes: [],
    stocks: [],
    moqs: [],
    leadTimes: [],
    notes: [],
    tags: [],
    descriptions: [],
    colors: [],
    sizes: [],
    skus: [],
    barcodes: [],
    purchaseCosts: [],
    salesPrices: []
  });
  const [autocompleteLoading, setAutocompleteLoading] = useState({
    names: false,
    codes: false,
    stocks: false,
    moqs: false,
    leadTimes: false,
    notes: false,
    tags: false,
    descriptions: false,
    colors: false,
    sizes: false,
    skus: false,
    barcodes: false,
    purchaseCosts: false,
    salesPrices: false
  });
  const [autocompleteSource, setAutocompleteSource] = useState({
    names: 'local', // 'local' or 'api'
    codes: 'local',
    stocks: 'local',
    moqs: 'local',
    leadTimes: 'local',
    notes: 'local'
  });
  
  // Export menu state
  const [exportAnchorEl, setExportAnchorEl] = useState(null);
  const exportMenuOpen = Boolean(exportAnchorEl);

  // Control open state for autocomplete dropdowns
  const [autocompleteOpen, setAutocompleteOpen] = useState({
    names: false,
    codes: false,
    stocks: false,
    moqs: false,
    leadTimes: false,
    notes: false,
    tags: false,
    descriptions: false,
    colors: false,
    sizes: false,
    skus: false,
    barcodes: false,
    purchaseCosts: false,
    salesPrices: false
  });

  const toggleSelectOne = (id) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      return [...prev, id];
    });
  };

  const toggleSelectAllOnPage = () => {
    const pageIds = products.map(p => p.ID);
    const allSelected = pageIds.length > 0 && pageIds.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
    } else {
      setSelectedIds(prev => {
        const s = new Set(prev);
        pageIds.forEach(id => s.add(id));
        return Array.from(s);
      });
    }
  };

  // Update autocomplete options when products data changes
  useEffect(() => {
    // Clear existing autocomplete options when products change
    setAutocompleteOptions({
      names: [],
      codes: [],
      stocks: [],
      moqs: [],
      leadTimes: [],
      notes: [],
      colors: [],
      sizes: [],
      skus: [],
      barcodes: [],
      purchaseCosts: [],
      salesPrices: []
    });
    setAutocompleteSource({
      names: 'local',
      codes: 'local',
      stocks: 'local',
      moqs: 'local',
      leadTimes: 'local',
      notes: 'local',
      colors: 'local',
      sizes: 'local',
      skus: 'local',
      barcodes: 'local',
      purchaseCosts: 'local',
      salesPrices: 'local'
    });
  }, [products]);

  // Sync initial values (runs once)
  useEffect(() => {
    setInputFilters({ name: filters.name, code: filters.code, productType: filters.productType, productMode: filters.productMode, stock: filters.stock, moq: filters.moq, leadTime: filters.leadTime, note: filters.note, tag: filters.tag, description: filters.description, color: filters.color, size: filters.size, sku: filters.sku, barcode: filters.barcode, purchaseCost: filters.purchaseCost, salesPrice: filters.salesPrice });
  }, []); 

  // Only auto-apply non-autocomplete fields to main filters.
  // Autocomplete-driven inputs (name, code, stock, etc.) will only apply when the user selects an option.
  const autocompleteFields = ['name','code','stock','moq','leadTime','note','tag','description','color','size','sku','barcode','purchaseCost','salesPrice'];

  // Debounce typing for non-autocomplete fields (productType, productMode, minimumStock)
  useEffect(() => {
    const t = setTimeout(() => {
      setFilters(prev => {
        // Only update the non-autocomplete fields here. Autocomplete fields are applied on selection.
        const newFilters = { ...prev };
        let changed = false;

        if (prev.productType !== inputFilters.productType) {
          newFilters.productType = inputFilters.productType;
          changed = true;
        }
        if (prev.productMode !== inputFilters.productMode) {
          newFilters.productMode = inputFilters.productMode;
          changed = true;
        }
        if (prev.minimumStock !== inputFilters.minimumStock) {
          newFilters.minimumStock = inputFilters.minimumStock;
          changed = true;
        }

        if (!changed) return prev;
        return newFilters;
      });
      setPage(0);
    }, 400); // typing debounce for non-autocomplete fields
    return () => clearTimeout(t);
  }, [inputFilters.productType, inputFilters.productMode, inputFilters.minimumStock]);

  // Apply common search to multiple filter fields (name, code, tag, description, sku, barcode, category, subcategory, store)
  // Update filters immediately when `commonSearch` changes (no debounce) so results reflect user input promptly.
  useEffect(() => {
    const val = commonSearch && commonSearch.trim() !== '' ? commonSearch.trim() : '';
    setFilters(prev => {
      const updated = { ...prev };
      // Use a single global filter string so backend can perform an OR-search across fields
      updated.filter = val;
      // Clear individual text fields so they don't AND with the global filter
      updated.name = '';
      updated.code = '';
      updated.tag = '';
      updated.description = '';
      updated.sku = '';
      updated.barcode = '';
      // Do not set categoryID/subcategoryID/storeID here; backend global filter will match by names too
      updated.categoryID = null;
      updated.subcategoryID = null;
      updated.storeID = null;
      return updated;
    });
    setPage(0);
  }, [commonSearch]);

  // FIXED: Use the correct debounce implementation
  useEffect(() => {
    // Update debouncedFilters with current filters
    const handler = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 500);
    return () => clearTimeout(handler);
  }, [filters]);

  const fetchMeta = async () => {
    try {
      console.log("Fetching dropdown data from backend...");
      
      // Fetch all metadata in parallel
      const [catRes, subRes, storeRes, hsnRes, unitRes, sizeRes, tagRes, taxRes] = await Promise.all([
        axios.get(`${BASE_URL}/api/categories`).catch(err => {
          console.error("Error fetching categories:", err);
          return { data: [] };
        }),
        axios.get(`${BASE_URL}/api/subcategories`).catch(err => {
          console.error("Error fetching subcategories:", err);
          return { data: [] };
        }),
        axios.get(`${BASE_URL}/api/stores`).catch(err => {
          console.error("Error fetching stores:", err);
          return { data: [] };
        }),
        axios.get(`${BASE_URL}/api/hsncode`).catch(err => {
          console.error("Error fetching hsncodes:", err);
          return { data: [] };
        }),
        axios.get(`${BASE_URL}/api/units`).catch(err => {
          console.error("Error fetching units:", err);
          return { data: [] };
        }),
        axios.get(`${BASE_URL}/api/sizes`).catch(err => {
          console.error("Error fetching sizes:", err);
          return { data: [] };
        }),
        axios.get(`${BASE_URL}/api/tags`).catch(err => {
          console.error("Error fetching tags:", err);
          return { data: [] };
        }),
        axios.get(`${BASE_URL}/api/taxes`).catch(err => {
          console.error("Error fetching taxes:", err);
          return { data: [] };
        }),
      ]);
      
      // Handle different response structures and ensure we have arrays
      const processData = (response) => {
        if (!response || !response.data) return [];
        const data = response.data.data || response.data;
        return Array.isArray(data) ? data : [];
      };
      
      const categoriesData = processData(catRes);
      const subcategoriesData = processData(subRes);
      const storesData = processData(storeRes);
      const hsnCodesData = processData(hsnRes);
      const unitsData = processData(unitRes);
  const sizesData = processData(sizeRes);
  const tagsData = processData(tagRes);
  const taxesData = processData(taxRes);
      
      // Log the first item of each type to check data structure
      console.log("Dropdown data samples:");
      if (categoriesData.length > 0) console.log("Category sample:", categoriesData[0]);
      if (subcategoriesData.length > 0) console.log("Subcategory sample:", subcategoriesData[0]);
      if (storesData.length > 0) console.log("Store sample:", storesData[0]);
      if (hsnCodesData.length > 0) console.log("HSN Code sample:", hsnCodesData[0]);
      if (unitsData.length > 0) console.log("Unit sample:", unitsData[0]);
      if (sizesData.length > 0) console.log("Size sample:", sizesData[0]);
      if (taxesData.length > 0) console.log("Tax sample:", taxesData[0]);
      
      // Log the counts
      console.log("Dropdown data counts:");
      console.log("Categories:", categoriesData.length);
      console.log("Subcategories:", subcategoriesData.length);
      console.log("Stores:", storesData.length);
      console.log("HSN Codes:", hsnCodesData.length);
      console.log("Units:", unitsData.length);
      console.log("Sizes:", sizesData.length);
      console.log("Taxes:", taxesData.length);
      
      // Detailed logging of raw HSN codes data
      console.log("Raw HSN codes data (first item):", hsnCodesData.length > 0 ? hsnCodesData[0] : "No HSN data");
      
      // Standardize HSN codes format if needed
      const standardizedHsnCodes = hsnCodesData.map(hsn => {
        // Based on the backend model, we know the structure should be:
        // { id: number, code: string, tax_id: number, Tax: { ... } }
        
        // Create a standardized HSN object
        return {
          id: hsn.id || hsn.ID,
          code: String(hsn.code || hsn.Code || ''),
          tax_id: hsn.tax_id || hsn.taxId || hsn.TaxID,
          Tax: hsn.Tax || hsn.tax || {},
          // Add extra fields for compatibility with dropdown component
          tax: hsn.Tax || hsn.tax || {}
        };
      });
      
      // Log the standardized HSN codes
      console.log("Standardized HSN codes (first item):", standardizedHsnCodes.length > 0 ? standardizedHsnCodes[0] : "No HSN data");
      
      // Update state with the processed data
      setCategories(categoriesData);
      setAllSubcategories(subcategoriesData);
      setStores(storesData);
      setHsnCodes(standardizedHsnCodes);
      setUnits(unitsData);
  setSizes(sizesData);
  setTags(tagsData);
  setTaxes(taxesData);
      
      return {
        categories: categoriesData,
        subcategories: subcategoriesData,
        stores: storesData,
        hsnCodes: standardizedHsnCodes,
        units: unitsData,
        tags: tagsData,
        taxes: taxesData,
        sizes: sizesData
      };
    } catch (err) {
      console.error("Error fetching dropdown data:", err);
      return null;
    }
  };

  // Fetch categories and stores on component mount
  useEffect(() => {
    fetchMeta();
  }, []);

  // Autocomplete fetch functions
  const fetchAutocompleteOptions = async (field, query = '') => {
    setAutocompleteLoading(prev => ({ ...prev, [field]: true }));

    try {
      // First try to get suggestions from current table data
      const localSuggestions = getLocalSuggestions(field, query);

      if (localSuggestions.length > 0) {
        setAutocompleteOptions(prev => ({ ...prev, [field]: localSuggestions }));
        setAutocompleteSource(prev => ({ ...prev, [field]: 'local' }));
        setAutocompleteOpen(prev => ({ ...prev, [field]: true }));
        setAutocompleteLoading(prev => ({ ...prev, [field]: false }));
        return;
      }

      // If no local suggestions and query is provided, fall back to API
      if (query.trim()) {
        const response = await axios.get(`${BASE_URL}/api/products/autocomplete`, {
          params: { field, query, limit: 10 }
        });
        const data = response.data.data || [];
        setAutocompleteOptions(prev => ({ ...prev, [field]: data }));
        setAutocompleteSource(prev => ({ ...prev, [field]: 'api' }));
        if (data && data.length > 0) setAutocompleteOpen(prev => ({ ...prev, [field]: true }));
      }
    } catch (error) {
      console.error(`Error fetching ${field} autocomplete:`, error);
      // Even on error, try to use local suggestions as fallback
      const localSuggestions = getLocalSuggestions(field, query);
      setAutocompleteOptions(prev => ({ ...prev, [field]: localSuggestions }));
      setAutocompleteSource(prev => ({ ...prev, [field]: 'local' }));
      if (localSuggestions && localSuggestions.length > 0) setAutocompleteOpen(prev => ({ ...prev, [field]: true }));
    } finally {
      setAutocompleteLoading(prev => ({ ...prev, [field]: false }));
    }
  };

  // Get suggestions from current table data
  const getLocalSuggestions = (field, query) => {
    if (!products || products.length === 0) return [];

    const queryLower = query ? query.toLowerCase() : '';
    const suggestions = new Set();

    switch (field) {
      case 'names':
        products.forEach(product => {
          if (product.Name) {
            // If no query, add all; otherwise filter
            if (!query || product.Name.toLowerCase().includes(queryLower)) {
              suggestions.add(product.Name);
            }
          }
        });
        break;

      case 'codes':
        products.forEach(product => {
          if (product.Code) {
            if (!query || product.Code.toLowerCase().includes(queryLower)) {
              suggestions.add(product.Code);
            }
          }
        });
        break;

      case 'stocks':
        products.forEach(product => {
          // Get stock from product or variants
          let stock = null;
          if (product.Stock !== undefined && product.Stock !== null) {
            stock = product.Stock;
          } else if (product.Variants && product.Variants.length > 0) {
            stock = product.Variants.reduce((sum, variant) => sum + (variant.Stock || 0), 0);
          }

          if (stock !== null && stock !== undefined && stock.toString().includes(query)) {
            suggestions.add(stock.toString());
          }
        });
        break;

      case 'moqs':
        products.forEach(product => {
          if (product.MOQ !== undefined && product.MOQ !== null && product.MOQ.toString().includes(query)) {
            suggestions.add(product.MOQ.toString());
          }
        });
        break;

      case 'leadTimes':
        products.forEach(product => {
          let leadTime = null;
          if (product.LeadTime !== undefined && product.LeadTime !== null) {
            leadTime = product.LeadTime;
          } else if (product.Variants && product.Variants.length > 0 && product.Variants[0].LeadTime) {
            leadTime = product.Variants[0].LeadTime;
          }

          if (leadTime !== null && leadTime !== undefined && leadTime.toString().includes(query)) {
            suggestions.add(leadTime.toString());
          }
        });
        break;

      case 'notes':
        products.forEach(product => {
          const note = product.Note || product.InternalNotes || product.internal_notes || '';
          if (note && note.toLowerCase().includes(queryLower)) {
            suggestions.add(note);
          }
        });
        break;

      case 'tags':
        products.forEach(product => {
          if (Array.isArray(product.Tags) && product.Tags.length > 0) {
            product.Tags.forEach(tag => {
              if (tag && tag.Name && tag.Name.toLowerCase().includes(queryLower)) {
                suggestions.add(tag.Name);
              }
            });
          }
        });
        break;

      case 'descriptions':
        products.forEach(product => {
          const description = product.Description || '';
          if (description && typeof description === 'string' && description.toLowerCase().includes(queryLower)) {
            suggestions.add(description);
          }
        });
        break;

      case 'colors':
        products.forEach(product => {
          if (product.Variants && product.Variants.length > 0) {
            product.Variants.forEach(variant => {
              if (variant.Color && variant.Color.toLowerCase().includes(queryLower)) {
                suggestions.add(variant.Color);
              }
            });
          }
        });
        break;

      case 'sizes':
        products.forEach(product => {
          if (product.Variants && product.Variants.length > 0) {
            product.Variants.forEach(variant => {
              const size = variant.Size?.Name || variant.Size;
              if (size && size.toLowerCase().includes(queryLower)) {
                suggestions.add(size);
              }
            });
          }
        });
        break;

      case 'skus':
        products.forEach(product => {
          if (product.Variants && product.Variants.length > 0) {
            product.Variants.forEach(variant => {
              if (variant.SKU && variant.SKU.toLowerCase().includes(queryLower)) {
                suggestions.add(variant.SKU);
              }
            });
          }
        });
        break;

      case 'barcodes':
        products.forEach(product => {
          if (product.Variants && product.Variants.length > 0) {
            product.Variants.forEach(variant => {
              if (variant.Barcode && variant.Barcode.toLowerCase().includes(queryLower)) {
                suggestions.add(variant.Barcode);
              }
            });
          }
        });
        break;

      case 'purchaseCosts':
        products.forEach(product => {
          if (product.Variants && product.Variants.length > 0) {
            product.Variants.forEach(variant => {
              if (variant.PurchaseCost !== undefined && variant.PurchaseCost !== null && variant.PurchaseCost.toString().includes(query)) {
                suggestions.add(variant.PurchaseCost.toString());
              }
            });
          }
        });
        break;

      case 'salesPrices':
        products.forEach(product => {
          if (product.Variants && product.Variants.length > 0) {
            product.Variants.forEach(variant => {
              if (variant.StdSalesPrice !== undefined && variant.StdSalesPrice !== null && variant.StdSalesPrice.toString().includes(query)) {
                suggestions.add(variant.StdSalesPrice.toString());
              }
            });
          }
        });
        break;

      default:
        return [];
    }

    // Convert Set to Array and limit to 10 suggestions
    return Array.from(suggestions).slice(0, 10);
  };

  // Debounced autocomplete functions (reduced delay for instant local suggestions)
  const debouncedFetchNames = useCallback(
    debounce((query) => fetchAutocompleteOptions('names', query), 100),
    [products]
  );
  const debouncedFetchCodes = useCallback(
    debounce((query) => fetchAutocompleteOptions('codes', query), 100),
    [products]
  );
  const debouncedFetchStocks = useCallback(
    debounce((query) => fetchAutocompleteOptions('stocks', query), 100),
    [products]
  );
  const debouncedFetchMoqs = useCallback(
    debounce((query) => fetchAutocompleteOptions('moqs', query), 100),
    [products]
  );
  const debouncedFetchLeadTimes = useCallback(
    debounce((query) => fetchAutocompleteOptions('leadTimes', query), 100),
    [products]
  );
  const debouncedFetchNotes = useCallback(
    debounce((query) => fetchAutocompleteOptions('notes', query), 100),
    [products]
  );

  const debouncedFetchTags = useCallback(
    debounce((query) => fetchAutocompleteOptions('tags', query), 100),
    [products]
  );

  const debouncedFetchDescriptions = useCallback(
    debounce((query) => fetchAutocompleteOptions('descriptions', query), 100),
    [products]
  );

  // Variant field autocomplete functions
  const debouncedFetchColors = useCallback(
    debounce((query) => fetchAutocompleteOptions('colors', query), 100),
    [products]
  );

  const debouncedFetchSizes = useCallback(
    debounce((query) => fetchAutocompleteOptions('sizes', query), 100),
    [products]
  );

  const debouncedFetchSkus = useCallback(
    debounce((query) => fetchAutocompleteOptions('skus', query), 100),
    [products]
  );

  const debouncedFetchBarcodes = useCallback(
    debounce((query) => fetchAutocompleteOptions('barcodes', query), 100),
    [products]
  );

  const debouncedFetchPurchaseCosts = useCallback(
    debounce((query) => fetchAutocompleteOptions('purchaseCosts', query), 100),
    [products]
  );

  const debouncedFetchSalesPrices = useCallback(
    debounce((query) => fetchAutocompleteOptions('salesPrices', query), 100),
    [products]
  );

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // FIXED: Added check to ensure debouncedFilters is defined before using it
      if (!debouncedFilters) {
        console.error('debouncedFilters is undefined');
        setLoading(false);
        return;
      }
      
      console.log('fetchProducts called with filters:', debouncedFilters); // Debug log
      console.log('Current page:', page, 'limit:', limit); // Debug log
      
      // Always send category_id/subcategory_id/store_id as they are (don't force conversion)
      const filterParams = Object.entries({
        name: debouncedFilters.name || "",
        code: debouncedFilters.code || "",
        product_type: debouncedFilters.productType !== "" ? debouncedFilters.productType : undefined,
        product_mode: debouncedFilters.productMode !== "" ? debouncedFilters.productMode : undefined,
        category_id: debouncedFilters.categoryID != null ? debouncedFilters.categoryID : undefined,
        subcategory_id: debouncedFilters.subcategoryID != null ? debouncedFilters.subcategoryID : undefined,
        store_id: debouncedFilters.storeID != null ? debouncedFilters.storeID : undefined,
        stock:
          debouncedFilters.stock !== "" && !isNaN(Number(debouncedFilters.stock))
            ? Number(debouncedFilters.stock)
            : undefined,
        minimum_stock:
          debouncedFilters.minimumStock !== "" && !isNaN(Number(debouncedFilters.minimumStock))
            ? Number(debouncedFilters.minimumStock)
            : undefined,
        moq:
          debouncedFilters.moq !== "" && !isNaN(Number(debouncedFilters.moq))
            ? Number(debouncedFilters.moq)
            : undefined,
        lead_time: debouncedFilters.leadTime !== "" ? debouncedFilters.leadTime : undefined,
        note: debouncedFilters.note !== "" ? debouncedFilters.note : undefined,
        status: debouncedFilters.status != null ? debouncedFilters.status : undefined,
        importance: debouncedFilters.importance != null ? debouncedFilters.importance : undefined,
        tag: debouncedFilters.tag !== "" ? debouncedFilters.tag : undefined,
        description: debouncedFilters.description !== "" ? debouncedFilters.description : undefined,
        color: debouncedFilters.color !== "" ? debouncedFilters.color : undefined,
        size: debouncedFilters.size !== "" ? debouncedFilters.size : undefined,
        sku: debouncedFilters.sku !== "" ? debouncedFilters.sku : undefined,
        barcode: debouncedFilters.barcode !== "" ? debouncedFilters.barcode : undefined,
        purchase_cost:
          debouncedFilters.purchaseCost !== "" && !isNaN(Number(debouncedFilters.purchaseCost))
            ? Number(debouncedFilters.purchaseCost)
            : undefined,
        sales_price:
          debouncedFilters.salesPrice !== "" && !isNaN(Number(debouncedFilters.salesPrice))
            ? Number(debouncedFilters.salesPrice)
            : undefined,
        filter: debouncedFilters.filter !== "" && debouncedFilters.filter !== undefined ? debouncedFilters.filter : undefined,
        stock_filter: stockFilter !== 'all' ? stockFilter : undefined,
      }).reduce((acc, [key, value]) => {
        if (value !== "" && value !== undefined && value !== null) {
          acc[key] = value;
        }
        return acc;
      }, {});
      
      // Add sorting params if set
      let sortParams = {};
      if (nameSort) {
        sortParams = { sort_by: 'name', sort_order: nameSort };
      } else if (stockSort) {
        sortParams = { sort_by: 'stock', sort_order: stockSort };
      } else if (leadTimeSort) {
        sortParams = { sort_by: 'leadTime', sort_order: leadTimeSort };
      } else if (purchaseCostSort) {
        sortParams = { sort_by: 'purchaseCost', sort_order: purchaseCostSort };
      } else if (salesPriceSort) {
        sortParams = { sort_by: 'salesPrice', sort_order: salesPriceSort };
      }
      
      console.log('Fetching products with params:', {
        page: page + 1,
        limit,
        ...filterParams,
        ...sortParams,
      });
      
      try {
        const res = await axios.get(`${BASE_URL}/api/products`, {
          params: {
            page: page + 1,
            limit,
            ...filterParams,
            ...sortParams,
            // Add timestamp to prevent caching
            _t: new Date().getTime()
          },
          // Add timeout to prevent hanging requests
          timeout: 15000
        });
        
        console.log('fetchProducts API response status:', res.status);
        console.log('fetchProducts API response data:', res.data);

        // Normalize API product list: accept null `data` as empty list
        const apiProducts = (() => {
          if (!res || !res.data) return [];
          if (Array.isArray(res.data.data)) return res.data.data;
          if (res.data.data == null) return [];
          if (Array.isArray(res.data)) return res.data;
          return [];
        })();

        console.log('Setting products to:', apiProducts.length, 'items');
        // If a global filter is active, attempt to also fetch products matching several fields
        // (product_type, product_mode, importance, status, and description) when the user has
        // NOT explicitly selected those individual filters. This covers backends that don't
        // include those fields in the global `filter` search.
        if (debouncedFilters && debouncedFilters.filter) {
          const extraFetches = [];

          // Only query product_type/product_mode when user hasn't selected them explicitly
          if (!debouncedFilters.productType) {
            extraFetches.push(
              axios.get(`${BASE_URL}/api/products`, {
                params: { page: 1, limit: 1000, product_type: debouncedFilters.filter },
                timeout: 15000
              }).catch(() => ({ data: { data: [] } }))
            );
          }
          if (!debouncedFilters.productMode) {
            extraFetches.push(
              axios.get(`${BASE_URL}/api/products`, {
                params: { page: 1, limit: 1000, product_mode: debouncedFilters.filter },
                timeout: 15000
              }).catch(() => ({ data: { data: [] } }))
            );
          }

          // Importance/status/description - include when they are not explicitly set
          if (debouncedFilters.importance == null) {
            extraFetches.push(
              axios.get(`${BASE_URL}/api/products`, {
                params: { page: 1, limit: 1000, importance: debouncedFilters.filter },
                timeout: 15000
              }).catch(() => ({ data: { data: [] } }))
            );
          }
          if (debouncedFilters.status == null) {
            extraFetches.push(
              axios.get(`${BASE_URL}/api/products`, {
                params: { page: 1, limit: 1000, status: debouncedFilters.filter },
                timeout: 15000
              }).catch(() => ({ data: { data: [] } }))
            );
          }
          if (!debouncedFilters.description) {
            extraFetches.push(
              axios.get(`${BASE_URL}/api/products`, {
                params: { page: 1, limit: 1000, description: debouncedFilters.filter },
                timeout: 15000
              }).catch(() => ({ data: { data: [] } }))
            );
          }

          if (extraFetches.length === 0) {
            // Nothing extra to fetch; use API response
            setProducts(apiProducts);
            setTotalItems(res?.data?.total || 0);
            setTotalCost(res?.data?.totalCost || 0);
          } else {
            try {
              const results = await Promise.all(extraFetches);
              const extraProducts = results.flatMap(r => (r && r.data && Array.isArray(r.data.data)) ? r.data.data : []);

              // Merge results, deduplicate by ID (or Code as fallback)
              const mergedMap = new Map();
              const pushToMap = (p) => {
                const key = p.ID != null ? String(p.ID) : (p.Code ? `code:${p.Code}` : JSON.stringify(p));
                if (!mergedMap.has(key)) mergedMap.set(key, p);
              };
              apiProducts.forEach(pushToMap);
              extraProducts.forEach(pushToMap);

              const merged = Array.from(mergedMap.values());
              console.log('Merged products count (including extra field searches):', merged.length);

              // Client-side filtering for global filter across fields that backend may not search.
              if (debouncedFilters && debouncedFilters.filter) {
                const q = String(debouncedFilters.filter).trim().toLowerCase();
                const filtered = merged.filter(p => {
                  const check = (v) => v !== null && v !== undefined && String(v).toLowerCase().includes(q);
                  // Status can be stored as boolean or IsActive flag
                  const statusText = (p.IsActive === true || p.IsActive === 1) ? 'active' : (p.IsActive === false || p.IsActive === 0 ? 'inactive' : '');

                  // Tags can be an array of objects with Name, or a string field
                  const tagsMatch = Array.isArray(p.Tags) && p.Tags.some(t => {
                    if (!t) return false;
                    if (typeof t === 'string') return t.toLowerCase().includes(q);
                    return (t.Name && String(t.Name).toLowerCase().includes(q));
                  });
                  const tagFieldMatch = check(p.Tag);

                  // Colors & Sizes may exist on product or on variants
                  const colorMatch = (check(p.Color) || (Array.isArray(p.Variants) && p.Variants.some(v => {
                    if (check(v.Color)) return true;
                    const cd = getColorInfo(v.Color);
                    if (cd && (cd.value && cd.value.toLowerCase().includes(q) || cd.name && cd.name.toLowerCase().includes(q))) return true;
                    return false;
                  })));

                  const sizeMatch = (check(p.Size) || (Array.isArray(p.Variants) && p.Variants.some(v => {
                    const sizeVal = v.Size?.Name || v.Size;
                    return check(sizeVal);
                  })));

                  return (
                    check(p.Importance) ||
                    check(p.Description) ||
                    (statusText && statusText.includes(q)) ||
                    check(p.ProductType) ||
                    check(p.ProductMode) ||
                    check(p.Name) ||
                    check(p.Code) ||
                    check(p.Category?.Name) ||
                    check(p.Subcategory?.Name) ||
                    check(p.Store?.Name) ||
                    check(p.InternalNotes) ||
                    tagsMatch ||
                    tagFieldMatch ||
                    colorMatch ||
                    sizeMatch
                  );
                });
                console.log('After client-side filtering, products count:', filtered.length);
                setProducts(filtered);
                setTotalItems(filtered.length);
                setTotalCost(res?.data?.totalCost || 0);
              } else {
                setProducts(merged);
                setTotalItems(merged.length);
                setTotalCost(res?.data?.totalCost || 0);
              }
            } catch (mergeErr) {
              console.error('Error fetching extra-field matches for common filter:', mergeErr);
              setProducts(apiProducts);
              setTotalItems(res?.data?.total || 0);
              setTotalCost(res?.data?.totalCost || 0);
            }
          }
        } else {
          setProducts(apiProducts);
          setTotalItems(res?.data?.total || 0);
          setTotalCost(res?.data?.totalCost || 0);
        }
      } catch (apiError) {
        console.error('API request failed:', apiError);
        setProducts([]);
        setTotalItems(0);
        setTotalCost(0);
      }
    } catch (err) {
      console.error("Error fetching products:", err);
      // Initialize with empty array instead of null
      setProducts([]);
      setTotalItems(0);
      setTotalCost(0);
      setApiError(err.message || "Failed to load products. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // handleSearch removed: search is now automatic on filter change

  const handleNameSort = useCallback((direction) => {
    setNameSort(currentSort => currentSort === direction ? null : direction);
    setStockSort(null);
    setLeadTimeSort(null);
  }, []);

  const handleStockSort = useCallback((direction) => {
    setStockSort(currentSort => currentSort === direction ? null : direction);
    setNameSort(null);
    setLeadTimeSort(null);
  }, []);

  const handleLeadTimeSort = useCallback((direction) => {
    setLeadTimeSort(currentSort => currentSort === direction ? null : direction);
    setNameSort(null);
    setStockSort(null);
    setPurchaseCostSort(null);
    setSalesPriceSort(null);
  }, []);

  const handlePurchaseCostSort = useCallback((direction) => {
    setPurchaseCostSort(currentSort => currentSort === direction ? null : direction);
    setNameSort(null);
    setStockSort(null);
    setLeadTimeSort(null);
    setSalesPriceSort(null);
  }, []);

  const handleSalesPriceSort = useCallback((direction) => {
    setSalesPriceSort(currentSort => currentSort === direction ? null : direction);
    setNameSort(null);
    setStockSort(null);
    setLeadTimeSort(null);
    setPurchaseCostSort(null);
  }, []);

  useEffect(() => {
    console.log('Effect triggered - fetchProducts will be called');
    console.log('Current filters state:', { 
      debouncedFilters, 
      page, 
      limit, 
      sorts: { nameSort, stockSort, leadTimeSort, purchaseCostSort, salesPriceSort }, 
      stockFilter,
      forceRefresh 
    });
    
    // Safeguard against undefined debouncedFilters
    if (debouncedFilters) {
      fetchProducts();
    } else {
      console.error('debouncedFilters is undefined in useEffect - cannot fetch products');
    }
  }, [debouncedFilters, page, limit, nameSort, stockSort, leadTimeSort, purchaseCostSort, salesPriceSort, stockFilter, forceRefresh]);

  // Debug: Monitor products state changes
  useEffect(() => {
    console.log('Products state changed:', products?.length || 0, 'items');
  }, [products]);

  // Force cleanup and fetch on component mount
  useEffect(() => {
    // Reset key states on mount
    setLoading(true);
    setApiError(null);
    setProducts([]);
    
    // Check if BASE_URL is configured correctly
    if (!BASE_URL) {
      setApiError('BASE_URL is not configured. Please check Config.jsx');
      setLoading(false);
      return;
    }
    
    // Start with a direct API check instead of using filters
    // This ensures we at least get data even if there's an issue with filters
    checkAPI();
    
    return () => {
      // Cleanup function
      console.log('Component unmounting - cleaning up');
    };
  }, []);

  // Display preferences handlers
  const handleOpenDisplayPrefs = (event) => {
    setDisplayPrefsAnchor(event.currentTarget);
  };

  const handleCloseDisplayPrefs = () => {
    setDisplayPrefsAnchor(null);
  };

  const [selectedProduct, setSelectedProduct] = useState(null); // product details for view
  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  // Image preview state for product details dialog
  const [detailsPreviewImage, setDetailsPreviewImage] = useState(null);
  const [detailsHoverTimer, setDetailsHoverTimer] = useState(null);
  // Confirm dialog state for delete action
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTargetId, setConfirmTargetId] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  // Error dialog state for delete/operation failures
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorMessage] = useState('');
  const [errorTitle, setErrorTitle] = useState('');
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importedData, setImportedData] = useState([]);
  const [importPreviewOpen, setImportPreviewOpen] = useState(false);
  const [importSelectedRows, setImportSelectedRows] = useState(new Set());
  // Per-field import errors mapping: { rowIndex: { columnKey: [messages] } }
  const [importFieldErrors, setImportFieldErrors] = useState({});
  const [importReportOpen, setImportReportOpen] = useState(false);
  const [importReport, setImportReport] = useState(null);

  // Helper: normalize header/key to a canonical form
  const _normalizeKey = (k) => String(k || '').toLowerCase().replace(/\s+/g, '').replace(/\*/g, '').replace(/[^a-z0-9]/g, '');

  // Build a map of rowIndex -> { columnKey: [error messages] } from validation/backend errors
  const buildFieldErrorMapFromErrors = (errorsArr = [], dataArray = []) => {
    const map = {};
    if (!Array.isArray(errorsArr)) return map;
    errorsArr.forEach(errObj => {
      const rowIndex = typeof errObj.row === 'number' ? (errObj.row - 1) : (errObj.rowIndex ?? null);
      if (rowIndex === null || rowIndex < 0) return;
      const rowData = errObj.data || dataArray[rowIndex] || {};
      const keys = Object.keys(rowData);
      if (!map[rowIndex]) map[rowIndex] = {};
      const msgs = Array.isArray(errObj.errors) ? errObj.errors : [String(errObj.errors || '')];
      msgs.forEach(msg => {
        const lower = String(msg || '').toLowerCase();
        let matched = false;

        const heuristics = [
          { key: 'name', tags: ['name'] },
          { key: 'producttype', tags: ['product type', 'producttype'] },
          { key: 'store', tags: ['store'] },
          { key: 'hsn', tags: ['hsn'] },
          { key: 'unit', tags: ['unit'] },
          { key: 'status', tags: ['status'] },
          { key: 'importance', tags: ['importance'] },
          { key: 'code', tags: ['code'] },
          { key: 'tax', tags: ['tax'] }
        ];

        for (const h of heuristics) {
          if (h.tags.some(t => lower.includes(t))) {
            const found = keys.find(k => _normalizeKey(k).includes(h.key) || _normalizeKey(k) === h.key);
            if (found) {
              map[rowIndex][found] = map[rowIndex][found] || [];
              map[rowIndex][found].push(msg);
              matched = true;
              break;
            }
          }
        }

        if (!matched) {
          // fallback: attach to all columns for visibility
          keys.forEach(k => {
            map[rowIndex][k] = map[rowIndex][k] || [];
            map[rowIndex][k].push(msg);
          });
        }
      });
    });
    return map;
  };

  const handleOpenView = async (id) => {
    try {
      setViewLoading(true);
      // fetch full product details
      const res = await axios.get(`${BASE_URL}/api/products/${id}`);
      let product = res?.data?.data ?? res?.data ?? null;

      console.log("Product data from API:", product);
      console.log("Product Tags:", product?.Tags);

      // Helper to extract numeric stock from an object/field
      const extractStock = (obj) => {
        if (obj == null) return null;
        const candidates = [
          obj.Stock,
          obj.StockQuantity,
          obj.stock,
          obj.quantity,
          obj.qty,
          obj.total_stock,
          obj.TotalStock,
        ];
        for (const c of candidates) {
          if (c === 0) return 0;
          if (c == null) continue;
          const n = Number(c);
          if (!Number.isNaN(n)) return n;
        }
        return null;
      };

      // Helper to pick the first available image URL from variant image structures
      const extractImages = (v) => {
        const imgs = v.Images ?? v.images ?? v.ImagesList ?? v.images_list ?? v.pictures ?? v.pictures_list ?? v.photos;
        if (!imgs) {
          // sometimes a single image field exists
          const single = v.Image ?? v.image ?? v.thumbnail ?? v.thumb;
          return single ? [single] : [];
        }
        // normalize array items to strings when possible
        if (Array.isArray(imgs)) {
          return imgs.map(i => {
            if (!i) return null;
            if (typeof i === 'string') return i;
            // common shapes: { url } or { path } or { src }
            return i.url ?? i.src ?? i.path ?? i.file ?? null;
          }).filter(Boolean);
        }
        // if it's an object with url
        if (typeof imgs === 'object' && imgs !== null) {
          return [imgs.url ?? imgs.src ?? imgs.path ?? null].filter(Boolean);
        }
        return [];
      };

      // Normalize variants if present on product or fetch separately
      let variants = product?.Variants ?? product?.variants ?? product?.product_variants ?? null;
      if (!Array.isArray(variants) || variants.length === 0) {
        try {
          const vr = await axios.get(`${BASE_URL}/api/products/${id}/variants`);
          variants = vr?.data?.data ?? vr?.data ?? [];
        } catch (e) {
          console.error("Error fetching variants separately:", e);
          variants = [];
        }
      }

      // map/normalize each variant to required fields
      variants = Array.isArray(variants) ? variants.map((v, idx) => {
        const sku = v.SKU ?? v.Code ?? v.code ?? v.sku ?? v.id ?? v.ID ?? `#${idx + 1}`;
        const barcode = v.Barcode ?? v.barcode ?? v.EAN ?? v.ean ?? v.UPC ?? v.upc ?? '';
        const purchaseCost = v.PurchaseCost ?? v.purchase_cost ?? v.Cost ?? v.cost_price ?? v.CostPrice ?? v.cost ?? null;
        const salesPrice = v.Price ?? v.UnitPrice ?? v.price ?? v.unit_price ?? v.SalesPrice ?? v.sales_price ?? v.StdSalesPrice ?? v.std_sales_price ?? null;
        const stockVal = extractStock(v);
        const leadTime = v.LeadTime ?? v.lead_time ?? v.leadtime ?? v.delivery_days ?? v.lead ?? null;

        // Color / Size may be present as top-level fields or inside Attributes/options
        const attrsSource = v.Attributes ?? v.attributes ?? v.options ?? v.Options ?? v.variables ?? {};
        const color = v.Color ?? v.color ?? attrsSource.Color ?? attrsSource.color ?? attrsSource.color_name ?? '';
        const size = v.Size ?? v.size ?? attrsSource.Size ?? attrsSource.size ?? attrsSource.size_name ?? '';

        const images = extractImages(v);

        return {
          ...v,
          SKU: sku,
          Barcode: barcode,
          PurchaseCost: purchaseCost,
          SalesPrice: salesPrice,
          stock: stockVal,
          LeadTime: leadTime,
          Color: color,
          Size: size,
          Images: images,
        };
      }) : [];

      // Determine product-level stock: prefer explicit fields, else sum variant stocks
      let productStock = extractStock(product);
      if (productStock == null) {
        if (Array.isArray(variants) && variants.length > 0) {
          const s = variants.reduce((acc, v) => {
            const n = extractStock(v);
            return acc + (n != null ? n : 0);
          }, 0);
          productStock = s;
        }
      }

      // NEW: Normalize MOQ and Unit with fallbacks
      const productMOQ = product?.MOQ ?? product?.MinimumOrderQuantity ?? product?.moq ?? product?.Moq ?? null;
      let productUnit = product?.Unit ?? product?.unit ?? null;

      // Attach normalized fields to product
      const normalizedProduct = {
        ...product,
        Variants: Array.isArray(variants) ? variants : [],
        Stock: productStock,
        MOQ: productMOQ,
        Unit: productUnit,
      };

      setSelectedProduct(normalizedProduct);
      setViewOpen(true);
    } catch (err) {
      console.error("Error fetching product details:", err);
      setSelectedProduct(null);
      setViewOpen(true); // open so user sees message
    } finally {
      setViewLoading(false);
    }
  };

  const handleCloseView = () => {
    setViewOpen(false);
    setSelectedProduct(null);
  };

  // Handle image hover for product details
  const handleDetailsImageMouseEnter = (imgSrc) => {
    const timer = setTimeout(() => {
      setDetailsPreviewImage(imgSrc);
    }, 500); // 500ms delay before showing preview
    setDetailsHoverTimer(timer);
  };

  const handleDetailsImageMouseLeave = () => {
    if (detailsHoverTimer) {
      clearTimeout(detailsHoverTimer);
      setDetailsHoverTimer(null);
    }
  };

  const handleDetailsClosePreview = () => {
    setDetailsPreviewImage(null);
  };

  const handleDetailsImageClick = (e, imgSrc) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(imgSrc, '_blank', 'noopener,noreferrer');
  };

  const openDeleteConfirm = (id) => {
    setConfirmTargetId(id);
    setConfirmOpen(true);
  };

  const closeDeleteConfirm = () => {
    setConfirmOpen(false);
    setConfirmTargetId(null);
    setConfirmLoading(false);
  };

  const handleConfirmDelete = async () => {
    if (!confirmTargetId) return;
    setConfirmLoading(true);
    try {
      await axios.delete(`${BASE_URL}/api/products/${confirmTargetId}`);
      // Refresh list after delete
      fetchProducts();
      // Remove from selectedIds if present
      setSelectedIds(prev => prev.filter(id => id !== confirmTargetId));
      closeDeleteConfirm();
    } catch (err) {
      console.error('Failed to delete product:', err.response?.data || err.message);
      setConfirmLoading(false);

      // Common helpful message when delete fails due to existing references

      // Inspect server response for known foreign-key violation indicators
      const serverMsg = err.response?.data?.error || err.response?.data || err.message || '';
      const isForeignKeyViolation = /violates foreign key constraint|SQLSTATE\s*23503|foreign key/i.test(String(serverMsg)) || err.response?.data?.code === '23503';

      // Handle 409 Conflict (product is referenced in quotations/orders)
      if (err.response?.status === 409 || isForeignKeyViolation) {
        setErrorTitle('Cannot Delete Product');
        setErrorDialogOpen(true);
      } else {
        // Generic error for other failures
        const errorMsg = typeof serverMsg === 'string' ? serverMsg : JSON.stringify(serverMsg);
        setErrorTitle('Failed to Delete Product');
        setErrorDialogOpen(true);
      }
    }
  };

  // Set a specific image as the main/star image for a variant and persist via API
  const handleSetMainImage = async (variant, index, imageValue) => {
    if (!variant || !variant.ID) {
      console.error('Cannot set main image: variant missing ID');
      return;
    }
    try {
      // Build payload: set MainImageIndex and MainImage
      const payload = {
        MainImageIndex: index,
        MainImage: imageValue,
        Images: variant.Images || [] // keep existing images
      };
      // Use multipart only if there are files to upload; here we only update JSON
      await axios.put(`${BASE_URL}/api/product_variants/${variant.ID}`, payload);
      // Refresh view product
      if (selectedProduct && selectedProduct.ID) {
        await handleOpenView(selectedProduct.ID);
      }
    } catch (err) {
      console.error('Failed to set main image:', err.response?.data || err.message);
      alert('Failed to set main image');
    }
  };

  // CSV download function
  const downloadCSV = (data, filename = "products.csv", headersOrder = null) => {
    // If headersOrder provided, use it; otherwise derive from first row's keys
    const headersKeys = Array.isArray(headersOrder) && headersOrder.length > 0
      ? headersOrder
      : Object.keys(data[0] || {});

    const headers = headersKeys.map(h => `"${h}"`).join(",");
    const rows = data.map(row =>
      headersKeys.map(key => {
        const cell = row[key];
        const cellStr = (cell ?? "").toString().replace(/"/g, '""');
        return `"${cellStr}"`;
      }).join(",")
    );
    const csv = [headers, ...rows].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = async (exportType = 'filtered') => {
    try {
      let productsToExport = [];

      if (selectedIds.length > 0) {
        // Fetch only selected products
        const fetchPromises = selectedIds.map(id => axios.get(`${BASE_URL}/api/products/${id}`));
        const responses = await Promise.all(fetchPromises);
        productsToExport = responses.map(res => res.data.data || res.data);
      } else if (exportType === 'all') {
        // Fetch all products without filters
        const res = await axios.get(`${BASE_URL}/api/products`, {
          params: {
            limit: 10000, // large limit to get all
          },
        });
        
        productsToExport = res.data.data || [];
      } else {
        // Fetch only filtered products with current filters and sorting (same as fetchProducts)
        const filterParams = Object.entries({
          name: debouncedFilters.name || "",
          code: debouncedFilters.code || "",
          product_type: debouncedFilters.productType !== "" ? debouncedFilters.productType : undefined,
          product_mode: debouncedFilters.productMode !== "" ? debouncedFilters.productMode : undefined,
          category_id: debouncedFilters.categoryID != null ? debouncedFilters.categoryID : undefined,
          subcategory_id: debouncedFilters.subcategoryID != null ? debouncedFilters.subcategoryID : undefined,
          store_id: debouncedFilters.storeID != null ? debouncedFilters.storeID : undefined,
          stock:
            debouncedFilters.stock !== "" && !isNaN(Number(debouncedFilters.stock))
              ? Number(debouncedFilters.stock)
              : undefined,
          minimum_stock:
            debouncedFilters.minimumStock !== "" && !isNaN(Number(debouncedFilters.minimumStock))
              ? Number(debouncedFilters.minimumStock)
              : undefined,
          moq:
            debouncedFilters.moq !== "" && !isNaN(Number(debouncedFilters.moq))
              ? Number(debouncedFilters.moq)
              : undefined,
          lead_time: debouncedFilters.leadTime !== "" ? debouncedFilters.leadTime : undefined,
          note: debouncedFilters.note !== "" ? debouncedFilters.note : undefined,
          status: debouncedFilters.status != null ? debouncedFilters.status : undefined,
          importance: debouncedFilters.importance != null ? debouncedFilters.importance : undefined,
          tag: debouncedFilters.tag !== "" ? debouncedFilters.tag : undefined,
          description: debouncedFilters.description !== "" ? debouncedFilters.description : undefined,
          color: debouncedFilters.color !== "" ? debouncedFilters.color : undefined,
          size: debouncedFilters.size !== "" ? debouncedFilters.size : undefined,
          sku: debouncedFilters.sku !== "" ? debouncedFilters.sku : undefined,
          barcode: debouncedFilters.barcode !== "" ? debouncedFilters.barcode : undefined,
          purchase_cost:
            debouncedFilters.purchaseCost !== "" && !isNaN(Number(debouncedFilters.purchaseCost))
              ? Number(debouncedFilters.purchaseCost)
              : undefined,
          sales_price:
            debouncedFilters.salesPrice !== "" && !isNaN(Number(debouncedFilters.salesPrice))
              ? Number(debouncedFilters.salesPrice)
              : undefined,
          filter: debouncedFilters.filter !== "" && debouncedFilters.filter !== undefined ? debouncedFilters.filter : undefined,
          stock_filter: stockFilter !== 'all' ? stockFilter : undefined,
        }).reduce((acc, [key, value]) => {
          if (value !== "" && value !== undefined && value !== null) {
            acc[key] = value;
          }
          return acc;
        }, {});
        
        // Add sorting params if set
        let sortParams = {};
        if (nameSort) {
          sortParams = { sort_by: 'name', sort_order: nameSort };
        } else if (stockSort) {
          sortParams = { sort_by: 'stock', sort_order: stockSort };
        } else if (leadTimeSort) {
          sortParams = { sort_by: 'leadTime', sort_order: leadTimeSort };
        } else if (purchaseCostSort) {
          sortParams = { sort_by: 'purchaseCost', sort_order: purchaseCostSort };
        } else if (salesPriceSort) {
          sortParams = { sort_by: 'salesPrice', sort_order: salesPriceSort };
        }
        
        const res = await axios.get(`${BASE_URL}/api/products`, {
          params: {
            ...filterParams,
            ...sortParams,
            limit: 10000, // large limit to get all filtered items
          },
        });
        
        productsToExport = res.data.data || [];
      }
      
      // Flatten data for CSV based on exportType (respect visibleColumns only for 'filtered')
      const shouldRespectVisibleColumns = exportType === 'filtered';
      const exportData = productsToExport.map(p => {
        const row = {};
        
        // Product details - include all for 'all' export, or only visible for 'filtered'
        if (!shouldRespectVisibleColumns || visibleColumns.name) row.Name = p.Name;
        if (!shouldRespectVisibleColumns || visibleColumns.code) row.Code = p.Code;
        if (!shouldRespectVisibleColumns || visibleColumns.category) row.Category = p.Category?.Name;
        if (!shouldRespectVisibleColumns || visibleColumns.subcategory) row.Subcategory = p.Subcategory?.Name;
        if (!shouldRespectVisibleColumns || visibleColumns.store) row.Store = p.Store?.Name;
        if (!shouldRespectVisibleColumns || visibleColumns.productType) row['Product Type'] = p.ProductType ?? p.productType ?? 'Finished Goods';
        if (!shouldRespectVisibleColumns || visibleColumns.productMode) row['Product Mode'] = p.ProductMode ?? p.product_mode ?? 'Purchase';
        if (!shouldRespectVisibleColumns || visibleColumns.minimumStock) row['Minimum Stock'] = p.MinimumStock ?? p.minimumStock ?? '';
        if (!shouldRespectVisibleColumns || visibleColumns.moq) row.MOQ = p.MOQ ?? p.MinimumOrderQuantity ?? p.moq ?? '';
        if (!shouldRespectVisibleColumns || visibleColumns.leadTime) row['Lead Time (Days)'] = p.LeadTime ?? p.lead_time ?? p.leadtime ?? '';
        if (!shouldRespectVisibleColumns || visibleColumns.note) row['Internal Notes'] = p.InternalNotes ?? p.internalNotes ?? p.Note ?? p.note ?? p.Notes ?? p.notes ?? '';
        if (!shouldRespectVisibleColumns || visibleColumns.status) row.Status = p.IsActive ? 'Active' : 'Inactive';
        if (!shouldRespectVisibleColumns || visibleColumns.importance) row.Importance = p.Importance ?? 'Normal';
        if (!shouldRespectVisibleColumns || visibleColumns.tag) row.Tag = p.Tag ?? '';
        if (!shouldRespectVisibleColumns || visibleColumns.description) row.Description = p.Description ?? p.description ?? '';
        
        // Add HSN Code, Unit, Tax, GST info
        // row['HSN Code'] = p.HsnSacCode ?? p.HSN ?? p.hsn ?? '';
        // row.Unit = p.Unit?.Name || p.Unit?.name || p.unit_name || '';
        // row.Tax = p.Tax?.Name ?? '';
        // row['GST %'] = p.GstPercent ?? p.gstPercent ?? p.Tax?.Percentage ?? '';
        
        // Variant details - handle multiple variants by joining with semicolons
        if (p.Variants && p.Variants.length > 0) {
          if (!shouldRespectVisibleColumns || visibleColumns.color) {
            row['Color Code'] = p.Variants.map(v => {
              const colorInfo = getColorInfo(v.Color || v.ColorCaption);
              return colorInfo ? colorInfo.name : (v.Color ?? v.ColorCaption ?? 'N/A');
            }).join('; ');
          }
          if (!shouldRespectVisibleColumns || visibleColumns.size) {
            row.Size = p.Variants.map(v => v.Size?.Name || v.Size || 'N/A').join('; ');
          }
          if (!shouldRespectVisibleColumns || visibleColumns.sku) {
            row.SKU = p.Variants.map(v => v.SKU ?? 'N/A').join('; ');
          }
          if (!shouldRespectVisibleColumns || visibleColumns.barcode) {
            row.Barcode = p.Variants.map(v => v.Barcode ?? 'N/A').join('; ');
          }
          if (!shouldRespectVisibleColumns || visibleColumns.purchaseCost) {
            row['Purchase Cost'] = p.Variants.map(v => v.PurchaseCost ?? 0).join('; ');
          }
          if (!shouldRespectVisibleColumns || visibleColumns.salesPrice) {
            row['Sales Price'] = p.Variants.map(v => v.StdSalesPrice ?? v.SalesPrice ?? 0).join('; ');
          }
          if (!shouldRespectVisibleColumns || visibleColumns.stock) {
            row.Stock = p.Variants.map(v => v.Stock ?? v.stock ?? v.quantity ?? v.qty ?? 0).join('; ');
          }
          if (!shouldRespectVisibleColumns || visibleColumns.image) {
            // Handle images
            const allImages = p.Variants.flatMap(v => v.Images || []);
            const imageUrls = allImages.map(img => {
              if (typeof img === 'string' && (img.startsWith('http://') || img.startsWith('https://') || img.startsWith('data:'))) {
                return img;
              } else if (typeof img === 'string' && img.trim() !== '') {
                const normalizedImg = img.replace(/\\/g, '/');
                if (normalizedImg.startsWith('uploads/')) {
                  return `${BASE_URL}/${normalizedImg}`;
                } else {
                  return `${BASE_URL}/uploads/${normalizedImg}`;
                }
              }
              return '';
            }).filter(url => url !== '');
            row.Images = imageUrls.join('; ');
          }
        } else {
          // No variants - empty fields for variant columns
          if (!shouldRespectVisibleColumns || visibleColumns.color) row['Color Code'] = '';
          if (!shouldRespectVisibleColumns || visibleColumns.size) row.Size = '';
          if (!shouldRespectVisibleColumns || visibleColumns.sku) row.SKU = '';
          if (!shouldRespectVisibleColumns || visibleColumns.barcode) row.Barcode = '';
          if (!shouldRespectVisibleColumns || visibleColumns.purchaseCost) row['Purchase Cost'] = '';
          if (!shouldRespectVisibleColumns || visibleColumns.salesPrice) row['Sales Price'] = '';
          if (!shouldRespectVisibleColumns || visibleColumns.stock) row.Stock = '';
          if (!shouldRespectVisibleColumns || visibleColumns.image) row.Images = '';
        }
        
        return row;
      });
      
      // Build ordered headers to match table column order
      const columnOrder = [
        { key: 'Name', visibleKey: 'name' },
        { key: 'Code', visibleKey: 'code' },
        { key: 'Category', visibleKey: 'category' },
        { key: 'Subcategory', visibleKey: 'subcategory' },
        { key: 'Store', visibleKey: 'store' },
        { key: 'Product Type', visibleKey: 'productType' },
        { key: 'Product Mode', visibleKey: 'productMode' },
        { key: 'Stock', visibleKey: 'stock' },
        { key: 'Minimum Stock', visibleKey: 'minimumStock' },
        { key: 'MOQ', visibleKey: 'moq' },
        { key: 'Lead Time (Days)', visibleKey: 'leadTime' },
        { key: 'Internal Notes', visibleKey: 'note' },
        { key: 'Status', visibleKey: 'status' },
        { key: 'Importance', visibleKey: 'importance' },
        { key: 'Tag', visibleKey: 'tag' },
        { key: 'Description', visibleKey: 'description' },
        // Variant columns
        { key: 'Color Code', visibleKey: 'color' },
        { key: 'Size', visibleKey: 'size' },
        { key: 'SKU', visibleKey: 'sku' },
        { key: 'Barcode', visibleKey: 'barcode' },
        { key: 'Purchase Cost', visibleKey: 'purchaseCost' },
        { key: 'Sales Price', visibleKey: 'salesPrice' },
        { key: 'Images', visibleKey: 'image' }
      ];

      const exportHeaders = columnOrder.reduce((arr, col) => {
        if (!shouldRespectVisibleColumns || visibleColumns[col.visibleKey]) arr.push(col.key);
        return arr;
      }, []);

      // Download CSV file with ordered headers
      downloadCSV(exportData, 'products_export.csv', exportHeaders);
      setExportAnchorEl(null); // Close menu after export
    } catch (err) {
      console.error('Error exporting products:', err);
      alert('Failed to export products. Please try again.');
    }
  };

  const downloadTemplateCSV = async () => {
  // Create template CSV headers with asterisks for required fields
  // Note: 'Size', 'Unit', and 'Store' are now auto-created if they don't exist
  const req = new Set(['name','code','hsn code','importance','product type','category','product mode','status']);
    
    // Add asterisks to required fields and dropdown fields
    const headersArr = [
      'Name *', 'Code *', 'HSN Code *', 'Importance *', 'Product Type *', 'Minimum Stock',
      'Category *', 'Subcategory', 'Unit', 'Product Mode *', 'MOQ', 'Store', 'Tag', 'Tax',
  'GST %', 'Description', 'Internal Notes', 'Status *', 'Size',
      'SKU', 'Barcode', 'Purchase Cost', 'Sales Price', 'Stock', 'Lead Time'
    ];
    
    // Join headers for CSV
    const headers = headersArr.join(',');
    
    // Create template data row with example values (Size left empty since it's optional)
    const exampleRow = [
      'Sample Product', 'PRD001', 'HSN123', 'High', 'Single', '10',
      'Electronics', 'Mobiles', 'Piece', 'Purchase', '5', 'Main Store', 'Featured', 'GST',
      '18', 'Product description', 'Internal notes', 'Active', '',
      'SKU001', 'BAR001', '100', '150', '20', '3'
    ];

    // Allowed dropdown options (shown in a separate sheet)
    const importanceOptions = ['Normal', 'High', 'Critical'];
    const productTypeOptions = ['All', 'Finished Goods', 'Semi-Finished Goods', 'Raw Materials'];
    const productModeOptions = ['Purchase', 'Internal Manufacturing', 'Both'];
    const statusOptions = ['Active', 'Inactive'];

    // Dynamically import exceljs to avoid bundling core-js references at dev startup
    let ExcelJS;
    try {
      const mod = await import('exceljs');
      ExcelJS = mod.default || mod;
    } catch (err) {
      console.error('Failed to load exceljs dynamically:', err);
      ExcelJS = null;
    }

    if (ExcelJS) {
      // Use exceljs to create an .xlsx with embedded data validation dropdown lists
      const workbook = new ExcelJS.Workbook();
    const templateSheet = workbook.addWorksheet('Template');

    // Add headers
    templateSheet.addRow(headersArr);
    // Add example row
    templateSheet.addRow(exampleRow);

    // Muted styling for the sample/example row to make it appear lower-opacity
    try {
      const sampleRow = templateSheet.getRow(2);
      const sampleColor = { argb: 'FF9E9E9E' }; // muted gray
      for (let c = 1; c <= headersArr.length; c++) {
        const cell = sampleRow.getCell(c);
        // Keep cell value but make it visually muted
        cell.font = { color: sampleColor, italic: true };
        // Slightly lighter fill so sample row doesn't clash with dropdown highlights
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF9F9F9' }
        };
      }
    } catch (err) {
      // If styling fails for any reason, continue without blocking generation
      console.warn('Could not apply sample row styling:', err);
    }

    // Create a hidden sheet to hold lists for data validation
    const listsSheet = workbook.addWorksheet('Lists', { state: 'hidden' });

    // Fill lists into the Lists sheet
    const importanceRow = ['Importance', ...importanceOptions];
    const productTypeRow = ['Product Type', ...productTypeOptions];
    const productModeRow = ['Product Mode', ...productModeOptions];
    const statusRow = ['Status', ...statusOptions];
    listsSheet.addRow(importanceRow);
    listsSheet.addRow(productTypeRow);
    listsSheet.addRow(productModeRow);
    listsSheet.addRow(statusRow);

    // (Intentionally removed unused rangeForRow helper; using makeRange instead)

    // Since exceljs doesn't expose a simple to-A1 helper in browser build, compute ranges manually
    const makeRange = (rowIndex, count) => {
      const startCol = 2; // B
      const endColIndex = startCol + count - 1;
      const endColLetter = columnNumberToName(endColIndex);
      return `Lists!$B$${rowIndex}:$${endColLetter}$${rowIndex}`;
    };

    // Convert column number to Excel column letters (1 -> A)
    function columnNumberToName(num) {
      let s = '';
      while (num > 0) {
        const mod = (num - 1) % 26;
        s = String.fromCharCode(65 + mod) + s;
        num = Math.floor((num - 1) / 26);
      }
      return s;
    }

    // Compute the ranges for each list row
    const impRange = makeRange(1, importanceOptions.length);
    const ptypeRange = makeRange(2, productTypeOptions.length);
    const pmodeRange = makeRange(3, productModeOptions.length);
    const statusRange = makeRange(4, statusOptions.length);

    // Find column indices of the Template headers to apply validation
    const headerMap = {};
    headersArr.forEach((h, idx) => {
      const cleaned = h.replace(/\*/g, '').trim().toLowerCase().replace(/\s+/g, ' ');
      headerMap[cleaned] = idx + 1;
    });

    const applyValidationToColumn = (colIndex, formula) => {
      // Apply validation from row 2 to row 1000 (arbitrary large number)
      for (let r = 2; r <= 1000; r++) {
        const cell = templateSheet.getCell(r, colIndex);
        cell.dataValidation = {
          type: 'list',
          allowBlank: true,
          showErrorMessage: true,
          formulae: [formula]
        };
        // Highlight the cell to indicate it's a dropdown
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF7F7E8' } // light yellow-beige
        };
      }
    };

    // Apply validations
  const impCol = headerMap['importance'];
  const ptypeCol = headerMap['product type'];
  const pmodeCol = headerMap['product mode'];
  const statusCol = headerMap['status'];

    if (impCol) applyValidationToColumn(impCol, `=${impRange}`);
    if (ptypeCol) applyValidationToColumn(ptypeCol, `=${ptypeRange}`);
    if (pmodeCol) applyValidationToColumn(pmodeCol, `=${pmodeRange}`);
    if (statusCol) applyValidationToColumn(statusCol, `=${statusRange}`);

    // Highlight header cells and make them bold for dropdown columns
    const headerRow = templateSheet.getRow(1);
    [impCol, ptypeCol, pmodeCol, statusCol].forEach((colIndex) => {
      if (!colIndex) return;
      const hdrCell = headerRow.getCell(colIndex);
      hdrCell.font = { bold: true };
      hdrCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFEEE8BF' } // slightly stronger highlight for header
      };
    });

      // Generate file and trigger download in browser
      workbook.xlsx.writeBuffer().then((buffer) => {
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'product_import_template.xlsx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }).catch((err) => {
        console.error('Failed to generate XLSX template with exceljs:', err);
        ExcelJS = null; // fallback handled below
      });
    }

    // Fallback (or if exceljs failed to load) - create a simple XLSX with lists in AllowedValues sheet
    if (!ExcelJS) {
      const headersRow = headersArr;
      const wsData = [headersRow, exampleRow];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const lists = [
        ['Importance', ...importanceOptions],
        ['Product Type', ...productTypeOptions],
        ['Product Mode', ...productModeOptions],
        ['Status', ...statusOptions]
      ];
      const wsLists = XLSX.utils.aoa_to_sheet(lists);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Template');
      XLSX.utils.book_append_sheet(wb, wsLists, 'AllowedValues');
      XLSX.writeFile(wb, 'product_import_template.xlsx');
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      alert('Please select a file to import.');
      return;
    }

    setImportLoading(true);
    try {
      // Read the CSV file
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          let csvText = e.target.result;
          // Remove BOM if present
          if (csvText.charCodeAt(0) === 0xFEFF) csvText = csvText.slice(1);
          console.log('Raw CSV data:', csvText); // Debug log

          if (!csvText.trim()) {
            alert('The CSV file appears to be empty.');
            setImportLoading(false);
            return;
          }

          // Parse CSV - normalize line endings (CRLF, CR, LF) and split into lines
          const rawLines = csvText.split(/\r\n|\n|\r/);
          // Remove lines that are completely empty or contain only delimiters/quotes
          let lines = rawLines.filter(l => {
            if (!l) return false;
            // If line contains only commas/semicolons/quotes/spaces, treat as empty
            const cleaned = l.replace(/[",;\s]/g, '');
            return cleaned.length > 0;
          });

          if (lines.length === 0) {
            alert('The CSV file appears to be empty.');
            setImportLoading(false);
            return;
          }

          // Parse headers - handle CSV that might be exported from Excel 
          // which can use semicolons instead of commas in some regions
          const delimiter = lines[0].includes(';') ? ';' : ',';
          const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
          const dataRows = lines.slice(1);

          console.log('Headers:', headers); // Debug log
          console.log('Data rows:', dataRows.length); // Debug log
          
          // Validate required headers (allow visual marks like '*' or parentheses)
          const headersNormalized = headers.map(h => String(h).toLowerCase().replace(/[^a-z0-9]/g, ''));
          const requiredNormalized = ['name', 'code'];
          const missingNormalized = requiredNormalized.filter(r => !headersNormalized.includes(r));

          if (missingNormalized.length > 0) {
            // Map back to human-readable names for the alert
            const missingHuman = missingNormalized.map(m => m.charAt(0).toUpperCase() + m.slice(1));
            alert(`Missing required headers: ${missingHuman.join(', ')}. Please check your CSV file format.`);
            setImportLoading(false);
            return;
          }

          const objectData = dataRows.map(row => {
            // Handle quoted CSV values that might contain commas within quotes
            let values = [];
            let inQuote = false;
            let currentValue = '';
            
            if (delimiter === ';') {
              values = row.split(delimiter).map(v => v.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
            } else {
              // More complex parsing for comma-delimited CSV with potential quoted values
              for (let i = 0; i < row.length; i++) {
                const char = row[i];
                
                if (char === '"' && (i === 0 || row[i-1] !== '\\')) {
                  inQuote = !inQuote;
                } else if (char === delimiter && !inQuote) {
                  values.push(currentValue.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
                  currentValue = '';
                } else {
                  currentValue += char;
                }
              }
              
              // Add the last value
              values.push(currentValue.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
            }
            
            // Create object from headers and values
            const obj = {};
            headers.forEach((header, index) => {
              obj[header] = values[index] || '';
            });
            return obj;
          });

          console.log('Converted object data:', objectData); // Debug log

          if (objectData.length === 0) {
            alert('The CSV file has headers but no data rows.');
            setImportLoading(false);
            return;
          }
          
          // Basic validation of required fields - collect warnings but don't block preview
          const invalidRows = [];
          objectData.forEach((row, index) => {
            // Only check for completely missing Name or Code
            if (!row.Name || !row.Code) {
              invalidRows.push(`Row ${index + 2}: Missing Name or Code`);
            }
            
            // Validate numeric fields (only if present and not empty)
            if (row['Minimum Stock'] && row['Minimum Stock'].toString().trim() !== '' && isNaN(Number(row['Minimum Stock']))) {
              invalidRows.push(`Row ${index + 2}: Minimum Stock must be a number`);
            }
            if (row['MOQ'] && row['MOQ'].toString().trim() !== '' && isNaN(Number(row['MOQ']))) {
              invalidRows.push(`Row ${index + 2}: MOQ must be a number`);
            }
            if (row['GST %'] && row['GST %'].toString().trim() !== '' && isNaN(Number(row['GST %']))) {
              invalidRows.push(`Row ${index + 2}: GST % must be a number`);
            }
            if (row['Purchase Cost'] && row['Purchase Cost'].toString().trim() !== '' && isNaN(Number(row['Purchase Cost']))) {
              invalidRows.push(`Row ${index + 2}: Purchase Cost must be a number`);
            }
            if (row['Sales Price'] && row['Sales Price'].toString().trim() !== '' && isNaN(Number(row['Sales Price']))) {
              invalidRows.push(`Row ${index + 2}: Sales Price must be a number`);
            }
            if (row['Stock'] && row['Stock'].toString().trim() !== '' && isNaN(Number(row['Stock']))) {
              invalidRows.push(`Row ${index + 2}: Stock must be a number`);
            }
            if (row['Lead Time'] && row['Lead Time'].toString().trim() !== '' && isNaN(Number(row['Lead Time']))) {
              invalidRows.push(`Row ${index + 2}: Lead Time must be a number`);
            }
            
            // Validate Status field if present and not empty
            if (row['Status'] && row['Status'].toString().trim() !== '' && !['Active', 'Inactive'].includes(row['Status'])) {
              invalidRows.push(`Row ${index + 2}: Status must be 'Active' or 'Inactive'`);
            }
          });
          
          // Show warnings but still allow preview - users can fix issues in the editable table
          if (invalidRows.length > 0) {
            const warningMessage = `Found ${invalidRows.length} potential issue(s). You can review and fix them in the preview:\n\n${invalidRows.slice(0, 5).join('\n')}${
              invalidRows.length > 5 ? `\n\n...and ${invalidRows.length - 5} more issues.` : ''
            }`;
            console.warn('CSV validation warnings:', warningMessage);
            // Don't block - let users proceed to preview to fix issues
          }

          // Refresh metadata from backend before showing preview
          console.log("Refreshing metadata before opening preview dialog...");
          
          try {
            // Explicitly fetch dropdown data to ensure it's available
            const metaData = await fetchMeta();
            
            if (!metaData) {
              console.error("Failed to fetch dropdown data for import preview");
              alert("Failed to load dropdown data for import preview. Some dropdown options may not work correctly.");
            } else {
              console.log("Successfully fetched dropdown data for import preview");
            }
            
            // Store the parsed data, select all rows by default, and open the preview dialog
            setImportedData(objectData);
            const allIdx = new Set(objectData.map((_, i) => i));
            setImportSelectedRows(allIdx);
            setImportDialogOpen(false);
            setImportPreviewOpen(true);
            setImportLoading(false);
          } catch (err) {
            console.error("Error preparing import preview:", err);
            alert("Error preparing import preview: " + (err.message || "Unknown error"));
            setImportLoading(false);
          }
          
        } catch (error) {
          console.error('Error importing products:', error);
          alert(`Failed to import products: ${error.message}`);
          setImportLoading(false);
        }
      };

      reader.readAsText(importFile);
    } catch (error) {
      console.error('Error reading file:', error);
      alert('Failed to read the selected file.');
      setImportLoading(false);
    }
  };

  // compute selection status for current page
  const pageIds = products.map(p => p.ID);
  const allPageSelected = pageIds.length > 0 && pageIds.every(id => selectedIds.includes(id));
  const somePageSelected = pageIds.some(id => selectedIds.includes(id)) && !allPageSelected;

  // Validate import data before sending
  const validateImportData = (data) => {
    const errors = [];
    // All required fields based on importRequiredHeaders
    // Note: Unit, Store, Size, and Tax are now auto-created if they don't exist
    const requiredFields = [
      'Name','Code','HSN Code','Importance','Product Type','Category','Product Mode','Status'
    ];
    
    data.forEach((row, index) => {
      const rowErrors = [];
      
      // Helper function to find value in row with or without asterisk
      const getFieldValue = (fieldName) => {
        // Try exact match first
        if (row[fieldName] !== undefined) return row[fieldName];
        // Try with asterisk and space
        if (row[`${fieldName} *`] !== undefined) return row[`${fieldName} *`];
        // Try all keys that match when normalized (remove spaces, asterisks, case-insensitive)
        const normalizedField = fieldName.toLowerCase().replace(/\s+/g, '').replace(/\*/g, '');
        for (const key in row) {
          const normalizedKey = key.toLowerCase().replace(/\s+/g, '').replace(/\*/g, '');
          if (normalizedKey === normalizedField) {
            return row[key];
          }
        }
        return undefined;
      };
      
      // Check required fields - all must be filled
      requiredFields.forEach(field => {
        const value = getFieldValue(field);
        if (!value || value.toString().trim() === '') {
          rowErrors.push(`${field} is mandatory and cannot be empty`);
        }
      });
      
      // Validate numeric fields
      const numericFields = ['Minimum Stock', 'MOQ', 'GST %', 'Purchase Cost', 'Sales Price', 'Stock', 'Lead Time'];
      numericFields.forEach(field => {
        const value = getFieldValue(field);
        if (value && value.toString().trim() !== '' && isNaN(Number(value))) {
          rowErrors.push(`${field} must be a valid number`);
        }
      });
      
      // Validate Status field
      const statusValue = getFieldValue('Status');
      if (statusValue && !['Active', 'Inactive'].includes(statusValue)) {
        rowErrors.push('Status must be "Active" or "Inactive"');
      }
      
      // Validate Importance field
      const importanceValue = getFieldValue('Importance');
      if (importanceValue && !['Normal', 'High', 'Critical'].includes(importanceValue)) {
        rowErrors.push('Importance must be "Normal", "High", or "Critical"');
      }
      
      // Validate Product Type
      const productTypeValue = getFieldValue('Product Type');
      if (productTypeValue && !['All', 'Finished Goods', 'Semi-Finished Goods', 'Raw Materials'].includes(productTypeValue)) {
        rowErrors.push('Product Type must be "All", "Finished Goods", "Semi-Finished Goods", or "Raw Materials"');
      }
      
      // Validate Product Mode
      const productModeValue = getFieldValue('Product Mode');
      if (productModeValue && !['Purchase', 'Internal Manufacturing', 'Both'].includes(productModeValue)) {
        rowErrors.push('Product Mode must be "Purchase", "Internal Manufacturing", or "Both"');
      }
      
      // Category validation - ALLOW new categories to be created during import
      // No validation needed - will be auto-created if it doesn't exist
      
      // Subcategory validation - ALLOW new subcategories to be created during import
      // No validation needed - will be auto-created if it doesn't exist
      
      // Size validation - ALLOW new sizes to be created during import
      // No validation needed - will be auto-created if it doesn't exist
      
      // Unit validation - ALLOW new units to be created during import
      // No validation needed - will be auto-created if it doesn't exist
      
      // Store validation - ALLOW new stores to be created during import
      // No validation needed - will be auto-created if it doesn't exist
      
      // Tax validation - ALLOW new taxes to be created during import
      // No validation needed - will be auto-created if it doesn't exist
      
// HSN Code: will be auto-created during import if it doesn't exist in the system.
		// No validation error is added here; the backend will create missing HSN master records as needed.
		// (Tax will also be auto-created above if provided in the import row.)
      
      if (rowErrors.length > 0) {
        errors.push({
          row: index + 1,
          data: row,
          errors: rowErrors
        });
      }
    });
    
    return errors;
  };

  // Handle final import after preview/edit
  const handleFinalImport = async () => {
    setImportLoading(true);
    try {
      // Send only selected rows to backend as JSON
      const selectedArray = importedData.filter((_, idx) => importSelectedRows.has(idx));
      if (selectedArray.length === 0) {
        alert('No rows selected for import. Please select at least one row.');
        setImportLoading(false);
        return;
      }

      // Validate data before sending
      const validationErrors = validateImportData(selectedArray);
      if (validationErrors.length > 0) {
        // Map validation errors to specific preview cells for visual highlighting
        try {
          setImportFieldErrors(buildFieldErrorMapFromErrors(validationErrors, selectedArray));
        } catch (e) {
          console.error('Failed to build field error map from validation errors', e);
        }
        // Show validation errors in report dialog
        setImportReport({
          type: 'validation_error',
          totalRows: selectedArray.length,
          successCount: 0,
          errorCount: validationErrors.length,
          errors: validationErrors,
          successes: []
        });
        setImportReportOpen(true);
        setImportLoading(false);
        return;
      }

      // Normalize field names before sending to backend
      // Remove asterisks and extra spaces from field names
      const normalizedArray = selectedArray.map(row => {
        const normalizedRow = {};
        Object.keys(row).forEach(key => {
          // Remove asterisks and trim spaces
          const normalizedKey = key.replace(/\s*\*\s*/g, '').trim();
          normalizedRow[normalizedKey] = row[key];
        });
        return normalizedRow;
      });

      console.log('Sending import data (selected rows):', normalizedArray); // Debug log

      const response = await axios.post(`${BASE_URL}/api/products/import`, normalizedArray, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Import response:', response.data); // Debug log
      
      // Parse backend errors which come as strings like "Row 1: Error message"
      // Convert them to the format expected by the import report dialog
      const parsedErrors = [];
      if (response.data.errors && Array.isArray(response.data.errors)) {
        response.data.errors.forEach(errorStr => {
          // Try to parse "Row X: Error message" format
          const match = errorStr.match(/^Row (\d+):\s*(.+)$/);
          if (match) {
            const rowNum = parseInt(match[1], 10);
            const errorMessage = match[2];
            const rowIndex = rowNum - 1; // Convert to 0-based index
            
            // Get the row data if available
            const rowData = normalizedArray[rowIndex] || {};
            
            parsedErrors.push({
              row: rowNum,
              data: rowData,
              productName: rowData.Name || 'N/A',
              code: rowData.Code || 'N/A',
              errors: [errorMessage]
            });
          } else {
            // If format doesn't match, add as generic error
            parsedErrors.push({
              row: 'N/A',
              data: {},
              productName: 'N/A',
              code: 'N/A',
              errors: [errorStr]
            });
          }
        });
      }
      
      // Prepare import report
      const report = {
        type: 'import_complete',
        totalRows: selectedArray.length,
        successCount: response.data.imported || 0,
        errorCount: parsedErrors.length,
        errors: parsedErrors,
        successes: response.data.successes || [],
        skipped: response.data.skipped || 0
      };

      // Map backend errors to preview cells so users can edit problematic fields
      try {
        setImportFieldErrors(buildFieldErrorMapFromErrors(parsedErrors, normalizedArray));
      } catch (e) {
        console.error('Failed to build field error map from backend errors', e);
      }
      
      // Close preview dialog
      setImportPreviewOpen(false);
      
      // Only clear import data if there are no errors (fully successful import)
      // This allows users to go back and fix errors if needed
      if (parsedErrors.length === 0) {
        setImportFile(null);
        setImportedData([]);
        setImportSelectedRows(new Set());
        // Clear any previously recorded field errors
        setImportFieldErrors({});
      }
      
      // Show the import report
      setImportReport(report);
      setImportReportOpen(true);
      
      // Only refresh the product list if some products were successfully imported
      if (response.data.imported > 0) {
        // Reset filters and pagination to show newly imported products
        setPage(0);
        setFilters(defaultFilters);
        setInputFilters({ 
          name: "", code: "", productType: "", productMode: "", stock: "", moq: "", 
          leadTime: "", note: "", color: "", size: "", sku: "", 
          barcode: "", purchaseCost: "", salesPrice: "" 
        });
        
        // Reset sorting
        setNameSort(null);
        setStockSort(null);
        setLeadTimeSort(null);
        setPurchaseCostSort(null);
        setSalesPriceSort(null);
        
        // Reset stock filter
        setStockFilter('all');
        
        // IMPORTANT: Directly update debouncedFilters to bypass the 500ms debounce delay
        // This ensures products are fetched immediately after import
        console.log('Resetting filters and triggering product refresh after successful import...'); // Debug log
        setDebouncedFilters({...defaultFilters});
        
        // Force refresh by incrementing the forceRefresh counter
        // This will trigger the useEffect to fetch products immediately
        setForceRefresh(prev => {
          const newValue = prev + 1;
          console.log('Force refresh triggered, new value:', newValue); // Debug log
          return newValue;
        });
        
        // Directly fetch products to ensure immediate refresh after import
        setTimeout(() => {
          console.log('Explicitly fetching products after import...');
          fetchProducts();
        }, 300);
      }
    } catch (error) {
      console.error('Error importing products:', error);
      console.error('Error response:', error.response); // Additional debug log
      
      // Parse error details from response
      let errorMessage = 'Unknown server error';
      let detailedErrors = [];
      
      if (error.response?.data) {
        // Check for various error formats
        if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
        
        // Check if there are specific row errors
        if (error.response.data.errors && Array.isArray(error.response.data.errors)) {
          error.response.data.errors.forEach(errorStr => {
            // Parse "Row X: Error message" format
            const match = errorStr.match(/^Row (\d+):\s*(.+)$/);
            if (match) {
              const rowNum = parseInt(match[1], 10);
              const errorDetails = match[2];
              detailedErrors.push({
                row: rowNum,
                productName: 'N/A',
                code: 'N/A',
                errors: [errorDetails]
              });
            } else {
              detailedErrors.push({
                row: 'N/A',
                productName: 'N/A',
                code: 'N/A',
                errors: [errorStr]
              });
            }
          });
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Show error in report dialog
      setImportReport({
        type: 'import_failed',
        totalRows: importedData.filter((_, idx) => importSelectedRows.has(idx)).length,
        successCount: 0,
        errorCount: detailedErrors.length > 0 ? detailedErrors.length : 1,
        errors: detailedErrors.length > 0 ? detailedErrors : [{ 
          row: 'Server Error',
          productName: 'N/A',
          code: 'N/A',
          errors: [errorMessage]
        }],
        successes: []
      });
      setImportReportOpen(true);
    } finally {
      setImportLoading(false);
    }
  };

  // Debug logs for direct API check
  const checkAPI = async () => {
    try {
      console.log('Direct API check - fetching all products without filters');
      setLoading(true);
      
      const res = await axios.get(`${BASE_URL}/api/products`, {
        params: {
          page: 1,
          limit: 50,
        },
        timeout: 15000
      });
      
      console.log('Direct API check - Status:', res.status);
      console.log('Direct API check - Response:', res.data);

      // Normalize API response: accept null `data` as empty list
      const apiProducts = (() => {
        if (!res || !res.data) return [];
        if (Array.isArray(res.data.data)) return res.data.data;
        if (res.data.data == null) return [];
        if (Array.isArray(res.data)) return res.data;
        return [];
      })();

      console.log('Direct API check - Products found:', apiProducts.length);
      setProducts(apiProducts);
      setTotalItems(res?.data?.total || 0);
      setTotalCost(res?.data?.totalCost || 0);
    } catch (err) {
      console.error("Error in direct API check:", err);
      setProducts([]);
      alert('API check failed: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };
  // Required headers (normalized) for import preview marking
  const importRequiredHeaders = new Set([
    'name',
    'code',
    'hsn',
    'minimumstock',
    'category',
    'unit',
    'store',
    'tax',
    'gst',
    'status'
  ]);

  const normalizeHeaderKey = (h) => {
    if (!h && h !== 0) return '';
    return String(h).toLowerCase().replace(/[^a-z0-9]/g, '');
  };

  // Full template headers for display in Import dialog
  const importTemplateHeaders = [
    'Name', 'Code', 'HSN Code', 'Importance', 'Product Type', 'Minimum Stock',
    'Category', 'Subcategory', 'Unit', 'Product Mode', 'MOQ', 'Store', 'Tag', 'Tax',
    'GST %', 'Description', 'Internal Notes', 'Status', 'Size',
    'SKU', 'Barcode', 'Purchase Cost', 'Sales Price', 'Stock', 'Lead Time'
  ];

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">📦 Product Master</Typography>
        <Box display="flex" gap={2} alignItems="center">
          {loading && (
            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
              <CircularProgress size={16} sx={{ mr: 1 }} />
              Loading...
            </Typography>
          )}
          <Tooltip title="Refresh Products">
            <Button 
              variant="outlined" 
              color="primary" 
              startIcon={<Refresh />}
              onClick={() => {
                console.log("Manual refresh triggered");
                // Clear any previous errors
                setApiError(null);
                fetchProducts();
              }}
              disabled={loading}
            >
              Refresh
            </Button>
          </Tooltip>
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={checkAPI}
            disabled={loading}
          >
            Check API
          </Button>
        </Box>
      </Box>

      {/* Debug message stays */}
      {console.log('Display prefs anchor:', displayPrefsAnchor, 'Open:', Boolean(displayPrefsAnchor))}
      
      <DisplayPreferences 
        columns={visibleColumns}
        setColumns={setVisibleColumns}
        anchorEl={displayPrefsAnchor}
        open={Boolean(displayPrefsAnchor)}
        onClose={handleCloseDisplayPrefs}
      />
          {/* Confirm delete dialog */}
          <ConfirmDialog
            open={confirmOpen}
            title={"Delete product"}
            message={(() => {
              // If no specific id, show generic message
              if (!confirmTargetId) return 'Are you sure you want to delete this product? This action cannot be undone.';

              // Try to find product in current list by common id/code fields
              const target = products.find(p => {
                // compare both numeric and string forms to be safe
                const candidates = [p.ID, p.id, p.Code, p.code, p.SKU, p.sku];
                return candidates.some(c => c !== undefined && c !== null && (c === confirmTargetId || String(c) === String(confirmTargetId)));
              });

              const name = target?.Name ?? target?.name ?? target?.ProductName ?? 'this product';
              const code = target?.Code ?? target?.code ?? target?.SKU ?? target?.sku ?? '';

              if (target) {
                return `Are you sure you want to delete product "${name}"${code ? ` (code: ${code})` : ''}? This action cannot be undone.`;
              }

              // Fallback to showing id if product not found in list
              return `Are you sure you want to delete product #${confirmTargetId}? This action cannot be undone.`;
            })()}
            onCancel={closeDeleteConfirm}
            onConfirm={handleConfirmDelete}
          />

          {/* Error dialog for delete failures */}
          <Dialog open={errorDialogOpen} onClose={() => setErrorDialogOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ bgcolor: '#f44336', color: 'white', fontWeight: 'bold' }}>
              {errorTitle}
            </DialogTitle>
            <DialogContent sx={{ pt: 2 }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {errorMessage}
              </Typography>
              {errorTitle.includes('Cannot Delete') && (
                <Box sx={{ bgcolor: '#fff3cd', p: 2, borderRadius: 1, mt: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    What you can do:
                  </Typography>
                  <Typography component="div" variant="body2" sx={{ ml: 1 }}>
                    <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
                      <li>Remove this product from any related inventory or stock records like Quotation, CRM etc</li>
                      <li>After removing references, try deleting the product again</li>
                    </ul>
                  </Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setErrorDialogOpen(false)} variant="contained" color="primary">
                OK
              </Button>
            </DialogActions>
          </Dialog>

          {/* Product view dialog (read-only) */}
  <Dialog open={viewOpen} onClose={handleCloseView} maxWidth="xl" fullWidth>
        <DialogTitle className="product-header">
          <Typography component="h2" variant="h6" className="product-title">Product Details (Read-only)</Typography>
          <Typography 
            component="span" 
            variant="subtitle2"
            className={`product-status ${selectedProduct?.IsActive || selectedProduct?.isActive ? 'active' : 'inactive'}`}
          >
            Status: {selectedProduct?.IsActive || selectedProduct?.isActive ? 'Active' : 'Inactive'}
          </Typography>
        </DialogTitle>
        <DialogContent dividers className="product-details-container" sx={{
          backgroundColor: 'white',
          color: 'black',
          '& .MuiTypography-root': { color: 'black' },
          '& table': { backgroundColor: 'transparent' }
        }}>
          {viewLoading ? (
            <Box className="loading-state" display="flex" justifyContent="center" p={2}><CircularProgress /></Box>
          ) : selectedProduct ? (
            <Box className="product-form">
              <Box className="form-grid">
                <Box className="form-field col-60">
                  <label className="field-label">Product Name</label>
                  <input 
                    type="text"
                    className="field-input multiline"
                    value={selectedProduct.Name ?? ''}
                    disabled
                    readOnly
                    title={selectedProduct.Name ?? ''}
                  />
                </Box>
                <Box className="form-field col-20">
                  <label className="field-label">Code</label>
                  <input 
                    type="text"
                    className="field-input"
                    value={selectedProduct.Code ?? ''}
                    disabled
                    readOnly
                  />
                </Box>
                <Box className="form-field col-20">
                  <label className="field-label">HSN/SAC Code</label>
                  <input 
                    type="text"
                    className="field-input"
                    value={selectedProduct.HsnSacCode ?? selectedProduct.HSN ?? selectedProduct.hsn ?? ''}
                    disabled
                    readOnly
                  />
                </Box>
              </Box>

              <Box className="form-grid">
                <Box className="form-field col-20">
                  <label className="field-label">Importance</label>
                  <input 
                    type="text"
                    className="field-input"
                    value={selectedProduct.Importance ?? selectedProduct.importance ?? ''}
                    disabled
                    readOnly
                  />
                </Box>
                <Box className="form-field col-20">
                  <label className="field-label">Minimum Stock</label>
                  <input 
                    type="text"
                    className="field-input"
                    value={selectedProduct.MinimumStock ?? selectedProduct.minimumStock ?? ''}
                    disabled
                    readOnly
                  />
                </Box>
                <Box className="form-field col-60">
                  <label className="field-label">Category</label>
                  <input 
                    type="text"
                    className="field-input multiline"
                    value={selectedProduct.Category?.Name ?? ''}
                    disabled
                    readOnly
                    title={selectedProduct.Category?.Name ?? ''}
                  />
                </Box>
              </Box>

              <Box className="form-grid">
                <Box className="form-field col-40">
                  <label className="field-label">Subcategory</label>
                  <input 
                    type="text"
                    className="field-input"
                    value={selectedProduct.Subcategory?.Name ?? ''}
                    disabled
                    readOnly
                  />
                </Box>
                <Box className="form-field col-20">
                  <label className="field-label">Unit</label>
                  <input 
                    type="text"
                    className="field-input"
                    value={selectedProduct.Unit?.Name || selectedProduct.Unit?.name || selectedProduct.unit_name || ''}
                    disabled
                    readOnly
                  />
                </Box>
                <Box className="form-field col-20">
                  <label className="field-label">Store</label>
                  <input 
                    type="text"
                    className="field-input"
                    value={selectedProduct.Store?.Name ?? ''}
                    disabled
                    readOnly
                  />
                </Box>
                <Box className="form-field col-20">
                  <label className="field-label">Product Mode</label>
                  <input 
                    type="text"
                    className="field-input"
                    value={selectedProduct.ProductMode ?? selectedProduct.product_mode ?? ''}
                    disabled
                    readOnly
                  />
                </Box>
              </Box>

              <Box className="form-grid">
                <Box className="form-field col-20">
                  <label className="field-label">Product Type</label>
                  <input 
                    type="text"
                    className="field-input"
                    value={selectedProduct.ProductType ?? selectedProduct.productType ?? ''}
                    disabled
                    readOnly
                  />
                </Box>
                <Box className="form-field col-20">
                  <label className="field-label">MOQ</label>
                  <input 
                    type="text"
                    className="field-input"
                    value={selectedProduct.MOQ ?? selectedProduct.MinimumOrderQuantity ?? selectedProduct.moq ?? selectedProduct.Moq ?? ''}
                    disabled
                    readOnly
                  />
                </Box>
                <Box className="form-field col-20">
                  <label className="field-label">Tax</label>
                  <input 
                    type="text"
                    className="field-input"
                    value={selectedProduct.Tax?.Name ?? selectedProduct.Tax?.name ?? (selectedProduct.tax || '')}
                    disabled
                    readOnly
                  />
                </Box>
                <Box className="form-field col-20">
                  <label className="field-label">GST %</label>
                  <input 
                    type="text"
                    className="field-input"
                    value={selectedProduct.GstPercent ?? selectedProduct.gstPercent ?? ''}
                    disabled
                    readOnly
                  />
                </Box>
              </Box>

              <Box className="form-grid">
                <Box className="form-field col-100">
                  <label className="field-label">Tags</label>
                  <input 
                    type="text"
                    className="field-input multiline"
                    value={(() => {
                      if (Array.isArray(selectedProduct.Tags) && selectedProduct.Tags.length > 0) {
                        return selectedProduct.Tags.map(tag => tag?.Name || tag?.name || '').filter(Boolean).join(', ');
                      }
                      return selectedProduct.tag || selectedProduct.Tag || '';
                    })()}
                    disabled
                    readOnly
                    placeholder="No tags assigned"
                  />
                </Box>
              </Box>

              <Box className="form-grid">
                <Box className="form-field col-60">
                  <label className="field-label">Description</label>
                  <textarea 
                    className="field-input multiline"
                    value={selectedProduct.Description ?? selectedProduct.description ?? ''}
                    disabled
                    readOnly
                    rows="3"
                  />
                </Box>
                <Box className="form-field col-40">
                  <label className="field-label">Internal Notes</label>
                  <textarea 
                    className="field-input multiline"
                    value={selectedProduct.InternalNotes ?? selectedProduct.internalNotes ?? ''}
                    disabled
                    readOnly
                    rows="3"
                  />
                </Box>
              </Box>
              <Box className="variants-section">
                <Box className="section-header">
                  <Typography variant="subtitle2" className="section-title">Variants</Typography>
                  {Array.isArray(selectedProduct.Variants) && selectedProduct.Variants.length > 0 && (
                    <Box className="variant-count">{selectedProduct.Variants.length} items</Box>
                  )}
                </Box>
              {Array.isArray(selectedProduct.Variants) && selectedProduct.Variants.length > 0 ? (
                <Table size="small" className="variants-table">
                  <TableHead>
                    <TableRow>
                      <TableCell align="center" sx={{fontWeight: 'bold'}}>Color</TableCell>
                      <TableCell align="center" sx={{fontWeight: 'bold'}}>Size</TableCell>
                      <TableCell align="center" sx={{fontWeight: 'bold'}}>SKU</TableCell>
                      <TableCell align="center" sx={{fontWeight: 'bold'}}>Barcode</TableCell>
                      <TableCell align="center" sx={{fontWeight: 'bold'}}>Purchase Cost</TableCell>
                      <TableCell align="center" sx={{fontWeight: 'bold'}}>Sales Price</TableCell>
                      <TableCell align="center" sx={{fontWeight: 'bold'}}>Stock</TableCell>
                      <TableCell align="center" sx={{fontWeight: 'bold'}}>Lead Time</TableCell>
                      <TableCell align="center" sx={{fontWeight: 'bold'}}>Images</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedProduct.Variants.map((v, i) => {
                      const colorInfo = getColorInfo(v.Color || v.ColorCaption);
                      return (
                      <TableRow key={v.ID ?? v.SKU ?? i}>
                        <TableCell align="center">
                          <Box display="flex" alignItems="center" gap={1}>
                            {colorInfo && (
                              <>
                                <Box
                                  sx={{
                                    width: 24,
                                    height: 24,
                                    backgroundColor: colorInfo.hex,
                                    border: '1px solid #ccc',
                                    borderRadius: '4px',
                                    flexShrink: 0
                                  }}
                                  title={`Hex: ${colorInfo.hex}`}
                                />
                                <Typography variant="body2">{colorInfo.name}</Typography>
                              </>
                            )}
                            {!colorInfo && (
                              <Typography variant="body2">{v.Color ?? v.ColorCaption ?? ''}</Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="center">{v.Size ?? ''}</TableCell>
                        <TableCell align="center">{v.SKU ?? ''}</TableCell>
                        <TableCell align="center">{v.Barcode ?? ''}</TableCell>
                        <TableCell align="center">{v.PurchaseCost != null ? String(v.PurchaseCost) : ''}</TableCell>
                        <TableCell align="center">{v.SalesPrice != null ? String(v.SalesPrice) : ''}</TableCell>
                        <TableCell align="center">{v.stock != null ? String(v.stock) : ''}</TableCell>
                        <TableCell align="center">{v.LeadTime ?? ''}</TableCell>
                        <TableCell align="center" className="images-cell">
                          <Box display="flex" flexWrap="wrap" gap={1} alignItems="center" justifyContent="center">
                            {(Array.isArray(v.Images) && v.Images.length > 0) ? v.Images.map((img, idx) => {
                              const imgSrc = normalizeImageUrl(img) || 'https://via.placeholder.com/60?text=No+Image';
                              // Determine whether this image is the main image for this variant
                              const isMain = (typeof v.MainImageIndex === 'number' && v.MainImageIndex === idx) || (v.MainImage && v.MainImage === img);
                              return (
                                <Box 
                                  key={idx} 
                                  className="image-container"
                                  sx={{ position: 'relative' }}
                                  onMouseEnter={() => handleDetailsImageMouseEnter(imgSrc)}
                                  onMouseLeave={handleDetailsImageMouseLeave}
                                >
                                  <img
                                    src={imgSrc}
                                    alt={`img-${idx}`}
                                    onClick={(e) => handleDetailsImageClick(e, imgSrc)}
                                    style={{
                                      width: 60,
                                      height: 60,
                                      objectFit: 'cover',
                                      borderRadius: 4,
                                      border: '1px solid #ccc',
                                      cursor: 'pointer',
                                      transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                                    }}
                                    onMouseOver={(e) => {
                                      e.currentTarget.style.transform = 'scale(1.1)';
                                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                                    }}
                                    onMouseOut={(e) => {
                                      e.currentTarget.style.transform = 'scale(1)';
                                      e.currentTarget.style.boxShadow = 'none';
                                    }}
                                    onError={(e) => { e.target.src = 'https://via.placeholder.com/60?text=No+Image'; }}
                                    title="Click to open in new tab, hover to preview"
                                  />
                                  {/* Non-interactive main-image indicator for read-only product view */}
                                  {isMain && (
                                    <Box className="main-image-badge" title="Main image">
                                      <StarIcon fontSize="small" color="warning" />
                                    </Box>
                                  )}
                                </Box>
                              );
                            }) : <Typography variant="caption" color="textSecondary" className="no-images">No images</Typography>}
                          </Box>
                        </TableCell>
                      </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <Box className="no-variants">
                  <Typography color="textSecondary">No variants available for this product.</Typography>
                </Box>
              )}
              </Box>

              <Divider />
            </Box>
          ) : (
            <Typography color="textSecondary">No product data available.</Typography>
          )}
        </DialogContent>
        <DialogActions className="dialog-actions">
          <Button onClick={handleCloseView} className="btn-secondary">Close</Button>
          <Button 
            onClick={() => {
              handleCloseView();
              navigate(`/products/${selectedProduct?.ID}/edit`);
            }} 
            variant="contained" 
            color="primary"
          >
            Edit Product
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Preview Dialog for Product Details */}
      <Dialog
        className="image-preview-dialog"
        open={!!detailsPreviewImage}
        onClose={handleDetailsClosePreview}
        maxWidth="md"
        fullWidth
      >
        <DialogContent className="preview-content">
          {detailsPreviewImage && (
            <img
              src={detailsPreviewImage}
              alt="Preview"
              className="preview-image"
              onClick={() => window.open(detailsPreviewImage, '_blank', 'noopener,noreferrer')}
              title="Click to open in new tab"
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDetailsClosePreview} className="preview-button">
            Close
          </Button>
          <Button
            onClick={() => window.open(detailsPreviewImage, '_blank', 'noopener,noreferrer')}
            className="preview-button"
          >
            Open in New Tab
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import dialog */}
      <Dialog open={importDialogOpen} onClose={() => {
        setImportDialogOpen(false);
        setImportFile(null);
        setImportLoading(false);
      }} maxWidth="md" fullWidth>
        <DialogTitle>Import Products</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Instructions:</Typography>
            <ul style={{ marginTop: 0, marginBottom: 8, paddingLeft: '1.25rem' }}>
              <li><Typography component="span" variant="body2">Download the template Excel file below</Typography></li>
              <li><Typography component="span" variant="body2">Fill in your user data following the template format</Typography></li>
              <li><Typography component="span" variant="body2">Required fields are marked with asterisk (*)</Typography></li>
              <li><Typography component="span" variant="body2">Unit, Store, Size, and Tax will be auto-created if they don't exist</Typography></li>
              <li><Typography component="span" variant="body2">You can edit the info after upload the CSV file</Typography></li>
              <li><Typography component="span" variant="body2" color="error">Upload the completed CSV file</Typography></li>
            </ul>
          </Box>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Import products from a CSV file. Make sure you have downloaded the template and filled it correctly.
          </Typography>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setImportFile(e.target.files[0])}
            style={{ marginBottom: '16px' }}
          />
          {importFile && (
            <Typography variant="body2" sx={{ mb: 2 }}>
              Selected file: {importFile.name}
            </Typography>
          )}
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="primary" sx={{ cursor: 'pointer' }} 
              onClick={() => downloadTemplateCSV()}>
              ↓ Download template Excel file
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleImport}
            disabled={!importFile || importLoading}
          >
            {importLoading ? <CircularProgress size={20} /> : 'Import'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Updated summary box to include status, stock, and importance filter dropdowns */}
      <Box sx={{ mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, boxShadow: 1 }}>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item xs="auto">
            <Typography variant="body1">
              Total Products: {totalItems}<br />
              Total Cost: ₹{totalCost.toFixed(2)}
            </Typography>
          </Grid>
          <Grid item xs="auto" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <div className="search-wrapper">
              <input
                className="custom-search"
                placeholder="Search"
                value={commonSearch}
                onChange={(e) => setCommonSearch(e.target.value)}
              />
            </div>
            <Box display="flex" alignItems="center" gap={1} ml={2}>
              <Button
                variant="outlined"
                startIcon={<GetApp />}
                onClick={() => setImportDialogOpen(true)}
                sx={{ minWidth: 'auto', px: 2 }}
              >
                Import
              </Button>
              <Button
                variant="outlined"
                startIcon={<Publish />}
                onClick={(e) => setExportAnchorEl(e.currentTarget)}
                sx={{ minWidth: 'auto', px: 2 }}
              >
                Export
              </Button>
            </Box>
            {/* Keep quick stock filter here as a compact select for convenience */}
          </Grid>
        </Grid>
      </Box>

      <Paper>
        {apiError && (
          <Box sx={{ p: 2, mb: 2, bgcolor: '#ffebee', color: '#d32f2f', borderRadius: '4px' }}>
            <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center' }}>
              Error: {apiError}
              <Button 
                variant="outlined" 
                color="error" 
                size="small" 
                sx={{ ml: 2 }}
                onClick={() => {
                  setApiError(null);
                  checkAPI();
                }}
              >
                Try Again
              </Button>
            </Typography>
          </Box>
        )}
        
        <TableContainer sx={{ position: 'relative' }}>
          {/* Optional small corner spinner overlay (does not remount inputs) */}
          {loading && (
            <Box position="absolute" top={4} right={8} zIndex={2}>
              <CircularProgress size={18} />
            </Box>
          )}
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 60 }}>
                  <Checkbox
                    size="small"
                    checked={allPageSelected}
                    indeterminate={somePageSelected}
                    onChange={toggleSelectAllOnPage}
                  />
                </TableCell>
                <TableCell className="sl-header" sx={{fontWeight : "bold"}}>SL</TableCell>
                {visibleColumns.name && (
                  <TableCell sx={{fontWeight : "bold", minWidth: 200}}>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      Name
                      <IconButton
                        size="small"
                        onClick={() => handleNameSort('asc')}
                        color={nameSort === 'asc' ? 'primary' : 'default'}
                        sx={{ p: 0.25 }}
                      >
                        <ArrowUpward
                          fontSize="inherit"
                          sx={{ color: nameSort === 'asc' ? 'primary.main' : 'inherit', opacity: nameSort === 'asc' ? 1 : 0.5 }}
                        />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleNameSort('desc')}
                        color={nameSort === 'desc' ? 'primary' : 'default'}
                        sx={{ p: 0.25 }}
                      >
                        <ArrowDownward
                          fontSize="inherit"
                          sx={{ color: stockSort === 'desc' ? 'primary.main' : 'inherit', opacity: stockSort === 'desc' ? 1 : 0.5 }}
                        />
                      </IconButton>
                    </Box>
                  </TableCell>
                )}
                {visibleColumns.code && <TableCell sx={{fontWeight : "bold", minWidth: 200}}>Code</TableCell>}
                {visibleColumns.category && <TableCell sx={{fontWeight : "bold", minWidth: 200}}>Category</TableCell>}
                {visibleColumns.subcategory && <TableCell sx={{fontWeight : "bold", minWidth: 200}}>Subcategory</TableCell>}
                {visibleColumns.store && <TableCell sx={{fontWeight : "bold", minWidth: 200}}>Store</TableCell>}
                {visibleColumns.productType && <TableCell sx={{fontWeight : "bold", minWidth: 200}}>Product Type</TableCell>}
                {visibleColumns.productMode && <TableCell sx={{fontWeight : "bold", minWidth: 200}}>Product Mode</TableCell>}
                {visibleColumns.stock && (
                  <TableCell align="center" sx={{fontWeight : "bold", minWidth: 150}}>
                    <Box display="flex" justifyContent="center" alignItems="center" gap={0.5}>
                      Stock
                      <IconButton
                        size="small"
                        onClick={() => handleStockSort('asc')}
                        color={stockSort === 'asc' ? 'primary' : 'default'}
                        sx={{ p: 0.25 }}
                        aria-label="Sort stock ascending"
                      >
                        <ArrowUpward
                          fontSize="inherit"
                          sx={{ color: stockSort === 'asc' ? 'primary.main' : 'inherit', opacity: stockSort === 'asc' ? 1 : 0.5 }}
                        />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleStockSort('desc')}
                        color={stockSort === 'desc' ? 'primary' : 'default'}
                        sx={{ p: 0.25 }}
                        aria-label="Sort stock descending"
                      >
                        <ArrowDownward
                          fontSize="inherit"
                          sx={{ color: stockSort === 'desc' ? 'primary.main' : 'inherit', opacity: stockSort === 'desc' ? 1 : 0.5 }}
                        />
                      </IconButton>
                    </Box>
                  </TableCell>
                )}
                {visibleColumns.minimumStock && <TableCell align="center" sx={{fontWeight : "bold", minWidth: 150}}>Minimum Stock</TableCell>}
                {visibleColumns.moq && <TableCell align="center" sx={{fontWeight : "bold", minWidth: 150}}>MOQ</TableCell>}
                {visibleColumns.leadTime && (
                  <TableCell align="center" sx={{fontWeight : "bold", minWidth: 200}}>
                    <Box display="flex" justifyContent="center" alignItems="center" gap={0.5}>
                      Lead Time
                      <IconButton
                        size="small"
                        onClick={() => handleLeadTimeSort('asc')}
                        color={leadTimeSort === 'asc' ? 'primary' : 'default'}
                        sx={{ p: 0.25 }}
                        aria-label="Sort lead time ascending"
                      >
                        <ArrowUpward
                          fontSize="inherit"
                          sx={{ color: leadTimeSort === 'asc' ? 'primary.main' : 'inherit', opacity: leadTimeSort === 'asc' ? 1 : 0.5 }}
                        />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleLeadTimeSort('desc')}
                        color={leadTimeSort === 'desc' ? 'primary' : 'default'}
                        sx={{ p: 0.25 }}
                        aria-label="Sort lead time descending"
                      >
                        <ArrowDownward
                          fontSize="inherit"
                          sx={{ color: leadTimeSort === 'desc' ? 'primary.main' : 'inherit', opacity: leadTimeSort === 'desc' ? 1 : 0.5 }}
                        />
                      </IconButton>
                    </Box>
                  </TableCell>
                )}
                {visibleColumns.note && <TableCell sx={{fontWeight : "bold", minWidth: 150}}>Note</TableCell>}
                {visibleColumns.status && <TableCell sx={{fontWeight : "bold", minWidth: 150}}>Status</TableCell>}
                {visibleColumns.importance && <TableCell sx={{fontWeight : "bold", minWidth: 150}}>Importance</TableCell>}
                {visibleColumns.tag && <TableCell sx={{fontWeight : "bold", minWidth: 200}}>Tag</TableCell>}
                {visibleColumns.description && <TableCell sx={{fontWeight : "bold", minWidth: 200}}>Description</TableCell>}
                {/* Variant columns */}
                {visibleColumns.color && <TableCell align="center" sx={{fontWeight : "bold", minWidth: 200}}>Color Code</TableCell>}
                {visibleColumns.size && <TableCell align="center" sx={{fontWeight : "bold", minWidth: 200}}>Size</TableCell>}
                {visibleColumns.sku && <TableCell align="center" sx={{fontWeight : "bold", minWidth: 200}}>SKU</TableCell>}
                {visibleColumns.barcode && <TableCell sx={{fontWeight : "bold", minWidth: 200}}>Barcode</TableCell>}
                {visibleColumns.purchaseCost && (
                  <TableCell align="center" sx={{fontWeight : "bold", minWidth: 200}}>
                    <Box display="flex" justifyContent="center" alignItems="center" gap={0.5}>
                      Purchase Cost
                      <IconButton
                        size="small"
                        onClick={() => handlePurchaseCostSort('asc')}
                        color={purchaseCostSort === 'asc' ? 'primary' : 'default'}
                        sx={{ p: 0.25 }}
                        aria-label="Sort purchase cost ascending"
                      >
                        <ArrowUpward
                          fontSize="inherit"
                          sx={{ color: purchaseCostSort === 'asc' ? 'primary.main' : 'inherit', opacity: purchaseCostSort === 'asc' ? 1 : 0.5 }}
                        />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handlePurchaseCostSort('desc')}
                        color={purchaseCostSort === 'desc' ? 'primary' : 'default'}
                        sx={{ p: 0.25 }}
                        aria-label="Sort purchase cost descending"
                      >
                        <ArrowDownward
                          fontSize="inherit"
                          sx={{ color: purchaseCostSort === 'desc' ? 'primary.main' : 'inherit', opacity: purchaseCostSort === 'desc' ? 1 : 0.5 }}
                        />
                      </IconButton>
                    </Box>
                  </TableCell>
                )}
                {visibleColumns.salesPrice && (
                  <TableCell align="center" sx={{fontWeight : "bold", minWidth: 200}}>
                    <Box display="flex" justifyContent="center" alignItems="center" gap={0.5}>
                      Sales Price
                      <IconButton
                        size="small"
                        onClick={() => handleSalesPriceSort('asc')}
                        color={salesPriceSort === 'asc' ? 'primary' : 'default'}
                        sx={{ p: 0.25 }}
                        aria-label="Sort sales price ascending"
                      >
                        <ArrowUpward
                          fontSize="inherit"
                          sx={{ color: salesPriceSort === 'asc' ? 'primary.main' : 'inherit', opacity: salesPriceSort === 'asc' ? 1 : 0.5 }}
                        />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleSalesPriceSort('desc')}
                        color={salesPriceSort === 'desc' ? 'primary' : 'default'}
                        sx={{ p: 0.25 }}
                        aria-label="Sort sales price descending"
                      >
                        <ArrowDownward
                          fontSize="inherit"
                          sx={{ color: salesPriceSort === 'desc' ? 'primary.main' : 'inherit', opacity: salesPriceSort === 'desc' ? 1 : 0.5 }}
                        />
                      </IconButton>
                    </Box>
                  </TableCell>
                )}
                {visibleColumns.image && <TableCell sx={{fontWeight : "bold", width: 120}}>Image</TableCell>}
                {visibleColumns.actions && <TableCell sx={{fontWeight : "bold", width: 150, textAlign: 'center'}}>Actions</TableCell>}
              </TableRow>
              <FiltersRow
                inputFilters={inputFilters}
                setInputFilters={setInputFilters}
                filters={filters}
                setFilters={setFilters}
                setDebouncedFilters={setDebouncedFilters}
                categories={categories}
                allSubcategories={allSubcategories}
                stores={stores}
                setPage={setPage}
                stockFilter={stockFilter}
                setStockFilter={setStockFilter}
                visibleColumns={visibleColumns}
                handleExport={handleExport} // added prop
                setImportDialogOpen={setImportDialogOpen}
                autocompleteOptions={autocompleteOptions}
                autocompleteLoading={autocompleteLoading}
                autocompleteOpen={autocompleteOpen}
                setAutocompleteOpen={setAutocompleteOpen}
                setAutocompleteOptions={setAutocompleteOptions}
                onAutocompleteInputChange={(field, query) => {
                  switch(field) {
                    case 'names':
                      debouncedFetchNames(query);
                      break;
                    case 'codes':
                      debouncedFetchCodes(query);
                      break;
                    case 'stocks':
                      debouncedFetchStocks(query);
                      break;
                    case 'moqs':
                      debouncedFetchMoqs(query);
                      break;
                    case 'leadTimes':
                      debouncedFetchLeadTimes(query);
                      break;
                    case 'notes':
                      debouncedFetchNotes(query);
                      break;
                    case 'tags':
                      debouncedFetchTags(query);
                      break;
                    case 'descriptions':
                      debouncedFetchDescriptions(query);
                      break;
                    case 'colors':
                      debouncedFetchColors(query);
                      break;
                    case 'sizes':
                      debouncedFetchSizes(query);
                      break;
                    case 'skus':
                      debouncedFetchSkus(query);
                      break;
                    case 'barcodes':
                      debouncedFetchBarcodes(query);
                      break;
                    case 'purchaseCosts':
                      debouncedFetchPurchaseCosts(query);
                      break;
                    case 'salesPrices':
                      debouncedFetchSalesPrices(query);
                      break;
                    default:
                      break;
                  }
                }}
                exportAnchorEl={exportAnchorEl}
                setExportAnchorEl={setExportAnchorEl}
                exportMenuOpen={exportMenuOpen}
              />
            </TableHead>
            {/* UPDATED: pass visibleColumns into body and onView handler */}
            <ProductTableBody 
              products={products} 
              navigate={navigate} 
              loading={loading} 
              visibleColumns={visibleColumns}
              onView={handleOpenView}
              page={page}
              limit={limit}
              selectedIds={selectedIds}
              onToggleOne={toggleSelectOne}
              onDelete={openDeleteConfirm}
              exportAnchorEl={exportAnchorEl}
              setExportAnchorEl={setExportAnchorEl}
              exportMenuOpen={exportMenuOpen}
              handleExport={handleExport}
              commonSearch={commonSearch}
            />
          </Table>
        </TableContainer>
        {/* Modified pagination box to include the display preferences button */}
        <Box p={2} display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" gap={2}>
            <Button variant="contained" color="warning" onClick={() => navigate("/ManageProduct")}>+ Add Product</Button>
            <Button 
              variant="outlined" 
              color="primary" 
              startIcon={<ViewColumn />} 
              onClick={handleOpenDisplayPrefs}
              aria-label="Display Preferences"
              size="small"
            >
              Display Preferences
            </Button>
          </Box>
          <TablePagination
            component="div"
            count={totalItems}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={limit}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[5, 10, 25]}
          />
        </Box>
      </Paper>

      {/* Import Preview Dialog */}
      <Dialog 
        open={importPreviewOpen} 
        onClose={(event, reason) => {
          // Prevent closing on backdrop click or escape key
          if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
            return;
          }
          setImportPreviewOpen(false);
        }}
        maxWidth="xl" 
        fullWidth
        onEnter={async () => {
          console.log("Import Preview Dialog opened");
          
          // Check if we have dropdown data
          const hasAllDropdownData = 
            categories?.length > 0 && 
            allSubcategories?.length > 0 && 
            stores?.length > 0 && 
            hsnCodes?.length > 0 && 
            units?.length > 0 && 
            sizes?.length > 0;
          
          console.log("Current dropdown data status:");
          console.log("- Categories:", categories?.length || 0);
          console.log("- Subcategories:", allSubcategories?.length || 0);
          console.log("- Stores:", stores?.length || 0);
          console.log("- HSN Codes:", hsnCodes?.length || 0);
          console.log("- Units:", units?.length || 0);
          console.log("- Sizes:", sizes?.length || 0);
          
          // Log column keys to help identify field name mismatches
          if (importedData.length > 0) {
            console.log("CSV Column Keys:", Object.keys(importedData[0]));
          }
          
          // If any data is missing, fetch it all
          if (!hasAllDropdownData) {
            console.log("Some dropdown data is missing, fetching from backend...");
            try {
              // Force a direct fetch of HSN codes
              if (!hsnCodes?.length) {
                console.log("Directly fetching HSN codes...");
                const hsnResponse = await axios.get(`${BASE_URL}/api/hsncode`);
                const hsnData = hsnResponse.data?.data || [];
                
                if (Array.isArray(hsnData) && hsnData.length > 0) {
                  console.log("Successfully fetched HSN codes:", hsnData.length);
                  console.log("Sample HSN code:", hsnData[0]);
                  
                  // Process and set HSN codes
                  const standardizedHsnCodes = hsnData.map(hsn => ({
                    id: hsn.id,
                    code: String(hsn.code || ''),
                    tax_id: hsn.tax_id,
                    Tax: hsn.Tax || {},
                    tax: hsn.Tax || {}
                  }));
                  
                  setHsnCodes(standardizedHsnCodes);
                }
              }
              
              // Fetch all other metadata
              const metaData = await fetchMeta();
              if (metaData) {
                console.log("Successfully fetched dropdown data in dialog open");
                console.log("Updated dropdown data counts:");
                console.log("- Categories:", metaData.categories?.length || 0);
                console.log("- Subcategories:", metaData.subcategories?.length || 0);
                console.log("- Stores:", metaData.stores?.length || 0);
                console.log("- HSN Codes:", metaData.hsnCodes?.length || 0);
                console.log("- Units:", metaData.units?.length || 0);
                console.log("- Sizes:", metaData.sizes?.length || 0);
              } else {
                console.error("Failed to fetch dropdown data in dialog open");
              }
            } catch (err) {
              console.error("Error fetching dropdown data in dialog:", err);
            }
          }
        }}
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Preview and Edit Import Data</Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {importedData.length} records to import
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Review and edit the data before finalizing the import. Click on any cell to edit directly in the table.
            New units, stores, sizes, and taxes will be automatically created if they don't exist.
          </Typography>
          
          <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 60 }}>
                    <Checkbox
                      size="small"
                      checked={importedData.length > 0 && importSelectedRows.size === importedData.length}
                      indeterminate={importSelectedRows.size > 0 && importSelectedRows.size < importedData.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setImportSelectedRows(new Set(importedData.map((_, i) => i)));
                        } else {
                          setImportSelectedRows(new Set());
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>No.</TableCell>
                  {importedData.length > 0 && Object.keys(importedData[0]).map((header) => {
                    // Get the clean header name first (remove any existing asterisks)
                    const cleanHeader = String(header).replace(/\s*\*\s*$/g, '');

                    // Check if this is a required field - lowercase for case-insensitive comparison
                    const normalizedHeader = cleanHeader.toLowerCase();
                    // List of required fields - note that we keep the header normalized form for comparison
                    const requiredFields = ['name', 'code', 'hsn code', 'importance', 'product type', 'category', 'unit', 'product mode', 'store', 'status', 'tax'];

                    // Check if this header is in our required fields list
                    const isRequired = requiredFields.includes(normalizedHeader);

                    // Add asterisk for required fields
                    const displayHeader = isRequired ? `${cleanHeader} *` : cleanHeader;

                    // Normalize header for structural comparisons (remove spaces and non-alphanumeric chars)
                    const normalizedHeaderKey = normalizedHeader.replace(/\s+/g, '').replace(/[^\w]/g, '');
                    // Columns we want to center-align (normalized keys)
                    const centerColumns = ['minstock', 'minimumstock', 'min_stock', 'minimum_stock', 'moq', 'tax', 'gst', 'purchasecost', 'salesprice', 'stock', 'leadtime'];
                    const isCenterHeader = centerColumns.includes(normalizedHeaderKey);

                    return (
                      <TableCell
                        key={header}
                        align={isCenterHeader ? 'center' : undefined}
                        sx={{ fontWeight: 'bold', textAlign: isCenterHeader ? 'center' : undefined }}
                      >
                        {displayHeader}
                      </TableCell>
                    );
                  })}
                </TableRow>
              </TableHead>
              <TableBody>
                {importedData.map((row, rowIndex) => (
                  <TableRow key={rowIndex} hover>
                    <TableCell>
                      <Checkbox
                        size="small"
                        checked={importSelectedRows.has(rowIndex)}
                        onChange={(e) => {
                          setImportSelectedRows(prev => {
                            const s = new Set(prev);
                            if (e.target.checked) s.add(rowIndex); else s.delete(rowIndex);
                            return s;
                          });
                        }}
                      />
                    </TableCell>
                    <TableCell>{rowIndex + 1}</TableCell>
                    {Object.keys(row).map((key, cellIndex) => {
                      // Enhanced column key debugging
                      const columnKeyLower = key.toLowerCase();
                      const normalizedKey = columnKeyLower
                        .replace(/\s+/g, '')  // Remove spaces
                        .replace(/^hsn(code)?$/, 'hsn') // Normalize HSN/HSN Code to hsn
                        .replace(/^hsnnum(ber)?$/, 'hsn') // Also catch HSN Number variations
                        .replace(/^categoryname$/, 'category') // Normalize CategoryName
                        .replace(/^subcategoryname$/, 'subcategory') // Normalize SubcategoryName
                        .replace(/^storename$/, 'store') // Normalize StoreName
                        .replace(/^unitname$/, 'unit') // Normalize UnitName
                        .replace(/^sizename$/, 'size'); // Normalize SizeName
                      
                      const isDropdownColumn = ['category', 'subcategory', 'store', 'producttype', 
                        'status', 'importance', 'hsn', 'unit', 'productmode', 'size'].includes(normalizedKey);
                      
                      // Detailed debugging for first row cells
                      if (rowIndex === 0) {
                        console.log(`Column "${key}": normalized="${normalizedKey}", isDropdown=${isDropdownColumn}`);
                        
                        // Special debugging for dropdown columns
                        if (isDropdownColumn) {
                          // Check dropdown data availability
                          let availableOptions = [];
                          let dataSource = [];
                          
                          if (normalizedKey === 'category' && Array.isArray(categories)) {
                            dataSource = categories;
                            availableOptions = categories.map(c => c.Name || c.name).filter(Boolean);
                          } else if (normalizedKey === 'subcategory' && Array.isArray(allSubcategories)) {
                            dataSource = allSubcategories;
                            availableOptions = allSubcategories.map(s => s.Name || s.name).filter(Boolean);
                          } else if (normalizedKey === 'store' && Array.isArray(stores)) {
                            dataSource = stores;
                            availableOptions = stores.map(s => s.Name || s.name).filter(Boolean);
                          } else if (normalizedKey === 'hsn' && Array.isArray(hsnCodes)) {
                            dataSource = hsnCodes;
                            availableOptions = hsnCodes.map(h => h.code || h.Code || '').filter(Boolean);
                          } else if (normalizedKey === 'unit' && Array.isArray(units)) {
                            dataSource = units;
                            availableOptions = units.map(u => u.Name || u.name).filter(Boolean);
                          } else if (normalizedKey === 'size' && Array.isArray(sizes)) {
                            dataSource = sizes;
                            availableOptions = sizes.map(s => s.Name || s.name).filter(Boolean);
                          }
                          
                          console.log(`  - ${key}: ${dataSource.length} items available, sample options:`, 
                            availableOptions.slice(0, 3));
                        }
                      }
                      
                      return (
                        <EnhancedEditableCell
                          key={`${rowIndex}-${cellIndex}`}
                          value={row[key]}
                          rowIndex={rowIndex}
                          columnKey={key}
                          row={row}
                          onUpdate={(rowIdx, colKey, newValue) => {
                            // Update the imported data in state
                            const updatedData = [...importedData];
                            updatedData[rowIdx] = { ...updatedData[rowIdx], [colKey]: newValue };
                            setImportedData(updatedData);

                            // Clear the specific field error for this cell (if any)
                            try {
                              setImportFieldErrors(prev => {
                                if (!prev) return prev;
                                const copy = { ...prev };
                                if (copy[rowIdx] && copy[rowIdx][colKey]) {
                                  // remove only this field's errors
                                  const {[colKey]: _, ...rest} = copy[rowIdx];
                                  if (Object.keys(rest).length === 0) {
                                    delete copy[rowIdx];
                                  } else {
                                    copy[rowIdx] = rest;
                                  }
                                }
                                return copy;
                              });
                            } catch (e) {
                              console.error('Failed to clear import field error for', rowIdx, colKey, e);
                            }
                          }}
                          categories={categories}
                          allSubcategories={allSubcategories}
                          stores={stores}
                          hsnCodes={hsnCodes}
                          units={units}
                          sizes={sizes}
                          tags={tags}
                          taxes={taxes}
                          error={!!(importFieldErrors[rowIndex] && importFieldErrors[rowIndex][key])}
                          errorMessages={importFieldErrors[rowIndex] && importFieldErrors[rowIndex][key]}
                        />
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setImportPreviewOpen(false);
              setImportedData([]);
              setImportFieldErrors({});
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleFinalImport}
            disabled={importLoading}
          >
            {importLoading ? <CircularProgress size={20} /> : 'Finalize Import'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import Report Dialog */}
      <Dialog 
        open={importReportOpen} 
        onClose={() => setImportReportOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              {importReport?.type === 'validation_error' ? 'Validation Errors' : 
               importReport?.type === 'import_failed' ? 'Import Failed' : 'Import Report'}
            </Typography>
            <Box display="flex" gap={2}>
              {importReport?.type === 'import_complete' && (
                <>
                  <Typography variant="body2" color="success.main">
                    ✓ {importReport.successCount} Imported
                  </Typography>
                  {importReport.errorCount > 0 && (
                    <Typography variant="body2" color="error.main">
                      ✗ {importReport.errorCount} Errors
                    </Typography>
                  )}
                  {importReport.skipped > 0 && (
                    <Typography variant="body2" color="warning.main">
                      ⚠ {importReport.skipped} Skipped
                    </Typography>
                  )}
                </>
              )}
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {importReport && (
            <Box>
              {/* Summary */}
              <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle2" gutterBottom>Summary</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={3}>
                    <Typography variant="body2" color="textSecondary">Total Rows:</Typography>
                    <Typography variant="h6">{importReport.totalRows}</Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="body2" color="success.main">Successful:</Typography>
                    <Typography variant="h6" color="success.main">{importReport.successCount}</Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="body2" color="error.main">Errors:</Typography>
                    <Typography variant="h6" color="error.main">{importReport.errorCount}</Typography>
                  </Grid>
                  {importReport.skipped > 0 && (
                    <Grid item xs={3}>
                      <Typography variant="body2" color="warning.main">Skipped:</Typography>
                      <Typography variant="h6" color="warning.main">{importReport.skipped}</Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>

              {/* Errors Section */}
              {importReport.errors && importReport.errors.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="error.main" gutterBottom>
                    Errors ({importReport.errors.length})
                  </Typography>
                  <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold' }}>Row</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Product Name</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Code</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Error Details</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {importReport.errors.map((error, index) => (
                          <TableRow key={index}>
                            <TableCell>{error.row || 'N/A'}</TableCell>
                            <TableCell>{error.productName || error.data?.Name || 'N/A'}</TableCell>
                            <TableCell>{error.code || error.data?.Code || 'N/A'}</TableCell>
                            <TableCell>
                              <Box>
                                {Array.isArray(error.errors) ? error.errors.map((err, i) => {
                                  const isMandatoryError = err.includes('mandatory') || err.includes('required');
                                  const isNotFoundError = err.includes('not found') || err.includes('does not exist');
                                  const isAlreadyExistsError = err.includes('already exists');
                                  return (
                                    <Typography 
                                      key={i} 
                                      variant="body2" 
                                      color="error.main" 
                                      sx={{ 
                                        mb: 0.5,
                                        fontWeight: (isMandatoryError || isNotFoundError || isAlreadyExistsError) ? 600 : 400,
                                        bgcolor: isMandatoryError ? 'rgba(255, 152, 0, 0.1)' : 
                                                isNotFoundError ? 'rgba(244, 67, 54, 0.1)' : 
                                                isAlreadyExistsError ? 'rgba(156, 39, 176, 0.1)' : 'transparent',
                                        px: (isMandatoryError || isNotFoundError || isAlreadyExistsError) ? 1 : 0,
                                        py: (isMandatoryError || isNotFoundError || isAlreadyExistsError) ? 0.5 : 0,
                                        borderRadius: (isMandatoryError || isNotFoundError || isAlreadyExistsError) ? 1 : 0
                                      }}
                                    >
                                      {isMandatoryError ? '⚠ ' : isNotFoundError ? '❌ ' : isAlreadyExistsError ? '🔁 ' : '• '}{err}
                                    </Typography>
                                  );
                                }) : (
                                  <Typography variant="body2" color="error.main">
                                    {error.errors || error.message || 'Unknown error'}
                                  </Typography>
                                )}
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {/* Success Section */}
              {importReport.successes && importReport.successes.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="success.main" gutterBottom>
                    Successfully Imported ({importReport.successes.length})
                  </Typography>
                  <TableContainer component={Paper} sx={{ maxHeight: 200 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold' }}>Row</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Product Name</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Code</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {importReport.successes.map((success, index) => (
                          <TableRow key={index}>
                            <TableCell>{success.row}</TableCell>
                            <TableCell>{success.data?.Name || success.name || 'N/A'}</TableCell>
                            <TableCell>{success.data?.Code || success.code || 'N/A'}</TableCell>
                            <TableCell>
                              <Typography variant="body2" color="success.main">
                                ✓ {success.action || 'Imported'}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {/* Recommendations */}
              {importReport.type === 'validation_error' && (
                <Box sx={{ p: 2, bgcolor: 'warning.lighter', borderRadius: 1, border: '1px solid', borderColor: 'warning.main' }}>
                  <Typography variant="subtitle2" color="warning.dark" gutterBottom>
                    💡 How to Fix These Errors
                  </Typography>
                  <Typography variant="body2" color="warning.dark" sx={{ mb: 1 }}>
                    <strong>Mandatory Fields (must be filled):</strong>
                  </Typography>
                  <Typography variant="body2" color="warning.dark" sx={{ mb: 1, ml: 2 }}>
                    • Name, Code, HSN Code, Importance, Category, Unit, Product Mode, Store, Status, Size
                  </Typography>
                  <Typography variant="body2" color="warning.dark">
                    <strong>Additional Checks:</strong><br/>
                    • Numeric fields (Minimum Stock, GST %, etc.) must contain valid numbers<br/>
                    • Status must be "Active" or "Inactive"<br/>
                    • Importance must be "Normal", "High", or "Critical"<br/>
                    • Product Type must be "All", "Finished Goods", "Semi-Finished Goods", or "Raw Materials"<br/>
                    • Product Mode must be "Purchase", "Internal Manufacturing", or "Both"<br/>
                    • <strong>Category, Subcategory, Store, Unit, and Size should match existing system entries (use dropdown options)</strong> — HSN Codes and Taxes will be auto-created during import if they do not already exist.<br/>
                    • You can edit values directly in the preview table using the dropdowns, then click "Finalize Import" again
                  </Typography>
                </Box>
              )}
              
              {/* Recommendations for import errors */}
              {importReport.type === 'import_complete' && importReport.errorCount > 0 && (
                <Box sx={{ p: 2, bgcolor: 'error.lighter', borderRadius: 1, border: '1px solid', borderColor: 'error.main' }}>
                  <Typography variant="subtitle2" color="error.dark" gutterBottom>
                    💡 How to Fix Import Errors
                  </Typography>
                  <Typography variant="body2" color="error.dark" sx={{ mb: 1 }}>
                    Click the <strong>"Back to Edit"</strong> button below to return to the import preview where you can:
                  </Typography>
                  <Typography variant="body2" color="error.dark" sx={{ ml: 2 }}>
                    • Edit field values directly in the editable table<br/>
                    • Use dropdown menus for Category, Subcategory, Store, HSN Code, Unit, Size, etc.<br/>
                    • Deselect rows with errors if you don't want to import them<br/>
                    • After making changes, click "Finalize Import" again to retry
                  </Typography>
                </Box>
              )}
              
              {/* Recommendations for import failures */}
              {importReport.type === 'import_failed' && (
                <Box sx={{ p: 2, bgcolor: 'error.lighter', borderRadius: 1, border: '1px solid', borderColor: 'error.main' }}>
                  <Typography variant="subtitle2" color="error.dark" gutterBottom>
                    ⚠ Import Failed
                  </Typography>
                  <Typography variant="body2" color="error.dark">
                    The import process encountered a server error. Please check the error details above and try again.
                    If the problem persists, contact your system administrator.
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {/* Back to Edit button - available for validation errors and import errors */}
          {(importReport?.type === 'validation_error' || 
            (importReport?.type === 'import_complete' && importReport.errorCount > 0) ||
            importReport?.type === 'import_failed') && (
            <Button 
              variant="outlined" 
              color="warning"
              startIcon={<ArrowBack />}
              onClick={() => {
                setImportReportOpen(false);
                // Re-open the preview dialog so user can fix errors
                setImportPreviewOpen(true);
              }}
            >
              Back to Edit
            </Button>
          )}
          
          {/* Close button */}
          <Button onClick={() => {
            setImportReportOpen(false);
            // If import was successful, clear the preview data
            if (importReport?.type === 'import_complete' && importReport.errorCount === 0) {
              setImportFile(null);
              setImportedData([]);
              setImportSelectedRows(new Set());
            }
          }}>
            Close
          </Button>
          
          {/* Fix Errors button for validation errors - alternative to Back to Edit */}
          {importReport?.type === 'validation_error' && (
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => {
                setImportReportOpen(false);
                // Keep the preview dialog open so user can fix errors
                setImportPreviewOpen(true);
              }}
            >
              Fix Errors
            </Button>
          )}
          
          {/* View Products button for successful imports */}
          {importReport?.type === 'import_complete' && importReport.successCount > 0 && (
            <Button 
              variant="contained" 
              color="success"
              onClick={() => {
                setImportReportOpen(false);
                // Clear import data
                setImportFile(null);
                setImportedData([]);
                setImportSelectedRows(new Set());
                // Product list is already refreshed after import
                // User can see the newly imported products in the table
              }}
            >
              View Products
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Export Menu Popover */}
      <Popover
        open={exportMenuOpen}
        anchorEl={exportAnchorEl}
        onClose={() => setExportAnchorEl(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <Box sx={{ p: 1 }}>
          <Button
            fullWidth
            size="small"
            onClick={() => handleExport('filtered')}
            sx={{ mb: 1, justifyContent: 'flex-start' }}
          >
            Only Filtered Items
          </Button>
          <Divider />
          <Button
            fullWidth
            size="small"
            onClick={() => handleExport('all')}
            sx={{ mt: 1, justifyContent: 'flex-start' }}
          >
            All Items
          </Button>
        </Box>
      </Popover>

    </Box>
  );
}

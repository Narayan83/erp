import {
  Box,
  Grid,
  Typography,
  Button,
  Divider,
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  IconButton,
  Avatar,
  Stack,
} from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";
import { DynamicDialog } from "../../../CommonComponents/DynamicDialog";

import axios from "axios";
import { useState, useEffect } from "react";
import { BASE_URL } from "../../../Config"; // Import BASE_URL
import { useNavigate } from "react-router-dom"; // Add this import for navigation

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

export default function ReviewStep({
  product,
  variants,
  onBack,
  onSubmit,
  onEditVariant,
  onRemoveVariant,
  onReset,
}) {
  //   const handleFinalSubmit = async () => {
  //   try {
  //     const payload = {
  //       ...product,
  //       variants, // already structured as expected by backend
  //       tagIDs: product.tagIDs || [], // if you support tags
  //     };

  //     const res = await axios.post(`${BASE_URL}/api/products`, payload);
  //     console.log("Submitted successfully:", res.data);

  //     onSubmit(); // proceed to success screen or reset
  //   } catch (error) {
  //     console.error("Submission failed:", error.response?.data || error.message);
  //     alert("Product submission failed. Please try again.");
  //   }
  // };

  const [dialogOpen, setDialogOpen] = useState(false);
  const navigate = useNavigate(); // Add this to enable navigation

  // State for display names
  const [categoryName, setCategoryName] = useState('');
  const [subcategoryName, setSubcategoryName] = useState('');
  const [taxName, setTaxName] = useState('');
  const [unitName, setUnitName] = useState('');
  const [storeName, setStoreName] = useState('');

  // Fetch display names when product changes
  useEffect(() => {
    const fetchNames = async () => {
      try {
        const promises = [];
        
        if (product.categoryID) {
          promises.push(axios.get(`${BASE_URL}/api/categories/${product.categoryID}`));
        } else {
          promises.push(Promise.resolve({ data: { name: '' } }));
        }
        
        if (product.subcategoryID) {
          promises.push(axios.get(`${BASE_URL}/api/subcategories/${product.subcategoryID}`));
        } else {
          promises.push(Promise.resolve({ data: { name: '' } }));
        }
        
        if (product.taxID) {
          promises.push(axios.get(`${BASE_URL}/api/taxes/${product.taxID}`));
        } else {
          promises.push(Promise.resolve({ data: { name: '' } }));
        }

        if (product.unitID) {
          promises.push(axios.get(`${BASE_URL}/api/units/${product.unitID}`));
        } else {
          promises.push(Promise.resolve({ data: { name: '' } }));
        }

        if (product.storeID) {
          promises.push(axios.get(`${BASE_URL}/api/stores/${product.storeID}`));
        } else {
          promises.push(Promise.resolve({ data: { name: '' } }));
        }
        
        const [catRes, subRes, taxRes, unitRes, storeRes] = await Promise.all(promises);
        
        setCategoryName(catRes.data?.name || catRes.data?.Name || '');
        setSubcategoryName(subRes.data?.name || subRes.data?.Name || '');
        setTaxName(taxRes.data?.name || taxRes.data?.Name || '');
        setUnitName(unitRes.data?.name || unitRes.data?.Name || '');
        setStoreName(storeRes.data?.name || storeRes.data?.Name || '');
        
      } catch (error) {
        console.error('Error fetching display names:', error);
        setCategoryName('');
        setSubcategoryName('');
        setTaxName('');
        setUnitName('');
        setStoreName('');
      }
    };
    
    if (product) {
      fetchNames();
    }
  }, [product]);

  const handleFinalSubmit = async () => {
    try {
      const formData = new FormData();

      // Transform productData to match backend's capitalized field names
      const productData = { ...product };
      delete productData.variants;
      delete productData.tagIDs;
      const transformedProduct = {
        Name: productData.name || '',
        Code: productData.code || '',
        HsnID: productData.hsnID ? Number(productData.hsnID) : null,
        HsnSacCode: productData.hsnSacCode || '',
        Importance: productData.importance || '',
        ProductType: productData.productType || '',
        MinimumStock: productData.minimumStock ? Number(productData.minimumStock) : 0,
        CategoryID: productData.categoryID ? Number(productData.categoryID) : null,
        SubcategoryID: productData.subcategoryID ? Number(productData.subcategoryID) : null,
        UnitID: productData.unitID ? Number(productData.unitID) : null,
        ProductMode: productData.product_mode || '',
        StoreID: productData.storeID ? Number(productData.storeID) : null,
        TaxID: productData.taxID ? Number(productData.taxID) : null,
        GstPercent: productData.gstPercent ? Number(productData.gstPercent) : 0,
        Description: productData.description || '',
        InternalNotes: productData.internalNotes || '',
        IsActive: productData.isActive !== undefined ? Boolean(productData.isActive) : true,
      };

      console.log("Transformed product JSON:", JSON.stringify(transformedProduct));
      formData.append("product", JSON.stringify(transformedProduct));

      // Transform variants to match backend's capitalized field names
      const transformedVariants = variants.map(({ images, mainImage, mainImageIndex, ...v }) => ({
        Color: v.color,
        Size: v.size,
        SKU: v.sku,
        Barcode: v.barcode,
        PurchaseCost: v.purchaseCost,
        StdSalesPrice: v.stdSalesPrice,
        Stock: v.stock,
        LeadTime: v.leadTime,
        IsActive: v.isActive,
        // Persist main image selection if present
        MainImage: mainImage ?? null,
        MainImageIndex: (typeof mainImageIndex === 'number') ? mainImageIndex : null,
        // Don't include Images here - they'll be handled separately
      }));

      formData.append("variants", JSON.stringify(transformedVariants));
      formData.append("tagIDs", JSON.stringify(product.tagIDs || []));

      // Improved image handling - log each image for debugging
      console.log("Appending images to FormData:");
      variants.forEach((variant, variantIndex) => {
        if (Array.isArray(variant.images)) {
          console.log(`Variant ${variant.sku} has ${variant.images.length} images`);
          
          variant.images.forEach((file, fileIndex) => {
            if (file instanceof File) {
              const fieldName = `images_${variant.sku}`;
              console.log(`Adding File: ${fieldName}, name: ${file.name}, size: ${file.size}, type: ${file.type}`);
              formData.append(fieldName, file);
            } else if (typeof file === 'string') {
              console.log(`String image for ${variant.sku}: ${file}`);
              // Keep the existing image reference in a separate field
              formData.append(`variant_images`, JSON.stringify({
                sku: variant.sku,
                image: file
              }));
            } else {
              console.log(`Unknown image type for ${variant.sku}:`, typeof file, file);
            }
          });
        }
      });

      // Debug the form submission process more thoroughly
      console.log("Debug product submission:");
      console.log("- Product data:", transformedProduct);
      console.log("- Variants:", transformedVariants);
      
      // Add special debug field to help track submission on backend
      formData.append("_debug", "true");

      console.log("Submitting product with FormData");
      const res = await axios.post(`${BASE_URL}/api/products`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("Submitted successfully:", res.data);
      setDialogOpen(true); // Show success dialog
    } catch (error) {
      console.error("Submission failed:", error);
      console.error("Error details:", error.response?.data);
      alert(`Product submission failed: ${error.message}`);
    }
  };

  // const resetForm = () => {
  //   setProductData(null);
  //   setVariants([]);
  //   setActiveStep(0); // Reset to step 1
  // };

  return (
    <Box>
      <h5 style={{ marginBottom: "20px" }}>
        Review Product
      </h5>
      <Box mb={2}>
  <Grid container spacing={0}>
    {[
      { label: "Name", value: product.name },
      { label: "Code", value: product.code },
      { label: "HSN Code", value: product.hsnSacCode },
      { label: "Importance", value: product.importance },
      { label: "Product Type", value: product.productType },
      { label: "Minimum Stock", value: product.minimumStock },
      { label: "Category", value: categoryName },
      { label: "Subcategory", value: subcategoryName },
      { label: "Unit", value: unitName },
      { label: "Product Mode", value: product.product_mode },
      { label: "MOQ", value: product.minimumStock },
      { label: "Store", value: storeName },
      { label: "Tax", value: taxName },
      { label: "GST %", value: `${product.gstPercent}%` },
      { label: "Description", value: product.description },
      { label: "Internal Notes", value: product.internalNotes },
      { label: "Status", value: product.isActive ? "Active" : "Inactive" },
    ].map((item, idx) => (
      <Grid key={idx} item xs={12} sm={6}>
        <Box border={1} borderColor="grey.300" borderRadius={1} p={1.5}>
          <Typography><strong>{item.label}:</strong> {item.value}</Typography>
        </Box>
      </Grid>
    ))}
  </Grid>
</Box>
      <Divider sx={{ my: 2 }} />

     <h5 style={{ marginBottom: "20px" }}>
        Product Variants
      </h5>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Color Code</TableCell>
            <TableCell>Size</TableCell>
            <TableCell>SKU</TableCell>
            <TableCell>Barcode</TableCell>
            <TableCell>Purchase Cost</TableCell>
            <TableCell>Sales Price</TableCell>
            <TableCell>Stock</TableCell>
            <TableCell>Lead Time</TableCell>
            <TableCell>Images</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {variants.map((v, i) => (
            <TableRow key={i} sx={{ opacity: v.isActive === false ? 0.5 : 1 }}>
              <TableCell>
                {(() => {
                  const colorData = ralColors.find(c => c.value === v.color);
                  return (
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          borderRadius: "5%",
                          backgroundColor: colorData ? colorData.hex : v.color,
                          border: "1px solid #ccc",
                        }}
                      />
                      <Box>
                        <Typography variant="body2">
                          {v.color} - {colorData.name.split(' - ')[1]}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })()}
              </TableCell>
              <TableCell>{v.size}</TableCell>
              <TableCell>{v.sku}</TableCell>
              <TableCell>{v.barcode}</TableCell>
              <TableCell>₹{v.purchaseCost}</TableCell>
              <TableCell>₹{v.stdSalesPrice}</TableCell>
              <TableCell>{v.stock}</TableCell>
              <TableCell>{v.leadTime} days</TableCell>
              <TableCell>
                {Array.isArray(v.images) && v.images.length > 0 ? (
                  <Stack direction="row" spacing={1}>
                    {v.images.map((img, j) => {
                      // Enhanced debugging to show complete image path
                      const imgPath = typeof img === "string" 
                        ? `${BASE_URL}/uploads/${img}` 
                        : URL.createObjectURL(img);
                      
                      console.log(`Image ${j} for variant ${v.sku}:`, {
                        original: img,
                        type: typeof img,
                        fullPath: imgPath,
                        isFile: img instanceof File
                      });
                      
                      // Try direct URL if it's a string that looks like a URL
                      const isDirectUrl = typeof img === "string" && (
                        img.startsWith("http://") || 
                        img.startsWith("https://") || 
                        img.startsWith("data:")
                      );
                      
                      return (
                        <Box key={j} position="relative">
                          <img
                            src={isDirectUrl ? img : imgPath}
                            alt={`variant-${i}-img-${j}`}
                            style={{
                              width: 40,
                              height: 40,
                              objectFit: 'cover',
                              borderRadius: 4,
                              border: '1px solid #ccc',
                            }}
                            onError={(e) => {
                              console.error(`Failed to load image:`, {
                                src: e.target.src,
                                originalImg: img
                              });
                              e.target.src = 'https://via.placeholder.com/40?text=Error';
                            }}
                          />
                        </Box>
                      );
                    })}
                  </Stack>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: v.isActive !== false ? 'success.main' : 'error.main',
                    fontWeight: 'medium'
                  }}
                >
                  {v.isActive !== false ? 'Active' : 'Inactive'}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => onEditVariant(i)}
                >
                  <Edit fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => onRemoveVariant(i)}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Box mt={4} display="flex" justifyContent="space-between">
        <Button onClick={onBack}>Back</Button>
        <Button variant="contained" onClick={handleFinalSubmit}>
          Submit
        </Button>
      </Box>

      <DynamicDialog
        open={dialogOpen}
        type="success"
        title="Product Added"
        message="The product and its variants were successfully saved."
        onClose={() => setDialogOpen(false)}
        actions={[
          {
            label: "➕ Add Another",
            onClick: () => {
              setDialogOpen(false);
              onReset(); // Reset form for new entry
            },
            variant: "outlined",
          },
          {
            label: "View Products",
            onClick: () => {
              setDialogOpen(false);
              navigate("/ProductMaster"); // Now works with the added import
            },
            variant: "contained",
          },
        ]}
      />
    </Box>
  );
}



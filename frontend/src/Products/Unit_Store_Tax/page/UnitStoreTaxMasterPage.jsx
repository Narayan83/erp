import { Tabs, Tab, Box } from "@mui/material";
import { useState } from "react";
import UnitSection from "../sections/UnitSection";
import TaxSection from "../sections/TaxSection";
import StoreSection from "../sections/StoreSection";
import HsnSection from "../sections/HsnSection";
import SizeSection from "../sections/SizeSection";
// import UnitSection from "./UnitSection";
// import TaxSection from "./TaxSection";

export default function UnitStoreTaxMasterPage() {
  const [tab, setTab] = useState(0);

  return (
     <section className="right-content">
    <Box p={4}>
      <Tabs value={tab} onChange={(e, newVal) => setTab(newVal)}>
        <Tab label="Unit" />
        <Tab label="Tax" />
        <Tab label="Store" />
        <Tab label="HSN" />
        <Tab label="Size" />
      </Tabs>

         {tab === 0 && <UnitSection />}
         {tab === 1 && <TaxSection />} 
         {tab === 2 && <StoreSection />}
         {tab === 3 && <HsnSection />}
         {tab === 4 && <SizeSection />}
    </Box>
    </section>
  );
}

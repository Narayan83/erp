import ExcelJS from "exceljs";

function numberToWordsInr(num) {
  if (!num || num === 0) return "Zero";
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const convertLessThanThousand = (n) => {
    if (n === 0) return "";
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
    return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " and " + convertLessThanThousand(n % 100) : "");
  };
  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const remainder = Math.floor(num % 1000);
  let result = "";
  if (crore > 0) result += convertLessThanThousand(crore) + " Crore ";
  if (lakh > 0) result += convertLessThanThousand(lakh) + " Lakh ";
  if (thousand > 0) result += convertLessThanThousand(thousand) + " Thousand ";
  if (remainder > 0) result += convertLessThanThousand(remainder);
  return result.trim() || "Zero";
}

function formatAddressCountryName(country) {
  const raw = String(country || "").trim();
  if (!raw) return "";
  return raw
    .replace(/\s*\(\s*(?:\+|00)\d{1,4}\s*\)\s*/g, " ")
    .replace(/\s+(?:\+|00)\d{1,4}\s*$/g, "")
    .trim();
}

function formatAddressPostalCode(postalCode) {
  const raw = String(postalCode || "").trim();
  if (!raw) return "";
  return raw.replace(/^\s*(?:\(\+\d{1,4}\)|\+\d{1,4}|00\d{1,4})\s*[-,:]?\s*/i, "");
}

/** Styled Excel export (same layout as Add Quotation export). */
export async function exportQuotationToExcelStyled(params) {
  try {
    const {
      q: qRaw,
      printConfig,
      printerHeader,
      docType,
      quotationDate: quotationDateOverride,
      validTill: validTillOverride,
      references,
      note,
      tandcSelections,
      extrcharges = [],
      additiondiscounts = [],
      tableItems = [],
      selectedBranch,
      selectedBank,
      selectedEmployeeObj,
      selectedBillingAddress,
      selectedShippingAddress,
      isSameAsBilling,
      isGSTStateMatch = true,
      qutationNo = "",
      selectedCustomer,
      gstForAddr,
      getCustomerLegalGstin,
      normalizeQuotationNumber,
    } = params;

    const q = qRaw || {};
      const quotationNumber = normalizeQuotationNumber(q.quotation_number || qutationNo || "");
      const cust = q.customer || selectedCustomer || {};
      const branch = q.company_branch || selectedBranch || {};
      const items = q.quotation_items || q.items || tableItems || [];
      const quotationDate = quotationDateOverride ?? q.quotation_date;
      const validTill = validTillOverride ?? q.valid_until;
      const company = q.company || branch.company || {};

      const firstNonEmpty = (...vals) => {
        for (const v of vals) {
          if (v === undefined || v === null) continue;
          const s = String(v).trim();
          if (s) return s;
        }
        return "";
      };

      const customerFallbackName = `${cust.firstname || ""} ${cust.lastname || ""}`.replace(/\s+/g, " ").trim();
      const customerName = firstNonEmpty(
        cust.company_name,
        cust.business_name,
        cust.customer_name,
        customerFallbackName,
        "Guest"
      );

      const bAddr = q.billing_address || selectedBillingAddress || {};
      const sAddr = isSameAsBilling ? bAddr : (q.shipping_address || selectedShippingAddress || {});
      const billingState = bAddr.state || "";
      const shippingState = sAddr.state || "";

      const formatAddressPersonName = (addr = {}) => {
        const salutation = firstNonEmpty(addr.salutation, cust.salutation, cust.title);
        const personFirst = firstNonEmpty(addr.firstname, addr.first_name, cust.firstname, cust.first_name);
        const personLast = firstNonEmpty(addr.lastname, addr.last_name, cust.lastname, cust.last_name);
        const fullName = [personFirst, personLast].filter(Boolean).join(" ").trim();
        if (fullName) return [salutation, fullName].filter(Boolean).join(" ").trim();
        const fallbackPerson = firstNonEmpty(
          addr.contact_person,
          addr.contactPerson,
          addr.contact_name,
          cust.contact_person,
          cust.contactPerson,
          cust.contact_name,
          cust.contact
        );
        if (!fallbackPerson) return "";
        const lower = fallbackPerson.toLowerCase();
        const salLower = (salutation || "").toLowerCase();
        if (salLower && (lower === salLower || lower.startsWith(`${salLower} `))) return fallbackPerson;
        return [salutation, fallbackPerson].filter(Boolean).join(" ").trim();
      };

      const billingGSTIN = gstForAddr(bAddr) || getCustomerLegalGstin(cust) || "-";
      const billingCompanyName = firstNonEmpty(
        bAddr.company_name,
        bAddr.business_name,
        bAddr.customer_name,
        bAddr.name,
        customerName
      );
      const shippingGSTIN = gstForAddr(sAddr) || getCustomerLegalGstin(cust) || "-";
      const shippingCompanyName = firstNonEmpty(
        sAddr.company_name,
        sAddr.business_name,
        sAddr.customer_name,
        sAddr.name,
        customerName
      );
      const billingPersonName = formatAddressPersonName(bAddr);
      const shippingPersonName = formatAddressPersonName(sAddr);

      const fmtAddrBlock = (addr, companyN, personN) => {
        const lines = [];
        if (companyN) lines.push(companyN);
        if (personN) lines.push(personN);
        for (const k of ["address1", "address2", "address3"]) {
          const v = addr[k];
          if (v && String(v).trim()) lines.push(String(v).trim());
        }
        const cityLine = [
          addr.city,
          addr.state,
          [formatAddressCountryName(addr.country || "India"), formatAddressPostalCode(addr.postal_code || addr.pincode || "")].filter(Boolean).join(" - "),
        ]
          .filter(Boolean)
          .join(", ");
        if (cityLine.trim()) lines.push(cityLine);
        return lines.join("\n");
      };

      const issuerObj = q.sales_credit_person || selectedEmployeeObj || {};
      const issuerName =
        (issuerObj &&
          ((issuerObj.firstname || issuerObj.first_name)
            ? `${issuerObj.firstname || issuerObj.first_name} ${issuerObj.lastname || issuerObj.last_name || ""}`.trim()
            : issuerObj.name || issuerObj.Name || "")) ||
        "";

      const companyName =
        printerHeader?.header_title || (branch.name || branch.company_name) || company.company_name || "";
      const branchName = printerHeader?.header_subtitle || (branch.name || branch.branch_name) || "";
      const branchGSTIN = printerHeader?.gstin || branch.gst_number || branch.gstin || company.gst_number || "";
      const branchAddress = printerHeader?.address || branch.address || branch.branch_address || company.address || "";
      const branchCity = printerHeader?.address ? "" : (branch.city || "");
      const branchState = printerHeader?.address ? "" : (branch.state || "");
      const branchPincode = printerHeader?.pin || branch.pincode || branch.zip || "";
      const companyPhone = printerHeader?.mobile || branch.phone || company.phone || "";
      const companyEmail = printerHeader?.email || branch.email || company.email || "";

      const bankB = q.company_branch_bank || branch.company_branch_bank || selectedBank || {};
      const bankName = bankB.bankName || bankB.bank_name || branch.bank_name || company.bank_name || "";
      const bankBranch = bankB.branch || bankB.branch_name || bankB.bankBranch || bankB.bank_branch || branch.bank_branch || company.bank_branch || "";
      const accountNo = bankB.accountNo || bankB.account_number || branch.account_number || company.account_number || "";
      const ifscCode = bankB.ifsc || bankB.ifsc_code || branch.ifsc_code || company.ifsc_code || "";

      const rawTerms = q.terms_and_conditions || tandcSelections;
      let termsArr = [];
      if (Array.isArray(rawTerms)) {
        termsArr = rawTerms;
      } else if (typeof rawTerms === "string") {
        try {
          const parsed = JSON.parse(rawTerms);
          if (Array.isArray(parsed)) termsArr = parsed;
          else termsArr = [rawTerms];
        } catch (e) {
          termsArr = [rawTerms];
        }
      }
      const termsText = termsArr
        .map((t, idx) => `${idx + 1}. ${t.TandcName || t.name || t.term || (typeof t === "string" ? t : "")}`)
        .filter((s) => String(s).trim())
        .join("\n");

      const noteText = String(q.note || note || "").trim();

      let subtotalVal = 0;
      items.forEach((item) => {
        const qty = Number(item.quantity || item.qty || 0);
        const rate = Number(item.rate || 0);
        const itemTotal = qty * rate;
        const discAmt = Number(item.discount_amount || item.discount || 0);
        const discPct = Number(item.discount_percentage || item.discountPercent || 0);
        const itemDisc = discAmt > 0 ? discAmt : (itemTotal * discPct) / 100;
        subtotalVal += itemTotal - itemDisc;
      });

      const taxableAmount = subtotalVal;
      const totalTax = Number(
        q.tax_amount ||
          items.reduce((s, it) => s + (Number(it.tax_amount) || (Number(it.cgst || 0) + Number(it.sgst || 0) + Number(it.igst || 0))), 0)
      );

      let cgst = Number(q.cgst_amount || 0);
      let sgst = Number(q.sgst_amount || 0);
      let igst = Number(q.igst_amount || 0);
      if (cgst === 0 && sgst === 0 && igst === 0) {
        cgst = items.reduce((s, it) => s + Number(it.cgst || 0), 0);
        sgst = items.reduce((s, it) => s + Number(it.sgst || 0), 0);
        igst = items.reduce((s, it) => s + Number(it.igst || 0), 0);
      }

      const getGstinStateCode = (gstin) => {
        const gstinStr = String(gstin || "").trim();
        const m = gstinStr.match(/^(\d{2})/);
        return m ? m[1] : "";
      };
      const normalizeState = (v) => String(v || "").trim().toLowerCase();
      const sellerStateCode = getGstinStateCode(branchGSTIN);
      const buyerStateCode = getGstinStateCode(shippingGSTIN || billingGSTIN);
      const isIntraStateByCode = !!(sellerStateCode && buyerStateCode && sellerStateCode === buyerStateCode);
      const isIntraStateByName = !!(
        normalizeState(branchState) &&
        normalizeState(shippingState) &&
        normalizeState(branchState) === normalizeState(shippingState)
      );
      const inferredIntraState = isIntraStateByCode || (!sellerStateCode && !buyerStateCode && isIntraStateByName) || !!isGSTStateMatch;

      let displayCgst = cgst;
      let displaySgst = sgst;
      let displayIgst = igst;
      if (totalTax > 0 && displayCgst === 0 && displaySgst === 0 && displayIgst === 0) {
        if (inferredIntraState) {
          displayCgst = totalTax / 2;
          displaySgst = totalTax / 2;
        } else {
          displayIgst = totalTax;
        }
      }

      const totalQuantity = items.reduce((sum, item) => sum + Number(item.quantity || item.qty || 0), 0);
      const extraChargesArr = Array.isArray(q.extra_charges || extrcharges) ? (q.extra_charges || extrcharges) : [];
      const discountsArr = Array.isArray(q.discounts || additiondiscounts) ? (q.discounts || additiondiscounts) : [];
      const toNumber = (v) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
      };
      const summaryBaseTotal = toNumber(taxableAmount) + toNumber(totalTax);
      const extraChargesTotal = extraChargesArr.reduce((sum, c) => {
        const val = toNumber(c?.value);
        return sum + (c?.type === "percent" ? (summaryBaseTotal * val) / 100 : val);
      }, 0);
      const discountsTotal = discountsArr.reduce((sum, d) => {
        const val = toNumber(d?.value);
        return sum + (d?.type === "percent" ? (summaryBaseTotal * val) / 100 : val);
      }, 0);
      const roundOffAmount = toNumber(q.roundoff_amount);
      const computedGrandTotal = summaryBaseTotal + extraChargesTotal - discountsTotal + roundOffAmount;
      const storedGrandTotal = toNumber(q.grand_total);
      const grandTotalVal = Math.abs(storedGrandTotal - computedGrandTotal) < 0.01 ? storedGrandTotal : computedGrandTotal;

      const rows = [];
      const meta = {
        titleRow: null,
        itemHeaderRow: null,
        itemDataStart: null,
        itemDataEnd: null,
        summaryTitleRow: null,
        grandTotalRow: null,
        bankTitleRow: null,
      };

      rows.push([docType.toUpperCase()]);
      meta.titleRow = rows.length;
      rows.push([`${docType} No.`, quotationNumber || "-"]);
      rows.push([
        "Date",
        quotationDate ? new Date(quotationDate).toLocaleDateString("en-IN") : new Date().toLocaleDateString("en-IN"),
      ]);
      if (printConfig.validTill) {
        rows.push(["Valid Till", validTill ? new Date(validTill).toLocaleDateString("en-IN") : "-"]);
      }
      rows.push(["Reference", references || q.references || "-"]);
      rows.push(["Issued By", issuerName || "-"]);

      rows.push([]);
      if (printConfig.header) {
        rows.push(["Branch / Company", branchName || companyName || "-"]);
        rows.push(["Address", branchAddress || "-"]);
        const addrTail = [branchCity, branchState, branchPincode].filter(Boolean).join(", ");
        if (addrTail) rows.push(["", addrTail]);
        if (branchGSTIN) rows.push(["GSTIN", branchGSTIN]);
        if (companyPhone) rows.push(["Phone", companyPhone]);
        if (companyEmail) rows.push(["Email", companyEmail]);
        rows.push([]);
      }

      rows.push(["Customer", customerName]);
      if (printConfig.partyInformation) {
        rows.push(["Billing address", fmtAddrBlock(bAddr, billingCompanyName, billingPersonName)]);
        rows.push(["Shipping address", fmtAddrBlock(sAddr, shippingCompanyName, shippingPersonName)]);
        if (printConfig.gstin) {
          rows.push(["Billing GSTIN", billingGSTIN]);
          rows.push(["Shipping GSTIN", shippingGSTIN]);
        }
      }

      rows.push([]);
      const headerRow = ["S.No", "Description"];
      if (printConfig.itemCode) headerRow.push("Item Code");
      if (printConfig.hsnSac) headerRow.push("HSN/SAC");
      headerRow.push("Qty", "Unit");
      if (printConfig.itemFixedRate) headerRow.push("Fixed Rate");
      if (printConfig.itemRate) headerRow.push("Rate");
      if (printConfig.discountRate) headerRow.push("Disc %");
      if (printConfig.discountAmt) headerRow.push("Disc Amt");
      if (printConfig.taxableAmt) headerRow.push("Taxable");
      if (printConfig.gstAmounts) headerRow.push("GST %");
      if (printConfig.leadTime) headerRow.push("Lead Time");
      headerRow.push("Line Total");
      rows.push(headerRow);
      meta.itemHeaderRow = rows.length;
      meta.itemDataStart = meta.itemHeaderRow + 1;

      items.forEach((item, idx) => {
        const quantity = Number(item.quantity || item.qty) || 0;
        const rate = Number(item.rate) || 0;
        const itemTotal = quantity * rate;
        const discountPct = Number(item.discount_percentage || item.discountPercent || 0);
        const discountAmt = itemTotal * (discountPct / 100);
        const taxable = itemTotal - discountAmt;
        const finalAmount = Number(
          item.line_total ||
            item.amount ||
            taxable +
              Number(item.tax_amount || (Number(item.cgst || 0) + Number(item.sgst || 0) + Number(item.igst || 0)))
        );
        const fixedRateValue = Number(
          item.fixedRate ??
            item.fixed_rate ??
            item.fixed_price ??
            item.FixedRate ??
            item.fixedrate ??
            item.rate ??
            0
        );

        const row = [idx + 1, item.product_name || item.name || item.description || item.desc || "-"];
        if (printConfig.itemCode) row.push(item.product_code || item.item_code || item.sku || "-");
        if (printConfig.hsnSac) row.push(item.hsncode || item.hsn_code || item.hsn || "-");
        row.push(quantity, item.unit || "Nos");
        if (printConfig.itemFixedRate) row.push(fixedRateValue);
        if (printConfig.itemRate) row.push(rate);
        if (printConfig.discountRate) row.push(Math.round(discountPct));
        if (printConfig.discountAmt) row.push(discountAmt);
        if (printConfig.taxableAmt) row.push(taxable);
        if (printConfig.gstAmounts) row.push(Number(item.gst || 0));
        if (printConfig.leadTime) row.push(item.lead_time || item.leadTime || "-");
        row.push(finalAmount);
        rows.push(row);
      });
      meta.itemDataEnd = rows.length;

      rows.push([]);
      rows.push(["Summary"]);
      meta.summaryTitleRow = rows.length;
      rows.push(["Total before tax (₹)", taxableAmount]);
      if (printConfig.totalQuantity) rows.push(["Total quantity", totalQuantity]);
      if (printConfig.gstSummary) {
        if (displayIgst > 0) rows.push(["IGST (₹)", displayIgst]);
        if (displayCgst > 0) rows.push(["CGST (₹)", displayCgst]);
        if (displaySgst > 0) rows.push(["SGST (₹)", displaySgst]);
      }
      rows.push(["Tax total (₹)", totalTax]);
      rows.push(["Subtotal with tax (₹)", summaryBaseTotal]);

      extraChargesArr.forEach((c) => {
        const lbl = `${c.title || ""} (${c.type === "percent" ? `${c.value}%` : `₹${c.value}`})`;
        const amt = c.type === "percent" ? (summaryBaseTotal * toNumber(c.value)) / 100 : toNumber(c.value);
        rows.push([lbl, amt]);
      });

      discountsArr.forEach((d) => {
        const lbl = `${d.title || ""} (${d.type === "percent" ? `${d.value}%` : `₹${d.value}`})`;
        const amt = d.type === "percent" ? (summaryBaseTotal * toNumber(d.value)) / 100 : toNumber(d.value);
        rows.push([`${lbl} (deduction)`, -amt]);
      });

      if (roundOffAmount) rows.push(["Round off (₹)", roundOffAmount]);
      rows.push(["Grand total (₹)", grandTotalVal]);
      meta.grandTotalRow = rows.length;
      rows.push(["Amount in words", `Rupees ${numberToWordsInr(grandTotalVal)} only`]);

      rows.push([]);
      if (printConfig.bankDetails) {
        rows.push(["Bank details"]);
        meta.bankTitleRow = rows.length;
        rows.push(["Bank", bankName || "-"]);
        rows.push(["Branch", bankBranch || "-"]);
        rows.push(["Account No.", accountNo || "-"]);
        if (ifscCode) rows.push(["IFSC", ifscCode]);
      }

      rows.push([]);
      rows.push(["Terms & Conditions", termsText || "-"]);
      if (printConfig.notes) {
        rows.push(["Notes", noteText || "-"]);
      }

      const maxCol = headerRow.length;
      const sheetName = (docType || "Document").slice(0, 31).replace(/[[\]:*?/\\]/g, "") || "Document";

      const borderColor = { argb: "FF9CA3AF" };
      const borderThin = { style: "thin", color: borderColor };
      const borderAll = { top: borderThin, left: borderThin, bottom: borderThin, right: borderThin };

      const fillLabel = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
      const fillHeader = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE5E7EB" } };
      const fillZebra = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
      const fillSection = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
      const fillGrand = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEEF2FF" } };

      const wb = new ExcelJS.Workbook();
      wb.creator = "ERP";
      const ws = wb.addWorksheet(sheetName, {
        views: [{ showGridLines: false }],
        pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
      });

      const numFmtMoney = "#,##0.00";
      const numFmtInt = "#,##0";

      rows.forEach((cells, idx) => {
        const r = idx + 1;
        if (!cells || cells.length === 0) {
          ws.getRow(r).height = 4;
          return;
        }
        cells.forEach((val, j) => {
          const c = j + 1;
          const cell = ws.getCell(r, c);
          cell.value = val;
          cell.border = borderAll;
          if (typeof val === "number" && Number.isFinite(val)) {
            if (cells.length === maxCol) {
              const h = headerRow[j];
              if (h === "S.No" || h === "Qty" || h === "GST %" || h === "Disc %") cell.numFmt = numFmtInt;
              else cell.numFmt = numFmtMoney;
            } else if (cells.length === 2 && j === 1) {
              const label = String(cells[0] || "");
              if (label === "Total quantity") cell.numFmt = numFmtInt;
              else cell.numFmt = numFmtMoney;
            }
          }
        });
      });

      if (meta.titleRow) {
        ws.mergeCells(meta.titleRow, 1, meta.titleRow, maxCol);
        const t = ws.getCell(meta.titleRow, 1);
        t.font = { size: 18, bold: true, color: { argb: "FF0F172A" } };
        t.alignment = { horizontal: "center", vertical: "middle" };
        for (let c = 1; c <= maxCol; c++) {
          ws.getCell(meta.titleRow, c).border = {
            top: borderThin,
            left: borderThin,
            right: borderThin,
            bottom: { style: "medium", color: { argb: "FF6B7280" } },
          };
        }
        ws.getRow(meta.titleRow).height = 32;
      }

      const applyKvBlock = (startR, endR) => {
        for (let r = startR; r <= endR; r++) {
          const row = ws.getRow(r);
          const v2 = row.getCell(2).value;
          if (v2 === undefined || v2 === "") continue;
          try {
            ws.mergeCells(r, 2, r, maxCol);
          } catch (e) {
            /* ignore merge errors */
          }
          row.getCell(1).fill = fillLabel;
          row.getCell(1).font = { bold: true, color: { argb: "FF1F2937" } };
          row.getCell(1).alignment = { vertical: "top", wrapText: true };
          row.getCell(2).alignment = { vertical: "top", wrapText: true };
        }
      };

      if (meta.itemHeaderRow) {
        applyKvBlock(2, meta.itemHeaderRow - 1);
      }

      if (meta.itemHeaderRow) {
        const hr = ws.getRow(meta.itemHeaderRow);
        hr.font = { bold: true, color: { argb: "FF111827" } };
        hr.height = 22;
        for (let c = 1; c <= maxCol; c++) {
          const cell = ws.getCell(meta.itemHeaderRow, c);
          cell.fill = fillHeader;
          cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
          cell.border = borderAll;
        }
      }

      if (meta.itemDataEnd >= meta.itemDataStart) {
        for (let r = meta.itemDataStart; r <= meta.itemDataEnd; r++) {
          const zebra = (r - meta.itemDataStart) % 2 === 1;
          const row = ws.getRow(r);
          row.height = 18;
          for (let c = 1; c <= maxCol; c++) {
            const cell = ws.getCell(r, c);
            if (zebra) cell.fill = fillZebra;
            const h = headerRow[c - 1];
            if (h === "S.No" || h === "Qty") cell.alignment = { horizontal: "center", vertical: "middle" };
            else if (h === "Description" || h === "Item Code" || h === "HSN/SAC" || h === "Unit" || h === "Lead Time") {
              cell.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
            } else {
              cell.alignment = { horizontal: "right", vertical: "middle" };
            }
          }
        }
      }

      if (meta.summaryTitleRow) {
        ws.mergeCells(meta.summaryTitleRow, 1, meta.summaryTitleRow, maxCol);
        const c0 = ws.getCell(meta.summaryTitleRow, 1);
        c0.font = { bold: true, size: 12, color: { argb: "FF0F172A" } };
        c0.fill = fillSection;
        c0.alignment = { horizontal: "left", vertical: "middle" };
        for (let c = 1; c <= maxCol; c++) ws.getCell(meta.summaryTitleRow, c).border = borderAll;
      }

      const amountWordsArrIdx = rows.findIndex((row) => String(row[0] || "").startsWith("Amount in words"));
      const amountWordsExcelRow = amountWordsArrIdx >= 0 ? amountWordsArrIdx + 1 : null;
      if (meta.summaryTitleRow && amountWordsExcelRow && amountWordsExcelRow > meta.summaryTitleRow + 1) {
        applyKvBlock(meta.summaryTitleRow + 1, amountWordsExcelRow);
      }

      if (meta.grandTotalRow) {
        const row = ws.getRow(meta.grandTotalRow);
        row.font = { bold: true, size: 12 };
        row.getCell(1).fill = fillGrand;
        row.getCell(2).fill = fillGrand;
        row.getCell(2).numFmt = numFmtMoney;
      }

      if (meta.bankTitleRow) {
        ws.mergeCells(meta.bankTitleRow, 1, meta.bankTitleRow, maxCol);
        const b = ws.getCell(meta.bankTitleRow, 1);
        b.font = { bold: true, size: 12, color: { argb: "FF0F172A" } };
        b.fill = fillSection;
        b.alignment = { horizontal: "left", vertical: "middle" };
        for (let c = 1; c <= maxCol; c++) ws.getCell(meta.bankTitleRow, c).border = borderAll;
        const bankArrIdx = rows.findIndex((row) => row[0] === "Bank details");
        const termsArrIdx = rows.findIndex((row) => row[0] === "Terms & Conditions");
        if (bankArrIdx >= 0 && termsArrIdx > bankArrIdx + 1) {
          applyKvBlock(bankArrIdx + 2, termsArrIdx);
        }
      }

      const termsIdx = rows.findIndex((row) => row[0] === "Terms & Conditions");
      if (termsIdx >= 0) {
        const tr = termsIdx + 1;
        try {
          ws.mergeCells(tr, 2, tr, maxCol);
        } catch (e) {
          /* ignore */
        }
        ws.getRow(tr).getCell(1).fill = fillLabel;
        ws.getRow(tr).getCell(1).font = { bold: true };
        ws.getRow(tr).getCell(2).alignment = { wrapText: true, vertical: "top" };
        ws.getRow(tr).height = 80;
      }

      const notesIdx = rows.findIndex((row) => row[0] === "Notes");
      if (notesIdx >= 0) {
        const nr = notesIdx + 1;
        try {
          ws.mergeCells(nr, 2, nr, maxCol);
        } catch (e) {
          /* ignore */
        }
        ws.getRow(nr).getCell(1).fill = fillLabel;
        ws.getRow(nr).getCell(1).font = { bold: true };
        ws.getRow(nr).getCell(2).alignment = { wrapText: true, vertical: "top" };
      }

      headerRow.forEach((h, i) => {
        let w = 12;
        if (h === "S.No") w = 6;
        else if (h === "Description") w = 42;
        else if (h === "Item Code") w = 14;
        else if (h === "HSN/SAC") w = 12;
        else if (h === "Qty" || h === "Unit" || h === "GST %" || h === "Disc %") w = 9;
        else if (String(h).includes("Rate") || String(h).includes("Taxable") || String(h).includes("Total") || String(h).includes("Amt")) w = 14;
        ws.getColumn(i + 1).width = w;
      });

      const buf = await wb.xlsx.writeBuffer();
      const blob = new Blob([buf], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const safeBase = `${docType}_${quotationNumber || "Draft"}`
        .replace(/[/\\:*?"<>|]+/g, "_")
        .replace(/\s+/g, "_")
        .slice(0, 160);
      const fname = `${safeBase}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fname;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Excel export failed", e);
      alert("Failed to export Excel. See console for details.");
    }
}

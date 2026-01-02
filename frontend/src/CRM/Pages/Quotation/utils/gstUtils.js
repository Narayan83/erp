export const getStateCodeFromGSTIN = (gstin) => {
  if (!gstin) return "";
  const s = String(gstin).trim();
  if (s.length < 2) return "";
  return s.slice(0, 2);
};

export const doGSTsMatchState = (buyerGSTIN, sellerGSTIN) => {
  const buyerState = getStateCodeFromGSTIN(buyerGSTIN);
  const sellerState = getStateCodeFromGSTIN(sellerGSTIN);
  // If buyer GST missing or empty, treat as same state (conservative)
  if (!buyerState) return true;
  return buyerState === sellerState;
};

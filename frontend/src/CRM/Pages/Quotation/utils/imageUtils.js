import { BASE_URL } from "../../../../config/Config"; // adjust path


// Normalize image path into a full URL (mirrors product_list_page helper)
export const normalizeImageUrl = (img) => {
  if (!img || typeof img !== 'string') return null;
  const trimmed = img.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  if (lower.startsWith('http://') || lower.startsWith('https://') || lower.startsWith('data:')) return trimmed;
  const normalized = trimmed.replace(/\\/g, '/');
  if (normalized.startsWith('uploads/')) return `${BASE_URL}/${normalized}`;
  return `${BASE_URL}/uploads/${normalized}`;
};


// Pick a single sensible image URL for a product object (inspect variants too)
 export const getProductImage = (p) => {
  if (!p) return null;
  // direct fields
  const candidates = [p.image, p.thumbnail, p.Image, p.MainImage, p.mainImage];
  for (const c of candidates) {
    const url = normalizeImageUrl(c);
    if (url) return url;
  }

  // inspect variants for Images array or Image/MainImage
  const variants = Array.isArray(p.Variants) ? p.Variants : (Array.isArray(p.variants) ? p.variants : []);
  for (const v of variants) {
    // MainImageIndex and Images
    const imgs = Array.isArray(v?.Images) ? v.Images : (Array.isArray(v?.images) ? v.images : []);
    if (Array.isArray(imgs) && imgs.length > 0) {
      const url = normalizeImageUrl(imgs[0]);
      if (url) return url;
    }
    const single = v?.MainImage || v?.Image || v?.image || v?.thumbnail;
    const url2 = normalizeImageUrl(single);
    if (url2) return url2;
  }

  return null;
};



export const splitQuotationNumber = (full, prefix, postfix) => {
  if (!full) return { prefix: "", number: "", postfix: "" };

  let middle = full;

  if (prefix && middle.startsWith(prefix)) {
    middle = middle.slice(prefix.length);
  }

  if (postfix && middle.endsWith(postfix)) {
    middle = middle.slice(0, -postfix.length);
  }

  return {
    prefix,
    number: middle,
    postfix,
  };
};
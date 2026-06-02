export interface ProductLookupResult {
  name: string | null;
  brand: string | null;
  imageUrl: string | null;
  source: "openfoodfacts" | null;
}

interface OpenFoodFactsResponse {
  status: number;
  product?: {
    product_name?: string;
    product_name_ja?: string;
    product_name_en?: string;
    brands?: string;
    image_url?: string;
    image_front_url?: string;
  };
}

export async function lookupProductByBarcode(
  barcode: string,
  signal?: AbortSignal,
): Promise<ProductLookupResult> {
  const trimmed = barcode.trim();
  if (!trimmed) {
    return { name: null, brand: null, imageUrl: null, source: null };
  }

  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(trimmed)}.json`;
  const response = await fetch(url, { signal });
  if (!response.ok) {
    return { name: null, brand: null, imageUrl: null, source: null };
  }
  const data = (await response.json()) as OpenFoodFactsResponse;
  if (data.status !== 1 || !data.product) {
    return { name: null, brand: null, imageUrl: null, source: null };
  }
  const p = data.product;
  const name =
    p.product_name_ja?.trim() ||
    p.product_name?.trim() ||
    p.product_name_en?.trim() ||
    null;
  return {
    name,
    brand: p.brands?.trim() || null,
    imageUrl: p.image_front_url || p.image_url || null,
    source: "openfoodfacts",
  };
}

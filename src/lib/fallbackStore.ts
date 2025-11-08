type MemoryImage = { id: number; url: string };

type MemoryProduct = {
  id: number;
  name: string;
  price: number;
  description: string | null;
  category: string | null;
  orderFormUrl: string | null;
  image: MemoryImage | null;
  locale?: string | null;
};

export type NormalizedProductPayload = {
  name: string;
  price: number;
  description: string | null;
  category: string | null;
  orderFormUrl: string | null;
  imageId: number | null;
  locale?: string | null;
};

type FallbackStore = {
  products: MemoryProduct[];
  images: Map<number, MemoryImage>;
  nextProductId: number;
  nextImageId: number;
};

const globalAny = globalThis as any;

function initialiseStore(): FallbackStore {
  return {
    products: [],
    images: new Map<number, MemoryImage>(),
    nextProductId: 1,
    nextImageId: 1001,
  };
}

if (!globalAny.__orangeBoyFallbackStore) {
  globalAny.__orangeBoyFallbackStore = initialiseStore();
}

const store: FallbackStore = globalAny.__orangeBoyFallbackStore;

function resolveImage(imageId: number | null | undefined): MemoryImage | null {
  if (imageId == null || !Number.isFinite(imageId)) return null;
  return store.images.get(imageId) ?? null;
}

function productToAttributes(product: MemoryProduct) {
  return {
    name: product.name,
    price: product.price,
    description: product.description,
    category: product.category,
    orderFormUrl: product.orderFormUrl,
    locale: product.locale ?? null,
    image: product.image
      ? {
          data: {
            id: product.image.id,
            attributes: { url: product.image.url },
          },
        }
      : null,
  };
}

function toStrapiEntity(product: MemoryProduct) {
  return {
    id: product.id,
    attributes: productToAttributes(product),
  };
}

export function serializeProductCollection() {
  return {
    data: store.products.map(toStrapiEntity),
    meta: {
      source: "fallback",
      count: store.products.length,
    },
  };
}

export function createFallbackProduct(payload: NormalizedProductPayload) {
  const newProduct: MemoryProduct = {
    id: store.nextProductId++,
    name: payload.name.trim(),
    price: payload.price,
    description: payload.description ?? null,
    category: payload.category ?? null,
    orderFormUrl: payload.orderFormUrl ?? null,
    image: resolveImage(payload.imageId),
    locale: payload.locale ?? null,
  };
  store.products.push(newProduct);
  return {
    data: toStrapiEntity(newProduct),
    meta: { source: "fallback" },
  };
}

export function updateFallbackProduct(
  id: number,
  payload: NormalizedProductPayload
) {
  const target = store.products.find((p) => p.id === id);
  if (!target) return null;
  target.name = payload.name.trim();
  target.price = payload.price;
  target.description = payload.description ?? null;
  target.category = payload.category ?? null;
  target.orderFormUrl = payload.orderFormUrl ?? null;
  target.image = resolveImage(payload.imageId);
  target.locale = payload.locale ?? target.locale ?? null;
  return {
    data: toStrapiEntity(target),
    meta: { source: "fallback" },
  };
}

export function deleteFallbackProduct(id: number) {
  const index = store.products.findIndex((p) => p.id === id);
  if (index === -1) return false;
  store.products.splice(index, 1);
  return true;
}

export function createFallbackImage(url: string) {
  const image: MemoryImage = { id: store.nextImageId++, url };
  store.images.set(image.id, image);
  return image;
}

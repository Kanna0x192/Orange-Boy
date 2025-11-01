export type Product = {
    id: number;
    name: string;
    price: number;
    description?: string | null;
    category?: "food" | "snack" | "tea" | "juice" | "all" | string | null;
    image?: { url: string } | null;
    orderFormUrl?: string | null;
  };
  
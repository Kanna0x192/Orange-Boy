export type Product = {
    id: number;
    name: string;
    price: number;
    description?: string | null;
    category?: "food" | "snack" | "tea" | "juice" | "all" | string | null;
    image?: { id?: number; url: string } | null;
    orderFormUrl?: string | null;
  };
  

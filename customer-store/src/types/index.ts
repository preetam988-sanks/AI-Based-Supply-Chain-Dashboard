// src/types/index.ts
export interface ProductImage {
  id: number;
  image_url: string;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  selling_price: number;
  stock_quantity: number;
  category?: string;
  images?: ProductImage[];
}

export interface DemandForecastPoint {
  date: string;
  value: number;
}

export interface DemandForecast {
  forecast: DemandForecastPoint[];
}

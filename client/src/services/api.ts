import axios from "axios";
// Import all necessary types from the types definition file
import type {
  AnalyticsSummary,
  Order,
  Product,
  User,
  Vehicle,
  UserCreate,
  ProductCreate,
  ProductUpdate,
  UserUpdate,
  OrderCreate,
  OrderUpdate,
  AppSetting,
  AppSettingsUpdate,
  LowStockProduct,
  DemandForecast,
} from "@/types";

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:9090/api/server";

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// --- STEP 2: Add the Interceptor (The Security Secret) ---
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface RevenueDataPoint {
  date: string;
  revenue: number;
}

export interface MonthlyRevenueDataPoint {
  month: string; // e.g., "Jan", "Feb"
  revenue: number;
}

// -- Data Fetching Functions --

// Fetches the main analytics summary for the dashboard
export const getDashboardSummary = () =>
  apiClient.get<AnalyticsSummary>("/analytics/summary");

// Fetches the list of all products
export const getProducts = () =>
  apiClient.get<Product[]>("/inventory/products");

// Fetches the list of all orders
export const getOrders = () => apiClient.get<Order[]>("/orders/");

// Fetches the list of all vehicles
export const getVehicles = () =>
  apiClient.get<Vehicle[]>("/logistics/vehicles");

// Fetches the list of all users
export const getUsers = () => apiClient.get<User[]>("/users/");

/**
 * Fetches a list of products that are low in stock.
 */
export const getLowStockProducts = () =>
  apiClient.get<{ data: LowStockProduct[] }>("/analytics/low-stock-products");

/**
 * Fetches 30-day demand forecast.
 * @param productId (Optional) If provided, forecasts for this specific product ID.
 */
export const getDemandForecast = (productId?: number) =>
  apiClient.get<DemandForecast>("/forecast", {
    params: { product_id: productId }, // Pass product_id as a query param if it exists
  });

/**
 * Fetches daily revenue for a specified number of past days.
 * @param days Number of past days (default: 30).
 */
export const getRevenueOverTime = (days: number = 30) =>
  apiClient.get<{ data: RevenueDataPoint[] }>("/analytics/revenue-over-time", {
    params: { days },
  });

/**
 * Fetches revenue data grouped by month for the specified number of months.
 * @param months Number of past months to fetch data for (default: 6).
 */
export const getMonthlyRevenue = (months: number = 6) =>
  apiClient.get<{ data: MonthlyRevenueDataPoint[] }>(
    "/analytics/monthly-revenue",
    {
      params: { months }, // Pass 'months' as a query parameter
    }
  );

// -- Data Creation Functions --
export const createUser = (userData: UserCreate) =>
  apiClient.post<User>("/users/", userData);
export const createProduct = (productData: ProductCreate) =>
  apiClient.post<Product>("/inventory/products", productData);
export const createOrder = (orderData: OrderCreate) =>
  apiClient.post<Order>("/orders/", orderData);

// -- Data Modification Functions --
export const updateProduct = (productId: number, productData: ProductUpdate) =>
  apiClient.put<Product>(`/inventory/products/${productId}`, productData);
export const deleteProduct = (productId: number) =>
  apiClient.delete(`/inventory/products/${productId}`);
export const updateUser = (userId: number, userData: UserUpdate) =>
  apiClient.put<User>(`/users/${userId}`, userData);
export const deleteUser = (userId: number) =>
  apiClient.delete(`/users/${userId}`);
export const updateOrder = (orderId: number, orderData: OrderUpdate) =>
  apiClient.put<Order>(`/orders/${orderId}`, orderData);
export const deleteOrder = (orderId: number) =>
  apiClient.delete(`/orders/${orderId}`);

// -- AI Helper Functions --
/**
 * Calls the AI endpoint to generate a product description.
 */
export const generateDescription = (productName: string, category?: string) =>
  apiClient.post<{ description: string }>("/ai/generate-description", {
    product_name: productName,
    category: category,
  });

// -- App Settings Functions --
export const getSettings = () => apiClient.get<AppSetting[]>("/settings/");
export const updateSettings = (settingsData: AppSettingsUpdate) =>
  apiClient.put<AppSetting[]>("/settings/", settingsData);


export const uploadInventoryCSV = (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return apiClient.post<{
    message: string;
    products_added: number;
    products_updated: number;
    errors: string[];
    error_report_id?: string;
  }>("/bulk/inventory/upload-csv", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};


export const uploadOrdersCSV = (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return apiClient.post<{
    message: string;
    orders_created: number;
    errors: string[];
    error_report_id?: string;
  }>("/bulk/orders/upload-csv", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};


export const exportInventoryCSV = () =>
  apiClient.get("/bulk/inventory/export-csv", { responseType: "blob" });
export const exportOrdersCSV = () =>
  apiClient.get("/bulk/orders/export-csv", { responseType: "blob" });


export const downloadInventoryTemplate = () =>
  apiClient.get("/bulk/inventory/template", { responseType: "blob" });
export const downloadOrderTemplate = () =>
  apiClient.get("/bulk/orders/template", { responseType: "blob" });


export const downloadInventoryErrorFile = (reportId: string) =>
  apiClient.get(`/bulk/inventory/download-errors/${reportId}`, {
    responseType: "blob",
  });
export const downloadOrderErrorFile = (reportId: string) =>
  apiClient.get(`/bulk/orders/download-errors/${reportId}`, {
    responseType: "blob",
  });
export const createVehicle = (vehicleData: any) => {
  return apiClient.post("/logistics/vehicles", vehicleData);
};
export const getRawSalesReport = async () => {
  return await apiClient.get("/analytics/export-raw-sales");
};

const publicClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});
export const registerUser = (data: any) =>
    publicClient.post("/users/", data);

export const forgotPassword = (email: string) =>
    publicClient.post(`/users/forgot-password?email=${email}`);

export const resetPassword = (data: any) =>
    publicClient.post("/users/reset-password", data);

export const loginUser = (credentials: any) =>
    publicClient.post("/users/login", credentials);



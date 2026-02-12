import React, { useEffect, useState } from "react";
// Import API functions
import {
  getDashboardSummary,
  getRevenueOverTime,
  getRawSalesReport,
  type RevenueDataPoint,
} from "@/services/api";
import type { AnalyticsSummary } from "@/types";
// Import Lucide icons - Added CalendarDays
import { Download, AlertTriangle, TrendingUp, ListChecks, CalendarDays } from "lucide-react";
// Import individual analytics components
import { KpiCardGrid } from "@/components/Analytics/KpiCardGrid";
import { TopProductsChart } from "@/components/Analytics/TopProductsChart";
import { DeliveryPieChart } from "@/components/Analytics/DeliveryPieChart";
import { OrderStatusChart } from "@/components/Analytics/OrderStatusChart";
import { RevenueChart } from "@/components/Analytics/RevenueChart";
import { LowStockProductsList } from "@/components/Analytics/LowStockProductsList";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
                                                               isOpen,
                                                               onClose,
                                                               onConfirm,
                                                               title,
                                                               message,
                                                             }) => {
  if (!isOpen) return null;
  return (
      <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
        <div className="bg-zinc-900 rounded-lg shadow-xl p-6 w-full max-w-sm relative border border-zinc-700 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 mb-4">
            <AlertTriangle className="h-6 w-6 text-blue-500" aria-hidden="true" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
          <p className="text-zinc-400 mb-6">{message}</p>
          <div className="flex justify-center gap-4">
            <button
                type="button"
                onClick={onClose}
                className="w-full bg-zinc-700 hover:bg-zinc-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
                type="button"
                onClick={onConfirm}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Download Again
            </button>
          </div>
        </div>
      </div>
  );
};

const AnalyticsPage: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([]);
  const [revenueLoading, setRevenueLoading] = useState(true);
  const [revenueError, setRevenueError] = useState<string | null>(null);
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  // State for the new Yearly button
  const [isYearlyLoading, setIsYearlyLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      setSummaryLoading(true);
      setRevenueLoading(true);
      setRevenueError(null);

      try {
        const summaryResponse = await getDashboardSummary();
        setAnalyticsData(summaryResponse.data);
        setSummaryLoading(false);

        const revenueResponse = await getRevenueOverTime(30);
        const sortedData = revenueResponse.data.data.sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        setRevenueData(sortedData);
        setRevenueLoading(false);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        setRevenueError("Could not load analytics. Please check your connection.");
        setSummaryLoading(false);
        setRevenueLoading(false);
      }
    };

    fetchData();
  }, []);

  const performDownload = () => {
    if (!analyticsData) return;

    const escapeCsv = (str: string | undefined | null): string => {
      if (str === undefined || str === null) return '""';
      const s = String(str);
      return `"${s.replace(/"/g, '""')}"`;
    };

    let csvContent = "KPI Summary\nMetric,Value\n";
    analyticsData.kpi_cards.forEach((card) => {
      csvContent += `${escapeCsv(card.title)},${escapeCsv(card.value)}\n`;
    });
    csvContent += "\nTop Selling Products\nProduct Name,Units Sold\n";
    analyticsData.top_selling_products.forEach((product) => {
      csvContent += `${escapeCsv(product.name)},${product.value}\n`;
    });
    csvContent += "\nDelivery Status\nStatus,Count\n";
    csvContent += `On-Time,${analyticsData.delivery_status.on_time}\n`;
    csvContent += `Delayed,${analyticsData.delivery_status.delayed}\n`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `summary-report-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setHasDownloaded(true);
    setIsConfirmModalOpen(false);
  };

  /**
   * UPDATED: Exports AI Data restricted to only the CURRENT MONTH
   */
  const handleExportAiData = async () => {
    try {
      const response = await getRawSalesReport();
      let data = response.data;

      if (!data || data.length === 0) {
        alert("No data available to export.");
        return;
      }

      // Filter: Only include items from the current month and year
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const filteredData = data.filter((item: any) => {
        const itemDate = new Date(item.date);
        return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear;
      });

      if (filteredData.length === 0) {
        alert("No sales data found for the current month.");
        return;
      }

      const headers = "date,product,quantity,revenue,cost_price";
      const rows = filteredData.map((item: any) =>
          `${item.date},"${item.product}",${item.quantity},${item.revenue},${item.cost_price}`
      );
      const csvContent = [headers, ...rows].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `monthly-ai-source-${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("AI Data Export failed:", error);
      alert("Error exporting monthly AI data.");
    }
  };

  /**
   * NEW: Triggers the Yearly AI Review (Exports full history)
   */
  const handleYearlyAiReview = async () => {
    setIsYearlyLoading(true);
    try {
      // Assuming your api.ts has a getYearlyReviewReport function or using direct fetch
      const token = localStorage.getItem("token");
      const response = await fetch('http://localhost:8000/api/analytics/yearly-review', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();

      if (!result.data || result.data.length === 0) {
        alert("No yearly data found.");
        return;
      }

      const headers = "date,revenue";
      const rows = result.data.map((item: any) => `${item.date},${item.revenue}`);
      const csvContent = [headers, ...rows].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `yearly-ai-report-${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert("Yearly AI Data Prepared! Upload this to identify seasonal trends.");
    } catch (error) {
      console.error("Yearly Review Error:", error);
      alert("Failed to generate yearly report.");
    } finally {
      setIsYearlyLoading(false);
    }
  };

  const handleDownloadReport = () => {
    if (hasDownloaded) {
      setIsConfirmModalOpen(true);
    } else {
      performDownload();
    }
  };

  const isLoading = summaryLoading || revenueLoading;

  return (
      <>
        <ConfirmationModal
            isOpen={isConfirmModalOpen}
            onClose={() => setIsConfirmModalOpen(false)}
            onConfirm={performDownload}
            title="Confirm Download"
            message="You have already downloaded the summary. Download again?"
        />

        <div className="flex flex-col gap-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Analytics & Reports</h1>
              <p className="text-sm text-zinc-400">Manage performance and AI insights.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                  onClick={handleDownloadReport}
                  disabled={!analyticsData || summaryLoading}
                  className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-2.5 px-4 rounded-lg border border-zinc-700 disabled:opacity-50"
              >
                <Download size={18} />
                <span>Summary CSV</span>
              </button>

              {/* NEW: Yearly AI Review Button */}
              <button
                  onClick={handleYearlyAiReview}
                  disabled={isYearlyLoading}
                  className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow-lg border border-indigo-500/20 transition-all"
              >
                <CalendarDays size={18} />
                <span>{isYearlyLoading ? "Processing..." : "AI Yearly Review"}</span>
              </button>

              <button
                  onClick={handleExportAiData}
                  disabled={summaryLoading}
                  className="flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow-lg border border-cyan-500/20"
              >
                <TrendingUp size={18} />
                <span>Prepare AI Data</span>
              </button>
            </div>
          </div>

          {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin h-10 w-10 border-4 border-cyan-500 border-t-transparent rounded-full"></div>
                <p className="ml-4 text-zinc-400">Loading analytics...</p>
              </div>
          ) : !analyticsData ? (
              <div className="flex justify-center items-center h-64 bg-zinc-900 rounded-lg">
                <p className="text-red-400 font-semibold">{revenueError || "Could not load data."}</p>
              </div>
          ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <KpiCardGrid kpi_cards={analyticsData.kpi_cards} />
                <LowStockProductsList />
                <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
                  <h2 className="text-xl font-semibold text-white mb-4">Top Selling Products</h2>
                  <TopProductsChart data={analyticsData.top_selling_products} />
                </div>
                <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
                  <h2 className="text-xl font-semibold text-white mb-4">Delivery Status</h2>
                  <DeliveryPieChart data={analyticsData.delivery_status} />
                </div>
                <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
                  <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <ListChecks size={20} className="text-amber-400" />
                    Order Status
                  </h2>
                  <OrderStatusChart data={analyticsData.order_status_breakdown} />
                </div>
                <div className="bg-zinc-900 rounded-lg p-6 md:col-span-2 xl:col-span-3 border border-zinc-800">
                  <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <TrendingUp size={20} className="text-cyan-400" />
                    Revenue (30 Days)
                  </h2>
                  <RevenueChart data={revenueData} />
                </div>
              </div>
          )}
        </div>
      </>
  );
};

export default AnalyticsPage;
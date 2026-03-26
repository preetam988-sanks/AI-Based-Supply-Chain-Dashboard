import React, { useState, useEffect, useCallback } from "react";
import {
    BrainCircuit, Upload, MessageSquare, AlertCircle, DollarSign,
    History as HistoryIcon, Clock, Search, TrendingUp, Star, Calendar, Loader2, CheckCircle2
} from "lucide-react";

// --- Sub-Component: Seasonal Performance Table ---
const SeasonalTable = ({ data }: { data: any[] }) => (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="p-4 border-b border-zinc-800 font-bold flex items-center gap-2 text-cyan-400 bg-zinc-900/50">
            <Calendar className="w-4 h-4" />
            Monthly Peak Performance: Top 3 Products
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-300">
                <thead className="bg-zinc-950 text-zinc-500 uppercase text-[10px] tracking-widest border-b border-zinc-800">
                <tr>
                    <th className="px-6 py-4">Month</th>
                    <th className="px-6 py-4 text-cyan-400">
                        <div className="flex items-center gap-1"><Star className="w-3 h-3 fill-cyan-400"/> Rank #1</div>
                    </th>
                    <th className="px-6 py-4">Rank #2</th>
                    <th className="px-6 py-4">Rank #3</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                {data.map((item, i) => (
                    <tr key={i} className="hover:bg-zinc-800/50 transition-colors group">
                        <td className="px-6 py-5 font-bold text-white bg-zinc-950/30 border-r border-zinc-800/50">{item.month}</td>
                        {[0, 1, 2].map((idx) => (
                            <td key={idx} className="px-6 py-5">
                                {item.top_products && item.top_products[idx] ? (
                                    <div className="flex flex-col">
                                            <span className="text-zinc-100 font-semibold group-hover:text-cyan-400 transition-colors">
                                                {item.top_products[idx].name || item.top_products[idx].product}
                                            </span>
                                        <span className="text-[11px] text-zinc-500 font-mono mt-0.5">
                                                ₹{item.top_products[idx].revenue?.toLocaleString() || 0}
                                            </span>
                                    </div>
                                ) : (
                                    <span className="text-zinc-700 italic text-xs">No Data</span>
                                )}
                            </td>
                        ))}
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    </div>
);

// --- Main Prediction Page Component ---
const PredictionPage: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [question, setQuestion] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [intent, setIntent] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [activeId, setActiveId] = useState<number | null>(null);

    const API_BASE_URL = import.meta.env.VITE_MAIN_CHAT_URL || "http://localhost:9090/api/predictions";

    const fetchHistory = useCallback(async () => {
        setHistoryLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/history`);
            if (response.ok) {
                const data = await response.json();
                setHistory(Array.isArray(data) ? [...data].reverse() : []);
            }
        } catch (err) {
            console.error("History fetch error:", err);
        } finally {
            setHistoryLoading(false);
        }
    }, [API_BASE_URL]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const handleHistoryClick = (record: any) => {
        try {
            setError(null);
            setActiveId(record.id);
            setQuestion(record.questions);

            let parsedResult = typeof record.result === "string" ? JSON.parse(record.result) : record.result;

            if (parsedResult.answer && typeof parsedResult.answer === "string" && parsedResult.answer.startsWith("{")) {
                parsedResult.answer = JSON.parse(parsedResult.answer);
            }

            const finalData = parsedResult.answer || parsedResult;
            setIntent(parsedResult.intent || "PAST_RECORD");
            setResult(finalData);

            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (e) {
            console.error("Parse error:", e);
            setError("Could not parse this historical record.");
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleAskAI = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !question) return;

        setLoading(true);
        setError(null);
        setResult(null);
        setActiveId(null);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("questions", question);

        try {
            const response = await fetch(`${API_BASE_URL}/analyze`, {
                method: "POST",
                body: formData
            });

            if (!response.ok) throw new Error("Server responded with an error.");

            const data = await response.json();
            setIntent(data.intent);

            const answer = typeof data.answer === "string" && data.answer.startsWith("{")
                ? JSON.parse(data.answer)
                : data.answer;

            setResult(answer);
            fetchHistory();
        } catch (err) {
            setError("AI Engine unreachable. Please check your backend connection.");
        } finally {
            setLoading(false);
        }
    };

    const DataTable = ({ title, data, type }: { title: string, data: any[], type: 'buy' | 'dead' }) => (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
            <div className={`p-4 border-b border-zinc-800 font-bold flex items-center gap-2 ${type === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                <div className={`w-2 h-2 rounded-full ${type === 'buy' ? 'bg-green-400' : 'bg-red-400'}`} />
                {title}
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-zinc-300">
                    <thead className="bg-zinc-950 text-zinc-500 uppercase text-[10px] tracking-widest border-b border-zinc-800">
                    <tr>
                        <th className="px-4 py-3">Product</th>
                        <th className="px-4 py-3 text-right">Metric</th>
                        <th className="px-4 py-3 text-right">Value</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                    {data.map((item, i) => (
                        <tr key={i} className="hover:bg-zinc-800/50 transition-colors">
                            <td className="px-4 py-3 text-white font-medium">{item.product || item.name}</td>
                            <td className="px-4 py-3 text-right text-zinc-400">
                                {item.predicted_qty !== undefined ? "Recommended Qty" : "Revenue Contribution"}
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-white">
                                {item.predicted_qty ?? `₹${(item.profit || item.revenue || 0).toLocaleString()}`}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col lg:grid lg:grid-cols-[1fr_350px] min-h-screen bg-zinc-950 text-zinc-200">
            {/* Main Content Area */}
            <div className="p-6 lg:p-10 space-y-8 border-r border-zinc-800">
                <div className="flex flex-col gap-2 border-b border-zinc-800 pb-6">
                    <h1 className="text-4xl font-black text-white flex items-center gap-3 tracking-tighter">
                        <BrainCircuit className="text-cyan-500 h-10 w-10" />
                        SUPPLY CHAIN <span className="text-cyan-500">AI</span>
                    </h1>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Intent Detected:</span>
                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border ${intent ? 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20' : 'text-zinc-600 bg-zinc-900 border-zinc-800'}`}>
                            {intent || 'Awaiting Input'}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-1 bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl">
                        <label className="block text-[10px] font-bold text-zinc-500 mb-4 uppercase tracking-widest">01. Data Source</label>
                        <label className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${file ? 'border-cyan-500/50 bg-cyan-500/5' : 'border-zinc-800 hover:bg-zinc-800/50 hover:border-zinc-700'}`}>
                            {file ? <CheckCircle2 className="text-cyan-400 mb-3 h-10 w-10" /> : <Upload className="text-zinc-600 mb-3 h-10 w-10" />}
                            <span className="text-xs font-medium text-zinc-400 px-4 text-center truncate w-full">
                                {file ? file.name : "Drop inventory CSV here"}
                            </span>
                            <input type="file" className="hidden" accept=".csv" onChange={handleFileUpload} />
                        </label>
                    </div>

                    <form onSubmit={handleAskAI} className="xl:col-span-2 bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl flex flex-col gap-4">
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest">02. Intelligence Prompt</label>
                        <textarea
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="Ask about seasonal peaks, ABC analysis, or reorder optimization..."
                            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white placeholder:text-zinc-700 outline-none resize-none"
                        />
                        <button
                            type="submit"
                            disabled={loading || !file}
                            className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-20 text-white font-black uppercase tracking-widest text-xs py-4 rounded-xl flex items-center justify-center gap-3 transition-all"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" />}
                            Execute Engine
                        </button>
                    </form>
                </div>

                {error && (
                    <div className="bg-red-500/5 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 text-red-400 text-sm font-bold">
                        <AlertCircle className="w-4 h-4" /> {error}
                    </div>
                )}

                {/* Results Mapping Section */}
                {result && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {(intent === "SEASONAL" || result.most_promising_month) && (
                                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex items-center gap-5 border-l-4 border-l-cyan-500">
                                    <div className="p-4 bg-cyan-500/10 rounded-xl"><TrendingUp className="text-cyan-400 w-6 h-6" /></div>
                                    <div>
                                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Peak Month</span>
                                        <p className="text-3xl font-black text-white uppercase">{result.most_promising_month || "N/A"}</p>
                                    </div>
                                </div>
                            )}

                            {(intent === "FORECAST" || result.forecast_30d_total) && (
                                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex items-center gap-5 border-l-4 border-l-cyan-500">
                                    <div className="p-4 bg-cyan-500/10 rounded-xl"><DollarSign className="text-cyan-400 w-6 h-6" /></div>
                                    <div>
                                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">30D Forecast</span>
                                        <p className="text-3xl font-black text-white">{result.forecast_30d_total || "Calculated"}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-2xl flex gap-6 items-start border-l-4 border-l-cyan-500 shadow-2xl">
                            <div className="shrink-0 p-3 bg-cyan-500/10 rounded-2xl"><MessageSquare className="text-cyan-400 h-6 w-6" /></div>
                            <div className="space-y-2">
                                <span className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.3em]">AI Executive Summary</span>
                                <div className="text-zinc-100 text-xl font-bold leading-snug">
                                    {result.message || "Data analysis complete. Categorized according to request intent."}
                                </div>
                            </div>
                        </div>

                        {/* Intent-Based Logic for Tables */}
                        {intent === "ABC_ANALYSIS" && result.abc_data && (
                            <DataTable
                                title="Inventory Classification (ABC)"
                                type="buy"
                                data={result.abc_data.map((item: any) => ({
                                    product: `${item.product} [Class ${item.category}]`,
                                    revenue: item.revenue
                                }))}
                            />
                        )}

                        {intent === "INVENTORY_OPTIMIZATION" && result.inventory_optimization && (
                            <DataTable
                                title="EOQ & Reorder Strategy"
                                type="buy"
                                data={result.inventory_optimization.map((item: any) => ({
                                    product: item.product,
                                    predicted_qty: item.recommended_order_size
                                }))}
                            />
                        )}

                        {intent === "SEASONAL" && result.monthly_breakdown && (
                            <SeasonalTable data={result.monthly_breakdown} />
                        )}

                        {(result.top_buy_list || result.least_priority_list) && (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                {result.top_buy_list && <DataTable title="Optimized Inventory (Top Picks)" type="buy" data={result.top_buy_list} />}
                                {result.least_priority_list && <DataTable title="High Risk / Low Velocity" type="dead" data={result.least_priority_list} />}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Sidebar */}
            <div className="bg-zinc-950 flex flex-col h-screen lg:sticky lg:top-0 border-l border-zinc-900 shadow-2xl">
                <div className="p-8 border-b border-zinc-900 flex items-center gap-3">
                    <Clock className="text-zinc-600 w-5 h-5" />
                    <h2 className="text-sm font-black text-zinc-400 uppercase tracking-[0.2em]">Activity Log</h2>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {historyLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
                            <Loader2 className="h-6 w-6 text-cyan-500 animate-spin" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Syncing...</span>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-20 opacity-30">
                            <HistoryIcon className="w-8 h-8 mx-auto mb-2" />
                            <p className="text-[10px] font-bold uppercase tracking-widest">No history yet</p>
                        </div>
                    ) : (
                        history.map((record) => (
                            <button
                                key={record.id}
                                onClick={() => handleHistoryClick(record)}
                                className={`w-full text-left p-5 border rounded-2xl transition-all relative overflow-hidden group ${activeId === record.id ? 'bg-cyan-500/5 border-cyan-500/40 shadow-lg shadow-cyan-900/10' : 'bg-zinc-900/30 border-zinc-900 hover:border-zinc-800'}`}
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600">
                                        {new Date(record.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </span>
                                    <Search className={`w-3 h-3 ${activeId === record.id ? 'text-cyan-500' : 'text-zinc-800'}`} />
                                </div>
                                <p className={`text-xs font-bold leading-relaxed line-clamp-2 ${activeId === record.id ? 'text-white' : 'text-zinc-500'}`}>
                                    {record.questions}
                                </p>
                                {activeId === record.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500" />}
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default PredictionPage;
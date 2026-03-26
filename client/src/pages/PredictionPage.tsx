import React, { useState, useEffect, useCallback } from "react";
import {
    BrainCircuit, Upload, MessageSquare, AlertCircle, DollarSign,
    History as HistoryIcon, Clock, Search, TrendingUp, Star, Calendar, Loader2, CheckCircle2, Package, BarChart3
} from "lucide-react";

// --- Sub-Component: Seasonal Performance Table ---
const SeasonalTable = ({ data }: { data: any[] }) => (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="p-4 border-b border-zinc-800 font-bold flex items-center gap-2 text-cyan-400 bg-zinc-900/50">
            <Calendar className="w-4 h-4" />
            Monthly Peak Performance
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-300">
                <thead className="bg-zinc-950 text-zinc-500 uppercase text-[10px] tracking-widest border-b border-zinc-800">
                <tr>
                    <th className="px-6 py-4">Month</th>
                    <th className="px-6 py-4 text-cyan-400">Rank #1</th>
                    <th className="px-6 py-4">Rank #2</th>
                    <th className="px-6 py-4">Rank #3</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                {data.map((item, i) => (
                    <tr key={i} className="hover:bg-zinc-800/50 transition-colors">
                        <td className="px-6 py-5 font-bold text-white bg-zinc-950/30 border-r border-zinc-800/50">{item.month}</td>
                        {[0, 1, 2].map((idx) => (
                            <td key={idx} className="px-6 py-5">
                                {item.top_products && item.top_products[idx] ? (
                                    <div className="flex flex-col">
                                        <span className="text-zinc-100 font-semibold">{item.top_products[idx].product || item.top_products[idx].name}</span>
                                        <span className="text-[11px] text-zinc-500 font-mono">₹{item.top_products[idx].revenue?.toLocaleString()}</span>
                                    </div>
                                ) : <span className="text-zinc-700">-</span>}
                            </td>
                        ))}
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    </div>
);

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
        } catch (err) { console.error(err); } finally { setHistoryLoading(false); }
    }, [API_BASE_URL]);

    useEffect(() => { fetchHistory(); }, [fetchHistory]);

    const processResultData = (rawData: any) => {
        let finalData = rawData;
        // Handle nested string JSON if backend sends it that way
        if (typeof rawData.answer === "string" && rawData.answer.startsWith("{")) {
            finalData = JSON.parse(rawData.answer);
        } else if (rawData.answer) {
            finalData = rawData.answer;
        }
        return finalData;
    };

    const handleHistoryClick = (record: any) => {
        try {
            setError(null);
            setActiveId(record.id);
            setQuestion(record.questions);
            const parsed = typeof record.result === "string" ? JSON.parse(record.result) : record.result;
            setIntent(parsed.intent || "PAST_RECORD");
            setResult(processResultData(parsed));
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (e) { setError("Parse error on history record."); }
    };

    const handleAskAI = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !question) return;
        setLoading(true); setError(null); setResult(null); setActiveId(null);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("questions", question);

        try {
            const response = await fetch(`${API_BASE_URL}/analyze`, { method: "POST", body: formData });
            const data = await response.json();
            setIntent(data.intent);
            setResult(processResultData(data));
            fetchHistory();
        } catch (err) { setError("AI Engine connection failed."); } finally { setLoading(false); }
    };

    const DataTable = ({ title, data, type }: { title: string, data: any[], type: 'buy' | 'dead' }) => (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
            <div className={`p-4 border-b border-zinc-800 font-bold flex items-center gap-2 ${type === 'buy' ? 'text-cyan-400' : 'text-red-400'}`}>
                <Package className="w-4 h-4" /> {title}
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-zinc-300">
                    <thead className="bg-zinc-950 text-zinc-500 uppercase text-[10px] tracking-widest border-b border-zinc-800">
                    <tr>
                        <th className="px-4 py-3">Product Name</th>
                        <th className="px-4 py-3 text-right">Metric Value</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                    {data.map((item, i) => {
                        // Robust Value Detection
                        const displayValue = item.value ?? item.predicted_qty ?? item.revenue ?? item.quantity ?? item.profit ?? "N/A";
                        const label = item.product || item.name || item.label || "Unknown Product";

                        return (
                            <tr key={i} className="hover:bg-zinc-800/50 transition-colors">
                                <td className="px-4 py-3 text-white font-medium">{label}</td>
                                <td className="px-4 py-3 text-right font-mono text-cyan-400">
                                    {typeof displayValue === 'number' ? displayValue.toLocaleString() : displayValue}
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col lg:grid lg:grid-cols-[1fr_350px] min-h-screen bg-zinc-950 text-zinc-200">
            {/* Main Area */}
            <div className="p-6 lg:p-10 space-y-8 border-r border-zinc-800">
                <header className="border-b border-zinc-800 pb-6">
                    <h1 className="text-4xl font-black text-white flex items-center gap-3 tracking-tighter">
                        <BrainCircuit className="text-cyan-500 h-10 w-10" />
                        SUPPLY CHAIN <span className="text-cyan-500">AI</span>
                    </h1>
                    <div className="mt-2 inline-block px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-black text-cyan-400 uppercase tracking-widest">
                        Mode: {intent || "Input Required"}
                    </div>
                </header>

                {/* Interaction Section */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-1 bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl">
                        <input type="file" id="file" className="hidden" onChange={(e) => e.target.files && setFile(e.target.files[0])} />
                        <label htmlFor="file" className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-zinc-800 rounded-xl cursor-pointer hover:bg-zinc-800/50 transition-all">
                            {file ? <CheckCircle2 className="text-green-400 mb-2" /> : <Upload className="text-zinc-600 mb-2" />}
                            <p className="text-[10px] font-bold text-zinc-500 uppercase">{file ? file.name : "Upload CSV Data"}</p>
                        </label>
                    </div>
                    <form onSubmit={handleAskAI} className="xl:col-span-2 bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl flex flex-col gap-4">
                        <textarea value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Analyze top products, seasonal peaks, or reorder levels..." className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white outline-none focus:border-cyan-500 transition-all" />
                        <button type="submit" disabled={loading || !file} className="bg-cyan-600 hover:bg-cyan-500 py-4 rounded-xl font-black uppercase text-xs tracking-widest flex justify-center items-center gap-2">
                            {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <BarChart3 className="w-4 h-4" />}
                            Run Intelligence Engine
                        </button>
                    </form>
                </div>

                {error && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</div>}

                {/* Display Results */}
                {result && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5">
                        {/* 1. Global Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {(result.total_revenue || result.total_orders) && (
                                <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 border-l-4 border-l-green-500">
                                    <span className="text-[10px] font-black text-zinc-500 uppercase">Sales Volume</span>
                                    <p className="text-2xl font-black text-white">₹{result.total_revenue?.toLocaleString() || 0}</p>
                                    <span className="text-[10px] text-zinc-600 font-bold uppercase">{result.total_orders} Total Transactions</span>
                                </div>
                            )}
                            {(result.forecast_30d_total || result.most_promising_month) && (
                                <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 border-l-4 border-l-cyan-500">
                                    <span className="text-[10px] font-black text-zinc-500 uppercase">Trend Forecast</span>
                                    <p className="text-2xl font-black text-white">{result.forecast_30d_total || result.most_promising_month || "N/A"}</p>
                                    <span className="text-[10px] text-zinc-600 font-bold uppercase">Next High-Velocity Window</span>
                                </div>
                            )}
                        </div>

                        {/* 2. Message Summary */}
                        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex gap-5 border-l-4 border-l-cyan-500 shadow-xl">
                            <div className="p-3 bg-cyan-500/10 rounded-xl h-fit"><MessageSquare className="text-cyan-400" /></div>
                            <div>
                                <span className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">AI Analyst Note</span>
                                <p className="text-zinc-100 text-lg font-bold leading-tight mt-1">{result.message || "Data extraction complete. See breakdown below."}</p>
                            </div>
                        </div>

                        {/* 3. Logic-Specific Components */}

                        {/* ABC Analysis Intent */}
                        {intent === "ABC_ANALYSIS" && result.abc_data && (
                            <DataTable
                                title="ABC Inventory Classification"
                                type="buy"
                                data={result.abc_data.map((i:any) => ({ product: i.product, label: `Class ${i.category}`, value: `₹${i.revenue.toLocaleString()}` }))}
                            />
                        )}

                        {/* EOQ Optimization Intent */}
                        {intent === "INVENTORY_OPTIMIZATION" && result.inventory_optimization && (
                            <DataTable
                                title="EOQ & Reorder Strategy"
                                type="buy"
                                data={result.inventory_optimization.map((i:any) => ({ product: i.product, value: i.recommended_order_size }))}
                            />
                        )}

                        {/* Seasonal Intent */}
                        {intent === "SEASONAL" && result.monthly_breakdown && <SeasonalTable data={result.monthly_breakdown} />}

                        {/* Best Product / Forecast / Historical List Intent */}
                        {(intent === "BEST_PRODUCT" || intent === "FORECAST" || intent === "HISTORICAL" || result.top_products || result.top_buy_list) && (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                {(result.top_products || result.top_buy_list || []).length > 0 && (
                                    <DataTable
                                        title="Top Performance Analysis"
                                        type="buy"
                                        data={result.top_products || result.top_buy_list}
                                    />
                                )}
                                {result.least_priority_list && (
                                    <DataTable
                                        title="Low Velocity / Excess Stock"
                                        type="dead"
                                        data={result.least_priority_list}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Sidebar Activity */}
            <aside className="bg-zinc-950 flex flex-col h-screen lg:sticky lg:top-0 border-l border-zinc-900 shadow-2xl">
                <div className="p-8 border-b border-zinc-900 flex items-center gap-3"><Clock className="text-zinc-600 w-5" /><h2 className="text-sm font-black text-zinc-400 uppercase tracking-widest">Activity History</h2></div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {history.map((record) => (
                        <button key={record.id} onClick={() => handleHistoryClick(record)} className={`w-full text-left p-4 border rounded-xl transition-all ${activeId === record.id ? 'bg-cyan-500/5 border-cyan-500 shadow-lg' : 'bg-zinc-900/30 border-zinc-900 hover:border-zinc-800'}`}>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[9px] font-black text-zinc-600 uppercase">{new Date(record.createdAt).toLocaleDateString()}</span>
                                {activeId === record.id && <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />}
                            </div>
                            <p className={`text-xs font-bold line-clamp-2 ${activeId === record.id ? 'text-white' : 'text-zinc-500'}`}>{record.questions}</p>
                        </button>
                    ))}
                </div>
            </aside>
        </div>
    );
};

export default PredictionPage;
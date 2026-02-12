import React, { useState, useEffect } from "react";
import {
    BrainCircuit,
    Upload,
    MessageSquare,
    TrendingUp,
    AlertCircle,
    CheckCircle2,
    DollarSign,
    History as HistoryIcon,
    PieChart,
    Clock,
    ChevronRight,
    Search
} from "lucide-react";

const PredictionPage: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [question, setQuestion] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [intent, setIntent] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // History State
    const [history, setHistory] = useState<any[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        setHistoryLoading(true);
        try {
            const response = await fetch("http://localhost:9090/api/predictions/history");
            if (response.ok) {
                const data = await response.json();
                setHistory(data.reverse()); // Show newest first
            }
        } catch (err) {
            console.error("Failed to fetch history:", err);
        } finally {
            setHistoryLoading(false);
        }
    };

    // --- NEW: Handle History Click ---
    const handleHistoryClick = (record: any) => {
        try {
            // 1. Set the question back into the textarea
            setQuestion(record.questions);

            // 2. Parse the saved result string
            // Your Spring Boot DB stores the result as a JSON string
            const savedResult = typeof record.result === "string"
                ? JSON.parse(record.result)
                : record.result;

            // 3. Try to detect intent from the saved result if not explicitly saved
            // (Often stored in the 'answer' wrapper)
            const finalAnswer = savedResult.answer ? savedResult.answer : savedResult;
            const parsedAnswer = typeof finalAnswer === "string" && finalAnswer.startsWith("{")
                ? JSON.parse(finalAnswer)
                : finalAnswer;

            setIntent(savedResult.intent || "PAST_RECORD");
            setResult(parsedAnswer);

            // Scroll to top to see result
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (e) {
            console.error("Error loading historical record:", e);
            setError("Could not parse this historical record.");
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) { setFile(e.target.files[0]); setError(null); }
    };

    const handleAskAI = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !question) return;

        setLoading(true);
        setError(null);
        setResult(null);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("questions", question);

        try {
            const response = await fetch("http://localhost:9090/api/predictions/analyze", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) throw new Error(`Server Error: ${response.statusText}`);

            const data = await response.json();
            setIntent(data.intent);

            const answer = typeof data.answer === "string" && data.answer.startsWith("{")
                ? JSON.parse(data.answer)
                : data.answer;

            setResult(answer);
            fetchHistory(); // Refresh Sidebar

        } catch (err: any) {
            console.error("Connection failed:", err);
            setError("AI Service unreachable.");
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
                        <th className="px-4 py-3 text-right">Qty/Metric</th>
                        <th className="px-4 py-3 text-right">Financials</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                    {data && data.length > 0 ? data.map((item, i) => (
                        <tr key={i} className="hover:bg-zinc-800/50 transition-colors">
                            <td className="px-4 py-3 font-medium text-white">{item.product || item.name || "Unknown"}</td>
                            <td className="px-4 py-3 text-right">{item.predicted_qty || item.quantity || item.value || 0}</td>
                            <td className="px-4 py-3 text-right text-zinc-400">
                                ₹{(item.expected_revenue || item.profit || item.revenue || 0).toLocaleString()}
                            </td>
                        </tr>
                    )) : (
                        <tr><td colSpan={3} className="px-4 py-8 text-center text-zinc-600 italic">No detailed metrics available.</td></tr>
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col lg:grid lg:grid-cols-[1fr_320px] min-h-screen bg-zinc-950">
            {/* MAIN CONTENT AREA */}
            <div className="p-6 lg:p-10 space-y-8 border-r border-zinc-800">
                <div className="flex flex-col gap-2 border-b border-zinc-800 pb-6">
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <BrainCircuit className="text-cyan-500 h-8 w-8" />
                        AI Supply Chain Predictor
                    </h1>
                    <p className="text-zinc-400">Decision Support System: {intent || 'Waiting for input'}</p>
                </div>

                {/* Input Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-1 bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl">
                        <label className="block text-sm font-semibold text-zinc-300 mb-4 uppercase tracking-wider">Step 1: Data Source</label>
                        <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-zinc-700 rounded-xl cursor-pointer hover:bg-zinc-800/50 transition-all">
                            <Upload className="text-zinc-500 mb-3" />
                            <span className="text-sm text-zinc-400">{file ? file.name : "Select Transaction CSV"}</span>
                            <input type="file" className="hidden" accept=".csv" onChange={handleFileUpload} />
                        </label>
                    </div>

                    <form onSubmit={handleAskAI} className="xl:col-span-2 bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl flex flex-col gap-4">
                        <label className="block text-sm font-semibold text-zinc-300 uppercase tracking-wider">Step 2: AI Query</label>
                        <textarea
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="Type your question..."
                            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none resize-none"
                        />
                        <button type="submit" disabled={loading || !file} className="bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-lg">
                            {loading ? "AI is Thinking..." : "Execute Analysis"}
                        </button>
                    </form>
                </div>

                {error && <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg flex gap-3 text-red-400"><AlertCircle />{error}</div>}

                {/* Results View */}
                {result && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {/* KPI Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {(intent === "FORECAST" || intent === "PAST_RECORD") && result.forecast_30d_total && (
                                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl shadow-xl flex items-center gap-4 border-b-2 border-cyan-500">
                                    <DollarSign className="text-cyan-400" />
                                    <div><span className="text-xs font-bold text-zinc-500 uppercase">30D Forecast</span><p className="text-2xl font-bold text-white">{result.forecast_30d_total}</p></div>
                                </div>
                            )}
                            {(intent === "HISTORICAL" || intent === "PAST_RECORD") && result.total_revenue && (
                                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl shadow-xl flex items-center gap-4 border-b-2 border-green-500">
                                    <HistoryIcon className="text-green-400" />
                                    <div><span className="text-xs font-bold text-zinc-500 uppercase">Revenue Metric</span><p className="text-2xl font-bold text-white">₹{result.total_revenue.toLocaleString()}</p></div>
                                </div>
                            )}
                        </div>

                        {/* Message Box */}
                        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl flex gap-4 items-start shadow-xl border-l-4 border-l-cyan-500">
                            <MessageSquare className="text-cyan-400 mt-1" />
                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-bold text-cyan-500 uppercase">AI Strategy Insight</span>
                                <div className="text-zinc-200 leading-relaxed text-lg">
                                    {typeof result === 'string' ? result : (result.message || result.summary || "Previous record loaded.")}
                                </div>
                            </div>
                        </div>

                        {/* Tables */}
                        {(result.top_buy_list || result.least_priority_list) && (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                <DataTable title="Top Performance/Buy" type="buy" data={result.top_buy_list || []} />
                                <DataTable title="Low Priority/Risk" type="dead" data={result.least_priority_list || []} />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* --- RIGHT SIDEBAR: CLICKABLE HISTORY --- */}
            <div className="bg-zinc-900 flex flex-col h-screen lg:sticky lg:top-0">
                <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Clock className="text-zinc-500 w-5 h-5" />
                        History
                    </h2>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {historyLoading ? (
                        <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div></div>
                    ) : (
                        history.map((record) => (
                            <button
                                key={record.id}
                                onClick={() => handleHistoryClick(record)}
                                className="w-full text-left p-4 bg-zinc-950 border border-zinc-800 rounded-lg hover:border-cyan-500/50 hover:bg-zinc-900 transition-all group"
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                                        {new Date(record.createdAt).toLocaleDateString()}
                                    </span>
                                    <Search className="w-3 h-3 text-zinc-700 group-hover:text-cyan-500" />
                                </div>
                                <p className="text-sm text-zinc-300 line-clamp-2 font-medium">
                                    {record.questions}
                                </p>
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default PredictionPage;
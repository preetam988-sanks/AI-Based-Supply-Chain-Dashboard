import React, { useState, FormEvent } from "react";
import { loginUser } from "@/services/api";
import { useNavigate } from "react-router-dom";

const LoginPage: React.FC = () => {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await loginUser({ email, password });

            localStorage.setItem("token", res.data.access_token);
            localStorage.setItem("userRole", res.data.userrole || "user");

            navigate("/dashboard");
        } catch (err) {
            setError("Invalid email or password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 relative overflow-hidden">

            <div className="absolute w-96 h-96 bg-purple-600 rounded-full blur-3xl opacity-30 top-20 left-20"></div>
            <div className="absolute w-96 h-96 bg-indigo-600 rounded-full blur-3xl opacity-30 bottom-20 right-20"></div>

            <div className="bg-white/10 backdrop-blur-lg p-10 rounded-2xl shadow-2xl w-full max-w-md border border-white/20">

                <h2 className="text-3xl font-bold text-center text-white mb-6">
                    Welcome Back 👋
                </h2>

                <form onSubmit={handleLogin} className="space-y-5">

                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-4 py-3 rounded-xl bg-white/20 text-white placeholder-gray-300 focus:ring-2 focus:ring-indigo-400"
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full px-4 py-3 rounded-xl bg-white/20 text-white placeholder-gray-300 focus:ring-2 focus:ring-indigo-400"
                    />

                    {error && (
                        <p className="text-sm text-red-400 text-center">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3 rounded-xl"
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>

                    {/* Forgot Password */}
                    <div className="text-right">
                        <button
                            type="button"
                            onClick={() => navigate("/forgot-password")}
                            className="text-sm text-indigo-300 hover:underline"
                        >
                            Forgot Password?
                        </button>
                    </div>

                    {/* NEW: Sign Up Link */}
                    <div className="text-center mt-4">
                        <span className="text-sm text-gray-300">
                            Don’t have an account?{" "}
                        </span>
                        <button
                            type="button"
                            onClick={() => navigate("/signup")}
                            className="text-sm text-indigo-300 hover:underline"
                        >
                            Sign Up
                        </button>
                    </div>

                </form>

                <p className="text-center text-xs text-gray-300 mt-6">
                    © 2026 Supply Chain AI Dashboard
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
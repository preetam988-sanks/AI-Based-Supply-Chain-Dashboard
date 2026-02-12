import React, { useState, FormEvent } from "react";
import { loginUser } from "@/services/api";

const LoginPage: React.FC = () => {
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

            // --- DEBUG STEP ---
            // Look at your browser console after clicking login.
            // It will show you exactly what keys FastAPI is sending back.
            console.log("Full Login Response Data:", res.data);

            // Save the token
            localStorage.setItem("token", res.data.access_token);

            // --- THE FIX ---
            // If FastAPI sends { "user": { "role": "admin" } }, use res.data.user.role
            // If it sends { "role": "admin" }, use res.data.role
            const roleFromBackend = res.data.userrole;
            if (roleFromBackend) {
                localStorage.setItem("userRole", roleFromBackend.toLowerCase().trim());
            } else {
                console.error("Role not found in response! Setting default to 'user'");
                localStorage.setItem("userRole", "user");
            }

            window.location.href = "/dashboard";
        } catch (err) {
            console.error("Login Error:", err);
            setError("Invalid email or password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700">
            <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
                    Welcome Back 👋
                </h2>

                <p className="text-center text-gray-500 mb-8">
                    Login to your Supply Chain Dashboard
                </p>

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-600 text-center">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl disabled:opacity-60"
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-500 mt-6">
                    © 2026 Supply Chain AI Dashboard
                </p>
            </div>
        </div>
    );
};

export default LoginPage;

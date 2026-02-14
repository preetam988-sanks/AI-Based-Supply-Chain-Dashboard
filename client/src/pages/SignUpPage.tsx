import React, { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "@/services/api";

const SignupPage: React.FC = () => {
    const navigate = useNavigate();

    // 1. Added name state
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // 2. Gmail Validation logic
    const validateGmail = (email: string) => {
        return /^[a-z0-9](\.?[a-z0-9]){5,}@gmail\.com$/i.test(email);
    };

    const handleSignup = async (e: FormEvent) => {
        e.preventDefault();
        setError("");

        // Basic Validation
        if (!name.trim()) {
            setError("Please enter your full name");
            return;
        }

        if (!validateGmail(email)) {
            setError("Please enter a valid Gmail address (e.g., example@gmail.com)");
            return;
        }

        setLoading(true);

        try {
            // 3. Sending name, email, and password to the backend
            await registerUser({
                name: name.trim(),
                email: email.toLowerCase().trim(),
                password
            });

            alert("Registration successful! Redirecting to login...");
            navigate("/login");
        } catch (err: any) {
            console.error("Signup Error:", err);
            setError(err.response?.data?.detail || "Email already registered or server error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900">
            <div className="bg-white/10 backdrop-blur-lg p-10 rounded-2xl shadow-2xl w-full max-w-md border border-white/20">

                <h2 className="text-3xl font-bold text-center text-white mb-2">
                    Create Account 🚀
                </h2>
                <p className="text-center text-gray-300 mb-8 text-sm">
                    Join the AI Supply Chain Dashboard
                </p>

                <form onSubmit={handleSignup} className="space-y-5">

                    {/* --- Name Input --- */}
                    <div>
                        <input
                            type="text"
                            placeholder="Full Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-400 outline-none transition-all"
                        />
                    </div>

                    {/* --- Email Input --- */}
                    <div>
                        <input
                            type="email"
                            placeholder="Gmail Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-400 outline-none transition-all"
                        />
                    </div>

                    {/* --- Password Input --- */}
                    <div>
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-400 outline-none transition-all"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-500/20 border border-red-500/50 p-3 rounded-lg">
                            <p className="text-xs text-red-200 text-center">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-500 hover:bg-indigo-600 active:scale-95 text-white font-semibold py-3 rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Creating Account..." : "Sign Up"}
                    </button>

                    <div className="pt-4 border-t border-white/10 text-center">
                        <p className="text-sm text-gray-300">
                            Already have an account?{" "}
                            <span
                                onClick={() => navigate("/login")}
                                className="text-indigo-300 font-medium cursor-pointer hover:underline"
                            >
                                Log In
                            </span>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SignupPage;
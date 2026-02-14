import React, { useState } from "react";
import { forgotPassword, resetPassword } from "@/services/api";
import { useNavigate } from "react-router-dom";

const ForgotPasswordPage: React.FC = () => {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [step, setStep] = useState(1);
    const [message, setMessage] = useState("");

    const handleSendOtp = async () => {
        try {
            await forgotPassword(email);
            setMessage("OTP sent to your email.");
            setStep(2);
        } catch {
            setMessage("Error sending OTP");
        }
    };

    const handleReset = async () => {
        try {
            await resetPassword({ email, otp, new_password: newPassword });

            setMessage("Password reset successful! Redirecting to login...");

            setTimeout(() => {
                navigate("/login");
            }, 2000);

        } catch {
            setMessage("Invalid OTP or expired");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900">
            <div className="bg-white/10 backdrop-blur-lg p-10 rounded-2xl shadow-2xl w-full max-w-md border border-white/20">

                <h2 className="text-3xl font-bold text-center text-white mb-6">
                    Reset Password 🔐
                </h2>

                {step === 1 && (
                    <>
                        <input
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-white/20 text-white mb-4"
                        />

                        <button
                            onClick={handleSendOtp}
                            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-3 rounded-xl"
                        >
                            Send OTP
                        </button>
                    </>
                )}

                {step === 2 && (
                    <>
                        <input
                            type="text"
                            placeholder="Enter OTP"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-white/20 text-white mb-3"
                        />

                        <input
                            type="password"
                            placeholder="New Password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-white/20 text-white mb-3"
                        />

                        <button
                            onClick={handleReset}
                            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-3 rounded-xl"
                        >
                            Reset Password
                        </button>
                    </>
                )}

                {message && (
                    <p className="text-center text-sm text-green-400 mt-4">
                        {message}
                    </p>
                )}

            </div>
        </div>
    );
};

export default ForgotPasswordPage;
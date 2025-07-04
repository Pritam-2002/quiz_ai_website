"use client";

import { useState } from "react";

interface LoginFormProps {
    onLogin: (email: string, password: string) => Promise<void>;
    onSwitchToSignup: () => void;
}

const LoginForm = ({ onLogin, onSwitchToSignup }: LoginFormProps) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            setErrorMsg("Please enter both email and password.");
            return;
        }

        setIsLoading(true);
        setErrorMsg("");

        try {
            await onLogin(email, password);
        } catch {
            setErrorMsg("Login failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto mt-10 bg-white shadow-md rounded-md p-6">
            <h2 className="text-2xl font-bold text-center mb-2">Welcome Back</h2>
            {errorMsg && <p className="text-red-600 text-sm mb-4 text-center">{errorMsg}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 text-black rounded-md focus:outline-none"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none"
                        required
                    />
                </div>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    {isLoading ? "Signing in..." : "Sign In"}
                </button>

                <div className="text-center mt-4">
                    <button
                        type="button"
                        onClick={onSwitchToSignup}
                        className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                        Don’t have an account? Sign up
                    </button>
                </div>
            </form>
        </div>
    );
};

export default LoginForm;

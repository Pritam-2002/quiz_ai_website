"use client";

import { useState } from "react";

interface SignupFormProps {
    onSignup: (
        name: string,
        email: string,
        password: string,
        currentGrade?: string,
        country?: string,
        phoneNumber?: string
    ) => Promise<void>;
    onSwitchToLogin: () => void;
}

const SignupForm = ({ onSignup, onSwitchToLogin }: SignupFormProps) => {
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        currentGrade: "",
        country: "",
        phoneNumber: "",
    });

    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const { name, email, password } = form;

        if (!name || !email || !password) {
            setErrorMsg("Name, email, and password are required.");
            return;
        }

        setIsLoading(true);
        setErrorMsg("");
        setSuccessMsg("");

        try {
            await onSignup(
                form.name,
                form.email,
                form.password,
                form.currentGrade,
                form.country,
                form.phoneNumber
            );
            setSuccessMsg("Signup successful!");
        } catch (error) {
            setErrorMsg("Signup failed. Try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto mt-10 bg-white shadow-md rounded-md p-6">
            <h2 className="text-2xl font-bold text-center mb-2">Create Account</h2>
            {errorMsg && <p className="text-red-600 text-sm mb-4 text-center">{errorMsg}</p>}
            {successMsg && <p className="text-green-600 text-sm mb-4 text-center">{successMsg}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
                {[
                    { label: "Full Name", name: "name", type: "text" },
                    { label: "Email", name: "email", type: "email" },
                    { label: "Password", name: "password", type: "password" },
                    { label: "Current Grade", name: "currentGrade", type: "text" },
                    { label: "Country", name: "country", type: "text" },
                    { label: "Phone Number", name: "phoneNumber", type: "text" },
                ].map(({ label, name, type }) => (
                    <div key={name}>
                        <label className="block text-sm font-medium text-gray-700">{label}</label>
                        <input
                            name={name}
                            type={type}
                            value={(form as any)[name]}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
                            required={["name", "email", "password"].includes(name)}
                        />
                    </div>
                ))}

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition"
                >
                    {isLoading ? "Signing up..." : "Sign Up"}
                </button>

                <div className="text-center mt-4">
                    <button
                        type="button"
                        onClick={onSwitchToLogin}
                        className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                        Already have an account? Login
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SignupForm;

"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";


export default function ResultPage() {


    const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!geminiApiKey) {
        throw new Error("GEMINI_API_KEY environment variable is not set.");
    }
    const genAI = new GoogleGenerativeAI(geminiApiKey)
    const params = useParams();
    const router = useRouter();
    const quizId = params.quizId as string;

    const [data, setData] = useState<any>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [aiExplanation, setAiExplanation] = useState<string>("");
    const [loadingExplanation, setLoadingExplanation] = useState(false);


    useEffect(() => {
        if (!quizId) return;

        const stored = localStorage.getItem(`quiz_solution_${quizId}`);
        if (!stored) {
            router.push("/dashboard/user");
            return;
        }

        try {
            setData(JSON.parse(stored));
        } catch (e) {
            console.error("Invalid solution format:", e);
        }
    }, [quizId, router]);

    if (!data) return <div className="p-6 text-center text-gray-600">Loading...</div>;

    const { results, subject, type, timeTaken } = data;
    const correctCount = results.filter((q: any) => q.isCorrect).length;
    const formatTime = (sec: number) => `${Math.floor(sec / 60)}m ${sec % 60}s`;

    const handleAnswerExplain = async (explanation: string) => {
        setSidebarOpen(true);
        setLoadingExplanation(true);
        setAiExplanation("");

        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const prompt = `Give a detailed explanation of this concept: ${explanation} with examples.`;

            const result = await model.generateContent(prompt);
            const text = result.response.text();
            setAiExplanation(text);
        } catch (error) {
            console.error(error);
            setAiExplanation("❌ Error fetching explanation.");
        } finally {
            setLoadingExplanation(false);
        }
    };




    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6 bg-gradient-to-br from-blue-50 to-purple-100 min-h-screen">
            {/* Header */}
            <div className="bg-white shadow-md rounded-2xl p-6 border border-indigo-200">
                <h1 className="text-4xl font-bold text-indigo-700 mb-2">📘 Quiz Results</h1>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 text-gray-700 text-lg">
                    <p>🧠 <strong className="text-gray-800">Subject:</strong> {subject}</p>
                    <p>📊 <strong className="text-gray-800">Type:</strong> {type}</p>
                    <p>✅ <strong className="text-gray-800">Score:</strong> {correctCount}/{results.length}</p>
                    <p>⏱️ <strong className="text-gray-800">Time:</strong> {formatTime(timeTaken)}</p>
                    <p>🎯 <strong className="text-gray-800">Accuracy:</strong> {((correctCount / results.length) * 100).toFixed(2)}%</p>
                </div>
            </div>

            {/* Question-wise review */}
            {results.map((q: any, idx: number) => (
                <div key={q.questionId} className="bg-white shadow-md border border-gray-200 rounded-2xl p-6">
                    <h2 className="text-xl font-semibold text-indigo-700 mb-4">
                        {idx + 1}. {q.question}
                    </h2>

                    <ul className="mb-4 space-y-2">
                        {q.options.map((opt: string, i: number) => {
                            const isSelected = opt === q.userAnswer;
                            const isCorrect = q.isCorrect && isSelected;

                            let className = "px-4 py-3 rounded-md border text-md font-medium ";
                            if (isCorrect) {
                                className += "bg-green-100 border-green-500 text-green-800";
                            } else if (isSelected) {
                                className += "bg-red-100 border-red-500 text-red-800";
                            } else if (opt === q.correctAnswer) {
                                className += "bg-green-50 border-green-300 text-green-600";
                            } else {
                                className += "bg-gray-50 border-gray-300 text-gray-700";
                            }

                            return (
                                <li key={i} className={className}>
                                    {opt}
                                </li>
                            );
                        })}
                    </ul>

                    <div className="text-sm text-gray-700 mb-2">
                        <span className="font-semibold text-indigo-600">Explanation:</span> {q.explanation}

                    </div>
                    <button
                        onClick={() => handleAnswerExplain(q.explanation)}
                        className="group relative inline-flex items-center justify-center px-6 py-3 overflow-hidden font-semibold text-indigo-800 transition-all duration-300 bg-yellow-200 rounded-xl shadow-md hover:bg-yellow-300 hover:shadow-lg hover:scale-105 mb-2"
                    >
                        <span className="absolute inset-0 w-full h-full bg-gradient-to-br from-yellow-100 to-yellow-300 opacity-0 group-hover:opacity-20 transition-all duration-300"></span>
                        <span className="relative z-10 flex items-center gap-2">
                            🤖 <span>Explain More with AI</span>
                        </span>
                    </button>


                    {!q.isCorrect && q.correctAnswer && (
                        <div className="text-sm text-red-700 font-semibold mb-2">
                            Correct Answer: <span className="text-gray-900">{q.correctAnswer}</span>
                        </div>
                    )}

                    {q.videoSolutionUrl && (
                        <a
                            href={q.videoSolutionUrl}
                            target="_blank"
                            className="inline-block mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
                        >
                            🎥 Watch Video Solution
                        </a>
                    )}
                </div>
            ))}

            {/* Back button */}
            <div className="text-center mt-10">
                <button
                    onClick={() => router.push("/dashboard/user")}
                    className="bg-indigo-600 text-white font-semibold py-3 px-8 rounded-xl hover:bg-indigo-700 transition-all shadow-lg"
                >
                    🔙 Back to Dashboard
                </button>
            </div>

            {sidebarOpen && (
                <div className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out">
                    <div className="p-6 h-full flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-indigo-700">🤖 AI Explanation</h2>
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="text-red-500 hover:text-red-700 text-2xl font-bold"
                            >
                                &times;
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1 border-t pt-4 text-gray-800 text-sm">
                            {loadingExplanation ? (
                                <div className="text-center mt-10 animate-pulse text-indigo-500 font-semibold">
                                    Generating explanation...
                                </div>
                            ) : (
                                <pre className="whitespace-pre-wrap">{aiExplanation}</pre>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

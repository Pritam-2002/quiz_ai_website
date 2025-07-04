"use client";
import { useEffect, useState } from "react";
import { API_URL } from "../../../../config/config";

export default function AdminPanel() {
    const [topic, setTopic] = useState("");
    const [numQuestions, setNumQuestions] = useState(1);
    const [aiQuestions, setAiQuestions] = useState<any[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [token, setToken] = useState<string | null>(null);

    const [manualQuestion, setManualQuestion] = useState({
        question: "",
        options: ["", ""],
        correctAnswer: "",
        explanation: "",
        questionImage: "", // will be set as File later
        VideoSolutionUrl: "",
        subject: "",
        type: "quiz",
        tags: [],
    });

    const handleAIRequest = async () => {
        if (!topic || !numQuestions) {
            alert("Enter both subject and number of questions.");
            return;
        }

        setIsGenerating(true);
        try {
            const res = await fetch(`${API_URL}/questions/aiassist`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ topic, numQuestions }),
            });

            const data = await res.json();
            if (!data.questions || data.questions.length === 0) {
                alert("No questions generated. Try a different topic.");
                return;
            }

            setAiQuestions(data.questions);
        } catch (err) {
            console.error(err);
            alert("AI generation failed.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleApplyAIQuestions = async () => {
        if (!aiQuestions.length) return alert("No AI questions to apply.");

        try {
            for (const q of aiQuestions) {
                const formData = new FormData();
                formData.append("question", q.question);
                formData.append("options", JSON.stringify(q.options));
                formData.append("correctAnswer", q.correctAnswer);
                formData.append("explanation", q.explanation);
                formData.append("subject", q.subject);
                formData.append("type", q.type || "quiz");
                formData.append("tags", JSON.stringify(q.tags || []));
                formData.append("VideoSolutionUrl", q.VideoSolutionUrl || "");

                // Skip file append since AI questions don’t have images
                // If you plan to support image URLs, adjust your backend accordingly

                const res = await fetch(`${API_URL}/questions/createquestion`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                });

                if (!res.ok) throw new Error("Failed to save a question");
            }

            alert("✅ All AI questions saved successfully!");
            setAiQuestions([]);
        } catch (err) {
            console.error(err);
            alert("❌ Failed to apply AI questions.");
        }
    };


    const handleManualSubmit = async () => {
        const { question, options, correctAnswer, explanation, subject, type, tags, VideoSolutionUrl, questionImage } = manualQuestion;

        if (!question || !correctAnswer || !explanation || !subject || options.length < 2) {
            alert("Fill all required fields and at least 2 options.");
            return;
        }

        const formData = new FormData();
        formData.append("question", question);
        formData.append("correctAnswer", correctAnswer);
        formData.append("explanation", explanation);
        formData.append("subject", subject);
        formData.append("type", type);
        formData.append("VideoSolutionUrl", VideoSolutionUrl || "");
        formData.append("options", JSON.stringify(options));
        formData.append("tags", JSON.stringify(tags));

        if (questionImage instanceof File) {
            formData.append("file", questionImage); // This must match multer's `upload.single("file")`
        }

        try {
            const res = await fetch(`${API_URL}/questions/createquestion`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            if (!res.ok) throw new Error("Failed to save manual question");

            alert("✅ Manual Question Added");
            setManualQuestion({
                question: "",
                options: ["", ""],
                correctAnswer: "",
                explanation: "",
                questionImage: "",
                VideoSolutionUrl: "",
                subject: "",
                type: "quiz",
                tags: [],
            });
        } catch (err) {
            console.error(err);
            alert("❌ Manual submission failed.");
        }
    };

    useEffect(() => {
        console.log(aiQuestions)
    }, [aiQuestions])

    useEffect(() => {
        if (typeof window !== "undefined") {
            const storedToken = localStorage.getItem("token");
            setToken(storedToken);
        }
    }, []);

    return (
        <div className="p-6 max-w-5xl mx-auto text-gray-900">
            <h1 className="text-3xl font-extrabold text-indigo-700 text-center mb-8">
                🛠️ Admin Panel – Manage Questions
            </h1>

            {/* AI Assist Section */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-md shadow p-6 mb-10">
                <h2 className="text-xl font-bold text-indigo-800 mb-4">🤖 AI Assist Generator</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <input
                        type="text"
                        placeholder="Subject (e.g., Chemistry)"
                        className="border p-3 rounded w-full"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                    />
                    <input
                        type="number"
                        placeholder="Number of Questions"
                        className="border p-3 rounded w-full"
                        value={numQuestions}
                        onChange={(e) => setNumQuestions(Number(e.target.value))}
                    />
                </div>

                <button
                    onClick={handleAIRequest}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded font-medium"
                    disabled={isGenerating}
                >
                    {isGenerating ? "Generating..." : "✨ Generate Questions"}
                </button>

                {aiQuestions.length > 0 && (
                    <div className="mt-4">
                        <p className="text-green-700 font-medium">
                            ✅ {aiQuestions.length} AI-generated questions ready!
                        </p>
                        <button
                            onClick={handleApplyAIQuestions}
                            className="mt-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                        >
                            💾 Apply These Questions
                        </button>
                    </div>
                )}
            </div>

            {/* Manual Question Creator */}
            <div className="bg-white border border-gray-300 rounded-md shadow p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">📝 Manually Add Question</h2>

                <div className="space-y-4">
                    <input
                        type="text"
                        placeholder="Question"
                        className="border p-3 w-full rounded"
                        value={manualQuestion.question}
                        onChange={(e) => setManualQuestion({ ...manualQuestion, question: e.target.value })}
                    />

                    {manualQuestion.options.map((opt, idx) => (
                        <input
                            key={idx}
                            placeholder={`Option ${idx + 1}`}
                            className="border p-3 w-full rounded"
                            value={opt}
                            onChange={(e) => {
                                const newOptions = [...manualQuestion.options];
                                newOptions[idx] = e.target.value;
                                setManualQuestion({ ...manualQuestion, options: newOptions });
                            }}
                        />
                    ))}

                    <button
                        onClick={() =>
                            setManualQuestion({ ...manualQuestion, options: [...manualQuestion.options, ""] })
                        }
                        className="text-blue-600 hover:underline text-sm"
                    >
                        ➕ Add Option
                    </button>

                    <input
                        type="text"
                        placeholder="Correct Answer"
                        className="border p-3 w-full rounded"
                        value={manualQuestion.correctAnswer}
                        onChange={(e) => setManualQuestion({ ...manualQuestion, correctAnswer: e.target.value })}
                    />

                    <input
                        type="text"
                        placeholder="Explanation"
                        className="border p-3 w-full rounded"
                        value={manualQuestion.explanation}
                        onChange={(e) => setManualQuestion({ ...manualQuestion, explanation: e.target.value })}
                    />

                    <input
                        type="file"
                        accept="image/*"
                        className="border p-3 w-full rounded"
                        onChange={(e) =>
                            setManualQuestion({ ...manualQuestion, questionImage: e.target.files?.[0] || "" })
                        }
                    />

                    <input
                        type="text"
                        placeholder="Video Solution URL (optional)"
                        className="border p-3 w-full rounded"
                        value={manualQuestion.VideoSolutionUrl}
                        onChange={(e) =>
                            setManualQuestion({ ...manualQuestion, VideoSolutionUrl: e.target.value })
                        }
                    />

                    <input
                        type="text"
                        placeholder="Subject"
                        className="border p-3 w-full rounded"
                        value={manualQuestion.subject}
                        onChange={(e) => setManualQuestion({ ...manualQuestion, subject: e.target.value })}
                    />

                    <select
                        className="border p-3 w-full rounded"
                        value={manualQuestion.type}
                        onChange={(e) => setManualQuestion({ ...manualQuestion, type: e.target.value })}
                    >
                        <option value="quiz">Quiz</option>
                        <option value="practice_paper">Practice Paper</option>
                    </select>

                    <button
                        onClick={handleManualSubmit}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded"
                    >
                        ✅ Submit Question
                    </button>
                </div>
            </div>
        </div>
    );
}

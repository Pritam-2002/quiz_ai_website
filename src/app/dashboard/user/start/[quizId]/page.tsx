"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { API_URL } from "../../../../../../config/config";

interface Question {
    _id: string;
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
    subject: string;
    type: string;
    questionImage?: string;
    VideoSolutionUrl?: string;
}

export default function StartQuizPage() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<{ [key: string]: string }>({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [quizStarted, setQuizStarted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [startTime, setStartTime] = useState<number>(0);

    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    // URL decode the subject to handle special characters like C++
    const subject = params?.quizId ? decodeURIComponent(params.quizId as string) : '';
    const type = searchParams?.get("type") || "quiz";

    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    router.push("/login");
                    return;
                }

                // Build query parameters for the API
                const queryParams = new URLSearchParams();
                if (subject) queryParams.append("subject", subject);
                if (type) queryParams.append("type", type);

                const response = await fetch(`${API_URL}/questions/getquestions?${queryParams.toString()}`, {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });

                const data = await response.json();
                if (response.ok && data.questions) {
                    if (data.questions.length === 0) {
                        setError("No questions found for this subject and type");
                        return;
                    }

                    setQuestions(data.questions);
                    // Set timer based on type (quiz: 1 min per question, practice: 2 min per question)
                    const timePerQuestion = type === "quiz" ? 60 : 120;
                    setTimeLeft(data.questions.length * timePerQuestion);
                } else {
                    setError(data.message || "Failed to fetch questions");
                }
            } catch (err) {
                setError("Network error occurred");
                console.error("Error fetching questions:", err);
            } finally {
                setLoading(false);
            }
        };

        if (subject) {
            fetchQuestions();
        }
    }, [subject, type, router]);

    // Timer countdown
    useEffect(() => {
        if (quizStarted && timeLeft > 0) {
            const timer = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        handleSubmitQuiz();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [quizStarted, timeLeft]);

    const handleStartQuiz = () => {
        setQuizStarted(true);
        setStartTime(Date.now());
    };

    const handleAnswerSelect = (answer: string) => {
        const currentQuestion = questions[currentQuestionIndex];
        setSelectedAnswers(prev => ({
            ...prev,
            [currentQuestion._id]: answer
        }));
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handlePrevQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const handleSubmitQuiz = async () => {
        if (submitting) return;

        setSubmitting(true);
        try {
            const token = localStorage.getItem("token");
            const timeTaken = Math.floor((Date.now() - startTime) / 1000);

            const answerPayload = questions.map((q) => ({
                questionId: q._id,
                userAnswer: selectedAnswers[q._id] || ""
            }));

            const res = await fetch(`${API_URL}/questions/validateanswer`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ answers: answerPayload })
            });

            const data = await res.json();
            console.log("Validation response:", data);

            if (!res.ok || !data.results) {
                setError(data.message || "Validation failed.");
                return;
            }

            // ✅ Store result in localStorage or pass via query/state (choose one)
            // ✅ Generate a temporary quizId
            const quizId = Date.now(); // or use Date.now() for simplicity

            // ✅ Store validated answers in localStorage with key
            localStorage.setItem(`quiz_solution_${quizId}`, JSON.stringify({
                results: data.results,
                subject,
                type,
                timeTaken,
            }));

            // 🔁 Redirect with quizId
            router.push(`/dashboard/user/result/${quizId}`);



        } catch (err) {
            console.error("Validation error:", err);
            setError("Something went wrong.");
        } finally {
            setSubmitting(false);
        }
    };


    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getProgressPercentage = () => {
        return ((currentQuestionIndex + 1) / questions.length) * 100;
    };

    const getAnsweredCount = () => {
        return Object.keys(selectedAnswers).length;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading questions...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">❌</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={() => router.push("/dashboard/user")}
                        className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (!quizStarted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="text-6xl mb-6">🎯</div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-4">
                        {subject} {type === "quiz" ? "Quiz" : "Practice Paper"}
                    </h1>
                    <div className="space-y-4 mb-8">
                        <div className="flex items-center justify-between text-gray-600">
                            <span>📝 Questions:</span>
                            <span className="font-semibold">{questions.length}</span>
                        </div>
                        <div className="flex items-center justify-between text-gray-600">
                            <span>⏱️ Duration:</span>
                            <span className="font-semibold">{formatTime(timeLeft)}</span>
                        </div>
                        <div className="flex items-center justify-between text-gray-600">
                            <span>📊 Type:</span>
                            <span className="font-semibold">{type === "quiz" ? "Quiz" : "Practice Paper"}</span>
                        </div>
                    </div>
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 text-left">
                        <p className="text-sm text-yellow-800">
                            <span className="font-semibold">⚠️ Instructions:</span>
                            <br />• Answer all questions before time runs out
                            <br />• You can navigate between questions
                            <br />• Click submit when you're done
                            <br />• Timer starts when you click "Start {type === "quiz" ? "Quiz" : "Practice"}"
                        </p>
                    </div>
                    <button
                        onClick={handleStartQuiz}
                        className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold py-4 px-6 rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
                    >
                        🚀 Start {type === "quiz" ? "Quiz" : "Practice"}
                    </button>
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">
                                {subject} {type === "quiz" ? "Quiz" : "Practice Paper"}
                            </h1>
                            <p className="text-gray-600">
                                Question {currentQuestionIndex + 1} of {questions.length}
                            </p>
                        </div>
                        <div className="flex items-center space-x-4 mt-4 md:mt-0">
                            <div className="text-center">
                                <div className={`text-2xl font-bold ${timeLeft <= 300 ? 'text-red-600' : 'text-indigo-600'}`}>
                                    {formatTime(timeLeft)}
                                </div>
                                <div className="text-sm text-gray-600">Time Left</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">
                                    {getAnsweredCount()}/{questions.length}
                                </div>
                                <div className="text-sm text-gray-600">Answered</div>
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                        <div className="bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${getProgressPercentage()}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Question Card */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">
                            {currentQuestion.question}
                        </h2>
                        {currentQuestion.questionImage && (
                            <img
                                src={currentQuestion.questionImage}
                                alt="Question"
                                className="max-w-full h-auto rounded-lg mb-4"
                            />
                        )}
                    </div>

                    {/* Options */}
                    <div className="space-y-3">
                        {currentQuestion.options.map((option, index) => (
                            <button
                                key={index}
                                onClick={() => handleAnswerSelect(option)}
                                className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${selectedAnswers[currentQuestion._id] === option
                                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                    }`}
                            >
                                <div className="flex items-center">
                                    <div className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center ${selectedAnswers[currentQuestion._id] === option
                                        ? "border-indigo-500 bg-indigo-500"
                                        : "border-gray-300"
                                        }`}>
                                        {selectedAnswers[currentQuestion._id] === option && (
                                            <div className="w-2 h-2 bg-white rounded-full"></div>
                                        )}
                                    </div>
                                    <span className="font-medium">{option}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex justify-between items-center">
                    <button
                        onClick={handlePrevQuestion}
                        disabled={currentQuestionIndex === 0}
                        className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${currentQuestionIndex === 0
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-gray-600 text-white hover:bg-gray-700"
                            }`}
                    >
                        ← Previous
                    </button>

                    <div className="flex space-x-4">
                        {currentQuestionIndex === questions.length - 1 ? (
                            <button
                                onClick={handleSubmitQuiz}
                                disabled={submitting}
                                className="bg-green-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                                {submitting ? "Submitting..." : "Submit Quiz"}
                            </button>
                        ) : (
                            <button
                                onClick={handleNextQuestion}
                                className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
                            >
                                Next →
                            </button>
                        )}
                    </div>
                </div>

                {/* Question Navigator */}
                <div className="mt-6 bg-white rounded-2xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Question Navigator</h3>
                    <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                        {questions.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentQuestionIndex(index)}
                                className={`w-10 h-10 rounded-lg font-semibold transition-all duration-200 ${index === currentQuestionIndex
                                    ? "bg-indigo-600 text-white"
                                    : selectedAnswers[questions[index]._id]
                                        ? "bg-green-500 text-white"
                                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                    }`}
                            >
                                {index + 1}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
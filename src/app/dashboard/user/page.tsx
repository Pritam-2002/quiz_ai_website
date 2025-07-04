"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "../../../../config/config";
import Header from "@/components/client/header/Header";
import NoQuiz from "@/components/client/noquiz/NoQuiz";

interface QuizGroup {
    subject: string;
    type: string;
    questions: any[];
}

export default function UserDashboard() {
    const [quizzes, setQuizzes] = useState<QuizGroup[]>([]);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Fetch token from localStorage
    useEffect(() => {
        if (typeof window !== "undefined") {
            const storedToken = localStorage.getItem("token");
            setToken(storedToken);
        }
    }, []);

    // Fetch quizzes after token is available
    useEffect(() => {
        if (!token) return;

        const fetchQuizzes = async () => {
            try {
                setLoading(true);
                const res = await fetch(`${API_URL}/questions/getquestions`, {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });

                const data = await res.json();
                if (res.ok && data.questions) {
                    // Group by subject + type
                    const grouped = Object.values(
                        data.questions.reduce((acc: any, q: any) => {
                            const subject = q.subject || "General";
                            const type = q.type || "quiz";
                            const key = `${subject}-${type}`;

                            if (!acc[key]) {
                                acc[key] = {
                                    subject,
                                    type,
                                    questions: [],
                                };
                            }
                            acc[key].questions.push(q);
                            return acc;
                        }, {})
                    );
                    setQuizzes(grouped);
                } else {
                    console.error("❌ API Error:", data.message || data.error);
                }
            } catch (err) {
                console.error("❌ Failed to fetch quizzes", err);
            } finally {
                setLoading(false);
            }
        };

        fetchQuizzes();
    }, [token]);

    const handleStartQuiz = (subject: string, type: string) => {
        router.push(`/dashboard/user/start/${subject}?type=${type}`);
    };

    const getSubjectIcon = (subject: string) => {
        const icons: { [key: string]: string } = {
            "Mathematics": "🧮",
            "Science": "🔬",
            "Physics": "⚛️",
            "Chemistry": "🧪",
            "Biology": "🧬",
            "History": "📜",
            "Geography": "🌍",
            "English": "📚",
            "Computer Science": "💻",
            "Programming": "⌨️",
            "General": "📖",
        };
        return icons[subject] || "📝";
    };

    const getTypeColor = (type: string) => {
        return type === "quiz" ? "bg-blue-500" : "bg-green-500";
    };

    const getTypeLabel = (type: string) => {
        return type === "quiz" ? "Quiz" : "Practice Paper";
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading quizzes...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
            <div className="max-w-7xl mx-auto">

                <Header />
                {/* Quiz Cards */}
                {quizzes.length === 0 ? (
                    <NoQuiz />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {quizzes.map((quiz: QuizGroup, index: number) => (
                            <div
                                key={`${quiz.subject}-${quiz.type}-${index}`}
                                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-200 overflow-hidden"
                            >
                                {/* Card Header */}
                                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-3xl">{getSubjectIcon(quiz.subject)}</span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(quiz.type)} text-white`}>
                                            {getTypeLabel(quiz.type)}
                                        </span>
                                    </div>
                                    <h2 className="text-xl font-bold mb-1">{quiz.subject}</h2>
                                    <p className="text-indigo-100 text-sm">
                                        {quiz.questions.length} Question{quiz.questions.length !== 1 ? 's' : ''}
                                    </p>
                                </div>

                                {/* Card Body */}
                                <div className="p-6">
                                    <div className="mb-4">
                                        <div className="flex items-center text-gray-600 mb-2">
                                            <span className="text-sm">📊 Questions: <span className="font-semibold text-gray-800">{quiz.questions.length}</span></span>
                                        </div>
                                        <div className="flex items-center text-gray-600">
                                            <span className="text-sm">📝 Format: <span className="font-semibold text-gray-800">{getTypeLabel(quiz.type)}</span></span>
                                        </div>
                                    </div>


                                    <div className="mb-4">
                                        <div className="bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${Math.min(100, (quiz.questions.length / 10) * 100)}%` }}
                                            ></div>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {quiz.questions.length < 10 ? 'Short' : quiz.questions.length < 20 ? 'Medium' : 'Long'} {getTypeLabel(quiz.type).toLowerCase()}
                                        </p>
                                    </div>


                                    <button
                                        onClick={() => handleStartQuiz(quiz.subject, quiz.type)}
                                        className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 shadow-md hover:shadow-lg"
                                    >
                                        <span className="flex items-center justify-center">
                                            <span className="mr-2">🚀</span>
                                            Start {getTypeLabel(quiz.type)}
                                        </span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
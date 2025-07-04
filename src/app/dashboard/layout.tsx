// app/dashboard/layout.tsx
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-gray-100">
            <header className="bg-blue-900 text-white p-4 text-center font-bold">
                AI Powered Quiz App
            </header>
            <main className="p-4">{children}</main>
        </div>
    );
}

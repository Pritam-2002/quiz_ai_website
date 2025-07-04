// app/dashboard/user/page.tsx
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function UserDashboardRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/dashboard/user/start");
    }, []);

    return <div>Redirecting to your quiz...</div>;
}

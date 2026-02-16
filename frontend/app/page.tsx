"use client";

import { useRouter } from "next/navigation";

export default function Home() {
    const router = useRouter();

    return (
    <div className="flex items-center justify-center h-screen">
        <button onClick={() => router.push("/login")} className="bg-blue-600 text-white px-6 py-3 rounded-lg">
        Ir para Login
        </button>
    </div>
    );
}

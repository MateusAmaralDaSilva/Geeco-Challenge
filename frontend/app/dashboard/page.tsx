"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Dashboard() {
    const router = useRouter();

    useEffect(() => {
    const checkUser = async () => {
        const { data } = await supabase.auth.getUser();

        if (!data.user) {
            router.push("/login");
        }
    };

    checkUser();
    }, []);

    const logout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
    };

    return (
    <div className="p-10">
        <h1 className="text-3xl font-bold mb-6">
        Dashboard
        </h1>
        <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded">
        Sair
        </button>
    </div>
    );
}

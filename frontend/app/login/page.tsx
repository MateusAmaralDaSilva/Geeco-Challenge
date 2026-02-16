"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Login() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = async () => {
        const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        alert(error.message);
        } else {
        router.push("/dashboard");
    }
};

    const handleRegister = async () => {
        const { error } = await supabase.auth.signUp({
        email,
        password,
        });

        if (error) {
        alert(error.message);
        } else {
        alert("Usuário criado! Verifique seu email.");
        }
    };

    return (
        <div className="flex items-center justify-center h-screen">
        <div className="bg-white p-8 rounded-xl shadow-lg w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">
        Login Geeco
        </h1>

        <input type="email" placeholder="Email" className="w-full mb-3 p-2 border rounded" onChange={(e) => setEmail(e.target.value)}/>

        <input type="password" placeholder="Senha" className="w-full mb-4 p-2 border rounded" onChange={(e) => setPassword(e.target.value)}/>

        <button onClick={handleLogin} className="w-full bg-blue-600 text-white py-2 rounded mb-3"> 
            Entrar 
        </button>

        <button onClick={handleRegister} className="w-full bg-gray-200 py-2 rounded" >
            Criar Conta
        </button>

        </div>
        </div>
    );
}

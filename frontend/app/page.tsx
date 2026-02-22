"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase-client";
import { Lock, Mail, Loader2, Leaf } from "lucide-react";

export default function LoginPage() {
    const supabase = createSupabaseClient();
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg(null);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setErrorMsg("E-mail ou senha incorretos.");
            setLoading(false);
            return;
        }

        router.push("/dashboard");
    };

    const handleRegister = async () => {
        setLoading(true);
        setErrorMsg(null);
        const { error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            setErrorMsg(error.message);
        } else {
            alert("Conta criada! Verifique seu e-mail se a confirmação estiver ativa.");
        }
        setLoading(false);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
            <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
                <div className="flex flex-col items-center mb-8">
                    <div className="bg-emerald-100 p-3 rounded-full mb-4">
                        <Leaf className="text-emerald-700" size={32} />
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                        Geeco Manager
                    </h1>
                    <p className="text-gray-500 text-sm mt-2 font-medium">
                        Gestão Inteligente de Fornecedores
                    </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                    {errorMsg && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-bold text-center border border-red-100 animate-pulse">
                            {errorMsg}
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700 uppercase ml-1">E-mail</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input 
                                type="email" 
                                placeholder="exemplo@geeco.com" 
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-gray-900 font-medium placeholder:text-gray-400" 
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700 uppercase ml-1">Senha</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input 
                                type="password" 
                                placeholder="••••••••" 
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-gray-900 font-medium placeholder:text-gray-400" 
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button 
                        type="submit"
                        disabled={loading}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-xl shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : "ENTRAR NO SISTEMA"}
                    </button>
                </form>

                <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-gray-100"></span>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-gray-400 font-bold tracking-widest">Novo por aqui?</span>
                    </div>
                </div>

                <button 
                    onClick={handleRegister} 
                    type="button"
                    className="w-full bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold py-3 rounded-xl border border-gray-200 transition-all"
                >
                    CRIAR MINHA CONTA
                </button>
            </div>
        </div>
    );
}
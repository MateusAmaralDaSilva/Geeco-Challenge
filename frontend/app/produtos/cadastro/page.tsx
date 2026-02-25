"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { ArrowLeft, Save, Loader2, Package } from "lucide-react";
import Link from "next/link";

export default function NovoProduto() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [token, setToken] = useState<string | null>(null);

    // FormData para segurar os dados do formulário
    const [formData, setFormData] = useState({
        nome: ""
    });

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push("/");
                return;
            }
            setToken(session.access_token);
        };
        getSession();
    }, [router, supabase]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!token) {
            alert("Erro de autenticação. Tente fazer login novamente.");
            setLoading(false);
            return;
        }

        try {
            const payload = {
                nome: formData.nome
            };

            const res = await fetch("http://127.0.0.1:8001/produtos/cadastro", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}` 
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                router.push("/dashboard");
            } else {
                const errorData = await res.json();
                console.error("🔴 ERRO DE VALIDAÇÃO DO PYTHON:", errorData);
                alert(`Erro ao salvar produto: ${JSON.stringify(errorData.detail || "Erro desconhecido")}`);
            }
        } catch (error) {
            console.error("Erro de conexão:", error);
            alert("Erro ao conectar com o servidor.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8 flex justify-center">
            <div className="w-full max-w-2xl">
                {/* Cabeçalho */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <Link href="/dashboard" className="flex items-center text-emerald-700 font-bold hover:underline mb-2">
                            <ArrowLeft size={20} className="mr-2" /> Voltar ao Dashboard
                        </Link>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Novo Material / Produto</h1>
                        <p className="text-gray-500">Adicione um novo item ao catálogo do sistema.</p>
                    </div>
                </div>

                {/* Formulário Card */}
                <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-500 uppercase ml-1">Nome do Produto</label>
                            <div className="relative">
                                <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-700" size={18} />
                                <input 
                                    required
                                    placeholder="ex: cimento cp ii 50kg"
                                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-black text-gray-900 tracking-wide transition-all placeholder:text-gray-300 placeholder:font-medium"
                                    value={formData.nome}
                                    onChange={e => setFormData({...formData, nome: e.target.value.toLowerCase()})}
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-black py-4 rounded-xl shadow-lg shadow-emerald-200/50 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wider mt-4"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <><Save size={20} /> Cadastrar Produto</>}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
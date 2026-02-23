"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import { ArrowLeft, Send, Bot, User, Loader2, Sparkles } from "lucide-react";

type Message = {
    id: string;
    role: "user" | "ai";
    content: string;
};

export default function PaginaConsultaIA() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "1",
            role: "ai",
            content: "Olá! Sou o assistente virtual do sistema. Eu conheço todos os nossos fornecedores, suas categorias, localizações e os produtos que eles fornecem. O que você gostaria de saber hoje?"
        }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    async function handleSendMessage(e: React.FormEvent) {
        e.preventDefault();
        
        if (!input.trim()) return;

        const textoPergunta = input.trim();
        setInput(""); // Limpa o input imediatamente

        // 1. Adiciona a pergunta do usuário na tela
        const newUserMessage: Message = { id: Date.now().toString(), role: "user", content: textoPergunta };
        setMessages((prev) => [...prev, newUserMessage]);
        setIsLoading(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            
            // 2. Chama a nossa nova rota do Python
            const response = await fetch("http://127.0.0.1:8001/IA", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ pergunta: textoPergunta })
            });

            if (response.ok) {
                const data = await response.json();
                
                // 3. Adiciona a resposta da IA na tela
                const newAiMessage: Message = { 
                    id: (Date.now() + 1).toString(), 
                    role: "ai", 
                    content: data.resposta 
                };
                setMessages((prev) => [...prev, newAiMessage]);
            } else {
                const errorData = await response.json();
                console.error("Erro da API:", errorData);
                const errorMessage: Message = { 
                    id: (Date.now() + 1).toString(), 
                    role: "ai", 
                    content: `Desculpe, encontrei um erro ao processar: ${JSON.stringify(errorData.detail)}` 
                };
                setMessages((prev) => [...prev, errorMessage]);
            }
        } catch (error) {
            console.error("Erro de conexão:", error);
            const errorMessage: Message = { 
                id: (Date.now() + 1).toString(), 
                role: "ai", 
                content: "Não foi possível conectar ao servidor. Verifique se a API do FastAPI está rodando." 
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8 flex flex-col items-center">
            
            <div className="w-full max-w-4xl flex flex-col h-[90vh] bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
                
                {/* CABEÇALHO DO CHAT */}
                <div className="bg-emerald-800 p-6 flex items-center justify-between text-white shrink-0">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="p-2 bg-emerald-700/50 hover:bg-emerald-700 rounded-xl transition-colors">
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-black flex items-center gap-2">
                                <Sparkles size={24} className="text-emerald-300" />
                                Inteligência Artificial
                            </h1>
                            <p className="text-emerald-200 text-sm font-medium">Assistente de Consulta de Fornecedores e Produtos</p>
                        </div>
                    </div>
                </div>

                {/* ÁREA DE MENSAGENS */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                            
                            <div className={`flex gap-4 max-w-[80%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                                
                                {/* ÍCONE DO AVATAR */}
                                <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${msg.role === "user" ? "bg-emerald-200 text-emerald-800" : "bg-gray-900 text-white shadow-md"}`}>
                                    {msg.role === "user" ? <User size={20} /> : <Bot size={20} />}
                                </div>

                                {/* BALÃO DE MENSAGEM */}
                                <div className={`p-5 rounded-3xl shadow-sm ${msg.role === "user" ? "bg-emerald-600 text-white rounded-tr-sm" : "bg-white border border-gray-100 text-gray-800 rounded-tl-sm"}`}>
                                    <p className="whitespace-pre-wrap leading-relaxed font-medium">
                                        {msg.content}
                                    </p>
                                </div>
                                
                            </div>
                        </div>
                    ))}

                    {/* INDICADOR DE CARREGAMENTO */}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="flex gap-4 max-w-[80%]">
                                <div className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-gray-900 text-white shadow-md">
                                    <Bot size={20} />
                                </div>
                                <div className="p-5 rounded-3xl rounded-tl-sm bg-white border border-gray-100 shadow-sm flex items-center gap-2 text-gray-500 font-bold">
                                    <Loader2 size={18} className="animate-spin text-emerald-600" />
                                    Analisando dados...
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Elemento âncora para o scroll automático */}
                    <div ref={messagesEndRef} />
                </div>

                {/* ÁREA DO INPUT */}
                <div className="p-4 md:p-6 bg-white border-t border-gray-100 shrink-0">
                    <form onSubmit={handleSendMessage} className="flex gap-3">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ex: Quais fornecedores de São Paulo vendem cabo elétrico?"
                            className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl p-4 md:p-5 font-medium text-gray-800 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className="bg-emerald-700 text-white px-6 md:px-8 rounded-2xl font-black hover:bg-emerald-800 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {isLoading ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}
                        </button>
                    </form>
                    <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-3">
                        As respostas são geradas pela IA e baseadas estritamente na sua base de dados.
                    </p>
                </div>

            </div>
        </div>
    );
}
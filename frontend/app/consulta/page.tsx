"use client";

import { useState } from "react";

export default function ConsultaIA() {
    const [demanda, setDemanda] = useState("");
    const [resposta, setResposta] = useState("");
    const [loading, setLoading] = useState(false);

    const perguntarIA = async () => {
        setLoading(true);
        // Aqui você chamará seu endpoint de RAG que criaremos no backend
        const res = await fetch("http://127.0.0.1:8001/consulta-ia", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mensagem: demanda })
        });
        const data = await res.json();
        setResposta(data.resposta);
        setLoading(false);
    };

    return (
        <div className="p-10 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Consulta Inteligente de Fornecedores</h1>
            <p className="text-gray-600 mb-6">Descreva sua necessidade (ex: "Preciso de cimento para entrega em 24h")</p>
            
            <textarea 
                className="w-full p-4 border rounded-lg shadow-sm"
                rows={4}
                value={demanda}
                onChange={(e) => setDemanda(e.target.value)}
                placeholder="Digite sua demanda aqui..."
            />
            
            <button 
                onClick={perguntarIA}
                disabled={loading}
                className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
                {loading ? "Analisando com IA..." : "Buscar Recomendações"}
            </button>

            {resposta && (
                <div className="mt-8 p-6 bg-blue-50 border-l-4 border-blue-500 rounded">
                    <h3 className="font-bold mb-2">Recomendação da IA:</h3>
                    <p className="whitespace-pre-wrap">{resposta}</p>
                </div>
            )}
        </div>
    );
}
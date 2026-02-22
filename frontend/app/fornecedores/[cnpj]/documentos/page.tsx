"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { ArrowLeft, Upload, Calendar, FileUp, Loader2, Tag } from "lucide-react";
import Link from "next/link";

export default function PaginaUploadDocumentos() {
    const params = useParams();
    const router = useRouter();
    
    const cnpjCru = params.cnpj as string;
    const cnpj = cnpjCru ? cnpjCru.replace(/\D/g, "") : "";

    const [file, setFile] = useState<File | null>(null);
    const [validade, setValidade] = useState("");
    const [tipoDocumento, setTipoDocumento] = useState("Contrato Social");
    const [enviando, setEnviando] = useState(false);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    async function handleUpload(e: React.FormEvent) {
        e.preventDefault();
        
        if (!file || !validade || !tipoDocumento) {
            alert("Por favor, preencha todos os campos e insira o arquivo.");
            return;
        }

        setEnviando(true);
        const formData = new FormData();
        formData.append("cnpj", cnpj);
        formData.append("validade", validade);
        formData.append("tipo_documento", tipoDocumento);
        formData.append("file", file);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            
            const response = await fetch("http://127.0.0.1:8001/documentos/upload", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${session?.access_token}`,
                },
                body: formData,
            });

            if (response.ok) {
                router.push(`/fornecedores/${cnpj}`);
                router.refresh();
            } else {
                const error = await response.json();
                console.error("ERRO DO PYTHON:", error);
                alert(`Erro: ${JSON.stringify(error.detail)}`);
            }
        } catch (err) {
            alert("Falha ao conectar com o servidor.");
        } finally {
            setEnviando(false);
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-10">
            <div className="max-w-2xl mx-auto">
                <Link href={`/fornecedores/${cnpj}`} className="flex items-center text-emerald-700 font-bold mb-8 hover:underline group w-fit">
                    <ArrowLeft size={20} className="mr-2 transition-transform group-hover:-translate-x-1" /> 
                    Voltar aos Detalhes
                </Link>

                <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="bg-emerald-100 p-3 rounded-2xl text-emerald-700">
                            <FileUp size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 italic">Upload de Documento</h1>
                            <p className="text-gray-500 font-medium">CNPJ: {cnpj}</p>
                        </div>
                    </div>

                    <form onSubmit={handleUpload} className="space-y-6">
                        
                        <div className={`border-2 border-dashed rounded-2xl p-8 transition-colors flex flex-col items-center justify-center gap-3 cursor-pointer ${file ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-emerald-300'}`}>
                            <input 
                                type="file" 
                                id="file-upload" 
                                className="hidden" 
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                            />
                            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center w-full h-full">
                                <Upload size={40} className={file ? 'text-emerald-600' : 'text-gray-400'} />
                                <span className="mt-2 font-bold text-gray-900 text-center">
                                    {file ? file.name : "Clique para selecionar o arquivo"}
                                </span>
                                <span className="text-xs text-gray-400 uppercase font-black tracking-widest mt-1 italic">PDF, PNG ou JPG</span>
                            </label>
                        </div>

                        {/* Grid otimizado: Tipo e Validade lado a lado */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest mb-2 italic">
                                    <Tag size={14} /> Tipo de Documento
                                </label>
                                <select 
                                    required
                                    value={tipoDocumento}
                                    onChange={(e) => setTipoDocumento(e.target.value)}
                                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                >   
                                    <option value="Alvará">Alvará</option>
                                    <option value="Apresentação Institucional">Apresentação Institucional</option>
                                    <option value="Certificado">Certificado</option>
                                    <option value="Contrato Social">Contrato Social</option>
                                    <option value="Tabela de Preços">Tabela de Preços</option>
                                    <option value="Outros">Outros</option>
                                </select>
                            </div>

                            <div>
                                <label className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest mb-2 italic">
                                    <Calendar size={14} /> Data de Validade
                                </label>
                                <input 
                                    type="date" 
                                    required
                                    value={validade}
                                    onChange={(e) => setValidade(e.target.value)}
                                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                />
                            </div>
                        </div>
                        
                        <button 
                            type="submit" 
                            disabled={enviando}
                            className="w-full bg-emerald-700 text-white py-5 rounded-2xl font-black text-xl hover:bg-emerald-800 transition-all shadow-xl shadow-emerald-200 flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {enviando ? (
                                <>
                                    <Loader2 className="animate-spin" /> Processando...
                                </>
                            ) : (
                                "Finalizar e Salvar"
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
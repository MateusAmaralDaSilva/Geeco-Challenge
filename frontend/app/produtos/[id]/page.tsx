"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import { 
    ArrowLeft, Package, Building2, MapPin, 
    Star, AlertCircle, Tag, Layers, Plus, Trash2, X, Edit
} from "lucide-react";

const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function DetalhesProduto() {
    const params = useParams();
    const router = useRouter();
    
    // Estados
    const [produto, setProduto] = useState<any>(null);
    const [fornecedores, setFornecedores] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState<string | null>(null);
    
    // Controles de Modal
    const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false); // Novo Estado

    async function carregarDados() {
        const produtoId = params.id;
        if (!produtoId) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push("/");
                return;
            }

            const headers = { 
                "Authorization": `Bearer ${session.access_token}`,
                "Cache-Control": "no-store"
            };

            const resProduto = await fetch(`http://127.0.0.1:8001/produtos/${produtoId}`, { headers });
            if (!resProduto.ok) throw new Error("Produto não encontrado.");
            const dataP = await resProduto.json();
            const dadosProdutoTratados = Array.isArray(dataP) ? dataP[0] : dataP;

            const resFornecedores = await fetch(`http://127.0.0.1:8001/produtos/${produtoId}/fornecedores`, { headers });
            
            let fornecedoresVinculados = [];
            if (resFornecedores.ok) {
                const jsonF = await resFornecedores.json();
                fornecedoresVinculados = Array.isArray(jsonF) ? jsonF : (jsonF.data || []);
            }

            setProduto(dadosProdutoTratados);
            setFornecedores(fornecedoresVinculados);
            
        } catch (err: any) {
            setErro(err.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        let isMounted = true;
        if (isMounted) carregarDados();
        return () => { isMounted = false };
    }, [params.id, router]);

    // --- NOVA FUNÇÃO: DELETAR PRODUTO ---
    async function deletarProduto() {
        const confirmacao = window.confirm(`Tem certeza que deseja EXCLUIR o item ${produto.nome}? Todos os vínculos com fornecedores serão perdidos.`);
        if (!confirmacao) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`http://127.0.0.1:8001/produtos/${produto.id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${session?.access_token}` }
            });

            if (response.ok) {
                alert("Material excluído com sucesso!");
                router.push("/dashboard");
            } else {
                const errorData = await response.json();
                alert(`Erro ao excluir: ${errorData.detail}`);
            }
        } catch (error) {
            alert("Erro de conexão com o servidor ao tentar excluir.");
        }
    }

    async function desvincularFornecedor(cnpjParaRemover: string) {
        const confirmacao = window.confirm("Deseja remover este fornecedor da lista deste material?");
        if (!confirmacao) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const cnpjLimpo = cnpjParaRemover.replace(/\D/g, '');
            
            const response = await fetch(`http://127.0.0.1:8001/fornecedores/${cnpjLimpo}/produtos/${produto.id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${session?.access_token}` }
            });

            if (response.ok) {
                setFornecedores(fornecedores.filter((f: any) => f.cnpj !== cnpjParaRemover));
            } else {
                const errorData = await response.json();
                alert(`Erro ao remover vínculo: ${errorData.detail}`);
            }
        } catch (error) {
            alert("Erro de conexão ao tentar remover vínculo.");
        }
    }

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-700"></div>
            <p className="mt-4 text-emerald-700 font-bold tracking-widest uppercase text-sm">Carregando Material...</p>
        </div>
    );

    if (erro || !produto) return (
        <div className="flex flex-col items-center justify-center min-h-screen p-10 bg-gray-50">
            <AlertCircle className="text-red-500 mb-4" size={48} />
            <h2 className="text-2xl font-black text-gray-900 tracking-tighter">Material não encontrado</h2>
            <p className="text-gray-500 mt-2 font-medium">{erro || "O ID informado não existe na base de dados."}</p>
            <Link href="/dashboard" className="mt-6 bg-gray-900 text-white px-8 py-3 rounded-xl font-black hover:bg-emerald-600 transition-all shadow-lg">
                VOLTAR AO DASHBOARD
            </Link>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-10">
            <div className="max-w-5xl mx-auto">
                <Link href="/dashboard" className="flex items-center text-emerald-700 font-bold mb-8 hover:underline group w-fit">
                    <ArrowLeft size={20} className="mr-2 transition-transform group-hover:-translate-x-1" /> 
                    Voltar ao Dashboard
                </Link>

                {/* CARD PRINCIPAL DO PRODUTO (ATUALIZADO COM BOTÕES) */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-gray-200 overflow-hidden mb-8">
                    <div className="p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-emerald-700 text-white">
                        <div className="flex items-center gap-6">
                            <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
                                <Package size={40} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl md:text-5xl font-black tracking-tighter mb-2">{produto.nome}</h1>
                                <div className="flex items-center gap-3">
                                    <span className="flex items-center gap-1 bg-black/20 px-3 py-1 rounded-lg text-sm font-bold uppercase tracking-widest">
                                        <Tag size={14} /> REF-{produto.id.toString().padStart(4, '0')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* NOVOS BOTOES DE AÇÃO */}
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => setIsEditModalOpen(true)} 
                                className="flex items-center justify-center p-3 text-white bg-white/10 hover:bg-white/30 rounded-xl transition-colors tooltip" 
                                title="Editar Material"
                            >
                                <Edit size={20} />
                            </button>
                            <button 
                                onClick={deletarProduto} 
                                className="flex items-center justify-center p-3 text-red-100 bg-red-600/30 hover:bg-red-500 rounded-xl transition-colors tooltip" 
                                title="Excluir Material"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* SEÇÃO DE FORNECEDORES VINCULADOS */}
                <div className="mb-6 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2 mb-2 tracking-tighter">
                            <Layers className="text-emerald-700" /> Rede de Fornecimento
                        </h2>
                        <p className="text-gray-500 font-medium">Empresas homologadas que fornecem este material.</p>
                    </div>
                    
                    <button 
                        onClick={() => setIsSupplierModalOpen(true)}
                        className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl font-black text-sm hover:bg-emerald-600 transition-all shadow-md"
                    >
                        <Plus size={16} /> VINCULAR FORNECEDOR
                    </button>
                </div>

                {fornecedores.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {fornecedores.map((f: any) => (
                            <div key={f.cnpj} className="bg-white p-6 rounded-3xl border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all group flex flex-col justify-between relative">
                                
                                <button 
                                    onClick={() => desvincularFornecedor(f.cnpj)}
                                    className="absolute top-6 right-6 p-2 text-gray-300 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors"
                                    title="Remover fornecedor deste produto"
                                >
                                    <Trash2 size={18} />
                                </button>

                                <div>
                                    <div className="flex justify-between items-start mb-4 pr-8">
                                        <div className="flex items-center gap-3">
                                            {f.favorito ? (
                                                <div className="bg-yellow-100 p-2 rounded-xl">
                                                    <Star size={20} className="text-yellow-600 fill-yellow-600" />
                                                </div>
                                            ) : (
                                                <div className="bg-gray-100 p-2 rounded-xl text-gray-400">
                                                    <Building2 size={20} />
                                                </div>
                                            )}
                                            <div>
                                                <h3 className="font-black text-gray-900 text-lg group-hover:text-emerald-700 transition-colors">
                                                    {f.empresa}
                                                </h3>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                                    {f.categoria}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 text-gray-500 font-medium text-sm mb-6">
                                        <MapPin size={16} className="text-emerald-600" />
                                        {f.localização}
                                    </div>
                                </div>

                                <Link 
                                    href={`/fornecedores/${f.cnpj.replace(/\D/g, '')}`} 
                                    className="w-full text-center bg-gray-50 hover:bg-emerald-600 hover:text-white text-gray-700 font-black py-3 rounded-xl transition-all text-sm"
                                >
                                    VER DETALHES DA EMPRESA
                                </Link>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white p-12 rounded-[2rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
                        <Building2 size={64} className="text-gray-200 mb-4" />
                        <h3 className="text-xl font-black text-gray-800 mb-2">Sem fornecedores vinculados</h3>
                        <p className="text-gray-500 font-medium max-w-md">
                            Atualmente não há nenhuma empresa em nossa base registrada como fornecedora deste item.
                        </p>
                    </div>
                )}
            </div>

            {/* MODAIS */}
            {isEditModalOpen && (
                <ModalEditarProduto 
                    produto={produto} 
                    onClose={() => setIsEditModalOpen(false)}
                    onSuccess={(dadosAtualizados: any) => setProduto(dadosAtualizados)}
                    supabase={supabase}
                />
            )}

            {isSupplierModalOpen && (
                <ModalVincularFornecedor 
                    produto={produto} 
                    fornecedoresAtuais={fornecedores} 
                    onClose={() => setIsSupplierModalOpen(false)} 
                    onSuccess={carregarDados} 
                    supabase={supabase}
                />
            )}
        </div>
    );
}

function ModalEditarProduto({ produto, onClose, onSuccess, supabase }: any) {
    const [formData, setFormData] = useState({
        nome: produto.nome || ""
    });
    const [salvando, setSalvando] = useState(false);

    async function handleUpdate(e: React.FormEvent) {
        e.preventDefault();
        setSalvando(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`http://127.0.0.1:8001/produtos/${produto.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session?.access_token}`
                },
                body: JSON.stringify(formData) 
            });

            if (response.ok) {
                alert("Material atualizado com sucesso!");
                onSuccess({ ...produto, ...formData }); 
                onClose();
            } else {
                const errorData = await response.json();
                alert(`Erro ao atualizar: ${errorData.detail}`);
            }
        } catch (error) {
            alert("Erro ao conectar com o servidor.");
        } finally {
            setSalvando(false);
        }
    }

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-black text-gray-800 italic tracking-tighter">Editar Material</h2>
                    <button onClick={onClose} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                <form onSubmit={handleUpdate} className="space-y-4">
                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Nome do Item</label>
                        <input 
                            required 
                            type="text" 
                            value={formData.nome} 
                            onChange={(e) => setFormData({...formData, nome: e.target.value})} 
                            className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all" 
                        />
                    </div>

                    <div className="flex gap-3 mt-8 pt-4 border-t border-gray-100">
                        <button type="button" onClick={onClose} className="flex-1 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-all">Cancelar</button>
                        <button type="submit" disabled={salvando} className="flex-1 py-3 font-black bg-emerald-700 text-white rounded-xl hover:bg-emerald-800 transition-all shadow-lg disabled:opacity-50">
                            {salvando ? "Salvando..." : "Salvar"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}


function ModalVincularFornecedor({ produto, fornecedoresAtuais, onClose, onSuccess, supabase }: any) {
    const [todosFornecedores, setTodosFornecedores] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchFornecedores() {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const res = await fetch(`http://127.0.0.1:8001/fornecedores`, {
                    headers: { "Authorization": `Bearer ${session?.access_token}` }
                });
                
                if (res.ok) {
                    const data = await res.json();
                    const arrayData = Array.isArray(data) ? data : data.data || [];
                    const listaSegura = Array.isArray(fornecedoresAtuais) ? fornecedoresAtuais : [];
                    const disponiveis = arrayData.filter((f: any) => !listaSegura.some((fa: any) => fa.cnpj === f.cnpj));
                    setTodosFornecedores(disponiveis);
                }
            } catch (err) { 
                console.error(err); 
            } finally { 
                setLoading(false); 
            }
        }
        fetchFornecedores();
    }, [fornecedoresAtuais, supabase]);

    async function vincular(cnpj: string) {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const cnpjLimpo = cnpj.replace(/\D/g, '');
            
            const res = await fetch(`http://127.0.0.1:8001/fornecedores/${cnpjLimpo}/produtos/${produto.id}`, {
                method: "POST", 
                headers: { "Authorization": `Bearer ${session?.access_token}` }
            });
            
            if (res.ok) {
                onSuccess();
                onClose();
            } else {
                const errData = await res.json();
                alert(`Erro: ${errData.detail}`);
            }
        } catch (err) { 
            alert("Erro ao tentar vincular o fornecedor."); 
        }
    }

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-black text-gray-800 tracking-tighter">Vincular Fornecedor</h2>
                    <button onClick={onClose} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"><X size={20} /></button>
                </div>
                
                {loading ? (
                    <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700"></div></div>
                ) : todosFornecedores.length > 0 ? (
                    <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-2">
                        {todosFornecedores.map(f => (
                            <div key={f.cnpj} className="flex justify-between items-center p-4 border border-gray-100 rounded-2xl hover:border-emerald-200 hover:bg-emerald-50 transition-colors">
                                <div>
                                    <span className="font-bold text-gray-800 block leading-tight">{f.empresa}</span>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{f.categoria}</span>
                                </div>
                                <button onClick={() => vincular(f.cnpj)} className="bg-gray-900 text-white px-4 py-2 rounded-xl text-xs font-black hover:bg-emerald-600 transition-colors">
                                    ADICIONAR
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-gray-500 p-8 font-medium">Todos os fornecedores cadastrados já fornecem este produto.</p>
                )}
            </div>
        </div>
    );
}
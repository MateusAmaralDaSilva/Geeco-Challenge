"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import { 
    ArrowLeft, Globe, MapPin, Building2, Star, 
    AlertCircle, FileText, Download, Calendar, User, Plus,
    Trash2, Edit, X, Package, Layers, Phone, Mail, UserCheck
} from "lucide-react";

const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function DetalhesFornecedor() {
    const params = useParams();
    const router = useRouter();
    
    // Estados principais
    const [fornecedor, setFornecedor] = useState<any>(null);
    const [documentos, setDocumentos] = useState<any[]>([]);
    const [produtos, setProdutos] = useState<any[]>([]); 
    const [representantes, setRepresentantes] = useState<any[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState<string | null>(null);
    
    // Controles de Modais
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false); 
    const [isRepModalOpen, setIsRepModalOpen] = useState(false);
    // NOVO: Estado para o Modal de Edição de Documentos
    const [documentoSendoEditado, setDocumentoSendoEditado] = useState<any>(null);

    async function carregarDados() {
        const cnpjLimpo = params.cnpj || params.id;
        if (!cnpjLimpo) return;

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

            const resFornecedor = await fetch(`http://127.0.0.1:8001/fornecedores/${cnpjLimpo}`, { headers });
            if (!resFornecedor.ok) throw new Error("Não foi possível carregar os dados do fornecedor.");
            const dataFornecedor = await resFornecedor.json();

            const resDocs = await fetch(`http://127.0.0.1:8001/fornecedores/${cnpjLimpo}/documentos`, { headers });
            let dataDocs = [];
            if (resDocs.ok) {
                const jsonDocs = await resDocs.json();
                dataDocs = Array.isArray(jsonDocs) ? jsonDocs : (jsonDocs.data || []);
            }

            const resProdutos = await fetch(`http://127.0.0.1:8001/fornecedores/${cnpjLimpo}/produtos`, { headers });
            let dataProdutos = [];
            if (resProdutos.ok) {
                const jsonProdutos = await resProdutos.json();
                dataProdutos = Array.isArray(jsonProdutos) ? jsonProdutos : (jsonProdutos.data || []);
            }

            const resReps = await fetch(`http://127.0.0.1:8001/representantes?cnpj_fornecedor=${cnpjLimpo}`, { headers });
            let dataReps = [];
            if (resReps.ok) {
                const jsonReps = await resReps.json();
                dataReps = Array.isArray(jsonReps) ? jsonReps : (jsonReps.data || []);
            }

            setFornecedor(Array.isArray(dataFornecedor) ? dataFornecedor[0] : dataFornecedor);
            setDocumentos(dataDocs);
            setProdutos(dataProdutos);
            setRepresentantes(dataReps);
            
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
    }, [params, router]);

    // Funções de Exclusão
    async function deletarFornecedor() {
        const confirmacao = window.confirm(`Tem certeza que deseja EXCLUIR o fornecedor ${fornecedor.empresa}? Esta ação não pode ser desfeita.`);
        if (!confirmacao) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const cnpjLimpo = fornecedor.cnpj.replace(/\D/g, '');
            const response = await fetch(`http://127.0.0.1:8001/fornecedores/${cnpjLimpo}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${session?.access_token}` }
            });
            if (response.ok) {
                alert("Fornecedor excluído com sucesso!");
                router.push("/dashboard");
            } else {
                const errorData = await response.json();
                alert(`Erro ao excluir: ${errorData.detail}`);
            }
        } catch (error) { alert("Erro de conexão com o servidor ao tentar excluir."); }
    }

    async function desvincularProduto(idProduto: number) {
        const confirmacao = window.confirm("Deseja remover este item da lista de fornecimento?");
        if (!confirmacao) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const cnpjLimpo = fornecedor.cnpj.replace(/\D/g, '');
            const response = await fetch(`http://127.0.0.1:8001/fornecedores/${cnpjLimpo}/produtos/${idProduto}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${session?.access_token}` }
            });
            if (response.ok) {
                setProdutos(produtos.filter((p: any) => p.id !== idProduto));
            } else {
                const errorData = await response.json();
                alert(`Erro ao remover vínculo: ${errorData.detail}`);
            }
        } catch (error) { alert("Erro de conexão ao tentar remover vínculo."); }
    }

    async function deletarRepresentante(idRep: number) {
        const confirmacao = window.confirm("Deseja remover este contato?");
        if (!confirmacao) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`http://127.0.0.1:8001/representantes/${idRep}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${session?.access_token}` }
            });
            if (response.ok) {
                setRepresentantes(representantes.filter((r: any) => r.id !== idRep));
            } else {
                const errorData = await response.json();
                alert(`Erro ao excluir: ${errorData.detail}`);
            }
        } catch (error) { alert("Erro de conexão ao tentar excluir contato."); }
    }

    // Deletar Documento
    async function deletarDocumento(idDoc: number, nomeArquivo: string) {
        const confirmacao = window.confirm(`Tem certeza que deseja apagar o arquivo "${nomeArquivo}"?`);
        if (!confirmacao) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            // AJUSTE A ROTA ABAIXO CONFORME SEU BACKEND
            const response = await fetch(`http://127.0.0.1:8001/documentos/${idDoc}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${session?.access_token}` }
            });
            if (response.ok) {
                setDocumentos(documentos.filter((d: any) => d.id !== idDoc));
            } else {
                const errorData = await response.json();
                alert(`Erro ao apagar arquivo: ${JSON.stringify(errorData.detail)}`);
            }
        } catch (error) { alert("Erro de conexão ao tentar apagar o documento."); }
    }

    const handleDownload = async (caminhoStorage: string, filename: string, e: React.MouseEvent) => {
        e.preventDefault();
        
        if (!caminhoStorage) return alert("Caminho do arquivo não encontrado no banco.");
        
        try {
            // 1. Pede para o Supabase gerar um link temporário (válido por 60 segundos)
            // Lembre-se de confirmar se o nome do seu bucket é "documentos" mesmo
            const { data, error } = await supabase.storage
                .from('Documentos')
                .createSignedUrl(caminhoStorage, 60);
                
            if (error || !data) {
                console.error("Erro no Supabase:", error);
                return alert("Não foi possível gerar o link de download.");
            }
            // 2. Faz o download usando o link seguro gerado
            const response = await fetch(data.signedUrl);
            if (!response.ok) throw new Error("Erro de rede.");
            
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = blobUrl;
            a.download = filename || 'documento'; 
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(blobUrl);
            
        } catch (error) { 
            console.error(error);
            alert("Falha ao baixar o documento."); 
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-700"></div>
            <p className="mt-4 text-emerald-700 font-bold tracking-widest uppercase text-sm">Carregando Perfil...</p>
        </div>
    );

    if (erro || !fornecedor) return (
        <div className="flex flex-col items-center justify-center min-h-screen p-10 bg-gray-50">
            <AlertCircle className="text-red-500 mb-4" size={48} />
            <h2 className="text-2xl font-bold text-gray-800">Fornecedor não encontrado</h2>
            <p className="text-gray-500 mt-2">{erro || "O CNPJ informado não consta na nossa base."}</p>
            <Link href="/dashboard" className="mt-6 bg-gray-900 text-white px-8 py-3 rounded-xl font-black hover:bg-emerald-600 transition-all shadow-lg">
                VOLTAR AO DASHBOARD
            </Link>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-10">
            <div className="max-w-6xl mx-auto space-y-8">
                
                <Link href="/dashboard" className="flex items-center text-emerald-700 font-bold hover:underline group w-fit">
                    <ArrowLeft size={20} className="mr-2 transition-transform group-hover:-translate-x-1" /> 
                    Voltar ao Dashboard
                </Link>

                {/* 1. CARD PRINCIPAL */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-8 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-4xl font-black text-gray-900 leading-tight">{fornecedor.empresa}</h1>
                                {fornecedor.favorito && <Star size={24} className="text-yellow-500 fill-yellow-500" />}
                            </div>
                            <div className="flex items-center gap-2 text-gray-500 bg-gray-100 w-fit px-3 py-1 rounded-md text-sm font-bold">
                                <FileText size={14} /> CNPJ: {fornecedor.cnpj}
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <span className={`px-4 py-2 rounded-xl font-black text-xs tracking-widest uppercase ${fornecedor.favorito ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-500'}`}>
                                {fornecedor.favorito ? "★ Preferencial" : "Comum"}
                            </span>
                            <div className="h-8 w-px bg-gray-200 mx-2"></div>
                            
                            <button onClick={() => setIsEditModalOpen(true)} className="flex items-center justify-center p-3 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors tooltip" title="Editar Fornecedor">
                                <Edit size={20} />
                            </button>
                            <button onClick={deletarFornecedor} className="flex items-center justify-center p-3 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors tooltip" title="Excluir Fornecedor">
                                <Trash2 size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3">
                        <div className="p-8 border-r border-gray-100 space-y-6">
                            <div>
                                <h3 className="text-xs font-black text-gray-400 uppercase mb-3 tracking-widest italic">Informações Base</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-gray-700">
                                        <Building2 className="text-emerald-600" size={20} />
                                        <span className="font-bold">{fornecedor.categoria}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-700">
                                        <MapPin className="text-emerald-600" size={20} />
                                        <span className="font-bold">{fornecedor.localização}</span>
                                    </div>
                                    {fornecedor.link_site && (
                                        <a href={fornecedor.link_site} target="_blank" className="flex items-center gap-3 text-emerald-700 hover:underline">
                                            <Globe size={20} /> <span className="font-bold">Acessar Website</span>
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-8 md:col-span-2 bg-gray-50/50 flex flex-col justify-center">
                            <h3 className="text-xs font-black text-emerald-800 uppercase mb-3 tracking-widest italic">Descrição do Serviço</h3>
                            <p className="text-gray-700 leading-relaxed font-medium text-lg whitespace-pre-line">
                                {fornecedor.descrição || "Sem descrição disponível."}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 2. CONTATOS E REPRESENTANTES */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                            <UserCheck className="text-emerald-700" /> Representantes
                        </h2>
                        <button 
                            onClick={() => setIsRepModalOpen(true)}
                            className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl font-black text-sm hover:bg-emerald-600 transition-all shadow-md"
                        >
                            <Plus size={16} /> NOVO CONTATO
                        </button>
                    </div>

                    {representantes.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {representantes.map((rep: any) => (
                                <div key={rep.id} className="bg-white p-6 rounded-3xl border border-gray-200 flex flex-col justify-between hover:border-emerald-300 transition-colors shadow-sm relative group">
                                    <button 
                                        onClick={() => deletarRepresentante(rep.id)}
                                        className="absolute top-4 right-4 p-2 text-gray-300 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors"
                                        title="Remover Contato"
                                    >
                                        <Trash2 size={18} />
                                    </button>

                                    <div className="flex items-center gap-4 mb-4 pr-8">
                                        <div className={`p-4 rounded-2xl ${rep.atual ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                                            <User size={28} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className={`font-black text-xl leading-tight ${rep.atual ? 'text-gray-900' : 'text-gray-500 line-through'}`}>{rep.nome}</h3>
                                            </div>
                                            <span className={`inline-block mt-1 text-[9px] px-2 py-0.5 rounded-md font-black uppercase tracking-widest ${rep.atual ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                                {rep.atual ? "Atual" : "Antigo"}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-2 mt-2 pt-4 border-t border-gray-100">
                                        <div className="flex items-center gap-3 font-medium">
                                            <Phone size={16} className={rep.contato ? "text-emerald-600" : "text-gray-300"} /> 
                                            <span className={rep.contato ? "text-gray-600" : "text-gray-400 italic text-sm"}>
                                                {rep.contato || "Telefone não informado"}
                                            </span>
                                        </div>
                                        
                                        <div className="flex items-center gap-3 font-medium">
                                            <Mail size={16} className={rep.email ? "text-emerald-600" : "text-gray-300"} /> 
                                            <span className={rep.email ? "text-gray-600" : "text-gray-400 italic text-sm"}>
                                                {rep.email || "E-mail não informado"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-10 bg-white rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center text-center">
                            <UserCheck size={40} className="mb-3 text-gray-300" />
                            <p className="font-bold text-gray-500">Nenhum contato cadastrado.</p>
                        </div>
                    )}
                </div>

                {/* 3. SEÇÃO DE PRODUTOS VINCULADOS */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                            <Package className="text-emerald-700" /> Itens Fornecidos
                        </h2>
                        <button 
                            onClick={() => setIsProductModalOpen(true)}
                            className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl font-black text-sm hover:bg-emerald-600 transition-all shadow-md"
                        >
                            <Plus size={16} /> VINCULAR ITEM
                        </button>
                    </div>
                    
                    {produtos.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {produtos.map((p: any, idx: number) => (
                                <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between group hover:border-emerald-300 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl">
                                            <Layers size={20} />
                                        </div>
                                        <div>
                                            <p className="font-black text-gray-900 leading-tight">{p.nome || `Produto #${p.id}`}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => desvincularProduto(p.id)}
                                        className="p-2 text-gray-300 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors"
                                        title="Remover fornecimento"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white p-8 rounded-3xl border-2 border-dashed border-gray-200 text-center flex flex-col items-center">
                            <Package size={32} className="text-gray-300 mb-2" />
                            <p className="font-bold text-gray-500">Esta empresa ainda não possui produtos vinculados no sistema.</p>
                        </div>
                    )}
                </div>

                {/* 4. SEÇÃO DE DOCUMENTOS TÉCNICOS */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                            <FileText className="text-emerald-700" /> Documentação Técnica
                        </h2>
                        <Link 
                            href={`/fornecedores/${fornecedor.cnpj.replace(/\D/g, '')}/documentos`} 
                            className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl font-black text-sm hover:bg-emerald-600 transition-all shadow-md"
                        >
                            <Plus size={16} /> NOVO ARQUIVO
                        </Link>
                    </div>

                    {documentos.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {documentos.map((doc: any) => (
                                <div key={doc.id} className="bg-white p-5 rounded-2xl border border-gray-200 flex items-center justify-between hover:border-emerald-300 transition-colors shadow-sm group">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-emerald-50 p-3 rounded-xl text-emerald-700">
                                            <FileText size={24} />
                                        </div>
                                        <div>
                                            <p className="font-black text-gray-900 truncate max-w-[200px]" title={doc.nome_arquivo}>{doc.nome_arquivo}</p>
                                            <div className="flex gap-4 text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-widest">
                                                <span className="flex items-center gap-1"><Calendar size={10}/> Vence: {new Date(doc.validade).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <a 
                                            href="#"
                                            onClick={(e) => handleDownload(doc.caminho_storage, doc.nome_arquivo, e)}
                                            className="p-3 text-gray-400 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition-colors"
                                            title="Baixar Documento"
                                        >
                                            <Download size={18} />
                                        </a>
                                        {/*  BOTÃO DE EDITAR DOCUMENTO */}
                                        <button 
                                            onClick={() => setDocumentoSendoEditado(doc)}
                                            className="p-3 text-gray-400 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors"
                                            title="Editar Documento"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        {/* BOTÃO DE DELETAR DOCUMENTO */}
                                        <button 
                                            onClick={() => deletarDocumento(doc.id, doc.nome_arquivo)}
                                            className="p-3 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-colors"
                                            title="Excluir Documento"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-12 bg-white rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center text-center">
                            <FileText size={48} className="mb-4 text-gray-200" />
                            <p className="font-bold text-gray-500">Nenhum documento arquivado ainda.</p>
                            <p className="text-sm text-gray-400 mt-1">Faça o upload de contratos, certidões ou tabelas de preços.</p>
                        </div>
                    )}
                </div>

            </div>

            {/* MODAIS EXISTENTES */}
            {isEditModalOpen && (
                <ModalEditarFornecedor 
                    fornecedor={fornecedor} 
                    onClose={() => setIsEditModalOpen(false)}
                    onSuccess={(dadosAtualizados: any) => setFornecedor(dadosAtualizados)}
                />
            )}

            {isProductModalOpen && (
                <ModalVincularProduto 
                    fornecedor={fornecedor} 
                    produtosAtuais={produtos} 
                    onClose={() => setIsProductModalOpen(false)} 
                    onSuccess={carregarDados} 
                />
            )}

            {isRepModalOpen && (
                <ModalAdicionarRepresentante 
                    fornecedor={fornecedor}
                    onClose={() => setIsRepModalOpen(false)}
                    onSuccess={carregarDados}
                />
            )}

            {/* NOVO MODAL DE EDIÇÃO DE DOCUMENTO */}
            {documentoSendoEditado && (
                <ModalEditarDocumento
                    documento={documentoSendoEditado}
                    onClose={() => setDocumentoSendoEditado(null)}
                    onSuccess={carregarDados}
                />
            )}
        </div>
    );
}

// ==========================================
// COMPONENTES SECUNDÁRIOS (MODAIS)
// ==========================================

// NOVO COMPONENTE: ModalEditarDocumento
function ModalEditarDocumento({ documento, onClose, onSuccess }: any) {
    const [formData, setFormData] = useState({
        nome_arquivo: documento.nome_arquivo || "",
        validade: documento.validade ? new Date(documento.validade).toISOString().split('T')[0] : ""
    });
    // NOVO: Estado para segurar o arquivo novo (se o usuário selecionar)
    const [arquivoNovo, setArquivoNovo] = useState<File | null>(null);
    const [salvando, setSalvando] = useState(false);

    async function handleUpdate(e: React.FormEvent) {
        e.preventDefault();
        setSalvando(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            
            // NOVO: Criando um FormData em vez de JSON
            const payload = new FormData();
            payload.append("nome_arquivo", formData.nome_arquivo);
            payload.append("validade", formData.validade);
            
            if (arquivoNovo) {
                payload.append("file", arquivoNovo);
            }

            const response = await fetch(`http://127.0.0.1:8001/documentos/${documento.id}`, {
                method: "PUT",
                headers: {
                    // ATENÇÃO: NÃO coloque "Content-Type" aqui quando usar FormData!
                    "Authorization": `Bearer ${session?.access_token}`
                },
                body: payload 
            });

            if (response.ok) {
                onSuccess(); 
                onClose();
            } else {
                const errorData = await response.json();
                console.error(errorData)
                alert(`Erro ao atualizar: ${JSON.stringify(errorData.detail)}`);
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
                    <h2 className="text-2xl font-black text-gray-800 tracking-tighter">Editar Documento</h2>
                    <button onClick={onClose} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                <form onSubmit={handleUpdate} className="space-y-4">
                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Nome do Arquivo</label>
                        <input required type="text" value={formData.nome_arquivo} onChange={(e) => setFormData({...formData, nome_arquivo: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
                    </div>
                    
                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Data de Validade</label>
                        <input required type="date" value={formData.validade} onChange={(e) => setFormData({...formData, validade: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
                    </div>

                    {/* INPUT DE ARQUIVO */}
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Substituir Arquivo (Opcional)</label>
                        <input 
                            type="file" 
                            onChange={(e) => {
                                if (e.target.files && e.target.files.length > 0) {
                                    setArquivoNovo(e.target.files[0]);
                                    // Atualiza o nome do arquivo no formulário para refletir o novo arquivo selecionado
                                    setFormData({...formData, nome_arquivo: e.target.files[0].name});
                                }
                            }}
                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-emerald-100 file:text-emerald-700 hover:file:bg-emerald-200 transition-all cursor-pointer"
                        />
                    </div>

                    <div className="flex gap-3 mt-8 pt-4 border-t border-gray-100">
                        <button type="button" onClick={onClose} className="flex-1 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-all">Cancelar</button>
                        <button type="submit" disabled={salvando} className="flex-1 py-3 font-black bg-emerald-700 text-white rounded-xl hover:bg-emerald-800 transition-all shadow-lg disabled:opacity-50">
                            {salvando ? "Salvando..." : "Salvar Alterações"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function ModalAdicionarRepresentante({ fornecedor, onClose, onSuccess }: any) {
    const [formData, setFormData] = useState({
        nome: "",
        contato: "", 
        email: "",
        atual: true 
    });
    const [salvando, setSalvando] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSalvando(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            
            const payload = {
                ...formData,
                cnpj_fornecedor: fornecedor.cnpj.replace(/\D/g, '')
            };

            const response = await fetch(`http://127.0.0.1:8001/representantes/cadastro`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session?.access_token}`
                },
                body: JSON.stringify(payload) 
            });

            if (response.ok) {
                onSuccess(); 
                onClose();
            } else {
                const errorData = await response.json();
                console.error("ERRO:", errorData);
                alert(`Erro ao adicionar contato: ${JSON.stringify(errorData.detail)}`);
            }
        } catch (error) { alert("Erro ao conectar com o servidor."); } 
        finally { setSalvando(false); }
    }

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-black text-gray-800 tracking-tighter">Novo Contato</h2>
                    <button onClick={onClose} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Nome Completo</label>
                        <input required type="text" value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Telefone / WhatsApp</label>
                        <input required type="text" placeholder="(00) 00000-0000" value={formData.contato} onChange={(e) => setFormData({...formData, contato: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">E-mail</label>
                        <input required type="email" placeholder="contato@empresa.com" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
                    </div>

                    <label className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-xl cursor-pointer group hover:bg-emerald-100 transition-colors mt-2">
                        <input type="checkbox" checked={formData.atual} onChange={(e) => setFormData({...formData, atual: e.target.checked})} className="w-5 h-5 accent-emerald-600 rounded" />
                        <span className="font-bold text-emerald-800">Este é um contato atual da empresa</span>
                    </label>

                    <div className="flex gap-3 mt-8 pt-4 border-t border-gray-100">
                        <button type="button" onClick={onClose} className="flex-1 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-all">Cancelar</button>
                        <button type="submit" disabled={salvando} className="flex-1 py-3 font-black bg-emerald-700 text-white rounded-xl hover:bg-emerald-800 transition-all shadow-lg disabled:opacity-50">
                            {salvando ? "Salvando..." : "Salvar Contato"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function ModalVincularProduto({ fornecedor, produtosAtuais, onClose, onSuccess }: any) {
    const [todosProdutos, setTodosProdutos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchProdutos() {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const res = await fetch(`http://127.0.0.1:8001/produtos`, {
                    headers: { "Authorization": `Bearer ${session?.access_token}` }
                });
                
                if (res.ok) {
                    const data = await res.json();
                    const arrayData = Array.isArray(data) ? data : data.data || [];
                    const disponiveis = arrayData.filter((p: any) => !produtosAtuais.some((pa: any) => pa.id === p.id));
                    setTodosProdutos(disponiveis);
                }
            } catch (err) { console.error(err); } 
            finally { setLoading(false); }
        }
        fetchProdutos();
    }, [produtosAtuais]);

    async function vincular(idProduto: number) {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const cnpjLimpo = fornecedor.cnpj.replace(/\D/g, '');
            const res = await fetch(`http://127.0.0.1:8001/fornecedores/${cnpjLimpo}/produtos/${idProduto}`, {
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
        } catch (err) { alert("Erro ao tentar vincular o produto."); }
    }

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-black text-gray-800 tracking-tighter">Vincular Produto</h2>
                    <button onClick={onClose} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"><X size={20} /></button>
                </div>
                
                {loading ? (
                    <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700"></div></div>
                ) : todosProdutos.length > 0 ? (
                    <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-2">
                        {todosProdutos.map(p => (
                            <div key={p.id} className="flex justify-between items-center p-4 border border-gray-100 rounded-2xl hover:border-emerald-200 hover:bg-emerald-50 transition-colors">
                                <span className="font-bold text-gray-800">{p.nome}</span>
                                <button onClick={() => vincular(p.id)} className="bg-gray-900 text-white px-4 py-2 rounded-xl text-xs font-black hover:bg-emerald-600 transition-colors">ADICIONAR</button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-gray-500 p-8 font-medium">Todos os produtos disponíveis no sistema já estão vinculados a este fornecedor.</p>
                )}
            </div>
        </div>
    );
}

function ModalEditarFornecedor({ fornecedor, onClose, onSuccess }: any) {
    const [formData, setFormData] = useState({
        empresa: fornecedor.empresa || "",
        cnpj: fornecedor.cnpj || "", 
        categoria: fornecedor.categoria || "",
        localização: fornecedor.localização || "",
        link_site: fornecedor.link_site || "",
        descrição: fornecedor.descrição || "",
        favorito: fornecedor.favorito || false
    });
    const [salvando, setSalvando] = useState(false);

    async function handleUpdate(e: React.FormEvent) {
        e.preventDefault();
        setSalvando(true);
        try {
            // Usa o cliente Supabase global (que está no topo do seu arquivo)
            const { data: { session } } = await supabase.auth.getSession();
            
            // Pega o CNPJ da URL (que já vem do banco) e limpa para colocar no endereço da API
            const cnpjLimpoUrl = fornecedor.cnpj.replace(/\D/g, '');

            // 🛠️ O PAYLOAD BLINDADO PARA EVITAR O ERRO 400:
            const payload = {
                ...formData,
                // 1. Limpa os pontos e barras do CNPJ antes de mandar para o banco (deixa só números)
                cnpj: formData.cnpj.replace(/\D/g, ''),
                
                // 2. Garante que o site vai como 'null' se o campo estiver vazio, evitando erro de URL inválida
                link_site: formData.link_site && formData.link_site.trim() !== "" ? formData.link_site : null
            };

            const response = await fetch(`http://127.0.0.1:8001/fornecedores/${cnpjLimpoUrl}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session?.access_token}`
                },
                body: JSON.stringify(payload) 
            });

            if (response.ok) {
                alert("Fornecedor atualizado com sucesso!");
                onSuccess(payload); // Atualiza os dados instantaneamente na tela
                onClose();
            } else {
                const errorData = await response.json();
                console.error("Erro do Backend:", errorData);
                alert(`Erro ao atualizar: ${JSON.stringify(errorData.detail)}`);
            }
        } catch (error) { 
            alert("Erro ao conectar com o servidor."); 
        } finally { 
            setSalvando(false); 
        }
    }

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-black text-gray-900 tracking-tighter">Editar Fornecedor</h2>
                    <button onClick={onClose} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                <form onSubmit={handleUpdate} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            {/* Textos mais escuros e bordas com maior contraste */}
                            <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-1">Empresa</label>
                            <input required type="text" value={formData.empresa} onChange={(e) => setFormData({...formData, empresa: e.target.value})} className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-1">CNPJ</label>
                            <input required type="text" value={formData.cnpj} onChange={(e) => setFormData({...formData, cnpj: e.target.value})} className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-1">Categoria</label>
                            <input required type="text" value={formData.categoria} onChange={(e) => setFormData({...formData, categoria: e.target.value})} className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-1">CEP / Localização</label>
                            <input required type="text" value={formData.localização} onChange={(e) => setFormData({...formData, localização: e.target.value})} className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-1">Link do Site (Opcional)</label>
                        <input type="url" value={formData.link_site || ""} onChange={(e) => setFormData({...formData, link_site: e.target.value})} className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all" placeholder="https://..." />
                    </div>

                    <div>
                        <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-1">Descrição</label>
                        <textarea rows={4} value={formData.descrição} onChange={(e) => setFormData({...formData, descrição: e.target.value})} className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 font-medium text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
                    </div>

                    <label className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl cursor-pointer group hover:bg-emerald-100 transition-colors">
                        <input type="checkbox" checked={formData.favorito} onChange={(e) => setFormData({...formData, favorito: e.target.checked})} className="w-5 h-5 accent-emerald-600 rounded" />
                        <span className="font-bold text-emerald-900">Marcar como Fornecedor Preferencial</span>
                    </label>

                    <div className="flex gap-3 mt-8 pt-4 border-t border-gray-200">
                        <button type="button" onClick={onClose} className="flex-1 py-3 font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-all">Cancelar</button>
                        <button type="submit" disabled={salvando} className="flex-1 py-3 font-black bg-emerald-700 text-white rounded-xl hover:bg-emerald-800 transition-all shadow-lg disabled:opacity-50">
                            {salvando ? "Salvando..." : "Salvar Alterações"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
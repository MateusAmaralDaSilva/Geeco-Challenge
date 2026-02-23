"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";
import { 
    PlusCircle, 
    Search, 
    Star, 
    LogOut, 
    Sparkles, 
    MapPin, 
    Filter, 
    Package, 
    Users
} from "lucide-react";

export default function DashboardPage() {
    // Estados de Controle de Visão e Dados
    const [view, setView] = useState<"fornecedores" | "produtos">("fornecedores");
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("todos");
    const [filterUf, setFilterUf] = useState("todos");
    
    const [fornecedores, setFornecedores] = useState<any[]>([]);
    const [produtos, setProdutos] = useState<any[]>([]);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        let isMounted = true;

        async function getData() {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) { 
                    window.location.href = "/"; 
                    return; 
                }
                
                if (isMounted) setUser(session.user);

                const headers = {
                    "Authorization": `Bearer ${session.access_token}`,
                    "Cache-Control": "no-store"
                };

                const [resFornecedores, resProdutos] = await Promise.all([
                    fetch("http://127.0.0.1:8001/fornecedores", { headers }),
                    fetch("http://127.0.0.1:8001/produtos", { headers })
                ]);

                if (resFornecedores.ok) {
                    const jsonF = await resFornecedores.json();
                    const arrayF = Array.isArray(jsonF) ? jsonF : (jsonF.data || []);
                    const fornecedoresOrdenados = arrayF.sort((a: any, b: any) => (b.favorito === true ? 1 : 0) - (a.favorito === true ? 1 : 0));
                    if (isMounted) setFornecedores(fornecedoresOrdenados);
                }

                if (resProdutos.ok) {
                    const jsonP = await resProdutos.json();
                    const arrayP = Array.isArray(jsonP) ? jsonP : (jsonP.data || []);
                    const produtosOrdenados = arrayP.sort((a: any, b: any) => a.nome.localeCompare(b.nome));
                    if (isMounted) setProdutos(produtosOrdenados);
                }

            } catch (error) {
                console.error("🔴 Erro ao carregar dados do painel:", error);
            } finally {
                if (isMounted) setLoading(false);
            }
        }
        
        getData();
        return () => { isMounted = false; };
    }, [supabase]);

    // Lógicas de Filtro
    const fornecedoresFiltrados = fornecedores.filter(f => {
        const matchesSearch = f.empresa.toLowerCase().includes(searchTerm.toLowerCase()) || f.categoria.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === "todos" ? true : (filterStatus === "preferencial" ? f.favorito : !f.favorito);
        const ufDaLinha = f.localização?.split("-").pop()?.trim();
        const matchesUf = filterUf === "todos" ? true : ufDaLinha === filterUf;
        return matchesSearch && matchesStatus && matchesUf;
    });

    const produtosFiltrados = produtos.filter(p => p.nome.toLowerCase().includes(searchTerm.toLowerCase()));

    const ufsDisponiveis = Array.from(new Set(fornecedores.map(f => f.localização?.split("-").pop()?.trim()).filter(Boolean))).sort() as string[];

    if (loading) return <div className="flex h-screen items-center justify-center bg-gray-50 text-emerald-700 font-black animate-pulse text-2xl">CARREGANDO GEECO MANAGER...</div>;

    // Lógica para o botão dinâmico
    const hrefNovoCadastro = view === "fornecedores" ? "/fornecedores/cadastro" : "/produtos/cadastro";
    const textoNovoCadastro = view === "fornecedores" ? "Novo Fornecedor" : "Novo Produto";

    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className="w-64 bg-emerald-700 text-white flex flex-col fixed h-full shadow-xl z-20">
                <div className="p-6 text-2xl font-black border-b border-emerald-800 tracking-tighter">Geeco Manager</div>
                <nav className="flex-1 p-4 space-y-2">
                    <button onClick={() => { setView("fornecedores"); setSearchTerm(""); }} 
                        className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all ${view === "fornecedores" ? "bg-emerald-800 shadow-inner scale-105 font-bold" : "hover:bg-emerald-600 opacity-80"}`}>
                        <Users size={20} /> <span>Fornecedores</span>
                    </button>
                    <button onClick={() => { setView("produtos"); setSearchTerm(""); }} 
                        className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all ${view === "produtos" ? "bg-emerald-800 shadow-inner scale-105 font-bold" : "hover:bg-emerald-600 opacity-80"}`}>
                        <Package size={20} /> <span>Produtos</span>
                    </button>
                    <div className="pt-4 border-t border-emerald-800/50 mt-4">
                        <Link href={hrefNovoCadastro} className="flex items-center space-x-3 p-3 hover:bg-emerald-600 rounded-xl transition-all">
                            <PlusCircle size={20} /> <span>{textoNovoCadastro}</span>
                        </Link>
                    </div>
                </nav>
                <div className="p-4 border-t border-emerald-800">
                    <button onClick={() => supabase.auth.signOut().then(() => window.location.href = "/")} className="flex items-center space-x-3 p-3 w-full hover:bg-emerald-600 rounded-xl transition-all font-bold"><LogOut size={20} /> <span>Sair</span></button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-10 ml-64">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter leading-none">
                            {view === "fornecedores" ? "Parceiros de Negócio" : "Inventário de Itens"}
                        </h1>
                        <p className="text-gray-500 font-bold mt-2">Visualizando {view === "fornecedores" ? "base de fornecedores" : "lista de materiais"}</p>
                    </div>
                    <div className="bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100 text-sm">
                        <span className="text-gray-500 font-medium">Usuário: </span>
                        <span className="text-emerald-700 font-black">{user?.email}</span>
                    </div>
                </header>

                {/* Filtros e Busca */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 mb-8 space-y-4">
                    <div className="flex gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input type="text" placeholder={`O que você está procurando em ${view}?`} className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none text-gray-900 font-bold placeholder:text-gray-400 transition-all shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                        <Link href="/IA" className="bg-emerald-900 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-black transition-all shadow-lg active:scale-95"><Sparkles size={18} /> BUSCA IA</Link>
                    </div>

                    {view === "fornecedores" && (
                        <div className="flex flex-wrap gap-4 items-center text-xs animate-in slide-in-from-top-2 duration-300">
                            <div className="flex items-center gap-2 text-gray-400 uppercase font-black tracking-widest"><Filter size={14} /> Filtrar:</div>
                            <select className="p-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-800 font-bold outline-none focus:ring-2 focus:ring-emerald-500" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                                <option value="todos">Todos Status</option>
                                <option value="preferencial">Preferenciais</option>
                                <option value="comum">Comuns</option>
                            </select>
                            <select className="p-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-800 font-bold outline-none focus:ring-2 focus:ring-emerald-500" value={filterUf} onChange={(e) => setFilterUf(e.target.value)}>
                                <option value="todos">Todos Estados</option>
                                {ufsDisponiveis.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                            </select>
                        </div>
                    )}
                </div>

                {/* Tabela Principal */}
                <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-200">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                            {view === "fornecedores" ? (
                                <tr>
                                    <th className="p-5 font-black text-gray-400 text-[10px] uppercase tracking-widest">Empresa</th>
                                    <th className="p-5 font-black text-gray-400 text-[10px] uppercase tracking-widest">Categoria</th>
                                    <th className="p-5 font-black text-gray-400 text-[10px] uppercase tracking-widest">Localização</th>
                                    <th className="p-5 font-black text-gray-400 text-[10px] uppercase tracking-widest text-center">Status</th>
                                    <th className="p-5 font-black text-gray-400 text-[10px] uppercase tracking-widest text-center">Ações</th>
                                </tr>
                            ) : (
                                <tr>
                                    <th className="p-5 font-black text-gray-400 text-[10px] uppercase tracking-widest">Item / Material</th>
                                    <th className="p-5 font-black text-gray-400 text-[10px] uppercase tracking-widest">Código Interno</th>
                                    <th className="p-5 font-black text-gray-400 text-[10px] uppercase tracking-widest text-center">Ações</th>
                                </tr>
                            )}
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {view === "fornecedores" ? (
                                fornecedoresFiltrados.map((f) => (
                                    <tr key={f.cnpj} className="hover:bg-emerald-50/30 transition-all group">
                                        <td className="p-5"><div className="flex items-center space-x-3">{f.favorito && <Star size={18} className="text-yellow-500 fill-yellow-500" />}<span className="font-bold text-gray-900 text-lg group-hover:text-emerald-700">{f.empresa}</span></div></td>
                                        <td className="p-5"><span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase border border-gray-200">{f.categoria}</span></td>
                                        <td className="p-5 text-gray-500 font-bold text-sm"><div className="flex items-center gap-1"><MapPin size={14} className="text-emerald-600" /> {f.localização}</div></td>
                                        <td className="p-5 text-center">{f.favorito ? <span className="px-3 py-1 bg-green-100 text-green-800 text-[10px] rounded-full font-black border border-green-200">PREFERENCIAL</span> : <span className="px-3 py-1 bg-gray-50 text-gray-400 text-[10px] rounded-full font-bold border border-gray-100">COMUM</span>}</td>
                                        <td className="p-5 text-center"><Link href={`/fornecedores/${f.cnpj.replace(/\D/g, '')}`} className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-xs font-black hover:bg-emerald-600 transition shadow-md">DETALHES</Link></td>
                                    </tr>
                                ))
                            ) : (
                                produtosFiltrados.map((p) => (
                                    <tr key={p.id} className="hover:bg-emerald-50/30 transition-all group">
                                        <td className="p-5 font-bold text-gray-900 text-lg group-hover:text-emerald-700">{p.nome}</td>
                                        <td className="p-5 text-gray-400 font-mono text-sm tracking-tighter">{p.id.toString().padStart(4, '0')}</td>
                                        <td className="p-5 text-center">
                                            {/* --- LINK PARA A NOVA PÁGINA --- */}
                                            <Link href={`/produtos/${p.id}`} className="inline-block bg-gray-900 text-white px-5 py-2.5 rounded-xl text-xs font-black hover:bg-emerald-600 transition shadow-md">
                                                VER FORNECEDORES
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
}
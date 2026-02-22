"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { ArrowLeft, Building2, MapPin, Globe, Save, Loader2, FileText, Tag } from "lucide-react";
import Link from "next/link";

export default function NovoFornecedor() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [token, setToken] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        cnpj: "",
        empresa: "",
        localização: "", 
        cep_input: "",   
        link_site: "",
        descrição: "",
        categoria: "", 
        favorito: false
    });

    // --- LÓGICA DE AUTOCOMPLETE DINÂMICO ---
    const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
    // Em vez de uma lista estática, agora temos um state que será preenchido pela API
    const [categoriasDoBanco, setCategoriasDoBanco] = useState<string[]>([]);
    const categoriaRef = useRef<HTMLDivElement>(null);
    
    // Filtra as categorias (que vieram do banco) com base no que o usuário digitou
    const sugestoesFiltradas = categoriasDoBanco.filter(cat => 
        cat.toLowerCase().includes(formData.categoria.toLowerCase()) && 
        cat !== formData.categoria
    );

    // Função para capitalizar a primeira letra de cada palavra
    const formatarCategoria = (texto: string) => {
        return texto.toLowerCase().replace(/(?:^|\s)\S/g, function(a) {
            return a.toUpperCase();
        });
    };

    // Fecha o menu de sugestões ao clicar fora
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (categoriaRef.current && !categoriaRef.current.contains(event.target as Node)) {
                setMostrarSugestoes(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    // --------------------------------------------------

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // useEffect Atualizado: Agora ele pega o Token E busca as categorias
    useEffect(() => {
        let isMounted = true;

        const init = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push("/");
                return;
            }
            
            const accessToken = session.access_token;
            setToken(accessToken);

            // NOVO: Busca todos os fornecedores para extrair as categorias únicas
            try {
                const res = await fetch(`http://127.0.0.1:8001/fornecedores`, {
                    headers: { "Authorization": `Bearer ${accessToken}` }
                });
                
                if (res.ok) {
                    const dados = await res.json();
                    const listaFornecedores = Array.isArray(dados) ? dados : (dados.data || []);
                    
                    // Mapeia todas as categorias, remove vazias, e cria um Set (conjunto) para tirar as duplicadas
                    const categoriasUnicas = Array.from(new Set(
                        listaFornecedores
                            .map((f: any) => f.categoria)
                            .filter((cat: any) => cat && cat.trim() !== "")
                    ));
                    
                    // Ordena alfabeticamente para ficar bonito
                    if (isMounted) {
                        setCategoriasDoBanco(categoriasUnicas.sort() as string[]);
                    }
                }
            } catch (err) {
                console.error("Erro ao buscar categorias:", err);
            }
        };
        
        init();

        return () => { isMounted = false };
    }, [router, supabase]);

    const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, "");
        if (value.length > 8) value = value.slice(0, 8);
        if (value.length > 5) {
            value = value.replace(/^(\d{5})(\d{1,3}).*/, "$1-$2");
        }
        setFormData({ ...formData, cep_input: value });
    };

    const buscarCEP = async (cep: string) => {
        const cepLimpo = cep.replace(/\D/g, '');
        if (cepLimpo.length === 8) {
            try {
                const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
                const data = await res.json();
                if (!data.erro) {
                    setFormData(prev => ({ 
                        ...prev, 
                        localização: `${data.localidade} - ${data.uf}`
                    }));
                }
            } catch (err) { console.error("Erro ao buscar CEP"); }
        }
    };

    const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, "");
        if (value.length > 14) value = value.slice(0, 14);
        if (value.length > 12) {
            value = value.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2}).*/, "$1.$2.$3/$4-$5");
        } else if (value.length > 8) {
            value = value.replace(/^(\d{2})(\d{3})(\d{3})(\d{1,4}).*/, "$1.$2.$3/$4");
        } else if (value.length > 5) {
            value = value.replace(/^(\d{2})(\d{3})(\d{1,3}).*/, "$1.$2.$3");
        } else if (value.length > 2) {
            value = value.replace(/^(\d{2})(\d{1,3}).*/, "$1.$2");
        }
        setFormData({ ...formData, cnpj: value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.cnpj.length !== 18) {
            alert("Por favor, digite um CNPJ válido com 14 números.");
            return;
        }
        
        // Verifica se a categoria está vazia, se sim, preenche com Geral
        const categoriaFinal = formData.categoria.trim() === "" ? "Geral" : formData.categoria;

        setLoading(true);

        if (!token) {
            alert("Erro de autenticação. Tente fazer login novamente.");
            setLoading(false);
            return;
        }

        try {
            const cnpjApenasNumeros = formData.cnpj.replace(/\D/g, '');

            const payload = {
                fornecedor_dict: {
                    cnpj: cnpjApenasNumeros, 
                    empresa: formData.empresa,
                    localização: formData.localização,
                    link_site: formData.link_site,
                    descrição: formData.descrição,
                    categoria: categoriaFinal, // Usa a categoria validada
                    favorito: formData.favorito
                }
            };

            const res = await fetch("http://127.0.0.1:8001/fornecedores/cadastro", {
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
                console.error("Erro de validação do FastAPI:", errorData);
                alert(`Erro ao salvar: ${JSON.stringify(errorData.detail)}`);
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
            <div className="w-full max-w-3xl">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <Link href="/dashboard" className="flex items-center text-emerald-700 font-bold hover:underline mb-2">
                            <ArrowLeft size={20} className="mr-2" /> Voltar ao Dashboard
                        </Link>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Novo Fornecedor</h1>
                        <p className="text-gray-500">Preencha os dados para cadastrar um novo parceiro.</p>
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-500 uppercase ml-1">CNPJ</label>
                                <div className="relative">
                                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-700" size={18} />
                                    <input 
                                        required
                                        placeholder="00.000.000/0001-00"
                                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-black text-gray-900 tracking-wider transition-all placeholder:text-gray-300 placeholder:font-medium"
                                        value={formData.cnpj}
                                        onChange={handleCnpjChange}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-500 uppercase ml-1">Nome da Empresa</label>
                                <div className="relative">
                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input 
                                        required
                                        placeholder="Razão Social ou Nome Fantasia"
                                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-gray-900 transition-all placeholder:text-gray-400"
                                        value={formData.empresa}
                                        onChange={e => setFormData({...formData, empresa: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
                            <h3 className="text-sm font-black text-emerald-800 uppercase flex items-center gap-2">
                                <MapPin size={16} /> Localização Automática
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <input 
                                        placeholder="00000-000"
                                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-black text-gray-900 tracking-wider transition-all placeholder:text-gray-300 placeholder:font-medium"
                                        value={formData.cep_input}
                                        onChange={handleCepChange}
                                        onBlur={e => buscarCEP(e.target.value)}
                                        maxLength={9}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <input 
                                        readOnly
                                        placeholder="Cidade - UF (Preenchimento automático)"
                                        className="w-full p-3 border border-gray-200 bg-gray-200/50 text-gray-600 rounded-xl font-bold cursor-not-allowed"
                                        value={formData.localização}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-500 uppercase ml-1">Site / Portfólio</label>
                            <div className="relative">
                                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input 
                                    placeholder="https://www.exemplo.com.br"
                                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-medium"
                                    value={formData.link_site}
                                    onChange={e => setFormData({...formData, link_site: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            {/* CAMPO DE CATEGORIA COM AUTOCOMPLETE DINÂMICO */}
                            <div className="space-y-2 relative" ref={categoriaRef}>
                                <label className="text-xs font-black text-gray-500 uppercase ml-1">Categoria Principal</label>
                                <div className="relative">
                                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input 
                                        required
                                        placeholder="Ex: Elétrica"
                                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-gray-900 transition-all placeholder:text-gray-400"
                                        value={formData.categoria}
                                        onFocus={() => setMostrarSugestoes(true)}
                                        onChange={e => {
                                            setFormData({...formData, categoria: formatarCategoria(e.target.value)});
                                            setMostrarSugestoes(true);
                                        }}
                                    />
                                </div>
                                
                                {/* Menu suspenso de sugestões do banco */}
                                {mostrarSugestoes && sugestoesFiltradas.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                                        {sugestoesFiltradas.map((sugestao, index) => (
                                            <div 
                                                key={index}
                                                className="px-4 py-3 cursor-pointer hover:bg-emerald-50 hover:text-emerald-700 font-bold text-gray-700 text-sm transition-colors border-b border-gray-50 last:border-0"
                                                onClick={() => {
                                                    setFormData({...formData, categoria: formatarCategoria(sugestao)});
                                                    setMostrarSugestoes(false);
                                                }}
                                            >
                                                {sugestao}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-end pb-3">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${formData.favorito ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 group-hover:border-emerald-400'}`}>
                                        {formData.favorito && <Save size={14} className="text-white" />}
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        className="hidden"
                                        checked={formData.favorito}
                                        onChange={e => setFormData({...formData, favorito: e.target.checked})}
                                    />
                                    <span className="font-bold text-gray-800 group-hover:text-emerald-700 transition">Classificar como Preferencial</span>
                                </label>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-500 uppercase ml-1">Descrição Detalhada / Observações</label>
                            <textarea 
                                rows={4}
                                placeholder="Descreva os produtos e diferenciais deste fornecedor..."
                                className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-gray-900 resize-none placeholder:text-gray-400"
                                value={formData.descrição}
                                onChange={e => setFormData({...formData, descrição: e.target.value})}
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-black py-4 rounded-xl shadow-lg shadow-emerald-200/50 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wider"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <><Save size={20} /> Efetivar Cadastro</>}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
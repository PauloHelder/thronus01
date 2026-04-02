import React from 'react';
import { HelpCircle, BookOpen, MessageSquare, Info, Shield, CheckCircle, ChevronRight, Layout, Users, Calendar, DollarSign, Smartphone } from 'lucide-react';

export default function HelpCenter() {
    const categories = [
        { title: 'Primeiros Passos', icon: <Layout className="text-orange-500" />, desc: 'Como configurar a sua igreja e navegar no painel.' },
        { title: 'Gestão de Membros', icon: <Users className="text-blue-500" />, desc: 'Como adicionar, editar e organizar a sua congregação.' },
        { title: 'Eventos e Cultos', icon: <Calendar className="text-purple-500" />, desc: 'Registro de estatísticas e calendários de serviços.' },
        { title: 'Loja de SMS', icon: <Smartphone className="text-green-500" />, desc: 'Dicas sobre pacotes e envio de comunicações.' },
        { title: 'Finanças', icon: <DollarSign className="text-amber-500" />, desc: 'Controle de entradas, saídas e relatórios.' },
        { title: 'Segurança e Dados', icon: <Shield className="text-red-500" />, desc: 'Como protegemos as informações da sua igreja.' },
    ];

    const faqs = [
        { q: 'Como adiciono um novo membro?', a: 'Vá ao menu "Membros", clique no botão "+" e preencha os dados necessários. O código do membro é gerado automaticamente.' },
        { q: 'Onde vejo o meu saldo de SMS?', a: 'O saldo está sempre visível no Dashboard e também no menu lateral em "SMS".' },
        { q: 'Como mudo o nome da minha igreja?', a: 'Aceda a "Perfil da Igreja" no menu lateral e atualize as informações no separador Detalhes.' },
        { q: 'Os dados estão seguros?', a: 'Sim. Utilizamos a infraestrutura Supabase com isolamento de dados (RLS) para garantir que ninguém aceda à informação da sua igreja.' },
    ];

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-12 animate-in fade-in duration-500">
            {/* Hero Section */}
            <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500 rounded-full blur-[100px] opacity-20 -mr-20 -mt-20"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="max-w-md">
                        <h1 className="text-4xl font-black tracking-tight mb-4 flex items-center gap-3">
                            <HelpCircle className="text-orange-500" size={40} />
                            Central de Ajuda
                        </h1>
                        <p className="text-slate-400 text-lg">
                            Dúvidas sobre como gerir a sua igreja no Thronus? Estamos aqui para ajudar com guias rápidos e FAQs.
                        </p>
                    </div>
                </div>
            </div>

            {/* Quick Tutorial Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
                <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm flex flex-col justify-between hover:shadow-xl transition-shadow">
                    <div>
                        <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center mb-6">
                            <BookOpen className="text-orange-600" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 mb-4 tracking-tight">Manual do Utilizador</h2>
                        <p className="text-slate-500 leading-relaxed mb-6">
                            Criámos um manual completo em Português que cobre todas as áreas do sistema, desde a gestão de membros até ao controle financeiro.
                        </p>
                    </div>
                    <a 
                        href="/#/guide" 
                        className="inline-flex items-center gap-2 font-bold text-orange-600 hover:text-orange-700 transition-colors"
                    >
                        Ler Manual Completo <ChevronRight size={16} />
                    </a>
                </div>

                <div className="bg-orange-600 rounded-3xl p-8 text-white shadow-xl flex flex-col justify-between transform hover:scale-[1.02] transition-transform">
                    <div>
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm">
                            <CheckCircle className="text-white" />
                        </div>
                        <h2 className="text-2xl font-black mb-4 tracking-tight">Dicas de Inicialização</h2>
                        <ul className="space-y-4">
                            <li className="flex items-center gap-3 text-sm font-medium">
                                <span className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center shrink-0">1</span>
                                Configure o Perfil da sua Igreja.
                            </li>
                            <li className="flex items-center gap-3 text-sm font-medium">
                                <span className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center shrink-0">2</span>
                                Importe ou adicione os seus Membros.
                            </li>
                            <li className="flex items-center gap-3 text-sm font-medium">
                                <span className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center shrink-0">3</span>
                                Organize os seus pequenos grupos/células.
                            </li>
                            <li className="flex items-center gap-3 text-sm font-medium">
                                <span className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center shrink-0">4</span>
                                Registe estatísticas de serviços passados.
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Categories */}
            <div className="bg-slate-50 rounded-[2.5rem] p-8 md:p-12 border border-slate-100">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">Explore por Categoria</h2>
                    <p className="text-slate-500 mt-2">Escolha uma área em que precise de orientação.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categories.map((cat, i) => (
                        <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group cursor-default">
                            <div className="mb-4 transform group-hover:scale-110 transition-transform origin-left">{cat.icon}</div>
                            <h3 className="font-bold text-slate-800 mb-2">{cat.title}</h3>
                            <p className="text-xs text-slate-500 leading-relaxed">{cat.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* FAQ Section */}
            <div className="space-y-6 max-w-3xl mx-auto">
                <div className="flex items-center justify-center gap-3 mb-8">
                    <Info className="text-orange-500" />
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight text-center">Perguntas Frequentes (FAQ)</h2>
                </div>
                {faqs.map((f, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-3 flex items-start gap-4">
                            <span className="text-orange-500 font-black">Q:</span> {f.q}
                        </h3>
                        <p className="text-sm text-slate-500 leading-relaxed flex items-start gap-4 border-t border-slate-50 pt-4 mt-2">
                            <span className="text-slate-300 font-bold">A:</span> {f.a}
                        </p>
                    </div>
                ))}
            </div>

            {/* Support Message */}
            <div className="text-center py-12 border-t border-slate-100">
                <div className="inline-flex items-center gap-3 bg-white px-6 py-3 rounded-full border border-slate-200 shadow-sm">
                    <MessageSquare size={18} className="text-slate-400" />
                    <p className="text-sm text-slate-600">Ainda precisa de ajuda? <span className="text-orange-600 font-bold cursor-pointer">Contacte o suporte Thronus</span></p>
                </div>
            </div>
        </div>
    );
}

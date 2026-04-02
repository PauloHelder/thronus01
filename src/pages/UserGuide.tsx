import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Menu, X, ChevronRight, Search } from 'lucide-react';
import { guideContent, GuideSection } from '../data/guideContent';

const UserGuide: React.FC = () => {
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState<string>(guideContent[0].id);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Smooth scroll to section
    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            const offset = 100; // Account for fixed header
            const bodyRect = document.body.getBoundingClientRect().top;
            const elementRect = element.getBoundingClientRect().top;
            const elementPosition = elementRect - bodyRect;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
            setActiveSection(id);
            setIsMenuOpen(false);
        }
    };

    // Update active section on scroll
    useEffect(() => {
        const handleScroll = () => {
            const sections = guideContent.map(s => document.getElementById(s.id));
            const scrollPosition = window.scrollY + 150;

            for (let i = sections.length - 1; i >= 0; i--) {
                const section = sections[i];
                if (section && section.offsetTop <= scrollPosition) {
                    setActiveSection(guideContent[i].id);
                    break;
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const filteredContent = guideContent.filter(section => 
        section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        section.content.some(p => p.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-50 flex items-center justify-between px-4 md:px-8 shadow-sm">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
                        title="Voltar"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center font-bold text-white text-sm">
                            Tr
                        </div>
                        <h1 className="font-bold text-slate-800 hidden sm:block">Manual do Utilizador</h1>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="flex-1 max-w-md mx-4 hidden md:block">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Pesquisar no guia..."
                            className="w-full bg-slate-100 border-none rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-orange-500 transition-all outline-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button 
                         onClick={() => setIsMenuOpen(!isMenuOpen)}
                         className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </header>

            <div className="flex flex-1 pt-16">
                {/* Sidebar Navigation */}
                <aside 
                    className={`fixed inset-y-0 left-0 w-72 bg-white border-r border-slate-200 pt-16 z-40 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
                >
                    <nav className="h-full overflow-y-auto p-4 space-y-1">
                        <div className="px-4 py-2 mb-2 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                            Conteúdo do Guia
                        </div>
                        {guideContent.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => scrollToSection(section.id)}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                                    activeSection === section.id 
                                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' 
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-orange-500'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <section.icon size={18} />
                                    {section.title}
                                </div>
                                {activeSection === section.id && <ChevronRight size={14} />}
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 md:ml-72 p-4 md:p-12 lg:p-20 max-w-5xl mx-auto">
                    {filteredContent.length > 0 ? (
                        <div className="space-y-16">
                            {filteredContent.map((section) => (
                                <section 
                                    key={section.id} 
                                    id={section.id}
                                    className="animate-in fade-in slide-in-from-bottom duration-500 scroll-mt-24"
                                >
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center shadow-sm">
                                            <section.icon size={24} />
                                        </div>
                                        <h2 className="text-3xl font-black text-slate-800 tracking-tight">
                                            {section.title}
                                        </h2>
                                    </div>

                                    <div className="space-y-4">
                                        {section.content.map((paragraph, pIdx) => {
                                            // Simple markdown-to-JSX for bold text
                                            const parts = paragraph.split(/(\*\*.*?\*\*)/g);
                                            return (
                                                <p key={pIdx} className="text-slate-600 leading-relaxed text-lg">
                                                    {parts.map((part, i) => {
                                                        if (part.startsWith('**') && part.endsWith('**')) {
                                                            return <strong key={i} className="text-slate-900 font-bold">{part.slice(2, -2)}</strong>;
                                                        }
                                                        return part;
                                                    })}
                                                </p>
                                            );
                                        })}
                                    </div>
                                    
                                    <div className="mt-8 pt-8 border-t border-slate-100 flex items-center justify-between">
                                        <span className="text-[10px] text-slate-300 uppercase tracking-widest font-bold">Thronus Documentation</span>
                                        <button 
                                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                            className="text-xs text-orange-500 font-bold hover:underline"
                                        >
                                            Voltar ao topo
                                        </button>
                                    </div>
                                </section>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20">
                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Search size={40} className="text-slate-300" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800">Nenhum resultado encontrado</h3>
                            <p className="text-slate-500 mt-2">Tente pesquisar por outros termos ou navegue no menu lateral.</p>
                        </div>
                    )}
                </main>
            </div>

            {/* Mobile Menu Overlay */}
            {isMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={() => setIsMenuOpen(false)}
                />
            )}
        </div>
    );
};

export default UserGuide;

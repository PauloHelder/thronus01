import React, { useState } from 'react';
import {
    Users,
    Calendar,
    HeartHandshake,
    TrendingUp,
    Shield,
    Zap,
    CheckCircle,
    ArrowRight,
    Menu,
    X
} from 'lucide-react';

const LandingPage: React.FC = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const features = [
        {
            icon: Users,
            title: 'Gestão de Membros',
            description: 'Organize e acompanhe sua congregação com ferramentas poderosas de gestão de membros.',
            color: 'bg-blue-500'
        },
        {
            icon: Calendar,
            title: 'Planeamento de Eventos',
            description: 'Agende cultos, reuniões e eventos com um sistema de calendário intuitivo.',
            color: 'bg-purple-500'
        },
        {
            icon: HeartHandshake,
            title: 'Gestão de Doações',
            description: 'Monitore contribuições e gere relatórios com facilidade e transparência.',
            color: 'bg-green-500'
        },
        {
            icon: TrendingUp,
            title: 'Analytics & Relatórios',
            description: 'Obtenha insights sobre frequência, crescimento e métricas de engajamento.',
            color: 'bg-orange-500'
        },
        {
            icon: Shield,
            title: 'Segurança e Privacidade',
            description: 'Segurança de nível empresarial para proteger os dados da sua igreja e membros.',
            color: 'bg-red-500'
        },
        {
            icon: Zap,
            title: 'Fácil de Usar',
            description: 'Interface intuitiva projetada para equipas de igreja, com treino mínimo necessário.',
            color: 'bg-yellow-500'
        }
    ];

    const testimonials = [
        {
            name: 'Pastor João Silva',
            church: 'Comunidade da Graça',
            text: 'O Thronus transformou a forma como gerimos a nossa igreja. A interface é intuitiva e a nossa equipa adora!',
            avatar: 'https://i.pravatar.cc/150?u=john'
        },
        {
            name: 'Sara Mendes',
            church: 'Nova Vida Fellowship',
            text: 'As funcionalidades de doações e relatórios tornaram a nossa gestão financeira muito mais fácil.',
            avatar: 'https://i.pravatar.cc/150?u=sarah'
        },
        {
            name: 'Miguel Chen',
            church: 'Igreja Esperança da Cidade',
            text: 'Vimos um aumento de 40% no engajamento dos membros desde a implementação do Thronus. Altamente recomendado!',
            avatar: 'https://i.pravatar.cc/150?u=michael'
        }
    ];

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        element?.scrollIntoView({ behavior: 'smooth' });
        setMobileMenuOpen(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-b border-gray-200 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg transform -rotate-3">
                                <span className="font-bold text-white text-xl tracking-tighter">Th</span>
                            </div>
                            <div>
                                <h1 className="font-bold text-xl tracking-tight text-slate-800">Thronus</h1>
                                <p className="text-xs text-slate-500 hidden sm:block">Church Management</p>
                            </div>
                        </div>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center gap-8">
                            <button onClick={() => scrollToSection('features')} className="text-slate-600 hover:text-orange-500 transition-colors">Funcionalidades</button>
                            <button onClick={() => scrollToSection('testimonials')} className="text-slate-600 hover:text-orange-500 transition-colors">Testemunhos</button>
                            <button onClick={() => scrollToSection('pricing')} className="text-slate-600 hover:text-orange-500 transition-colors">Planos</button>
                            <a href="/#/login" className="text-slate-600 hover:text-orange-500 transition-colors">Login</a>
                            <a href="/#/signup" className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors">
                                Começar Agora
                            </a>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 text-slate-600 hover:bg-gray-100 rounded-lg"
                        >
                            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>

                    {/* Mobile Menu */}
                    {mobileMenuOpen && (
                        <div className="md:hidden py-4 space-y-3 animate-in slide-in-from-top duration-200">
                            <button onClick={() => scrollToSection('features')} className="block w-full text-left px-4 py-2 text-slate-600 hover:bg-gray-100 rounded-lg">Funcionalidades</button>
                            <button onClick={() => scrollToSection('testimonials')} className="block w-full text-left px-4 py-2 text-slate-600 hover:bg-gray-100 rounded-lg">Testemunhos</button>
                            <button onClick={() => scrollToSection('pricing')} className="block w-full text-left px-4 py-2 text-slate-600 hover:bg-gray-100 rounded-lg">Planos</button>
                            <a href="/#/login" className="block px-4 py-2 text-slate-600 hover:bg-gray-100 rounded-lg">Login</a>
                            <a href="/#/signup" className="block px-4 py-2 bg-orange-500 text-white rounded-lg text-center font-medium">Começar Agora</a>
                        </div>
                    )}
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-8 animate-in fade-in slide-in-from-left duration-700">
                            <div className="inline-block px-4 py-2 bg-orange-100 text-orange-600 rounded-full text-sm font-medium">
                                ✨ Plataforma Moderna de Gestão de Igrejas
                            </div>
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-800 leading-tight">
                                Potencialize sua Igreja com o <span className="text-orange-500">Thronus</span>
                            </h1>
                            <p className="text-lg text-slate-600 leading-relaxed">
                                A plataforma tudo-em-um para gerir membros, eventos, doações e muito mais.
                                Otimize as operações da sua igreja e foque no que mais importa - a sua comunidade.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <a href="/#/signup" className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium text-lg flex items-center justify-center gap-2 transition-all hover:scale-105 shadow-lg shadow-orange-500/30">
                                    Teste Grátis <ArrowRight size={20} />
                                </a>
                                <button onClick={() => scrollToSection('features')} className="px-8 py-4 bg-white hover:bg-gray-50 text-slate-700 rounded-lg font-medium text-lg border border-gray-200 transition-colors">
                                    Saiba Mais
                                </button>
                            </div>
                            <div className="flex items-center gap-8 pt-4">
                                <div>
                                    <p className="text-3xl font-bold text-slate-800">500+</p>
                                    <p className="text-sm text-slate-500">Igrejas</p>
                                </div>
                                <div>
                                    <p className="text-3xl font-bold text-slate-800">50K+</p>
                                    <p className="text-sm text-slate-500">Membros</p>
                                </div>
                                <div>
                                    <p className="text-3xl font-bold text-slate-800">99.9%</p>
                                    <p className="text-sm text-slate-500">Uptime</p>
                                </div>
                            </div>
                        </div>

                        {/* Hero Image/Illustration */}
                        <div className="relative animate-in fade-in slide-in-from-right duration-700 delay-200">
                            <div className="relative bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl p-8 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
                                <div className="bg-white rounded-xl p-6 transform -rotate-3 space-y-4">
                                    <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                                        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                                            <Users className="text-orange-500" size={24} />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-800">Dashboard de Membros</p>
                                            <p className="text-sm text-slate-500">1,204 membros ativos</p>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg animate-pulse" style={{ animationDelay: `${i * 200}ms` }}>
                                                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                                                <div className="flex-1 space-y-2">
                                                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                                                    <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            {/* Floating Elements */}
                            <div className="absolute -top-4 -right-4 w-20 h-20 bg-purple-500 rounded-full opacity-20 animate-bounce"></div>
                            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-blue-500 rounded-full opacity-20 animate-bounce" style={{ animationDelay: '1s' }}></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom duration-700">
                        <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-4">Tudo o Que Precisa</h2>
                        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                            Funcionalidades poderosas desenhadas especificamente para a gestão de igrejas
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="group p-6 bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 hover:border-orange-300 hover:shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <div className={`w-14 h-14 ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                                    <feature.icon className="text-white" size={28} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-2">{feature.title}</h3>
                                <p className="text-slate-600">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-orange-50 to-orange-100">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-4">Amado por Igrejas em Todo o Mundo</h2>
                        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                            Veja o que os líderes de igrejas estão a dizer sobre o Thronus
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {testimonials.map((testimonial, index) => (
                            <div
                                key={index}
                                className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom"
                                style={{ animationDelay: `${index * 150}ms` }}
                            >
                                <div className="flex items-center gap-4 mb-4">
                                    <img src={testimonial.avatar} alt={testimonial.name} className="w-14 h-14 rounded-full" />
                                    <div>
                                        <p className="font-semibold text-slate-800">{testimonial.name}</p>
                                        <p className="text-sm text-slate-500">{testimonial.church}</p>
                                    </div>
                                </div>
                                <p className="text-slate-600 italic">"{testimonial.text}"</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-4">Preços Simples e Transparentes</h2>
                        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                            Escolha o plano ideal para a sua igreja
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {/* Free Plan */}
                        <div className="p-8 bg-white rounded-xl border-2 border-gray-200 hover:border-orange-300 transition-all duration-300 hover:shadow-xl">
                            <h3 className="text-2xl font-bold text-slate-800 mb-2">Free</h3>
                            <p className="text-slate-600 mb-6">Perfeito para começar</p>
                            <div className="mb-6">
                                <span className="text-4xl font-bold text-slate-800">0</span>
                                <span className="text-slate-500"> Kz/mês</span>
                            </div>
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-center gap-2 text-slate-600">
                                    <CheckCircle className="text-green-500" size={20} />
                                    Até 100 membros
                                </li>
                                <li className="flex items-center gap-2 text-slate-600">
                                    <CheckCircle className="text-green-500" size={20} />
                                    10 grupos
                                </li>
                                <li className="flex items-center gap-2 text-slate-600">
                                    <CheckCircle className="text-green-500" size={20} />
                                    Estatísticas de cultos
                                </li>
                                <li className="flex items-center gap-2 text-slate-600">
                                    <CheckCircle className="text-green-500" size={20} />
                                    5 departamentos
                                </li>
                            </ul>
                            <a href="/#/signup" className="block w-full py-3 bg-gray-100 hover:bg-gray-200 text-slate-700 rounded-lg font-medium text-center transition-colors">
                                Começar Grátis
                            </a>
                        </div>

                        {/* Professional Plan */}
                        <div className="p-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-2xl transform scale-105 relative">
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-yellow-400 text-slate-800 rounded-full text-sm font-bold">
                                POPULAR
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Profissional</h3>
                            <p className="text-orange-100 mb-6">Para igrejas em crescimento</p>
                            <div className="mb-6">
                                <span className="text-4xl font-bold text-white">7.500</span>
                                <span className="text-orange-100"> Kz/mês</span>
                            </div>
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-center gap-2 text-white">
                                    <CheckCircle size={20} />
                                    Até 500 membros
                                </li>
                                <li className="flex items-center gap-2 text-white">
                                    <CheckCircle size={20} />
                                    80 grupos
                                </li>
                                <li className="flex items-center gap-2 text-white">
                                    <CheckCircle size={20} />
                                    Exportar estatísticas
                                </li>
                                <li className="flex items-center gap-2 text-white">
                                    <CheckCircle size={20} />
                                    Personalizar marca
                                </li>
                                <li className="flex items-center gap-2 text-white">
                                    <CheckCircle size={20} />
                                    Vincular supervisão
                                </li>
                            </ul>
                            <a href="/#/signup" className="block w-full py-3 bg-white hover:bg-gray-100 text-orange-600 rounded-lg font-medium text-center transition-colors">
                                Começar Agora
                            </a>
                        </div>

                        {/* Premium Plan */}
                        <div className="p-8 bg-white rounded-xl border-2 border-gray-200 hover:border-orange-300 transition-all duration-300 hover:shadow-xl">
                            <h3 className="text-2xl font-bold text-slate-800 mb-2">Premium</h3>
                            <p className="text-slate-600 mb-6">Para grandes igrejas</p>
                            <div className="mb-6">
                                <span className="text-4xl font-bold text-slate-800">9.000</span>
                                <span className="text-slate-500"> Kz/mês</span>
                            </div>
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-center gap-2 text-slate-600">
                                    <CheckCircle className="text-green-500" size={20} />
                                    Membros ilimitados
                                </li>
                                <li className="flex items-center gap-2 text-slate-600">
                                    <CheckCircle className="text-green-500" size={20} />
                                    Treino e onboarding
                                </li>
                            </ul>
                            <a href="/#/contact" className="block w-full py-3 bg-gray-100 hover:bg-gray-200 text-slate-700 rounded-lg font-medium text-center transition-colors">
                                Contactar Vendas
                            </a>
                        </div>
                    </div >
                </div >
            </section >

            {/* CTA Section */}
            < section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-800 to-slate-900" >
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Pronto para Transformar a sua Igreja?</h2>
                    <p className="text-lg text-slate-300 mb-8">
                        Junte-se a centenas de igrejas que já usam o Thronus para otimizar as suas operações
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a href="/#/signup" className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium text-lg transition-all hover:scale-105 shadow-lg">
                            Começar Teste Grátis
                        </a>
                        <a href="/#/demo" className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium text-lg border border-white/20 transition-colors">
                            Agendar Demo
                        </a>
                    </div>
                </div>
            </section >

            {/* Footer */}
            < footer className="bg-slate-900 text-slate-400 py-12 px-4 sm:px-6 lg:px-8" >
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-4 gap-8 mb-8">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                                    <span className="font-bold text-white text-xl">Th</span>
                                </div>
                                <span className="font-bold text-white text-xl">Thronus</span>
                            </div>
                            <p className="text-sm">Plataforma moderna de gestão de igrejas</p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-white mb-4">Produto</h4>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#features" className="hover:text-orange-400 transition-colors">Funcionalidades</a></li>
                                <li><a href="#pricing" className="hover:text-orange-400 transition-colors">Preços</a></li>
                                <li><a href="/#/demo" className="hover:text-orange-400 transition-colors">Demo</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-white mb-4">Empresa</h4>
                            <ul className="space-y-2 text-sm">
                                <li><a href="/#/about" className="hover:text-orange-400 transition-colors">Sobre</a></li>
                                <li><a href="/#/contact" className="hover:text-orange-400 transition-colors">Contacto</a></li>
                                <li><a href="/#/careers" className="hover:text-orange-400 transition-colors">Carreiras</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-white mb-4">Legal</h4>
                            <ul className="space-y-2 text-sm">
                                <li><a href="/#/privacy" className="hover:text-orange-400 transition-colors">Privacidade</a></li>
                                <li><a href="/#/terms" className="hover:text-orange-400 transition-colors">Termos</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-slate-800 pt-8 text-center text-sm">
                        <p>&copy; 2024 Thronus. Todos os direitos reservados.</p>
                    </div>
                </div>
            </footer >
        </div >
    );
};

export default LandingPage;

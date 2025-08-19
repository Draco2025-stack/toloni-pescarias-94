import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  category: string;
  path: string;
  keywords: string[];
}

const searchIndex: SearchResult[] = [
  // Páginas principais
  {
    id: 'home',
    title: 'Página Inicial',
    description: 'Bem-vindo à Toloni Pescarias - sua comunidade de pesca',
    category: 'Páginas',
    path: '/',
    keywords: ['inicio', 'home', 'principal', 'toloni', 'pescarias', 'comunidade', 'pesca']
  },
  {
    id: 'reports',
    title: 'Relatos de Pesca',
    description: 'Veja todos os relatos de pesca da comunidade',
    category: 'Relatos',
    path: '/reports',
    keywords: ['relatos', 'historias', 'pescaria', 'experiencias', 'catches']
  },
  {
    id: 'locations',
    title: 'Localidades',
    description: 'Descubra os melhores locais para pescar',
    category: 'Localidades',
    path: '/locations',
    keywords: ['locais', 'lugares', 'rios', 'lagos', 'pesqueiros', 'spots']
  },
  {
    id: 'trophy-gallery',
    title: 'Galeria de Troféus',
    description: 'Veja os melhores peixes capturados',
    category: 'Troféus',
    path: '/trophy-gallery',
    keywords: ['trofeus', 'galeria', 'peixes', 'capturas', 'fotos']
  },
  {
    id: 'cronograma',
    title: 'Cronograma',
    description: 'Veja a programação de pescarias',
    category: 'Programação',
    path: '/cronograma',
    keywords: ['cronograma', 'programacao', 'agenda', 'horarios', 'calendario']
  },
  
  // Páginas de usuário
  {
    id: 'profile',
    title: 'Meu Perfil',
    description: 'Gerencie suas informações pessoais',
    category: 'Conta',
    path: '/profile',
    keywords: ['perfil', 'conta', 'usuario', 'dados', 'informacoes']
  },
  {
    id: 'my-reports',
    title: 'Meus Relatos',
    description: 'Veja seus relatos de pesca',
    category: 'Relatos',
    path: '/my-reports',
    keywords: ['meus', 'relatos', 'historias', 'minhas', 'pescarias']
  },
  {
    id: 'create-report',
    title: 'Criar Relato',
    description: 'Compartilhe sua experiência de pesca',
    category: 'Relatos',
    path: '/create-report',
    keywords: ['criar', 'novo', 'relato', 'compartilhar', 'experiencia']
  },
  {
    id: 'suggest-location',
    title: 'Sugerir Localidade',
    description: 'Sugira um novo local de pesca',
    category: 'Localidades',
    path: '/suggest-location',
    keywords: ['sugerir', 'indicar', 'local', 'lugar', 'novo']
  },
  
  // Páginas institucionais
  {
    id: 'about',
    title: 'Sobre Nós',
    description: 'Conheça a história da Toloni Pescarias',
    category: 'Institucional',
    path: '/about',
    keywords: ['sobre', 'historia', 'empresa', 'quem', 'somos']
  },
  {
    id: 'contact',
    title: 'Contato',
    description: 'Entre em contato conosco',
    category: 'Institucional',
    path: '/contact',
    keywords: ['contato', 'falar', 'telefone', 'email', 'endereco']
  },
  {
    id: 'terms',
    title: 'Termos de Uso',
    description: 'Leia nossos termos de uso',
    category: 'Legal',
    path: '/terms',
    keywords: ['termos', 'uso', 'condicoes', 'regras', 'legal']
  },
  {
    id: 'privacy',
    title: 'Política de Privacidade',
    description: 'Nossa política de privacidade',
    category: 'Legal',
    path: '/privacy',
    keywords: ['privacidade', 'dados', 'lgpd', 'politica', 'protecao']
  },
  
  // Configurações
  {
    id: 'account-settings',
    title: 'Configurações da Conta',
    description: 'Gerencie suas configurações de conta',
    category: 'Configurações',
    path: '/account-settings',
    keywords: ['configuracoes', 'conta', 'settings', 'opcoes']
  },
  {
    id: 'notification-settings',
    title: 'Configurações de Notificação',
    description: 'Gerencie suas notificações',
    category: 'Configurações',
    path: '/notification-settings',
    keywords: ['notificacoes', 'avisos', 'email', 'push']
  },
  {
    id: 'privacy-settings',
    title: 'Configurações de Privacidade',
    description: 'Gerencie sua privacidade',
    category: 'Configurações',
    path: '/privacy-settings',
    keywords: ['privacidade', 'dados', 'visibilidade', 'publico']
  }
];

export const useGlobalSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase().trim();
    const results = searchIndex.filter(item => {
      const titleMatch = item.title.toLowerCase().includes(query);
      const descriptionMatch = item.description.toLowerCase().includes(query);
      const keywordMatch = item.keywords.some(keyword => 
        keyword.toLowerCase().includes(query)
      );
      
      return titleMatch || descriptionMatch || keywordMatch;
    });

    // Agrupar por categoria
    const groupedResults = results.reduce((acc, result) => {
      if (!acc[result.category]) {
        acc[result.category] = [];
      }
      acc[result.category].push(result);
      return acc;
    }, {} as Record<string, SearchResult[]>);

    return groupedResults;
  }, [searchQuery]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setIsSearching(true);
  };

  const navigateToResult = (result: SearchResult) => {
    navigate(result.path);
    setSearchQuery('');
    setIsSearching(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
  };

  return {
    searchQuery,
    searchResults,
    isSearching,
    handleSearch,
    navigateToResult,
    clearSearch,
    setSearchQuery
  };
};
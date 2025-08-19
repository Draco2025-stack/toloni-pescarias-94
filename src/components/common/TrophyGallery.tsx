import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, MapPin, Fish, Crown, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { TrophyEntry, getCurrentMonthTrophies, getTrophiesByMonth } from "@/services/mockData";
import toloniLogoMain from "@/assets/toloni-logo-main.png";

const TrophyGallery = () => {
  const [trophyEntries, setTrophyEntries] = useState<TrophyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [isCurrentMonth, setIsCurrentMonth] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadTrophies();
  }, [selectedMonth]);

  const loadTrophies = async () => {
    try {
      setLoading(true);
      const currentMonth = new Date().toISOString().slice(0, 7);
      const isCurrent = selectedMonth === currentMonth;
      setIsCurrentMonth(isCurrent);
      
      let trophies;
      if (isCurrent) {
        trophies = await getCurrentMonthTrophies();
      } else {
        trophies = await getTrophiesByMonth(selectedMonth);
      }
      
      setTrophyEntries(trophies);
    } catch (error) {
      console.error('Erro ao carregar troféus:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMonthChange = (direction: 'prev' | 'next') => {
    const currentDate = new Date(selectedMonth + '-01');
    if (direction === 'prev') {
      currentDate.setMonth(currentDate.getMonth() - 1);
    } else {
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    const newMonth = currentDate.toISOString().slice(0, 7);
    const today = new Date().toISOString().slice(0, 7);
    
    // Não permitir navegação para o futuro
    if (newMonth <= today) {
      setSelectedMonth(newMonth);
    }
  };

  const getMonthDisplayName = (month: string) => {
    return new Date(month + '-01').toLocaleDateString('pt-BR', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const handleTrophyClick = (reportId: string) => {
    navigate(`/reports/${reportId}`);
  };

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Trophy className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Trophy className="h-5 w-5 text-amber-600" />;
      default:
        return <Trophy className="h-4 w-4 text-gray-300" />;
    }
  };

  const getPositionBadge = (position: number) => {
    const variants = {
      1: "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white",
      2: "bg-gradient-to-r from-gray-300 to-gray-500 text-white", 
      3: "bg-gradient-to-r from-amber-400 to-amber-600 text-white"
    };
    
    return variants[position as keyof typeof variants] || "bg-gray-200 text-gray-700";
  };

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <Trophy className="h-16 w-16 mx-auto text-gray-400 mb-4 animate-pulse" />
            <h2 className="text-2xl md:text-3xl font-bold font-heading mb-4 bg-gradient-to-r from-fishing-blue to-fishing-green bg-clip-text text-transparent">
              Galeria de Troféus
            </h2>
            <p className="text-gray-600">Carregando ranking do mês...</p>
          </div>
        </div>
      </section>
    );
  }

  if (trophyEntries.length === 0) {
    return (
      <section className="py-16 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <Trophy className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl md:text-3xl font-bold font-heading mb-4 bg-gradient-to-r from-fishing-blue to-fishing-green bg-clip-text text-transparent">
              Galeria de Troféus
            </h2>
            <p className="text-gray-600">
              {isCurrentMonth 
                ? 'Nenhum pescador no ranking este mês ainda' 
                : `Nenhum troféu registrado em ${getMonthDisplayName(selectedMonth)}`
              }
            </p>
            {isCurrentMonth && (
              <p className="text-sm text-gray-500 mt-2">
                Para aparecer no ranking, publique um relato com foto do peixe, tipo, peso e localização
              </p>
            )}
          </div>
        </div>
      </section>
    );
  }

  const topEntry = trophyEntries.find(entry => entry.position === 1);
  const otherEntries = trophyEntries.filter(entry => entry.position > 1).sort((a, b) => a.position - b.position);

  return (
    <section className="py-16 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="h-8 w-8 text-yellow-500" />
            <h2 className="text-2xl md:text-3xl font-bold font-heading bg-gradient-to-r from-fishing-blue to-fishing-green bg-clip-text text-transparent">
              Galeria de Troféus
            </h2>
            <Trophy className="h-8 w-8 text-yellow-500" />
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto mb-6">
            Confira os maiores peixes capturados pelos nossos pescadores
          </p>
          
          {/* Navegação de mês */}
          <div className="flex items-center justify-center gap-4 bg-white rounded-lg p-4 shadow-sm border max-w-md mx-auto">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleMonthChange('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-2 min-w-[180px] justify-center">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="font-medium text-center">
                {getMonthDisplayName(selectedMonth)}
              </span>
              {isCurrentMonth && (
                <Badge variant="secondary" className="text-xs">
                  Atual
                </Badge>
              )}
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleMonthChange('next')}
              disabled={selectedMonth >= new Date().toISOString().slice(0, 7)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Top 1 Highlight */}
        {topEntry && (
          <div className="mb-12">
            <div className="text-center mb-6">
              <Badge className={`text-lg px-4 py-2 ${getPositionBadge(1)} shadow-lg`}>
                <Crown className="h-5 w-5 mr-2" />
                {isCurrentMonth ? 'Top 1 do Mês' : `Campeão de ${getMonthDisplayName(selectedMonth)}`}
              </Badge>
            </div>
            
            <Card 
              className="max-w-2xl mx-auto overflow-hidden bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200 shadow-2xl cursor-pointer hover:shadow-3xl transition-all hover:scale-105"
              onClick={() => handleTrophyClick(topEntry.reportId)}
            >
              <div className="relative">
                <img
                  src={topEntry.imageUrl}
                  alt={`${topEntry.fishType} capturado por ${topEntry.fishermanName}`}
                  className="w-full h-80 object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjI0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzIwIiBoZWlnaHQ9IjI0MCIgZmlsbD0iI0Y1RjVGNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5OTk5IiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNiI+SW1hZ2VtIG7Do28gZGlzcG9uw612ZWw8L3RleHQ+PC9zdmc+';
                    e.currentTarget.onerror = null;
                  }}
                />
                <div className="absolute top-4 left-4">
                  <Badge className="bg-yellow-500 text-white shadow-lg">
                    <Crown className="h-4 w-4 mr-1" />
                    #1
                  </Badge>
                </div>
                <div className="absolute top-4 right-4">
                  <Badge className="bg-black/50 text-white">
                    Ver Relato
                  </Badge>
                </div>
              </div>
              
              <CardContent className="p-6">
                <div className="text-center space-y-3">
                  <h3 className="text-2xl font-bold text-gray-800">{topEntry.fishermanName}</h3>
                  <div className="flex items-center justify-center gap-2 text-fishing-blue">
                    <img src={toloniLogoMain} alt="Toloni Pescarias" className="h-5 w-auto" />
                    <span className="font-semibold text-lg">{topEntry.fishType}</span>
                    {topEntry.weight && (
                      <Badge variant="outline" className="ml-2">
                        {topEntry.weight}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-center gap-2 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{topEntry.location}</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    Capturado em {new Date(topEntry.date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Other Rankings */}
        {otherEntries.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherEntries.map((entry) => (
              <Card 
                key={entry.id} 
                className="overflow-hidden hover:shadow-lg transition-all hover:transform hover:scale-105 bg-white border border-gray-200 cursor-pointer"
                onClick={() => handleTrophyClick(entry.reportId)}
              >
                <div className="relative">
                  <img
                    src={entry.imageUrl}
                    alt={`${entry.fishType} capturado por ${entry.fishermanName}`}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE5MiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE5MiIgZmlsbD0iI0Y1RjVGNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5OTk5IiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCI+SW1hZ2VtIG7Do28gZGlzcG9uw612ZWw8L3RleHQ+PC9zdmc+';
                      e.currentTarget.onerror = null;
                    }}
                  />
                  <div className="absolute top-3 left-3">
                    <Badge className={getPositionBadge(entry.position)}>
                      {getPositionIcon(entry.position)}
                      <span className="ml-1">#{entry.position}</span>
                    </Badge>
                  </div>
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-black/50 text-white text-xs">
                      Ver Relato
                    </Badge>
                  </div>
                </div>
                
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <h4 className="font-bold text-gray-800">{entry.fishermanName}</h4>
                    <div className="flex items-center gap-2 text-fishing-blue">
                      <img src={toloniLogoMain} alt="Toloni Pescarias" className="h-4 w-auto" />
                      <span className="font-medium">{entry.fishType}</span>
                      {entry.weight && (
                        <Badge variant="outline" className="text-xs">
                          {entry.weight}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <MapPin className="h-3 w-3" />
                      <span>{entry.location}</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(entry.date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default TrophyGallery;

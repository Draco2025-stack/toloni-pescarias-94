
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, RefreshCw, Calendar, Crown, Archive, Eye } from "lucide-react";
import { getCurrentMonthTrophies, getTrophiesByMonth, updateTrophyRanking, Trophy as TrophyType } from "@/services/trophyService";
import { toast } from "sonner";

const AdminTrophyGallery = () => {
  const [trophies, setTrophies] = useState<TrophyType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadTrophies();
  }, [selectedMonth]);

  const loadTrophies = async () => {
    try {
      setLoading(true);
      
      const currentMonth = new Date().toISOString().slice(0, 7);
      let data;
      
      if (selectedMonth === currentMonth) {
        data = await getCurrentMonthTrophies();
      } else {
        data = await getTrophiesByMonth(selectedMonth);
      }
      
      setTrophies(data);
    } catch (error) {
      console.error('Erro ao carregar troféus:', error);
      toast.error('Erro ao carregar troféus');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRanking = async () => {
    try {
      setUpdating(true);
      const result = await updateTrophyRanking();
      
      if (result.success) {
        toast.success(`Ranking atualizado! ${result.updated_entries} troféus processados`);
        loadTrophies();
      } else {
        toast.error(result.message || 'Erro ao atualizar ranking');
      }
    } catch (error) {
      console.error('Erro ao atualizar ranking:', error);
      toast.error('Erro interno do servidor');
    } finally {
      setUpdating(false);
    }
  };

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 2:
        return <Trophy className="h-4 w-4 text-gray-400" />;
      case 3:
        return <Trophy className="h-4 w-4 text-amber-600" />;
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

  const getMonthName = (monthStr: string) => {
    return new Date(monthStr + '-01').toLocaleDateString('pt-BR', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Gerenciar Galeria de Troféus
            </div>
            <Button
              onClick={handleUpdateRanking}
              disabled={updating}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${updating ? 'animate-spin' : ''}`} />
              {updating ? 'Atualizando...' : 'Atualizar Ranking'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Controles e informações */}
          <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div>
                <label className="block text-sm font-medium mb-2">Visualizar Mês:</label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{trophies.length}</div>
                <div className="text-sm text-gray-600">Troféus Cadastrados</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600">
                  {selectedMonth === new Date().toISOString().slice(0, 7) ? 'Mês Atual' : 'Histórico'}
                </div>
                <div className="text-sm text-gray-600">
                  {getMonthName(selectedMonth)}
                </div>
              </div>
            </div>
          </div>

          {/* Informações sobre o sistema automático */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
              <Archive className="h-4 w-4" />
              Sistema Automático de Ranking
            </h3>
            <div className="text-sm text-yellow-700 space-y-1">
              <p>• Os troféus são atualizados automaticamente quando relatos são publicados</p>
              <p>• Critérios: relato público com tipo de peixe, localização, peso e foto</p>
              <p>• Classificação: peso (decrescente) → curtidas → data de publicação</p>
              <p>• Reset automático no primeiro dia de cada mês</p>
              <p>• Rankings antigos são arquivados automaticamente</p>
            </div>
          </div>

          {/* Trophy entries table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Troféus Cadastrados ({trophies.length})
              </h3>
              {loading && (
                <div className="text-sm text-gray-500 flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Carregando...
                </div>
              )}
            </div>
            
            {trophies.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 mx-auto bg-yellow-500/20 rounded-full flex items-center justify-center">
                  <Trophy className="h-8 w-8 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-yellow-700">
                    {loading ? 'Carregando troféus...' : 'Nenhum troféu cadastrado'}
                  </h3>
                  <p className="text-muted-foreground mt-2">
                    {selectedMonth === new Date().toISOString().slice(0, 7) 
                      ? 'Nenhum troféu ainda este mês. Clique em "Atualizar Ranking" para processar novos relatos.' 
                      : `Nenhum troféu encontrado para ${getMonthName(selectedMonth)}`
                    }
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Posição</TableHead>
                      <TableHead>Pescador</TableHead>
                      <TableHead>Peixe</TableHead>
                      <TableHead>Local</TableHead>
                      <TableHead>Peso</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trophies.map((trophy) => (
                      <TableRow key={trophy.id}>
                        <TableCell>
                          <Badge className={getPositionBadge(trophy.position)}>
                            {getPositionIcon(trophy.position)}
                            <span className="ml-1">#{trophy.position}</span>
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{trophy.fisherman_name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Trophy className="h-4 w-4 text-fishing-blue" />
                            {trophy.fish_type}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 max-w-[200px] truncate">
                            <span className="truncate">{trophy.location}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {trophy.weight ? (
                            <div className="flex items-center gap-1">
                              <span>{trophy.weight}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            {new Date(trophy.date).toLocaleDateString('pt-BR')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`/reports/${trophy.report_id}`, '_blank')}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver Relato
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTrophyGallery;

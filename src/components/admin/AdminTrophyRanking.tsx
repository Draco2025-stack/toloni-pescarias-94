import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trophy, Loader2, RefreshCw, Archive, Calendar } from "lucide-react";

const API_BASE = import.meta.env.DEV 
  ? 'http://localhost:8080' 
  : 'https://tolonipescarias.com.br';

interface TrophyEntry {
  id: string;
  fisherman_name: string;
  fish_type: string;
  location: string;
  image_url: string;
  weight: string;
  date: string;
  position: number;
  report_id: string;
  report_title?: string;
}

interface TrophyLog {
  id: string;
  action: string;
  user_name: string;
  data: any;
  created_at: string;
}

const AdminTrophyRanking = () => {
  const [trophies, setTrophies] = useState<TrophyEntry[]>([]);
  const [logs, setLogs] = useState<TrophyLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchTrophies();
    fetchLogs();
  }, []);

  const fetchTrophies = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/trophies.php?action=current`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        setTrophies(data.trophies || []);
      } else {
        toast.error(data.message || "Erro ao carregar troféus");
      }
    } catch (error) {
      console.error("Error fetching trophies:", error);
      toast.error("Erro ao carregar troféus");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/trophies.php?action=logs&limit=10`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
    }
  };

  const handleManualUpdate = async () => {
    setIsUpdating(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/trophies.php?action=update-ranking`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(`Ranking atualizado! ${data.updated_entries} troféus processados`);
        await fetchTrophies();
        await fetchLogs();
      } else {
        toast.error(data.message || "Erro ao atualizar ranking");
      }
    } catch (error) {
      console.error("Error updating ranking:", error);
      toast.error("Erro ao atualizar ranking");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMonthlyReset = async () => {
    if (!confirm("Tem certeza que deseja executar o reset mensal? Isso irá arquivar os troféus atuais e gerar um novo ranking.")) {
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/trophies.php?action=reset-monthly`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(`Reset executado! ${data.archived_count} troféus arquivados, ${data.new_count} novos troféus`);
        await fetchTrophies();
        await fetchLogs();
      } else {
        toast.error(data.message || "Erro ao executar reset mensal");
      }
    } catch (error) {
      console.error("Error resetting trophies:", error);
      toast.error("Erro ao executar reset mensal");
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPositionBadge = (position: number) => {
    if (position === 1) return <Badge className="bg-yellow-500">🥇 1º</Badge>;
    if (position === 2) return <Badge className="bg-gray-400">🥈 2º</Badge>;
    if (position === 3) return <Badge className="bg-amber-600">🥉 3º</Badge>;
    return <Badge variant="outline">{position}º</Badge>;
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'manual_update': return <RefreshCw className="h-4 w-4" />;
      case 'monthly_reset': return <Calendar className="h-4 w-4" />;
      case 'monthly_reset_cron': return <Archive className="h-4 w-4" />;
      default: return <Trophy className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sistema de Troféus</h2>
          <p className="text-muted-foreground">
            Gerenciar ranking mensal de troféus automaticamente
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={fetchTrophies}
            variant="outline"
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          
          <Button 
            onClick={handleManualUpdate}
            disabled={isUpdating}
          >
            {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Trophy className="h-4 w-4 mr-2" />
            Atualizar Ranking
          </Button>
          
          <Button 
            onClick={handleMonthlyReset}
            variant="destructive"
            disabled={isUpdating}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Reset Mensal
          </Button>
        </div>
      </div>

      {/* Troféus Atuais */}
      <Card>
        <CardHeader>
          <CardTitle>Troféus do Mês Atual</CardTitle>
          <CardDescription>
            Top 10 pescadores do mês - Atualização automática a cada relato
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : trophies.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum troféu encontrado para este mês</p>
              <Button onClick={handleManualUpdate} className="mt-4">
                Gerar Ranking
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Posição</TableHead>
                  <TableHead>Pescador</TableHead>
                  <TableHead>Peixe</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead>Peso</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Relato</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trophies.map((trophy) => (
                  <TableRow key={trophy.id}>
                    <TableCell>
                      {getPositionBadge(trophy.position)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {trophy.fisherman_name}
                    </TableCell>
                    <TableCell>{trophy.fish_type}</TableCell>
                    <TableCell>{trophy.location}</TableCell>
                    <TableCell>{trophy.weight || '-'}</TableCell>
                    <TableCell>{formatDate(trophy.date)}</TableCell>
                    <TableCell>
                      {trophy.report_title && (
                        <Badge variant="outline">#{trophy.report_id}</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Log de Atividades */}
      <Card>
        <CardHeader>
          <CardTitle>Log de Atividades</CardTitle>
          <CardDescription>
            Histórico das últimas operações no sistema de troféus
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              Nenhuma atividade registrada
            </p>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  {getActionIcon(log.action)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {log.action === 'manual_update' && 'Atualização Manual'}
                        {log.action === 'monthly_reset' && 'Reset Mensal'}
                        {log.action === 'monthly_reset_cron' && 'Reset Automático'}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {log.user_name || 'Sistema'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(log.created_at)}
                    </p>
                  </div>
                  {log.data && (
                    <div className="text-right text-sm text-muted-foreground">
                      {JSON.parse(log.data).updated_entries && (
                        <span>{JSON.parse(log.data).updated_entries} entradas</span>
                      )}
                      {JSON.parse(log.data).archived_count && (
                        <span>{JSON.parse(log.data).archived_count} arquivados</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTrophyRanking;
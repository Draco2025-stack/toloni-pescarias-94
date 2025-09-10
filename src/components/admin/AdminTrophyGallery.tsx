
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trophy, RefreshCw, Calendar, Fish, MapPin, Weight } from "lucide-react";
import { getCurrentMonthTrophies, getTrophiesByMonth, updateTrophyRanking, Trophy as TrophyType } from "@/services/trophyService";
import { toast } from "sonner";


const AdminTrophyGallery = () => {
  const [trophies, setTrophies] = useState<TrophyType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
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
        loadTrophies(); // Recarregar troféus
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

  const addTrophyEntry = () => {
    // Validação dos campos obrigatórios
    if (!newEntry.fishermanName.trim()) {
      toast({
        title: "Erro",
        description: "Nome do Pescador é obrigatório",
        variant: "destructive"
      });
      return;
    }

    if (!newEntry.fishType.trim()) {
      toast({
        title: "Erro", 
        description: "Tipo do Peixe é obrigatório",
        variant: "destructive"
      });
      return;
    }

    if (!newEntry.location.trim()) {
      toast({
        title: "Erro",
        description: "Local da Pescaria é obrigatório", 
        variant: "destructive"
      });
      return;
    }

    if (!selectedImage) {
      toast({
        title: "Erro",
        description: "Imagem é obrigatória",
        variant: "destructive"
      });
      return;
    }

    if (!newEntry.date.trim()) {
      toast({
        title: "Erro",
        description: "Data da Pescaria é obrigatória",
        variant: "destructive"
      });
      return;
    }

    // Validação da data
    const selectedDate = new Date(newEntry.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate > today) {
      toast({
        title: "Erro",
        description: "Data da pescaria não pode ser no futuro",
        variant: "destructive"
      });
      return;
    }

    // Verificar se a posição já existe
    const existingPosition = trophyEntries.find(entry => entry.position === newEntry.position);
    if (existingPosition) {
      toast({
        title: "Erro",
        description: `A posição ${newEntry.position} já está ocupada por ${existingPosition.fishermanName}`,
        variant: "destructive"
      });
      return;
    }

    // Create image URL from uploaded file
    const imageUrl = URL.createObjectURL(selectedImage);
    
    // Criar novo troféu
    const entry: TrophyEntry = {
      id: Date.now().toString(),
      fishermanName: newEntry.fishermanName.trim(),
      fishType: newEntry.fishType.trim(),
      location: newEntry.location.trim(),
      imageUrl: imageUrl,
      weight: newEntry.weight.trim() || undefined,
      date: newEntry.date,
      position: newEntry.position
    };

    // Atualizar estado imediatamente
    setTrophyEntries(prev => [...prev, entry].sort((a, b) => a.position - b.position));
    
    // Limpar formulário
    setNewEntry({
      fishermanName: '',
      fishType: '',
      location: '',
      imageUrl: '',
      weight: '',
      date: '',
      position: 1
    });
    setSelectedImage(null);
    
    // Feedback de sucesso
    toast({
      title: "Sucesso",
      description: `Troféu de ${entry.fishermanName} adicionado à galeria!`
    });
  };

  const removeTrophyEntry = (id: string) => {
    const entry = trophyEntries.find(e => e.id === id);
    setTrophyEntries(prev => prev.filter(entry => entry.id !== id));
    toast({
      title: "Sucesso", 
      description: `Troféu de ${entry?.fishermanName} removido da galeria`
    });
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

    return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Gerenciar Galeria de Troféus
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={updateRanking}
                disabled={updating}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${updating ? 'animate-spin' : ''}`} />
                {updating ? 'Atualizando...' : 'Atualizar Ranking'}
              </Button>
              <Button
                onClick={() => loadTrophiesByMonth(selectedMonth)}
                disabled={loading}
                variant="outline"
                size="sm"
              >
                <Eye className="h-4 w-4 mr-2" />
                Ver Mês
              </Button>
            </div>
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
                <div className="text-2xl font-bold text-blue-600">{trophyEntries.length}</div>
                <div className="text-sm text-gray-600">Troféus Ativos</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600">
                  {selectedMonth === new Date().toISOString().slice(0, 7) ? 'Mês Atual' : 'Histórico'}
                </div>
                <div className="text-sm text-gray-600">
                  {new Date(selectedMonth + '-01').toLocaleDateString('pt-BR', { 
                    month: 'long', 
                    year: 'numeric' 
                  })}
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

          {/* Add new trophy form - Manual */}
          <div className="bg-gray-50 border rounded-lg p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Troféu Manual (Opcional)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="fishermanName">Nome do Pescador *</Label>
              <Input
                id="fishermanName"
                placeholder="Ex: Carlos da Silva"
                value={newEntry.fishermanName}
                onChange={(e) => setNewEntry(prev => ({ ...prev, fishermanName: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="fishType">Tipo do Peixe *</Label>
              <Input
                id="fishType"
                placeholder="Dourado, Tucunaré, etc."
                value={newEntry.fishType}
                onChange={(e) => setNewEntry(prev => ({ ...prev, fishType: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="location">Local da Pescaria *</Label>
              <Input
                id="location"
                placeholder="Ex: Rio Paraguaçu - Cachoeira/BA"
                value={newEntry.location}
                onChange={(e) => setNewEntry(prev => ({ ...prev, location: e.target.value }))}
              />
            </div>

            <div>
              <FileUpload
                id="trophy-image"
                label="Imagem do Troféu"
                accept="image/png,image/jpg,image/jpeg"
                maxSize={5}
                value={selectedImage}
                onChange={setSelectedImage}
                placeholder="Clique para selecionar uma imagem do troféu"
                required
              />
            </div>

            <div>
              <Label htmlFor="weight">Peso (opcional)</Label>
              <Input
                id="weight"
                placeholder="8.5kg"
                value={newEntry.weight}
                onChange={(e) => setNewEntry(prev => ({ ...prev, weight: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="date">Data da Pescaria *</Label>
              <Input
                id="date"
                type="date"
                value={newEntry.date}
                onChange={(e) => setNewEntry(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="position">Posição no Ranking *</Label>
              <Select value={newEntry.position.toString()} onValueChange={(value) => setNewEntry(prev => ({ ...prev, position: parseInt(value) }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(pos => (
                    <SelectItem key={pos} value={pos.toString()}>
                      {pos === 1 ? "🏆 1º Lugar" : pos === 2 ? "🥈 2º Lugar" : pos === 3 ? "🥉 3º Lugar" : `${pos}º Lugar`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2 lg:col-span-1 flex items-end">
              <Button onClick={addTrophyEntry} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Troféu
              </Button>
            </div>
            </div>
          </div>

          {/* Trophy entries table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Troféus Cadastrados ({trophyEntries.length})
              </h3>
              {loading && (
                <div className="text-sm text-gray-500 flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Carregando...
                </div>
              )}
            </div>
            
            {trophyEntries.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 mx-auto bg-yellow-500/20 rounded-full flex items-center justify-center">
                  <Trophy className="h-8 w-8 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-yellow-700">Nenhum troféu cadastrado</h3>
                  <p className="text-muted-foreground mt-2">Adicione o primeiro troféu para começar a galeria da Toloni Pescarias</p>
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
                    {trophyEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <Badge className={getPositionBadge(entry.position)}>
                            {getPositionIcon(entry.position)}
                            <span className="ml-1">#{entry.position}</span>
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{entry.fishermanName}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <img src={toloniLogoMain} alt="Toloni Pescarias" className="h-4 w-auto" />
                            {entry.fishType}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            {entry.location}
                          </div>
                        </TableCell>
                        <TableCell>
                          {entry.weight ? (
                            <div className="flex items-center gap-1">
                              <Weight className="h-4 w-4 text-gray-500" />
                              {entry.weight}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            {new Date(entry.date).toLocaleDateString('pt-BR')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeTrophyEntry(entry.id)}
                          >
                            <Trash2 className="h-4 w-4" />
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

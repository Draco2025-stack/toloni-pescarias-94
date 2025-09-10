import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, MapPin, Plus, Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getSchedules, createSchedule, updateSchedule, deleteSchedule, FishingSchedule, CreateScheduleData } from "@/services/scheduleService";
import { toast } from "sonner";

const AdminSchedules = () => {
  const [schedules, setSchedules] = useState<FishingSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<FishingSchedule | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    location: "",
    date: "",
    time: "",
    max_participants: "",
    price: "",
    description: "",
    image_url: ""
  });

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      const data = await getSchedules();
      setSchedules(data);
    } catch (error) {
      console.error('Erro ao carregar cronogramas:', error);
      toast.error('Erro ao carregar cronogramas');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const scheduleData: CreateScheduleData = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        date: formData.date,
        time: formData.time,
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : undefined,
        price: formData.price ? parseFloat(formData.price) : undefined,
        image_url: formData.image_url
      };

      if (editingSchedule) {
        const result = await updateSchedule(editingSchedule.id, scheduleData);
        if (result.success) {
          toast.success('Cronograma atualizado com sucesso');
          loadSchedules();
        } else {
          toast.error(result.message || 'Erro ao atualizar cronograma');
        }
      } else {
        const result = await createSchedule(scheduleData);
        if (result.success) {
          toast.success('Cronograma criado com sucesso');
          loadSchedules();
        } else {
          toast.error(result.message || 'Erro ao criar cronograma');
        }
      }
      
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar cronograma:', error);
      toast.error('Erro interno do servidor');
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      location: "",
      date: "",
      time: "",
      max_participants: "",
      price: "",
      description: "",
      image_url: ""
    });
    setShowForm(false);
    setEditingSchedule(null);
  };

  const handleEdit = (schedule: FishingSchedule) => {
    setEditingSchedule(schedule);
    setFormData({
      title: schedule.title,
      location: schedule.location,
      date: schedule.date,
      time: schedule.time,
      max_participants: schedule.max_participants?.toString() || "",
      price: schedule.price?.toString() || "",
      description: schedule.description,
      image_url: schedule.image_url || ""
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja remover este cronograma?")) {
      try {
        const result = await deleteSchedule(id);
        if (result.success) {
          toast.success('Cronograma removido com sucesso');
          loadSchedules();
        } else {
          toast.error(result.message || 'Erro ao remover cronograma');
        }
      } catch (error) {
        console.error('Erro ao deletar cronograma:', error);
        toast.error('Erro interno do servidor');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Cronograma de Pescarias</h2>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nova Pescaria
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editingSchedule ? "Editar" : "Nova"} Pescaria</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="location">Localização</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="date">Data</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="time">Horário</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({...formData, time: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="max_participants">Máx. Participantes</Label>
                  <Input
                    id="max_participants"
                    type="number"
                    value={formData.max_participants}
                    onChange={(e) => setFormData({...formData, max_participants: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="price">Preço (R$)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="image_url">URL da Imagem</Label>
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                />
              </div>
              
              <div className="flex gap-2">
                <Button type="submit">
                  {editingSchedule ? "Atualizar" : "Criar"} Pescaria
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {schedules.map((schedule) => (
          <Card key={schedule.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{schedule.title}</h3>
                  <p className="text-muted-foreground">{schedule.description}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(schedule)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(schedule.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {schedule.location}
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {new Date(schedule.date).toLocaleDateString('pt-BR')}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  {schedule.time}
                </div>
                {schedule.price && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">R$</span>
                    {schedule.price.toFixed(2)}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        
        {schedules.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum cronograma cadastrado</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSchedules;
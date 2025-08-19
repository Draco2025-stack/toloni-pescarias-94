
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, MapPin, Plus, Edit, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ScheduleDetails {
  trajectory: string;
  departure: string;
  return: string;
  boat: string;
  equipment: string;
  includes: string;
  whatsapp: string;
}

interface Schedule {
  id: number;
  title: string;
  location: string;
  date: string;
  time: string;
  duration: string;
  description: string;
  maxParticipants: number;
  
  status: "ativo" | "cancelado" | "completo";
  details: ScheduleDetails;
}

const AdminSchedules = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([
    {
      id: 1,
      title: "Pescaria de Tucunaré",
      location: "Rio Negro, Amazonas",
      date: "2024-02-15",
      time: "05:00",
      duration: "8 horas",
      description: "Pescaria de tucunaré com equipamentos inclusos e almoço.",
      maxParticipants: 6,
      
      status: "ativo",
      details: {
        trajectory: "Saída do Porto de Manaus → Rio Negro → Encontro das Águas → Pontos de pesca de tucunaré",
        departure: "05:00 - Porto de Manaus",
        return: "13:00 - Porto de Manaus",
        boat: "Lancha equipada com motor 90HP, capacidade para 8 pessoas, banheiro, cobertura",
        equipment: "Varas de pesca, molinetes, iscas artificiais, puçá, caixa térmica, coletes salva-vidas",
        includes: "Café da manhã, almoço, água, refrigerantes, seguro",
        whatsapp: "5511999999999"
      }
    },
    {
      id: 2,
      title: "Pescaria Oceânica",
      location: "Cabo Frio, RJ",
      date: "2024-02-20",
      time: "06:00",
      duration: "12 horas",
      description: "Pescaria em alto mar com foco em peixes grandes.",
      maxParticipants: 8,
      
      status: "ativo",
      details: {
        trajectory: "Saída da Marina de Cabo Frio → Alto mar (15 milhas náuticas) → Pontos de pesca oceânica",
        departure: "06:00 - Marina de Cabo Frio",
        return: "18:00 - Marina de Cabo Frio",
        boat: "Traineira oceânica 42 pés, GPS, sonar, radio VHF, banheiro, cozinha equipada",
        equipment: "Varas oceânicas, molinetes Penn, iscas naturais, anzóis diversos, equipamentos de segurança",
        includes: "Café da manhã, almoço, jantar, bebidas, combustível, seguro marítimo",
        whatsapp: "5521888888888"
      }
    }
  ]);

  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [expandedSchedule, setExpandedSchedule] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    location: "",
    date: "",
    time: "",
    duration: "",
    description: "",
    maxParticipants: "",
    status: "ativo" as "ativo" | "cancelado" | "completo",
    details: {
      trajectory: "",
      departure: "",
      return: "",
      boat: "",
      equipment: "",
      includes: "",
      whatsapp: ""
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingSchedule) {
      setSchedules(schedules.map(schedule => 
        schedule.id === editingSchedule.id 
          ? { ...editingSchedule, ...formData, maxParticipants: Number(formData.maxParticipants) }
          : schedule
      ));
      setEditingSchedule(null);
    } else {
      const newSchedule: Schedule = {
        id: schedules.length + 1,
        ...formData,
        maxParticipants: Number(formData.maxParticipants)
      };
      setSchedules([...schedules, newSchedule]);
    }
    
    setFormData({
      title: "",
      location: "",
      date: "",
      time: "",
      duration: "",
      description: "",
      maxParticipants: "",
      status: "ativo",
      details: {
        trajectory: "",
        departure: "",
        return: "",
        boat: "",
        equipment: "",
        includes: "",
        whatsapp: ""
      }
    });
    setShowForm(false);
  };

  const handleEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      title: schedule.title,
      location: schedule.location,
      date: schedule.date,
      time: schedule.time,
      duration: schedule.duration,
      description: schedule.description,
      maxParticipants: schedule.maxParticipants.toString(),
      
      status: schedule.status,
      details: schedule.details
    });
    setShowForm(true);
  };

  const handleDelete = (id: number) => {
    setSchedules(schedules.filter(schedule => schedule.id !== id));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ativo": return "bg-green-100 text-green-800";
      case "cancelado": return "bg-red-100 text-red-800";
      case "completo": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

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
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Informações Básicas</h3>
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
                    <Label htmlFor="duration">Duração</Label>
                    <Input
                      id="duration"
                      value={formData.duration}
                      onChange={(e) => setFormData({...formData, duration: e.target.value})}
                      placeholder="Ex: 8 horas"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxParticipants">Máx. Participantes</Label>
                    <Input
                      id="maxParticipants"
                      type="number"
                      value={formData.maxParticipants}
                      onChange={(e) => setFormData({...formData, maxParticipants: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value: "ativo" | "cancelado" | "completo") => setFormData({...formData, status: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                        <SelectItem value="completo">Completo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="mt-4">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    required
                  />
                </div>
              </div>

              {/* Detailed Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Detalhes da Pescaria</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="trajectory">Trajeto</Label>
                    <Textarea
                      id="trajectory"
                      value={formData.details.trajectory}
                      onChange={(e) => setFormData({
                        ...formData, 
                        details: {...formData.details, trajectory: e.target.value}
                      })}
                      placeholder="Descreva o trajeto da pescaria"
                      rows={2}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="departure">Horário e Local de Saída</Label>
                      <Input
                        id="departure"
                        value={formData.details.departure}
                        onChange={(e) => setFormData({
                          ...formData, 
                          details: {...formData.details, departure: e.target.value}
                        })}
                        placeholder="Ex: 05:00 - Porto de Manaus"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="return">Horário e Local de Retorno</Label>
                      <Input
                        id="return"
                        value={formData.details.return}
                        onChange={(e) => setFormData({
                          ...formData, 
                          details: {...formData.details, return: e.target.value}
                        })}
                        placeholder="Ex: 13:00 - Porto de Manaus"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="boat">Descrição da Embarcação</Label>
                    <Textarea
                      id="boat"
                      value={formData.details.boat}
                      onChange={(e) => setFormData({
                        ...formData, 
                        details: {...formData.details, boat: e.target.value}
                      })}
                      placeholder="Descreva a embarcação utilizada"
                      rows={2}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="equipment">Equipamentos Inclusos</Label>
                    <Textarea
                      id="equipment"
                      value={formData.details.equipment}
                      onChange={(e) => setFormData({
                        ...formData, 
                        details: {...formData.details, equipment: e.target.value}
                      })}
                      placeholder="Liste os equipamentos inclusos"
                      rows={2}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="includes">O que está Incluso</Label>
                    <Textarea
                      id="includes"
                      value={formData.details.includes}
                      onChange={(e) => setFormData({
                        ...formData, 
                        details: {...formData.details, includes: e.target.value}
                      })}
                      placeholder="Refeições, bebidas, seguro, etc."
                      rows={2}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="whatsapp">Número do WhatsApp (com código do país)</Label>
                    <Input
                      id="whatsapp"
                      value={formData.details.whatsapp}
                      onChange={(e) => setFormData({
                        ...formData, 
                        details: {...formData.details, whatsapp: e.target.value}
                      })}
                      placeholder="Ex: 5511999999999"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingSchedule ? "Atualizar" : "Criar"} Pescaria
                </Button>
                <Button type="button" variant="outline" onClick={() => {
                  setShowForm(false);
                  setEditingSchedule(null);
                  setFormData({
                    title: "",
                    location: "",
                    date: "",
                    time: "",
                    duration: "",
                    description: "",
                    maxParticipants: "",
                    
                    status: "ativo",
                    details: {
                      trajectory: "",
                      departure: "",
                      return: "",
                      boat: "",
                      equipment: "",
                      includes: "",
                      whatsapp: ""
                    }
                  });
                }}>
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
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {schedule.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(schedule.date).toLocaleDateString('pt-BR')}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {schedule.time} ({schedule.duration})
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(schedule.status)}>
                    {schedule.status}
                  </Badge>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setExpandedSchedule(expandedSchedule === schedule.id ? null : schedule.id)}
                  >
                    {expandedSchedule === schedule.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleEdit(schedule)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(schedule.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <p className="text-gray-700 mb-3">{schedule.description}</p>
              
              {expandedSchedule === schedule.id && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Trajeto:</strong> {schedule.details.trajectory}
                    </div>
                    <div>
                      <strong>WhatsApp:</strong> {schedule.details.whatsapp}
                    </div>
                    <div>
                      <strong>Saída:</strong> {schedule.details.departure}
                    </div>
                    <div>
                      <strong>Retorno:</strong> {schedule.details.return}
                    </div>
                    <div className="md:col-span-2">
                      <strong>Embarcação:</strong> {schedule.details.boat}
                    </div>
                    <div className="md:col-span-2">
                      <strong>Equipamentos:</strong> {schedule.details.equipment}
                    </div>
                    <div className="md:col-span-2">
                      <strong>Incluso:</strong> {schedule.details.includes}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-between items-center text-sm mt-4">
                <span>Máx. {schedule.maxParticipants} participantes</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminSchedules;

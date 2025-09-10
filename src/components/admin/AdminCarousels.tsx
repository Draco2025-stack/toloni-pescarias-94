import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Edit, Save, X, Image, Video, Home, Users, Plus } from "lucide-react";
import { getCarousels, createCarousel, updateCarousel, deleteCarousel, CarouselItem, CreateCarouselData } from "@/services/carouselService";
import { toast } from "sonner";

const AdminCarousels = () => {
  const [heroCarousels, setHeroCarousels] = useState<CarouselItem[]>([]);
  const [experienceCarousels, setExperienceCarousels] = useState<CarouselItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'hero' | 'experience'>('hero');
  
  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<CarouselItem | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    image_url: "",
    link_url: "",
    display_order: 0
  });

  useEffect(() => {
    loadCarousels();
  }, [activeTab]);

  const loadCarousels = async () => {
    try {
      setLoading(true);
      const [heroData, experienceData] = await Promise.all([
        getCarousels('hero'),
        getCarousels('experience')
      ]);
      
      setHeroCarousels(heroData);
      setExperienceCarousels(experienceData);
    } catch (error) {
      console.error('Erro ao carregar carrosséis:', error);
      toast.error('Erro ao carregar carrosséis');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const carouselData: CreateCarouselData = {
        ...formData,
        type: activeTab
      };

      if (editingItem) {
        const result = await updateCarousel(editingItem.id, carouselData);
        if (result.success) {
          toast.success('Carrossel atualizado com sucesso');
          loadCarousels();
        } else {
          toast.error(result.message || 'Erro ao atualizar carrossel');
        }
      } else {
        const result = await createCarousel(carouselData);
        if (result.success) {
          toast.success('Carrossel criado com sucesso');
          loadCarousels();
        } else {
          toast.error(result.message || 'Erro ao criar carrossel');
        }
      }
      
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar carrossel:', error);
      toast.error('Erro interno do servidor');
    }
  };

  const handleEdit = (item: CarouselItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      subtitle: item.subtitle,
      image_url: item.image_url,
      link_url: item.link_url,
      display_order: item.display_order
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja remover este item do carrossel?")) {
      try {
        const result = await deleteCarousel(id);
        if (result.success) {
          toast.success('Item removido com sucesso');
          loadCarousels();
        } else {
          toast.error(result.message || 'Erro ao remover item');
        }
      } catch (error) {
        console.error('Erro ao deletar carrossel:', error);
        toast.error('Erro interno do servidor');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      subtitle: "",
      image_url: "",
      link_url: "",
      display_order: 0
    });
    setShowForm(false);
    setEditingItem(null);
  };

  const getCurrentCarousels = () => {
    return activeTab === 'hero' ? heroCarousels : experienceCarousels;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Gerenciar Carrosséis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'hero' | 'experience')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="hero" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Carrossel Principal (Hero)
              </TabsTrigger>
              <TabsTrigger value="experience" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Carrossel de Experiências
              </TabsTrigger>
            </TabsList>

            <TabsContent value="hero" className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Carrossel Principal ({heroCarousels.length} itens)</h3>
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Item
                </Button>
              </div>
              
              {heroCarousels.length === 0 ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 mx-auto bg-blue-500/20 rounded-full flex items-center justify-center">
                    <Home className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-blue-700">Carrossel Vazio</h3>
                    <p className="text-muted-foreground mt-2">Adicione o primeiro item ao carrossel principal</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {heroCarousels.map((item) => (
                    <Card key={item.id} className="overflow-hidden">
                      <div className="relative h-32">
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute top-2 right-2 flex gap-1">
                          <Button size="sm" variant="secondary" onClick={() => handleEdit(item)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(item.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="p-3">
                        <h4 className="font-medium text-sm">{item.title}</h4>
                        {item.subtitle && (
                          <p className="text-xs text-muted-foreground mt-1">{item.subtitle}</p>
                        )}
                        <div className="text-xs text-muted-foreground mt-2">
                          Ordem: {item.display_order}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="experience" className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Carrossel de Experiências ({experienceCarousels.length} itens)</h3>
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Item
                </Button>
              </div>
              
              {experienceCarousels.length === 0 ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
                    <Users className="h-8 w-8 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-green-700">Carrossel Vazio</h3>
                    <p className="text-muted-foreground mt-2">Adicione o primeiro item ao carrossel de experiências</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {experienceCarousels.map((item) => (
                    <Card key={item.id} className="overflow-hidden">
                      <div className="relative h-32">
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute top-2 right-2 flex gap-1">
                          <Button size="sm" variant="secondary" onClick={() => handleEdit(item)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(item.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="p-3">
                        <h4 className="font-medium text-sm">{item.title}</h4>
                        {item.subtitle && (
                          <p className="text-xs text-muted-foreground mt-1">{item.subtitle}</p>
                        )}
                        <div className="text-xs text-muted-foreground mt-2">
                          Ordem: {item.display_order}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Form Modal */}
          {showForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <Card className="w-full max-w-md m-4">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {editingItem ? 'Editar Item' : 'Novo Item'}
                    <Button variant="ghost" size="sm" onClick={resetForm}>
                      <X className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
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
                      <Label htmlFor="subtitle">Subtítulo</Label>
                      <Input
                        id="subtitle"
                        value={formData.subtitle}
                        onChange={(e) => setFormData({...formData, subtitle: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="image_url">URL da Imagem</Label>
                      <Input
                        id="image_url"
                        value={formData.image_url}
                        onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="link_url">URL de Link (opcional)</Label>
                      <Input
                        id="link_url"
                        value={formData.link_url}
                        onChange={(e) => setFormData({...formData, link_url: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="display_order">Ordem de Exibição</Label>
                      <Input
                        id="display_order"
                        type="number"
                        value={formData.display_order}
                        onChange={(e) => setFormData({...formData, display_order: parseInt(e.target.value) || 0})}
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1">
                        <Save className="h-4 w-4 mr-2" />
                        {editingItem ? 'Atualizar' : 'Criar'}
                      </Button>
                      <Button type="button" variant="outline" onClick={resetForm}>
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCarousels;
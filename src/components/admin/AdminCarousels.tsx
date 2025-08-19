import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Upload, Edit, Save, X, Image, Video, Home, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  alt?: string;
  file?: File;
}

interface ExperienceItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  description?: string;
  file?: File;
}

const AdminCarousels = () => {
  const { toast } = useToast();
  
  // Estados para carrossel principal (home)
  const [homeItems, setHomeItems] = useState<MediaItem[]>([]);
  const [homeSelectedFile, setHomeSelectedFile] = useState<File | null>(null);
  const [homePreviewUrl, setHomePreviewUrl] = useState<string>('');
  const [homeNewItem, setHomeNewItem] = useState({
    type: 'image' as 'image' | 'video',
    alt: ''
  });

  // Estados para carrossel de experiências
  const [experienceItems, setExperienceItems] = useState<ExperienceItem[]>([]);
  const [experienceSelectedFile, setExperienceSelectedFile] = useState<File | null>(null);
  const [experiencePreviewUrl, setExperiencePreviewUrl] = useState<string>('');
  const [experienceNewDescription, setExperienceNewDescription] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState('');

  // Carregar dados do localStorage para carrossel principal
  useEffect(() => {
    try {
      const storedData = localStorage.getItem('adminMediaCarousel');
      if (storedData) {
        setHomeItems(JSON.parse(storedData));
      } else {
        const defaultItems: MediaItem[] = [];
        setHomeItems(defaultItems);
        localStorage.setItem('adminMediaCarousel', JSON.stringify(defaultItems));
      }
    } catch (error) {
      console.error('Erro ao carregar dados do carrossel principal:', error);
    }
  }, []);

  // Carregar dados do localStorage para carrossel de experiências
  useEffect(() => {
    try {
      const storedData = localStorage.getItem('adminAboutCarousel');
      if (storedData) {
        setExperienceItems(JSON.parse(storedData));
      } else {
        const defaultItems: ExperienceItem[] = [];
        setExperienceItems(defaultItems);
        localStorage.setItem('adminAboutCarousel', JSON.stringify(defaultItems));
      }
    } catch (error) {
      console.error('Erro ao carregar dados do carrossel de experiências:', error);
    }
  }, []);

  // Funções para carrossel principal
  const saveHomeToLocalStorage = (items: MediaItem[]) => {
    try {
      localStorage.setItem('adminMediaCarousel', JSON.stringify(items));
      window.dispatchEvent(new CustomEvent('adminMediaCarouselUpdate'));
    } catch (error) {
      console.error('Erro ao salvar dados do carrossel principal:', error);
    }
  };

  const handleHomeFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (!isImage && !isVideo) {
      toast({
        title: "Erro",
        description: "Por favor, selecione apenas arquivos de imagem ou vídeo",
        variant: "destructive"
      });
      return;
    }

    const fileType = isImage ? 'image' : 'video';
    setHomeNewItem(prev => ({ ...prev, type: fileType }));
    
    setHomeSelectedFile(file);
    
    const url = URL.createObjectURL(file);
    setHomePreviewUrl(url);
  };

  const addHomeItem = () => {
    if (!homeSelectedFile) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo",
        variant: "destructive"
      });
      return;
    }

    const item: MediaItem = {
      id: Date.now().toString(),
      type: homeNewItem.type,
      url: homePreviewUrl,
      alt: homeNewItem.alt.trim() || undefined,
      file: homeSelectedFile
    };

    const updatedItems = [...homeItems, item];
    setHomeItems(updatedItems);
    saveHomeToLocalStorage(updatedItems);
    
    // Limpar formulário
    setHomeNewItem({ type: 'image', alt: '' });
    setHomeSelectedFile(null);
    setHomePreviewUrl('');
    
    const fileInput = document.getElementById('home-file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
    
    toast({
      title: "Sucesso",
      description: "Item adicionado ao carrossel principal"
    });
  };

  const removeHomeItem = (id: string) => {
    const updatedItems = homeItems.filter(item => item.id !== id);
    setHomeItems(updatedItems);
    saveHomeToLocalStorage(updatedItems);
    
    toast({
      title: "Sucesso", 
      description: "Item removido do carrossel principal"
    });
  };

  // Funções para carrossel de experiências
  const saveExperienceToLocalStorage = (items: ExperienceItem[]) => {
    try {
      localStorage.setItem('adminAboutCarousel', JSON.stringify(items));
      window.dispatchEvent(new CustomEvent('adminAboutCarouselUpdate'));
    } catch (error) {
      console.error('Erro ao salvar dados do carrossel de experiências:', error);
    }
  };

  const handleExperienceFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (!isImage && !isVideo) {
      toast({
        title: "Erro",
        description: "Por favor, selecione apenas arquivos de imagem ou vídeo",
        variant: "destructive"
      });
      return;
    }

    setExperienceSelectedFile(file);
    
    const url = URL.createObjectURL(file);
    setExperiencePreviewUrl(url);
  };

  const addExperienceItem = () => {
    if (!experienceSelectedFile) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo",
        variant: "destructive"
      });
      return;
    }

    const isImage = experienceSelectedFile.type.startsWith('image/');
    const item: ExperienceItem = {
      id: Date.now().toString(),
      type: isImage ? 'image' : 'video',
      url: experiencePreviewUrl,
      description: experienceNewDescription.trim() || undefined,
      file: experienceSelectedFile
    };

    const updatedItems = [...experienceItems, item];
    setExperienceItems(updatedItems);
    saveExperienceToLocalStorage(updatedItems);
    
    // Limpar formulário
    setExperienceNewDescription('');
    setExperienceSelectedFile(null);
    setExperiencePreviewUrl('');
    
    const fileInput = document.getElementById('experience-file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
    
    toast({
      title: "Sucesso",
      description: "Item adicionado ao carrossel de experiências"
    });
  };

  const removeExperienceItem = (id: string) => {
    const updatedItems = experienceItems.filter(item => item.id !== id);
    setExperienceItems(updatedItems);
    saveExperienceToLocalStorage(updatedItems);
    
    toast({
      title: "Sucesso", 
      description: "Item removido do carrossel de experiências"
    });
  };

  const startEdit = (item: ExperienceItem) => {
    setEditingId(item.id);
    setEditDescription(item.description || '');
  };

  const saveEdit = (id: string) => {
    const updatedItems = experienceItems.map(item => 
      item.id === id 
        ? { ...item, description: editDescription.trim() || undefined }
        : item
    );
    setExperienceItems(updatedItems);
    saveExperienceToLocalStorage(updatedItems);
    setEditingId(null);
    setEditDescription('');
    
    toast({
      title: "Sucesso",
      description: "Descrição atualizada"
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDescription('');
  };

  // Limpar previews
  useEffect(() => {
    return () => {
      if (homePreviewUrl) URL.revokeObjectURL(homePreviewUrl);
      if (experiencePreviewUrl) URL.revokeObjectURL(experiencePreviewUrl);
    };
  }, [homePreviewUrl, experiencePreviewUrl]);

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
          <Tabs defaultValue="home" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="home" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Carrossel Principal (Home)
              </TabsTrigger>
              <TabsTrigger value="experiences" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Carrossel de Experiências
              </TabsTrigger>
            </TabsList>

            {/* Carrossel Principal (Home) */}
            <TabsContent value="home" className="space-y-6">
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold">Adicionar ao Carrossel Principal</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="home-file-upload">Upload de Arquivo</Label>
                    <Input
                      id="home-file-upload"
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleHomeFileSelect}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Selecione imagens (JPG, PNG, WebP) ou vídeos (MP4, WebM)
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="home-alt">Descrição (opcional)</Label>
                    <Input
                      id="home-alt"
                      placeholder="Descrição da imagem/vídeo"
                      value={homeNewItem.alt}
                      onChange={(e) => setHomeNewItem(prev => ({ ...prev, alt: e.target.value }))}
                    />
                  </div>
                </div>

                {homeSelectedFile && homePreviewUrl && (
                  <div className="border border-gray-200 rounded-lg p-4 bg-white">
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">Preview:</Label>
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 rounded border overflow-hidden">
                        {homeNewItem.type === 'image' ? (
                          <img
                            src={homePreviewUrl}
                            alt="Preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                            <Video className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{homeSelectedFile.name}</p>
                        <p className="text-xs text-gray-500">
                          {homeNewItem.type === 'image' ? 'Imagem' : 'Vídeo'} • {(homeSelectedFile.size / 1024 / 1024).toFixed(1)} MB
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button 
                    onClick={addHomeItem} 
                    disabled={!homeSelectedFile}
                    className="px-6"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
              </div>

              {/* Lista de itens do carrossel principal */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Itens do Carrossel Principal ({homeItems.length})</h3>
                
                {homeItems.length === 0 ? (
                  <div className="text-center py-12 space-y-4">
                    <div className="w-16 h-16 mx-auto bg-blue-500/20 rounded-full flex items-center justify-center">
                      <Home className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-blue-700">Carrossel Vazio</h3>
                      <p className="text-muted-foreground mt-2">Adicione a primeira imagem ou vídeo para o carrossel principal</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {homeItems.map((item) => (
                      <Card key={item.id} className="overflow-hidden">
                        <div className="relative h-32">
                          {item.type === 'image' ? (
                            <img
                              src={item.url}
                              alt={item.alt}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <Video className="h-8 w-8 text-gray-400" />
                              <span className="ml-2 text-sm text-gray-600">Vídeo</span>
                            </div>
                          )}
                          
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => removeHomeItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="p-3">
                          <div className="flex items-center gap-2 mb-1">
                            {item.type === 'image' ? <Image className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                            <span className="text-sm font-medium capitalize">{item.type}</span>
                          </div>
                          {item.alt && (
                            <p className="text-xs text-gray-600 truncate">{item.alt}</p>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Carrossel de Experiências */}
            <TabsContent value="experiences" className="space-y-6">
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold">Adicionar ao Carrossel de Experiências</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="experience-file-upload">Upload de Arquivo</Label>
                    <Input
                      id="experience-file-upload"
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleExperienceFileSelect}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Selecione imagens (JPG, PNG, WebP) ou vídeos (MP4, WebM)
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="experience-description">Descrição (opcional)</Label>
                    <Textarea
                      id="experience-description"
                      placeholder="Descrição da experiência..."
                      value={experienceNewDescription}
                      onChange={(e) => setExperienceNewDescription(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>

                {experienceSelectedFile && experiencePreviewUrl && (
                  <div className="border border-gray-200 rounded-lg p-4 bg-white">
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">Preview:</Label>
                    <div className="flex items-center gap-4">
                      <div className="w-32 h-24 rounded border overflow-hidden">
                        {experienceSelectedFile.type.startsWith('image/') ? (
                          <img
                            src={experiencePreviewUrl}
                            alt="Preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                            <Video className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{experienceSelectedFile.name}</p>
                        <p className="text-xs text-gray-500">
                          {experienceSelectedFile.type.startsWith('image/') ? 'Imagem' : 'Vídeo'} • {(experienceSelectedFile.size / 1024 / 1024).toFixed(1)} MB
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button 
                    onClick={addExperienceItem} 
                    disabled={!experienceSelectedFile}
                    className="px-6"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
              </div>

              {/* Lista de itens do carrossel de experiências */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Itens do Carrossel de Experiências ({experienceItems.length})</h3>
                
                {experienceItems.length === 0 ? (
                  <div className="text-center py-12 space-y-4">
                    <div className="w-16 h-16 mx-auto bg-blue-500/20 rounded-full flex items-center justify-center">
                      <Users className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-blue-700">Carrossel Vazio</h3>
                      <p className="text-muted-foreground mt-2">Adicione a primeira imagem ou vídeo das experiências</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {experienceItems.map((item) => (
                      <Card key={item.id} className="overflow-hidden">
                        <div className="relative h-40">
                          {item.type === 'image' ? (
                            <img
                              src={item.url}
                              alt={item.description}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <Video className="h-8 w-8 text-gray-400" />
                              <span className="ml-2 text-sm text-gray-600">Vídeo</span>
                            </div>
                          )}
                          
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => removeExperienceItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="p-4 space-y-3">
                          <div className="flex items-center gap-2">
                            {item.type === 'image' ? <Image className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                            <span className="text-sm font-medium capitalize">{item.type}</span>
                          </div>
                          
                          <div className="space-y-2">
                            {editingId === item.id ? (
                              <div className="space-y-2">
                                <Textarea
                                  value={editDescription}
                                  onChange={(e) => setEditDescription(e.target.value)}
                                  placeholder="Descrição da experiência..."
                                  rows={2}
                                  className="text-sm"
                                />
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => saveEdit(item.id)}
                                    className="flex-1"
                                  >
                                    <Save className="h-3 w-3 mr-1" />
                                    Salvar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={cancelEdit}
                                    className="flex-1"
                                  >
                                    <X className="h-3 w-3 mr-1" />
                                    Cancelar
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <p className="text-sm text-gray-600 min-h-[2.5rem]">
                                  {item.description || 'Sem descrição'}
                                </p>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => startEdit(item)}
                                  className="w-full"
                                >
                                  <Edit className="h-3 w-3 mr-1" />
                                  Editar Descrição
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
            <h4 className="text-sm font-semibold text-blue-800 mb-2">💡 Dica de Otimização</h4>
            <p className="text-sm text-blue-700">
              Para melhor performance, otimize suas imagens antes do upload: máximo 1200x800px, formato WebP ou JPG com qualidade 85%. 
              Vídeos devem ter no máximo 15MB e resolução Full HD (1920x1080px).
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCarousels;

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { getAdminLocations, updateLocationStatus, AdminLocation } from "@/services/adminService";
import FileUpload from "@/components/ui/file-upload";

interface ExtendedAdminLocation extends AdminLocation {
  whatsapp?: string;
  especies?: string;
  melhorEpoca?: string;
  estrutura?: string;
  atividades?: string;
}

const AdminLocations = () => {
  const [locations, setLocations] = useState<ExtendedAdminLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Partial<ExtendedAdminLocation>>({});
  const [locationToDelete, setLocationToDelete] = useState<string | null>(null);
  const [showCharacteristics, setShowCharacteristics] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const data = await getAdminLocations();
        setLocations(data as ExtendedAdminLocation[]);
      } catch (error) {
        console.error("Error fetching locations:", error);
        toast.error("Erro ao carregar localidades");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocations();
  }, []);

  const openAddDialog = () => {
    setCurrentLocation({});
    setIsEditing(false);
    setShowCharacteristics(false);
    setSelectedImage(null);
    setDialogOpen(true);
  };

  const openEditDialog = (location: ExtendedAdminLocation) => {
    setCurrentLocation(location);
    setIsEditing(true);
    setShowCharacteristics(true);
    setDialogOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentLocation((prev) => ({ ...prev, [name]: value }));
  };

  const handleFeaturedChange = (checked: boolean) => {
    setCurrentLocation((prev) => ({ ...prev, featured: checked }));
  };

  const handleNext = () => {
    // Validate required fields
    if (!currentLocation.name || !currentLocation.description) {
      toast.error("Por favor, preencha nome e descrição antes de continuar.");
      return;
    }
    setShowCharacteristics(true);
  };

  const handleToggleFeatured = async (id: string) => {
    const location = locations.find((l) => l.id === id);
    if (!location) return;

    try {
      const result = await updateLocationStatus(id, location.approved, !location.featured);
      if (result.success) {
        setLocations((prev) =>
          prev.map((loc) =>
            loc.id === id ? { ...loc, featured: !loc.featured } : loc
          )
        );
        
        const action = location.featured ? "removida dos destaques" : "destacada";
        toast.success(`Localidade ${action} com sucesso!`);
      } else {
        toast.error(result.message || "Erro ao atualizar localidade");
      }
    } catch (error) {
      console.error("Error toggling featured:", error);
      toast.error("Erro ao atualizar localidade");
    }
  };

  const handleSave = () => {
    // This would be implemented with real API calls
    // For now, just close the dialog
    setDialogOpen(false);
    setShowCharacteristics(false);
    setSelectedImage(null);
    toast.info("Funcionalidade de edição será implementada com API completa");
  };

  const handleDelete = (id: string) => {
    // This would be implemented with real API calls
    setLocations((prev) => prev.filter((loc) => loc.id !== id));
    toast.success("Localidade excluída com sucesso!");
    setLocationToDelete(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Gerenciar Localidades</h2>
        <Button onClick={openAddDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Localidade
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Imagem</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Destaque</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {locations.map((location) => (
                <TableRow key={location.id}>
                  <TableCell>
                    <div className="w-16 h-12 rounded bg-gray-100 flex items-center justify-center">
                      <span className="text-xs text-gray-400">Sem imagem</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{location.name}</TableCell>
                  <TableCell className="max-w-xs">
                    <div className="truncate">{location.description}</div>
                  </TableCell>
                  <TableCell>{location.suggested_by}</TableCell>
                  <TableCell>
                    <Switch
                      checked={location.featured}
                      onCheckedChange={() => handleToggleFeatured(location.id)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openEditDialog(location)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="icon" className="text-red-500">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita. Isso excluirá permanentemente a localidade "{location.name}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              className="bg-red-500 hover:bg-red-600" 
                              onClick={() => handleDelete(location.id)}
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Editar Localidade" : "Adicionar Localidade"}
            </DialogTitle>
          </DialogHeader>
          
          {!showCharacteristics ? (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  name="name"
                  value={currentLocation.name || ""}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={currentLocation.description || ""}
                  onChange={handleInputChange}
                  rows={4}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <FileUpload
                  id="location-image"
                  label="Imagem da Localidade"
                  accept="image/png,image/jpg,image/jpeg"
                  maxSize={5}
                  value={selectedImage}
                  onChange={setSelectedImage}
                  placeholder="Adicione uma foto da localidade"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp (com código do país)</Label>
                <Input
                  id="whatsapp"
                  name="whatsapp"
                  value={currentLocation.whatsapp || ""}
                  onChange={handleInputChange}
                  placeholder="5511999999999"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={currentLocation.featured || false}
                  onCheckedChange={handleFeaturedChange}
                  id="featured"
                />
                <Label htmlFor="featured">Destacar localidade na página inicial</Label>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <h3 className="text-lg font-semibold mb-4">Características da Localidade</h3>
              
              <div className="space-y-2">
                <Label htmlFor="especies">Espécies Encontradas</Label>
                <Textarea
                  id="especies"
                  name="especies"
                  value={currentLocation.especies || ""}
                  onChange={handleInputChange}
                  placeholder="Ex: Dourado, Tucunaré, Piranha, Surubim - espécies típicas das águas baianas"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="melhorEpoca">Melhor Época</Label>
                <Textarea
                  id="melhorEpoca"
                  name="melhorEpoca"
                  value={currentLocation.melhorEpoca || ""}
                  onChange={handleInputChange}
                  placeholder="Ex: De maio a setembro, época ideal para pesca na região da Bahia com menor índice pluviométrico"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="estrutura">Estrutura</Label>
                <Textarea
                  id="estrutura"
                  name="estrutura"
                  value={currentLocation.estrutura || ""}
                  onChange={handleInputChange}
                  placeholder="Ex: Estrutura completa para pescadores, equipamentos, área de descanso e apoio na região"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="atividades">Atividades</Label>
                <Textarea
                  id="atividades"
                  name="atividades"
                  value={currentLocation.atividades || ""}
                  onChange={handleInputChange}
                  placeholder="Ex: Pesca esportiva, turismo rural, conhecimento da cultura local da Bahia"
                  rows={3}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            {!showCharacteristics && !isEditing ? (
              <Button onClick={handleNext}>Próximo</Button>
            ) : (
              <Button onClick={handleSave}>Salvar</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminLocations;

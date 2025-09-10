
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Upload, Camera, Video } from "lucide-react";
import { toast } from "sonner";
import { getLocations, Location } from "@/services/mockData";
import { useTrophyWebhook } from "@/services/trophyWebhook";
import { useAuth } from "@/contexts/AuthContext";

const CreateReportPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notifyReportCreated } = useTrophyWebhook();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  
  // Form states
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [location, setLocation] = useState("");
  const [fishSpecies, setFishSpecies] = useState("");
  const [fishWeight, setFishWeight] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [approved, setApproved] = useState(false);
  const [images, setImages] = useState<{ preview: string; file?: File }[]>([]);
  const [video, setVideo] = useState<{ preview: string; file?: File } | null>(null);
  
  // Form validation
  const [errors, setErrors] = useState<{
    title?: string;
    content?: string;
    location?: string;
    fishSpecies?: string;
    images?: string;
  }>({});

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const data = await getLocations();
        setLocations(data);
      } catch (error) {
        console.error("Error fetching locations:", error);
        toast.error("Erro ao carregar localidades");
      }
    };

    fetchLocations();
  }, []);

  const validateForm = () => {
    const newErrors: any = {};
    
    if (!title.trim()) newErrors.title = "Título é obrigatório";
    if (!content.trim()) newErrors.content = "Conteúdo é obrigatório";
    if (!location.trim()) newErrors.location = "Localidade é obrigatória";
    if (!fishSpecies.trim()) newErrors.fishSpecies = "Espécie do peixe é obrigatória";
    if (images.length === 0) newErrors.images = "Adicione pelo menos uma imagem";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const files = Array.from(e.target.files);
    
    // Limit to 3 images total
    if (images.length + files.length > 3) {
      toast.error("Você pode adicionar no máximo 3 imagens");
      return;
    }
    
    const newImages = files.map((file) => ({
      preview: URL.createObjectURL(file),
      file
    }));
    
    setImages([...images, ...newImages]);
    
    // Reset input
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    
    // Revoke object URL to prevent memory leaks
    if (newImages[index].preview) {
      URL.revokeObjectURL(newImages[index].preview);
    }
    
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    // If there's already a video, revoke its object URL
    if (video?.preview) {
      URL.revokeObjectURL(video.preview);
    }
    
    const file = e.target.files[0];
    
    // Check file size (limit to 100MB)
    if (file.size > 100 * 1024 * 1024) {
      toast.error("O tamanho máximo do vídeo é 100MB");
      return;
    }

    // Check file type
    if (!file.type.startsWith('video/')) {
      toast.error("Por favor, selecione um arquivo de vídeo válido");
      return;
    }
    
    setVideo({
      preview: URL.createObjectURL(file),
      file
    });
    
    // Reset input
    e.target.value = '';
  };

  const removeVideo = () => {
    if (video?.preview) {
      URL.revokeObjectURL(video.preview);
    }
    setVideo(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Simulate report creation and get report ID
      const reportId = Date.now().toString();
      
      // Prepare webhook data
      const reportData = {
        report_id: reportId,
        fish_species: fishSpecies,
        location: location,
        images: images.map(img => img.preview),
        is_public: isPublic,
        approved: user?.isAdmin ? approved : false
      };
      
      // Notify trophy webhook
      await notifyReportCreated(reportData);
      
      toast.success("Relato criado com sucesso!");
      navigate("/reports");
    } catch (error) {
      console.error("Error creating report:", error);
      toast.error("Erro ao criar relato");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader 
        title="Novo Relato de Pesca"
        description="Compartilhe sua experiência de pesca com a comunidade"
      />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Título <span className="text-red-500">*</span></Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Dê um título ao seu relato"
                className={errors.title ? "border-red-500" : ""}
              />
              {errors.title && <p className="text-red-500 text-sm">{errors.title}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Localidade <span className="text-red-500">*</span></Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Digite a localidade da pesca"
                className={errors.location ? "border-red-500" : ""}
              />
              {errors.location && <p className="text-red-500 text-sm">{errors.location}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fishSpecies">Espécie do Peixe <span className="text-red-500">*</span></Label>
                <Input
                  id="fishSpecies"
                  value={fishSpecies}
                  onChange={(e) => setFishSpecies(e.target.value)}
                  placeholder="Ex: Tucunaré, Dourado, Pintado..."
                  className={errors.fishSpecies ? "border-red-500" : ""}
                />
                {errors.fishSpecies && <p className="text-red-500 text-sm">{errors.fishSpecies}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="fishWeight">Peso do Peixe <span className="text-gray-500 text-sm">(Opcional)</span></Label>
                <div className="flex">
                  <Input
                    id="fishWeight"
                    type="number"
                    step="0.1"
                    min="0"
                    value={fishWeight}
                    onChange={(e) => setFishWeight(e.target.value)}
                    placeholder="0.0"
                    className="rounded-r-none"
                  />
                  <div className="flex items-center px-3 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 text-sm">
                    kg
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Descrição <span className="text-red-500">*</span></Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Descreva sua experiência de pesca"
                className={`min-h-32 ${errors.content ? "border-red-500" : ""}`}
              />
              {errors.content && <p className="text-red-500 text-sm">{errors.content}</p>}
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isPublic"
                  checked={isPublic}
                  onCheckedChange={(checked) => setIsPublic(checked as boolean)}
                />
                <Label 
                  htmlFor="isPublic" 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Tornar público (necessário para participar do ranking de troféus)
                </Label>
              </div>

              {user?.isAdmin && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="approved"
                    checked={approved}
                    onCheckedChange={(checked) => setApproved(checked as boolean)}
                  />
                  <Label 
                    htmlFor="approved" 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Aprovar relato (somente administradores)
                  </Label>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="images">
                Imagens <span className="text-red-500">*</span> <span className="text-gray-500 text-sm">(Máximo 3)</span>
              </Label>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                {images.map((image, index) => (
                  <div key={index} className="relative h-40 rounded-lg overflow-hidden border">
                    <img
                      src={image.preview}
                      alt={`Preview ${index}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                {images.length < 3 && (
                  <div className="h-40 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-gray-400 transition-colors">
                    <Label
                      htmlFor="image-upload"
                      className="flex flex-col items-center justify-center cursor-pointer py-3 px-4"
                    >
                      <Camera className="h-8 w-8 text-gray-500 mb-2" />
                      <span className="text-sm text-gray-500">Adicionar foto</span>
                      <Input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </Label>
                  </div>
                )}
              </div>
              
              {errors.images && <p className="text-red-500 text-sm">{errors.images}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="video">Vídeo <span className="text-gray-500 text-sm">(Opcional, máximo 100MB)</span></Label>
              
              <div className="mt-2">
                {video ? (
                  <div className="relative rounded-lg overflow-hidden border">
                    <video 
                      src={video.preview} 
                      className="w-full h-64 object-cover" 
                      controls
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8"
                      onClick={removeVideo}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center p-6 hover:border-gray-400 transition-colors">
                    <Label
                      htmlFor="video-upload"
                      className="flex flex-col items-center justify-center cursor-pointer py-3 px-4 w-full"
                    >
                      <Video className="h-8 w-8 text-gray-500 mb-2" />
                      <span className="text-sm text-gray-500">Adicionar vídeo</span>
                      <span className="text-xs text-gray-400 mt-1">Formatos suportados: MP4, MOV, AVI, etc.</span>
                      <Input
                        id="video-upload"
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={handleVideoUpload}
                      />
                    </Label>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/reports")}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="ripple-effect"
              >
                {isSubmitting ? (
                  <>
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent mr-2" />
                    Publicando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Publicar Relato
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateReportPage;

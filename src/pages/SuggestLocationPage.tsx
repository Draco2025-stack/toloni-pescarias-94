import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { MapPin, Camera, Info, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import FileUpload from "@/components/ui/file-upload";

const SuggestLocationPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    state: "",
    city: "",
    description: "",
    contact: "",
    features: "",
    imageUrl: "",
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Acesso restrito",
        description: "Você precisa estar logado para sugerir uma localidade.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast({
      title: "Localidade sugerida com sucesso!",
      description: "Nossa equipe irá revisar e adicionar em breve.",
      variant: "default",
    });
    
    setFormData({
      name: "",
      state: "",
      city: "",
      description: "",
      contact: "",
      features: "",
      imageUrl: "",
    });
    setSelectedImage(null);
    
    setIsSubmitting(false);
  };

  return (
    <div>
      <PageHeader 
        title="Sugerir Nova Localidade"
        description="Compartilhe um novo ponto de pesca com nossa comunidade"
        image=""
      />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <Alert className="mb-8 border-fishing-blue/30 bg-fishing-blue/5">
            <Info className="h-4 w-4 text-fishing-blue" />
            <AlertTitle>Informação importante</AlertTitle>
            <AlertDescription>
              Todas as localidades sugeridas passam por uma avaliação da nossa equipe antes de serem publicadas. 
              Quanto mais detalhes você fornecer, mais rápida será a aprovação.
            </AlertDescription>
          </Alert>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold font-heading mb-6 text-fishing-green">Detalhes da Localidade</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Nome da Localidade *
                  </label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Ex: Lago dos Sonhos"
                  />
                </div>
                
                <div>
                  <FileUpload
                    id="location-image"
                    label="Imagem da Localidade (opcional)"
                    accept="image/png,image/jpg,image/jpeg"
                    maxSize={5}
                    value={selectedImage}
                    onChange={setSelectedImage}
                    placeholder="Adicione uma foto da localidade"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                    Estado *
                  </label>
                  <Input
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    required
                    placeholder="Ex: São Paulo"
                  />
                </div>
                
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                    Cidade *
                  </label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    placeholder="Ex: Campinas"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição Detalhada *
                </label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  placeholder="Descreva a localidade, como chegar, melhores épocas para pesca, etc."
                  rows={5}
                />
              </div>
              
              <div>
                <label htmlFor="features" className="block text-sm font-medium text-gray-700 mb-1">
                  Características da Pesca
                </label>
                <Textarea
                  id="features"
                  name="features"
                  value={formData.features}
                  onChange={handleChange}
                  placeholder="Espécies de peixes encontradas, técnicas recomendadas, etc."
                  rows={3}
                />
              </div>
              
              <div>
                <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-1">
                  Contato Local (opcional)
                </label>
                <Input
                  id="contact"
                  name="contact"
                  value={formData.contact}
                  onChange={handleChange}
                  placeholder="Telefone, WhatsApp ou e-mail para mais informações"
                />
              </div>

              <Alert className="border-amber-300 bg-amber-50 text-amber-800">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Atenção</AlertTitle>
                <AlertDescription>
                  Ao sugerir uma localidade, você concorda que as informações fornecidas sejam publicadas em nossa plataforma
                  e que respeita os termos de uso e política de privacidade do Toloni Pescarias.
                </AlertDescription>
              </Alert>
              
              <div className="flex justify-end">
                <Button 
                  type="button" 
                  variant="outline"
                  className="mr-4"
                  onClick={() => navigate(-1)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="bg-fishing-green hover:bg-fishing-green-light"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Enviando..." : "Enviar Sugestão"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuggestLocationPage;

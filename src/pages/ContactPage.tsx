
import { useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Phone, Mail, Clock } from "lucide-react";

const ContactPage = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Mensagem enviada com sucesso!",
      description: "Entraremos em contato em breve.",
    });
    
    setFormData({
      name: "",
      email: "",
      subject: "",
      message: "",
    });
    
    setIsSubmitting(false);
  };

  const handleWhatsAppClick = () => {
    const message = encodeURIComponent("Olá! Vi a localidade Rio Amazonas no Toloni Pescarias e gostaria de mais informações.");
    const phoneNumber = "5511972225982";
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  return (
    <div>
      <PageHeader 
        title="Entre em Contato"
        description="Estamos aqui para responder suas dúvidas ou ouvir suas sugestões"
        image=""
      />
      
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold font-heading mb-6 text-fishing-blue">Envie uma Mensagem</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Completo
                </label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Seu nome completo"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  E-mail
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="seu.email@exemplo.com"
                />
              </div>
              
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                  Assunto
                </label>
                <Input
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  placeholder="Sobre o que você quer falar?"
                />
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Mensagem
                </label>
                <Textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  placeholder="Digite sua mensagem aqui..."
                  rows={5}
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-fishing-blue hover:bg-fishing-blue-light"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Enviando..." : "Enviar Mensagem"}
              </Button>
            </form>
          </div>
          
          {/* Contact Information */}
          <div>
            <div className="bg-gradient-to-br from-fishing-blue to-fishing-blue-light text-white rounded-xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold font-heading mb-6">Informações de Contato</h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <Phone className="h-6 w-6 mr-4 mt-1" />
                  <div>
                    <h3 className="font-semibold">WhatsApp</h3>
                    <button 
                      onClick={handleWhatsAppClick}
                      className="text-fishing-sand hover:text-fishing-sand-dark transition-colors"
                    >
                      +55 (11) 97222-5982
                    </button>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Mail className="h-6 w-6 mr-4 mt-1" />
                  <div>
                    <h3 className="font-semibold">E-mail</h3>
                    <p>contato@tolonipescarias.com</p>
                    <p>suporte@tolonipescarias.com</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Clock className="h-6 w-6 mr-4 mt-1" />
                  <div>
                    <h3 className="font-semibold">Horário de Atendimento</h3>
                    <p>Segunda à Sexta: 9h às 18h</p>
                    <p>Sábado: 9h às 13h</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold font-heading mb-6 text-fishing-green">FAQ - Perguntas Frequentes</h2>
              <div className="divide-y">
                <div className="py-4">
                  <h3 className="font-semibold text-lg mb-2">Como faço para criar uma conta?</h3>
                  <p className="text-gray-600">
                    Clique no botão "Criar Conta" no canto superior direito do site e preencha o formulário de cadastro.
                  </p>
                </div>
                <div className="py-4">
                  <h3 className="font-semibold text-lg mb-2">É possível sugerir uma nova localidade?</h3>
                  <p className="text-gray-600">
                    Sim! Você pode sugerir uma nova localidade através do formulário disponível na página "Localidades".
                  </p>
                </div>
                <div className="py-4">
                  <h3 className="font-semibold text-lg mb-2">Como faço para publicar um relato?</h3>
                  <p className="text-gray-600">
                    Após fazer login, clique em "Novo Relato" na página de Relatos ou na sua página de perfil.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;

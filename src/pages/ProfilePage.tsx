import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Camera, Settings, MapPin, Calendar, Fish } from "lucide-react";
import { getReportsByUser, Report } from "@/services/mockData";

const ProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    bio: (user as any)?.bio || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  
  const [profileImage, setProfileImage] = useState<string | null>(user?.profileImage || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [userReports, setUserReports] = useState<Report[]>([]);
  const [reportVisibility, setReportVisibility] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (user?.id) {
      fetchUserReports();
    }
  }, [user?.id]);

  const fetchUserReports = async () => {
    if (!user?.id) return;
    
    try {
      const reports = await getReportsByUser(user.id);
      setUserReports(reports);
      
      // Initialize visibility state based on current report visibility
      const visibilityState: Record<string, boolean> = {};
      reports.forEach(report => {
        visibilityState[report.id] = report.isPublic !== false; // Default to true if not set
      });
      setReportVisibility(visibilityState);
    } catch (error) {
      console.error("Error fetching user reports:", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Limit bio to 500 characters
    if (name === 'bio' && value.length > 500) {
      return;
    }
    
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setProfileImage(URL.createObjectURL(file));
  };

  const handleReportVisibilityChange = (reportId: string, isPublic: boolean) => {
    setReportVisibility(prev => ({
      ...prev,
      [reportId]: isPublic
    }));
  };

  const validatePasswordChange = () => {
    const newErrors: Record<string, string> = {};
    
    if (formData.newPassword && !formData.currentPassword) {
      newErrors.currentPassword = "Senha atual é necessária para definir uma nova senha";
    }
    
    if (formData.newPassword && formData.newPassword.length < 6) {
      newErrors.newPassword = "A senha deve ter pelo menos 6 caracteres";
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "As senhas não correspondem";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!validatePasswordChange()) {
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      toast.success("Perfil atualizado com sucesso");
      setIsSubmitting(false);
      setIsEditDialogOpen(false);
      
      // Reset password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      }));
    }, 1000);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div>
      <PageHeader title="Meu Perfil" description="Gerencie suas informações pessoais" />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex flex-col sm:flex-row gap-8 items-center mb-6">
              <div className="relative">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={profileImage || undefined} alt={user?.name} />
                  <AvatarFallback className="text-2xl">
                    {user ? getInitials(user.name) : "??"}
                  </AvatarFallback>
                </Avatar>
                
                <label 
                  htmlFor="profile-image" 
                  className="absolute -right-2 bottom-0 bg-fishing-blue text-white p-2 rounded-full cursor-pointer hover:bg-fishing-blue-light transition-colors"
                >
                  <Camera className="h-5 w-5" />
                  <input
                    id="profile-image"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleProfileImageChange}
                  />
                </label>
              </div>
              
              <div className="text-center sm:text-left flex-1">
                <h2 className="text-2xl font-semibold">{user?.name}</h2>
                {(user as any)?.bio && (
                  <p className="text-gray-700 mt-2">{(user as any).bio}</p>
                )}
                {(user as any)?.isAdmin && (
                  <span className="inline-block bg-fishing-blue text-white text-xs py-1 px-2 rounded mt-2">
                    Administrador
                  </span>
                )}
                
                <div className="flex gap-2 mt-4">
                  <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="px-6">
                        Editar perfil
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Editar Perfil</DialogTitle>
                      </DialogHeader>
                      
                      <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                          <Label htmlFor="name">Nome</Label>
                          <Input
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="bio">
                            Bio <span className="text-sm text-gray-500">({formData.bio.length}/500 caracteres)</span>
                          </Label>
                          <Textarea
                            id="bio"
                            name="bio"
                            value={formData.bio}
                            onChange={handleInputChange}
                            placeholder="Conte um pouco sobre você e sua experiência com a pesca..."
                            className="min-h-24"
                          />
                        </div>

                        <div className="border-t pt-6">
                          <h3 className="text-xl font-semibold mb-4">Visibilidade dos Relatos</h3>
                          <p className="text-sm text-gray-600 mb-4">
                            Selecione quais relatos deseja manter públicos em seu perfil:
                          </p>
                          
                          <div className="space-y-3 max-h-64 overflow-y-auto">
                            {userReports.map((report) => (
                              <div key={report.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                                <Checkbox
                                  id={`report-${report.id}`}
                                  checked={reportVisibility[report.id] || false}
                                  onCheckedChange={(checked) => 
                                    handleReportVisibilityChange(report.id, checked as boolean)
                                  }
                                />
                                <div className="flex-1 min-w-0">
                                  <label 
                                    htmlFor={`report-${report.id}`} 
                                    className="text-sm font-medium cursor-pointer block"
                                  >
                                    {report.title}
                                  </label>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {new Date(report.createdAt).toLocaleDateString('pt-BR')} • {report.locationName}
                                  </p>
                                </div>
                              </div>
                            ))}
                            {userReports.length === 0 && (
                              <p className="text-gray-500 text-sm text-center py-4">
                                Você ainda não possui relatos publicados.
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="border-t pt-6">
                          <h3 className="text-xl font-semibold mb-4">Alterar Senha</h3>
                          
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="currentPassword">Senha Atual</Label>
                              <Input
                                id="currentPassword"
                                name="currentPassword"
                                type="password"
                                value={formData.currentPassword}
                                onChange={handleInputChange}
                              />
                              {errors.currentPassword && (
                                <p className="text-red-500 text-sm">{errors.currentPassword}</p>
                              )}
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="newPassword">Nova Senha</Label>
                              <Input
                                id="newPassword"
                                name="newPassword"
                                type="password"
                                value={formData.newPassword}
                                onChange={handleInputChange}
                              />
                              {errors.newPassword && (
                                <p className="text-red-500 text-sm">{errors.newPassword}</p>
                              )}
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                              <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                              />
                              {errors.confirmPassword && (
                                <p className="text-red-500 text-sm">{errors.confirmPassword}</p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsEditDialogOpen(false)}
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
                                Salvando...
                              </>
                            ) : (
                              "Salvar Alterações"
                            )}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="icon">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56" align="start">
                      <div className="space-y-2">
                        <div 
                          className="p-2 hover:bg-gray-100 rounded cursor-pointer"
                          onClick={() => navigate('/account-settings')}
                        >
                          <p className="text-sm font-medium">Configurações de Conta</p>
                          <p className="text-xs text-gray-500">Gerencie suas preferências</p>
                        </div>
                        <div 
                          className="p-2 hover:bg-gray-100 rounded cursor-pointer"
                          onClick={() => navigate('/privacy-settings')}
                        >
                          <p className="text-sm font-medium">Privacidade</p>
                          <p className="text-xs text-gray-500">Configure sua privacidade</p>
                        </div>
                        <div 
                          className="p-2 hover:bg-gray-100 rounded cursor-pointer"
                          onClick={() => navigate('/notification-settings')}
                        >
                          <p className="text-sm font-medium">Notificações</p>
                          <p className="text-xs text-gray-500">Controle suas notificações</p>
                        </div>
                        <div className="border-t pt-2">
                          <div 
                            className="p-2 hover:bg-gray-100 rounded cursor-pointer"
                            onClick={() => navigate('/deactivate-account')}
                          >
                            <p className="text-sm font-medium text-red-600">Desativar Conta</p>
                            <p className="text-xs text-gray-500">Temporariamente desativar</p>
                          </div>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </div>

          {/* User Reports Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-xl font-semibold mb-6">Meus Relatos</h3>
            
            {userReports.length > 0 ? (
              <div className="space-y-4">
                {userReports.map((report) => (
                  <div key={report.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg mb-2">{report.title}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>{report.locationName}</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>{new Date(report.createdAt).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>
                        {report.content && (
                          <p className="text-gray-700 text-sm line-clamp-2">{report.content}</p>
                        )}
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/reports/${report.id}`)}
                        >
                          Visualizar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/reports/${report.id}/edit`)}
                        >
                          Editar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Fish className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h4 className="text-lg font-semibold mb-2">Nenhum relato ainda</h4>
                <p className="text-gray-600 mb-4">
                  Compartilhe suas experiências de pesca com a comunidade.
                </p>
                <Button onClick={() => navigate('/reports/create')}>
                  Criar primeiro relato
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

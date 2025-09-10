import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Camera, Settings, Edit, Eye, EyeOff, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import PageHeader from "@/components/common/PageHeader";
import { Link } from "react-router-dom";
import { getUserProfile, updateUserProfile, UserProfile, UserReport } from "@/services/userService";

const ProfilePageIntegrated = () => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    bio: "",
    phone: "",
    location: "",
    experience_level: "iniciante",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Image states
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Reports visibility
  const [reportVisibility, setReportVisibility] = useState<Record<number, boolean>>({});
  const [userReports, setUserReports] = useState<UserReport[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [errors, setErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  // Effect to fetch user profile and reports
  useEffect(() => {
    fetchUserProfileData();
  }, []);

  const fetchUserProfileData = async () => {
    try {
      const data = await getUserProfile();
      setProfile(data.profile);
      setUserReports(data.reports);
      
      // Update form data with profile data
      setFormData(prev => ({
        ...prev,
        name: data.profile.name,
        email: data.profile.email,
        bio: data.profile.bio || "",
        phone: data.profile.phone || "",
        location: data.profile.location || "",
        experience_level: data.profile.experience_level || "iniciante"
      }));
      
      // Set profile image
      if (data.profile.profile_image) {
        setProfileImage(data.profile.profile_image);
      }
      
      // Initialize visibility state
      const visibility: Record<number, boolean> = {};
      data.reports.forEach(report => {
        visibility[report.id] = report.is_public;
      });
      setReportVisibility(visibility);
    } catch (error) {
      toast.error("Erro ao carregar dados do perfil");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImage(URL.createObjectURL(file));
    }
  };

  const handleReportVisibilityChange = (reportId: number, isVisible: boolean) => {
    setReportVisibility(prev => ({
      ...prev,
      [reportId]: isVisible
    }));
  };

  const validatePasswordChange = () => {
    const newErrors: typeof errors = {};
    
    if (formData.newPassword && !formData.currentPassword) {
      newErrors.currentPassword = "Senha atual é necessária";
    }
    
    if (formData.newPassword && formData.newPassword.length < 6) {
      newErrors.newPassword = "Senha deve ter pelo menos 6 caracteres";
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Senhas não conferem";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePasswordChange()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const updateData: any = {
        name: formData.name,
        bio: formData.bio,
        phone: formData.phone,
        location: formData.location,
        experience_level: formData.experience_level,
        reportVisibility: reportVisibility
      };

      // Add password change if provided
      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
        updateData.confirmPassword = formData.confirmPassword;
      }

      await updateUserProfile(updateData);
      toast.success("Perfil atualizado com sucesso!");
      
      // Clear password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      }));
      
      // Refresh profile data
      await fetchUserProfileData();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar perfil");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Meu Perfil" description="Gerencie suas informações pessoais" />
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-32 w-32 bg-gray-200 rounded-full mx-auto"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Meu Perfil" description="Gerencie suas informações pessoais" />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Profile Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex flex-col sm:flex-row gap-8 items-center mb-6">
              <div className="relative">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={profileImage || undefined} alt={profile?.name} />
                  <AvatarFallback className="text-2xl">
                    {profile ? getInitials(profile.name) : "??"}
                  </AvatarFallback>
                </Avatar>
                
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -right-2 bottom-0 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors"
                >
                  <Camera className="h-5 w-5" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfileImageChange}
                />
              </div>
              
              <div className="text-center sm:text-left flex-1">
                <h2 className="text-2xl font-semibold">{profile?.name}</h2>
                {profile?.bio && (
                  <p className="text-gray-700 mt-2">{profile.bio}</p>
                )}
                {user?.isAdmin && (
                  <Badge variant="default" className="mt-2">
                    Administrador
                  </Badge>
                )}
                
                <div className="flex gap-2 mt-4">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="px-6">
                        <Edit className="w-4 h-4 mr-2" />
                        Editar perfil
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Editar Perfil</DialogTitle>
                      </DialogHeader>
                      
                      <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">Nome</Label>
                            <Input
                              id="name"
                              name="name"
                              value={formData.name}
                              onChange={handleInputChange}
                              required
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                              id="email"
                              name="email"
                              type="email"
                              value={formData.email}
                              disabled
                              className="bg-gray-50"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="phone">Telefone</Label>
                            <Input
                              id="phone"
                              name="phone"
                              value={formData.phone}
                              onChange={handleInputChange}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="location">Localização</Label>
                            <Input
                              id="location"
                              name="location"
                              value={formData.location}
                              onChange={handleInputChange}
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="bio">Bio</Label>
                          <Textarea
                            id="bio"
                            name="bio"
                            value={formData.bio}
                            onChange={handleInputChange}
                            rows={3}
                            maxLength={500}
                          />
                          <p className="text-sm text-gray-500">
                            {formData.bio.length}/500 caracteres
                          </p>
                        </div>

                        {/* Password Change Section */}
                        <div className="border-t pt-6">
                          <h3 className="text-lg font-medium mb-4">Alterar Senha</h3>
                          
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
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        </div>

                        {/* Report Visibility Section */}
                        {userReports.length > 0 && (
                          <div className="border-t pt-6">
                            <h3 className="text-lg font-medium mb-4">Visibilidade dos Relatos</h3>
                            <div className="space-y-3">
                              {userReports.map((report) => (
                                <div key={report.id} className="flex items-center justify-between p-3 border rounded-lg">
                                  <div className="flex-1">
                                    <h4 className="font-medium text-sm">{report.title}</h4>
                                    <p className="text-gray-500 text-xs">
                                      {new Date(report.created_at).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Switch
                                      checked={reportVisibility[report.id] || false}
                                      onCheckedChange={(checked) => 
                                        handleReportVisibilityChange(report.id, checked)
                                      }
                                    />
                                    {reportVisibility[report.id] ? (
                                      <Eye className="w-4 h-4 text-green-600" />
                                    ) : (
                                      <EyeOff className="w-4 h-4 text-gray-400" />
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex justify-end gap-3 pt-6 border-t">
                          <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Salvando..." : "Salvar Alterações"}
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
                    <PopoverContent className="w-56">
                      <div className="space-y-2">
                        <Link to="/account-settings">
                          <Button variant="ghost" className="w-full justify-start">
                            Configurações da Conta
                          </Button>
                        </Link>
                        <Link to="/privacy-settings">
                          <Button variant="ghost" className="w-full justify-start">
                            Configurações de Privacidade
                          </Button>
                        </Link>
                        <Link to="/notification-settings">
                          <Button variant="ghost" className="w-full justify-start">
                            Configurações de Notificação
                          </Button>
                        </Link>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </div>

          {/* User Reports */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-xl font-semibold mb-6">Meus Relatos</h3>
            
            {userReports.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">Você ainda não criou nenhum relato</p>
                <Link to="/criar-relato">
                  <Button>Criar meu primeiro relato</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userReports.map((report) => (
                  <Card key={report.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-sm line-clamp-2">{report.title}</h4>
                        {report.is_public ? (
                          <Eye className="w-4 h-4 text-green-600 flex-shrink-0 ml-2" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                        )}
                      </div>
                      
                      {report.images.length > 0 && (
                        <img 
                          src={report.images[0]} 
                          alt={report.title}
                          className="w-full h-32 object-cover rounded mb-3"
                        />
                      )}
                      
                      <div className="space-y-2 text-sm text-gray-600">
                        {report.fish_species && (
                          <p><strong>Espécie:</strong> {report.fish_species}</p>
                        )}
                        {report.fish_weight && (
                          <p><strong>Peso:</strong> {report.fish_weight}kg</p>
                        )}
                        <p><strong>Data:</strong> {new Date(report.created_at).toLocaleDateString()}</p>
                      </div>
                      
                      <div className="flex justify-between items-center mt-4 pt-3 border-t">
                        <div className="flex gap-4 text-sm text-gray-500">
                          <span>❤️ {report.likes_count}</span>
                          <span>💬 {report.comments_count}</span>
                        </div>
                        
                        <div className="flex gap-2">
                          <Link to={`/relatos/${report.id}`}>
                            <Button variant="outline" size="sm">Ver</Button>
                          </Link>
                          <Link to={`/editar-relato/${report.id}`}>
                            <Button variant="outline" size="sm">Editar</Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePageIntegrated;
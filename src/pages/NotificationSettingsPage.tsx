
import { useState, useEffect } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { getNotificationSettings, updateNotificationSettings, NotificationSettings } from "@/services/userService";

const NotificationSettingsPage = () => {
  const [settings, setSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    newReports: true,
    newComments: true,
    commentReplies: true,
    likes: true,
    follows: true,
    systemUpdates: true,
    newsletter: false,
    fishingTips: true,
    locationSuggestions: true
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar configurações ao montar o componente
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const userSettings = await getNotificationSettings();
        setSettings(userSettings);
      } catch (error) {
        toast.error("Erro ao carregar configurações de notificação");
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleSettingChange = (setting: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await updateNotificationSettings(settings);
      toast.success("Configurações de notificação atualizadas com sucesso");
    } catch (error) {
      toast.error("Erro ao salvar configurações de notificação");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader title="Configurações de Notificações" description="Controle suas notificações" />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Tipos de Notificação</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Notificações por Email</Label>
                        <p className="text-sm text-gray-500">
                          Receba notificações importantes por email
                        </p>
                      </div>
                      <Switch
                        checked={settings.emailNotifications}
                        onCheckedChange={() => handleSettingChange('emailNotifications')}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Notificações Push</Label>
                        <p className="text-sm text-gray-500">
                          Receba notificações instantâneas no navegador
                        </p>
                      </div>
                      <Switch
                        checked={settings.pushNotifications}
                        onCheckedChange={() => handleSettingChange('pushNotifications')}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Atividades</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Novos Relatos</Label>
                        <p className="text-sm text-gray-500">
                          Notifique quando novos relatos forem publicados
                        </p>
                      </div>
                      <Switch
                        checked={settings.newReports}
                        onCheckedChange={() => handleSettingChange('newReports')}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Comentários</Label>
                        <p className="text-sm text-gray-500">
                          Notifique quando alguém comentar em seus posts
                        </p>
                      </div>
                  <Switch
                    checked={settings.newComments}
                    onCheckedChange={() => handleSettingChange('newComments')}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Curtidas</Label>
                        <p className="text-sm text-gray-500">
                          Notifique quando alguém curtir seus posts
                        </p>
                      </div>
                      <Switch
                        checked={settings.likes}
                        onCheckedChange={() => handleSettingChange('likes')}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Novos Seguidores</Label>
                        <p className="text-sm text-gray-500">
                          Notifique quando alguém começar a seguir você
                        </p>
                      </div>
                      <Switch
                        checked={settings.follows}
                        onCheckedChange={() => handleSettingChange('follows')}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Informações</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Resumo Semanal</Label>
                        <p className="text-sm text-gray-500">
                          Receba um resumo semanal das atividades
                        </p>
                      </div>
                      <Switch
                        checked={settings.newsletter}
                        onCheckedChange={() => handleSettingChange('newsletter')}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Lembretes de Pesca</Label>
                        <p className="text-sm text-gray-500">
                          Receba lembretes sobre condições ideais para pesca
                        </p>
                      </div>
                      <Switch
                        checked={settings.fishingTips}
                        onCheckedChange={() => handleSettingChange('fishingTips')}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Alertas do Tempo</Label>
                        <p className="text-sm text-gray-500">
                          Receba alertas sobre mudanças climáticas importantes
                        </p>
                      </div>
                      <Switch
                        checked={settings.locationSuggestions}
                        onCheckedChange={() => handleSettingChange('locationSuggestions')}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Atualizações do Sistema</Label>
                        <p className="text-sm text-gray-500">
                          Receba notificações sobre atualizações da plataforma
                        </p>
                      </div>
                      <Switch
                        checked={settings.systemUpdates}
                        onCheckedChange={() => handleSettingChange('systemUpdates')}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t">
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
                    "Salvar Configurações"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettingsPage;

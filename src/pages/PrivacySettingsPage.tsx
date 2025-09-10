
import { useState, useEffect } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { getPrivacySettings, updatePrivacySettings, PrivacySettings } from "@/services/userService";

const PrivacySettingsPage = () => {
  const [settings, setSettings] = useState<PrivacySettings>({
    profileVisibility: true,
    showEmail: false,
    allowMessages: true,
    shareLocation: false,
    showOnlineStatus: true,
    allowTagging: true
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar configurações ao montar o componente
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const userSettings = await getPrivacySettings();
        setSettings(userSettings);
      } catch (error) {
        toast.error("Erro ao carregar configurações de privacidade");
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
      await updatePrivacySettings(settings);
      toast.success("Configurações de privacidade atualizadas com sucesso");
    } catch (error) {
      toast.error("Erro ao salvar configurações de privacidade");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader title="Configurações de Privacidade" description="Configure sua privacidade na plataforma" />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6">
            {isLoading ? (
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Perfil Público</Label>
                    <p className="text-sm text-gray-500">
                      Permita que outros usuários vejam seu perfil
                    </p>
                  </div>
                  <Switch
                    checked={settings.profileVisibility}
                    onCheckedChange={() => handleSettingChange('profileVisibility')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Mostrar Email</Label>
                    <p className="text-sm text-gray-500">
                      Exiba seu email no seu perfil público
                    </p>
                  </div>
                  <Switch
                    checked={settings.showEmail}
                    onCheckedChange={() => handleSettingChange('showEmail')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Permitir Mensagens</Label>
                    <p className="text-sm text-gray-500">
                      Permita que outros usuários enviem mensagens privadas
                    </p>
                  </div>
                  <Switch
                    checked={settings.allowMessages}
                    onCheckedChange={() => handleSettingChange('allowMessages')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Compartilhar Localização</Label>
                    <p className="text-sm text-gray-500">
                      Compartilhe sua localização em relatos de pesca
                    </p>
                  </div>
                  <Switch
                    checked={settings.shareLocation}
                    onCheckedChange={() => handleSettingChange('shareLocation')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Status Online</Label>
                    <p className="text-sm text-gray-500">
                      Mostre quando você está online para outros usuários
                    </p>
                  </div>
                  <Switch
                    checked={settings.showOnlineStatus}
                    onCheckedChange={() => handleSettingChange('showOnlineStatus')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Permitir Marcações</Label>
                    <p className="text-sm text-gray-500">
                      Permita que outros usuários marquem você em posts
                    </p>
                  </div>
                  <Switch
                    checked={settings.allowTagging}
                    onCheckedChange={() => handleSettingChange('allowTagging')}
                  />
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacySettingsPage;

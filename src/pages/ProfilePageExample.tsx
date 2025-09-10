// Exemplo de uso das configurações integradas com banco de dados

import { useState, useEffect } from "react";
import { getUserProfile, getPrivacySettings, getNotificationSettings } from "@/services/userService";
import { toast } from "sonner";

const ProfilePageExample = () => {
  const [profile, setProfile] = useState(null);
  const [privacySettings, setPrivacySettings] = useState(null);
  const [notificationSettings, setNotificationSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Carregar dados do perfil
        const profileData = await getUserProfile();
        setProfile(profileData);

        // Carregar configurações de privacidade
        const privacy = await getPrivacySettings();
        setPrivacySettings(privacy);

        // Carregar configurações de notificação
        const notifications = await getNotificationSettings();
        setNotificationSettings(notifications);

      } catch (error) {
        toast.error("Erro ao carregar dados do usuário");
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="p-6">
      <h1>Dados do Usuário Integrados</h1>
      
      {/* Perfil */}
      <div className="mb-6">
        <h2>Perfil</h2>
        <pre>{JSON.stringify(profile, null, 2)}</pre>
      </div>

      {/* Configurações de Privacidade */}
      <div className="mb-6">
        <h2>Configurações de Privacidade</h2>
        <pre>{JSON.stringify(privacySettings, null, 2)}</pre>
      </div>

      {/* Configurações de Notificação */}
      <div className="mb-6">
        <h2>Configurações de Notificação</h2>
        <pre>{JSON.stringify(notificationSettings, null, 2)}</pre>
      </div>
    </div>
  );
};

export default ProfilePageExample;
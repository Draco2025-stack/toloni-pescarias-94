import { useCallback } from 'react';
import { updateTrophyRanking } from '@/services/mockData';

export const useTrophyRanking = () => {
  const triggerRankingUpdate = useCallback(async () => {
    try {
      // Chamar a API para atualizar o ranking automaticamente
      const result = await updateTrophyRanking();
      return result;
    } catch (error) {
      console.error('Erro ao atualizar ranking de troféus:', error);
      return { success: false, message: 'Erro interno', updated_entries: 0 };
    }
  }, []);

  // Função para ser chamada quando um relato é criado, editado ou deletado
  const handleReportChange = useCallback(async (reportData: {
    fish_type?: string;
    fish_weight?: string;
    location?: string;
    images?: string[];
    is_public?: boolean;
  }) => {
    // Verificar se o relato atende aos critérios para o ranking
    const meetsCriteria = (
      reportData.fish_type && 
      reportData.fish_type.trim() !== '' &&
      reportData.location && 
      reportData.location.trim() !== '' &&
      reportData.images && 
      reportData.images.length > 0 &&
      reportData.is_public === true
    );

    if (meetsCriteria) {
      // Aguardar um pouco para garantir que o relato foi salvo no banco
      setTimeout(async () => {
        await triggerRankingUpdate();
      }, 1000);
    }
  }, [triggerRankingUpdate]);

  return {
    triggerRankingUpdate,
    handleReportChange
  };
};
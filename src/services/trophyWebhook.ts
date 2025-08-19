// Serviço para integração com webhook de troféus

interface ReportData {
  report_id: string;
  fish_species?: string;
  location?: string;
  images?: string[];
  is_public?: boolean;
  approved?: boolean;
}

// Função para notificar webhook quando um relato é criado
export async function notifyReportCreated(reportData: ReportData) {
  try {
    const response = await fetch('/api/trophy_webhook.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'report_created',
        ...reportData
      })
    });

    if (!response.ok) {
      throw new Error('Erro na requisição do webhook');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Erro ao notificar criação de relato:', error);
    return { success: false, message: 'Erro interno' };
  }
}

// Função para notificar webhook quando um relato é atualizado
export async function notifyReportUpdated(reportData: ReportData) {
  try {
    const response = await fetch('/api/trophy_webhook.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'report_updated',
        ...reportData
      })
    });

    if (!response.ok) {
      throw new Error('Erro na requisição do webhook');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Erro ao notificar atualização de relato:', error);
    return { success: false, message: 'Erro interno' };
  }
}

// Função para notificar webhook quando um relato é deletado
export async function notifyReportDeleted(reportId: string) {
  try {
    const response = await fetch('/api/trophy_webhook.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'report_deleted',
        report_id: reportId
      })
    });

    if (!response.ok) {
      throw new Error('Erro na requisição do webhook');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Erro ao notificar deleção de relato:', error);
    return { success: false, message: 'Erro interno' };
  }
}

// Hook para facilitar o uso do webhook
export function useTrophyWebhook() {
  return {
    notifyReportCreated,
    notifyReportUpdated,
    notifyReportDeleted
  };
}
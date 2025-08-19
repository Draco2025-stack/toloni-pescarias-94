
import PageHeader from "@/components/common/PageHeader";

const PrivacyPage = () => {
  return (
    <div>
      <PageHeader 
        title="Política de Privacidade"
        description="Como tratamos seus dados na plataforma Toloni Pescarias"
      />
      
      <div className="container mx-auto px-4 py-12">
        <div className="prose prose-lg max-w-4xl mx-auto">
          <h2>1. Introdução</h2>
          <p>
            A presente Política de Privacidade tem por finalidade demonstrar o compromisso do
            Toloni Pescarias com a privacidade e a proteção de dados pessoais coletados de seus usuários,
            estabelecendo regras sobre a coleta, registro, armazenamento, uso, compartilhamento
            e exclusão dos dados coletados.
          </p>
          
          <h2>2. Dados Coletados</h2>
          <p>
            Coletamos os seguintes tipos de informações:
          </p>
          <ul>
            <li><strong>Informações de cadastro:</strong> nome, e-mail, senha e foto de perfil (opcional)</li>
            <li><strong>Conteúdo gerado pelo usuário:</strong> relatos, comentários, fotos e vídeos publicados na plataforma</li>
            <li><strong>Dados de uso:</strong> informações sobre como você utiliza a plataforma, incluindo histórico de navegação, interações e preferências</li>
            <li><strong>Dados técnicos:</strong> endereço IP, tipo de navegador, dispositivo utilizado, tempo de acesso e páginas acessadas</li>
          </ul>
          
          <h2>3. Finalidade da Coleta</h2>
          <p>
            As informações coletadas são utilizadas para:
          </p>
          <ul>
            <li>Fornecer, personalizar e melhorar nossos serviços</li>
            <li>Processar transações e gerenciar contas de usuários</li>
            <li>Comunicar-se com você sobre atualizações, alertas e novidades</li>
            <li>Analisar tendências e estatísticas de uso da plataforma</li>
            <li>Prevenir atividades ilegais e aplicar nossos termos de uso</li>
            <li>Proteger direitos, propriedades ou segurança do Toloni Pescarias e de seus usuários</li>
          </ul>
          
          <h2>4. Compartilhamento de Dados</h2>
          <p>
            O Toloni Pescarias não vende, aluga ou comercializa dados pessoais de seus usuários. Podemos compartilhar informações nas seguintes circunstâncias:
          </p>
          <ul>
            <li>Com parceiros de serviço que nos auxiliam na operação da plataforma, sempre com contratos que garantam a proteção dos dados</li>
            <li>Quando necessário para cumprir obrigações legais ou ordens judiciais</li>
            <li>Para proteger direitos, propriedades ou segurança do Toloni Pescarias e seus usuários</li>
            <li>Em caso de fusão, aquisição ou venda de ativos, onde os dados dos usuários podem ser transferidos como parte do negócio</li>
          </ul>
          
          <h2>5. Armazenamento e Segurança</h2>
          <p>
            Implementamos medidas técnicas e organizacionais para proteger seus dados contra acesso não autorizado, alteração, divulgação ou destruição.
            Os dados pessoais são armazenados pelo tempo necessário para cumprir as finalidades para as quais foram coletados, exceto quando um período de 
            retenção mais longo for exigido por lei.
          </p>
          
          <h2>6. Direitos dos Usuários</h2>
          <p>
            Em conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD), você tem os seguintes direitos:
          </p>
          <ul>
            <li>Confirmação da existência de tratamento de seus dados</li>
            <li>Acesso aos dados</li>
            <li>Correção de dados incompletos, inexatos ou desatualizados</li>
            <li>Anonimização, bloqueio ou eliminação de dados desnecessários ou excessivos</li>
            <li>Portabilidade dos dados</li>
            <li>Informação sobre compartilhamento de seus dados</li>
            <li>Revogação do consentimento</li>
          </ul>
          
          <h2>7. Cookies e Tecnologias Semelhantes</h2>
          <p>
            Utilizamos cookies e tecnologias semelhantes para melhorar a experiência do usuário, analisar tendências e administrar o site.
            Você pode controlar o uso de cookies através das configurações do seu navegador.
          </p>
          
          <h2>8. Alterações na Política de Privacidade</h2>
          <p>
            Podemos atualizar esta Política de Privacidade periodicamente. Recomendamos que você revise esta página regularmente para estar ciente 
            de quaisquer alterações. Alterações significativas serão notificadas por meio da plataforma ou por e-mail.
          </p>
          
          <h2>9. Contato</h2>
          <p>
            Para questões relacionadas a esta Política de Privacidade ou ao tratamento de seus dados pessoais, entre em contato conosco através do e-mail 
            privacy@tolonipescarias.com ou pelo formulário disponível em nossa página de contato.
          </p>
          
          <p className="font-semibold mt-8">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;

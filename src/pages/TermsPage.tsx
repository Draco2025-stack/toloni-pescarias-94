
import PageHeader from "@/components/common/PageHeader";

const TermsPage = () => {
  return (
    <div>
      <PageHeader 
        title="Termos de Uso"
        description="Leia atentamente os termos e condições de uso da plataforma Toloni Pescarias"
      />
      
      <div className="container mx-auto px-4 py-12">
        <div className="prose prose-lg max-w-4xl mx-auto">
          <h2>1. Aceitação dos Termos</h2>
          <p>
            Ao acessar ou utilizar a plataforma Toloni Pescarias, você concorda em cumprir e estar sujeito a estes Termos de Uso.
            Se você não concordar com algum dos termos abaixo, solicitamos que não utilize nossos serviços.
          </p>
          
          <h2>2. Descrição do Serviço</h2>
          <p>
            O Toloni Pescarias é uma plataforma online que permite aos usuários compartilhar experiências de pesca,
            conectar-se com outros pescadores e acessar informações sobre diversas localidades de pesca no Brasil.
          </p>
          
          <h2>3. Cadastro e Conta de Usuário</h2>
          <p>
            Para utilizar todos os recursos da plataforma, é necessário criar uma conta com informações verdadeiras,
            completas e atualizadas. Você é responsável por manter a confidencialidade de sua senha e por todas
            as atividades realizadas com sua conta.
          </p>
          
          <h2>4. Conteúdo do Usuário</h2>
          <p>
            Ao publicar conteúdo na plataforma (incluindo relatos, comentários, fotos e vídeos), você concede ao
            Toloni Pescarias uma licença mundial, não exclusiva e isenta de royalties para usar, modificar, executar
            publicamente, exibir publicamente e distribuir tal conteúdo na plataforma.
          </p>
          <p>
            Você é o único responsável pelo conteúdo que publica e pelas consequências de compartilhá-lo.
            Não é permitido publicar conteúdo que:
          </p>
          <ul>
            <li>Viole leis ou regulamentos locais, estaduais, nacionais ou internacionais</li>
            <li>Infrinja direitos autorais, marcas registradas ou outros direitos de propriedade intelectual</li>
            <li>Contenha material difamatório, obsceno, ofensivo, ameaçador ou que incite à violência</li>
            <li>Promova atividades ilegais ou prejudiciais ao meio ambiente</li>
            <li>Contenha informações falsas ou enganosas</li>
          </ul>
          
          <h2>5. Moderação de Conteúdo</h2>
          <p>
            O Toloni Pescarias reserva-se o direito de revisar, monitorar e remover qualquer conteúdo
            que viole estes Termos ou que seja considerado inapropriado, sem aviso prévio.
          </p>
          
          <h2>6. Propriedade Intelectual</h2>
          <p>
            Todos os direitos de propriedade intelectual relacionados ao Toloni Pescarias, incluindo
            software, design, logotipos, textos, imagens e áudio, são de propriedade exclusiva
            do Toloni Pescarias ou de seus licenciadores.
          </p>
          
          <h2>7. Limitações de Responsabilidade</h2>
          <p>
            O Toloni Pescarias não se responsabiliza por:
          </p>
          <ul>
            <li>Precisão das informações fornecidas pelos usuários</li>
            <li>Condutas de qualquer usuário da plataforma</li>
            <li>Interrupções ou erros no funcionamento da plataforma</li>
            <li>Danos diretos, indiretos, incidentais ou consequentes resultantes do uso da plataforma</li>
          </ul>
          
          <h2>8. Modificações nos Termos</h2>
          <p>
            O Toloni Pescarias pode alterar estes Termos a qualquer momento, publicando os termos revisados
            na plataforma. O uso contínuo da plataforma após tais alterações constitui aceitação dos
            novos termos.
          </p>
          
          <h2>9. Encerramento de Conta</h2>
          <p>
            O Toloni Pescarias reserva-se o direito de suspender ou encerrar sua conta por violação destes
            Termos ou por qualquer outro motivo, a seu exclusivo critério.
          </p>
          
          <h2>10. Legislação Aplicável</h2>
          <p>
            Estes Termos são regidos e interpretados de acordo com as leis brasileiras. Qualquer
            disputa decorrente ou relacionada a estes Termos será submetida à jurisdição exclusiva
            dos tribunais brasileiros.
          </p>
          
          <p className="font-semibold mt-8">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;

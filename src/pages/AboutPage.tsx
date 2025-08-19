import { MapPin, Users, Fish } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import ExperienceCarousel from "@/components/common/ExperienceCarousel";

const AboutPage = () => {
  return (
    <div>
      <PageHeader 
        title="Sobre o Toloni Pescarias"
        description="Conheça nossa missão e o que nos inspira"
        image=""
      />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <section className="mb-16">
            <h2 className="text-3xl font-bold font-heading mb-6 text-fishing-blue">Nossa História</h2>
            <div className="bg-gradient-to-tr from-white to-fishing-sand/30 p-8 rounded-xl shadow-lg">
              <p className="text-lg mb-6">
                A Toloni Pescarias nasceu da paixão pela pesca esportiva e da vontade de conectar pescadores de todo o Brasil com o mesmo interesse e entusiasmo.
                Começou no início do ano 2000 por um grupo de amigos pescadores que compartilhavam aventuras de pesca nas férias e finais de semana.
                Nossa plataforma surgiu da necessidade de se ter um espaço dedicado para compartilhar experiências, dicas e histórias sobre os melhores e mais diversos locais de pesca esportiva, acessíveis a todos os amantes da pesca esportiva.
              </p>
              <p className="text-lg mb-6">
                O que começou como um pequeno blog, transformou-se em uma comunidade vibrante, onde os amigos pescadores foram trazendo os seus amigos, e estes foram trazendo seus novos amigos, e assim tanto os pescadores amadores quanto os profissionais, podem se encontrar para trocar conhecimentos, organizar pescarias e celebrar a arte da pesca esportiva.
              </p>
              <p className="text-lg">
                Atualmente contamos com vários membros ativos e algumas localidades mapeadas em território nacional e também na Argentina.
                Venha fazer parte conosco!
              </p>
            </div>
          </section>

          <section className="mb-16">
            <h2 className="text-3xl font-bold font-heading mb-6 text-fishing-green">Nossas Experiências</h2>
            <div className="bg-gradient-to-br from-fishing-blue/5 to-fishing-green/5 p-8 rounded-xl shadow-lg">
              <ExperienceCarousel />
              <div className="mt-8 text-center">
                <p className="text-lg text-gray-700 max-w-3xl mx-auto">
                  Nossa equipe e amigos pescadores, possui mais de 20 anos de experiência em pescarias pelo Brasil e Argentina.
                  Já estivemos desde os grandes rios da Amazônia, do Pantanal Mato-grossense, Araguaia, Teles Pires, etc., até os rios da Argentina como Corrientes e Paraná.
                  Sempre em busca das melhores aventuras de pesca. Conhecemos desde os melhores pontos, as espécies de peixes e temos as parcerias necessárias com as Pousadas, Barcos Hotéis e guias locais experientes em cada região que visitamos.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-16">
            <h2 className="text-3xl font-bold font-heading mb-6 text-fishing-green">Nossa Missão</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                <div className="bg-fishing-blue rounded-full w-16 h-16 flex items-center justify-center mb-4 mx-auto">
                  <Fish className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold font-heading mb-3 text-center">Promover a Pesca Sustentável</h3>
                <p className="text-gray-600 text-center">
                  Incentivamos práticas responsáveis de pesca e a preservação dos ecossistemas aquáticos para as futuras gerações.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                <div className="bg-fishing-green rounded-full w-16 h-16 flex items-center justify-center mb-4 mx-auto">
                  <MapPin className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold font-heading mb-3 text-center">Mapear Localidades</h3>
                <p className="text-gray-600 text-center">
                  Documentar e compartilhar informações sobre os melhores pontos de pesca do Brasil, valorizando cada região.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                <div className="bg-fishing-sand-dark rounded-full w-16 h-16 flex items-center justify-center mb-4 mx-auto">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold font-heading mb-3 text-center">Conectar Pessoas</h3>
                <p className="text-gray-600 text-center">
                  Criar uma comunidade vibrante onde pescadores podem se conhecer, trocar experiências e organizar expedições.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-16">
            <h2 className="text-3xl font-bold font-heading mb-6 text-fishing-blue-light">O Que Oferecemos</h2>
            <div className="bg-gradient-to-br from-fishing-blue/10 to-fishing-green/10 p-8 rounded-xl shadow-lg">
              <ul className="space-y-4">
                <li className="flex items-start">
                  <span className="bg-fishing-blue text-white rounded-full p-1 mr-3 mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                  <p className="text-lg"><strong>Plataforma de compartilhamento:</strong> Publique seus relatos de pesca com fotos e vídeos.</p>
                </li>
                <li className="flex items-start">
                  <span className="bg-fishing-blue text-white rounded-full p-1 mr-3 mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                  <p className="text-lg"><strong>Catálogo de localidades:</strong> Informações detalhadas sobre os melhores pontos de pesca no Brasil.</p>
                </li>
                <li className="flex items-start">
                  <span className="bg-fishing-blue text-white rounded-full p-1 mr-3 mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                  <p className="text-lg"><strong>Comunidade interativa:</strong> Comente, curta e interaja com outros pescadores.</p>
                </li>
                <li className="flex items-start">
                  <span className="bg-fishing-blue text-white rounded-full p-1 mr-3 mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                  <p className="text-lg"><strong>Organização de expedições:</strong> Encontre companheiros para suas próximas aventuras de pesca.</p>
                </li>
                <li className="flex items-start">
                  <span className="bg-fishing-blue text-white rounded-full p-1 mr-3 mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                  <p className="text-lg"><strong>Dicas e tutoriais:</strong> Conteúdo educativo sobre técnicas, equipamentos e conservação.</p>
                </li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;


import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import ReportCard from "@/components/common/ReportCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { getReportsByUser } from "@/services/reportService";
import { useAuth } from "@/contexts/AuthContext";

const MyReportsPage = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      if (!user) return;
      
      try {
        const data = await getReportsByUser(user.id);
        setReports(data);
      } catch (error) {
        console.error("Error fetching user reports:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, [user]);

  return (
    <div>
      <PageHeader 
        title="Meus Relatos"
        description="Gerencie todos os seus relatos de pescaria"
      />

      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-semibold">
            {reports.length} {reports.length === 1 ? "Relato" : "Relatos"}
          </h2>
          <Button asChild>
            <Link to="/create-report">
              <Plus className="mr-2 h-5 w-5" />
              Novo Relato
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          </div>
        ) : reports.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-4">Você ainda não possui relatos</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Compartilhe suas experiências de pesca e conecte-se com outros pescadores.
            </p>
            <Button asChild>
              <Link to="/create-report">
                <Plus className="mr-2 h-5 w-5" />
                Criar meu primeiro relato
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyReportsPage;

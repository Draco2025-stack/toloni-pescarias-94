
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, MapPin, Calendar, Fish } from "lucide-react";
import ReportCard from "@/components/common/ReportCard";
import { getReportsByUser, getUserById, formatDate } from "@/services/mockData";

const PublicProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const [user, setUser] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return;
      
      setIsLoading(true);
      try {
        const userData = await getUserById(userId);
        const userReports = await getReportsByUser(userId);
        
        setUser(userData);
        setReports(userReports);
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-gray-600">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Usuário não encontrado</h1>
          <Button asChild>
            <Link to="/reports">Voltar para relatos</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/reports">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Link>
        </Button>

        {/* Profile Header */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user.profileImage} alt={user.name} />
                <AvatarFallback className="text-2xl">{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">{user.name}</CardTitle>
                
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>Membro desde {formatDate(user.createdAt)}</span>
                  </div>
                  <div className="flex items-center">
                    <Fish className="h-4 w-4 mr-1" />
                    <span>{reports.length} relatos publicados</span>
                  </div>
                </div>

                {user.bio && (
                  <p className="text-gray-700">{user.bio}</p>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* User Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-fishing-blue">{reports.length}</div>
                <div className="text-sm text-gray-600">Relatos</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-fishing-green">
                  {reports.filter(r => r.featured).length}
                </div>
                <div className="text-sm text-gray-600">Destaques</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-fishing-orange">
                  {new Set(reports.map(r => r.locationId)).size}
                </div>
                <div className="text-sm text-gray-600">Locais visitados</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-8" />

        {/* User Reports */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Relatos de {user.name}</h2>
          
          {reports.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reports.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-lg shadow-sm">
              <Fish className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nenhum relato ainda</h3>
              <p className="text-gray-600">
                {user.name} ainda não publicou nenhum relato.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicProfilePage;

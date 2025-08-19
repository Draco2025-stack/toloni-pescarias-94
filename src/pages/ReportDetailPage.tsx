
import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import CommentForm from "@/components/common/CommentForm";
import CommentsList from "@/components/common/CommentsList";
import { MapPin, Calendar, MoreVertical, Edit, Trash2 } from "lucide-react";
import { getReport, formatDate } from "@/services/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const ReportDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [report, setReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshComments, setRefreshComments] = useState(0);

  useEffect(() => {
    const fetchReport = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const data = await getReport(id);
        if (data) {
          setReport(data);
        }
      } catch (error) {
        console.error("Error fetching report:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReport();
  }, [id]);

  const handleDelete = () => {
    // In a real app, this would be an API call
    setTimeout(() => {
      toast.success("Relato excluído com sucesso");
      navigate("/reports");
    }, 500);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const handleCommentAdded = () => {
    setRefreshComments(prev => prev + 1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Relato não encontrado</h1>
          <Button asChild>
            <Link to="/reports">Voltar para relatos</Link>
          </Button>
        </div>
      </div>
    );
  }

  const canEdit = user && (user.id === report.userId || user.isAdmin);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Report Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <h1 className="text-3xl font-heading font-bold mb-4">{report.title}</h1>
            
            {canEdit && (
              <AlertDialog>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link to={`/edit-report/${report.id}`} className="cursor-pointer">
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Editar</span>
                      </Link>
                    </DropdownMenuItem>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem className="text-red-500 cursor-pointer">
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Excluir</span>
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita. Isso excluirá permanentemente este relato e todos os comentários associados.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                      className="bg-red-500 hover:bg-red-600" 
                      onClick={handleDelete}
                    >
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
          
          <div className="flex items-center gap-4 mb-4">
            <Link to={`/user/${report.userId}`} className="hover:opacity-80 transition-opacity">
              <Avatar className="h-10 w-10">
                <AvatarImage src={report.userProfileImage} alt={report.userName} />
                <AvatarFallback>{getInitials(report.userName)}</AvatarFallback>
              </Avatar>
            </Link>
            <div>
              <Link 
                to={`/user/${report.userId}`} 
                className="font-medium hover:text-fishing-blue transition-colors"
              >
                {report.userName}
              </Link>
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="h-4 w-4 mr-1" />
                <span>{formatDate(report.createdAt)}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center text-sm">
            <MapPin className="h-5 w-5 mr-1 text-fishing-green" />
            <Link 
              to={`/location/${report.locationId}`}
              className="text-fishing-green hover:underline font-medium"
            >
              {report.locationName}
            </Link>
          </div>
        </div>

        {/* Images Carousel */}
        {report.images.length > 0 && (
          <div className="mb-8">
            <Carousel className="w-full max-w-4xl">
              <CarouselContent>
                {report.images.map((image: string, index: number) => (
                  <CarouselItem key={index}>
                    <div className="relative aspect-[16/9] overflow-hidden rounded-lg">
                      <img
                        src={image}
                        alt={`Imagem ${index + 1} do relato`}
                        className="object-cover w-full h-full"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const parent = e.currentTarget.parentElement;
                          if (parent) parent.style.display = 'none';
                        }}
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        )}

        {/* Report Content */}
        <div className="prose prose-lg max-w-none mb-8">
          <div className="whitespace-pre-line">{report.content}</div>
        </div>

        {/* Embedded Video */}
        {report.video && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Vídeo</h3>
            <div className="relative pb-[56.25%] h-0 overflow-hidden rounded-lg">
              <iframe
                src={report.video}
                title="Video do relato"
                className="absolute top-0 left-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        )}

        {/* Comments Section */}
        <div className="border-t pt-8 mt-8">
          <h3 className="text-xl font-semibold mb-6">Comentários</h3>
          
          {user ? (
            <div className="mb-8">
              <CommentForm reportId={report.id} onCommentAdded={handleCommentAdded} />
            </div>
          ) : (
            <div className="bg-gray-50 p-4 rounded-lg mb-8 text-center">
              <p className="text-gray-600 mb-2">Faça login para comentar</p>
              <Button asChild>
                <Link to="/login">Login</Link>
              </Button>
            </div>
          )}
          
          <CommentsList reportId={report.id} refreshTrigger={refreshComments} />
        </div>
      </div>
    </div>
  );
};

export default ReportDetailPage;

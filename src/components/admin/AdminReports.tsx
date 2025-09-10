
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
import { toast } from "sonner";
import { Eye, Star, Trash2 } from "lucide-react";
import { getAdminReports, updateReportStatus, AdminReport } from "@/services/adminService";
import { useTrophyWebhook } from "@/services/trophyWebhook";

const AdminReports = () => {
  const { notifyReportDeleted } = useTrophyWebhook();
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const data = await getAdminReports();
        setReports(data);
      } catch (error) {
        console.error("Error fetching reports:", error);
        toast.error("Erro ao carregar relatórios");
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, []);

  const handleDeleteReport = async (id: string) => {
    try {
      // Notify trophy webhook
      await notifyReportDeleted(id);
      
      setReports((prev) => prev.filter((report) => report.id !== id));
      toast.success("Relato excluído com sucesso!");
    } catch (error) {
      console.error("Error deleting report:", error);
      toast.error("Erro ao excluir relato");
    }
  };

  const handleToggleFeatured = async (id: string) => {
    const report = reports.find((r) => r.id === id);
    if (!report) return;

    try {
      const result = await updateReportStatus(id, report.approved, !report.featured);
      if (result.success) {
        setReports((prev) =>
          prev.map((r) =>
            r.id === id ? { ...r, featured: !r.featured } : r
          )
        );
        
        const action = report.featured ? "removido dos destaques" : "destacado";
        toast.success(`Relato ${action} com sucesso!`);
      } else {
        toast.error(result.message || "Erro ao atualizar relatório");
      }
    } catch (error) {
      console.error("Error toggling featured:", error);
      toast.error("Erro ao atualizar relatório");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Gerenciar Relatos</h2>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Autor</TableHead>
                <TableHead>Localidade</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Destacado</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">{report.title}</TableCell>
                  <TableCell>{report.user_name}</TableCell>
                  <TableCell>{report.location_name}</TableCell>
                  <TableCell>{formatDate(report.created_at)}</TableCell>
                  <TableCell>
                    <Switch
                      checked={report.featured}
                      onCheckedChange={() => handleToggleFeatured(report.id)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        asChild
                      >
                        <Link to={`/reports/${report.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="icon" className="text-red-500">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita. Isso excluirá permanentemente o relato "{report.title}" e todos os comentários associados.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              className="bg-red-500 hover:bg-red-600" 
                              onClick={() => handleDeleteReport(report.id)}
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default AdminReports;


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
import { Eye, Trash2 } from "lucide-react";
import { getAllReports, getCommentsByReport, Report, Comment, formatDate } from "@/services/mockData";

const AdminComments = () => {
  const [comments, setComments] = useState<(Comment & { reportTitle?: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        // Get all reports
        const reports = await getAllReports();
        
        // Get all comments for each report
        const allCommentsPromises = reports.map(async (report: Report) => {
          const reportComments = await getCommentsByReport(report.id);
          return reportComments.map(comment => ({
            ...comment,
            reportTitle: report.title
          }));
        });
        
        const allComments = (await Promise.all(allCommentsPromises)).flat();
        
        // Sort by date (newest first)
        const sortedComments = allComments.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        setComments(sortedComments);
      } catch (error) {
        console.error("Error fetching comments:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchComments();
  }, []);

  const handleDeleteComment = (id: string) => {
    setComments((prev) => prev.filter((comment) => comment.id !== id));
    toast.success("Comentário excluído com sucesso!");
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Gerenciar Comentários</h2>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        </div>
      ) : comments.length > 0 ? (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Autor</TableHead>
                <TableHead>Comentário</TableHead>
                <TableHead>Relato</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comments.map((comment) => (
                <TableRow key={comment.id}>
                  <TableCell className="font-medium">{comment.userName}</TableCell>
                  <TableCell className="max-w-xs">
                    <div className="truncate">{comment.content}</div>
                  </TableCell>
                  <TableCell>{comment.reportTitle}</TableCell>
                  <TableCell>{formatDate(comment.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        asChild
                      >
                        <Link to={`/reports/${comment.reportId}`}>
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
                              Esta ação não pode ser desfeita. Isso excluirá permanentemente este comentário.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              className="bg-red-500 hover:bg-red-600" 
                              onClick={() => handleDeleteComment(comment.id)}
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
      ) : (
        <div className="bg-slate-50 p-6 rounded-md text-center">
          <p className="text-gray-500">Não há comentários para moderar.</p>
        </div>
      )}
    </div>
  );
};

export default AdminComments;

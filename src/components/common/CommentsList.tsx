
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MoreVertical, Trash2 } from "lucide-react";
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
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { getCommentsByReport, deleteComment, Comment } from "@/services/commentService";
import { formatDate } from "@/services/mockData";

interface CommentsListProps {
  reportId: string;
  refreshTrigger?: number;
}

const CommentsList = ({ reportId, refreshTrigger = 0 }: CommentsListProps) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const data = await getCommentsByReport(reportId);
      setComments(data);
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast.error("Erro ao carregar comentários");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [reportId, refreshTrigger]);

  const handleDelete = async (commentId: string) => {
    try {
      const result = await deleteComment(commentId);
      
      if (!result.success) {
        throw new Error(result.message || 'Erro ao excluir comentário');
      }
      
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      toast.success("Comentário removido com sucesso");
      setDeletingCommentId(null);
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao remover comentário");
    }
  };

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
      <div className="flex justify-center py-8">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Ainda não há comentários neste relato. Seja o primeiro a comentar!
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {comments.map((comment) => (
        <div key={comment.id} className="flex space-x-4">
          <Link to={`/user/${comment.userId}`} className="hover:opacity-80 transition-opacity">
            <Avatar className="h-10 w-10">
              <AvatarImage src={comment.userProfileImage} alt={comment.userName} />
              <AvatarFallback>{getInitials(comment.userName)}</AvatarFallback>
            </Avatar>
          </Link>
          
          <div className="flex-1">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <Link 
                    to={`/user/${comment.userId}`} 
                    className="font-medium hover:text-fishing-blue transition-colors"
                  >
                    {comment.userName}
                  </Link>
                  <p className="text-xs text-gray-500">{formatDate(comment.createdAt)}</p>
                </div>
                
                {(user?.id === comment.userId || user?.isAdmin) && (
                  <AlertDialog>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem className="text-red-500">
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
                          Esta ação não pode ser desfeita. Isso excluirá permanentemente este comentário.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                          className="bg-red-500 hover:bg-red-600" 
                          onClick={() => handleDelete(comment.id)}
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
              
              <p className="mt-2 text-gray-800">{comment.content}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CommentsList;

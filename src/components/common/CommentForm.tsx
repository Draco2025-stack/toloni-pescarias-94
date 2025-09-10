
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { createComment } from "@/services/commentService";

interface CommentFormProps {
  reportId: string;
  onCommentAdded: () => void;
}

const CommentForm = ({ reportId, onCommentAdded }: CommentFormProps) => {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast.error("O comentário não pode estar vazio");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const result = await createComment({
        report_id: reportId,
        content: content.trim()
      });
      
      if (!result.success) {
        throw new Error(result.message || 'Erro ao criar comentário');
      }
      
      toast.success("Comentário adicionado com sucesso");
      setContent("");
      onCommentAdded();
    } catch (error) {
      console.error("Error creating comment:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao adicionar comentário");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Textarea
        placeholder="Deixe seu comentário sobre este relato..."
        className="min-h-24"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <Button 
        type="submit" 
        className="ripple-effect"
        disabled={isSubmitting || !content.trim()}
      >
        {isSubmitting ? "Enviando..." : "Enviar Comentário"}
      </Button>
    </form>
  );
};

export default CommentForm;

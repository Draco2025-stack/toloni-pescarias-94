
import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
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
import { Trash2 } from "lucide-react";
import { getAdminUsers, deleteUser, updateUserStatus, AdminUser } from "@/services/adminService";

const AdminUsers = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getAdminUsers();
        setUsers(data);
      } catch (error) {
        console.error("Error fetching users:", error);
        toast.error("Erro ao carregar usuários");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleDeleteUser = async (id: string) => {
    try {
      const result = await deleteUser(id);
      if (result.success) {
        setUsers((prev) => prev.filter((user) => user.id !== id));
        toast.success("Usuário excluído com sucesso!");
      } else {
        toast.error(result.message || "Erro ao excluir usuário");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Erro ao excluir usuário");
    }
  };

  const handleToggleAdmin = async (id: string) => {
    const user = users.find((u) => u.id === id);
    if (!user) return;

    // Convert pending status to active for the API call
    const currentStatus = user.status === 'pending' ? 'active' : user.status;

    try {
      const result = await updateUserStatus(id, currentStatus, !user.is_admin);
      if (result.success) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === id ? { ...u, is_admin: !u.is_admin } : u
          )
        );
        
        const action = user.is_admin ? "removido dos administradores" : "promovido a administrador";
        toast.success(`Usuário ${action} com sucesso!`);
      } else {
        toast.error(result.message || "Erro ao atualizar usuário");
      }
    } catch (error) {
      console.error("Error toggling admin:", error);
      toast.error("Erro ao atualizar usuário");
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Gerenciar Usuários</h2>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        </div>
      ) : users.length > 0 ? (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Avatar</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Registro</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="" alt={user.name} />
                      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{formatDate(user.created_at)}</TableCell>
                  <TableCell>
                    <Switch
                      checked={user.is_admin}
                      onCheckedChange={() => handleToggleAdmin(user.id)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
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
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente a conta do usuário "{user.name}" e todos os seus relatos e comentários.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                            className="bg-red-500 hover:bg-red-600" 
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="bg-slate-50 p-6 rounded-md text-center">
          <p className="text-gray-500">Não há usuários cadastrados.</p>
        </div>
      )}

      <div className="mt-8 bg-slate-50 p-6 rounded-md text-center">
        <p className="text-gray-500">
          Sistema administrativo do Toloni Pescarias. Apenas Otto possui privilégios administrativos completos.
        </p>
        <p className="text-xs text-gray-400 mt-2">
          Em produção, conecte ao backend para gerenciamento completo de usuários.
        </p>
      </div>
    </div>
  );
};

export default AdminUsers;

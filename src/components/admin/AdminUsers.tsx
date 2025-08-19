
import { useState } from "react";
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

// Sistema limpo - dados virão do banco de dados
const mockUsers = [
  {
    id: "1",
    name: "Otto Toloni",
    email: "otto@tolonipescarias.com",
    profileImage: "",
    isAdmin: true,
    registeredAt: "2024-01-01T10:00:00Z",
  }
];

const AdminUsers = () => {
  const [users, setUsers] = useState(mockUsers);

  const handleDeleteUser = (id: string) => {
    setUsers((prev) => prev.filter((user) => user.id !== id));
    toast.success("Usuário excluído com sucesso!");
  };

  const handleToggleAdmin = (id: string) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === id ? { ...user, isAdmin: !user.isAdmin } : user
      )
    );
    
    const user = users.find((u) => u.id === id);
    const action = user?.isAdmin ? "removido dos administradores" : "promovido a administrador";
    toast.success(`Usuário ${action} com sucesso!`);
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
                    <AvatarImage src={user.profileImage} alt={user.name} />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{formatDate(user.registeredAt)}</TableCell>
                <TableCell>
                  <Switch
                    checked={user.isAdmin}
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


import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { MapPin, Fish, MessageSquare, LayoutDashboard, Users, Calendar, Image, Trophy, Bell, ImageIcon } from "lucide-react";
import AdminDashboard from "../components/admin/AdminDashboard";
import AdminLocations from "../components/admin/AdminLocations";
import AdminReports from "../components/admin/AdminReports";
import AdminComments from "../components/admin/AdminComments";
import AdminUsers from "../components/admin/AdminUsers";
import AdminSchedules from "../components/admin/AdminSchedules";
import AdminCarousels from "../components/admin/AdminCarousels";
import AdminTrophyRanking from "../components/admin/AdminTrophyRanking";
import AdminFishingReminder from "../components/admin/AdminFishingReminder";

const AdminDashboardPage = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const location = useLocation();

  // Determinar qual componente renderizar baseado na URL
  useEffect(() => {
    const path = location.pathname;
    if (path === "/admin" || path === "/admin/") {
      setActiveTab("dashboard");
    } else if (path.includes("/locations")) {
      setActiveTab("locations");
    } else if (path.includes("/reports")) {
      setActiveTab("reports");
    } else if (path.includes("/comments")) {
      setActiveTab("comments");
    } else if (path.includes("/users")) {
      setActiveTab("users");
    } else if (path.includes("/schedules")) {
      setActiveTab("schedules");
    } else if (path.includes("/carousels")) {
      setActiveTab("carousels");
    } else if (path.includes("/trophies")) {
      setActiveTab("trophies");
    } else if (path.includes("/reminders")) {
      setActiveTab("reminders");
    }
  }, [location.pathname]);

  const renderContent = () => {
    switch (activeTab) {
      case "locations": return <AdminLocations />;
      case "reports": return <AdminReports />;
      case "comments": return <AdminComments />;
      case "users": return <AdminUsers />;
      case "schedules": return <AdminSchedules />;
      case "carousels": return <AdminCarousels />;
      case "trophies": return <AdminTrophyRanking />;
      case "reminders": return <AdminFishingReminder />;
      default: return <AdminDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl md:text-3xl font-bold font-heading">Painel Administrativo - Toloni Pescarias</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          {/* Mobile tabs */}
          <div className="md:hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-9 w-full">
                <TabsTrigger value="dashboard">
                  <LayoutDashboard className="h-5 w-5" />
                </TabsTrigger>
                <TabsTrigger value="locations">
                  <MapPin className="h-5 w-5" />
                </TabsTrigger>
                <TabsTrigger value="reports">
                  <Fish className="h-5 w-5" />
                </TabsTrigger>
                <TabsTrigger value="comments">
                  <MessageSquare className="h-5 w-5" />
                </TabsTrigger>
                <TabsTrigger value="users">
                  <Users className="h-5 w-5" />
                </TabsTrigger>
                <TabsTrigger value="schedules">
                  <Calendar className="h-5 w-5" />
                </TabsTrigger>
                <TabsTrigger value="carousels">
                  <Image className="h-5 w-5" />
                </TabsTrigger>
                <TabsTrigger value="trophies">
                  <Trophy className="h-5 w-5" />
                </TabsTrigger>
                <TabsTrigger value="reminders">
                  <Bell className="h-5 w-5" />
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="dashboard">
                <AdminDashboard />
              </TabsContent>
              <TabsContent value="locations">
                <AdminLocations />
              </TabsContent>
              <TabsContent value="reports">
                <AdminReports />
              </TabsContent>
              <TabsContent value="comments">
                <AdminComments />
              </TabsContent>
              <TabsContent value="users">
                <AdminUsers />
              </TabsContent>
              <TabsContent value="schedules">
                <AdminSchedules />
              </TabsContent>
              <TabsContent value="carousels">
                <AdminCarousels />
              </TabsContent>
              <TabsContent value="trophies">
                <AdminTrophyRanking />
              </TabsContent>
              <TabsContent value="reminders">
                <AdminFishingReminder />
              </TabsContent>
            </Tabs>
          </div>

          {/* Desktop layout */}
          <div className="hidden md:grid md:grid-cols-[240px_1fr]">
            <div className="border-r p-4">
              <div className="space-y-1">
                <AdminNavLink 
                  to="/admin" 
                  icon={<LayoutDashboard className="h-5 w-5" />}
                  isActive={location.pathname === "/admin"}
                >
                  Dashboard
                </AdminNavLink>
                <AdminNavLink 
                  to="/admin/locations" 
                  icon={<MapPin className="h-5 w-5" />}
                  isActive={location.pathname === "/admin/locations"}
                >
                  Localidades
                </AdminNavLink>
                <AdminNavLink 
                  to="/admin/reports" 
                  icon={<Fish className="h-5 w-5" />}
                  isActive={location.pathname === "/admin/reports"}
                >
                  Relatos
                </AdminNavLink>
                <AdminNavLink 
                  to="/admin/comments" 
                  icon={<MessageSquare className="h-5 w-5" />}
                  isActive={location.pathname === "/admin/comments"}
                >
                  Comentários
                </AdminNavLink>
                <AdminNavLink 
                  to="/admin/users" 
                  icon={<Users className="h-5 w-5" />}
                  isActive={location.pathname === "/admin/users"}
                >
                  Usuários
                </AdminNavLink>
                <AdminNavLink 
                  to="/admin/schedules" 
                  icon={<Calendar className="h-5 w-5" />}
                  isActive={location.pathname === "/admin/schedules"}
                >
                  Cronograma
                </AdminNavLink>
                <AdminNavLink 
                  to="/admin/carousels" 
                  icon={<Image className="h-5 w-5" />}
                  isActive={location.pathname === "/admin/carousels"}
                >
                  Carrossel
                </AdminNavLink>
                <AdminNavLink 
                  to="/admin/trophies" 
                  icon={<Trophy className="h-5 w-5" />}
                  isActive={location.pathname === "/admin/trophies"}
                >
                  Sistema de Troféus
                </AdminNavLink>
                <AdminNavLink 
                  to="/admin/reminders" 
                  icon={<Bell className="h-5 w-5" />}
                  isActive={location.pathname === "/admin/reminders"}
                >
                  Pop-up Lembretes
                </AdminNavLink>
              </div>
            </div>
            
            <div className="p-6">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Admin navigation link component
interface AdminNavLinkProps {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isActive: boolean;
}

const AdminNavLink = ({ to, icon, children, isActive }: AdminNavLinkProps) => {
  return (
    <Button 
      variant="ghost"
      className={cn(
        "w-full justify-start", 
        isActive ? 
          "bg-slate-100 text-slate-900 hover:bg-slate-100 hover:text-slate-900" : 
          "text-slate-600 hover:text-slate-900"
      )}
      asChild
    >
      <Link to={to}>
        {icon}
        <span className="ml-2">{children}</span>
      </Link>
    </Button>
  );
};

export default AdminDashboardPage;

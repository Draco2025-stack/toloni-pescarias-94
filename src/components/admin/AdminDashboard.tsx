import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Fish, MapPin, MessageSquare, Users, TrendingUp, TrendingDown, Calendar, Star, AlertCircle } from "lucide-react";
import { getAllReports, getLocations, getCommentsByReport, users } from "@/services/mockData";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    users: 0,
    reports: 0,
    comments: 0,
    locations: 0,
    topLocations: [],
  });
  const [reportsData, setReportsData] = useState([]);
  const [locationsData, setLocationsData] = useState([]);
  const [monthlyReportsData, setMonthlyReportsData] = useState([]);
  const [locationPopularityData, setLocationPopularityData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const chartConfig = {
    reports: {
      label: "Relatos",
      color: "hsl(var(--chart-1))",
    },
    comments: {
      label: "Comentários",
      color: "hsl(var(--chart-2))",
    },
    active: {
      label: "Usuários Ativos",
      color: "hsl(var(--chart-3))",
    },
    growth: {
      label: "Crescimento (%)",
      color: "hsl(var(--chart-4))",
    },
  };

  const calculateRealMonthlyData = (reports, comments) => {
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const currentDate = new Date();
    const monthlyData = [];

    // Group reports and comments by month
    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 1);
      const monthName = monthNames[targetDate.getMonth()];
      
      const monthReports = reports.filter(report => {
        const reportDate = new Date(report.createdAt);
        return reportDate >= targetDate && reportDate < nextMonth;
      });

      const monthComments = comments.filter(comment => {
        const commentDate = new Date(comment.createdAt);
        return commentDate >= targetDate && commentDate < nextMonth;
      });
      
      monthlyData.push({
        month: monthName,
        reports: monthReports.length,
        comments: monthComments.length,
      });
    }

    return monthlyData;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reports, locations] = await Promise.all([
          getAllReports(),
          getLocations(),
        ]);
        
        let allComments = [];
        for (const report of reports) {
          const reportComments = await getCommentsByReport(report.id);
          allComments = [...allComments, ...reportComments];
        }

        // Calculate real monthly data based on actual reports and comments
        const monthlyData = calculateRealMonthlyData(reports, allComments);
        setMonthlyReportsData(monthlyData);

        // Calculate top locations by report count
        const locationReportCount = {};
        reports.forEach(report => {
          const locationName = locations.find(loc => loc.id === report.locationId)?.name || 'Desconhecida';
          locationReportCount[locationName] = (locationReportCount[locationName] || 0) + 1;
        });

        const topLocations = Object.entries(locationReportCount)
          .sort(([,a], [,b]) => Number(b) - Number(a))
          .slice(0, 5)
          .map(([name, count]) => ({ name, count: Number(count) }));

        // Create location popularity data for pie chart
        const totalReports = reports.length;
        const locationPopularity = topLocations.map((location, index) => ({
          name: location.name,
          value: location.count,
          percentage: totalReports > 0 ? ((location.count / totalReports) * 100).toFixed(1) : 0,
          color: `hsl(${200 + (index * 40)}, 70%, 50%)`
        }));

        setLocationPopularityData(locationPopularity);
        
        setStats({
          users: users.length,
          reports: reports.length,
          comments: allComments.length,
          locations: locations.length,
          topLocations,
        });
        
        setReportsData(reports);
        setLocationsData(locations);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          Última atualização: {new Date().toLocaleString('pt-BR')}
        </div>
      </div>
      
      {/* KPIs Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users}</div>
            <p className="text-xs text-muted-foreground">
              {stats.users === 0 ? "Nenhum usuário cadastrado" : "Usuários registrados na plataforma"}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Localidades</CardTitle>
            <MapPin className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.locations}</div>
            <p className="text-xs text-muted-foreground">
              {stats.locations === 0 ? "Nenhuma localidade cadastrada" : "Localidades disponíveis"}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Relatos Publicados</CardTitle>
            <Fish className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.reports}</div>
            <p className="text-xs text-muted-foreground">
              {stats.reports === 0 ? "Ainda não há relatos publicados" : `Total de relatos na plataforma`}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comentários</CardTitle>
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.comments}</div>
            <p className="text-xs text-muted-foreground">
              {stats.comments === 0 ? "Nenhum comentário registrado" : 
               stats.reports > 0 ? `${(stats.comments / stats.reports).toFixed(1)} por relato` : "Total de comentários"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Atividade dos Últimos 6 Meses
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyReportsData.some(month => month.reports > 0 || month.comments > 0) ? (
              <ChartContainer config={chartConfig} className="h-[300px]">
                <LineChart data={monthlyReportsData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12 }}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    cursor={{ stroke: '#94a3b8', strokeWidth: 1 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="reports" 
                    stroke="var(--color-reports)" 
                    strokeWidth={3}
                    dot={{ fill: "var(--color-reports)", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: "var(--color-reports)", strokeWidth: 2 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="comments" 
                    stroke="var(--color-comments)" 
                    strokeWidth={3}
                    dot={{ fill: "var(--color-comments)", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: "var(--color-comments)", strokeWidth: 2 }}
                  />
                </LineChart>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center">
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Sem dados suficientes para gerar gráfico</p>
                    <p className="text-sm text-muted-foreground mt-1">Os dados aparecerão conforme os usuários interagirem com a plataforma</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Localidades Mais Populares
            </CardTitle>
          </CardHeader>
          <CardContent>
            {locationPopularityData.length > 0 && stats.reports > 0 ? (
              <ChartContainer config={chartConfig} className="h-[300px]">
                <PieChart>
                  <Pie
                    data={locationPopularityData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percentage }) => `${name} ${percentage}%`}
                  >
                    {locationPopularityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center">
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Sem dados suficientes para gerar gráfico</p>
                    <p className="text-sm text-muted-foreground mt-1">Aguardando relatos serem publicados</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Estatísticas da Plataforma
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {stats.reports > 0 ? (
            <>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Taxa de Engajamento</span>
                <Badge variant="secondary">
                  {((stats.comments / stats.reports) * 100).toFixed(1)}%
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Comentários por Relato</span>
                <Badge variant="outline">
                  {(stats.comments / stats.reports).toFixed(1)}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Localidades Ativas</span>
                <Badge>
                  {stats.topLocations.length}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Relatos por Usuário</span>
                <Badge variant="secondary">
                  {stats.users > 0 ? (stats.reports / stats.users).toFixed(1) : "0"}
                </Badge>
              </div>
            </>
          ) : (
            <div className="text-center py-8 space-y-2">
              <div className="w-12 h-12 mx-auto bg-muted rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Ainda não há relatos publicados</p>
                <p className="text-sm text-muted-foreground">As estatísticas aparecerão quando houver atividade na plataforma</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity Table */}
      <Card>
        <CardHeader>
          <CardTitle>Atividades Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Localidade</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="text-center text-muted-foreground" colSpan={5}>
                  <div className="py-8 space-y-2">
                    <div className="w-12 h-12 mx-auto bg-blue-500/20 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-blue-700">Nenhuma atividade registrada</h4>
                      <p className="text-sm text-muted-foreground">As atividades dos usuários aparecerão aqui conforme o uso da plataforma</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Top Performing Locations */}
      <Card>
        <CardHeader>
          <CardTitle>Localidades com Melhor Performance</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.topLocations.length > 0 ? (
            <div className="space-y-4">
              {stats.topLocations.map((location, index) => (
                <div key={location.name} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{location.name}</p>
                      <p className="text-sm text-muted-foreground">{location.count} {location.count === 1 ? 'relato' : 'relatos'}</p>
                    </div>
                  </div>
                  <Badge variant={index === 0 ? "default" : "secondary"}>
                    {index === 0 && <Star className="h-3 w-3 mr-1" />}
                    Top {index + 1}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 space-y-2">
              <div className="w-12 h-12 mx-auto bg-muted rounded-full flex items-center justify-center">
                <MapPin className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Nenhuma localidade com relatos</p>
                <p className="text-sm text-muted-foreground">Os rankings aparecerão quando houver relatos publicados</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;

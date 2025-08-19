
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import ReportCard from "@/components/common/ReportCard";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Filter, Plus } from "lucide-react";
import { getAllReports, getLocations, Report, Location } from "@/services/mockData";
import { useAuth } from "@/contexts/AuthContext";

const ReportsPage = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reportsData, locationsData] = await Promise.all([
          getAllReports(),
          getLocations()
        ]);
        
        setReports(reportsData);
        setFilteredReports(reportsData);
        setLocations(locationsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    let filtered = [...reports];
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(report =>
        report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.locationName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply location filter
    if (locationFilter && locationFilter !== "all") {
      filtered = filtered.filter(report => report.locationId === locationFilter);
    }
    
    setFilteredReports(filtered);
  }, [searchQuery, locationFilter, reports]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setLocationFilter("all");
  };

  return (
    <div>
      <PageHeader 
        title="Relatos de Pescaria"
        description="Compartilhe suas experiências e descubra histórias incríveis de outros pescadores"
        image=""
      />

      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row justify-between gap-4 mb-8">
          {/* Create Report Button */}
          {user && (
            <Button asChild className="order-3 lg:order-1">
              <Link to="/create-report">
                <Plus className="mr-2 h-5 w-5" />
                Novo Relato
              </Link>
            </Button>
          )}
          
          {/* Search Bar */}
          <div className="relative flex-grow order-1 lg:order-2">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar relatos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Filters */}
          <div className="flex gap-2 order-2 lg:order-3">
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-[200px]">
                <div className="flex items-center">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Localidade" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {(searchQuery || locationFilter !== "all") && (
              <Button variant="outline" onClick={handleClearFilters}>
                Limpar
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          </div>
        ) : filteredReports.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReports.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg text-gray-500 mb-4">Nenhum relato encontrado</p>
            <Button onClick={handleClearFilters} variant="outline">
              Limpar filtros
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;

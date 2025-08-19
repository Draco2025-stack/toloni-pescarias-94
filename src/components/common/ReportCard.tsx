
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar } from "lucide-react";
import { Report, formatDate } from "@/services/mockData";

interface ReportCardProps {
  report: Report;
  showLocationLink?: boolean;
}

const ReportCard = ({ report, showLocationLink = true }: ReportCardProps) => {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Card className="overflow-hidden h-full flex flex-col hover:shadow-md transition-shadow">
      {report.images && report.images.length > 0 && report.images[0] ? (
        <div className="relative h-48 w-full overflow-hidden">
          <img
            src={report.images[0]}
            alt={report.title}
            className="object-cover w-full h-full transition-transform duration-500 hover:scale-105"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent) parent.style.display = 'none';
            }}
          />
          {report.featured && (
            <div className="absolute top-3 right-3 bg-fishing-blue text-white text-xs font-bold px-2 py-1 rounded">
              DESTAQUE
            </div>
          )}
        </div>
      ) : (
        <div className="relative h-12 w-full overflow-hidden flex items-center justify-center bg-gradient-to-r from-fishing-blue/10 to-fishing-green/10">
          {report.featured && (
            <div className="absolute top-3 right-3 bg-fishing-blue text-white text-xs font-bold px-2 py-1 rounded">
              DESTAQUE
            </div>
          )}
        </div>
      )}
      <CardContent className="pt-6 flex-grow">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-semibold line-clamp-2 flex-1">{report.title}</h3>
          <Link to={`/user/${report.userId}`} className="flex items-center ml-3 hover:opacity-80 transition-opacity">
            <Avatar className="h-8 w-8">
              <AvatarImage src={report.userProfileImage} alt={report.userName} />
              <AvatarFallback>{getInitials(report.userName)}</AvatarFallback>
            </Avatar>
          </Link>
        </div>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="h-4 w-4 mr-1" />
            <span>{formatDate(report.createdAt)}</span>
          </div>
          
          {showLocationLink && (
            <div className="flex items-center text-sm">
              <MapPin className="h-4 w-4 mr-1 text-fishing-green" />
              <Link 
                to={`/location/${report.locationId}`}
                className="text-fishing-green hover:underline"
              >
                {report.locationName}
              </Link>
            </div>
          )}
        </div>
        
        <p className="text-sm text-gray-600 line-clamp-2">{report.content}</p>
      </CardContent>
      <CardFooter className="pt-2 pb-4">
        <Button className="w-full" asChild>
          <Link to={`/reports/${report.id}`}>Ver relato completo</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ReportCard;

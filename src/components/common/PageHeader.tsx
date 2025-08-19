
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  className?: string;
  image?: string;
}

const PageHeader = ({ title, description, className, image }: PageHeaderProps) => {
  return (
    <div className={cn(
      "relative py-12 px-4 bg-fishing-blue text-white overflow-hidden", 
      image ? "bg-cover bg-center" : "",
      className
    )}
    style={image ? { backgroundImage: `linear-gradient(rgba(10, 93, 135, 0.85), rgba(10, 93, 135, 0.85)), url(${image})` } : {}}
    >
      <div className="container mx-auto relative z-10">
        <h1 className="text-3xl md:text-4xl font-bold font-heading mb-2">{title}</h1>
        {description && <p className="text-lg text-gray-100 max-w-2xl">{description}</p>}
        <div className="mt-2">
          <span className="text-sm text-gray-200">Toloni Pescarias</span>
        </div>
      </div>
      
      {/* Decorative wave effect */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none" className="fill-white h-8 w-full">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V0C50.55,0,112.11,17.6,165.47,40.22,205.12,55.51,246.41,69.4,321.39,56.44Z"></path>
        </svg>
      </div>
    </div>
  );
};

export default PageHeader;

import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";

const toloniLogoNew = "/lovable-uploads/96b3cddb-56eb-47fb-a37f-04042565a649.png";

const SearchBar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  const {
    searchQuery,
    searchResults,
    isSearching,
    handleSearch,
    navigateToResult,
    clearSearch,
    setSearchQuery
  } = useGlobalSearch();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        clearSearch();
      }
    };

    window.addEventListener("scroll", handleScroll);
    document.addEventListener("mousedown", handleClickOutside);
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [clearSearch]);

  const executeSearch = () => {
    if (searchQuery.trim()) {
      handleSearch(searchQuery);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      executeSearch();
    } else if (e.key === "Escape") {
      clearSearch();
    }
  };

  const hasResults = Object.keys(searchResults).length > 0;

  return (
    <div 
      ref={searchRef}
      className={`sticky top-[80px] z-30 bg-white border-b shadow-sm transition-all duration-300 ease-in-out ${
        isScrolled ? "h-[50px]" : "h-[120px]"
      }`}
    >
      <div className="container mx-auto px-4 h-full flex items-center justify-between relative">
        {/* Logo and Site Name */}
        <div className={`flex items-center transition-all duration-300 ease-in-out ${
          isScrolled ? "scale-75" : "scale-100"
        }`}>
          <img 
            src={toloniLogoNew} 
            alt="Toloni Pescarias" 
            className={`object-contain transition-all duration-300 ease-in-out ${
              isScrolled ? "h-8 w-8" : "h-12 w-12"
            }`} 
          />
          <div className="ml-3 hidden sm:block">
            <h2 className={`font-heading font-bold text-fishing-blue transition-all duration-300 ease-in-out ${
              isScrolled ? "text-lg" : "text-2xl"
            }`}>
              Toloni Pescarias
            </h2>
            {!isScrolled && (
              <p className="text-sm text-gray-600 animate-fade-in">
                Sua comunidade de pesca
              </p>
            )}
          </div>
        </div>

        {/* Desktop Search */}
        <div className="hidden md:flex items-center flex-1 max-w-md ml-8">
          <div className="relative w-full">
            <Input
              type="text"
              placeholder="Digite sua busca aqui..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className={`pr-20 transition-all duration-300 ease-in-out ${
                isScrolled ? "h-8 text-sm" : "h-10"
              }`}
            />
            {searchQuery && (
              <Button
                size="sm"
                variant="ghost"
                onClick={clearSearch}
                className={`absolute right-10 top-1/2 transform -translate-y-1/2 hover:bg-gray-100 transition-all duration-300 ease-in-out ${
                  isScrolled ? "h-6 w-6 p-1" : "h-8 w-8 p-1.5"
                }`}
              >
                <X className={`text-gray-400 hover:text-gray-600 transition-all duration-300 ease-in-out ${
                  isScrolled ? "h-3 w-3" : "h-4 w-4"
                }`} />
              </Button>
            )}
            <Button
              size="sm"
              onClick={executeSearch}
              className={`absolute right-1 top-1/2 transform -translate-y-1/2 bg-fishing-blue hover:bg-fishing-blue/90 transition-all duration-300 ease-in-out ${
                isScrolled ? "h-6 w-6 p-1" : "h-8 w-8 p-1.5"
              }`}
            >
              <Search className={`text-white transition-all duration-300 ease-in-out ${
                isScrolled ? "h-3 w-3" : "h-4 w-4"
              }`} />
            </Button>
          </div>
        </div>

        {/* Mobile Search Removed */}
        <div className="md:hidden">
        </div>
      </div>
      
      {/* Search Results Dropdown */}
      {(isSearching && searchQuery && hasResults) && (
        <Card className="absolute top-full left-0 right-0 mx-4 mt-1 max-h-96 overflow-y-auto bg-white shadow-lg border z-50 animate-fade-in">
          <div className="p-4">
            {Object.entries(searchResults).map(([category, results]) => (
              <div key={category} className="mb-4 last:mb-0">
                <h3 className="text-sm font-semibold text-fishing-blue mb-2 px-2">
                  {category}
                </h3>
                <div className="space-y-1">
                  {results.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => navigateToResult(result)}
                      className="w-full text-left p-2 rounded-md hover:bg-gray-50 transition-colors duration-200 group"
                    >
                      <div className="font-medium text-gray-900 group-hover:text-fishing-blue transition-colors">
                        {result.title}
                      </div>
                      <div className="text-sm text-gray-600 truncate">
                        {result.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
      
      {/* No Results Message */}
      {(isSearching && searchQuery && !hasResults) && (
        <Card className="absolute top-full left-0 right-0 mx-4 mt-1 bg-white shadow-lg border z-50 animate-fade-in">
          <div className="p-4 text-center text-gray-500">
            <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p>Nenhum resultado encontrado para "{searchQuery}"</p>
            <p className="text-sm mt-1">Tente usar termos diferentes</p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default SearchBar;
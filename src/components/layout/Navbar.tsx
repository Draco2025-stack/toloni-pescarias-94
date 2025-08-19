
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, X, User, Fish, MapPin, Home, LogOut, Calendar, Trophy, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";
import { Card } from "@/components/ui/card";
const toloniLogoNew = "/lovable-uploads/96b3cddb-56eb-47fb-a37f-04042565a649.png";

const Navbar = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  
  const {
    searchQuery,
    searchResults,
    isSearching,
    handleSearch,
    navigateToResult,
    clearSearch,
    setSearchQuery
  } = useGlobalSearch();
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

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
      setMobileSearchOpen(false);
    }
  };

  const hasResults = Object.keys(searchResults).length > 0;

  return (
    <header className="border-b bg-white shadow-sm sticky top-0 z-40">
      <div className="container mx-auto px-4 flex items-center justify-between h-20">
        <Link to="/" className="flex items-center">
          <img src={toloniLogoNew} alt="Toloni Pescarias" className="h-14 w-14 object-contain" />
        </Link>

        {/* Desktop Search */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-8 relative">
          <Input
            type="text"
            placeholder="Digite sua busca aqui..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pr-12"
          />
          {searchQuery && (
            <Button
              size="sm"
              variant="ghost"
              onClick={clearSearch}
              className="absolute right-10 top-1/2 transform -translate-y-1/2 hover:bg-gray-100 h-6 w-6 p-1"
            >
              <X className="h-3 w-3 text-gray-400 hover:text-gray-600" />
            </Button>
          )}
          <Button
            size="sm"
            onClick={executeSearch}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-fishing-blue hover:bg-fishing-blue/90 h-8 w-8 p-1.5"
          >
            <Search className="h-4 w-4 text-white" />
          </Button>
          
          {/* Search Results Dropdown */}
          {(isSearching && searchQuery && hasResults) && (
            <Card className="absolute top-full left-0 right-0 mt-1 max-h-96 overflow-y-auto bg-white shadow-lg border z-50 animate-fade-in">
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
            <Card className="absolute top-full left-0 right-0 mt-1 bg-white shadow-lg border z-50 animate-fade-in">
              <div className="p-4 text-center text-gray-500">
                <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>Nenhum resultado encontrado para "{searchQuery}"</p>
                <p className="text-sm mt-1">Tente usar termos diferentes</p>
              </div>
            </Card>
          )}
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link
            to="/"
            className="text-gray-700 hover:text-fishing-blue font-medium transition-colors"
          >
            Home
          </Link>
          <Link
            to="/about"
            className="text-gray-700 hover:text-fishing-blue font-medium transition-colors"
          >
            Sobre
          </Link>
          <Link
            to="/locations"
            className="text-gray-700 hover:text-fishing-blue font-medium transition-colors"
          >
            Localidades
          </Link>
          <Link
            to="/reports"
            className="text-gray-700 hover:text-fishing-blue font-medium transition-colors"
          >
            Relatos
          </Link>
          <Link
            to="/cronograma"
            className="text-gray-700 hover:text-fishing-blue font-medium transition-colors"
          >
            Cronograma
          </Link>
          <Link
            to="/trophy-gallery"
            className="text-gray-700 hover:text-fishing-blue font-medium transition-colors"
          >
            Anzol de Ouro
          </Link>
          
          {!user ? (
            <div className="flex items-center space-x-2">
              <Button variant="outline" asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link to="/register">Cadastro</Link>
              </Button>
            </div>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={user.profileImage}
                      alt={user.name}
                    />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer flex w-full items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>Meu Perfil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/my-reports" className="cursor-pointer flex w-full items-center">
                    <img src={toloniLogoNew} alt="Toloni Pescarias" className="mr-2 h-4 w-4 object-contain" />
                    <span>Meus Relatos</span>
                  </Link>
                </DropdownMenuItem>
                {user.isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin" className="cursor-pointer flex w-full items-center">
                      <MapPin className="mr-2 h-4 w-4" />
                      <span>Admin</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="cursor-pointer flex items-center text-red-500 focus:text-red-500"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </nav>

        {/* Mobile search and menu buttons */}
        <div className="md:hidden flex items-center space-x-2">
          {!mobileSearchOpen ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setMobileSearchOpen(true)}
              className="h-10 w-10 p-2"
            >
              <Search className="h-4 w-4 text-fishing-blue" />
            </Button>
          ) : (
            <div className="flex items-center space-x-2 animate-slide-in-right">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  autoFocus
                  className="w-40 pr-16 h-10"
                />
                {searchQuery && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={clearSearch}
                    className="absolute right-9 top-1/2 transform -translate-y-1/2 hover:bg-gray-100 h-8 w-8 p-1.5"
                  >
                    <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={() => {
                    executeSearch();
                    setMobileSearchOpen(false);
                  }}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-fishing-blue hover:bg-fishing-blue/90 h-8 w-8 p-1.5"
                >
                  <Search className="h-4 w-4 text-white" />
                </Button>
              </div>
            </div>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMobileMenu}
            aria-label="Menu de navegação"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t">
          <div className="container mx-auto px-4 py-3 space-y-3">
            <Link
              to="/"
              className="block py-2 text-gray-700 hover:text-fishing-blue font-medium"
              onClick={toggleMobileMenu}
            >
              <div className="flex items-center space-x-2">
                <Home className="h-5 w-5" />
                <span>Home</span>
              </div>
            </Link>
            <Link
              to="/about"
              className="block py-2 text-gray-700 hover:text-fishing-blue font-medium"
              onClick={toggleMobileMenu}
            >
              <div className="flex items-center space-x-2">
                <Home className="h-5 w-5" />
                <span>Sobre</span>
              </div>
            </Link>
            <Link
              to="/locations"
              className="block py-2 text-gray-700 hover:text-fishing-blue font-medium"
              onClick={toggleMobileMenu}
            >
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Localidades</span>
              </div>
            </Link>
            <Link
              to="/reports"
              className="block py-2 text-gray-700 hover:text-fishing-blue font-medium"
              onClick={toggleMobileMenu}
            >
              <div className="flex items-center space-x-2">
                <img src={toloniLogoNew} alt="Toloni Pescarias" className="h-5 w-5 object-contain" />
                <span>Relatos</span>
              </div>
            </Link>
            <Link
              to="/cronograma"
              className="block py-2 text-gray-700 hover:text-fishing-blue font-medium"
              onClick={toggleMobileMenu}
            >
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Cronograma</span>
              </div>
            </Link>
            <Link
              to="/trophy-gallery"
              className="block py-2 text-gray-700 hover:text-fishing-blue font-medium"
              onClick={toggleMobileMenu}
            >
              <div className="flex items-center space-x-2">
                <Trophy className="h-5 w-5" />
                <span>Anzol de Ouro</span>
              </div>
            </Link>
            
            {!user ? (
              <div className="flex flex-col space-y-2 pt-2 border-t">
                <Button variant="outline" asChild>
                  <Link to="/login" onClick={toggleMobileMenu}>
                    Login
                  </Link>
                </Button>
                <Button asChild>
                  <Link to="/register" onClick={toggleMobileMenu}>
                    Cadastro
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="border-t pt-2">
                <div className="flex items-center space-x-3 py-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={user.profileImage}
                      alt={user.name}
                    />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <div className="space-y-1 pt-2">
                  <Link
                    to="/profile"
                    className="flex items-center space-x-2 py-2 text-gray-700 hover:text-fishing-blue"
                    onClick={toggleMobileMenu}
                  >
                    <User className="h-5 w-5" />
                    <span>Meu Perfil</span>
                  </Link>
                  <Link
                    to="/my-reports"
                    className="flex items-center space-x-2 py-2 text-gray-700 hover:text-fishing-blue"
                    onClick={toggleMobileMenu}
                  >
                    <img src={toloniLogoNew} alt="Toloni Pescarias" className="h-5 w-5 object-contain" />
                    <span>Meus Relatos</span>
                  </Link>
                  {user.isAdmin && (
                    <Link
                      to="/admin"
                      className="flex items-center space-x-2 py-2 text-gray-700 hover:text-fishing-blue"
                      onClick={toggleMobileMenu}
                    >
                      <MapPin className="h-5 w-5" />
                      <span>Admin</span>
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleLogout();
                      toggleMobileMenu();
                    }}
                    className="flex items-center space-x-2 py-2 text-red-500 hover:text-red-700 w-full"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Sair</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;

// Types for our data models
export interface Location {
  id: string;
  name: string;
  description: string;
  image: string;
  whatsapp: string;
  featured?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
  bio?: string;
  createdAt: string; // ISO date string
  isAdmin?: boolean;
}

export interface Report {
  id: string;
  userId: string;
  userName: string;
  userProfileImage?: string;
  locationId: string;
  locationName: string;
  title: string;
  content: string;
  images: string[];
  video?: string;
  createdAt: string; // ISO date string
  featured?: boolean;
  isPublic?: boolean; // New field for visibility
  fishType?: string; // Tipo do peixe para ranking
  weight?: string; // Peso para ranking
  location?: string; // Local específico da pescaria
}

export interface Comment {
  id: string;
  reportId: string;
  userId: string;
  userName: string;
  userProfileImage?: string;
  content: string;
  createdAt: string; // ISO date string
}

// Mock users - Sistema limpo pronto para produção
export const users: User[] = [];

// Mock fishing locations - Sistema limpo pronto para produção
export const locations: Location[] = [];

// Mock fishing reports - Sistema limpo pronto para produção
export const reports: Report[] = [];

// Mock comments - Sistema limpo pronto para produção
export const comments: Comment[] = [];

// Helper function to format date
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// API simulation functions
// In a real app, these would be replaced with actual API calls

// Users
export function getUserById(id: string): Promise<User | undefined> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(users.find(user => user.id === id));
    }, 300);
  });
}

// Locations
export function getLocations(): Promise<Location[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...locations]);
    }, 500);
  });
}

export function getLocation(id: string): Promise<Location | undefined> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(locations.find(loc => loc.id === id));
    }, 300);
  });
}

// Reports
export function getAllReports(): Promise<Report[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...reports].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    }, 500);
  });
}

export function getReportsByLocation(locationId: string): Promise<Report[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...reports]
        .filter(report => report.locationId === locationId)
        .sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
    }, 500);
  });
}

export function getReportsByUser(userId: string): Promise<Report[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...reports]
        .filter(report => report.userId === userId)
        .sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
    }, 500);
  });
}

export function getReport(id: string): Promise<Report | undefined> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(reports.find(report => report.id === id));
    }, 300);
  });
}

// Comments
export function getCommentsByReport(reportId: string): Promise<Comment[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...comments]
        .filter(comment => comment.reportId === reportId)
        .sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
      );
    }, 300);
  });
}

// Trophy Gallery functions
export interface TrophyEntry {
  id: string;
  fishermanName: string;
  fishType: string;
  location: string;
  imageUrl: string;
  weight?: string;
  date: string;
  position: number;
  reportId: string; // Link para o relato original
}

// API functions for Trophy Gallery
export async function getCurrentMonthTrophies(): Promise<TrophyEntry[]> {
  try {
    const response = await fetch('/api/trophies.php?action=getCurrentMonth');
    if (!response.ok) throw new Error('Erro na requisição');
    
    const data = await response.json();
    return data.success ? data.trophies : [];
  } catch (error) {
    console.error('Erro ao buscar troféus:', error);
    return [];
  }
}

export async function updateTrophyRanking(): Promise<{ success: boolean; message: string; updated_entries: number }> {
  try {
    const response = await fetch('/api/trophies.php?action=updateRanking', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) throw new Error('Erro na requisição');
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao atualizar ranking:', error);
    return { success: false, message: 'Erro interno', updated_entries: 0 };
  }
}

export async function getTrophiesByMonth(month: string): Promise<TrophyEntry[]> {
  try {
    const response = await fetch(`/api/trophies.php?action=getByMonth&month=${month}`);
    if (!response.ok) throw new Error('Erro na requisição');
    
    const data = await response.json();
    return data.success ? data.trophies : [];
  } catch (error) {
    console.error('Erro ao buscar troféus do mês:', error);
    return [];
  }
}

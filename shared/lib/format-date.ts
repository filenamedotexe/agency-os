export function formatDate(date: string | Date): string {
  // Ensure consistent date formatting between server and client
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Use ISO format to ensure consistency
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

export function formatDateDisplay(date: string | Date): string {
  // For display purposes, use locale formatting only on client
  if (typeof window === 'undefined') {
    // Server: return ISO format
    return formatDate(date);
  }
  
  // Client: use locale formatting
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString();
}
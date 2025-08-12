export function normalizePhoneNumber(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/[^\d]/g, '')
  
  // Handle US numbers (add country code if missing)
  if (digits.length === 10) {
    return `1${digits}`
  }
  
  // Remove leading + or 1 for US numbers
  if (digits.length === 11 && digits.startsWith('1')) {
    return digits
  }
  
  return digits
}

export function formatPhoneForDisplay(phone: string): string {
  const digits = normalizePhoneNumber(phone)
  if (digits.length === 11 && digits.startsWith('1')) {
    const area = digits.slice(1, 4)
    const exchange = digits.slice(4, 7)
    const number = digits.slice(7, 11)
    return `+1 (${area}) ${exchange}-${number}`
  }
  return phone
}

export function findClientByPhone(phone: string, clients: any[]): any | null {
  const normalizedIncoming = normalizePhoneNumber(phone)
  
  return clients.find(client => {
    if (!client.client_profiles?.[0]?.phone) return false
    const normalizedStored = normalizePhoneNumber(client.client_profiles[0].phone)
    return normalizedStored === normalizedIncoming
  })
}
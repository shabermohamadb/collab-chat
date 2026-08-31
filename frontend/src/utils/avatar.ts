export const getAvatarUrl = (name: string, seed?: string): string => {
  const cleanSeed = seed || name || 'user';
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanSeed)}&backgroundColor=0284c7,2563eb,4f46e5,7c3aed,059669,d97706`;
};

export const getStatusColor = (status?: string): string => {
  switch (status) {
    case 'ONLINE':
      return 'bg-emerald-500';
    case 'AWAY':
      return 'bg-amber-500';
    case 'OFFLINE':
    default:
      return 'bg-zinc-500';
  }
};

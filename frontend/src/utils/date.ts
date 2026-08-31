import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';

export const formatMessageTime = (dateString: string | Date): string => {
  const date = new Date(dateString);
  return format(date, 'h:mm a');
};

export const formatFullDateTime = (dateString: string | Date): string => {
  const date = new Date(dateString);
  return format(date, 'MMM d, yyyy h:mm a');
};

export const formatRelativeTime = (dateString: string | Date): string => {
  const date = new Date(dateString);
  return formatDistanceToNow(date, { addSuffix: true });
};

export const formatDateDivider = (dateString: string | Date): string => {
  const date = new Date(dateString);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMMM d, yyyy');
};

export const isSameDay = (d1: string | Date, d2: string | Date): boolean => {
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

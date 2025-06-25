import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimeAgo(date: Date | string): string {
  const now = new Date();
  const articleDate = typeof date === 'string' ? new Date(date) : date;
  const diffInSeconds = Math.floor((now.getTime() - articleDate.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks === 1 ? '' : 's'} ago`;
  }

  return articleDate.toLocaleDateString();
}

export function getSentimentColor(sentiment: string): string {
  switch (sentiment.toLowerCase()) {
    case 'positive':
      return 'success';
    case 'negative':
      return 'danger';
    default:
      return 'primary';
  }
}

export function getTypeColor(type: string): string {
  switch (type.toLowerCase()) {
    case 'nifty':
      return 'success';
    case 'sensex':
      return 'success';
    case 'ipo':
    case 'ipos':
      return 'primary';
    case 'crypto':
      return 'orange-500';
    case 'mutual':
    case 'mutual-funds':
      return 'purple-500';
    default:
      return 'primary';
  }
}

export function truncateContent(content: string, maxLength: number = 350): string {
  if (content.length <= maxLength) {
    return content;
  }
  return content.substring(0, maxLength - 3) + '...';
}

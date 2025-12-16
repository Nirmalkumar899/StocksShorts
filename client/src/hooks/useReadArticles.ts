import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'stocksshorts_read_articles';
const MAX_STORED_ARTICLES = 500;

export function useReadArticles() {
  const [readArticleIds, setReadArticleIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setReadArticleIds(new Set(parsed));
        }
      }
    } catch (error) {
      console.error('Error loading read articles:', error);
    }
  }, []);

  const markAsRead = useCallback((articleId: number) => {
    setReadArticleIds(prev => {
      const newSet = new Set(prev);
      newSet.add(articleId);
      
      let idsArray = Array.from(newSet);
      if (idsArray.length > MAX_STORED_ARTICLES) {
        idsArray = idsArray.slice(-MAX_STORED_ARTICLES);
      }
      
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(idsArray));
      } catch (error) {
        console.error('Error saving read articles:', error);
      }
      
      return new Set(idsArray);
    });
  }, []);

  const isRead = useCallback((articleId: number) => {
    return readArticleIds.has(articleId);
  }, [readArticleIds]);

  const clearReadHistory = useCallback(() => {
    setReadArticleIds(new Set());
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing read articles:', error);
    }
  }, []);

  return { readArticleIds, markAsRead, isRead, clearReadHistory };
}

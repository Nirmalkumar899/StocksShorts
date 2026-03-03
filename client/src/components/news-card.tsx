import { useState } from 'react';
import { Share2, Bookmark, Lock, Youtube, Instagram, Copy, ExternalLink } from '@/lib/icons';
import { useAuth } from '@/hooks/useAuth';
import { getContextualImage } from '@/lib/imageUtils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import ImageLightbox from '@/components/image-lightbox';
import { trackEvent } from '@/lib/analytics';
import type { Article } from '@shared/schema';

interface NewsCardProps {
  article: Article;
  onClick: () => void;
  onShare: (e: React.MouseEvent) => void;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
  onMarkAsRead?: (articleId: number) => void;
  section?: 'allnews' | 'special' | string;
}

export default function NewsCard({ article, onClick, onMarkAsRead, section }: NewsCardProps) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [saved, setSaved] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const imgSrc = imageError ? getContextualImage(article) : (article.imageUrl || getContextualImage(article));

  const formatDate = (date: Date | string | null) => {
    const d = new Date((date || new Date()) as string);
    const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    const day = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    return `${day} • ${time}`;
  };

  const handleCardClick = () => {
    if (article.type === 'StocksShorts Special' && !isAuthenticated && !authLoading) {
      toast({ title: "Login Required", description: "Go to Profile to login and read full article", variant: "destructive" });
      return;
    }
    trackEvent('article_view', 'engagement', article.type, article.id);
    setIsModalOpen(true);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    trackEvent('article_share', 'engagement', article.type, article.id);
    const shareUrl = `${window.location.origin}/article/${article.id}`;
    const shareText = `${article.title}\n\n${article.content.substring(0, 200)}...`;
    if (navigator.share) {
      try { await navigator.share({ title: article.title, text: shareText, url: shareUrl }); return; } catch {}
    }
    // Fallback
    const dialog = document.createElement('div');
    dialog.className = 'fixed inset-0 bg-black bg-opacity-60 flex items-end justify-center z-[999]';
    dialog.innerHTML = `
      <div class="bg-white dark:bg-gray-900 rounded-t-2xl p-5 w-full max-w-lg space-y-3 pb-8">
        <p class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Share via</p>
        <button class="w-full bg-green-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium"
          onclick="window.open('https://wa.me/?text=${encodeURIComponent(shareText + '\n\n' + shareUrl)}','_blank');document.body.removeChild(this.closest('.fixed'))">
          WhatsApp
        </button>
        <button class="w-full bg-sky-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium"
          onclick="window.open('https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}','_blank');document.body.removeChild(this.closest('.fixed'))">
          Twitter / X
        </button>
        <button class="w-full bg-blue-400 text-white px-4 py-2.5 rounded-xl text-sm font-medium"
          onclick="window.open('https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}','_blank');document.body.removeChild(this.closest('.fixed'))">
          Telegram
        </button>
        <button class="w-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2.5 rounded-xl text-sm font-medium"
          onclick="navigator.clipboard.writeText('${shareUrl}');document.body.removeChild(this.closest('.fixed'))">
          Copy Link
        </button>
        <button class="w-full bg-gray-100 dark:bg-gray-800 text-gray-500 px-4 py-2.5 rounded-xl text-sm font-medium"
          onclick="document.body.removeChild(this.closest('.fixed'))">
          Cancel
        </button>
      </div>`;
    dialog.addEventListener('click', (ev) => { if (ev.target === dialog) document.body.removeChild(dialog); });
    document.body.appendChild(dialog);
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSaved(!saved);
    toast({ title: saved ? "Removed from saved" : "Article saved!", description: saved ? "" : "Saved to your bookmarks." });
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/article/${article.id}`;
    navigator.clipboard.writeText(url).then(() => {
      trackEvent('article_copy_link', 'engagement', article.type, article.id);
      toast({ title: "Link copied!", description: "Article link copied to clipboard." });
    });
  };

  return (
    <>
      <div
        className="h-full w-full snap-start flex flex-col bg-white dark:bg-black cursor-pointer"
        onClick={handleCardClick}
      >
        {/* Image — full width */}
        <div className="w-full flex-shrink-0" style={{ height: '52%' }}>
          <img
            src={imgSrc}
            alt={article.title}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImageError(true)}
            onClick={(e) => { e.stopPropagation(); setIsLightboxOpen(true); }}
          />
        </div>

        {/* Content area */}
        <div className="flex-1 flex flex-col px-4 pt-3 pb-20 overflow-hidden">
          {/* Bookmark + Share row aligned right */}
          <div className="flex justify-end gap-4 mb-2">
            <button
              onClick={handleSave}
              className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
              aria-label="Save article"
              data-testid="button-save"
            >
              <Bookmark className={`h-5 w-5 ${saved ? 'fill-current text-black dark:text-white' : ''}`} />
            </button>
            <button
              onClick={handleShare}
              className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
              aria-label="Share article"
              data-testid="button-share"
            >
              <Share2 className="h-5 w-5" />
            </button>
          </div>

          {/* Title */}
          <h2 className="font-bold text-[17px] leading-snug text-gray-900 dark:text-white mb-2 line-clamp-3">
            {article.title}
          </h2>

          {/* Content */}
          {article.type === 'StocksShorts Special' && !isAuthenticated && !authLoading ? (
            <div>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed line-clamp-4">
                {article.content.substring(0, 200)}...
              </p>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-medium">
                <Lock className="h-3 w-3" />
                Login to read full article
              </div>
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed line-clamp-5">
              {article.content?.trim() || 'No content available.'}
            </p>
          )}

          {/* Bottom bar — date + source + social */}
          <div className="mt-auto pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                <span>{formatDate(article.time)}</span>
                {((article as any).sourceUrl || (article as any).primarySourceUrl) && section !== 'special' && (
                  <>
                    <span>•</span>
                    <a
                      href={(article as any).sourceUrl || (article as any).primarySourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white font-medium underline underline-offset-2"
                      onClick={(e) => { e.stopPropagation(); trackEvent('article_source_click', 'engagement', article.type, article.id); }}
                      data-testid="link-source-article"
                    >
                      {article.source}
                    </a>
                  </>
                )}
              </div>
              {/* Social icons */}
              <div className="flex items-center gap-2">
                <a href="https://youtube.com/@stocksshortss?si=3-LCEG5WTMkdIlIA" target="_blank" rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="w-6 h-6 flex items-center justify-center bg-red-600 rounded-full text-white">
                  <Youtube className="w-3 h-3" />
                </a>
                <a href="https://www.instagram.com/stocksshorts?igsh=MWZhdmhneXR1emxibg%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="w-6 h-6 flex items-center justify-center bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 rounded-full text-white">
                  <Instagram className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      <ImageLightbox src={imgSrc} alt={article.title} isOpen={isLightboxOpen} onClose={() => setIsLightboxOpen(false)} />

      {/* Full article modal */}
      <Dialog open={isModalOpen} onOpenChange={(open) => {
        setIsModalOpen(open);
        if (!open && onMarkAsRead) onMarkAsRead(article.id);
      }}>
        <DialogContent className="w-[95vw] max-w-4xl h-[90vh] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0 pb-3">
            <DialogTitle className="text-base font-bold pr-8 line-clamp-3">{article.title}</DialogTitle>
            <DialogDescription className="sr-only">Full article content</DialogDescription>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="absolute right-3 top-3 z-50 h-8 w-8">×</Button>
            </DialogClose>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            <div className="space-y-4 pb-4">
              <div className="w-full max-h-60 overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
                <img src={imgSrc} alt={article.title} className="w-full h-auto object-contain"
                  onError={(e) => { e.currentTarget.src = getContextualImage(article); }} />
              </div>

              <div className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                {article.type === 'StocksShorts Special' && !isAuthenticated && !authLoading ? (
                  <div>
                    <p>{article.content.substring(0, 150)}...</p>
                    <div className="mt-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-1">
                        <Lock className="h-3 w-3" /> Login Required
                      </div>
                      <p className="text-xs text-blue-600 dark:text-blue-400">Go to Profile to login and read the full article</p>
                    </div>
                  </div>
                ) : (
                  article.content?.trim() || 'No content available.'
                )}
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 pt-3 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 mb-3">
              <span>{formatDate(article.time)} • {article.source}</span>
              <span className="capitalize">{article.sentiment}</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopyLink} className="text-xs">
                <Copy className="h-3 w-3 mr-1.5" /> Copy Link
              </Button>
              <Button variant="outline" size="sm" onClick={handleShare} className="text-xs">
                <Share2 className="h-3 w-3 mr-1.5" /> Share
              </Button>
              {((article as any).sourceUrl || (article as any).primarySourceUrl) && (
                <a href={(article as any).sourceUrl || (article as any).primarySourceUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="text-xs">
                    <ExternalLink className="h-3 w-3 mr-1.5" /> Source
                  </Button>
                </a>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

import { useState, useEffect } from "react";
import { ArrowLeft, MessageCircle, Clock, User } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { useSEO } from "@/hooks/useSEO";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { Link, useLocation } from "wouter";
import type { Conversation } from "@shared/schema";

interface ConversationsProps {
  onBack?: () => void;
}

interface ConversationWithAdvisor extends Conversation {
  advisorName?: string;
  advisorCompany?: string;
}

export default function Conversations({ onBack }: ConversationsProps) {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const isMobile = useIsMobile();
  
  useSEO({
    title: "Messages - StocksShorts",
    description: "View and manage your conversations with SEBI-registered investment advisors on StocksShorts."
  });

  // Auto-refresh conversations every 10 seconds
  const { data: conversations = [], isLoading, error, refetch } = useQuery<ConversationWithAdvisor[]>({
    queryKey: ['/api/conversations'],
    enabled: isAuthenticated,
    refetchInterval: 10000, // Auto-refresh every 10 seconds
  });

  // Get unread message count
  const { data: unreadData } = useQuery<{ unreadCount: number }>({
    queryKey: ['/api/conversations/unread-count'],
    enabled: isAuthenticated,
    refetchInterval: 10000,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation('/profile');
    }
  }, [isAuthenticated, setLocation]);

  const handleConversationClick = (conversationId: number) => {
    setLocation(`/chat/${conversationId}`);
  };

  const formatRelativeTime = (date: string | Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - messageDate.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return messageDate.toLocaleDateString();
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <User className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h2 className="text-lg font-semibold mb-2">Login Required</h2>
            <p className="text-gray-600 mb-4">Please log in to access your messages.</p>
            <Button onClick={() => setLocation('/profile')} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack || (() => setLocation('/'))}
              className="md:hidden"
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Messages</h1>
              {unreadData && unreadData.unreadCount > 0 && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {unreadData.unreadCount} unread message{unreadData.unreadCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
          <MessageCircle className="w-6 h-6 text-blue-600" />
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {error && (
          <Alert className="mb-4" data-testid="alert-error">
            <AlertDescription>
              Failed to load conversations. Please try again.
            </AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                    <Skeleton className="h-3 w-16" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-12" data-testid="empty-conversations">
            <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No conversations yet
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
              Start a conversation with an investment advisor from the advisor directory.
            </p>
            <Button
              onClick={() => setLocation('/advisor-directory')}
              data-testid="button-browse-advisors"
            >
              Browse Advisors
            </Button>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-140px)]">
            <div className="space-y-3">
              {conversations.map((conversation) => (
                <Card
                  key={conversation.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleConversationClick(conversation.id)}
                  data-testid={`conversation-card-${conversation.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      {/* Advisor Avatar */}
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      
                      {/* Conversation Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                            {conversation.advisorName || 'Investment Advisor'}
                          </h3>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {conversation.unreadCount > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {conversation.unreadCount}
                              </Badge>
                            )}
                            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatRelativeTime(conversation.lastMessageAt)}
                            </span>
                          </div>
                        </div>
                        
                        {conversation.advisorCompany && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            {conversation.advisorCompany}
                          </p>
                        )}
                        
                        <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                          {conversation.lastMessagePreview || 'Start a conversation...'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
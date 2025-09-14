import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Send, User, CheckCircle, Clock } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSEO } from "@/hooks/useSEO";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import type { Message, Conversation } from "@shared/schema";

interface ChatProps {
  conversationId?: string;
}

interface ConversationWithAdvisor extends Conversation {
  advisorName?: string;
  advisorCompany?: string;
}

export default function Chat({ conversationId }: ChatProps) {
  const [, setLocation] = useLocation();
  const [messageText, setMessageText] = useState("");
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  
  const convId = conversationId ? parseInt(conversationId) : null;

  useSEO({
    title: "Chat - StocksShorts",
    description: "Chat with SEBI-registered investment advisors on StocksShorts."
  });

  // Get conversation details
  const { data: conversationData, isLoading: conversationLoading } = useQuery<ConversationWithAdvisor[]>({
    queryKey: ['/api/conversations'],
    enabled: isAuthenticated,
  });

  const conversation = conversationData?.find(c => c.id === convId);

  // Get messages in conversation
  const { data: messagesData, isLoading: messagesLoading, error } = useQuery<{
    messages: Message[];
    conversation: Conversation;
  }>({
    queryKey: [`/api/conversations/${convId}/messages`],
    enabled: isAuthenticated && !!convId,
    refetchInterval: 5000, // Auto-refresh messages every 5 seconds
  });

  const messages = messagesData?.messages || [];

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest('POST', `/api/conversations/${convId}/messages`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/conversations/${convId}/messages`] });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      setMessageText("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send message",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation('/profile');
    }
    if (!convId) {
      setLocation('/conversations');
    }
  }, [isAuthenticated, convId, setLocation]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || sendMessageMutation.isPending) return;
    
    sendMessageMutation.mutate(messageText.trim());
  };

  const formatMessageTime = (date: string | Date) => {
    const messageDate = new Date(date);
    return messageDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatMessageDate = (date: string | Date) => {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <User className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h2 className="text-lg font-semibold mb-2">Login Required</h2>
            <p className="text-gray-600 mb-4">Please log in to access chat.</p>
            <Button onClick={() => setLocation('/profile')} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!convId) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-lg font-semibold mb-2">Invalid Conversation</h2>
            <Button onClick={() => setLocation('/conversations')} className="w-full">
              Back to Conversations
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/conversations')}
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-gray-900 dark:text-white truncate">
              {conversation?.advisorName || 'Investment Advisor'}
            </h1>
            {conversation?.advisorCompany && (
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {conversation.advisorCompany}
              </p>
            )}
          </div>
          
          <Badge variant="outline" className="text-xs">
            SEBI Registered
          </Badge>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        {error && (
          <Alert className="m-4" data-testid="alert-error">
            <AlertDescription>
              Failed to load messages. Please try again.
            </AlertDescription>
          </Alert>
        )}

        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            {messagesLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-xs">
                      <Skeleton className="h-12 w-48 rounded-lg" />
                      <Skeleton className="h-3 w-16 mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Start the conversation
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Send a message to begin chatting with this advisor.
                </p>
              </div>
            ) : (
              <>
                {messages.map((message, index) => {
                  const isUser = message.sender === 'user';
                  const showDate = index === 0 || 
                    formatMessageDate(message.createdAt) !== formatMessageDate(messages[index - 1].createdAt);
                  
                  return (
                    <div key={message.id}>
                      {/* Date separator */}
                      {showDate && (
                        <div className="text-center my-6">
                          <span className="bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded-full text-xs text-gray-600 dark:text-gray-400">
                            {formatMessageDate(message.createdAt)}
                          </span>
                        </div>
                      )}
                      
                      {/* Message */}
                      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs md:max-w-md ${isUser ? 'order-1' : 'order-2'}`}>
                          <div
                            className={`px-4 py-2 rounded-lg ${
                              isUser
                                ? 'bg-blue-600 text-white'
                                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                            }`}
                            data-testid={`message-${message.id}`}
                          >
                            <p className="text-sm">{message.content}</p>
                          </div>
                          
                          <div className={`flex items-center gap-1 mt-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatMessageTime(message.createdAt)}
                            </span>
                            {isUser && (
                              <div className="flex items-center">
                                {message.readAt ? (
                                  <CheckCircle className="w-3 h-3 text-blue-600" />
                                ) : (
                                  <Clock className="w-3 h-3 text-gray-400" />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Message Input */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type your message..."
            className="flex-1"
            disabled={sendMessageMutation.isPending}
            maxLength={1000}
            data-testid="input-message"
          />
          <Button
            type="submit"
            disabled={!messageText.trim() || sendMessageMutation.isPending}
            data-testid="button-send"
          >
            {sendMessageMutation.isPending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </form>
        
        {messageText.length > 900 && (
          <p className="text-xs text-gray-500 mt-1">
            {1000 - messageText.length} characters remaining
          </p>
        )}
      </div>
    </div>
  );
}
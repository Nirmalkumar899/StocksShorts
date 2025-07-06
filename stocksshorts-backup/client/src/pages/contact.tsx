import { useState } from "react";
import { ArrowLeft, Send, MessageCircle, Plus, ThumbsUp, ThumbsDown, AlertTriangle, Clock } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import BottomNavigation from "@/components/bottom-navigation";

interface ContactProps {
  onBack: () => void;
}

interface FeedPost {
  id: number;
  question: string;
  answer?: string;
  votes: number;
  timestamp: Date;
  status: 'pending' | 'approved' | 'answered';
}

export default function Contact({ onBack }: ContactProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNewQuestion, setShowNewQuestion] = useState(false);
  const [selectedPost, setSelectedPost] = useState<number | null>(null);

  // Sample feed data - in production this would come from API
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>([
    {
      id: 1,
      question: "What are the key factors to consider before investing in mid-cap stocks?",
      answer: "Mid-cap stocks typically offer good growth potential with moderate risk. Key factors include: company fundamentals, sector trends, management quality, debt levels, and market position. Always diversify your portfolio.",
      votes: 12,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: 'answered'
    },
    {
      id: 2,
      question: "Is it a good time to invest in IT stocks given the current market conditions?",
      votes: 8,
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      status: 'pending'
    },
    {
      id: 3,
      question: "How do I analyze a company's debt-to-equity ratio for investment decisions?",
      answer: "Debt-to-equity ratio shows how much debt a company uses relative to equity. Generally, lower ratios indicate less financial risk. Compare with industry averages and consider the company's ability to service debt through cash flow.",
      votes: 15,
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
      status: 'answered'
    }
  ]);

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newPost: FeedPost = {
      id: Date.now(),
      question: question.trim(),
      votes: 0,
      timestamp: new Date(),
      status: 'pending'
    };
    
    setFeedPosts(prev => [newPost, ...prev]);
    setQuestion("");
    setShowNewQuestion(false);
    setIsSubmitting(false);
  };

  const handleSubmitAnswer = async (postId: number) => {
    if (!answer.trim()) return;
    
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setFeedPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, answer: answer.trim(), status: 'answered' as const }
        : post
    ));
    
    setAnswer("");
    setSelectedPost(null);
    setIsSubmitting(false);
  };

  const handleVote = (postId: number, isUpvote: boolean) => {
    setFeedPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, votes: post.votes + (isUpvote ? 1 : -1) }
        : post
    ));
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" onClick={onBack} className="hover:bg-gray-100 dark:hover:bg-gray-700">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5 text-blue-600" />
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                Stock Discussion Feed
              </h1>
            </div>
          </div>
          <Button 
            onClick={() => setShowNewQuestion(true)}
            className="bg-blue-600 text-white hover:bg-blue-700"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            Ask
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto pb-20">
        {/* Moderation Notice */}
        <Card className="mb-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div>
                <h3 className="font-medium text-yellow-800 dark:text-yellow-200">Community Guidelines</h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  All questions and answers are moderated before going live. Keep discussions stock-related and professional. No inappropriate content allowed.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* New Question Form */}
        {showNewQuestion && (
          <Card className="mb-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <h3 className="font-medium mb-3">Ask a Stock-Related Question</h3>
              <form onSubmit={handleSubmitQuestion}>
                <Textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask anything about stocks, investing, market analysis, or trading strategies..."
                  className="mb-3"
                  rows={3}
                />
                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowNewQuestion(false)}
                    size="sm"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={!question.trim() || isSubmitting}
                    className="bg-blue-600 text-white hover:bg-blue-700"
                    size="sm"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Question"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Feed Posts */}
        <div className="space-y-4">
          {feedPosts.map((post) => (
            <Card key={post.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <CardContent className="p-4">
                {/* Question */}
                <div className="mb-3">
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant={post.status === 'answered' ? 'default' : 'secondary'} className="text-xs">
                      {post.status === 'answered' ? 'Answered' : 'Pending'}
                    </Badge>
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatTimeAgo(post.timestamp)}
                    </div>
                  </div>
                  <p className="text-gray-800 dark:text-gray-200 font-medium">
                    Q: {post.question}
                  </p>
                </div>

                {/* Answer */}
                {post.answer && (
                  <div className="mb-3 bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium text-blue-600 dark:text-blue-400">A:</span> {post.answer}
                    </p>
                  </div>
                )}

                {/* Answer Form for Unanswered Questions */}
                {!post.answer && selectedPost === post.id && (
                  <div className="mb-3">
                    <Textarea
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="Provide a helpful answer..."
                      rows={3}
                      className="mb-2"
                    />
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setSelectedPost(null)}
                        size="sm"
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={() => handleSubmitAnswer(post.id)}
                        disabled={!answer.trim() || isSubmitting}
                        className="bg-green-600 text-white hover:bg-green-700"
                        size="sm"
                      >
                        {isSubmitting ? "Submitting..." : "Submit Answer"}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleVote(post.id, true)}
                        className="h-8 px-2"
                      >
                        <ThumbsUp className="h-4 w-4" />
                      </Button>
                      <span className="text-sm font-medium">{post.votes}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleVote(post.id, false)}
                        className="h-8 px-2"
                      >
                        <ThumbsDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {!post.answer && selectedPost !== post.id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedPost(post.id)}
                    >
                      Answer
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {feedPosts.length === 0 && (
          <Card className="p-8 text-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No discussions yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Be the first to ask a stock-related question!
            </p>
            <Button 
              onClick={() => setShowNewQuestion(true)}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              Start Discussion
            </Button>
          </Card>
        )}
      </div>
      
      {/* Fixed Bottom Navigation */}
      <div className="flex-shrink-0">
        <BottomNavigation activeTab="profile" onTabChange={() => {}} />
      </div>
    </div>
  );
}
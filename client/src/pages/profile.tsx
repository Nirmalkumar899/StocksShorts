import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, ArrowLeft, LogIn, LogOut } from "lucide-react";

interface ProfileProps {
  onBack: () => void;
}

export default function Profile({ onBack }: ProfileProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-blue-600" />
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Profile</h1>
          </div>
        </div>
      </div>

      <div className="p-4">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            {isAuthenticated ? (
              <>
                <Avatar className="w-20 h-20 mx-auto mb-4">
                  <AvatarImage src={user?.profileImageUrl} alt={user?.firstName || "User"} />
                  <AvatarFallback className="text-lg">
                    {user?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="text-xl">
                  {user?.firstName && user?.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : user?.email || "User"
                  }
                </CardTitle>
                <CardDescription>{user?.email}</CardDescription>
              </>
            ) : (
              <>
                <div className="mx-auto mb-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-full w-fit">
                  <User className="h-8 w-8 text-gray-600 dark:text-gray-400" />
                </div>
                <CardTitle className="text-xl">Welcome to StockShorts</CardTitle>
                <CardDescription>
                  Sign in to save articles and get personalized recommendations
                </CardDescription>
              </>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {isAuthenticated ? (
              <>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <p>• Access to personalized content</p>
                  <p>• Save articles for later reading</p>
                  <p>• Get tailored recommendations</p>
                </div>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => window.location.href = '/api/logout'}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <p>• Save articles for later reading</p>
                  <p>• Get personalized recommendations</p>
                  <p>• Access premium features</p>
                </div>
                <Button 
                  className="w-full"
                  onClick={() => window.location.href = '/api/login'}
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In with Google
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
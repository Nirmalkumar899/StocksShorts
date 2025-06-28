import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { User, ArrowLeft, LogOut, Phone, Edit3, Save, BookmarkCheck, MapPin, Briefcase, Calendar, Star } from "lucide-react";
import MobileLogin from "./mobile-login";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ProfileProps {
  onBack: () => void;
}

export default function Profile({ onBack }: ProfileProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [showMobileLogin, setShowMobileLogin] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    age: "",
    gender: "",
    city: "",
    occupation: "",
    investmentExperience: ""
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Update profile data when user changes
  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: (user as any).firstName || "",
        lastName: (user as any).lastName || "",
        age: (user as any).age ? String((user as any).age) : "",
        gender: (user as any).gender || "",
        city: (user as any).city || "",
        occupation: (user as any).occupation || "",
        investmentExperience: (user as any).investmentExperience || ""
      });
    }
  }, [user]);

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof profileData) => {
      const response = await apiRequest("PUT", "/api/auth/profile", {
        ...data,
        age: data.age ? parseInt(data.age) : null
      });
      return response.json();
    },
    onSuccess: () => {
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      });
    }
  });

  if (showMobileLogin) {
    return (
      <MobileLogin 
        onBack={() => setShowMobileLogin(false)}
        onLoginSuccess={() => {
          setShowMobileLogin(false);
          // Don't reload, just let React Query refetch
          queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        }}
      />
    );
  }

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
    <div className="h-full bg-gray-50 dark:bg-gray-900 flex flex-col">
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

      <div className="flex-1 overflow-y-auto p-4 pb-20">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            {isAuthenticated ? (
              <>
                <Avatar className="w-20 h-20 mx-auto mb-4">
                  <AvatarImage src={""} alt={(user as any)?.firstName || "User"} />
                  <AvatarFallback className="text-lg">
                    {(user as any)?.firstName?.[0]?.toUpperCase() || (user as any)?.phoneNumber?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="text-xl">
                  {(user as any)?.firstName && (user as any)?.lastName 
                    ? `${(user as any).firstName} ${(user as any).lastName}`
                    : (user as any)?.phoneNumber || "User"
                  }
                </CardTitle>
                <CardDescription>{(user as any)?.phoneNumber}</CardDescription>
              </>
            ) : (
              <>
                <div className="mx-auto mb-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-full w-fit">
                  <User className="h-8 w-8 text-gray-600 dark:text-gray-400" />
                </div>
                <CardTitle className="text-xl">Welcome to StocksShorts</CardTitle>
                <CardDescription>
                  Login with your mobile number for secure access
                </CardDescription>
              </>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {isAuthenticated ? (
              <>
                {/* Personal Details Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      Personal Details
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(!isEditing)}
                      disabled={updateProfileMutation.isPending}
                    >
                      {isEditing ? <Save className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                    </Button>
                  </div>

                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="firstName" className="text-sm font-medium">First Name</Label>
                          <Input
                            id="firstName"
                            value={profileData.firstName}
                            onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                            placeholder="Enter first name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="lastName" className="text-sm font-medium">Last Name</Label>
                          <Input
                            id="lastName"
                            value={profileData.lastName}
                            onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                            placeholder="Enter last name"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="age" className="text-sm font-medium">Age</Label>
                          <Input
                            id="age"
                            type="number"
                            value={profileData.age}
                            onChange={(e) => setProfileData({...profileData, age: e.target.value})}
                            placeholder="Enter age"
                          />
                        </div>
                        <div>
                          <Label htmlFor="gender" className="text-sm font-medium">Gender</Label>
                          <Select value={profileData.gender} onValueChange={(value) => setProfileData({...profileData, gender: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Male">Male</SelectItem>
                              <SelectItem value="Female">Female</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                              <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="city" className="text-sm font-medium">City</Label>
                        <Input
                          id="city"
                          value={profileData.city}
                          onChange={(e) => setProfileData({...profileData, city: e.target.value})}
                          placeholder="Enter your city"
                        />
                      </div>

                      <div>
                        <Label htmlFor="occupation" className="text-sm font-medium">Occupation</Label>
                        <Input
                          id="occupation"
                          value={profileData.occupation}
                          onChange={(e) => setProfileData({...profileData, occupation: e.target.value})}
                          placeholder="Enter your occupation"
                        />
                      </div>

                      <div>
                        <Label htmlFor="experience" className="text-sm font-medium">Investment Experience</Label>
                        <Select value={profileData.investmentExperience} onValueChange={(value) => setProfileData({...profileData, investmentExperience: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select experience level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Beginner">Beginner (0-1 years)</SelectItem>
                            <SelectItem value="Intermediate">Intermediate (1-5 years)</SelectItem>
                            <SelectItem value="Advanced">Advanced (5-10 years)</SelectItem>
                            <SelectItem value="Expert">Expert (10+ years)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button 
                          onClick={() => updateProfileMutation.mutate(profileData)}
                          disabled={updateProfileMutation.isPending}
                          className="flex-1"
                        >
                          {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setIsEditing(false)}
                          disabled={updateProfileMutation.isPending}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 text-sm">
                      {(user as any)?.firstName || (user as any)?.lastName ? (
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-2 text-gray-500" />
                          <span>{(user as any)?.firstName} {(user as any)?.lastName}</span>
                        </div>
                      ) : null}
                      
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 mr-2 text-gray-500" />
                        <span>{(user as any)?.phoneNumber}</span>
                      </div>

                      {(user as any)?.age ? (
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                          <span>{(user as any)?.age} years old</span>
                        </div>
                      ) : null}

                      {(user as any)?.city ? (
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                          <span>{(user as any)?.city}</span>
                        </div>
                      ) : null}

                      {(user as any)?.occupation ? (
                        <div className="flex items-center">
                          <Briefcase className="w-4 h-4 mr-2 text-gray-500" />
                          <span>{(user as any)?.occupation}</span>
                        </div>
                      ) : null}

                      {(user as any)?.investmentExperience ? (
                        <div className="flex items-center">
                          <Star className="w-4 h-4 mr-2 text-gray-500" />
                          <span>{(user as any)?.investmentExperience} Investor</span>
                        </div>
                      ) : null}

                      {!((user as any)?.firstName || (user as any)?.age || (user as any)?.city) && (
                        <p className="text-gray-500 text-center py-4">
                          Add your personal details to personalize your experience
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Saved Articles Section */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
                    <BookmarkCheck className="w-4 h-4 mr-2" />
                    Saved Articles
                  </h3>
                  <div className="text-center py-6 text-gray-500">
                    <BookmarkCheck className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No saved articles yet</p>
                    <p className="text-xs">Bookmark articles while reading to save them here</p>
                  </div>
                </div>

                <Separator />

                {/* App Features */}
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <p>• AI Stock Analysis (Beta Testing)</p>
                  <p>• Personalized investment insights</p>
                  <p>• Real-time market updates</p>
                </div>

                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => {
                    // Clear session and redirect
                    fetch('/api/auth/logout', { method: 'POST' })
                      .then(() => {
                        queryClient.clear();
                        window.location.reload();
                      });
                  }}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <p>• Secure mobile OTP authentication</p>
                  <p>• AI stock analysis with daily limits</p>
                  <p>• Personalized profile and saved articles</p>
                </div>
                <Button 
                  className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                  onClick={() => setShowMobileLogin(true)}
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Login with Mobile
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
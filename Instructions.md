# SEBI RIA Connect Section Enhancement - Implementation Plan

## Executive Summary

This document provides a comprehensive analysis and implementation plan for enhancing the Connect RIA section with proper text formatting consistency with the Home section, and adding a "Join as SEBI registered analyst" registration functionality with a comprehensive form.

## Deep Codebase Research Findings

### Current Connect RIA Implementation

**Primary Files:**
- `client/src/pages/sebi-ria.tsx` - Main SEBI RIA directory component
- `client/src/pages/sebi-ria-new.tsx` - Enhanced version with hero section (currently routed)
- `client/src/components/bottom-navigation.tsx` - Navigation with existing "Connect RIA" tab
- `client/src/App.tsx` - Routing configuration

**Current Functionality:**
- SEBI RIA directory with search and filtering
- Featured advisor rotation every 5 seconds  
- Educational content about SEBI RIAs and investor rights
- Responsive design with dark mode support
- Integration with investment advisor API endpoint

### Home Section Design Patterns

**Key Design Elements from `client/src/pages/home.tsx`:**
- Clean white/neutral card backgrounds with subtle borders
- Consistent spacing: `px-4 py-4`, `space-y-4` for sections
- Typography: `text-lg font-semibold`, `text-sm text-gray-600 dark:text-gray-400`
- Proper text wrapping: `break-words`, `leading-relaxed`
- Responsive containers with proper max-widths
- Fixed header with `sticky top-0 z-50`
- Loading states with skeleton components

### Existing Form and Authentication Patterns

**Form Implementation Pattern (`server/mobileAuth.ts`):**
- Zod validation for request bodies
- Structured error handling with proper HTTP status codes
- Session management for authenticated operations
- Database operations through storage interface
- Success/error response patterns

**Storage Interface (`server/storage.ts`):**
- Consistent CRUD operations
- Drizzle ORM with PostgreSQL
- Timeout handling for database operations
- Proper TypeScript typing with schema imports

### Database Schema Analysis

**Current Investment Advisor Schema (`shared/schema.ts`):**
```typescript
export const investmentAdvisors = pgTable("investment_advisors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  company: text("company").default(''),
  designation: text("designation").default(''),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  website: text("website").default(''),
  specialization: text("specialization").default(''),
  experience: text("experience").default(''),
  location: text("location").default(''),
  rating: text("rating").default('4.0'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

**Required Extensions:**
- SEBI registration number (unique identifier)
- Expertise areas (multiple choice array)
- Physical address
- Consultation fee structure
- Social media links
- Published articles URL
- Verification status for moderation

## Feasibility Assessment

### ✅ **HIGH FEASIBILITY - All requirements are implementable**

**Strengths:**
1. **Existing Infrastructure**: Complete form handling, validation, and database patterns already established
2. **Consistent Design System**: Home section provides clear design patterns to follow
3. **Database Schema Foundation**: Investment advisor table already exists with most required fields
4. **Routing & Navigation**: Bottom navigation and routing infrastructure already in place
5. **API Patterns**: Established patterns for creating and managing user data

**Potential Challenges & Solutions:**
1. **Text Wrapping Issues**: 
   - **Issue**: Current RIA section may have inconsistent text wrapping
   - **Solution**: Apply Home section's proven CSS patterns (`break-words`, proper containers)

2. **Form Complexity**:
   - **Issue**: Multiple field types (text, arrays, URLs, numbers)
   - **Solution**: Use existing shadcn/ui components with react-hook-form patterns

3. **Data Validation**:
   - **Issue**: SEBI registration numbers need specific validation
   - **Solution**: Implement custom Zod validators following existing patterns

4. **User Experience**:
   - **Issue**: Seamless integration between viewing and registering
   - **Solution**: Follow established navigation patterns with proper success/error states

## Detailed Implementation Plan

### Phase 1: Database Schema Enhancement

**File: `shared/schema.ts`**

```typescript
export const investmentAdvisors = pgTable("investment_advisors", {
  // Existing fields...
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  company: text("company").default(''),
  designation: text("designation").default(''),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  website: text("website").default(''),
  specialization: text("specialization").default(''),
  experience: text("experience").default(''),
  location: text("location").default(''),
  rating: text("rating").default('4.0'),
  
  // New required fields
  sebiRegNumber: text("sebi_reg_number").unique().notNull(),
  expertiseAreas: text("expertise_areas").array(), // Note: .array() method, not array() wrapper
  address: text("address").default(''),
  consultationFee15Min: integer("consultation_fee_15min").default(0),
  publishedArticlesUrl: text("published_articles_url").default(''),
  socialLinks: jsonb("social_links").default({}), // {twitter?, linkedin?, youtube?, etc.}
  isVerified: boolean("is_verified").default(false), // For moderation
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertInvestmentAdvisorSchema = createInsertSchema(investmentAdvisors)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    sebiRegNumber: z.string().min(8).max(20), // SEBI reg format validation
    consultationFee15Min: z.number().min(0).max(50000),
    publishedArticlesUrl: z.string().url().optional().or(z.literal('')),
    website: z.string().url().optional().or(z.literal('')),
  });

export type InsertInvestmentAdvisor = z.infer<typeof insertInvestmentAdvisorSchema>;
export type InvestmentAdvisor = typeof investmentAdvisors.$inferSelect;
```

### Phase 2: Backend API Implementation

**File: `server/storage.ts` - Add to IStorage interface:**

```typescript
export interface IStorage {
  // Existing methods...
  
  // New analyst registration methods
  createInvestmentAdvisor(advisor: InsertInvestmentAdvisor): Promise<InvestmentAdvisor>;
  getInvestmentAdvisorBySebi(sebiRegNumber: string): Promise<InvestmentAdvisor | undefined>;
  updateInvestmentAdvisor(id: number, updates: Partial<InsertInvestmentAdvisor>): Promise<InvestmentAdvisor>;
}
```

**File: `server/routes.ts` - Add new API endpoint:**

```typescript
// Add to routes
app.post('/api/analyst/register', async (req, res) => {
  try {
    // Validate request body using Zod schema
    const validationResult = insertInvestmentAdvisorSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: "Validation failed", 
        errors: validationResult.error.errors 
      });
    }

    const advisorData = validationResult.data;

    // Check if SEBI registration number already exists
    const existingAdvisor = await storage.getInvestmentAdvisorBySebi(advisorData.sebiRegNumber);
    if (existingAdvisor) {
      return res.status(409).json({ 
        message: "SEBI registration number already registered" 
      });
    }

    // Create new advisor
    const newAdvisor = await storage.createInvestmentAdvisor(advisorData);

    res.status(201).json({
      message: "Analyst registration successful",
      advisor: {
        id: newAdvisor.id,
        name: newAdvisor.name,
        company: newAdvisor.company,
        sebiRegNumber: newAdvisor.sebiRegNumber,
        isVerified: newAdvisor.isVerified,
      }
    });

  } catch (error) {
    console.error("Analyst registration error:", error);
    res.status(500).json({ message: "Registration failed" });
  }
});
```

### Phase 3: Frontend Registration Form

**File: `client/src/pages/analyst-register.tsx`**

```typescript
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, Shield, User, Building, MapPin, DollarSign, Link, FileText, Share2 } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertInvestmentAdvisorSchema } from "@shared/schema";
import type { InsertInvestmentAdvisor } from "@shared/schema";

interface AnalystRegisterProps {
  onBack: () => void;
}

const expertiseOptions = [
  "Equity Research",
  "Portfolio Management",
  "Mutual Funds",
  "Insurance Planning",
  "Tax Planning",
  "Retirement Planning",
  "Estate Planning",
  "Commodity Trading",
  "Derivatives",
  "IPO Analysis",
  "Technical Analysis",
  "Fundamental Analysis",
];

export default function AnalystRegister({ onBack }: AnalystRegisterProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertInvestmentAdvisor>({
    resolver: zodResolver(insertInvestmentAdvisorSchema),
    defaultValues: {
      name: "",
      company: "",
      designation: "Investment Advisor",
      phone: "",
      email: "",
      website: "",
      sebiRegNumber: "",
      expertiseAreas: [],
      address: "",
      specialization: "",
      experience: "",
      location: "",
      consultationFee15Min: 0,
      publishedArticlesUrl: "",
      socialLinks: {},
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: InsertInvestmentAdvisor) => {
      const response = await apiRequest('POST', '/api/analyst/register', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/investment-advisors'] });
      toast({
        title: "Registration Successful",
        description: "Your application has been submitted for review. You'll be notified once verified.",
      });
      setLocation('/sebi-ria');
    },
    onError: (error: Error) => {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertInvestmentAdvisor) => {
    registerMutation.mutate(data);
  };

  // Consistent formatting with Home section
  return (
    <div className="h-full bg-gray-50 dark:bg-neutral-950 flex flex-col">
      {/* Fixed Header - consistent with Home */}
      <div className="flex-shrink-0 bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={onBack} 
            className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800"
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Join as SEBI RIA
          </h1>
          <div className="w-9" />
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-4 space-y-4 max-w-2xl mx-auto">
          
          {/* Hero Card - consistent with Home section cards */}
          <Card className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                Register as SEBI Investment Advisor
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 break-words leading-relaxed">
                Join our verified directory of SEBI registered investment advisors. 
                Connect with investors seeking professional financial guidance.
              </p>
            </CardContent>
          </Card>

          {/* Registration Form */}
          <Card className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Registration Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  
                  {/* Personal Information */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Personal Information
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your full name" 
                                {...field}
                                data-testid="input-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="sebiRegNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SEBI Registration Number *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="INA000000000" 
                                {...field}
                                data-testid="input-sebi-reg"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="+91 9876543210" 
                                {...field}
                                data-testid="input-phone"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address *</FormLabel>
                            <FormControl>
                              <Input 
                                type="email"
                                placeholder="advisor@example.com" 
                                {...field}
                                data-testid="input-email"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Professional Information */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
                      <Building className="h-4 w-4 mr-2" />
                      Professional Information
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="company"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company/Firm Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Your firm name" 
                                {...field}
                                data-testid="input-company"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="experience"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Experience</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g., 5+ years" 
                                {...field}
                                data-testid="input-experience"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Office Address</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter your complete office address"
                              className="break-words"
                              {...field}
                              data-testid="input-address"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City/Location</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., Mumbai, Delhi" 
                              {...field}
                              data-testid="input-location"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Expertise Areas */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      Areas of Expertise
                    </h3>
                    <FormField
                      control={form.control}
                      name="expertiseAreas"
                      render={() => (
                        <FormItem>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {expertiseOptions.map((option) => (
                              <FormField
                                key={option}
                                control={form.control}
                                name="expertiseAreas"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={option}
                                      className="flex flex-row items-start space-x-2 space-y-0"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(option)}
                                          onCheckedChange={(checked) => {
                                            const current = field.value || [];
                                            if (checked) {
                                              field.onChange([...current, option]);
                                            } else {
                                              field.onChange(current.filter((item) => item !== option));
                                            }
                                          }}
                                          data-testid={`checkbox-expertise-${option.toLowerCase().replace(/\s+/g, '-')}`}
                                        />
                                      </FormControl>
                                      <FormLabel className="text-sm font-normal break-words">
                                        {option}
                                      </FormLabel>
                                    </FormItem>
                                  );
                                }}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Consultation & Links */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
                      <DollarSign className="h-4 w-4 mr-2" />
                      Consultation & Resources
                    </h3>
                    
                    <FormField
                      control={form.control}
                      name="consultationFee15Min"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Consultation Fee (15 minutes) ₹</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              placeholder="0"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              data-testid="input-consultation-fee"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website URL</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="https://yourwebsite.com"
                              {...field}
                              data-testid="input-website"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="publishedArticlesUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Published Articles/Research URL</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Link to your published work"
                              {...field}
                              data-testid="input-articles-url"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-6">
                    <Button 
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={registerMutation.isPending}
                      data-testid="button-submit-registration"
                    >
                      {registerMutation.isPending ? "Submitting..." : "Submit Registration"}
                    </Button>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center break-words">
                      Your application will be reviewed and verified before appearing in the directory.
                    </p>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
```

### Phase 4: SEBI RIA Section Formatting Updates

**File: `client/src/pages/sebi-ria-new.tsx` - Add "Join as SEBI registered analyst" link:**

```typescript
// In HeroSection component, add after the main CTA button:
<div className="mt-4">
  <Button 
    variant="outline"
    onClick={() => setLocation('/sebi-ria/register')}
    className="bg-white/10 text-white border-white/30 hover:bg-white/20 px-6 py-2"
    data-testid="button-join-analyst"
  >
    Join as SEBI Registered Analyst
  </Button>
</div>
```

**Ensure consistent text wrapping throughout:**
```typescript
// Apply these classes to all text elements:
className="break-words leading-relaxed text-sm text-gray-600 dark:text-gray-400"

// For cards and containers:
className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800"

// For proper spacing:
className="px-4 py-4 space-y-4"
```

### Phase 5: Routing Updates

**File: `client/src/App.tsx` - Add new route:**

```typescript
import AnalystRegister from "@/pages/analyst-register";

// Add after existing sebi-ria route:
<Route path="/sebi-ria/register">
  {() => <AnalystRegister onBack={() => window.history.back()} />}
</Route>
```

## Security Considerations

### Data Validation
- **SEBI Registration Number**: Implement specific format validation (INA followed by 9 digits)
- **URL Validation**: Ensure all URLs are properly formatted and safe
- **Rate Limiting**: Consider implementing rate limiting for registration endpoint
- **Input Sanitization**: All text inputs sanitized before database storage

### Moderation System
- **Verification Workflow**: New registrations marked as `isVerified: false` initially
- **Admin Review Process**: Manual verification of SEBI credentials before directory inclusion
- **Fraud Prevention**: Unique constraints on SEBI registration numbers

## Testing Strategy

### Unit Tests
- Form validation with various input combinations
- API endpoint validation and error handling
- Database operations for analyst registration

### Integration Tests
- End-to-end registration flow
- Directory listing updates after registration
- Navigation between sections

### User Acceptance Testing
1. Text wrapping consistency verification
2. Form submission with all field types
3. Error handling and validation messages
4. Mobile responsiveness testing
5. Dark mode compatibility

## Deployment Considerations

### Database Migration
- Add new columns to existing `investment_advisors` table
- Ensure backward compatibility with existing advisor records
- Run database push with `npm run db:push` (may require `--force` flag)

### Environment Setup
- No additional environment variables required
- Uses existing database and authentication infrastructure

### Performance Impact
- Minimal impact on existing functionality
- Additional database queries only for registration flow
- Proper indexing on `sebiRegNumber` for uniqueness checks

## Success Metrics

### Technical Metrics
1. **Text Consistency**: All text elements in RIA section wrap properly without overflow
2. **Form Functionality**: Registration form validates and submits successfully
3. **Data Integrity**: New advisor records appear in directory after registration
4. **Error Handling**: Proper error states for validation failures and conflicts
5. **Performance**: Registration flow completes within acceptable time limits

### User Experience Metrics
1. **Navigation Flow**: Seamless transition from directory viewing to registration
2. **Visual Consistency**: RIA section design matches Home section patterns
3. **Mobile Responsiveness**: Form works correctly on mobile devices
4. **Accessibility**: All interactive elements have proper test IDs and labels

## Risk Assessment

### Low Risk
- **Text Formatting Updates**: Simple CSS class applications
- **Form Implementation**: Well-established patterns in codebase
- **Database Schema**: Extensions to existing table structure

### Medium Risk
- **Complex Form Validation**: Multiple field types and business rules
- **SEBI Number Uniqueness**: Proper handling of registration conflicts

### Mitigation Strategies
- **Comprehensive Testing**: Unit and integration tests for all new functionality
- **Gradual Rollout**: Deploy formatting fixes first, then registration features
- **Error Monitoring**: Implement proper logging for registration attempts
- **Backup Strategy**: Database backups before schema modifications

## Implementation Timeline

### Week 1: Foundation (3-4 days)
- [ ] Database schema updates and migration
- [ ] Backend API implementation and testing
- [ ] Storage interface extensions

### Week 2: Frontend Development (4-5 days)
- [ ] Registration form component development
- [ ] Form validation and error handling
- [ ] RIA section formatting updates
- [ ] Navigation and routing integration

### Week 3: Integration & Testing (2-3 days)
- [ ] End-to-end testing
- [ ] Mobile responsiveness verification
- [ ] Security validation
- [ ] Performance testing

### Week 4: Deployment & Monitoring (1-2 days)
- [ ] Production deployment
- [ ] Monitoring setup
- [ ] User acceptance testing
- [ ] Documentation updates

## Conclusion

This implementation plan addresses all requested requirements with high feasibility. The existing codebase provides excellent patterns for forms, validation, and data management. The modular approach ensures minimal risk to existing functionality while delivering a comprehensive analyst registration system that maintains design consistency with the Home section.

The plan leverages proven patterns from the codebase and follows established conventions for styling, validation, and API design. All security considerations have been addressed with proper validation, moderation workflow, and fraud prevention measures.

The phased implementation approach allows for iterative development and testing, ensuring a robust and user-friendly solution that meets all specified requirements.
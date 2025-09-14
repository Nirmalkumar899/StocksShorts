import { useState, useEffect, useMemo } from "react";
import { Calendar, Clock, ChevronLeft, ChevronRight } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format, addDays, startOfDay, addMinutes, isToday, isTomorrow, isThisWeek, isBefore, addHours } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import type { InvestmentAdvisor } from "@shared/schema";

interface TimeSlot {
  time: Date;
  available: boolean;
  reason?: string;
}

interface TimeSlotPickerProps {
  advisor: InvestmentAdvisor;
  duration: "15min" | "30min";
  selectedDate: Date;
  selectedTimeSlot?: Date;
  onDateChange: (date: Date) => void;
  onTimeSlotSelect: (timeSlot: Date) => void;
  className?: string;
}

// Generate time slots for a given date (9 AM to 6 PM, 30-minute intervals)
function generateTimeSlots(date: Date, duration: "15min" | "30min"): Date[] {
  const slots: Date[] = [];
  const startTime = new Date(date);
  startTime.setHours(9, 0, 0, 0); // 9:00 AM
  
  const endTime = new Date(date);
  endTime.setHours(18, 0, 0, 0); // 6:00 PM
  
  const intervalMinutes = duration === "15min" ? 15 : 30;
  
  let currentTime = new Date(startTime);
  while (currentTime < endTime) {
    slots.push(new Date(currentTime));
    currentTime = addMinutes(currentTime, intervalMinutes);
  }
  
  return slots;
}

// Format date for display
function formatDateDisplay(date: Date): string {
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  if (isThisWeek(date)) return format(date, "EEEE");
  return format(date, "MMM d");
}

export default function TimeSlotPicker({
  advisor,
  duration,
  selectedDate,
  selectedTimeSlot,
  onDateChange,
  onTimeSlotSelect,
  className = ""
}: TimeSlotPickerProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = startOfDay(new Date());
    return today;
  });

  // Generate next 7 days for date selection
  const availableDates = useMemo(() => {
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      dates.push(addDays(currentWeekStart, i));
    }
    return dates;
  }, [currentWeekStart]);

  // Fetch existing bookings for the advisor to check availability
  const { data: existingBookings, isLoading } = useQuery({
    queryKey: ['/api/teleconsultations/availability', advisor.id, format(selectedDate, 'yyyy-MM-dd')],
    enabled: !!advisor.id,
  });

  // Generate time slots with availability status
  const timeSlots = useMemo(() => {
    const slots = generateTimeSlots(selectedDate, duration);
    const now = new Date();
    const bookings = existingBookings || [];
    
    return slots.map((slot): TimeSlot => {
      // Check if slot is in the past
      if (isBefore(slot, now)) {
        return {
          time: slot,
          available: false,
          reason: "Past time"
        };
      }

      // Check if slot conflicts with existing bookings
      const conflictingBooking = bookings.find((booking: any) => {
        const bookingStart = new Date(booking.scheduledAt);
        const bookingDuration = booking.duration === "15min" ? 15 : 30;
        const bookingEnd = addMinutes(bookingStart, bookingDuration);
        
        const slotDuration = duration === "15min" ? 15 : 30;
        const slotEnd = addMinutes(slot, slotDuration);
        
        // Check for any overlap
        return (slot < bookingEnd && slotEnd > bookingStart);
      });

      if (conflictingBooking) {
        return {
          time: slot,
          available: false,
          reason: "Already booked"
        };
      }

      // Check advisor's working hours (assuming 9 AM - 6 PM)
      const hour = slot.getHours();
      if (hour < 9 || hour >= 18) {
        return {
          time: slot,
          available: false,
          reason: "Outside working hours"
        };
      }

      return {
        time: slot,
        available: true
      };
    });
  }, [selectedDate, duration, existingBookings]);

  const availableSlots = timeSlots.filter(slot => slot.available);
  const totalSlots = timeSlots.length;

  const handlePreviousWeek = () => {
    const newStart = addDays(currentWeekStart, -7);
    const today = startOfDay(new Date());
    if (!isBefore(newStart, today)) {
      setCurrentWeekStart(newStart);
    }
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, 7));
  };

  const canGoPrevious = !isBefore(addDays(currentWeekStart, -7), startOfDay(new Date()));

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Date Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-lg">
              <Calendar className="h-5 w-5 mr-2" />
              Select Date
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousWeek}
                disabled={!canGoPrevious}
                data-testid="button-previous-week"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextWeek}
                data-testid="button-next-week"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {availableDates.map((date) => {
              const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
              const isPast = isBefore(date, startOfDay(new Date()));
              
              return (
                <Button
                  key={date.toISOString()}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  className="h-auto p-3 flex flex-col"
                  disabled={isPast}
                  onClick={() => onDateChange(date)}
                  data-testid={`button-date-${format(date, 'yyyy-MM-dd')}`}
                >
                  <span className="text-xs font-medium">
                    {formatDateDisplay(date)}
                  </span>
                  <span className="text-xs opacity-70">
                    {format(date, 'MMM d')}
                  </span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Time Slot Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-lg">
              <Clock className="h-5 w-5 mr-2" />
              Available Time Slots
            </CardTitle>
            <Badge variant="outline" className="text-sm">
              {availableSlots.length} of {totalSlots} available
            </Badge>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {format(selectedDate, 'EEEE, MMMM d, yyyy')} • {duration === "15min" ? "15" : "30"} minute slots
          </p>
        </CardHeader>
        <CardContent>
          {/* Loading State */}
          {isLoading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          )}

          {/* No Available Slots */}
          {!isLoading && availableSlots.length === 0 && (
            <Alert>
              <AlertDescription>
                No available time slots for {formatDateDisplay(selectedDate)}. 
                Please select a different date or contact the advisor directly.
              </AlertDescription>
            </Alert>
          )}

          {/* Time Slots Grid */}
          {!isLoading && availableSlots.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {timeSlots.map((slot) => {
                const isSelected = selectedTimeSlot && 
                  format(slot.time, 'yyyy-MM-dd HH:mm') === format(selectedTimeSlot, 'yyyy-MM-dd HH:mm');
                
                return (
                  <Button
                    key={slot.time.toISOString()}
                    variant={isSelected ? "default" : slot.available ? "outline" : "ghost"}
                    size="sm"
                    className={`h-12 ${!slot.available ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={!slot.available}
                    onClick={() => slot.available && onTimeSlotSelect(slot.time)}
                    title={slot.reason}
                    data-testid={`button-timeslot-${format(slot.time, 'HH:mm')}`}
                  >
                    <div className="text-center">
                      <div className="font-medium">
                        {format(slot.time, 'h:mm')}
                      </div>
                      <div className="text-xs opacity-70">
                        {format(slot.time, 'a')}
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          )}

          {/* Legend */}
          {!isLoading && timeSlots.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span className="text-gray-600 dark:text-gray-400">Available</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  <span className="text-gray-600 dark:text-gray-400">Unavailable</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span className="text-gray-600 dark:text-gray-400">Selected</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Advisor Availability Note */}
      <Alert>
        <Clock className="h-4 w-4" />
        <AlertDescription>
          <strong>{advisor.firstName} {advisor.lastName}</strong> is available for consultations 
          Monday to Friday, 9:00 AM to 6:00 PM (IST). 
          {advisor.consultationEnabled ? (
            duration === "15min" && advisor.consultationFee15min ? 
              ` 15-minute consultations: ₹${advisor.consultationFee15min}` :
            duration === "30min" && advisor.consultationFee30min ? 
              ` 30-minute consultations: ₹${advisor.consultationFee30min}` :
              ` Consultation fees apply.`
          ) : (
            " Consultations are currently disabled."
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
}
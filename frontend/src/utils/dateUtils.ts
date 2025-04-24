// Format date to display day of week and date number (e.g., "Mon 24")
export const formatDate = (date: Date): string => {
    return date.toLocaleDateString("en-EN", { weekday: "short", day: "numeric" });
  };
  
  // Get month and year string (e.g., "June 2025")
  export const getMonthYear = (date: Date): string => {
    return date.toLocaleDateString("en-EN", { month: "long", year: "numeric" });
  };
  
  // Format hour (e.g., "08:00")
  export const formatHour = (date: Date): string => {
    return date.toLocaleTimeString("en-EN", { 
      hour: "numeric", 
      minute: "2-digit", 
      hour12: false 
    });
  };
  
  // Get days of the week starting from the given date
  export const getDaysOfWeek = (date: Date): Date[] => {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust to start on Monday
  
    const monday = new Date(date);
    monday.setDate(diff);
  
    const days = [];
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(monday);
      nextDay.setDate(monday.getDate() + i);
      days.push(nextDay);
    }
  
    return days;
  };
  
  // Check if a date is today
  export const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };
  
  // Check if an event is on a specific day
  export const isEventForDay = (eventStart: Date, day: Date): boolean => {
    return (
      eventStart.getDate() === day.getDate() &&
      eventStart.getMonth() === day.getMonth() &&
      eventStart.getFullYear() === day.getFullYear()
    );
  };
  
  // Calculate positioning for an event in the calendar grid
  export const getEventStyle = (start: Date, end: Date) => {
    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;
    const duration = endHour - startHour;
  
    // Position from top (8h = 0px, each hour = 60px)
    const top = (startHour - 8) * 60;
    const height = duration * 60;
  
    return { top, height };
  };
  
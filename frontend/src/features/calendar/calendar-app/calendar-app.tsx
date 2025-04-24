import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { NewEventModal } from "@/components/NewEventModal";
import { eventsData } from "@/features/calendar/calendar-app/data/eventsdata.ts";
import { formatDate, getDaysOfWeek, getMonthYear, isToday } from "@/utils/dateUtils";
import { Event } from "@/features/calendar/calendar-app/data/calendar.ts";
import { toast } from "sonner";
import { useNavigate } from '@tanstack/react-router' // tout en haut de ton fichier
import Reminder from "@/components/reminder"; // Assure-toi que le chemin est correct

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 5, 24)); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [events, setEvents] = useState<Event[]>(eventsData);
  const [view, setView] = useState<"day" | "week" | "month">("week");
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const navigate = useNavigate();
  const [selectedDay, setSelectedDay] = useState(new Date());

  const [reminders, setReminders] = useState<any[]>([
    // Exemple de données de rappels
    { title: "Webinar", description: "Angular", date: "2025-04-23" },
    { title: "Task ", description: "React.js", date: "2025-04-25" },
  ]);
  const [isReminderOpen, setIsReminderOpen] = useState(false);

  const [showReminders, setShowReminders] = useState(false);
  const handleReminderClick = () => {
    setShowReminders(!showReminders);
    setIsReminderOpen(true); // Open the reminder modal if needed
  };
  
  const handleSendEmail = (email: string, subject: string, body: string) => {
    // ici tu fais ce que tu veux avec les valeurs
    console.log("Sending email to:", email, subject, body);
  };
  

  const handleCloseReminder = () => {
    setIsReminderOpen(false);
  };
  const handleDeleteReminder = (index: number) => {
    const updatedReminders = reminders.filter((_, i) => i !== index);
    setReminders(updatedReminders);
  };
  const daysOfWeek = useMemo(() => getDaysOfWeek(currentDate), [currentDate]);
  const hours = useMemo(() => Array.from({ length: 10 }, (_, i) => i + 8), []);
  const getColorByType = (type: string): "blue" | "green" | "pink" => {
    switch (type) {
      case "Webinar":
        return "blue";
      case "Challenges":
        return "green";
      case "task":
        return "pink";
      default:
        return "blue";
    }
  };
  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    if (view === "day") {
      newDate.setDate(currentDate.getDate() - 1);
    } else if (view === "week") {
      newDate.setDate(currentDate.getDate() - 7);
    } else {
      newDate.setMonth(currentDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate);
    if (view === "day") {
      newDate.setDate(currentDate.getDate() + 1);
    } else if (view === "week") {
      newDate.setDate(currentDate.getDate() + 7);
    } else {
      newDate.setMonth(currentDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleAddEvent = (eventData: any) => {
    const startDate = new Date(eventData.date);
    const [startHours, startMinutes] = eventData.startTime.split(":").map(Number);
    startDate.setHours(startHours, startMinutes);

    const endDate = new Date(eventData.date);
    const [endHours, endMinutes] = eventData.endTime.split(":").map(Number);
    endDate.setHours(endHours, endMinutes);

    if (editingEvent) {
      const updatedEvent: Event = {
        ...editingEvent,
        title: eventData.title,
        description: eventData.description,
        start: startDate,
        end: endDate,
        color: getColorByType(eventData.type || ""),
        type: eventData.type,
        link: eventData.link,
        reminder: eventData.reminder,
      };

      setEvents(events.map(event => 
        event.id === editingEvent.id ? updatedEvent : event
      ));
     
      
      setEditingEvent(null);
      toast.success("Event updated successfully");
    } else {
      const newEvent: Event = {
        id: `event-${Date.now()}`,
        title: eventData.title,
        description: eventData.description,
        start: startDate,
        end: endDate,
        color: eventData.color,
        type: eventData.type,
        link: eventData.link,
        reminder: eventData.reminder,
      };
      
      
      setEvents([...events, newEvent]);
      toast.success("Event added successfully");
      if (newEvent.reminder) {
        setReminders([...reminders, newEvent]); // Correct here
      }
    }
  };

  const handleDeleteEvent = (id: string) => {
    setEvents(events.filter(event => event.id !== id));
    toast.success("Event deleted successfully");
  };

  const getDateRangeText = () => {
    if (view === "day") {
      return currentDate.toLocaleDateString("en-US", { 
        day: "numeric", 
        month: "short", 
        year: "numeric" 
      });
    } else if (view === "week") {
      const startDay = daysOfWeek[0];
      const endDay = daysOfWeek[6];
      
      if (startDay.getMonth() === endDay.getMonth()) {
        return `${startDay.getDate()} - ${endDay.getDate()} ${startDay.toLocaleDateString("en-US", { month: "short" })} ${startDay.getFullYear()}`;
      }
      
      return `${startDay.getDate()} ${startDay.toLocaleDateString("en-US", { month: "short" })} - ${endDay.getDate()} ${endDay.toLocaleDateString("en-US", { month: "short" })} ${startDay.getFullYear()}`;
    } else {
      return getMonthYear(currentDate);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEvent(null);
  };
  const handleEventClick = (event: Event) => {
    // Rediriger selon le type de l'événement
    if (event.type === "Webinar") {
      window.open(event.link, "_blank"); // ouvre un lien Zoom par exemple
    } else if (event.type === "Challenges") {
      navigate({ to: '/challenges' });
    } else if (event.type === "task") {
      navigate({ to: '/tests' });
    }
  };
  
  
 return (
  <div className="rounded-3xl flex flex-col h-screen bg-white">
    <header className="rounded-3xl border-b p-4 shadow-sm">
      <div className="rounded-3xl flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Calendar</h1>
        <div className="flex items-center gap-2" />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="text-sm bg-black text-white hover:bg-gray-200 rounded-3xl">
            All scheduled
          </Button>
          <div>
            <Button size="sm" variant="outline" className="rounded-3xl" onClick={handleReminderClick}>
              Reminder
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative rounded-3xl">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground rounded-3xl" />
            <Input type="search" placeholder="Search..." className="w-[200px] pl-8 rounded-3xl" />
          </div>
          <Button size="sm" className="rounded-3xl" onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Event
          </Button>
        </div>
      </div>
    </header>

    <div className="flex rounded-3xl items-center justify-between p-4 border-b">
      <div className="flex items-center gap-2 rounded-3xl">
        <h2 className="text-lg font-medium">{getMonthYear(currentDate)}</h2>
        <Button size="sm" variant="outline" className="text-sm bg-gray-100 rounded-3xl hover:bg-gray-200" onClick={() => setCurrentDate(new Date())}>
          Today
        </Button>
      </div>

      <div className="flex items-center rounded-3xl gap-2">
      <Tabs

  value={view}
  onValueChange={(value) => {
    setView(value as "day" | "week" | "month");
    if (value === "day") setSelectedDay(currentDate);
  }}
  className="w-auto rounded-3xl"
>
  <TabsList   className=" rounded-3xl"
  >
    <TabsTrigger className="rounded-3xl" value="day">Day</TabsTrigger>
    <TabsTrigger className="rounded-3xl" value="week">Week</TabsTrigger>
    <TabsTrigger className="rounded-3xl" value="month">Month</TabsTrigger>
  </TabsList>
</Tabs>

        <div className="flex items-center gap-1 ml-4">
          <Button className="rounded-3xl" size="icon" variant="outline" onClick={goToPrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button className="rounded-3xl" size="icon" variant="outline" onClick={goToNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="text-sm px-2">{getDateRangeText()}</span>
        </div>
      </div>
    </div>

<div className="flex flex-1 overflow-auto">
  {view === "week" || view === "day" ? (
    <>
      <div className="flex flex-1 overflow-auto bg-muted rounded-xl shadow-md p-2">
  <div className="w-16 flex-shrink-0 border-r bg-background">
    <div className="h-12 border-b" />
    {hours.map((hour) => (
      <div key={hour} className="relative h-[60px] border-b text-xs text-muted-foreground px-2">
        <span className="absolute -top-1 left-2">{`${hour}:00`}</span>
      </div>
    ))}
  </div>

  <div className="flex flex-1">
    {(view === "day" ? [selectedDay] : daysOfWeek).map((day, index) => (
      <div key={index} className="flex-1 min-w-[140px] border-r last:border-r-0 bg-card rounded-lg">
        <div
          className={cn(
            "h-12 border-b px-3 flex flex-col justify-center",
            isToday(day) && "bg-accent text-accent-foreground font-semibold"
          )}
        >
          <div className="text-sm">{formatDate(day).split(" ")[0]}</div>
          <div className="text-xs">{formatDate(day).split(" ")[1]}</div>
        </div>

        <div className="relative h-[600px]">
          {hours.map((hour) => (
            <div key={hour} className="absolute w-full h-[60px] border-b border-dashed" style={{ top: (hour - 8) * 60 }} />
          ))}

          {events
            .filter((event) => event.start.toDateString() === day.toDateString())
            .map((event, idx) => {
              const startHour = event.start.getHours() + event.start.getMinutes() / 60;
              const endHour = event.end.getHours() + event.end.getMinutes() / 60;
              const top = (startHour - 8) * 60;
              const height = (endHour - startHour) * 60;

              return (
                <div
                  key={idx}
                  className="absolute left-1 right-1 p-2 rounded-xl text-xs font-medium text-white z-10 shadow-sm"
                  style={{
                    top: `${top}px`,
                    height: `${height}px`,
                    backgroundColor:
                      event.color === "blue"
                        ? "#3b82f6"
                        : event.color === "green"
                        ? "#22c55e"
                        : event.color === "pink"
                        ? "#ec4899"
                        : "#6b7280",
                  }}
                  onClick={() => handleEventClick(event)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="truncate">{event.title}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingEvent(event);
                          setIsModalOpen(true);
                        }}
                        className="hover:text-gray-200 text-black"
                        title="Edit"
                      >
                                                    <i className="fa fa-pencil" aria-hidden="true"></i>
 
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteEvent(event.id);
                        }}
                        className="hover:text-gray-200 text-black"
                        title="Delete"
                      >
                                                    <i className="bi bi-trash"></i>
 
                        
                      </button>
                    </div>
                  </div>
                  <div className="text-[10px] truncate text-muted-foreground">{event.description}</div>
                </div>
              );
            })}
        </div>
      </div>
    ))}
  </div>
</div>

    </>
  ) : (
    // Vue "mois" inchangée
    <div className="flex flex-1 overflow-auto">
  <div className="grid grid-cols-7 gap-px w-full min-h-[600px] bg-muted p-2 rounded-xl">
    {Array.from({ length: 42 }, (_, i) => {
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const startDay = firstDayOfMonth.getDay();
      const day = new Date(currentDate.getFullYear(), currentDate.getMonth(), i - startDay + 1);

      const isCurrentMonth = day.getMonth() === currentDate.getMonth();
      const isToday = day.toDateString() === new Date().toDateString();

      return (
        <div
          key={i}
          className={cn(
            "flex flex-col justify-between bg-background p-2 rounded-lg border shadow-sm min-h-[100px]",
            isToday && "border-blue-800 ring-2 ring-blue-400/30",
            !isCurrentMonth && "opacity-50"
          )}
        >
          <div>
            <div className="text-[10px] font-semibold text-muted-foreground">
              {day.toLocaleDateString(undefined, { weekday: "short" })}
            </div>
            <div className="text-sm font-bold">{day.getDate()}</div>
          </div>

          <div className="flex flex-col gap-1 mt-2">
            {events
              .filter((event) => event.start.toDateString() === day.toDateString())
              .slice(0, 2)
              .map((event) => (
                <div
                  key={event.id}
                  onClick={() => handleEventClick(event)}
                  className={cn(
                    "truncate rounded px-2 py-0.5 text-white text-[11px] cursor-pointer transition-colors",
                    {
                      "bg-blue-500": event.color === "blue",
                      "bg-green-500": event.color === "green",
                      "bg-pink-500": event.color === "pink",
                      "bg-gray-500": !["blue", "green", "pink"].includes(event.color),
                    }
                  )}
                >
                  {event.title}
                </div>
              ))}
            {events.filter((event) => event.start.toDateString() === day.toDateString()).length > 2 && (
              <span className="text-muted-foreground text-[10px]">+ more</span>
            )}
          </div>
        </div>
      );
    })}
  </div>
</div>

  )}
</div>


    <NewEventModal 
      isOpen={isModalOpen} 
      onClose={handleCloseModal} 
      onSave={handleAddEvent}
      initialData={editingEvent}
    />

    {isReminderOpen && (
      <Reminder
        reminders={reminders}
        onClose={handleCloseReminder}
        onDelete={handleDeleteReminder}
        sendEmail={handleSendEmail}
      />
    )}
  </div>
);

};

export default Calendar;

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

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 5, 24)); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [events, setEvents] = useState<Event[]>(eventsData);
  const [view, setView] = useState<"day" | "week" | "month">("week");
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

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

  return (
    <div className="rounded-3xl flex flex-col h-screen bg-white">
      <header className="rounded-3xl border-b p-4 shadow-sm">
        <div className="rounded-3xl flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">Calendar</h1>
          <div className="flex items-center gap-2" />
        </div>

        <div className="flex items-center justify-between">
          <Button size="sm" variant="outline" className="text-sm bg-black text-white hover:bg-gray-200">
            All scheduled
          </Button>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Search..." className="w-[200px] pl-8" />
            </div>
            <Button size="sm" onClick={() => setIsModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Event
            </Button>
          </div>
        </div>
      </header>

      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-medium">{getMonthYear(currentDate)}</h2>
          <Button size="sm" variant="outline" className="text-sm bg-gray-100 hover:bg-gray-200" onClick={() => setCurrentDate(new Date())}>
            Today
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Tabs value={view} onValueChange={(value) => setView(value as "day" | "week" | "month")} className="w-auto">
            <TabsList>
              <TabsTrigger value="day">Day</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-1 ml-4">
            <Button size="icon" variant="outline" onClick={goToPrevious}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="outline" onClick={goToNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <span className="text-sm px-2">{getDateRangeText()}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-auto">
        <div className="w-16 flex-shrink-0 border-r bg-white">
          <div className="h-12 border-b"></div>
          {hours.map((hour) => (
            <div key={hour} className="relative h-[60px] border-b text-xs text-gray-500">
              <span className="absolute -top-2 left-2">{`${hour}:00`}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-1">
          {daysOfWeek.map((day, dayIndex) => (
            <div key={dayIndex} className="flex-1 min-w-[120px] border-r last:border-r-0">
              <div className={cn("h-12 border-b px-2 flex flex-col justify-center", isToday(day) ? "bg-blue-50" : "")}>
                <div className="text-sm font-medium">{formatDate(day).split(" ")[0]}</div>
                <div className={cn("text-sm", isToday(day) ? "font-bold text-blue-600" : "")}>
                  {formatDate(day).split(" ")[1]}
                </div>
              </div>

              <div className="relative h-[600px]">
                {hours.map((hour) => (
                  <div 
                    key={hour} 
                    className="absolute w-full h-[60px] border-b" 
                    style={{ top: (hour - 8) * 60 }}
                  ></div>
                ))}

                {events
                  .filter((event) => event.start.toDateString() === day.toDateString())
                  .map((event, index) => {
                    const startHour = event.start.getHours() + event.start.getMinutes() / 60;
                    const endHour = event.end.getHours() + event.end.getMinutes() / 60;
                    const top = (startHour - 8) * 60;
                    const height = (endHour - startHour) * 60;

                    return (
                      <div
                        key={index}
                        className="absolute left-1 right-1 p-1 rounded-md text-xs text-white cursor-pointer z-10"
                        style={{
                          top: `${top}px`,
                          height: `${height}px`,
                          backgroundColor:
                          event.color === "blue"
                            ? "#D9DFFF"
                            : event.color === "green"
                            ? "#CDEAC0"
                            : event.color === "pink"
                            ? "#F4CFDF"
                            : "#6b7280",
                                                }}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <div className="font-semibold truncate">{event.title}</div>
                          <div className="flex gap-1">
                          <button
  onClick={() => {
    setEditingEvent(event);
    setIsModalOpen(true);
  }}
  className="text-black hover:text-gray-500 text-xs"
  title="Edit"
>
  <i className="fa fa-pencil" aria-hidden="true"></i>
</button>

<button
  onClick={() => handleDeleteEvent(event.id)}
  className="text-black hover:text-gray-500 text-xs"
  title="Delete"
>
  <i className="bi bi-trash"></i>
</button>

                          </div>
                        </div>
                        <div className="text-[10px] truncate">{event.description}</div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <NewEventModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onSave={handleAddEvent}
        initialData={editingEvent}
      />
    </div>
  );
};

export default Calendar;

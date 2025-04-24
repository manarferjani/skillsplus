import { Event } from "@/features/calendar/calendar-app/data/calendar.ts";

// Sample event data
export const eventsData: Event[] = [
    {
        id: "3",
        title: "Formation Vue.js",
        type: "Webinar",
        link: "https://zoom.us/j/1234567890",
        start: new Date("2025-04-25T10:00:00"),
        end: new Date("2025-04-25T11:00:00"),
        description: "A comprehensive webinar on Vue.js basics.",  // Add a description
        color: "blue",  // Add a color (you can adjust this based on event type or preference)
        reminder: true  // Add a reminder (this can be a boolean or a time value depending on your design)
    }
];

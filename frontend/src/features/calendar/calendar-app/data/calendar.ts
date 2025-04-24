export type EventColor = "blue" | "green" |  "pink";
export type EventType = "Webinar" | "Challenges" | "task";

export type Event = {
  id: string;
  title: string;
  description: string;
  start: Date;
  end: Date;
  color: EventColor;  // Change to EventColor type
  type?: EventType;  // type remains optional
  link: string;
  reminder: boolean;  
  pdfUrl?: string;  // Add the pdfUrl property
  // reminder should be a boolean, not string
};

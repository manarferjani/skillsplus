import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EventColor, EventType, Event } from "@/features/calendar/calendar-app/data/calendar.ts";

interface NewEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: any) => void;
  initialData?: Event | null;
}

export function NewEventModal({ isOpen, onClose, onSave, initialData }: NewEventModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    startTime: "09:00",
    endTime: "10:00",
    color: "blue" as EventColor,
    type: "Webinar" as EventType,
    link: "",
    reminder: false,
    pdfUrl: "", // Ajout du champ pour l'URL du PDF
  });

  // Fonction pour déterminer la couleur en fonction du type d'événement
  const getColorByType = (type: EventType | undefined): EventColor => {
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

  // Update form data when initial event data is provided (for editing purposes)
  useEffect(() => {
    if (initialData) {
      const date = initialData.start.toISOString().split("T")[0];
      const startTime = `${String(initialData.start.getHours()).padStart(2, '0')}:${String(initialData.start.getMinutes()).padStart(2, '0')}`;
      const endTime = `${String(initialData.end.getHours()).padStart(2, '0')}:${String(initialData.end.getMinutes()).padStart(2, '0')}`;
      
      setFormData({
        title: initialData.title || "",
        description: initialData.description || "",
        date,
        startTime,
        endTime,
        color: getColorByType(initialData.type),
        type: initialData.type || "Webinar",
        link: initialData.link || "",
        reminder: initialData.reminder || false,
        pdfUrl: initialData.pdfUrl || "", // Chargez l'URL du PDF si elle est présente
      });
    }
  }, [initialData, isOpen]);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle event type selection change
  const handleTypeChange = (value: string) => {
    const newType = value as EventType;
    setFormData((prev) => ({ 
      ...prev, 
      type: newType,
      color: getColorByType(newType)
    }));
  };

  // Handle reminder switch change
  const handleReminderChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, reminder: checked }));
  };

  // Handle PDF URL input change
  const handlePdfUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, pdfUrl: e.target.value }));
  };

  // Submit form data
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Création des dates complètes
    const startDateTime = new Date(`${formData.date}T${formData.startTime}`);
    const endDateTime = new Date(`${formData.date}T${formData.endTime}`);
    
    // Vérification que l'heure de fin est après l'heure de début
    if (endDateTime <= startDateTime) {
      alert("L'heure de fin doit être après l'heure de début");
      return;
    }

    // Préparation de l'objet événement à sauvegarder
    const eventToSave = {
      ...formData,
      start: startDateTime,
      end: endDateTime,
      id: initialData?.id || crypto.randomUUID(),
    };

    onSave(eventToSave);
    onClose();
    resetForm();
  };

  // Reset the form to its initial state
  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
      startTime: "09:00",
      endTime: "10:00",
      color: "blue",
      type: "Webinar",
      link: "",
      reminder: false,
      pdfUrl: "", // Reset du champ PDF URL
    });
  };

  // Modal title and submit button text based on whether we're editing or adding a new event
  const dialogTitle = initialData ? "Edit Event" : "Add New Event";
  const submitButtonText = initialData ? "Update" : "Save Event";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className=" sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid rounded-3xl  gap-4 py-4">
            {/* Event Title */}
            <div className="space-y-2 ">
              <Label htmlFor="title">Event Title</Label>
              <Input
                id="title"
                className="rounded-3xl"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter event title"
                required
              />
            </div>

            {/* Event Description */}
            <div className=" space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                className="rounded-3xl"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter event description"
                rows={3}
              />
            </div>

            {/* Date and Event Type */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  className="rounded-3xl"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2 rounded-3xl">
                <Label htmlFor="type" >Event Type</Label>
                <Select value={formData.type} onValueChange={handleTypeChange}>
                  <SelectTrigger className="rounded-3xl"                  >
                    <SelectValue  className="rounded-3xl" placeholder="Select event type"  />
                  </SelectTrigger>
                  <SelectContent className="rounded-3xl"                  >
                    <SelectItem className="rounded-3xl" value="Webinar">Webinar</SelectItem>
                    <SelectItem  className="rounded-3xl" value="Challenges">Challenges</SelectItem>
                    <SelectItem  className="rounded-3xl" value="task">task</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Start and End Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  className="rounded-3xl"

                  name="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  className="rounded-3xl"
                  name="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Meeting Link */}
            <div className="space-y-2">
              <Label htmlFor="link">Meeting Link</Label>
              <Input
                id="link"
                className="rounded-3xl"
                name="link"
                value={formData.link}
                onChange={handleChange}
                placeholder="Enter meeting link"
              />
            </div>

            {/* PDF URL */}
            <div className="space-y-2">
              <Label htmlFor="pdfUrl">PDF URL</Label>
              <Input
                id="pdfUrl"
                className="rounded-3xl"
                name="pdfUrl"
                type="url"
                value={formData.pdfUrl}
                onChange={handlePdfUrlChange}
                placeholder="Enter PDF URL"
              />
            </div>

            {/* Reminder Switch */}
            <div className="flex items-center space-x-2">
              <Switch
                id="reminder"
                checked={formData.reminder}
                onCheckedChange={handleReminderChange}
              />
              <Label htmlFor="reminder">Enable reminder</Label>
            </div>
          </div>

          {/* Dialog Footer */}
          <DialogFooter>
            <Button className="rounded-3xl" variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button className="rounded-3xl" type="submit">{submitButtonText}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

type Reminder = {
  title: string;
  description: string;
  date: string; // ISO format
};

type ReminderProps = {
  reminders: Reminder[];
  onClose: () => void;
  onDelete: (index: number) => void;
  sendEmail: (email: string, subject: string, body: string) => void;
};

const Reminder = ({ reminders, onClose, onDelete, sendEmail }: ReminderProps) => {
  useEffect(() => {
    const now = new Date().getTime();

    reminders.forEach((reminder) => {
      const reminderTime = new Date(reminder.date).getTime();
      const delay = reminderTime - now;

      if (delay > 0) {
        setTimeout(() => {
          sendEmail("meriemlaouiti@gmail.com", reminder.title, reminder.description);
          console.log("Email sent for:", reminder.title);
        }, delay);
      } else {
        console.log("⏰ Reminder already passed:", reminder.title);
      }
    });
  }, [reminders, sendEmail]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-lg p-6 space-y-6">
        <div className="flex justify-between items-center border-b pb-2">
          <h2 className="text-2xl font-semibold text-zinc-800 dark:text-white">📅 Reminders</h2>
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-zinc-500 hover:text-red-600"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <ul className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
          {reminders.length === 0 ? (
            <p className="text-center text-zinc-500">No reminders available.</p>
          ) : (
            reminders.map((reminder, index) => (
              <li
                key={index}
                className="border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-zinc-800 dark:text-white">{reminder.title}</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">{reminder.description}</p>
                    <p className="text-xs text-zinc-400 mt-1">
                      {new Date(reminder.date).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => onDelete(index)}
                    className="text-red-500 hover:bg-red-100 dark:hover:bg-red-800 rounded-full"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))
          )}
        </ul>

        <Button
          onClick={onClose}
          className="w-full rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-sm py-2"
        >
          Close
        </Button>
      </div>
    </div>
  );
};

export default Reminder;

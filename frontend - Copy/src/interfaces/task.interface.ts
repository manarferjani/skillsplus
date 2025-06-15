export interface Task {
  label: string;
  _id: string;               // correspond à _id MongoDB, type string
  title: string;
  description: string;
  iconColor: string;        // ex: 'bg-gray-500'
  iconType: string;         // ex: 'circle'
  completed: boolean;
  dueDate: 'today' | 'tomorrow' | 'later';
  priority: 'Low' | 'Medium' | 'High';
  userId: string;           // id utilisateur sous forme string
  createdAt?: string;       // timestamp ISO string (optionnel)
  updatedAt?: string;       // timestamp ISO string (optionnel)
}
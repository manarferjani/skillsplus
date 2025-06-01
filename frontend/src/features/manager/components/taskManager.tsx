import { useState } from "react"
import { ChevronDown, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import TaskItem from "./taskItem"
import CreateTaskModal from "./taskModal"

// Définir le type pour un item de tâche
interface Task {
  id: number
  title: string
  description: string
  iconColor: string
  iconType: string
  completed: boolean
}

export default function TaskManager() {
  const [activeTab, setActiveTab] = useState<"today" | "tomorrow">("today")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 1,
      title: "BrightBridge - Website Design",
      description: "Design a framer website with modern templates",
      iconColor: "bg-orange-500",
      iconType: "bookmark",
      completed: false,
    },
    {
      id: 2,
      title: "Github - Upload Dev Files & Images",
      description: "Collaborate with Developers to handle the SaaS Project.",
      iconColor: "bg-black",
      iconType: "github",
      completed: false,
    },
    {
      id: 3,
      title: "9TDesign - Mobile App Prototype",
      description: "Ready prototype for testing user in this week.",
      iconColor: "bg-red-400",
      iconType: "map-pin",
      completed: false,
    },
    {
      id: 4,
      title: "Horizon - Dashboard Design",
      description: "Design a dashboard comfortable with Vision Pro",
      iconColor: "bg-indigo-500",
      iconType: "circle",
      completed: false,
    },
  ])

  const handleCreateTask = (newTaskData: {
    title: string
    status: string
    label: string
    priority: string
  }) => {
    // Créer une nouvelle tâche avec les données du formulaire
    const newTask: Task = {
      id: tasks.length + 1,
      title: newTaskData.title,
      description: `Status: ${newTaskData.status} | Label: ${newTaskData.label} | Priority: ${newTaskData.priority}`,
      iconColor: getIconColor(newTaskData.label),
      iconType: getIconType(newTaskData.label),
      completed: false,
    }
    
    setTasks([...tasks, newTask])
    setIsModalOpen(false)
  }

  // Helper functions pour déterminer l'icône et la couleur en fonction du label
  const getIconColor = (label: string) => {
    switch(label) {
      case 'Documentation': return 'bg-blue-500'
      case 'Feature': return 'bg-green-500'
      case 'Bug': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getIconType = (label: string) => {
    switch(label) {
      case 'Documentation': return 'book'
      case 'Feature': return 'star'
      case 'Bug': return 'bug'
      default: return 'circle'
    }
  }

  return (
    <div className="bg-[#ffccd5] rounded-3xl p-6 shadow-sm h-full min-h-[320px]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">My Tasks</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="flex space-x-2 mb-6">
        <button
          onClick={() => setActiveTab("today")}
          className={cn(
            "px-5 py-2 rounded-full text-sm font-medium transition-colors",
            activeTab === "today" ? "bg-gray-900 text-white" : "bg-white text-gray-700 border border-gray-200",
          )}
        >
          Today
        </button>
        <button
          onClick={() => setActiveTab("tomorrow")}
          className={cn(
            "px-5 py-2 rounded-full text-sm font-medium transition-colors",
            activeTab === "tomorrow" ? "bg-gray-900 text-white" : "bg-white text-gray-700 border border-gray-200",
          )}
        >
          Tomorrow
        </button>
      </div>

      <div className="mb-6">
        <button className="w-full flex items-center justify-between bg-gray-100 rounded-full px-4 py-3 text-sm font-medium">
          <div className="flex items-center">
            <span className="bg-gray-900 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center mr-2">
              {tasks.length}
            </span>
            <span>On Going Tasks</span>
          </div>
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        {tasks.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
      </div>

      <CreateTaskModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateTask={handleCreateTask}
      />
    </div>
  )
}
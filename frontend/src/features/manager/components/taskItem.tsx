import { Bookmark, Circle, Github, MapPin } from "lucide-react"
import { useState } from "react"

interface TaskProps {
  task: {
    id: number
    title: string
    description: string
    iconColor: string
    iconType: string
    completed: boolean
  }
}

export default function TaskItem({ task }: TaskProps) {
  const [completed, setCompleted] = useState(task.completed)

  const getIcon = () => {
    switch (task.iconType) {
      case "bookmark":
        return <Bookmark className="w-4 h-4 text-white" />
      case "github":
        return <Github className="w-4 h-4 text-white" />
      case "map-pin":
        return <MapPin className="w-4 h-4 text-white" />
      case "circle":
      default:
        return <Circle className="w-4 h-4 text-white" />
    }
  }

  return (
    <div className="flex items-start p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
      <div className={`${task.iconColor} w-8 h-8 rounded-full flex items-center justify-center mr-3 flex-shrink-0`}>
        {getIcon()}
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-gray-900">{task.title}</h3>
        <p className="text-sm text-gray-500 mt-1">{task.description}</p>
      </div>
      <button
        onClick={() => setCompleted(!completed)}
        className={`w-6 h-6 rounded-full border ${
          completed ? "bg-green-500 border-green-500" : "border-gray-300"
        } flex items-center justify-center flex-shrink-0`}
      >
        {completed && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        )}
      </button>
    </div>
  )
}

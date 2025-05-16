import { X } from "lucide-react"
import { useState, useEffect } from "react"

interface CreateTaskModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateTask: (task: {
    title: string
    status: string
    label: string
    priority: string
  }) => void
}

export default function CreateTaskModal({ isOpen, onClose, onCreateTask }: CreateTaskModalProps) {
  const [newTask, setNewTask] = useState({
    title: "",
    status: "",
    label: "",
    priority: ""
  })

  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true)
    }
  }, [isOpen])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setNewTask(prev => ({ ...prev, [name]: value }))
  }

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setNewTask(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCreateTask(newTask)
    handleClose()
  }

  const handleClose = () => {
    setIsAnimating(false)
    setTimeout(() => {
      onClose()
      setNewTask({
        title: "",
        status: "",
        label: "",
        priority: ""
      })
    }, 300)
  }

  if (!isOpen && !isAnimating) return null

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end transition-opacity duration-300 ${
      isAnimating ? 'opacity-100' : 'opacity-0'
    }`}>
      <div className={`bg-[#ffe5ec] w-full max-w-sm h-full p-6 overflow-y-auto transform transition-transform duration-300 ease-in-out ${
        isAnimating ? 'translate-x-0' : 'translate-x-full'
      } rounded-l-3xl`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Create Task</h2>
          <button 
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-[#ffc8dd] flex items-center justify-center hover:bg-[#ffb3d1] transition-colors"
          >
            <X className="w-4 h-4 text-gray-700" />
          </button>
        </div>

        <p className="text-gray-700 mb-6">
          Add a new task by providing necessary info. Click save when you're done.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-800">Title</label>
            <input
              type="text"
              name="title"
              value={newTask.title}
              onChange={handleInputChange}
              placeholder="Enter a title"
              className="w-full px-3 py-2 border border-[#ffb3d1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff8fab] bg-[#ffe5ec]"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-800">Status</label>
            <select
              name="status"
              value={newTask.status}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-[#ffb3d1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff8fab] bg-[#ffe5ec]"
              required
            >
              <option value="">Select status</option>
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-800">Label</label>
            <div className="space-y-2">
              <label className="flex items-center text-gray-800">
                <input
                  type="radio"
                  name="label"
                  value="Documentation"
                  checked={newTask.label === "Documentation"}
                  onChange={handleRadioChange}
                  className="mr-2 w-4 h-4 border border-[#ffb3d1] bg-[#ffe5ec] checked:bg-[#ff8fab] focus:ring-[#ff8fab]"
                />
                Documentation
              </label>
              <label className="flex items-center text-gray-800">
                <input
                  type="radio"
                  name="label"
                  value="Feature"
                  checked={newTask.label === "Feature"}
                  onChange={handleRadioChange}
                  className="mr-2 w-4 h-4 border border-[#ffb3d1] bg-[#ffe5ec] checked:bg-[#ff8fab] focus:ring-[#ff8fab]"
                />
                Feature
              </label>
              <label className="flex items-center text-gray-800">
                <input
                  type="radio"
                  name="label"
                  value="Bug"
                  checked={newTask.label === "Bug"}
                  onChange={handleRadioChange}
                  className="mr-2 w-4 h-4 border border-[#ffb3d1] bg-[#ffe5ec] checked:bg-[#ff8fab] focus:ring-[#ff8fab]"
                />
                Bug
              </label>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-gray-800">Priority</label>
            <div className="space-y-2">
              <label className="flex items-center text-gray-800">
                <input
                  type="radio"
                  name="priority"
                  value="High"
                  checked={newTask.priority === "High"}
                  onChange={handleRadioChange}
                  className="mr-2 w-4 h-4 border border-[#ffb3d1] bg-[#ffe5ec] checked:bg-[#ff8fab] focus:ring-[#ff8fab]"
                />
                High
              </label>
              <label className="flex items-center text-gray-800">
                <input
                  type="radio"
                  name="priority"
                  value="Medium"
                  checked={newTask.priority === "Medium"}
                  onChange={handleRadioChange}
                  className="mr-2 w-4 h-4 border border-[#ffb3d1] bg-[#ffe5ec] checked:bg-[#ff8fab] focus:ring-[#ff8fab]"
                />
                Medium
              </label>
              <label className="flex items-center text-gray-800">
                <input
                  type="radio"
                  name="priority"
                  value="Low"
                  checked={newTask.priority === "Low"}
                  onChange={handleRadioChange}
                  className="mr-2 w-4 h-4 border border-[#ffb3d1] bg-[#ffe5ec] checked:bg-[#ff8fab] focus:ring-[#ff8fab]"
                />
                Low
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-[#ff8fab] rounded-3xl font-medium hover:bg-[#ffb3d1] transition-colors text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#ff8fab] text-white rounded-3xl font-medium hover:bg-[#ff7096] transition-colors"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
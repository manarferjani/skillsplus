import { useEffect, useState } from 'react'
import { Task } from '@/interfaces/task.interface'
import TaskService from '@/services/task.service'
import { ChevronDown, Plus, Book, Star, Bug, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'
import TaskItem from './taskItem'
import CreateTaskModal from './taskModal'

export default function TaskManager() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'today' | 'tomorrow'>('today')
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [priorityFilter, setPriorityFilter] = useState<
    'all' | 'High' | 'Medium' | 'Low'
  >('all')

  // Récupérer les tâches depuis le backend
  const fetchTasks = async () => {
    setLoading(true)
    try {
      const userTasks = await TaskService.getUserTasks()
      setTasks(userTasks)
    } catch (error) {
      console.error(error)
      // tu peux aussi afficher un toast ou message d'erreur ici
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    const filtered = tasks.filter(
      (task) =>
        task.dueDate === (activeTab === 'today' ? 'today' : 'tomorrow') &&
        (priorityFilter === 'all' || task.priority === priorityFilter)
    )
    setFilteredTasks(filtered)
  }, [tasks, activeTab, priorityFilter])

  useEffect(() => {
    fetchTasks()
  }, [])

  const handleCreateTask = async (newTaskData: {
    title: string
    status: string
    description: string
    label: string
    priority: string
    dueDate: string
  }) => {
    try {
      const createdTask = await TaskService.createTask(newTaskData)

      await fetchTasks()

      // Forcer le recalcul des tâches filtrées
      setFilteredTasks((prevFiltered) => {
        const matchesTab =
          newTaskData.dueDate === (activeTab === 'today' ? 'today' : 'tomorrow')
        return matchesTab ? [...prevFiltered, createdTask] : prevFiltered
      })

      setIsModalOpen(false)
    } catch (error) {
      console.error('Erreur création:', error)
      // Optionnel: Afficher un message d'erreur
    }
  }
  const handleDeleteTask = async (taskId: string) => {
    try {
      // Mise à jour optimiste de l'UI
      setTasks((prevTasks) => prevTasks.filter((task) => task._id !== taskId))

      // Appel API
      await TaskService.deleteTask(taskId)

      // Rechargement de confirmation
      await fetchTasks()
    } catch (error) {
      console.error('Delete failed:', error)
      // Annulation de la mise à jour optimiste en cas d'erreur
      await fetchTasks()
    }
  }

  // Helper functions pour déterminer l'icône et la couleur en fonction du label
  const getIconColor = (label: string) => {
    switch (label) {
      case 'Test creating':
        return 'bg-blue-500'
      case 'Test review':
        return 'bg-green-500'
      case 'Bug':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getIconType = (label: string) => {
    switch (label) {
      case 'Test creating':
        return Book
      case 'Test review':
        return Star
      case 'Bug':
        return Bug
      default:
        return Circle
    }
  }

  return (
    <div className='h-full min-h-[320px] rounded-3xl bg-[#ffccd5] p-6 shadow-sm'>
      <div className='mb-6 flex items-center justify-between'>
        <h1 className='text-xl font-bold'>My Tasks</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className='flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200'
        >
          <Plus className='h-5 w-5' />
        </button>
      </div>

      <div className='mb-6 flex space-x-2'>
        <button
          onClick={() => setActiveTab('today')}
          className={cn(
            'rounded-full px-5 py-2 text-sm font-medium transition-colors',
            activeTab === 'today'
              ? 'bg-gray-900 text-white'
              : 'border border-gray-200 bg-white text-gray-700'
          )}
        >
          Today
        </button>
        <button
          onClick={() => setActiveTab('tomorrow')}
          className={cn(
            'rounded-full px-5 py-2 text-sm font-medium transition-colors',
            activeTab === 'tomorrow'
              ? 'bg-gray-900 text-white'
              : 'border border-gray-200 bg-white text-gray-700'
          )}
        >
          Tomorrow
        </button>
      </div>

      <div className='mb-6'>
        <button className='flex w-full items-center justify-between rounded-full bg-gray-100 px-4 py-3 text-sm font-medium'>
          <div className='flex items-center'>
            <span className='mr-2 flex h-5 w-5 items-center justify-center rounded-full bg-gray-900 text-xs text-white'>
              {filteredTasks.length} {/* Affiche le compte filtré */}
            </span>
            <span>On Going Tasks</span>
          </div>
          <ChevronDown className='h-4 w-4' />
        </button>
      </div>

      <div className='space-y-4'>
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <TaskItem
              key={task._id}
              task={task}
              iconColor={getIconColor(task.label)}
              iconType={getIconType(task.label)}
              onDelete={handleDeleteTask}
            />
          ))
        ) : (
          <div className='py-4 text-center text-gray-500'>
            No tasks for {activeTab}
          </div>
        )}
      </div>

      <CreateTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateTask={handleCreateTask}
      />
    </div>
  )
}

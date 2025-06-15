import { useState } from 'react'
import { Task } from '@/interfaces/task.interface'
import { motion, AnimatePresence } from 'framer-motion'
import { Bookmark, Circle, Github, MapPin } from 'lucide-react'

interface TaskProps {
  task: Task
  iconColor: string
  iconType: React.ElementType // Ce type correspond à un composant React comme Book, Star, etc.
  onDelete: (taskId: string) => Promise<void>
}

export default function TaskItem({
  task,
  iconColor,
  iconType,
  onDelete,
}: TaskProps) {
  const [completed, setCompleted] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleCheckboxClick = async () => {
    if (!task._id) {
      console.error('Task ID is missing!')
      return
    }

    setCompleted(true)
    await new Promise((resolve) => setTimeout(resolve, 500))
    setIsDeleting(true)
    await new Promise((resolve) => setTimeout(resolve, 300))

    try {
      await onDelete(task._id)
    } catch (error) {
      console.error('Deletion failed:', error)
      setIsDeleting(false)
      setCompleted(false)
    }
  }

  const getIcon = () => {
    const IconComponent = iconType
    return <IconComponent className='h-4 w-4 text-white' />
  }

  return (
    <AnimatePresence>
      {!isDeleting && (
        <motion.div
          initial={{ opacity: 1, filter: 'blur(0px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          exit={{
            opacity: 0,
            filter: 'blur(12px)',
            transition: {
              duration: 0.8,
              ease: [0.4, 0, 0.2, 1],
            },
          }}
          className='flex items-start rounded-xl border border-gray-100 bg-white p-4 shadow-sm'
        >
          {/* Icône */}
          <div
            className={`${iconColor} mr-3 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full`}
          >
            {getIcon()}
          </div>

          {/* Contenu */}
          <div className='min-w-0 flex-1'>
            <div className='mb-1 flex items-center'>
              <h3 className='truncate font-semibold text-gray-900'>
                {task.title || 'Sans titre'}
              </h3>
              {/* Badge de priorité */}
              {task.priority && (
                <span
                  className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    task.priority === 'High'
                      ? 'bg-red-100 text-red-800'
                      : task.priority === 'Medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                  } `}
                >
                  {task.priority === 'High' && 'High'}
                  {task.priority === 'Medium' && 'Medium'}
                  {task.priority === 'Low' && 'Low'}
                </span>
              )}
            </div>

            {task.description ? (
              <p className='mt-1 line-clamp-2 text-sm text-gray-500'>
                {task.description}
              </p>
            ) : (
              <p className='mt-1 text-sm italic text-gray-400'>
                Aucune description
              </p>
            )}
          </div>

          {/* Checkbox */}
          <motion.button
            onClick={handleCheckboxClick}
            className={`ml-2 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border ${
              completed ? 'border-green-500 bg-green-500' : 'border-gray-300'
            }`}
            whileTap={{ scale: 0.9 }}
          >
            {completed && (
              <motion.svg
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500 }}
                xmlns='http://www.w3.org/2000/svg'
                width='12'
                height='12'
                viewBox='0 0 24 24'
                fill='none'
                stroke='white'
                strokeWidth='2'
              >
                <polyline points='20 6 9 17 4 12'></polyline>
              </motion.svg>
            )}
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

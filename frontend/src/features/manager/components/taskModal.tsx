import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface CreateTaskModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateTask: (task: {
    title: string
    status: string
    label: string
    priority: string
    dueDate: string
    description: string
  }) => void
}

export default function CreateTaskModal({
  isOpen,
  onClose,
  onCreateTask,
}: CreateTaskModalProps) {
  const [newTask, setNewTask] = useState({
    title: '',
    status: '',
    label: '',
    priority: '',
    dueDate: 'today',
    description: '',
  })

  const [isAnimating, setIsAnimating] = useState(false)
  const [customDate, setCustomDate] = useState('')

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true)
    }
  }, [isOpen])

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target
    setNewTask((prev) => ({ ...prev, [name]: value }))
  }

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setNewTask((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const finalDueDate =
      newTask.dueDate === 'later' ? customDate : newTask.dueDate

    console.log('Task to create:', { ...newTask, dueDate: finalDueDate }) // 👈 ici

    onCreateTask({ ...newTask, dueDate: finalDueDate })
    handleClose()
  }

  const handleClose = () => {
    setIsAnimating(false)
    setTimeout(() => {
      onClose()
      setNewTask({
        title: '',
        status: '',
        label: '',
        priority: '',
        dueDate: 'today',
        description: '',
      })
    }, 300)
  }

  if (!isOpen && !isAnimating) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-end bg-black bg-opacity-50 transition-opacity duration-300 ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div
        className={`h-full w-full max-w-sm transform overflow-y-auto bg-[#ffe5ec] p-6 transition-transform duration-300 ease-in-out ${
          isAnimating ? 'translate-x-0' : 'translate-x-full'
        } rounded-l-3xl`}
      >
        <div className='mb-6 flex items-center justify-between'>
          <h2 className='text-xl font-bold text-gray-800'>Create Task</h2>
          <button
            onClick={handleClose}
            className='flex h-8 w-8 items-center justify-center rounded-full bg-[#ffc8dd] transition-colors hover:bg-[#ffb3d1]'
          >
            <X className='h-4 w-4 text-gray-700' />
          </button>
        </div>

        <p className='mb-6 text-gray-700'>
          Add a new task by providing necessary info. Click save when you're
          done.
        </p>

        <form onSubmit={handleSubmit}>
          <div className='mb-4'>
            <label className='mb-2 block text-sm font-medium text-gray-800'>
              Title
            </label>
            <input
              type='text'
              name='title'
              value={newTask.title}
              onChange={handleInputChange}
              placeholder='Enter a title'
              className='w-full rounded-lg border border-[#ffb3d1] bg-[#ffe5ec] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#ff8fab]'
              required
            />
          </div>
          <div className='mb-4'>
            <label className='mb-2 block text-sm font-medium text-gray-800'>
              Description
            </label>
            <textarea
              name='description'
              value={newTask.description}
              onChange={handleInputChange}
              placeholder='Describe the task...'
              rows={4}
              className='w-full rounded-lg border border-[#ffb3d1] bg-[#ffe5ec] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#ff8fab]'
            />
          </div>

          <div className='mb-4'>
            <label className='mb-2 block text-sm font-medium text-gray-800'>
              Status
            </label>
            <select
              name='status'
              value={newTask.status}
              onChange={handleInputChange}
              className='w-full rounded-lg border border-[#ffb3d1] bg-[#ffe5ec] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#ff8fab]'
              required
            >
              <option value=''>Select status</option>
              <option value='todo'>To Do</option>
              <option value='in-progress'>In Progress</option>
              <option value='done'>Done</option>
            </select>
          </div>
          <div className='mb-4'>
            <label className='mb-2 block text-sm font-medium text-gray-800'>
              Due Date
            </label>
            <select
              name='dueDate'
              value={newTask.dueDate}
              onChange={handleInputChange}
              className='w-full rounded-lg border border-[#ffb3d1] bg-[#ffe5ec] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#ff8fab]'
              required
            >
              <option value='today'>Today</option>
              <option value='tomorrow'>Tomorrow</option>
              <option value='later'>Later</option>
            </select>
            {/* Affiche un date picker si l'utilisateur choisit "later" */}
            {newTask.dueDate === 'later' && (
              <input
                type='date'
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className='mt-2 w-full rounded-lg border border-[#ffb3d1] bg-[#ffe5ec] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#ff8fab]'
                required
              />
            )}
          </div>

          <div className='mb-4'>
            <label className='mb-2 block text-sm font-medium text-gray-800'>
              Label
            </label>
            <div className='space-y-2'>
              {/* Test creating */}
              <label className='flex items-center text-gray-800'>
                <input
                  type='radio'
                  name='label'
                  value='Test creating'
                  checked={newTask.label === 'Test creating'}
                  onChange={handleRadioChange}
                  className='mr-2 h-4 w-4 border border-[#ffb3d1] bg-[#ffe5ec] checked:bg-[#ff8fab] focus:ring-[#ff8fab]'
                />
                Test creating
              </label>

              {/* Test review */}
              <label className='flex items-center text-gray-800'>
                <input
                  type='radio'
                  name='label'
                  value='Test review'
                  checked={newTask.label === 'Test review'}
                  onChange={handleRadioChange}
                  className='mr-2 h-4 w-4 border border-[#ffb3d1] bg-[#ffe5ec] checked:bg-[#ff8fab] focus:ring-[#ff8fab]'
                />
                Test review
              </label>

              {/* Add new course */}
              <label className='flex items-center text-gray-800'>
                <input
                  type='radio'
                  name='label'
                  value='Add new course'
                  checked={newTask.label === 'Add new course'}
                  onChange={handleRadioChange}
                  className='mr-2 h-4 w-4 border border-[#ffb3d1] bg-[#ffe5ec] checked:bg-[#ff8fab] focus:ring-[#ff8fab]'
                />
                Add new course
              </label>
              <label className='flex items-center text-gray-800'>
                <input
                  type='radio'
                  name='label'
                  value='Bug'
                  checked={newTask.label === 'Bug'}
                  onChange={handleRadioChange}
                  className='mr-2 h-4 w-4 border border-[#ffb3d1] bg-[#ffe5ec] checked:bg-[#ff8fab] focus:ring-[#ff8fab]'
                />
                Bug
              </label>
            </div>
          </div>

          <div className='mb-6'>
            <label className='mb-2 block text-sm font-medium text-gray-800'>
              Priority
            </label>
            <div className='space-y-2'>
              <label className='flex items-center text-gray-800'>
                <input
                  type='radio'
                  name='priority'
                  value='High'
                  checked={newTask.priority === 'High'}
                  onChange={handleRadioChange}
                  className='mr-2 h-4 w-4 border border-[#ffb3d1] bg-[#ffe5ec] checked:bg-[#ff8fab] focus:ring-[#ff8fab]'
                />
                High
              </label>
              <label className='flex items-center text-gray-800'>
                <input
                  type='radio'
                  name='priority'
                  value='Medium'
                  checked={newTask.priority === 'Medium'}
                  onChange={handleRadioChange}
                  className='mr-2 h-4 w-4 border border-[#ffb3d1] bg-[#ffe5ec] checked:bg-[#ff8fab] focus:ring-[#ff8fab]'
                />
                Medium
              </label>
              <label className='flex items-center text-gray-800'>
                <input
                  type='radio'
                  name='priority'
                  value='Low'
                  checked={newTask.priority === 'Low'}
                  onChange={handleRadioChange}
                  className='mr-2 h-4 w-4 border border-[#ffb3d1] bg-[#ffe5ec] checked:bg-[#ff8fab] focus:ring-[#ff8fab]'
                />
                Low
              </label>
            </div>
          </div>

          <div className='flex justify-end space-x-3'>
            <button
              type='button'
              onClick={handleClose}
              className='rounded-3xl border border-[#ff8fab] px-4 py-2 font-medium text-gray-800 transition-colors hover:bg-[#ffb3d1]'
            >
              Cancel
            </button>
            <button
              type='submit'
              className='rounded-3xl bg-[#ff8fab] px-4 py-2 font-medium text-white transition-colors hover:bg-[#ff7096]'
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

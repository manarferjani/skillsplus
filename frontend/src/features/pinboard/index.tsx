import React, { useState } from 'react'
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd'

// A type for our task items
interface Task {
  id: string
  title: string
  description?: string
  priority?: 'Low' | 'Medium' | 'High'
  dueDate?: string
  // etc.
}

// A type for columns
interface Column {
  name: string
  items: Task[]
}

// Sample data: 3 columns with some tasks
const initialColumns: Record<string, Column> = {
  todo: {
    name: 'To Do',
    items: [
      {
        id: 'task-1',
        title: 'Brainstorm new feature',
        priority: 'High',
        dueDate: 'Sep 01, 2024',
      },
      {
        id: 'task-2',
        title: 'Write project specs',
        priority: 'Medium',
        dueDate: 'Sep 05, 2024',
      },
    ],
  },
  inProgress: {
    name: 'In Progress',
    items: [
      {
        id: 'task-3',
        title: 'Design mockups',
        priority: 'High',
        dueDate: 'Sep 09, 2024',
      },
    ],
  },
  inReview: {
    name: 'In Review',
    items: [
      {
        id: 'task-4',
        title: 'Refactor dashboard code',
        priority: 'Low',
        dueDate: 'Sep 15, 2024',
      },
    ],
  },
}

const Pinboard: React.FC = () => {
  const [columns, setColumns] = useState(initialColumns)

  // Fonction pour ajouter une nouvelle tâche dans une colonne donnée
  const addNewTask = (columnId: string) => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: 'Untitled Task',
      priority: 'Low',
      dueDate: new Date().toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
    }

    setColumns((prev) => ({
      ...prev,
      [columnId]: {
        ...prev[columnId],
        items: [...prev[columnId].items, newTask],
      },
    }))
  }

  // Handle drag and drop with immutability
  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result
    if (!destination) return
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return

    if (source.droppableId === destination.droppableId) {
      // Déplacement dans la même colonne
      const column = columns[source.droppableId]
      const newItems = Array.from(column.items)
      const [movedItem] = newItems.splice(source.index, 1)
      newItems.splice(destination.index, 0, movedItem)

      setColumns((prev) => ({
        ...prev,
        [source.droppableId]: {
          ...column,
          items: newItems,
        },
      }))
    } else {
      // Déplacement vers une autre colonne
      const startColumn = columns[source.droppableId]
      const endColumn = columns[destination.droppableId]
      const startItems = Array.from(startColumn.items)
      const endItems = Array.from(endColumn.items)
      const [movedItem] = startItems.splice(source.index, 1)
      endItems.splice(destination.index, 0, movedItem)

      setColumns((prev) => ({
        ...prev,
        [source.droppableId]: {
          ...startColumn,
          items: startItems,
        },
        [destination.droppableId]: {
          ...endColumn,
          items: endItems,
        },
      }))
    }
  }

  return (
    <div className="p-4">
      <h1 className="mb-4 text-2xl font-bold">Pinboard</h1>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {Object.entries(columns).map(([columnId, column]) => (
            <Droppable droppableId={columnId} key={columnId}>
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="rounded-md border border-gray-700 bg-gray-800 p-3"
                >
                  <h2 className="mb-2 text-lg font-semibold">{column.name}</h2>
                  {column.items.map((task, index) => (
                    <Draggable
                      key={task.id}
                      draggableId={task.id}
                      index={index}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="mb-2 rounded-md border border-gray-600 bg-gray-700 p-2"
                        >
                          <div className="text-sm font-medium">
                            {task.title}
                          </div>
                          {task.dueDate && (
                            <div className="text-xs text-gray-400">
                              Due: {task.dueDate}
                            </div>
                          )}
                          {task.priority && (
                            <div className="text-xs">
                              Priority: {task.priority}
                            </div>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  <button
                    onClick={() => addNewTask(columnId)}
                    className="mt-2 w-full rounded-md bg-blue-500 px-2 py-1 text-sm text-white"
                  >
                    Add Task
                  </button>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </div>
  )
}

export default Pinboard

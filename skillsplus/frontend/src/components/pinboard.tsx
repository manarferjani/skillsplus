import React, { useState } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import '../styles/Pinboard.css'


interface EventItem {
  id: string
  title: string
  description: string
  pinned: boolean
}

const Pinboard: React.FC = () => {
  const [events, setEvents] = useState<EventItem[]>([])
  const [newEvent, setNewEvent] = useState({ title: '', description: '' })
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  const [editingEventData, setEditingEventData] = useState({ title: '', description: '' })

  // Add a new event
  const addEvent = () => {
    const event: EventItem = {
      id: Date.now().toString(),
      title: newEvent.title,
      description: newEvent.description,
      pinned: false
    }
    setEvents([...events, event])
    setNewEvent({ title: '', description: '' })
  }

  // Start editing an event
  const startEditing = (event: EventItem) => {
    setEditingEventId(event.id)
    setEditingEventData({ title: event.title, description: event.description })
  }

  // Update the event with new details
  const updateEvent = (id: string) => {
    setEvents(
      events.map(ev =>
        ev.id === id
          ? { ...ev, title: editingEventData.title, description: editingEventData.description }
          : ev
      )
    )
    setEditingEventId(null)
  }

  // Toggle the pinned state
  const togglePin = (id: string) => {
    setEvents(
      events.map(ev => (ev.id === id ? { ...ev, pinned: !ev.pinned } : ev))
    )
  }

  // Remove an event
  const removeEvent = (id: string) => {
    setEvents(events.filter(ev => ev.id !== id))
  }

  // Handle drag and drop reordering
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return
    const items = Array.from(events)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)
    setEvents(items)
  }

  return (
    <div className="pinboard">
      <h1>Interactive Pinboard</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          addEvent()
        }}
      >
        <input
          type="text"
          placeholder="Event Title"
          value={newEvent.title}
          onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
          required
        />
        <textarea
          placeholder="Description"
          value={newEvent.description}
          onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
        />
        <button type="submit">Add Event</button>
      </form>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="events">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {events.map((event, index) => (
                <Draggable key={event.id} draggableId={event.id} index={index}>
                  {(provided) => (
                    <div
                      className={`event-item ${event.pinned ? 'pinned' : ''}`}
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      {editingEventId === event.id ? (
                        <div>
                          <input
                            type="text"
                            value={editingEventData.title}
                            onChange={e =>
                              setEditingEventData({
                                ...editingEventData,
                                title: e.target.value
                              })
                            }
                          />
                          <textarea
                            value={editingEventData.description}
                            onChange={e =>
                              setEditingEventData({
                                ...editingEventData,
                                description: e.target.value
                              })
                            }
                          />
                          <button onClick={() => updateEvent(event.id)}>Save</button>
                        </div>
                      ) : (
                        <div>
                          <h2>{event.title}</h2>
                          <p>{event.description}</p>
                          <button onClick={() => togglePin(event.id)}>
                            {event.pinned ? 'Unpin' : 'Pin'}
                          </button>
                          <button onClick={() => startEditing(event)}>Edit</button>
                          <button onClick={() => removeEvent(event.id)}>Remove</button>
                        </div>
                      )}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  )
}

export default Pinboard

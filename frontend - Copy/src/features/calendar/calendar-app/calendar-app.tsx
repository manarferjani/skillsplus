import { useState, useMemo, useEffect, useLayoutEffect, useRef } from 'react'
import { useNavigate, useRouter } from '@tanstack/react-router'
import { useRouteContext } from '@tanstack/react-router'
import { useLocation } from '@tanstack/react-router'
import { ScheduledTest } from '@/interfaces/testRecords.interface'
import { TestRecord } from '@/interfaces/testRecords.interface'
import { Route } from '@/routes/_authenticated/calendar/index.lazy'
import { validateState } from '@/routes/_authenticated/calendar/route.options'
import { sendNotificationToAdmin } from '@/services/notification.service.ts'
import { fetchTests, getTestById } from '@/services/test.service'
import { deleteTest } from '@/services/test.service'
import { getMainAdminId } from '@/services/users.service.ts'
import { ChevronLeft, ChevronRight, Clock, Plus } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import { cn } from '@/lib/utils'
import { formatDate, getDaysOfWeek, getMonthYear } from '@/utils/dateUtils'
import { useAuth } from '@/context/authContext'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { NewEventModal } from '@/components/NewEventModal'
// tout en haut de ton fichier
import Reminder from '@/components/reminder'
import { Event } from '@/features/calendar/calendar-app/data/calendar.ts'
import { eventsData } from '@/features/calendar/calendar-app/data/eventsdata.ts'
import TestCard from './data/TestCard'
import { useAuthStore } from '@/stores/authStore'

type MyState = {
  wasKickedOut?: boolean
}


// Service à implémenter

function parseTimeRange(timeRange: string | undefined): {
  startHour: number
  startMinute: number
  endHour: number
  endMinute: number
} {
  if (!timeRange) {
    console.warn('timeRange manquant dans un test')
    return {
      startHour: 0,
      startMinute: 0,
      endHour: 0,
      endMinute: 0,
    }
  }

  try {
    const normalizedTimeRange = timeRange.replace(/-/g, 'à')
    const [startTime, endTime] = normalizedTimeRange.split('à')

    if (!startTime || !endTime) {
      throw new Error('Format de timeRange invalide après normalisation')
    }

    const [startHourStr, startMinuteStr] = startTime.trim().split(':')
    const [endHourStr, endMinuteStr] = endTime.trim().split(':')

    return {
      startHour: parseInt(startHourStr),
      startMinute: parseInt(startMinuteStr),
      endHour: parseInt(endHourStr),
      endMinute: parseInt(endMinuteStr),
    }
  } catch (error) {
    console.error(`Erreur lors du parsing de timeRange "${timeRange}":`, error)
    return {
      startHour: 0,
      startMinute: 0,
      endHour: 0,
      endMinute: 0,
    }
  }
}

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [events, setEvents] = useState<Event[]>(eventsData)
  const [view, setView] = useState<'day' | 'week' | 'month'>('week')
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const navigate = useNavigate()
  const [selectedDay, setSelectedDay] = useState(new Date())
  const [tests, setTests] = useState<ScheduledTest[]>([])
  const { user } = useAuth()
  const userId = user?.id ?? null
  console.log('User ID (userId) :', userId)

  const location = useLocation()
    const token = useAuthStore((state) => state.auth.accessToken)

  useEffect(() => {
    if (!token) {
      navigate({ to: '/sign-in-2' })
    }
  }, [token, navigate])

  if (!token) return null


  // Typage sécurisé
  const state = location.state as { wasKickedOut?: boolean } | undefined
  const wasKickedOut = state?.wasKickedOut ?? false

  const toastDisplayedRef = useRef(false)

  useEffect(() => {
    const validatedState = validateState(location.state)
    const wasKickedOutValue = validatedState?.wasKickedOut ?? false
    const testId = validatedState?.testId
    const userId = validatedState?.userId

    // Réinitialisation du ref si l'utilisateur revient sans être expulsé
    if (!wasKickedOutValue) {
      toastDisplayedRef.current = false
      return
    }

    // Empêche l’affichage multiple du toast
    if (toastDisplayedRef.current) return

    console.log('wasKickedOut:', wasKickedOutValue)
    toast.error(
      "You have been kicked out of the test! Please wait for the admin's authorization.",
      {
        duration: 3000,
        position: 'top-center',
      }
    )

    toastDisplayedRef.current = true

    // Fonction async pour récupérer adminId
    const sendKickoutNotification = async () => {
      try {
        if (!testId) {
          console.error('testId est undefined, impossible de récupérer le test')
          return
        }
        const adminId = await getMainAdminId()
        console.log('✅ Admin ID récupéré :', adminId)
        const controller = new AbortController()
        const test = await getTestById(testId, { signal: controller.signal })
        const testTitle = test?.title ?? 'unknown test'

        console.log("📍 testId extrait :", testId);

        if (!adminId) {
          throw new Error('Aucun adminId trouvé')
        }

        if (!userId) {
          throw new Error('Aucun userId trouvé')
        }

        console.log("📨 Envoi de la notification à l'admin", {
          adminId,
          userId,
        })

        try {
          await sendNotificationToAdmin({
            userId: adminId, // 👈 L'admin reçoit la notification
            message: `Authorization request - userId:${userId}, testId:${testId}`,
            type: 'authorization',
            link: `/admin/authorize-access?userId=${userId}&testId=${testId}`, // 🧑‍💻 ID du collaborateur ici
            save: true,
          })
          console.log('✅ Notification envoyée avec succès')
        } catch (notifError) {
          console.error("❌ Échec de l'envoi de la notification", notifError)
          toast.error(
            "Erreur lors de l'envoi de la notification à l'administrateur.",
            {
              duration: 4000,
              position: 'top-center',
            }
          )
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Une erreur inconnue est survenue'
        console.error('⚠️ Erreur dans sendKickoutNotification :', errorMessage)
        toast.error(`Erreur : ${errorMessage}`, {
          duration: 5000,
          position: 'top-center',
          //type: 'error',
        })
      }
    }

    sendKickoutNotification()

    const cleanupTimer = setTimeout(() => {
      window.history.replaceState(
        { ...validatedState, wasKickedOut: undefined },
        ''
      )
    }, 1000)

    return () => clearTimeout(cleanupTimer)
  }, [location.state, userId])

  // Fonction de suppression d'un test
  const handleDeleteTest = async (testId: string) => {
    try {
      await deleteTest(testId) // Appel API pour supprimer le test
      setTests((prev) => prev.filter((test) => test._id !== testId))
      toast.success('Test supprimé avec succès')
    } catch (error) {
      console.error('Erreur lors de la suppression du test', error)
      toast.error('Impossible de supprimer le test')
    }
  }

  useEffect(() => {
    const loadTests = async () => {
      try {
        const calendarTests = await fetchTests()
        //console.log('Tests récupérés:', calendarTests)
        if (!user?.level) {
          console.warn('Niveau du collaborateur non défini')
          return
        }

        const filteredTests = calendarTests.filter(
          (test: TestRecord) => test.level === user.level
        )
        //console.log('Tests filtrés :', filteredTests)

        setTests(filteredTests)
      } catch (error) {
        console.error('Erreur lors de la récupération des tests :', error)
      }
    }

    loadTests()
  }, [user?.level])

  const [reminders, setReminders] = useState<any[]>([
    // Exemple de données de rappels
    { title: 'Webinar', description: 'Angular', date: '2025-04-23' },
    { title: 'Task ', description: 'React.js', date: '2025-04-25' },
  ])
  const [isReminderOpen, setIsReminderOpen] = useState(false)

  const [showReminders, setShowReminders] = useState(false)
  const handleReminderClick = () => {
    setShowReminders(!showReminders)
    setIsReminderOpen(true) // Open the reminder modal if needed
  }

  const handleSendEmail = (email: string, subject: string, body: string) => {
    // ici tu fais ce que tu veux avec les valeurs
    console.log('Sending email to:', email, subject, body)
  }

  const handleCloseReminder = () => {
    setIsReminderOpen(false)
  }
  const handleDeleteReminder = (index: number) => {
    const updatedReminders = reminders.filter((_, i) => i !== index)
    setReminders(updatedReminders)
  }
  const daysOfWeek = useMemo(() => getDaysOfWeek(currentDate), [currentDate])
  const hours = useMemo(() => Array.from({ length: 10 }, (_, i) => i + 8), [])
  const getColorByType = (type: string): 'blue' | 'green' | 'pink' => {
    switch (type) {
      case 'Webinar':
        return 'blue'
      case 'Challenges':
        return 'green'
      case 'task':
        return 'pink'
      default:
        return 'blue'
    }
  }
  const goToPrevious = () => {
    const newDate = new Date(currentDate)
    if (view === 'day') {
      newDate.setDate(currentDate.getDate() - 1)
    } else if (view === 'week') {
      newDate.setDate(currentDate.getDate() - 7)
    } else {
      newDate.setMonth(currentDate.getMonth() - 1)
    }
    setCurrentDate(newDate)
  }

  const goToNext = () => {
    const newDate = new Date(currentDate)
    if (view === 'day') {
      newDate.setDate(currentDate.getDate() + 1)
    } else if (view === 'week') {
      newDate.setDate(currentDate.getDate() + 7)
    } else {
      newDate.setMonth(currentDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  const handleAddEvent = (eventData: any) => {
    const startDate = new Date(eventData.date)
    const [startHours, startMinutes] = eventData.startTime
      .split(':')
      .map(Number)
    startDate.setHours(startHours, startMinutes)

    const endDate = new Date(eventData.date)
    const [endHours, endMinutes] = eventData.endTime.split(':').map(Number)
    endDate.setHours(endHours, endMinutes)

    if (editingEvent) {
      const updatedEvent: Event = {
        ...editingEvent,
        title: eventData.title,
        description: eventData.description,
        start: startDate,
        end: endDate,
        color: getColorByType(eventData.type || ''),
        type: eventData.type,
        link: eventData.link,
        reminder: eventData.reminder,
      }

      setEvents(
        events.map((event) =>
          event.id === editingEvent.id ? updatedEvent : event
        )
      )

      setEditingEvent(null)
      toast.success('Event updated successfully')
    } else {
      const newEvent: Event = {
        id: `event-${Date.now()}`,
        title: eventData.title,
        description: eventData.description,
        start: startDate,
        end: endDate,
        color: eventData.color,
        type: eventData.type,
        link: eventData.link,
        reminder: eventData.reminder,
      }

      setEvents([...events, newEvent])
      toast.success('Event added successfully')
      if (newEvent.reminder) {
        setReminders([...reminders, newEvent]) // Correct here
      }
    }
  }

  const handleDeleteEvent = (id: string) => {
    setEvents(events.filter((event) => event.id !== id))
    toast.success('Event deleted successfully')
  }

  const getDateRangeText = () => {
    if (view === 'day') {
      return currentDate.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    } else if (view === 'week') {
      const startDay = daysOfWeek[0]
      const endDay = daysOfWeek[6]

      if (startDay.getMonth() === endDay.getMonth()) {
        return `${startDay.getDate()} - ${endDay.getDate()} ${startDay.toLocaleDateString('en-US', { month: 'short' })} ${startDay.getFullYear()}`
      }

      return `${startDay.getDate()} ${startDay.toLocaleDateString('en-US', { month: 'short' })} - ${endDay.getDate()} ${endDay.toLocaleDateString('en-US', { month: 'short' })} ${startDay.getFullYear()}`
    } else {
      return getMonthYear(currentDate)
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingEvent(null)
  }
  const handleEventClick = (event: Event) => {
    // Rediriger selon le type de l'événement
    if (event.type === 'Webinar') {
      window.open(event.link, '_blank') // ouvre un lien Zoom par exemple
    } else if (event.type === 'Challenges') {
      navigate({ to: '/challenges' })
    } else if (event.type === 'task') {
      navigate({ to: '/tests' })
    }
  }
  // Ajout du setInterval pour mettre à jour le calendrier tous les jours à minuit
  useEffect(() => {
    const intervalId = setInterval(() => {
      const currentDate = new Date()
      if (currentDate.getHours() === 0 && currentDate.getMinutes() === 0) {
        // Mettre à jour ou réinitialiser le calendrier ici
        console.log('Le calendrier se met à jour pour la nouvelle journée !')
        // Code pour actualiser les événements ou recharger la vue du calendrier
      }
    }, 60000) // Vérifie toutes les minutes pour voir si c'est minuit

    return () => clearInterval(intervalId) // Nettoyage de l'intervalle à la destruction du composant
  }, [])

  return (
    <>
      <Toaster
        position='top-center'
        toastOptions={{
          style: {
            background: '#ff4444',
            color: '#fff',
            fontWeight: 'bold',
            padding: '16px',
            fontSize: '16px',
            zIndex: 99999,
            maxWidth: '500px',
            borderRadius: '8px',
          },
        }}
      />
      <div className='flex h-full flex-col rounded-3xl bg-calendarBg'>
        <header className='rounded-3xl border-b p-4 shadow-sm'>
          <div className='mb-4 flex h-[80px] items-center justify-between rounded-3xl'>
            <div className='flex h-full items-center'>
              <h2 className='flex h-full items-center rounded-xl font-dancing-script text-8xl font-bold leading-none'>
                {currentDate.toLocaleString('default', { month: 'long' })}
              </h2>
              <span className='ml-4 self-center font-dancing-script text-xl font-bold'>
                {currentDate.getFullYear()}
              </span>
            </div>
            <div className='flex items-center gap-2' />
          </div>

          <div className='flex items-center justify-between'>
            <div className='flex gap-2'></div>

            <div className='flex items-center gap-2'>
              <Button
                size='sm'
                className='rounded-3xl'
                onClick={() => setIsModalOpen(true)}
              >
                <Plus className='mr-2 h-4 w-4' />
                New Event
              </Button>
              <div>
                <Button
                  size='sm'
                  variant='outline'
                  className='rounded-3xl bg-[#cdeac0]'
                  onClick={handleReminderClick}
                >
                  Reminder
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className='flex items-center justify-between rounded-3xl border-b p-4'>
          <div className='flex items-center gap-2 rounded-3xl'>
            <Button
              size='sm'
              variant='outline'
              className='rounded-3xl bg-[#a8dadc] text-sm hover:bg-gray-200'
              onClick={() => setCurrentDate(new Date())}
            >
              Today
            </Button>
          </div>

          <div className='flex items-center gap-2 rounded-3xl'>
            <Tabs
              value={view}
              onValueChange={(value) => {
                setView(value as 'day' | 'week' | 'month')
                if (value === 'day') setSelectedDay(currentDate)
              }}
              className='w-auto rounded-3xl'
            >
              <TabsList className='rounded-3xl bg-[#f5cac3]'>
                <TabsTrigger className='rounded-3xl bg-[#f5cac3]' value='day'>
                  Day
                </TabsTrigger>
                <TabsTrigger className='rounded-3xl bg-[#f5cac3]' value='week'>
                  Week
                </TabsTrigger>
                <TabsTrigger className='rounded-3xl bg-[#f5cac3]' value='month'>
                  Month
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className='ml-4 flex items-center gap-1'>
              <Button
                className='rounded-3xl bg-[#d5bdaf]'
                size='icon'
                variant='outline'
                onClick={goToPrevious}
              >
                <ChevronLeft className='h-4 w-4' />
              </Button>
              <Button
                className='rounded-3xl bg-[#d5bdaf]'
                size='icon'
                variant='outline'
                onClick={goToNext}
              >
                <ChevronRight className='h-4 w-4' />
              </Button>
              <span className='px-2 text-sm'>{getDateRangeText()}</span>
            </div>
          </div>
        </div>

        <div className='flex flex-1 overflow-auto'>
          {view === 'week' || view === 'day' ? (
            <>
              <div className='flex h-full flex-1 overflow-auto rounded-xl bg-calendarBg p-2 shadow-md'>
                <div className='relative min-h-[1100px] w-16 flex-shrink-0 border-r bg-calendarBg'>
                  <div className='h-[1100px] border-b' />
                  {hours.map((hour) => (
                    <div
                      key={hour}
                      className='absolute h-[110px] border-b px-2 text-xs text-muted-foreground'
                      style={{ top: (hour - 8) * 110 }}
                    >
                      <span className='absolute left-2 top-1/2 -translate-y-1/2 text-sm'>{`${hour}:00`}</span>
                    </div>
                  ))}
                </div>

                <div className='flex flex-1'>
                  {(view === 'day' ? [selectedDay] : daysOfWeek).map(
                    (day, index) => (
                      <div
                        key={index}
                        className='h-full min-h-[1100px] min-w-[140px] flex-1 rounded-lg border-r bg-calendarBg last:border-r-0'
                      >
                        <div
                          className={cn(
                            'flex h-16 flex-col items-center justify-center px-3',
                            day.toDateString() === new Date().toDateString()
                              ? 'font-bold text-brandBlue'
                              : ''
                          )}
                        >
                          <div className='text-2xl font-bold'>
                            {formatDate(day).split(' ')[0]}{' '}
                            {/* Numéro du jour */}
                          </div>
                          <div className='text-sm'>
                            {formatDate(day).split(' ')[1]} {/* Mois */}
                          </div>
                        </div>

                        <div className='relative min-h-[1100px]'>
                          {hours.map((hour) => (
                            <div
                              key={hour}
                              className='absolute h-[110px] w-full border-b border-dashed'
                              style={{ top: (hour - 8) * 110 }}
                            />
                          ))}

                          {events
                            .filter(
                              (event) =>
                                event.start.toDateString() ===
                                day.toDateString()
                            )
                            .map((event, idx) => {
                              const startHour =
                                event.start.getHours() +
                                event.start.getMinutes() / 60
                              const endHour =
                                event.end.getHours() +
                                event.end.getMinutes() / 60
                              const top = (startHour - 8) * 110
                              const height = (endHour - startHour) * 110

                              return (
                                <div
                                  key={idx}
                                  className='absolute left-1 right-1 z-10 rounded-xl p-2 text-xs font-medium text-white shadow-sm'
                                  style={{
                                    top: `${top}px`,
                                    height: `${height}px`,
                                    backgroundColor:
                                      event.color === 'blue'
                                        ? '#3b82f6'
                                        : event.color === 'green'
                                          ? '#22c55e'
                                          : event.color === 'pink'
                                            ? '#ec4899'
                                            : '#6b7280',
                                  }}
                                  onClick={() => handleEventClick(event)}
                                >
                                  <div className='mb-1 flex items-start justify-between'>
                                    <span className='truncate'>
                                      {event.title}
                                    </span>
                                    <div className='flex gap-1'>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setEditingEvent(event)
                                          setIsModalOpen(true)
                                        }}
                                        className='text-black hover:text-gray-200'
                                        title='Edit'
                                      >
                                        <i
                                          className='fa fa-pencil'
                                          aria-hidden='true'
                                        ></i>
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleDeleteEvent(event.id)
                                        }}
                                        className='text-black hover:text-gray-200'
                                        title='Delete'
                                      >
                                        <i className='bi bi-trash'></i>
                                      </button>
                                    </div>
                                  </div>
                                  <div className='truncate text-[10px] text-muted-foreground'>
                                    {event.description}
                                  </div>
                                </div>
                              )
                            })}
                          {/* Ajoute cette partie pour les tests */}
                          {tests
                            .filter((test) => {
                              const scheduledDate = new Date(test.scheduledDate)
                              const isSameDay =
                                scheduledDate.toDateString() ===
                                day.toDateString()
                              if (!isSameDay) return false

                              const { endHour, endMinute } = parseTimeRange(
                                test.timeRange
                              )
                              const endDate = new Date(test.scheduledDate)
                              endDate.setHours(endHour, endMinute, 0, 0)

                              return new Date() < endDate
                            })
                            .map((test, idx) => {
                              const {
                                startHour,
                                startMinute,
                                endHour,
                                endMinute,
                              } = parseTimeRange(test.timeRange)

                              const startDecimal = startHour + startMinute / 60
                              const endDecimal = endHour + endMinute / 60

                              const hourHeight = 110
                              const top = (startDecimal - 8) * hourHeight
                              const height =
                                (endDecimal - startDecimal) * hourHeight

                              return (
                                <div
                                  key={`test-${test._id}`}
                                  className='absolute left-1 right-1 z-20'
                                  style={{
                                    top: `${top}px`,
                                    height: `${height}px`,
                                  }}
                                >
                                  <TestCard
                                    test={test}
                                    onDelete={handleDeleteTest}
                                    isDisabled={wasKickedOut}
                                  />
                                </div>
                              )
                            })}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </>
          ) : (
            // Vue "mois"
            <div className='flex flex-1 flex-col overflow-auto'>
              <div className='grid h-auto min-h-[1000px] w-full auto-rows-fr grid-cols-7 gap-2 rounded-xl bg-calendarBg p-3'>
                {Array.from({ length: 42 }, (_, i) => {
                  const firstDayOfMonth = new Date(
                    currentDate.getFullYear(),
                    currentDate.getMonth(),
                    1
                  )
                  const startDay = firstDayOfMonth.getDay()
                  const day = new Date(
                    currentDate.getFullYear(),
                    currentDate.getMonth(),
                    i - startDay + 1
                  )

                  const isCurrentMonth =
                    day.getMonth() === currentDate.getMonth()
                  const isToday =
                    day.toDateString() === new Date().toDateString()

                  // Trouver les tests planifiés ce jour-là
                  const dayTests = tests.filter(
                    (test) =>
                      new Date(test.scheduledDate).toDateString() ===
                      day.toDateString()
                  )

                  return (
                    <div
                      key={i}
                      className={cn(
                        'flex flex-col rounded-xl border bg-calendarBg p-3 shadow-sm',
                        'h-full', // Hauteur garantie et expansion
                        isToday &&
                          'border-2 border-blue-500 ring-2 ring-blue-400/30',
                        !isCurrentMonth && 'opacity-70'
                      )}
                    >
                      {/* En-tête du jour (fixe) */}
                      <div className='mb-2 flex-shrink-0'>
                        <div className='text-xs font-semibold text-muted-foreground'>
                          {day.toLocaleDateString(undefined, {
                            weekday: 'short',
                          })}
                        </div>
                        <div className='text-sm font-bold'>{day.getDate()}</div>
                      </div>

                      {/* Contenu des tests (scrollable si besoin) */}
                      <div className='flex-1 space-y-2 overflow-y-auto'>
                        {dayTests.map((test) => (
                          <div
                            key={test._id}
                            className={cn(
                              'cursor-pointer rounded-lg border p-2 shadow-sm transition-all hover:shadow-md',
                              test.joinable
                                ? 'border-green-300 bg-green-50'
                                : 'border-gray-200 bg-white'
                            )}
                            onClick={() => {
                              setSelectedDay(new Date(test.scheduledDate))
                              setView('day') // Optionnel: bascule vers la vue jour
                            }}
                          >
                            <div className='flex items-start justify-between'>
                              <div className='flex-1'>
                                <div className='text-xs font-medium text-gray-900'>
                                  {test.title}
                                </div>
                                <div className='mt-1 flex items-center text-[10px] text-muted-foreground'>
                                  <Clock className='mr-1 h-3 w-3' />
                                  {test.timeRange}
                                </div>
                              </div>
                              {test.joinable && (
                                <span className='ml-2 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800'>
                                  Disponible
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <NewEventModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleAddEvent}
          initialData={editingEvent}
        />

        {isReminderOpen && (
          <Reminder
            reminders={reminders}
            onClose={handleCloseReminder}
            onDelete={handleDeleteReminder}
            sendEmail={handleSendEmail}
          />
        )}
      </div>
    </>
  )
}

export default Calendar

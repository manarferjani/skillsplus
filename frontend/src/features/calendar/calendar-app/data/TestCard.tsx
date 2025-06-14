import React, { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ScheduledTest } from '@/interfaces/testRecords.interface'
import { RiDeleteBin6Line, RiPencilLine } from 'react-icons/ri'
import { useAuth } from '@/context/authContext'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

// Palette de couleurs pour les technologies
const TECHNOLOGY_COLORS: Record<string, string> = {
  // Associez chaque technologie à une couleur de la palette
  // Exemple (ajustez selon vos technologies réelles) :
  'React.js': '#ffc2d1',
  Angular: '#ff4d6d',
  'Vue.js': '#83c5be',
  'Express.js': '#ff9770',
  Laravel: '#be95c4',
  'Next.js': '#90a955',
  NestJS: '#00afb9',
  Flutter: '#abc4ff',
  Django: '#ca61c3',
  'Spring Boot': '#ffb700',
  // Ajoutez d'autres technologies si nécessaire
}

// Fonction pour obtenir une couleur en fonction de la technologie
const getTechnologyColor = (technology: string): string => {
  // Si la technologie est explicitement mappée, retournez sa couleur
  if (TECHNOLOGY_COLORS[technology]) {
    return TECHNOLOGY_COLORS[technology]
  }

  // Sinon, générez une couleur aléatoire à partir de la palette
  const colors = Object.values(TECHNOLOGY_COLORS)
  const hash = Array.from(technology).reduce(
    (acc, char) => acc + char.charCodeAt(0),
    0
  )
  return colors[hash % colors.length]
}

// Fonction de parsing du timeRange (inchangée)
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

interface TestCardProps {
  test: ScheduledTest
  onDelete: (testId: string) => void
  isDisabled?: boolean // Nouvelle prop optionnellehandleJoinTest
}

const TestCard: React.FC<TestCardProps> = ({
  test,
  onDelete,
  isDisabled = false,
}) => {
  useEffect(() => {
    //console.log('Test reçu :', test)
  }, [test])

  const [timeLeft, setTimeLeft] = useState<string | null>(null)
  const [cardState, setCardState] = useState<'before' | 'during' | 'after'>(
    'before'
  )

  // Obtenez la couleur en fonction de la technologie du test
  const cardColor = getTechnologyColor(test.technology?.name || 'default')

  const navigate = useNavigate()
  const { user } = useAuth()

  // Parsing de la date et heure du test
  const scheduledDate = new Date(test.scheduledDate)
  const { startHour, startMinute, endHour, endMinute } = parseTimeRange(
    test.timeRange
  )

  const testStart = new Date(scheduledDate)
  testStart.setHours(startHour, startMinute, 0, 0)

  const testEnd = new Date(testStart)
  testEnd.setHours(endHour, endMinute, 0, 0)

  // Mise à jour du compte à rebours
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date()
      const timeLeftMs = testStart.getTime() - now.getTime()

      if (now < testStart) {
        const hours = Math.floor(timeLeftMs / 3600000)
        const minutes = Math.floor((timeLeftMs % 3600000) / 60000)

        let formattedTime = ''

        if (hours > 0 && minutes > 0) {
          formattedTime = `${hours}h ${minutes.toString().padStart(2, '0')}m`
        } else if (hours > 0) {
          formattedTime = `${hours}h`
        } else {
          formattedTime = `${minutes.toString().padStart(2, '0')}m`
        }

        setTimeLeft(formattedTime)
        setCardState('before')
      } else if (now >= testStart && now <= testEnd) {
        setTimeLeft(null)
        setCardState('during')
      } else if (now > testEnd) {
        setTimeLeft(null)
        setCardState('after')
      }
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [test.scheduledDate, test.timeRange])

  const handleJoinTest = (testId: string) => {
    if (isDisabled) return
    if (cardState !== 'during') return

    navigate({
      to: '/testInterface/$testId',
      params: { testId },
    })
  }

  return (
    <div
      className='relative mb-4 h-full w-full rounded-xl border border-gray-200 p-4 shadow-md'
      style={{ backgroundColor: cardColor }} // Appliquez la couleur ici
    >
      {/* Contenu principal */}
      <h2 className='text-sm font-semibold'>{test.title}</h2>
      <p className='mt-1 text-sm text-green-600'>⏳ {test.timeRange}</p>
      <p className='text-xs text-gray-600'>
        Technologie: {test.technology?.name || 'Non spécifiée'}
      </p>

      {/* État du test */}
      {cardState === 'before' && (
        <div className='mt-2 flex flex-col text-xs text-yellow-500'>
          {/*<span>Brace yourself... the test is coming in</span>*/}
          <div className='mt-1 flex items-center gap-1 font-semibold'>
            {/*<span className='text-lg'>🕒</span>*/}
            {/*<span className='text-sky-300'>{timeLeft}</span>*/}
          </div>
        </div>
      )}

      {cardState === 'during' && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className={`mt-2 flex items-center justify-center rounded-full px-3 py-1 text-xs shadow-md transition-all duration-200 ${
                  isDisabled
                    ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                    : 'bg-green-100 text-green-600 hover:bg-green-200 active:scale-95'
                }`}
                disabled={isDisabled}
                onClick={() => handleJoinTest(test._id)}
              >
                join
              </button>
            </TooltipTrigger>
            {isDisabled && (
              <TooltipContent className='max-w-xs rounded-lg bg-red-100 p-2 text-xs text-red-700 shadow-lg'>
                <p>Vous avez été expulsé. Réessayez plus tard.</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      )}

      {cardState === 'after' && (
        <p className='mt-2 text-xs text-red-500'>
          Speed wasn't on your side today, huh?
        </p>
      )}

      {['manager', 'admin'].includes(user?.role || '') && (
        <div className='absolute bottom-2 right-2 flex gap-2'>
          <button
            className='flex items-center justify-center rounded-full bg-red-100 p-2 text-red-600 hover:bg-red-200'
            onClick={() => onDelete(test._id)}
            aria-label='Supprimer'
          >
            <RiDeleteBin6Line size={16} />
          </button>

          <button
            className='flex items-center justify-center rounded-full bg-blue-100 p-2 text-blue-600 hover:bg-blue-200'
            onClick={() =>
              navigate({
                to: '/editTest/$testId',
                params: { testId: test._id },
              })
            }
            aria-label='Éditer'
          >
            <RiPencilLine size={16} />
          </button>
        </div>
      )}
    </div>
  )
}

export default TestCard

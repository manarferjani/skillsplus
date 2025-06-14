import React, { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Performer, PerformerService } from '@/services/performer.service'
import { TrendingUp, EmojiEvents } from '@mui/icons-material'
import { Typography, Card, CardContent, CircularProgress } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import dayjs from 'dayjs'
import advancedFormat from 'dayjs/plugin/advancedFormat'

dayjs.extend(advancedFormat)

// Composant pour afficher l'avatar ou les initiales
const ProfileAvatar = ({
  name,
  imageUrl,
}: {
  name: string
  imageUrl?: string
}) => {
  const getInitials = (fullName: string) => {
    const parts = fullName.trim().split(' ')
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
    return (
      parts[0].charAt(0).toUpperCase() +
      parts[parts.length - 1].charAt(0).toUpperCase()
    )
  }

  return (
    <div className='flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-gray-300 bg-gray-100 text-lg font-bold text-gray-700 shadow-sm'>
      {imageUrl ? (
        <img src={imageUrl} alt={name} className='h-full w-full object-cover' />
      ) : (
        getInitials(name)
      )}
    </div>
  )
}

// Couleurs par technologie
const TECHNOLOGY_COLORS: Record<string, string> = {
  'React.js': '#ffc2d1',
  Angular: '#ff4d6d',
  'Vue.js': '#83c5be',
  'Express.js': '#ff9770',
  Laravel: '#be95c4',
  'Next.js': '#8fc0a9',
  NestJS: '#00afb9',
  Flutter: '#abc4ff',
  Django: '#ca61c3',
  'Spring Boot': '#ffb700',
}

// Chip Technologie
const TechChip = ({ technology }: { technology: string }) => {
  const color =
    TECHNOLOGY_COLORS[technology as keyof typeof TECHNOLOGY_COLORS] || '#cccccc'
  return (
    <div
      className='inline-flex items-center rounded-full px-3 py-1 font-bold text-white shadow-md'
      style={{ backgroundColor: color }}
    >
      <EmojiEvents fontSize='small' style={{ fontSize: 16, marginRight: 6 }} />
      <span>{technology}</span>
    </div>
  )
}

type FilterType = 'all' | 'current' | 'past'

const PerformersOfTheWeek = () => {
  const theme = useTheme()
  const [performers, setPerformers] = useState<Performer[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterType>('all')
  const navigate = useNavigate()

  useEffect(() => {
    const fetchPerformers = async () => {
      try {
        setLoading(true)
        const data = await PerformerService.fetchPerformers({ filter })
        setPerformers(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
      } finally {
        setLoading(false)
      }
    }
    fetchPerformers()
  }, [filter])

  const filteredPerformers = performers.filter((performer) => {
    if (filter === 'all') return true
    const isCurrentWeek = dayjs(performer.performerOfTheWeek?.date).isAfter(
      dayjs().subtract(7, 'day')
    )
    return filter === 'current' ? isCurrentWeek : !isCurrentWeek
  })

  if (loading) {
    return (
      <div className='flex min-h-[200px] items-center justify-center'>
        <CircularProgress />
      </div>
    )
  }

  if (error) {
    return (
      <div className='flex min-h-[200px] items-center justify-center'>
        <Typography color='error'>
          Erreur lors du chargement des données: {error}
        </Typography>
      </div>
    )
  }

  return (
    <div className='flex w-full flex-col items-center'>
      <div className='mb-6 text-center'>
        <EmojiEvents sx={{ color: 'gold' }} fontSize='large' />
        <Typography
          variant='h6'
          component='h2'
          className='dancing-script text-xl font-semibold'
        >
          Performers of the
          <br />
          Week
        </Typography>
      </div>

      <div className='scrollbar-thin h-[250px] max-h-[250px] w-full max-w-full snap-y snap-mandatory overflow-y-auto'>
        {filteredPerformers
          .filter(
            (performer) => performer.performerOfTheWeek?.successRateBefore !== 0
          )
          .map((performer) => {
            console.log('Performer data:', performer)
            const imageUrl = performer.profileImage
              ? `http://localhost:5000${performer.profileImage}`
              : undefined
            const before = performer.performerOfTheWeek?.successRateBefore || 0
            const after = performer.performerOfTheWeek?.successRateAfter || 0
            const improvement = after - before

            return (
              <Card
                key={performer._id}
                variant='outlined'
                onClick={() =>
                  navigate({
                    to: '/testHistory',
                    search: {
                      name: performer.name,
                      technology:
                        performer.performerOfTheWeek?.technologyId?.name,
                    },
                  })
                }
                className='mb-4 h-full !w-full snap-start !rounded-3xl transition-all duration-300 hover:translate-y-[-2px] hover:shadow-md'
                style={{ scrollSnapAlign: 'start' }}
              >
                <CardContent className='p-4'>
                  {/* Avatar */}
                  <div className='mb-2 flex justify-center'>
                    <ProfileAvatar name={performer.name} imageUrl={imageUrl} />
                  </div>

                  {/* Nom et poste */}
                  <div className='mb-2 text-center'>
                    <Typography variant='h6'>{performer.name}</Typography>
                    <Typography variant='body2' color='textSecondary'>
                      {performer.jobPosition || 'Collaborateur'}
                    </Typography>
                  </div>

                  {/* Statistiques */}
                  <div className='mb-2'>
                    <div className='flex items-center justify-center'>
                      <TrendingUp color='success' fontSize='small' />
                      <Typography
                        variant='body2'
                        className='ml-1 text-green-600'
                      >
                        {improvement > 0
                          ? `+${Math.round(improvement)}% d'amélioration`
                          : 'Aucune amélioration'}
                      </Typography>
                    </div>
                    <div className='mt-1 flex justify-between text-xs text-gray-600'>
                      <span>
                        Avant : <strong>{before}%</strong>
                      </span>
                      <span>
                        Après : <strong>{after}%</strong>
                      </span>
                    </div>
                  </div>

                  {/* TechChip */}
                  <div className='mt-4 text-center'>
                    <TechChip
                      technology={
                        performer.performerOfTheWeek?.technologyId?.name ||
                        'Tech'
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            )
          })}
      </div>
    </div>
  )
}

export default PerformersOfTheWeek

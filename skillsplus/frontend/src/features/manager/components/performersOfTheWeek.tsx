import React, { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Performer, PerformerService } from '@/services/performer.service'
import { TrendingUp, EmojiEvents } from '@mui/icons-material'
// Assurez-vous que le chemin est correct
import {
  Typography,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Tooltip,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import dayjs from 'dayjs'
import advancedFormat from 'dayjs/plugin/advancedFormat'
import 'dayjs/plugin/advancedFormat'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
} from 'recharts'

dayjs.extend(advancedFormat)
// Palette de couleurs par technologie
const TECHNOLOGY_COLORS: Record<string, string> = {
  'React.js': '#ffc2d1',
  Angular: '#ff4d6d',
  'Vue.js': '#83c5be',
  'Express.js': '#ff9770',
  Laravel: '#be95c4',
  'Next.js': '#abc4ff',
  NestJS: '#00afb9',
  Flutter: '#abc4ff',
  Django: '#f7edf0',
  'Spring Boot': '#ffb700',
}

// Composant personnalisé pour afficher le Chip avec couleur dynamique
const TechChip = ({ technology }: { technology: string }) => {
  const color =
    TECHNOLOGY_COLORS[technology as keyof typeof TECHNOLOGY_COLORS] || '#cccccc' // Couleur par défaut

  return (
    <div
      className='inline-flex items-center rounded-full px-3 py-1 font-bold text-white shadow-md'
      style={{ backgroundColor: color }}
    >
      <EmojiEvents fontSize='small' style={{ fontSize: 16, marginRight: 6 }} />
      <span>{`${technology}`}</span>
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
        setError(
          err instanceof Error
            ? err.message
            : 'Une erreur inconnue est survenue'
        )
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

  const getImprovementPercentage = (before: number, after: number): string => {
    if (before === 0) return after > 0 ? '+∞%' : '0%' // Gestion du cas division par zéro
    const improvement = ((after - before) / before) * 100
    return `${improvement > 0 ? '+' : ''}${improvement.toFixed(1)}%`
  }

  const getChartData = (performer: Performer) => {
    const performerTechId = performer.performerOfTheWeek?.technologyId?._id
    if (!performerTechId) return []
    const techData = performer.technology_success_rate.find((t) => {
      return t.technologyId._id === performerTechId
    })
    return (
      techData?.history?.map((item) => ({
        date: dayjs(item.date).format('DD/MM'),
        rate: item.successRate,
      })) || []
    )
  }

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
    <div className='flex w-full justify-center'>
      <Card
        className={`mx-auto !rounded-3xl border-0 shadow-md ${
          filteredPerformers.length <= 3 ? '!w-fit' : '!w-[1180px]'
        }`}
      >
        <CardContent className='p-6'>
          <div className='mb-6 flex items-center justify-between'>
            <div className='w-full text-center text-xl dancing-script'>
              <EmojiEvents sx={{ color: 'gold' }} fontSize='large' />

              <Typography
                variant='h6'
                component='h2'
                className='dancing-script text-xl font-semibold leading-tight'
              >
                Performers of the
                <br />
                Week
              </Typography>
            </div>
          </div>

          <div className='flex flex-wrap justify-center gap-6'>
            {filteredPerformers.map((performer) => {
              const chartData = getChartData(performer)

              const beforeValue =
                chartData.length > 1 ? chartData[chartData.length - 2].rate : 0
              const afterValue =
                chartData.length > 0 ? chartData[chartData.length - 1].rate : 0

              console.log(
                `Collaborateur: ${performer.name} | Before: ${beforeValue} | After: ${afterValue}`
              )

              return (
                <Tooltip
                  key={performer._id}
                  title={
                    <div className='p-1'>
                      <Typography
                        variant='caption'
                        color='textSecondary'
                        component='div'
                        className='mb-1 block'
                      >
                        Évolution du taux de réussite
                      </Typography>
                      <ResponsiveContainer width={280} height={120}>
                        {chartData.length > 0 ? (
                          <LineChart
                            data={chartData}
                            margin={{ top: 5, right: 40, left: 5, bottom: 0 }}
                          >
                            {/* Supprimer la grille */}
                            <CartesianGrid
                              stroke='transparent'
                              vertical={false}
                            />

                            {/* Axe X sans traits */}
                            <XAxis
                              dataKey='date'
                              axisLine={true}
                              tickLine={false}
                              tick={{
                                fontSize: 10,
                                fill: theme.palette.text.secondary,
                              }}
                            />

                            {/* Axe Y sans traits */}
                            <YAxis
                              domain={[0, 100]}
                              axisLine={true}
                              tickLine={false}
                              tick={{
                                fontSize: 10,
                                fill: theme.palette.text.secondary,
                              }}
                            />

                            <ChartTooltip
                              formatter={(value: unknown) => [
                                `${value}%`,
                                'Taux de réussite',
                              ]}
                              labelFormatter={(label: unknown) =>
                                `Date: ${label}`
                              }
                            />

                            <Line
                              type='monotone'
                              dataKey='rate'
                              stroke={theme.palette.primary.main}
                              strokeWidth={2}
                              dot={{ r: 4 }}
                              activeDot={{ r: 6 }}
                            />
                          </LineChart>
                        ) : (
                          <Typography
                            color='textSecondary'
                            variant='caption'
                            className='text-sm'
                          >
                            Pas de données disponibles
                          </Typography>
                        )}
                      </ResponsiveContainer>
                    </div>
                  }
                  placement='top'
                  classes={{ tooltip: '!rounded-3xl' }} // Applique la classe Tailwind
                  slotProps={{
                    tooltip: {
                      style: {
                        backgroundColor: '#fdfcdc', // Fond personnalisé
                        boxShadow: theme.shadows[4],
                        borderRadius: 8,
                        pointerEvents: 'auto',
                      },
                    },
                  }}
                >
                  <Card
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
                    className='h-full !w-[260px] !rounded-3xl transition-all duration-300 hover:translate-y-[-2px] hover:shadow-md'
                  >
                    <CardContent className='p-4'>
                      <div className='mb-4 flex items-center'>
                        <div>
                          <Typography variant='h6' component='div'>
                            {performer.name || 'hhhhh'}
                          </Typography>
                          <Typography variant='body2' color='textSecondary'>
                            {performer.jobPosition || 'Collaborateur'}
                          </Typography>
                        </div>
                      </div>

                      <div className='mb-1 flex items-center'>
                        <TrendingUp color='success' fontSize='small' />
                        <Typography
                          variant='body2'
                          className='ml-1 text-green-600'
                        >
                          {getImprovementPercentage(
                            beforeValue, // Utilisez les mêmes valeurs que pour le graphique
                            afterValue
                          )}{' '}
                          d'amélioration
                        </Typography>
                      </div>

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
                </Tooltip>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default PerformersOfTheWeek

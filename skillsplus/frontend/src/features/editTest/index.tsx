import React, { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Question } from '@/interfaces/question.interface'
import { getTestById, updateTest } from '@/services/test.service'
import { PlusIcon, MinusIcon } from 'lucide-react'
import {
  FileText,
  User,
  Code,
  Calendar,
  Clock,
  Trophy,
  List,
  CheckCircle,
  BarChart2,
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import QuestionItem from '@/features/createTests/components/questionItem'
import { useAuth } from '../../context/authContext'
import TechnologyService from '../../services/technology.service'

interface EditTestFormProps {
  testId: string
}

interface Technology {
  _id: string
  name: string
}

const EditTestForm: React.FC<EditTestFormProps> = ({ testId }) => {
  const DEFAULT_MAX_SCORE = 100
  const DEFAULT_MAX_QUESTIONS = 20

  const [technologies, setTechnologies] = useState<Technology[]>([])
  const [title, setTitle] = useState('')
  const [level, setLevel] = useState('junior')
  const [technologyId, setTechnologyId] = useState('')
  const [description, setDescription] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [duration, setDuration] = useState(60)
  const [questions, setQuestions] = useState<Question[]>([])
  const [maxScore, setMaxScore] = useState(DEFAULT_MAX_SCORE)
  const [maxQuestions, setMaxQuestions] = useState(DEFAULT_MAX_QUESTIONS)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { user } = useAuth()
  const navigate = useNavigate()

  const remainingScore =
    maxScore - questions.reduce((sum, q) => sum + q.points, 0)
  const questionsRemaining = maxQuestions - questions.length

  useEffect(() => {
    const controller = new AbortController()

    const fetchData = async () => {
      try {
        const [test, techs] = await Promise.all([
          getTestById(testId, { signal: controller.signal }),
          TechnologyService.getTechnologies(),
        ])

        if (typeof techs !== 'object') {
          throw new Error('Format de données invalide pour les technologies')
        }

        // Convertir l'objet en tableau pour l'utiliser dans le select
        const technologiesArray = Object.values(techs) as Technology[]
        setTechnologies(technologiesArray)
        setTitle(test.title)
        setLevel(test.level)
        setTechnologyId(test.technology._id)
        setDescription(test.description)
        setScheduledDate(test.scheduledDate)
        setDuration(test.duration)
        setQuestions(test.questions)
        setMaxScore(
          test.questions.reduce(
            (sum: any, q: { points: any }) => sum + q.points,
            0
          )
        )
        setMaxQuestions(test.questions.length)
      } catch (error) {
        if (!controller.signal.aborted) {
          toast.error('Erreur lors du chargement des données')
          console.error('Erreur:', error)
          navigate({ to: '/dashboard-manager' })
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    fetchData()

    return () => controller.abort()
  }, [testId, navigate])

  const handleTechnologyChange = (event: {
    target: { value: React.SetStateAction<string> }
  }) => {
    setTechnologyId(event.target.value)
  }

  const handleAddQuestion = () => {
    if (remainingScore <= 0) {
      toast.error('Score restant insuffisant')
      return
    }
    if (questions.length >= maxQuestions) {
      toast.error(`Maximum ${maxQuestions} questions autorisées`)
      return
    }
    setQuestions((prev) => [
      ...prev,
      {
        questionText: '',
        options: ['', ''],
        points: 1,
        type: 'single',
        correctAnswer: '',
        correctAnswers: [],
        level: 'basic',
      },
    ])
  }

  const handleRemoveQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index))
  }

  const handleAddOption = (questionIndex: number) => {
    setQuestions((prev) => {
      const updated = [...prev]
      updated[questionIndex].options.push('')
      return updated
    })
  }

  const handleRemoveOption = (questionIndex: number, optionIndex: number) => {
    setQuestions((prev) => {
      const updated = [...prev]
      updated[questionIndex].options.splice(optionIndex, 1)
      return updated
    })
  }

  const handleQuestionPointsChange = (index: number, points: number) => {
    const newTotal = questions.reduce(
      (sum, q, i) => sum + (i === index ? points : q.points),
      0
    )

    if (newTotal > maxScore) {
      toast.error('Le score total dépasse le maximum autorisé')
      return
    }

    setQuestions((prev) => {
      const updated = [...prev]
      updated[index].points = points
      return updated
    })
  }

  const handleChangeQuestion = (
    index: number,
    field: keyof Question,
    value: string | number | string[] | 'single' | 'multiple' | 'code'
  ) => {
    setQuestions((prev) => {
      const updated = [...prev]
      const question = { ...updated[index], [field]: value }

      if (field === 'type') {
        if (value === 'single') {
          question.correctAnswers = []
        } else if (value === 'multiple') {
          question.correctAnswer = ''
        }
      }

      updated[index] = question
      return updated
    })
  }

  const handleOptionChange = (
    qIndex: number,
    oIndex: number,
    value: string
  ) => {
    setQuestions((prev) => {
      const updated = [...prev]
      updated[qIndex].options[oIndex] = value
      return updated
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    if (!title || !technologyId || questions.length === 0) {
      toast.error('Veuillez remplir tous les champs requis')
      setIsSubmitting(false)
      return
    }

    if (questions.some((q) => q.options.length < 2)) {
      toast.error('Chaque question doit avoir au moins 2 options')
      setIsSubmitting(false)
      return
    }

    if (
      questions.some(
        (q) =>
          (q.type === 'single' && !q.correctAnswer) ||
          (q.type === 'multiple' &&
            (!q.correctAnswers || q.correctAnswers.length === 0))
      )
    ) {
      toast.error(
        'Veuillez sélectionner une bonne réponse pour chaque question'
      )
      setIsSubmitting(false)
      return
    }

    try {
      await updateTest(testId, {
        title,
        level,
        technology: technologyId,
        description,
        scheduledDate: scheduledDate || undefined,
        duration,
        questions: questions.map((q) => ({
          ...q,
          options: q.options.filter((opt) => opt.trim() !== ''),
        })),
      })

      toast.success('Test mis à jour avec succès')
      navigate({ to: '/dashboard-manager' })
    } catch (error) {
      console.error('Erreur:', error)
      toast.error(
        error instanceof Error ? error.message : 'Erreur lors de la mise à jour'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <div className='h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-500'></div>
      </div>
    )
  }
  console.log('technologies', technologies)
  return (
    <div className='mx-auto max-w-4xl p-4'>
      <Toaster />

      <div className='fixed right-4 top-4 z-50 flex flex-col items-end gap-2'>
        <div className='rounded-xl bg-white p-3 shadow-md transition-all duration-300 hover:scale-105 hover:shadow-lg'>
          <div className='flex items-center space-x-2'>
            <div className='rounded-full bg-blue-100 p-2'>
              <BarChart2 className='h-5 w-5 text-blue-600' />
            </div>
            <div className='text-right'>
              <div className='text-lg text-gray-800'>
                {remainingScore} / {maxScore}
              </div>
              <div className='text-sm text-gray-500'>Score</div>
            </div>
          </div>
        </div>
        <div className='rounded-xl bg-white p-3 shadow-md transition-all duration-300 hover:scale-105 hover:shadow-lg'>
          <div className='flex items-center space-x-2'>
            <div className='rounded-full bg-green-100 p-2'>
              <CheckCircle className='h-5 w-5 text-green-600' />
            </div>
            <div className='text-right'>
              <div className='text-lg text-gray-800'>
                {questionsRemaining} / {maxQuestions}
              </div>
              <div className='text-sm text-gray-500'>Questions</div>
            </div>
          </div>
        </div>
      </div>

      <div className='rounded-3xl bg-gradient-to-r from-blue-50 via-white to-purple-50 p-8 shadow-xl'>
        <h2 className='mb-8 text-center text-3xl font-bold text-gray-800'>
          Modifier un Test
        </h2>

        <form onSubmit={handleSubmit} className='space-y-8'>
          <div className='rounded-2xl bg-white p-6 shadow-md transition-all duration-300 hover:shadow-lg'>
            <h3 className='mb-4 border-b pb-2 text-lg font-semibold text-gray-700'>
              Informations générales
            </h3>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              <div>
                <label className='mb-1 block text-sm font-medium text-gray-700'>
                  Titre *
                </label>
                <div className='relative'>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className='w-full rounded-2xl border border-gray-300 p-3 pl-10 transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                    required
                  />
                  <FileText className='absolute left-3 top-3 h-5 w-5 text-gray-400' />
                </div>
              </div>
              <div>
                <label className='mb-1 block text-sm font-medium text-gray-700'>
                  Niveau *
                </label>
                <div className='relative'>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className='w-full appearance-none rounded-2xl border border-gray-300 p-3 pl-10 transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                  >
                    <option value='junior'>Junior</option>
                    <option value='intermediate'>Intermédiaire</option>
                    <option value='senior'>Senior</option>
                  </select>
                  <User className='absolute left-3 top-3 h-5 w-5 text-gray-400' />
                </div>
              </div>
            </div>
          </div>

          <div className='rounded-2xl bg-white p-6 shadow-md transition-all duration-300 hover:shadow-lg'>
            <h3 className='mb-4 border-b pb-2 text-lg font-semibold text-gray-700'>
              Technologie & Date
            </h3>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              <div>
                <label className='mb-1 block text-sm font-medium text-gray-700'>
                  Technologie *
                </label>
                <div className='relative'>
                  <select
                    id='technology'
                    value={technologyId || ''}
                    onChange={handleTechnologyChange}
                    className='w-full appearance-none rounded-2xl border border-gray-300 p-3 pl-10 transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                    required
                  >
                    <option value=''>Sélectionner une technologie</option>
                    {technologies.map((tech) => (
                      <option key={tech._id} value={tech._id}>
                        {tech.name}
                      </option>
                    ))}
                  </select>

                  <Code className='absolute left-3 top-3 h-5 w-5 text-gray-400' />
                </div>
              </div>
              <div>
                <label className='mb-1 block text-sm font-medium text-gray-700'>
                  Date de planification
                </label>
                <div className='relative'>
                  <input
                    type='datetime-local'
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className='w-full rounded-2xl border border-gray-300 p-3 pl-10 transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                  />
                  <Calendar className='absolute left-3 top-3 h-5 w-5 text-gray-400' />
                </div>
              </div>
            </div>
          </div>

          <div className='rounded-2xl bg-white p-6 shadow-md transition-all duration-300 hover:shadow-lg'>
            <h3 className='mb-4 border-b pb-2 text-lg font-semibold text-gray-700'>
              Description
            </h3>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className='w-full rounded-2xl border border-gray-300 p-3 transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
              rows={3}
            />
          </div>

          <div className='rounded-2xl bg-white p-6 shadow-md transition-all duration-300 hover:shadow-lg'>
            <h3 className='mb-4 border-b pb-2 text-lg font-semibold text-gray-700'>
              Paramètres du test
            </h3>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
              <div>
                <label className='mb-1 block text-sm font-medium text-gray-700'>
                  Durée (minutes)
                </label>
                <div className='relative'>
                  <input
                    type='number'
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className='w-full rounded-2xl border border-gray-300 p-3 pl-10 transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                    min='1'
                  />
                  <Clock className='absolute left-3 top-3 h-5 w-5 text-gray-400' />
                </div>
              </div>
              <div>
                <label className='mb-1 block text-sm font-medium text-gray-700'>
                  Score Maximal
                </label>
                <div className='relative'>
                  <input
                    type='number'
                    value={maxScore}
                    onChange={(e) => setMaxScore(Number(e.target.value))}
                    className='w-full rounded-2xl border border-gray-300 p-3 pl-10 transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                    min='1'
                  />
                  <Trophy className='absolute left-3 top-3 h-5 w-5 text-gray-400' />
                </div>
              </div>
              <div>
                <label className='mb-1 block text-sm font-medium text-gray-700'>
                  Nombre de questions
                </label>
                <div className='relative'>
                  <input
                    type='number'
                    value={maxQuestions}
                    onChange={(e) => setMaxQuestions(Number(e.target.value))}
                    className='w-full rounded-2xl border border-gray-300 p-3 pl-10 transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                    min='1'
                  />
                  <List className='absolute left-3 top-3 h-5 w-5 text-gray-400' />
                </div>
              </div>
            </div>
          </div>

          <div className='rounded-2xl bg-white p-6 shadow-md transition-all duration-300 hover:shadow-lg'>
            <h3 className='mb-4 border-b pb-2 text-lg font-semibold text-gray-700'>
              Questions
            </h3>
            {questions.map((q, qIdx) => (
              <div key={qIdx} className='mb-4 flex w-full items-center gap-4'>
                <div className='relative flex-1'>
                  <QuestionItem
                    question={q}
                    questionIndex={qIdx}
                    onQuestionChange={handleChangeQuestion}
                    onOptionChange={handleOptionChange}
                    onAddOption={handleAddOption}
                    onRemoveOption={handleRemoveOption}
                    onPointsChange={handleQuestionPointsChange}
                    maxPoints={remainingScore + q.points}
                    onRemoveQuestion={handleRemoveQuestion}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className='flex justify-center space-x-6 pt-4'>
            <button
              onClick={handleAddQuestion}
              disabled={
                questionsRemaining <= 0 || remainingScore <= 0 || isSubmitting
              }
              className='transform rounded-full bg-green-100 p-3 text-green-600 shadow-md transition-all duration-200 hover:scale-105 hover:bg-green-200 active:scale-95 disabled:opacity-50'
              type='button'
            >
              <PlusIcon className='h-6 w-6' />
            </button>
            <button
              type='submit'
              disabled={isSubmitting}
              className='flex items-center justify-center rounded-full bg-blue-100 px-6 py-3 text-blue-600 shadow-md transition-all duration-200 hover:bg-blue-200 active:scale-95 disabled:opacity-50'
            >
              {isSubmitting ? (
                <span className='flex items-center'>
                  <span className='mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-blue-600'></span>
                  Enregistrement...
                </span>
              ) : (
                <>
                  Mettre à jour{' '}
                  <span className='ml-2 text-lg font-bold'>✓</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditTestForm

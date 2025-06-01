import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Question } from '@/interfaces/question.interface'
import { PlusIcon } from 'lucide-react'
import {
  FileText,
  User,
  Code,
  Calendar,
  Clock,
  Trophy,
  List,
} from 'lucide-react'
import { CheckCircle, BarChart2 } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import apiClient from '@/lib/api-client'
import { useAuth } from '../../context/authContext'
import TechnologyService from '../../services/technology.service'
import QuestionItem from './components/questionItem'

interface Technology {
  name: string
  id?: string
}

const AddTestForm: React.FC = () => {
  // Constantes de configuration
  const DEFAULT_MAX_SCORE = 100
  const DEFAULT_MAX_QUESTIONS = 20

  // States
  const [technologies, setTechnologies] = useState<Technology[]>([])
  const [title, setTitle] = useState('')
  const [level, setLevel] = useState('junior')
  const [technology, setTechnology] = useState('')
  const [description, setDescription] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [duration, setDuration] = useState(60)
  const [questions, setQuestions] = useState<Question[]>([
    {
      questionText: '',
      options: ['', ''],
      points: 1,
      type: 'single',
      correctAnswer: '',
      correctAnswers: [],
      level: 'basic', // Valeur par défaut
    },
  ])
  const [maxScore, setMaxScore] = useState(DEFAULT_MAX_SCORE)
  const [maxQuestions, setMaxQuestions] = useState(DEFAULT_MAX_QUESTIONS)
  const { user } = useAuth()

  // Valeurs calculées
  const remainingScore =
    maxScore - questions.reduce((sum, q) => sum + q.points, 0)
  const questionsRemaining = maxQuestions - questions.length

  // Récupérer les technologies
  useEffect(() => {
    const fetchTechnologies = async () => {
      try {
        const techNames = await TechnologyService.getFilteredTechnologies()
        if (Array.isArray(techNames)) {
          const techObjects = techNames.map((name) => ({ name }))
          setTechnologies(techObjects)
        } else {
          throw new Error('Les données retournées ne sont pas un tableau')
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des technologies', error)
        toast.error('Erreur lors du chargement des technologies')
      }
    }

    fetchTechnologies()
  }, [])

  // Ajouter une nouvelle question
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
        level: 'basic', // Valeur par défaut
      },
    ])
  }
  // Ajoutez cette fonction avec vos autres handlers
  const handleRemoveQuestion = (questionIndex: number) => {
    setQuestions((prevQuestions) => {
      const updated = [...prevQuestions]
      updated.splice(questionIndex, 1) // Supprime la question à l'index donné
      return updated
    })
  }

  // Ajouter une option à une question
  const handleAddOption = (questionIndex: number) => {
    setQuestions((prev) => {
      const updated = [...prev]
      updated[questionIndex].options.push('')
      return updated
    })
  }

  // Supprimer une option
  const handleRemoveOption = (questionIndex: number, optionIndex: number) => {
    setQuestions((prev) => {
      const updated = [...prev]
      const deletedOption = updated[questionIndex].options[optionIndex]

      if (updated[questionIndex].correctAnswer === deletedOption) {
        updated[questionIndex].correctAnswer = ''
      }

      updated[questionIndex].options.splice(optionIndex, 1)
      return updated
    })
  }

  // Modifier les points d'une question
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

  // Soumettre le formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    console.log('Questions:', questions)

    if (!title || !technology || questions.length === 0) {
      toast.error('Veuillez remplir tous les champs requis')
      return
    }

    if (questions.some((q) => q.options.length < 2)) {
      toast.error('Chaque question doit avoir au moins 2 options')
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
      return
    }

    try {
      await apiClient.post('/api/tests/add', {
        title,
        level,
        technology,
        description,
        scheduledDate,
        duration,
        createdBy: user?.id,
        questions,
      })
      toast.success('Test créé avec succès')

      // Réinitialisation
      setTitle('')
      setTechnology('')
      setDescription('')
      setScheduledDate('')
      setQuestions([
        {
          questionText: '',
          options: ['', ''],
          points: 1,
          type: 'single',
          correctAnswer: '',
          correctAnswers: [],
          level: 'basic', // Valeur par défaut
        },
      ])
      setMaxScore(DEFAULT_MAX_SCORE)
      setMaxQuestions(DEFAULT_MAX_QUESTIONS)
    } catch (err) {
      toast.error('Erreur lors de la création du test')
    }
  }

  // Modifier un champ de question
  const handleChangeQuestion = (
    index: number,
    field: keyof Question,
    value: string | number | string[]
  ) => {
    setQuestions((prevQuestions) => {
      const updated = [...prevQuestions]
      const question = { ...updated[index], [field]: value }

      if (field === 'type') {
        if (value === 'single') {
          question.correctAnswers = []
          question.correctAnswer = ''
        } else if (value === 'multiple') {
          question.correctAnswer = ''
          question.correctAnswers = []
        }
      }

      updated[index] = question
      return updated
    })
  }

  // Modifier une option
  const handleOptionChange = (
    qIndex: number,
    oIndex: number,
    value: string
  ) => {
    setQuestions((prevQuestions) => {
      const updated = [...prevQuestions]
      updated[qIndex].options[oIndex] = value
      return updated
    })
  }

  return (
    <div className='mx-auto max-w-4xl p-4'>
      <Toaster />

      {/* Compteurs alignés à droite, empilés verticalement */}
      <div className='fixed right-4 top-4 z-50 flex flex-col items-end gap-2'>
        {/* Compteur de score */}
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

        {/* Compteur de questions */}
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
          Créer un Test
        </h2>

        <form onSubmit={handleSubmit} className='space-y-8'>
          {/* Section 1 : Informations générales */}
          <div className='rounded-2xl bg-white p-6 shadow-md transition-all duration-300 hover:shadow-lg'>
            <h3 className='mb-4 border-b pb-2 text-lg font-semibold text-gray-700'>
              Informations générales
            </h3>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              {/* Titre */}
              <div>
                <label
                  htmlFor='title'
                  className='mb-1 block text-sm font-medium text-gray-700'
                >
                  Titre *
                </label>
                <div className='relative'>
                  <input
                    id='title'
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className='w-full rounded-2xl border border-gray-300 p-3 pl-10 transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                    required
                  />
                  <span className='absolute left-3 top-3 text-gray-400'>
                    <FileText className='h-5 w-5' />
                  </span>
                </div>
              </div>

              {/* Niveau */}
              <div>
                <label
                  htmlFor='level'
                  className='mb-1 block text-sm font-medium text-gray-700'
                >
                  Niveau *
                </label>
                <div className='relative'>
                  <select
                    id='level'
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className='w-full appearance-none rounded-2xl border border-gray-300 p-3 pl-10 transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                  >
                    <option value='junior'>Junior</option>
                    <option value='intermediate'>Intermédiaire</option>
                    <option value='senior'>Senior</option>
                  </select>
                  <span className='absolute left-3 top-3 text-gray-400'>
                    <User className='h-5 w-5' />
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2 : Date & Technologie */}
          <div className='rounded-2xl bg-white p-6 shadow-md transition-all duration-300 hover:shadow-lg'>
            <h3 className='mb-4 border-b pb-2 text-lg font-semibold text-gray-700'>
              Technologie & Date
            </h3>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              {/* Technologie */}
              <div>
                <label
                  htmlFor='technology'
                  className='mb-1 block text-sm font-medium text-gray-700'
                >
                  Technologie *
                </label>
                <div className='relative'>
                  <select
                    id='technology'
                    value={technology}
                    onChange={(e) => setTechnology(e.target.value)}
                    className='w-full appearance-none rounded-2xl border border-gray-300 p-3 pl-10 transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                    required
                  >
                    <option value=''>Sélectionnez une technologie</option>
                    {technologies.map((tech, index) => (
                      <option key={index} value={tech.name}>
                        {tech.name}
                      </option>
                    ))}
                  </select>
                  <span className='absolute left-3 top-3 text-gray-400'>
                    <Code className='h-5 w-5' />
                  </span>
                </div>
              </div>

              {/* Date */}
              <div>
                <label
                  htmlFor='scheduledDate'
                  className='mb-1 block text-sm font-medium text-gray-700'
                >
                  Date de planification
                </label>
                <div className='relative'>
                  <input
                    id='scheduledDate'
                    type='datetime-local'
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className='w-full rounded-2xl border border-gray-300 p-3 pl-10 transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                  />
                  <span className='absolute left-3 top-3 text-gray-400'>
                    <Calendar className='h-5 w-5' />
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3 : Description */}
          <div className='rounded-2xl bg-white p-6 shadow-md transition-all duration-300 hover:shadow-lg'>
            <h3 className='mb-4 border-b pb-2 text-lg font-semibold text-gray-700'>
              Description
            </h3>
            <textarea
              id='description'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className='w-full rounded-2xl border border-gray-300 p-3 transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
              rows={3}
            />
          </div>

          {/* Section 4 : Paramètres du test */}
          <div className='rounded-2xl bg-white p-6 shadow-md transition-all duration-300 hover:shadow-lg'>
            <h3 className='mb-4 border-b pb-2 text-lg font-semibold text-gray-700'>
              Paramètres du test
            </h3>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
              {/* Durée */}
              <div>
                <label
                  htmlFor='duration'
                  className='mb-1 block text-sm font-medium text-gray-700'
                >
                  Durée (minutes)
                </label>
                <div className='relative'>
                  <input
                    id='duration'
                    type='number'
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className='w-full rounded-2xl border border-gray-300 p-3 pl-10 transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                    min='1'
                  />
                  <span className='absolute left-3 top-3 text-gray-400'>
                    <Clock className='h-5 w-5' />
                  </span>
                </div>
              </div>

              {/* Score Maximal */}
              <div>
                <label
                  htmlFor='maxScore'
                  className='mb-1 block text-sm font-medium text-gray-700'
                >
                  Score Maximal
                </label>
                <div className='relative'>
                  <input
                    id='maxScore'
                    type='number'
                    value={maxScore}
                    onChange={(e) => setMaxScore(Number(e.target.value))}
                    className='w-full rounded-2xl border border-gray-300 p-3 pl-10 transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                    min='1'
                  />
                  <span className='absolute left-3 top-3 text-gray-400'>
                    <Trophy className='h-5 w-5' />
                  </span>
                </div>
              </div>

              {/* Nombre de questions */}
              <div>
                <label
                  htmlFor='maxQuestions'
                  className='mb-1 block text-sm font-medium text-gray-700'
                >
                  Nombre de questions
                </label>
                <div className='relative'>
                  <input
                    id='maxQuestions'
                    type='number'
                    value={maxQuestions}
                    onChange={(e) => setMaxQuestions(Number(e.target.value))}
                    className='w-full rounded-2xl border border-gray-300 p-3 pl-10 transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                    min='1'
                  />
                  <span className='absolute left-3 top-3 text-gray-400'>
                    <List className='h-5 w-5' />
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5 : Liste des questions */}
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

          {/* Boutons d'action */}
          <div className='flex justify-center space-x-6 pt-4'>
            <button
              onClick={handleAddQuestion}
              className='transform rounded-full bg-green-100 p-3 text-green-600 shadow-md transition-all duration-200 hover:scale-105 hover:bg-green-200 active:scale-95'
              disabled={questionsRemaining <= 0 || remainingScore <= 0}
              type='button'
            >
              <PlusIcon className='h-6 w-6' />
            </button>
            <button
              type='submit'
              className='flex items-center justify-center rounded-full bg-blue-100 px-6 py-3 text-blue-600 shadow-md transition-all duration-200 hover:bg-blue-200 active:scale-95'
            >
              Créer <span className='ml-2 text-lg font-bold'>✓</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddTestForm

import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { getSubmission, sendAnswer } from '@/services/submission.service'
import { fetchQuiz } from '@/services/test.service'
import Editor from '@monaco-editor/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, CheckCircle2, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/context/authContext'
import { quizSchema } from '@/features/TestParticipation/validation/quizSchema'
import { useAuthStore } from '@/stores/authStore'

// Interfaces
export interface Question {
  _id: string
  questionText: string
  options: string[]
  correctAnswer?: string
  correctAnswers?: string[]
  type: 'single' | 'multiple' | 'code'
  points: number
  level: 'basic' | 'intermediate' | 'expert'
  language?: string
  codeTemplate?: string
  duration?: number
}

export interface QuizData {
  testId: string
  title: string
  questions: Question[]
  TestBasicScore: number
  TestIntermediateScore: number
  TestExpertScore: number
  TestMaxScore: number
}

interface QuizInterfaceProps {
  testId: string
}

const QuizInterface: React.FC<QuizInterfaceProps> = ({ testId }) => {
      const navigate = useNavigate()
      const token = useAuthStore((state) => state.auth.accessToken)
  
    useEffect(() => {
      if (!token) {
        navigate({ to: '/sign-in' })
      }
    }, [token, navigate])


  //if (!token) return null
  const [quiz, setQuiz] = useState<QuizData | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [timeLeft, setTimeLeft] = useState(30)
  const [isValidated, setIsValidated] = useState(false)
  const [isTimeUp, setIsTimeUp] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasAnswered, setHasAnswered] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  const [fullscreenInitialized, setFullscreenInitialized] = useState(false)
  const [fullscreenLocked, setFullscreenLocked] = useState(true)
  const [fullscreenError, setFullscreenError] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showFullscreenWarning, setShowFullscreenWarning] = useState(false)
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(
    null
  )

  const [isJoinButtonDisabled, setIsJoinButtonDisabled] = useState(false)
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { user } = useAuth()
  const userId = user?.id ?? null

  const [finalResults, setFinalResults] = useState<{
    totalScore: number
    successRate: number
    basicScore: number
    intermediateScore: number
    expertScore: number
    estimatedLevel: string
    basicRate: number
    intermediateRate: number
    expertRate: number
  } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [codeAnswer, setCodeAnswer] = useState<string>('')

  type MyNavigationState = {
    testId?: string
    wasKickedOut?: boolean
  }

  // Version optimisée de enterFullscreen
  const enterFullscreen = async () => {
    if (!containerRef.current) return

    try {
      const elem = containerRef.current
      if (document.fullscreenElement) {
        setIsFullscreen(true)
        return
      }

      if (elem.requestFullscreen) {
        await elem.requestFullscreen()
      } else if ((elem as any).webkitRequestFullscreen) {
        await (elem as any).webkitRequestFullscreen()
      }
      setIsFullscreen(true)
      setFullscreenError(null)
    } catch (err) {
      console.error('Échec du plein écran:', err)
      setFullscreenError(
        'Le mode plein écran est requis. Veuillez actualiser la page et autoriser le plein écran.'
      )
      setShowFullscreenWarning(true)
    }
  }

  // Initialisation optimisée du plein écran
  useEffect(() => {
    const initializeFullscreen = async () => {
      try {
        await enterFullscreen()
        setFullscreenInitialized(true)

        // Vérification périodique toutes les secondes
        const checkInterval = setInterval(() => {
          if (!document.fullscreenElement && fullscreenLocked) {
            enterFullscreen()
          }
        }, 1000)

        return () => clearInterval(checkInterval)
      } catch (err) {
        console.error("Erreur d'initialisation:", err)
      }
    }

    if (!fullscreenInitialized) {
      initializeFullscreen()
    }
  }, [fullscreenInitialized, fullscreenLocked])

  // Blocage des sorties du plein écran
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement
      setIsFullscreen(isCurrentlyFullscreen)

      if (!isCurrentlyFullscreen && fullscreenLocked && !isNavigating) {
        setShowFullscreenWarning(true)
        setIsJoinButtonDisabled(true)
        setRedirectCountdown(5) // Initialise à 5 secondes

        // Clear d’un ancien intervalle s’il existe
        if (warningTimeoutRef.current) clearInterval(warningTimeoutRef.current)

        let count = 5
        const interval = setInterval(() => {
          count -= 1
          setRedirectCountdown(count)

          if (count === 0) {
            clearInterval(interval)
            setShowFullscreenWarning(false)
            navigate({
              to: '/calendar',
              state: {
                testId,
                userId,
                wasKickedOut: true,
              } as MyNavigationState,
              replace: true,
            })
          }
        }, 1000)

        warningTimeoutRef.current = interval
      } else {
        // Si retour en plein écran ou navigation, reset
        setShowFullscreenWarning(false)
        setIsJoinButtonDisabled(false)

        if (warningTimeoutRef.current) {
          clearInterval(warningTimeoutRef.current)
          warningTimeoutRef.current = null
        }

        setRedirectCountdown(null) // Réinitialise l'affichage du compte à rebours
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      if (warningTimeoutRef.current) clearInterval(warningTimeoutRef.current)
    }
  }, [fullscreenLocked, isNavigating])

  // Blocage des raccourcis clavier renforcé
  useEffect(() => {
    const blockKeys = (e: KeyboardEvent) => {
      const blockedKeys = ['Escape', 'F11', 'F1', 'Tab', 'Alt', 'Control']
      const isBlocked =
        blockedKeys.includes(e.key) || e.altKey || e.ctrlKey || e.metaKey

      if (isBlocked && fullscreenLocked) {
        e.preventDefault()
        e.stopPropagation()

        // Message d'avertissement pour l'utilisateur
        if (e.key === 'Escape') {
          setShowFullscreenWarning(true)
          setTimeout(() => setShowFullscreenWarning(false), 3000)
        }
      }
    }

    window.addEventListener('keydown', blockKeys, { capture: true })
    return () =>
      window.removeEventListener('keydown', blockKeys, { capture: true })
  }, [fullscreenLocked])

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        const data = await fetchQuiz(testId)
        quizSchema.parse(data)
        setQuiz(data)
        console.log('Quiz reçu depuis l’API:', data)

        // Validez que toutes les questions ont un _id
        if (data.questions.some((q: { _id: any }) => !q._id)) {
          throw new Error("Certaines questions n'ont pas d'ID !")
        }
      } catch (err: any) {
        setError(err.message || 'Impossible de charger le quiz.')
      } finally {
        setLoading(false)
      }
    }

    if (testId) {
      loadQuiz()
    } else {
      setError('Aucun ID de test fourni.')
      setLoading(false)
    }
  }, [testId])

  useEffect(() => {
    if (isTimeUp) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          setIsTimeUp(true)
          if (!hasAnswered) handleAnswerSubmission() // ❗évite double soumission
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isTimeUp, currentQuestionIndex, quiz, hasAnswered])

  useEffect(() => {
    if (!quiz || !quiz.questions[currentQuestionIndex]) return

    const currentQuestion = quiz.questions[currentQuestionIndex]

    const durationInSeconds = (currentQuestion.duration ?? 1) * 60

    setTimeLeft(durationInSeconds)
    setIsTimeUp(false)
    setSelectedOption(null)
    setSelectedOptions([])
    setShowFeedback(false)
    setIsValidated(false)
  }, [currentQuestionIndex, quiz])

  const handleAnswerSubmission = async () => {
    if (!quiz || isSubmitting) return

    setIsSubmitting(true)
    setHasAnswered(true)

    const question = quiz.questions[currentQuestionIndex]
    let response

    // DEBUG CRUCIAL - Vérifiez l'existence de la question et son ID
    console.log('Question actuelle:', {
      index: currentQuestionIndex,
      question,
      hasId: !!question?._id,
      allQuestions: quiz.questions.map((q) => q._id),
    })

    if (!question?._id) {
      console.error('ERREUR: question._id est manquant !')
      return
    }
    if (question.type === 'multiple') {
      response = await sendAnswer(quiz.testId, question._id, selectedOptions)
    } else if (question.type === 'code') {
      console.log('Code envoyé pour la question code:', codeAnswer)
      response = await sendAnswer(quiz.testId, question._id, codeAnswer)
    } else {
      response = await sendAnswer(
        quiz.testId,
        question._id,
        selectedOption || ''
      )
    }

    if (currentQuestionIndex === quiz.questions.length - 1) {
      setFinalResults(response.data)
      setIsSubmitting(false)
      return
    }

    setCurrentQuestionIndex((prev) => prev + 1)
    setSelectedOption(null)
    setSelectedOptions([])
    setCodeAnswer('')
    setShowFeedback(false)
    setTimeLeft(30)
    setIsSubmitting(false) // remets à false à la fin
    setIsTimeUp(false)
    setHasAnswered(false)
  }

  const formatTime = (seconds: number): string => {
    const min = Math.floor(seconds / 60)
    const sec = seconds % 60
    return `${min}:${sec.toString().padStart(2, '0')}`
  }

  const handleOptionSelect = (option: string) => {
    if (isTimeUp) return

    const question = quiz?.questions[currentQuestionIndex]
    if (!question) return

    if (question.type === 'multiple') {
      setSelectedOptions((prev) =>
        prev.includes(option)
          ? prev.filter((opt) => opt !== option)
          : [...prev, option]
      )
    } else {
      setSelectedOption(option)
    }
    setShowFeedback(false)
  }

  const handleValidate = async () => {
    if (!quiz || isValidated) return

    const question = quiz.questions[currentQuestionIndex]

    if (
      (question.type === 'single' && !selectedOption) ||
      (question.type === 'multiple' && selectedOptions.length === 0) ||
      (question.type === 'code' && !codeAnswer)
    ) {
      return
    }
    setIsValidated(true) // Marque comme validé
    setShowFeedback(true)
    handleAnswerSubmission()
  }

  // Fonction de sortie modifiée pour être plus robuste
  const handleExit = async () => {
    //setFullscreenLocked(false)
    setIsNavigating(true)

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      }
      navigate({ to: '/calendar' })
    } catch (err) {
      console.error('Erreur lors de la sortie:', err)
      window.location.href = '/calendar' // Fallback absolu
    }
  }
  function getNextLevel(currentLevel: string) {
    const levels = ['beginner', 'intermediate', 'expert']
    const currentIndex = levels.indexOf(currentLevel.toLowerCase())
    return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : 'max'
  }
  const getBadge = (results: any) => {
    const { basicScore, intermediateScore, expertScore } = results
    const {
      TestBasicScore: maxBasic,
      TestIntermediateScore: maxInter,
      TestExpertScore: maxExpert,
    } = quiz as any

    const hasBasic = basicScore === maxBasic
    const hasIntermediate = intermediateScore === maxInter
    const hasExpert = expertScore === maxExpert

    if (hasBasic && hasIntermediate && hasExpert) return 'Platinum'
    if (!hasBasic && hasIntermediate && hasExpert) return 'Gold'
    if (hasBasic && hasIntermediate && !hasExpert) return 'Silver'
    if (hasBasic && !hasIntermediate && !hasExpert) return 'Bronze'

    return 'Aucun'
  }

  const getBadgeColor = (results: any) => {
    const badge = getBadge(results)
    switch (badge) {
      case 'Bronze':
        return '#cd7f32'
      case 'Silver':
        return '#c0c0c0'
      case 'Gold':
        return '#ffd700'
      case 'Platinum':
        return '#e5e4e2'
      default:
        return '#6b7280' // Gris
    }
  }

  const renderFinalResults = () => {
    if (!finalResults) return null

    // Récupération des scores maximaux avec valeurs par défaut
    const maxScores = {
      basic: (quiz as any)?.TestBasicScore,
      intermediate: (quiz as any)?.TestIntermediateScore,
      expert: (quiz as any)?.TestExpertScore,
      total: (quiz as any)?.TestMaxScore,
    }

    console.log('Valeurs maxScores extraites du quiz :', maxScores)

    const levelDetails = [
      {
        label: 'Basic',
        key: 'basic',
        score: finalResults.basicScore,

        max: maxScores.basic,
      },
      {
        label: 'Intermediate',
        key: 'intermediate',
        score: finalResults.intermediateScore,

        max: maxScores.intermediate,
      },
      {
        label: 'Expert',
        key: 'expert',
        score: finalResults.expertScore,

        max: maxScores.expert,
      },
    ].filter((level) => level.max > 0)

    // Calcul du nombre d’étoiles obtenues (un niveau = une étoile si score max)
    const starCount = levelDetails.filter(
      (level) => level.score === level.max
    ).length

    return (
      <AnimatePresence>
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className='w-full max-w-xl rounded-3xl bg-white p-8 shadow-xl'
          >
            <h2 className='mb-2 text-center text-3xl font-bold text-purple-800'>
              🏆 Test Results 🏆
            </h2>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className='mb-6 rounded-lg bg-purple-50 p-4 text-center'
            >
              <div className='text-lg font-semibold text-purple-700'>
                🌟 Overall Performance: {finalResults.totalScore}/
                {maxScores.total} pts 🌟
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className='mb-4'
            >
              <h3 className='mb-3 text-lg font-semibold'>📊 Score by Level:</h3>
              <div className='overflow-hidden rounded-lg border'>
                <table className='w-full'>
                  <thead className='bg-gray-100'>
                    <tr>
                      <th className='px-4 py-2 text-left'>Niveau</th>
                      <th className='px-4 py-2 text-right'>Score</th>
                      <th className='px-4 py-2 text-right'>Success Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {levelDetails.map((level) => {
                      const rate =
                        level.max > 0 ? (level.score / level.max) * 100 : 0
                      let color = 'text-red-600'
                      if (rate >= 80) color = 'text-green-600'
                      else if (rate >= 50) color = 'text-orange-500'

                      return (
                        <tr key={level.key} className='border-t'>
                          <td className='px-4 py-3 font-medium'>
                            {level.label}
                          </td>
                          <td className='px-4 py-3 text-right'>
                            {level.score}/{level.max}
                            {level.score === level.max && ' ⭐'}
                          </td>
                          <td
                            className={`px-4 py-3 text-right font-semibold ${color}`}
                          >
                            {Math.round(rate)}%
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className='mb-6 rounded-lg bg-blue-50 p-4 text-center'
            >
              <h3 className='mb-2 text-lg font-semibold'>🎖 Awarded Badge:</h3>
              <div
                className='my-2 inline-block rounded-full px-4 py-1 font-bold text-white'
                style={{
                  backgroundColor: getBadgeColor(finalResults),
                }}
              >
                {getBadge(finalResults)} Badge
              </div>
              <motion.div
                className='mt-2 text-2xl text-yellow-400'
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  delay: 0.8,
                  type: 'spring',
                  stiffness: 260,
                  damping: 20,
                }}
              >
                {'⭐'
                  .repeat(starCount)
                  .split('')
                  .map((star, i) => (
                    <motion.span
                      key={i}
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{
                        delay: 0.8 + i * 0.1,
                        type: 'spring',
                        stiffness: 300,
                      }}
                    >
                      {star}
                    </motion.span>
                  ))}
              </motion.div>
            </motion.div>

            <button
              onClick={handleExit}
              className='mt-4 w-full rounded-full bg-purple-600 py-3 font-medium text-white hover:bg-purple-700'
            >
              Quit
            </button>
          </motion.div>
        </div>
      </AnimatePresence>
    )
  }

  if (loading) {
    return (
      <div className='fixed inset-0 flex items-center justify-center bg-gray-100'>
        <p>Chargement du quiz...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className='fixed inset-0 flex items-center justify-center bg-gray-100'>
        <p className='text-red-500'>{error}</p>
      </div>
    )
  }

  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return (
      <div className='fixed inset-0 flex items-center justify-center bg-gray-100'>
        <p>Aucune question disponible pour ce test.</p>
      </div>
    )
  }

  const currentQuestion = quiz.questions[currentQuestionIndex]
  if (!currentQuestion) {
    return (
      <div className='fixed inset-0 flex items-center justify-center bg-gray-100'>
        <p>Question introuvable.</p>
      </div>
    )
  }
  // Ajout d'un composant d'avertissement plein écran
  const FullscreenWarning = ({ countdown }: { countdown: number | null }) => {
    if (isFullscreen) return null // Ne pas afficher si déjà en plein écran

    return (
      <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70'>
        <div className='max-w-md rounded-lg bg-white p-6 text-center'>
          <h3 className='mb-4 text-xl font-bold text-red-600'>Avertissement</h3>
          <p className='mb-4'>
            Fullscreen mode is required to take this test. You cannot exit this
            mode until the test is finished.
          </p>
          {countdown !== null && (
            <p className='mb-4 text-lg font-semibold text-gray-700'>
              Redirection dans <span className='text-red-500'>{countdown}</span>{' '}
              seconde{countdown > 1 ? 's' : ''}
            </p>
          )}
          <button
            //onClick={() => enterFullscreen()}
            className='rounded bg-purple-600 px-4 py-2 text-white'
          >
            Re-enable fullscreen
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className='fixed inset-0 flex items-center justify-center overflow-y-auto bg-gray-100 p-4'
    >
      {/* Avertissement si tentative de sortie */}
      {showFullscreenWarning && (
        <FullscreenWarning countdown={redirectCountdown} />
      )}

      <div className='relative w-full max-w-4xl'>
        <div className='fixed right-10 top-8 z-50 rounded-full bg-white px-4 py-2 shadow-lg'>
          <p className='font-medium text-purple-800'>
            {timeLeft > 0
              ? `Temps restant : ${formatTime(timeLeft)}`
              : 'Temps écoulé'}
          </p>
        </div>

        <div className='absolute -top-5 left-1/2 -translate-x-1/2 transform rounded-full bg-white px-6 py-2 shadow-lg'>
          <p className='font-medium text-purple-800'>
            QUESTION {currentQuestionIndex + 1} / {quiz.questions.length}
          </p>
        </div>
        <div
          style={{
            minHeight: currentQuestion.type === 'code' ? '150px' : '300px',
            maxHeight: currentQuestion.type === 'code' ? '600px' : '600px',
            padding: currentQuestion.type === 'code' ? '1rem' : '2rem',
          }}
          className='rounded-2xl bg-purple-800 text-white shadow-xl transition-all duration-300'
        >
          <h2
            style={{ whiteSpace: 'pre-line' }} // <-- Ajouté ici
            className={`mb-6 pt-6 text-center font-bold ${
              currentQuestion.type === 'code'
                ? 'text-xl md:text-2xl' // Taille réduite si c'est une question de type code
                : 'text-2xl md:text-3xl' // Taille normale sinon
            }`}
          >
            {currentQuestion.questionText}
          </h2>

          {currentQuestion.type === 'code' ? (
            <div className='mb-2'>
              <div
                style={{ height: '370px' }}
                className='overflow-hidden rounded-lg'
              >
                <Editor
                  height='100%'
                  defaultLanguage={currentQuestion.language || 'java'}
                  value={currentQuestion.codeTemplate || ''}
                  onChange={(value: any) => setCodeAnswer(value || '')}
                  theme='vs-dark'
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    readOnly: isTimeUp,
                  }}
                />
              </div>
            </div>
          ) : (
            <div className='mb-6 grid grid-cols-1 gap-4 md:grid-cols-2'>
              {currentQuestion.options.map((option, optionIndex) => {
                const isCorrect =
                  currentQuestion.type === 'single'
                    ? option === currentQuestion.correctAnswer
                    : currentQuestion.correctAnswers?.includes(option) || false

                const isSelected =
                  currentQuestion.type === 'multiple'
                    ? selectedOptions.includes(option)
                    : selectedOption === option

                const optionId = String.fromCharCode(
                  97 + optionIndex
                ).toUpperCase()

                return (
                  <button
                    key={optionId}
                    onClick={() => handleOptionSelect(option)}
                    disabled={isTimeUp}
                    className={`flex items-center gap-3 rounded-full px-6 py-4 text-left font-medium text-purple-900 shadow-md transition-all duration-200 ${
                      isSelected
                        ? 'bg-[#cbeef3] ring-2 ring-[#cdb4db]'
                        : 'bg-white'
                    } hover:scale-105 hover:bg-gray-100 hover:shadow-lg ${
                      isTimeUp ? 'cursor-not-allowed opacity-50' : ''
                    }`}
                  >
                    <span className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-purple-800 text-white'>
                      {optionId}
                    </span>

                    <span className='flex-grow'>{option}</span>

                    {showFeedback && isSelected && (
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-full ${
                          isCorrect
                            ? 'bg-green-500 text-white'
                            : 'bg-red-500 text-white'
                        }`}
                      >
                        {isCorrect ? (
                          <CheckCircle2 className='h-5 w-5' />
                        ) : (
                          <AlertCircle className='h-5 w-5' />
                        )}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className='mx-auto mt-6 w-full max-w-4xl'>
          <button
            className={`w-full ${
              isTimeUp ||
              isSubmitting ||
              (currentQuestion.type === 'single' && !selectedOption) ||
              (currentQuestion.type === 'multiple' &&
                selectedOptions.length === 0) ||
              (currentQuestion.type === 'code' && !codeAnswer)
                ? 'cursor-not-allowed bg-gray-400'
                : 'cursor-pointer bg-rose-500 hover:bg-rose-600'
            } flex items-center justify-center gap-2 rounded-full py-4 font-medium text-white shadow-md transition-all duration-300 hover:scale-105 hover:shadow-lg`}
            onClick={handleValidate}
            disabled={
              isTimeUp ||
              isSubmitting ||
              (currentQuestion.type === 'single' && !selectedOption) ||
              (currentQuestion.type === 'multiple' &&
                selectedOptions.length === 0) ||
              (currentQuestion.type === 'code' && !codeAnswer)
            }
          >
            Submit
            <Check className='h-5 w-5' />
          </button>
        </div>
      </div>

      {renderFinalResults()}
      {/* Ici, on ajoute le loader quand isSubmitting est true */}
      {isSubmitting && currentQuestionIndex === quiz.questions.length - 1 && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'>
          <p className='text-xl text-white'>Calculating results...</p>
        </div>
      )}
      {isSubmitting && currentQuestionIndex < quiz.questions.length - 1 && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'>
          <p className='text-xl text-white'>
            Processing your answer... Please wait ⏳
          </p>
        </div>
      )}
    </div>
  )
}

export default QuizInterface

import React, { useState, useEffect, useRef } from 'react';
import { sendAnswer } from '@/services/submission.service';
import { fetchQuiz } from '@/services/test.service';
import { Check, CheckCircle2, AlertCircle, Maximize2, Minimize2 } from 'lucide-react';
import { quizSchema } from '@/features/TestParticipation/validation/quizSchema';

// Interfaces
export interface Question {
  questionText: string;
  options: string[];
  correctAnswer?: string;
  correctAnswers?: string[];
  type: 'single' | 'multiple' | 'code';
  points: number;
  level: 'basic' | 'intermediate' | 'expert';
}

export interface QuizData {
  testId: string;
  title: string;
  questions: Question[];
}

interface QuizInterfaceProps {
  testId: string;
}

const QuizInterface: React.FC<QuizInterfaceProps> = ({
  testId,
}) => {
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [finalResults, setFinalResults] = useState<{
    totalScore: number;
    successRate: number;
    basicScore: number;
    intermediateScore: number;
    expertScore: number;
    estimatedLevel: string;
  } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fullscreen toggle function
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await containerRef.current?.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error('Error toggling fullscreen:', err);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Enter fullscreen when component mounts
  useEffect(() => {
    const enterFullscreen = async () => {
      try {
        if (containerRef.current && !document.fullscreenElement) {
          await containerRef.current.requestFullscreen();
          setIsFullscreen(true);
        }
      } catch (err) {
        console.error('Error attempting to enable fullscreen:', err);
      }
    };

    enterFullscreen();
  }, []);

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        const data = await fetchQuiz(testId);
        quizSchema.parse(data);
        setQuiz(data);
      } catch (err: any) {
        setError(err.message || 'Impossible de charger le quiz.');
      } finally {
        setLoading(false);
      }
    };

    if (testId) {
      loadQuiz();
    } else {
      setError('Aucun ID de test fourni.');
      setLoading(false);
    }
  }, [testId]);

  useEffect(() => {
    if (isTimeUp) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsTimeUp(true);

          setTimeout(() => {
            handleAnswerSubmission();
          }, 1500);

          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimeUp, currentQuestionIndex, quiz]);

  useEffect(() => {
    setTimeLeft(30);
    setIsTimeUp(false);
    setSelectedOption(null);
    setSelectedOptions([]);
    setShowFeedback(false);
  }, [currentQuestionIndex]);

  const handleAnswerSubmission = async () => {
    if (!quiz) return;

    const question = quiz.questions[currentQuestionIndex];
    let response;

    if (question.type === 'multiple') {
      response = await sendAnswer(
        quiz.testId,
        question.questionText,
        selectedOptions
      );
    } else {
      response = await sendAnswer(
        quiz.testId,
        question.questionText,
        selectedOption || ''
      );
    }

    if (currentQuestionIndex === quiz.questions.length - 1) {
      setFinalResults(response.data);
      return;
    }

    setTimeout(() => {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOption(null);
      setSelectedOptions([]);
      setShowFeedback(false);
      setTimeLeft(30);
    }, 1500);
  };

  const formatTime = (seconds: number): string => {
    return `${seconds}s`;
  };

  const handleOptionSelect = (option: string) => {
    if (isTimeUp) return;

    const question = quiz?.questions[currentQuestionIndex];
    if (!question) return;

    if (question.type === "multiple") {
      setSelectedOptions((prev) =>
        prev.includes(option)
          ? prev.filter((opt) => opt !== option)
          : [...prev, option]
      );
    } else {
      setSelectedOption(option);
    }
    setShowFeedback(false);
  };

  const handleValidate = async () => {
    if (!quiz) return;
    
    const question = quiz.questions[currentQuestionIndex];
    
    if ((question.type === 'single' && !selectedOption) || 
        (question.type === 'multiple' && selectedOptions.length === 0)) {
      return;
    }
    
    setShowFeedback(true);
    await handleAnswerSubmission();
  };

  const renderFinalResults = () => {
    if (!finalResults) return null;
    //setTimeLeft(0)

    return (
      <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'>
        <div className='w-full max-w-2xl rounded-2xl bg-white p-8 shadow-xl'>
          <h2 className='mb-6 text-center text-3xl font-bold text-purple-800'>
            Résultats du Test
          </h2>

          <div className='space-y-4'>
            <div className='flex justify-between border-b pb-2'>
              <span className='font-medium'>Score Total:</span>
              <span className='font-bold'>{finalResults.totalScore}</span>
            </div>

            <div className='flex justify-between border-b pb-2'>
              <span className='font-medium'>Niveau Basic:</span>
              <span className='font-bold'>{finalResults.basicScore}</span>
            </div>

            <div className='flex justify-between border-b pb-2'>
              <span className='font-medium'>Niveau Intermediate:</span>
              <span className='font-bold'>
                {finalResults.intermediateScore}
              </span>
            </div>

            <div className='flex justify-between border-b pb-2'>
              <span className='font-medium'>Niveau Expert:</span>
              <span className='font-bold'>{finalResults.expertScore}</span>
            </div>

            <div className='flex justify-between border-b pb-2'>
              <span className='font-medium'>Niveau Estimé:</span>
              <span className='font-bold capitalize'>
                {finalResults.estimatedLevel}
              </span>
            </div>

            <div className='flex justify-between border-b pb-2'>
              <span className='font-medium'>Taux de Réussite:</span>
              <span className='font-bold'>{finalResults.successRate}%</span>
            </div>
          </div>

          <button
            onClick={() => {
              setFinalResults(null);
              if (document.fullscreenElement) {
                document.exitFullscreen();
              }
            }}
            className='mt-6 w-full rounded-full bg-purple-600 py-3 font-medium text-white hover:bg-purple-700'
          >
            Fermer
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className='fixed inset-0 flex items-center justify-center bg-gray-100'>
        <p>Chargement du quiz...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className='fixed inset-0 flex items-center justify-center bg-gray-100'>
        <p className='text-red-500'>{error}</p>
      </div>
    );
  }

  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return (
      <div className='fixed inset-0 flex items-center justify-center bg-gray-100'>
        <p>Aucune question disponible pour ce test.</p>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  if (!currentQuestion) {
    return (
      <div className='fixed inset-0 flex items-center justify-center bg-gray-100'>
        <p>Question introuvable.</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 overflow-y-auto bg-gray-100 p-4 flex items-center justify-center"
    >
      {/* Fullscreen toggle button */}
      <button
        onClick={toggleFullscreen}
        className="fixed top-4 right-4 z-50 p-2 rounded-full bg-white shadow-lg hover:bg-gray-100 transition-colors"
        aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
      >
        {isFullscreen ? (
          <Minimize2 className="h-5 w-5 text-purple-800" />
        ) : (
          <Maximize2 className="h-5 w-5 text-purple-800" />
        )}
      </button>

      <div className="relative w-full max-w-4xl">
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

        <div className='rounded-2xl bg-purple-800 p-8 pb-6 pt-12 text-white shadow-xl transition-all duration-300 hover:shadow-2xl'>
          <h2 className='mb-12 text-center text-2xl font-bold md:text-3xl'>
            {currentQuestion.questionText}
          </h2>

          <div className='mb-6 grid grid-cols-1 gap-4 md:grid-cols-2'>
            {currentQuestion.options.map((option, optionIndex) => {
              const isCorrect = currentQuestion.type === 'single'
                ? option === currentQuestion.correctAnswer
                : currentQuestion.correctAnswers?.includes(option) || false;

              const isSelected = currentQuestion.type === 'multiple'
                ? selectedOptions.includes(option)
                : selectedOption === option;

              const optionId = String.fromCharCode(97 + optionIndex).toUpperCase();

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
              );
            })}
          </div>
        </div>

        <div className='mx-auto mt-6 w-full max-w-4xl'>
          <button
            className={`w-full ${
              isTimeUp || 
              (currentQuestion.type === 'single' && !selectedOption) ||
              (currentQuestion.type === 'multiple' && selectedOptions.length === 0)
                ? 'cursor-not-allowed bg-gray-400'
                : 'cursor-pointer bg-rose-500 hover:bg-rose-600'
            } flex items-center justify-center gap-2 rounded-full py-4 font-medium text-white shadow-md transition-all duration-300 hover:scale-105 hover:shadow-lg`}
            onClick={handleValidate}
            disabled={
              isTimeUp || 
              (currentQuestion.type === 'single' && !selectedOption) ||
              (currentQuestion.type === 'multiple' && selectedOptions.length === 0)
            }
          >
            Valider
            <Check className='h-5 w-5' />
          </button>
        </div>
      </div>

      {renderFinalResults()}
    </div>
  );
};

export default QuizInterface;
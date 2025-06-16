import React, { useState } from 'react';

// Définition des types
interface AnswerOption {
  answerText: string;
  isCorrect: boolean;
}

interface Question {
  questionText: string;
  answerOptions: AnswerOption[];
}

const Quiz: React.FC = () => {
 
    const questions: Question[] = [
        {
          questionText: "Quel est le langage principal utilisé pour le développement d'Angular ?",
          answerOptions: [
            { answerText: "TypeScript", isCorrect: true },
            { answerText: "JavaScript", isCorrect: false },
            { answerText: "Python", isCorrect: false },
            { answerText: "Java", isCorrect: false }
          ]
        },
        {
          questionText: "Quel est le nom du moteur de templates utilisé par Angular ?",
          answerOptions: [
            { answerText: "Angular Template", isCorrect: false },
            { answerText: "Jinja", isCorrect: false },
            { answerText: "Mustache", isCorrect: false },
            { answerText: "Angular Templates (interpolation, directives)", isCorrect: true }
          ]
        },
        {
          questionText: "Quel est le nom de l'outil de gestion des dépendances dans Angular ?",
          answerOptions: [
            { answerText: "npm", isCorrect: false },
            { answerText: "Yarn", isCorrect: false },
            { answerText: "Angular CLI", isCorrect: true },
            { answerText: "Bower", isCorrect: false }
          ]
        },
        {
          questionText: "Quel est le rôle du module Angular 'NgModule' ?",
          answerOptions: [
            { answerText: "Gérer les routes", isCorrect: false },
            { answerText: "Gérer les dépendances des services", isCorrect: false },
            { answerText: "Organiser et regrouper les composants, services et autres éléments d'Angular", isCorrect: true },
            { answerText: "Gérer les templates", isCorrect: false }
          ]
        },
        {
          questionText: "Quel est l'objectif principal de l'outil Angular CLI ?",
          answerOptions: [
            { answerText: "Faciliter la gestion des styles CSS", isCorrect: false },
            { answerText: "Gérer la configuration du serveur web", isCorrect: false },
            { answerText: "Simplifier le développement avec Angular (générer des composants, services, etc.)", isCorrect: true },
            { answerText: "Optimiser le code JavaScript pour la production", isCorrect: false }
          ]
        }
      ];
      

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const handleAnswerOptionClick = (isCorrect: boolean) => {
    if (isCorrect) {
      setScore(score + 1);
    }

    const nextQuestion = currentQuestionIndex + 1;
    if (nextQuestion < questions.length) {
      setCurrentQuestionIndex(nextQuestion);
    } else {
      setIsSubmitted(true);
    }
  };

  const restartQuiz = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setIsSubmitted(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex justify-center items-center">
      <div className="w-full max-w-lg p-6 bg-gray-800 rounded-lg shadow-lg space-y-8">
        {isSubmitted ? (
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-semibold text-green-400">Quiz Terminé!</h2>
            <p className="text-xl">Votre score : <span className="font-bold text-blue-400">{score} / {questions.length}</span></p>
            <button
              onClick={restartQuiz}
              className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              Recommencer
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-200">{questions[currentQuestionIndex].questionText}</h2>
            <div className="space-y-2">
              {questions[currentQuestionIndex].answerOptions.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerOptionClick(option.isCorrect)}
                  className="w-full py-2 px-4 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
                >
                  {option.answerText}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Quiz;

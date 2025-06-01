import React from 'react';
import { Question } from '@/interfaces/question.interface';
import { MinusIcon, PlusIcon } from 'lucide-react';

interface QuestionItemProps {
  question: Question;
  questionIndex: number;
  onQuestionChange: (
    index: number,
    field: keyof Question,
    value: string | number | string[]
  ) => void;
  onOptionChange: (qIndex: number, oIndex: number, value: string) => void;
  onAddOption: (questionIndex: number) => void;
  onRemoveOption: (questionIndex: number, optionIndex: number) => void;
  onPointsChange: (index: number, points: number) => void;
  maxPoints: number;
  onRemoveQuestion: (questionIndex: number) => void;
}

const QuestionItem: React.FC<QuestionItemProps> = ({
  question,
  questionIndex,
  onQuestionChange,
  onOptionChange,
  onAddOption,
  onRemoveOption,
  onPointsChange,
  maxPoints,
  onRemoveQuestion,
}) => {
  const toggleCorrectAnswer = (value: string) => {
    const current = question.correctAnswers || [];
    const exists = current.includes(value);
    const updated = exists
      ? current.filter((ans) => ans !== value)
      : [...current, value];
    onQuestionChange(questionIndex, 'correctAnswers', updated);
  };

  return (
    <div className='relative mb-6 rounded-2xl border bg-gray-50 p-4 shadow-md transition-transform duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg'>
      {/* Type de question */}
      <div className='mb-3 mr-4 mt-4 flex items-center justify-end'>
        <label className='mr-2 font-medium'>Question:</label>
        <select
          value={question.type}
          onChange={(e) =>
            onQuestionChange(questionIndex, 'type', e.target.value)
          }
          className='h-10 rounded-2xl border pr-4 py-1'
        >
          <option value='single'>à choix unique</option>
          <option value='multiple'>à choix multiple</option>
          <option value='code'>Coding</option>
        </select>
      </div>

      {/* Texte de la question */}
      <div className='flex justify-center'>
        <textarea
          value={question.questionText}
          onChange={(e) =>
            onQuestionChange(questionIndex, 'questionText', e.target.value)
          }
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = `${target.scrollHeight}px`;
          }}
          placeholder='Texte de la question'
          className='mb-4 mt-4 h-12 w-[515px] max-w-full resize-none overflow-hidden break-words rounded-2xl border p-2 text-base'
          required
          rows={1}
        />
      </div>

      {/* Options si la question n'est pas de type "code" */}
      {question.type !== 'code' && (
        <div className='mb-3'>
          <label className='mb-2 ml-[45px] block font-medium'>Options:</label>
          {question.options.map((opt, oIdx) => {
            const isSingle = question.type === 'single';
            const inputId = `${isSingle ? 'radio' : 'checkbox'}-${questionIndex}-${oIdx}`;

            return (
              <div key={oIdx} className='mb-2 flex items-center justify-center'>
                <div className='relative'>
                  <input
                    type={isSingle ? 'radio' : 'checkbox'}
                    id={inputId}
                    name={`correct-answer-${questionIndex}`}
                    checked={
                      isSingle
                        ? question.correctAnswer === opt
                        : (question.correctAnswers || []).includes(opt)
                    }
                    onChange={() =>
                      isSingle
                        ? onQuestionChange(questionIndex, 'correctAnswer', opt)
                        : toggleCorrectAnswer(opt)
                    }
                    className='peer hidden'
                    required={isSingle && oIdx === 0}
                  />

                  <label
                    htmlFor={inputId}
                    className={`mr-2 flex h-4 w-4 cursor-pointer items-center justify-center ${isSingle ? 'rounded-full' : 'rounded-sm'} border-2 border-gray-400 transition-all duration-200 ease-in-out hover:border-blue-500 hover:bg-blue-50 peer-checked:border-blue-600 peer-checked:bg-blue-100`}
                  >
                    <span
                      className={`h-2.5 w-2.5 bg-blue-600 opacity-0 transition-opacity duration-200 peer-checked:opacity-100 ${isSingle ? 'rounded-full' : 'rounded-sm'}`}
                    ></span>
                  </label>
                </div>

                <textarea
                  value={opt}
                  onChange={(e) =>
                    onOptionChange(questionIndex, oIdx, e.target.value)
                  }
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = `${target.scrollHeight}px`;
                  }}
                  placeholder={`Option ${oIdx + 1}`}
                  className='mb-2 h-12 w-[450px] max-w-full resize-none overflow-hidden break-words rounded-2xl border p-2 text-base'
                  required
                  rows={1}
                />

                {question.options.length > 2 && (
                  <button
                    className='ml-2 rounded-full bg-red-100 p-2 text-red-600 shadow-md transition-all duration-300 hover:bg-red-200 hover:shadow-lg active:shadow-sm'
                    onClick={() => onRemoveOption(questionIndex, oIdx)}
                  >
                    <MinusIcon className='h-4 w-4' />
                  </button>
                )}
              </div>
            );
          })}

          <div className='flex justify-center'>
            <button
              className='mt-2 rounded-full bg-green-100 p-2 text-green-600 shadow-md transition-all duration-300 hover:bg-green-200 hover:shadow-lg active:shadow-sm'
              onClick={() => onAddOption(questionIndex)}
            >
              <PlusIcon className='h-6 w-6' />
            </button>
          </div>
        </div>
      )}

      {/* Points, niveau et suppression */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-4'>
          {/* Input Points */}
          <div className='flex items-center'>
            <label className='mr-2'>Points:</label>
            <input
              type='number'
              value={question.points}
              onChange={(e) =>
                onPointsChange(questionIndex, Number(e.target.value))
              }
              className='w-12 rounded-2xl border p-2'
              min='1'
              max={maxPoints}
              required
            />
          </div>

          {/* Sélecteur de Niveau */}
          <div className='flex items-center'>
            <label className='mr-2'>Niveau:</label>
            <select
              value={question.level}
              onChange={(e) =>
                onQuestionChange(questionIndex, 'level', e.target.value)
              }
              className='h-10 rounded-2xl border p-2'
            >
              <option value='basic'>Basic</option>
              <option value='intermediate'>Intermediate</option>
              <option value='expert'>Expert</option>
            </select>
          </div>
        </div>

        {/* Bouton Supprimer */}
        <button
          className='ml-2 rounded-full bg-red-100 p-2 text-red-600 shadow-md transition-all duration-300 hover:bg-red-200 hover:shadow-lg active:shadow-sm'
          onClick={() => onRemoveQuestion(questionIndex)}
          title='Supprimer la question'
        >
          <MinusIcon className='h-6 w-6' />
        </button>
      </div>
    </div>
  );
};

export default QuestionItem;
'use client'

import { useEffect, useState, useRef } from 'react'
import { Submission } from '@/interfaces/question.interface'
import { getSubmission } from '@/services/submission.service'
import html2pdf from 'html2pdf.js'
import { Save } from 'lucide-react'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/authStore'

interface ReportPageProps {
  testId: string
  collaboratorId: string
}

export default function ReportPage({
  testId,
  collaboratorId,
}: ReportPageProps) {
  const token = useAuthStore((state) => state.auth.accessToken)
  const navigate = useNavigate()

  useEffect(() => {
    if (!token) {
      navigate({ to: '/sign-in' })
    }
  }, [token, navigate])

  const [submission, setSubmission] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getSubmission(testId, collaboratorId)
        setSubmission(res.data)
      } catch (err) {
        setError('Erreur lors du chargement du rapport.')
      } finally {
        setLoading(false)
      }
    }

    if (testId && collaboratorId) {
      fetchData()
    }
  }, [testId, collaboratorId])

  if (loading) return <div className='p-4'>Chargement...</div>
  if (error) return <div className='p-4 text-red-500'>{error}</div>
  if (!submission) return <div className='p-4'>Aucune soumission trouvée.</div>

  const getBadgeColor = (badge: string) => {
    switch (badge.toLowerCase()) {
      case 'bronze':
        return 'text-amber-600'
      case 'silver':
        return 'text-gray-400'
      case 'gold':
        return 'text-yellow-500'
      case 'platinum':
        return 'text-indigo-400'
      default:
        return 'text-gray-500'
    }
  }

  const handleDownloadPDF = () => {
    const element = document.getElementById('report-content')
    if (!element) return

    const opt = {
      margin: 10,
      filename: `rapport-test-${testId}-${collaboratorId}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    }

    html2pdf().from(element).set(opt).save()
  }

  // Fonction pour formater la réponse selon le type de question
  const formatResponse = (response: any, questionType: string) => {
    if (questionType === 'code') {
      // Pour les questions de code, retourner directement la réponse
      return typeof response === 'string' ? response : JSON.stringify(response)
    }
    // Pour les autres types, garder le format JSON indenté
    return JSON.stringify(response, null, 2)
  }

  return (
    <div className='mx-auto max-w-4xl p-4'>
      <div className='mb-4 flex items-center justify-between'>
        <div className='relative mb-4'>
          <button
            onClick={handleDownloadPDF}
            className='absolute right-0 top-0 rounded-full p-2 text-blue-600 hover:text-blue-800'
            title='Télécharger le PDF'
            aria-label='Télécharger le PDF'
          >
            <Save size={24} />
          </button>
        </div>
      </div>
      <div id='report-content' ref={reportRef}>
        {/* Section des résultats globaux */}
        <Card className='mb-6 shadow-md'>
          <CardHeader>
            <h1 className='mb-4 text-2xl font-bold'>
              Rapport du test :{' '}
              {typeof submission.test === 'object' && 'title' in submission.test
                ? submission.test.title
                : 'ID : ' + submission.test}
            </h1>
            <CardTitle>Résultats globaux</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
              <div className='rounded-3xl border p-3'>
                <h3 className='text-sm font-medium text-gray-500'>
                  Score total
                </h3>
                <p className='text-2xl font-bold'>
                  {submission.totalScore}
                  <span className='text-sm font-normal text-gray-500'>
                    points
                  </span>
                </p>
              </div>
              <div className='rounded-3xl border p-3'>
                <h3 className='text-sm font-medium text-gray-500'>
                  Success Rate
                </h3>
                <p className='text-2xl font-bold'>{submission.successRate}%</p>
              </div>
              <div className='rounded-3xl border p-3'>
                <h3 className='text-sm font-medium text-gray-500'>
                  Badge attribué
                </h3>
                <p
                  className={`text-xl font-bold ${getBadgeColor(submission.awardedBadge || '')}`}
                >
                  {submission.awardedBadge || 'Aucun badge'}
                </p>
              </div>

              <div className='rounded-3xl border p-3'>
                <h3 className='text-sm font-medium text-gray-500'>
                  Basic Level
                </h3>
                <p className='text-2xl font-bold'>
                  {submission.basicRate}
                  <span className='text-sm font-normal text-gray-500'>%</span>
                </p>
              </div>
              <div className='rounded-3xl border p-3'>
                <h3 className='text-sm font-medium text-gray-500'>
                  Intermediate Level
                </h3>
                <p className='text-2xl font-bold'>
                  {submission.intermediateRate}
                  <span className='text-sm font-normal text-gray-500'>%</span>
                </p>
              </div>
              <div className='rounded-3xl border p-3'>
                <h3 className='text-sm font-medium text-gray-500'>
                  Expert Level
                </h3>
                <p className='text-2xl font-bold'>
                  {submission.expertRate}
                  <span className='text-sm font-normal text-gray-500'>%</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Détails des questions */}
        <div className='space-y-6'>
          {submission.responses.map((response, index) => (
            <Card key={index} className='shadow-md'>
              <CardHeader>
                <CardTitle className='font-semibold'>
                  <span className='text-xl font-semibold'>
                    Question {index + 1}:
                  </span>{' '}
                  {response.questionText}
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div>
                  <Label className='text-base font-semibold'>Réponse :</Label>
                  <pre
                    className={`whitespace-pre-wrap ${response.questionType === 'code' ? 'text-[#7d8597]' : ''}`}
                  >
                    {formatResponse(response.response, response.questionType)}
                  </pre>
                </div>

                <div>
                  <Label className='text-base font-semibold'>Correcte:</Label>{' '}
                  {response.isCorrect ? '✅ Oui' : '❌ Non'}
                </div>

                {response.score !== undefined && (
                  <div>
                    <Label className='text-base font-semibold'>
                      Score attribué :
                    </Label>{' '}
                    {response.score}
                  </div>
                )}

                {response.feedback && (
                  <div className='space-y-4 pb-4'>
                    {response.feedback.synthese && (
                      <div>
                        <Label className='mb-10 text-xl font-semibold'>
                          IA Feedback
                        </Label>
                        <Label className='mt-5 block text-xl font-semibold'>
                          Synthèse :
                        </Label>
                        <p className='ml-2'>{response.feedback.synthese}</p>
                      </div>
                    )}

                    {Array.isArray(response.feedback.exigencesFonctionnelles) &&
                      response.feedback.exigencesFonctionnelles.length > 0 && (
                        <div>
                          <Label className='text-xl font-semibold'>
                            Exigences Fonctionnelles :
                          </Label>
                          <ul className='ml-4 mt-3 list-disc space-y-2'>
                            {response.feedback.exigencesFonctionnelles.map(
                              (item, i) => (
                                <li key={i}>
                                  <p>
                                    <span className='font-semibold text-[#d81159]'>
                                      Exigence :
                                    </span>{' '}
                                    {item.exigence}
                                  </p>
                                  <p>
                                    <span className='font-semibold text-[#1e96fc]'>
                                      Statut :
                                    </span>{' '}
                                    {item.statut}
                                  </p>
                                  {item.lignes && (
                                    <p>
                                      <span className='font-semibold text-[#8d99ae]'>
                                        Lignes :
                                      </span>{' '}
                                      {item.lignes}
                                    </p>
                                  )}
                                  {item.details && (
                                    <p>
                                      <span className='font-semibold text-[#0fa3b1]'>
                                        Détails :
                                      </span>{' '}
                                      {item.details}
                                    </p>
                                  )}
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}

                    {Array.isArray(response.feedback.bonnesPratiques) &&
                      response.feedback.bonnesPratiques.length > 0 && (
                        <div>
                          <Label className='text-xl font-semibold'>
                            Bonnes Pratiques :
                          </Label>
                          <ul className='ml-4 mt-5 list-disc space-y-2'>
                            {response.feedback.bonnesPratiques.map(
                              (item, i) => (
                                <li key={i}>
                                  <p>
                                    <span className='font-semibold text-[#d81159]'>
                                      Catégorie :
                                    </span>{' '}
                                    {item.categorie}
                                  </p>
                                  <p>
                                    <span className='font-semibold text-[#1e96fc]'>
                                      Statut :
                                    </span>{' '}
                                    {item.statut}
                                  </p>
                                  <p>
                                    <span className='font-semibold text-[#0fa3b1]'>
                                      Détails :
                                    </span>{' '}
                                    {item.details}
                                  </p>
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}

                    {Array.isArray(response.feedback.recommandations) &&
                      response.feedback.recommandations.length > 0 && (
                        <div>
                          <Label className='text-xl font-semibold'>
                            Recommandations :
                          </Label>
                          <ul className='ml-4 mt-5 list-disc space-y-2'>
                            {response.feedback.recommandations.map(
                              (item, i) => (
                                <li key={i}>
                                  <p>
                                    <span className='font-semibold text-[#1e96fc]'>
                                      Priorité :
                                    </span>{' '}
                                    {item.priorite}
                                  </p>
                                  <p>
                                    <span className='font-semibold text-[#0fa3b1]'>
                                      Suggestion :
                                    </span>{' '}
                                    {item.suggestion}
                                  </p>
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

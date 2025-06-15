import React, { useState } from 'react'
import Autosuggest from 'react-autosuggest'



// Suggestions simples par langage
const suggestionsByLanguage: Record<'Java' | 'JavaScript' | 'Python', string[]> = {
  Java: [
    'public int sommeTableau(int[] tab) {',
    'int s = 0;',
    'for (int i = 0; i < tab.length; i++) {',
    's += tab[i];',
    '}',
    'return s;',
    '}',
  ],
  JavaScript: [
    'function sommeTableau(tab) {',
    'let s = 0;',
    'for (let i = 0; i < tab.length; i++) {',
    's += tab[i];',
    '}',
    'return s;',
    '}',
  ],
  Python: [
    'def somme_tableau(tab):',
    's = 0',
    'for i in range(len(tab)):',
    's += tab[i]',
    'return s',
  ],
}

function CodeEvaluator() {
  const [language, setLanguage] = useState<'Java' | 'JavaScript' | 'Python'>('Java')
  const [code, setCode] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [result, setResult] = useState<{ score: number; feedback: string } | null>(null)
  const [loading, setLoading] = useState(false)

  // 🔍 Générer les suggestions
  const getSuggestions = (value: string): string[] => {
    const inputValue = value.trim().toLowerCase()
    return suggestionsByLanguage[language].filter((sug) =>
      sug.toLowerCase().startsWith(inputValue)
    )
  }

  // 🔁 Maj suggestions quand on tape
  const onSuggestionsFetchRequested = ({ value }: { value: string }) => {
    setSuggestions(getSuggestions(value))
  }

  const onSuggestionsClearRequested = () => {
    setSuggestions([])
  }

  const getSuggestionValue = (suggestion: string): string => suggestion

  const renderSuggestion = (suggestion: string) => <div>{suggestion}</div>

  const onChange = (
    event: React.FormEvent<any>,
    { newValue }: { newValue: string }
  ) => {
    setCode(newValue)
  }

  // 🚀 Évaluation via API
  const evaluateCode = async () => {
    if (!code.trim()) return
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('http://localhost:5000/api/code/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
      } else {
        setResult({ score: 0, feedback: 'Erreur pendant l’évaluation.' })
      }
    } catch (error) {
      setResult({ score: 0, feedback: 'Erreur réseau ou serveur.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 700, margin: 'auto' }}>
      <h2>Évaluateur de code avec autocomplétion</h2>

      <label>
        Langage :{' '}
        <select
          value={language}
          onChange={(e) => {
            setLanguage(e.target.value as 'Java' | 'JavaScript' | 'Python')
            setCode('')
            setResult(null)
          }}
        >
          {Object.keys(suggestionsByLanguage).map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>
      </label>

      <Autosuggest
        suggestions={suggestions}
        onSuggestionsFetchRequested={onSuggestionsFetchRequested}
        onSuggestionsClearRequested={onSuggestionsClearRequested}
        getSuggestionValue={getSuggestionValue}
        renderSuggestion={renderSuggestion}
        inputProps={{
          placeholder: 'Écrivez votre code ici...',
          value: code,
          onChange: onChange,
          style: {
            width: '100%',
            fontFamily: 'monospace',
            fontSize: 14,
            minHeight: 150,
            padding: 8,
            boxSizing: 'border-box',
          },
        }}
        highlightFirstSuggestion={true}
      />


      {result && !loading && (
        <div style={{ marginTop: 20, whiteSpace: 'pre-wrap' }}>
          <h3>Résultat :</h3>
          <p>
            <strong>Score :</strong> {result.score} / 10
          </p>
          <p>
            <strong>Feedback :</strong> {result.feedback}
          </p>
        </div>
      )}
    </div>
  )
}

export default CodeEvaluator

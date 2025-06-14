import React, { useEffect, useState } from 'react'

type AuthorizationContentProps = {
  userId: string
  testId: string
  onClose: () => void
}

export function AuthorizationContent({ userId, testId, onClose }: AuthorizationContentProps) {
  const [collaboratorName, setCollaboratorName] = useState<string>('...')
  const [testTitle, setTestTitle] = useState<string>('...')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const collabRes = await fetch(`/api/collaborators/${userId}`)
        const collabData = await collabRes.json()
        const testRes = await fetch(`/api/tests/${testId}`)
        const testData = await testRes.json()

        setCollaboratorName(collabData.name)
        setTestTitle(testData.title)
      } catch {
        setCollaboratorName('Unknown')
        setTestTitle('Unknown')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [userId, testId])

  const handleAuthorize = () => {
    alert('Authorized')
    onClose()
  }

  const handleDeny = () => {
    alert('Denied')
    onClose()
  }

  if (loading) return <p style={{ textAlign: 'center', padding: '2rem' }}>Loading...</p>

  return (
    <div
      style={{
        maxWidth: '400px',
        margin: '2rem auto',
        padding: '2rem',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        backgroundColor: '#fff',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        color: '#333',
      }}
    >
      <h2 style={{ marginBottom: '1rem', fontWeight: '700', fontSize: '1.5rem' }}>
        Authorization Request
      </h2>

      <p style={{ marginBottom: '1.5rem', fontSize: '1rem', color: '#555' }}>
        The collaborator below was kicked out of the test and requests to rejoin. 
        Please review the details and decide whether to authorize access.
      </p>

      <p style={{ marginBottom: '0.5rem' }}>
        <strong>Collaborator:</strong> {collaboratorName}
      </p>
      <p style={{ marginBottom: '0.5rem' }}>
        <strong>Test:</strong> {testTitle}
      </p>
      <p style={{ marginBottom: '1.5rem', color: '#666' }}>
        <strong>Date:</strong> {new Date().toLocaleString()}
      </p>
      <p style={{ marginBottom: '2rem', fontSize: '1.1rem' }}>
        Do you authorize the collaborator to rejoin the test?
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button
          onClick={handleAuthorize}
          style={{
            flex: 1,
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: '#4CAF50',
            color: 'white',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'background-color 0.3s ease',
            marginRight: '0.5rem',
          }}
          onMouseOver={e => (e.currentTarget.style.backgroundColor = '#45a049')}
          onMouseOut={e => (e.currentTarget.style.backgroundColor = '#4CAF50')}
        >
          Authorize
        </button>
        <button
          onClick={handleDeny}
          style={{
            flex: 1,
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            border: '1px solid #ccc',
            backgroundColor: '#fff',
            color: '#555',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'background-color 0.3s ease',
            marginLeft: '0.5rem',
          }}
          onMouseOver={e => (e.currentTarget.style.backgroundColor = '#f2f2f2')}
          onMouseOut={e => (e.currentTarget.style.backgroundColor = '#fff')}
        >
          Deny
        </button>
      </div>
    </div>
  )
}

import React, { useState, useEffect } from 'react'
import { fetchUsers } from '@/services/users.service'
import Dialog from '@mui/material/Dialog'
import { ThemeProvider } from '@mui/material/styles'
import { useAuth } from '@/context/authContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { TopNav } from '@/components/layout/top-nav'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import theme from '../.././theme'
import { TestRecord } from '../../interfaces/testRecords.interface'
import { fetchFormattedTests } from '../../services/test.service'
import TechnologyRankingChart from './components/TechnologyRankingChart'
import { AuthorizationContent } from './components/authorizationModal'
import AutoSizeInput from './components/autoSizeInput'
import BestTechnologyCard from './components/bestTechnologyCard'
import Indicators from './components/indicators'
import NotificationBell from './components/notificationsBell'
import PerformersOfTheWeek from './components/performersOfTheWeek'
import UserLevelPieChart from './components/pieChart'
import SuccessHistoryChart from './components/successHistoryChart'
import TaskManager from './components/taskManager'
import { Test1 } from './components/test1'
import WorstTechnologyCard from './components/worstTechnologyCard'
import withAuth from '@/utils/withAuth'


// adapte selon ton arborescence


const ManagerDashboard: React.FC = () => {

  const { isLoading } = useAuth()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [displayName, setDisplayName] = useState('')

  // Pour la section Technology Trends (Test1)
  const [collaborateurFilterTech, setCollaborateurFilterTech] = useState('')
  const [technologieFilterTech, setTechnologieFilterTech] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  // State pour la modale
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [modalData, setModalData] = useState<{
    userId: string
    testId: string
  } | null>(null)

  // Simule la réception d’une notification
  const simulateIncomingRequest = (userId: string, testId: string) => {
    setModalData({ userId, testId })
    setShowAuthModal(true)
  }

  const showDateFilter =
    collaborateurFilterTech.trim() !== '' || technologieFilterTech.trim() !== ''

  const [testRecords, setTestRecords] = useState<TestRecord[]>([]) // Mise à jour de setTestRecords

  const { user } = useAuth()

  const [userCounts, setUserCounts] = useState({
    admin: 0,
    manager: 0,
    collaborator: 0,
  })
  useEffect(() => {
    const getUserCounts = async () => {
      try {
        const users = await fetchUsers()
        const counts = {
          admin: 0,
          manager: 0,
          collaborator: 0,
        }

        users.forEach((user) => {
          if (user.role in counts) {
            counts[user.role as 'admin' | 'manager' | 'collaborator']++
          }
        })

        setUserCounts(counts)
      } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs', error)
      }
    }

    getUserCounts()
  }, [])
  useEffect(() => {
    if (user?.name) {
      setIsTransitioning(true)
      const newName = formatUserName(user.name)
      setDisplayName(newName)
      // Petit délai pour éviter le clignotement
      const timer = setTimeout(() => setIsTransitioning(false), 200)
      return () => clearTimeout(timer)
    } else {
      setDisplayName('')
    }
  }, [user?.id]) // Se déclencher seulement quand l'ID change

  // Fonction pour formater le nom
  const formatUserName = (fullName: string) => {
    const words = fullName.trim().split(' ')

    // Cas où il n'y a qu'un seul mot
    if (words.length === 1) return capitalizeFirstLetter(words[0])

    // Cas où il y a deux mots
    if (words.length === 2) return capitalizeFirstLetter(words[0])

    // Cas où il y a trois mots ou plus
    return `${capitalizeFirstLetter(words[0])} ${capitalizeFirstLetter(words[1])}`
  }

  // Fonction pour mettre en majuscule la première lettre
  const capitalizeFirstLetter = (word: string) => {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  }

  useEffect(() => {
    const getTests = async () => {
      try {
        let allTests = []
        if (user?.role === 'collaborator') {
          allTests = await fetchFormattedTests(user.id)
        } else if (user?.role === 'manager' || user?.role === 'admin') {
          // Appel sans paramètre sinon
          allTests = await fetchFormattedTests()
        }

        //console.log('Tests récupérés :', allTests)
        setTestRecords(allTests)
      } catch (error) {
        console.error('Erreur lors du chargement des tests', error)
      }
    }

    if (user) {
      getTests()
    }
  }, [user])

  const userId = user?.id

  return (
    <>
      <Header>
        <TopNav links={topNav} />
        <div className='ml-auto flex items-center space-x-4'>
          <Search />
          <ThemeSwitch />
          {userId && <NotificationBell userId={userId} />}
          <ProfileDropdown />
        </div>
      </Header>
      <Main>
        <div className='mb-2 flex items-center justify-between space-y-2 pb-9'>
          <div>
            <h1 className='dancing-script text-7xl tracking-tight'>
              Hi {displayName},
            </h1>
            <p className='dancing-script text-2xl text-muted-foreground'>
              Ready to work !
            </p>
          </div>
        </div>
        <div
          style={{ marginTop: '-70px', marginBottom: '8px' }}
          className='flex justify-end pr-4'
        >
          <div className='flex items-end gap-8'>
            <div className='lora flex flex-col items-center'>
              <span className='flex items-baseline gap-2 text-5xl'>
                <span className='text-xl' role='img' aria-label='Admins'>
                  👤
                </span>
                {userCounts.admin}
              </span>
              <span className='text-xs text-gray-600'>Admins</span>
            </div>

            <div className='lora flex flex-col items-center'>
              <span className='flex items-baseline gap-2 text-5xl'>
                <span className='text-xl' role='img' aria-label='Managers'>
                  🧑‍💼
                </span>
                {userCounts.manager}
              </span>
              <span className='text-xs text-gray-600'>Managers</span>
            </div>

            <div className='lora flex flex-col items-center'>
              <span className='flex items-baseline gap-2 text-5xl'>
                <span className='text-xl' role='img' aria-label='Collaborators'>
                  🤝
                </span>
                {userCounts.collaborator}
              </span>
              <span className='text-xs text-gray-600'>Collaborators</span>
            </div>
          </div>
        </div>

        <Tabs
          orientation='vertical'
          defaultValue='overview'
          className='space-y-4'
        >
          <TabsContent value='overview' className='space-y-4'>
            <div className='flex w-full flex-col gap-4 lg:flex-row'>
              <div className='flex flex-col gap-4 lg:w-3/12'>
                <Card className='h-96 !rounded-3xl border-0 shadow-md'>
                  <CardContent className='h-full p-0'>
                    <UserLevelPieChart />
                  </CardContent>
                </Card>

                <div className='space-y-4'>
                  <BestTechnologyCard testRecords={testRecords} />
                  <WorstTechnologyCard testRecords={testRecords} />
                </div>

                <ThemeProvider theme={theme}>
                  <PerformersOfTheWeek />
                </ThemeProvider>
              </div>

              <div className='flex flex-col gap-4 lg:w-6/12'>
                <div className='h-[320px]'>
                  <TechnologyRankingChart testRecords={testRecords} />
                </div>

                <Card className='h-[350px] !rounded-3xl border-0 shadow-md'>
                  {' '}
                  <CardHeader className='flex flex-row items-center justify-between'>
                    <div className='flex flex-col'>
                      <CardTitle className='font-bold'>
                        Technology Trends
                      </CardTitle>
                      <div className='mt-1 flex items-center gap-2'>
                        {(user?.role === 'admin' ||
                          user?.role === 'manager') && (
                          <AutoSizeInput
                            placeholder='collaborator'
                            value={collaborateurFilterTech}
                            onChange={(e) => {
                              setCollaborateurFilterTech(e.target.value)
                            }}
                          />
                        )}

                        <AutoSizeInput
                          placeholder='technology'
                          value={technologieFilterTech}
                          onChange={(e) => {
                            setTechnologieFilterTech(e.target.value)
                          }}
                        />
                        {/* Filtre Date (conditionnel) */}
                        {showDateFilter && (
                          <select
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                          >
                            <option value='all'>All</option>
                            <option value='thisWeek'>This week</option>
                            <option value='thisMonth'>This month</option>
                            <option value='lastMonth'>Last month</option>
                          </select>
                        )}
                      </div>
                    </div>
                    {/* Dans la section Technology Trends */}
                    <div style={{ marginTop: '-8px' }}>
                      {((user?.role === 'collaborator' &&
                        technologieFilterTech.trim() !== '') ||
                        (user?.role !== 'collaborator' &&
                          collaborateurFilterTech.trim() !== '' &&
                          technologieFilterTech.trim() !== '')) && (
                        <Indicators
                          testRecords={testRecords}
                          collaborateur={
                            user?.role === 'collaborator'
                              ? user.name
                              : collaborateurFilterTech
                          }
                          technologie={technologieFilterTech}
                        />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className='h-[calc(100%-60px)] overflow-auto'>
                    {' '}
                    {/* Ajout de scroll si nécessaire */}
                    <Test1
                      testRecords={testRecords}
                      collaborateurFilter={collaborateurFilterTech}
                      technologieFilter={technologieFilterTech}
                      dateFilter={dateFilter}
                    />
                  </CardContent>
                </Card>
                <div className='h-[370px]'>
                  <SuccessHistoryChart />
                </div>
              </div>

              {/* Colonne de droite - inchangée */}
              <div className='lg:w-3/12'>
                <div className='sticky top-4'>
                  <TaskManager />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Main>
      <Dialog
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        maxWidth='sm'
        fullWidth
      >
        {modalData && (
          <div className='p-6'>
            <AuthorizationContent
              userId={modalData.userId}
              testId={modalData.testId}
              onClose={() => setShowAuthModal(false)}
            />
          </div>
        )}
      </Dialog>
    </>
  )
}

const topNav = [
  {
    title: 'Analytics',
    href: 'dashboard/analytics',
    isActive: true,
    disabled: false,
  },
  {
    title: 'Reports',
    href: '/testHistory/',
    isActive: true,
    disabled: false,
  },
  {
    title: 'Notifications',
    href: 'dashboard/notifications',
    isActive: true,
    disabled: false,
  },
]
export default withAuth(ManagerDashboard, ["manager", "admin","collaborator"]);
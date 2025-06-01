import React, { useState, useEffect } from 'react'
import { ThemeProvider } from '@mui/material/styles'
import { MdInfoOutline } from 'react-icons/md'
import { useAuth } from '@/context/authContext'
// Ajout de useEffect
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { TopNav } from '@/components/layout/top-nav'
import Pinboard from '@/components/pinboard'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import theme from '../.././theme'
import { TestRecord } from '../../interfaces/testRecords.interface'
import { fetchFormattedTests } from '../../services/test.service'
// adapte le chemin selon ton arborescence
import TechnologyRankingChart from './components/TechnologyRankingChart'
import TimeSpentIndicator from './components/TimeSpentIndicator'
import { TimeSpentRadial } from './components/TimeSpentRadial'
import AutoSizeInput from './components/autoSizeInput'
import BestTechnologyCard from './components/bestTechnologyCard'
import Indicators from './components/indicators'
import PerformersOfTheWeek from './components/performersOfTheWeek'
import ProfileCard from './components/profileCard'
import SuccessHistoryChart from './components/successHistoryChart'
import TaskManager from './components/taskManager'
import { Test1 } from './components/test1'
import TestsHistory from './components/testsHistory'
import WorstTechnologyCard from './components/worstTechnologyCard'

// Chemin vers votre fichier theme.ts

// adapte ce chemin selon ton projet

// Assurez-vous que fetchAllTests est bien importée

export default function ManagerDashboard() {
  // Pour la section TimeSpentRadial
  const [collaborateurFilterTime, setCollaborateurFilterTime] = useState('')
  const [technologieFilterTime, setTechnologieFilterTime] = useState('')

  // Pour la section Technology Trends (Test1)
  const [collaborateurFilterTech, setCollaborateurFilterTech] = useState('')
  const [technologieFilterTech, setTechnologieFilterTech] = useState('')
  const [dateFilter, setDateFilter] = useState('all')

  const showDateFilter =
    collaborateurFilterTech.trim() !== '' || technologieFilterTech.trim() !== ''

  const [testRecords, setTestRecords] = useState<TestRecord[]>([]) // Mise à jour de setTestRecords

  const { user } = useAuth()

  // Fonction pour formater le nom
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

  const displayName = user?.name ? formatUserName(user.name) : 'there'

  useEffect(() => {
    // Appel de fetchAllTests() au moment où le composant est monté
    const getTests = async () => {
      try {
        const allTests = await fetchFormattedTests()
        console.log('Tests récupérés :', allTests)
        setTestRecords(allTests)
      } catch (error) {
        console.error('Erreur lors du chargement des tests', error)
      }
    }

    getTests()
  }, []) // Le tableau vide [] signifie que l'effet se déclenche uniquement au montage du composant

  return (
    <>
      <Header>
        <TopNav links={topNav} />
        <div className='ml-auto flex items-center space-x-4'>
          <Search />
          <ThemeSwitch />
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
          <div className='flex items-center space-x-2'>
            <Button>Download</Button>
          </div>
        </div>

        <Tabs
          orientation='vertical'
          defaultValue='overview'
          className='space-y-4'
        >
          <TabsContent value='overview' className='space-y-4'>
            <div className='flex w-full flex-col gap-4 lg:flex-row'>
              {/* Colonne de gauche - inchangée */}
              <div className='flex flex-col gap-4 lg:w-3/12'>
                <Card className='h-80 !rounded-3xl border-0 shadow-md'>
                  <CardHeader className='flex flex-row items-center justify-between'>
                    <div className='flex flex-col'>
                      <CardTitle className='font-bold'>
                        Time spent on test
                      </CardTitle>
                      <div className='mt-1 flex items-center gap-2'>
                        <AutoSizeInput
                          placeholder='collaborator'
                          value={collaborateurFilterTime}
                          onChange={(e) =>
                            setCollaborateurFilterTime(e.target.value)
                          }
                        />
                        <AutoSizeInput
                          placeholder='technology'
                          value={technologieFilterTime}
                          onChange={(e) =>
                            setTechnologieFilterTime(e.target.value)
                          }
                        />
                      </div>
                    </div>
                    <div style={{ marginTop: '-8px' }}>
                      <TimeSpentIndicator
                        testRecords={testRecords}
                        collaborateurFilter={collaborateurFilterTime}
                        technologieFilter={technologieFilterTime}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className='flex flex-1 items-center justify-center'>
                    <TimeSpentRadial
                      testRecords={testRecords}
                      maxTime={90}
                      collaborateurFilter={collaborateurFilterTime}
                      technologieFilter={technologieFilterTime}
                    />
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

              {/* Colonne centrale - Modification uniquement de Technology Trends */}
              <div className='flex flex-col gap-4 lg:w-6/12'>
                <div className='h-[320px]'>
                  <TechnologyRankingChart testRecords={testRecords} />
                </div>

                {/* Seul changement : hauteur réduite de Technology Trends */}
                <Card className='h-[350px] !rounded-3xl border-0 shadow-md'>
                  {' '}
                  {/* Changé de h-[400px] à h-[350px] */}
                  <CardHeader className='flex flex-row items-center justify-between'>
                    <div className='flex flex-col'>
                      <CardTitle className='font-bold'>
                        Technology Trends
                      </CardTitle>
                      <div className='mt-1 flex items-center gap-2'>
                        <AutoSizeInput
                          placeholder='collaborator'
                          value={collaborateurFilterTech}
                          onChange={(e) => {
                            setCollaborateurFilterTech(e.target.value)
                          }}
                        />
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
                    <div style={{ marginTop: '-8px' }}>
                      {collaborateurFilterTech.trim() !== '' &&
                        technologieFilterTech.trim() !== '' && (
                          <Indicators
                            testRecords={testRecords}
                            collaborateur={collaborateurFilterTech}
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
    </>
  )
}

const topNav = [
  {
    title: 'Overview',
    href: 'dashboard/overview',
    isActive: true,
    disabled: false,
  },
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

import React, { useState, useEffect } from 'react'; // Ajout de useEffect
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Header } from '@/components/layout/header';
import { Main } from '@/components/layout/main';
import { TopNav } from '@/components/layout/top-nav';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { Search } from '@/components/search';
import { ThemeSwitch } from '@/components/theme-switch';
import Pinboard from '@/components/pinboard';
import { MdInfoOutline } from 'react-icons/md';
import { Test1 } from './components/test1';
import { TimeSpentRadial } from './components/TimeSpentRadial';
import ProfileCard from './components/profileCard';
import TestsHistory from './components/testsHistory';
import AutoSizeInput from './components/autoSizeInput';
import Indicators from './components/indicators';
import TimeSpentIndicator from './components/TimeSpentIndicator';
import BestTechnologyCard from './components/bestTechnologyCard';
import WorstTechnologyCard from './components/worstTechnologyCard';
import PerformersOfTheWeek from './components/performer';
import { TestRecord } from '../../../interfaces/testRecords.interface';
import { Performer } from '../../../interfaces/performer.interface'; // adapte le chemin selon ton arborescence

import TechnologyRankingChart from './components/TechnologyRankingChart';
import { fetchPerformersOfTheWeek, updatePerformersOfTheWeek } from '../../../services/performer.service'; // Assure-toi d'importer les bonnes fonctions

import { fetchFormattedTests } from '../../../services/test.service'; // Assurez-vous que fetchAllTests est bien importée

export default function Dashboard() {

  // Pour la section TimeSpentRadial
  const [collaborateurFilterTime, setCollaborateurFilterTime] = useState('');
  const [technologieFilterTime, setTechnologieFilterTime] = useState('');

  // Pour la section Technology Trends (Test1)
  const [collaborateurFilterTech, setCollaborateurFilterTech] = useState('');
  const [technologieFilterTech, setTechnologieFilterTech] = useState('');

  const [testRecords, setTestRecords] = useState<TestRecord[]>([]); // Mise à jour de setTestRecords

  useEffect(() => {
    // Appel de fetchAllTests() au moment où le composant est monté
    const getTests = async () => {
      try {
        const allTests = await fetchFormattedTests();
        console.log("Tests récupérés :", allTests);
        setTestRecords(allTests);
      } catch (error) {
        console.error("Erreur lors du chargement des tests", error);
      }
    };

    getTests();
  }, []); // Le tableau vide [] signifie que l'effet se déclenche uniquement au montage du composant
  
  const [performers, setPerformers] = useState<Performer[]>([]);
  
  useEffect(() => {
    // Appel de fetchPerformersOfTheWeek pour récupérer les performers
    const fetchPerformers = async () => {
      try {
        const fetchedPerformers = await fetchPerformersOfTheWeek();
        setPerformers(fetchedPerformers);
      } catch (error) {
        console.error('Erreur lors de la récupération des performers de la semaine', error);
      }
    };

    fetchPerformers();

    // Optionnel : met à jour les performers chaque semaine (si nécessaire)
    const updatePerformers = async () => {
      try {
        await updatePerformersOfTheWeek();
        console.log('Performers de la semaine mis à jour');
      } catch (error) {
        console.error('Erreur lors de la mise à jour des performers', error);
      }
    };

    updatePerformers();
  }, []); // Le tableau vide [] signifie que l'effet se déclenche uniquement au montage du composant
  
  return (
    <>
      <Header>
        <TopNav links={topNav} />
        <div className="ml-auto flex items-center space-x-4">
          <Search />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>
      <Main>
        <div className="mb-2 flex items-center justify-between space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <div className="flex items-center space-x-2">
            <Button>Download</Button>
          </div>
        </div>
        <Tabs orientation="vertical" defaultValue="overview" className="space-y-4">
          <div className="w-full overflow-x-auto pb-2">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="analytics" disabled>
                Analytics
              </TabsTrigger>
              <TabsTrigger value="reports" disabled>
                Reports
              </TabsTrigger>
              <TabsTrigger value="notifications" disabled>
                Notifications
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 gap-2 lg:grid-cols-10">
              {/* TimeSpentRadial Card with header (title, autosized inputs, and indicator) */}
              <Card className="col-span-1 lg:col-span-3 h-80 !rounded-3xl">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex flex-col">
                    <CardTitle className="font-bold">Time spent on test</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <AutoSizeInput
                        placeholder="collaborator"
                        value={collaborateurFilterTime}
                        onChange={(e) => setCollaborateurFilterTime(e.target.value)}
                      />
                      <AutoSizeInput
                        placeholder="technology"
                        value={technologieFilterTime}
                        onChange={(e) => setTechnologieFilterTime(e.target.value)}
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
                <CardContent className="flex flex-1 items-center justify-center">
                  <div className="flex items-center justify-center h-full w-full">
                    <TimeSpentRadial
                      testRecords={testRecords}
                      maxTime={90}
                      collaborateurFilter={collaborateurFilterTime}
                      technologieFilter={technologieFilterTime}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Technology Trends (Test1) Card */}
              <Card className="col-span-1 lg:col-span-4 !rounded-3xl">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex flex-col">
                    <CardTitle className="font-bold">Technology Trends</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <AutoSizeInput
                        placeholder="collaborator"
                        value={collaborateurFilterTech}
                        onChange={(e) => setCollaborateurFilterTech(e.target.value)}
                      />
                      <AutoSizeInput
                        placeholder="technology"
                        value={technologieFilterTech}
                        onChange={(e) => setTechnologieFilterTech(e.target.value)}
                      />
                    </div>
                  </div>
                  <div style={{ marginTop: '-8px' }}>
                    <Indicators
                      testRecords={testRecords}
                      collaborateur={collaborateurFilterTech}
                      technologie={technologieFilterTech}
                    />
                  </div>
                </CardHeader>
                <CardContent className="pl-2">
                  <Test1
                    testRecords={testRecords}
                    collaborateurFilter={collaborateurFilterTech}
                    technologieFilter={technologieFilterTech}
                  />

                </CardContent>
              </Card>

              {/* Profile Card */}
              <Card className="col-span-1 lg:col-span-3 h-80 !rounded-3xl">
                <div className="flex h-full items-center justify-center">
                  <ProfileCard />
                </div>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 gap-2 lg:grid-cols-10">
              {/* Best & Worst Technology Cards (3 colonnes) */}
              <div className="col-span-1 lg:col-span-3 space-y-2">
                <BestTechnologyCard testRecords={testRecords} />
                <WorstTechnologyCard testRecords={testRecords} />
              </div>

              {/* Technology Ranking Chart (5 colonnes) */}
              <div className="col-span-1 lg:col-span-5 !rounded-3xl h-full">
                <TechnologyRankingChart testRecords={testRecords} />
              </div>

              {/* Test History Table - toute la largeur */}
              <div className="col-span-1 lg:col-span-10">
                <TestsHistory testRecords={testRecords} />
              </div>
            </div>
            <PerformersOfTheWeek performers={performers} />
          </TabsContent>
        </Tabs>
      </Main>
    </>
  );
}

const topNav = [
  {
    title: 'Overview',
    href: 'dashboard/overview',
    isActive: true,
    disabled: false,
  },
  {
    title: 'Customers',
    href: 'dashboard/customers',
    isActive: false,
    disabled: true,
  },
  {
    title: 'Products',
    href: 'dashboard/products',
    isActive: false,
    disabled: true,
  },
  {
    title: 'Settings',
    href: 'dashboard/settings',
    isActive: false,
    disabled: true,
  },
];

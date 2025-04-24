// import React, { useState, useRef, useEffect, ChangeEvent, useMemo } from 'react'
// import { Button } from '@/components/ui/button'
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from '@/components/ui/card'
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
// import { Header } from '@/components/layout/header'
// import { Main } from '@/components/layout/main'
// import { TopNav } from '@/components/layout/top-nav'
// import { ProfileDropdown } from '@/components/profile-dropdown'
// import { Search } from '@/components/search'
// import { ThemeSwitch } from '@/components/theme-switch'
// import { RecentSales } from './components/recent-sales'
// import Pinboard from '@/components/pinboard'
// import { Test1 } from './components/test1'
// import { BiSolidUpArrow, BiSolidDownArrow } from 'react-icons/bi'
// import { TimeSpentRadial } from './components/TimeSpentRadial'
// import ProfileCard from './components/profileCard'

// interface AutoSizeInputProps {
//   value: string
//   placeholder: string
//   onChange: (e: ChangeEvent<HTMLInputElement>) => void
//   className?: string
// }

// function AutoSizeInput({ value, onChange, placeholder }: AutoSizeInputProps) {
//   const spanRef = useRef<HTMLSpanElement>(null)
//   const [inputWidth, setInputWidth] = useState(0)

//   useEffect(() => {
//     if (spanRef.current) {
//       const width = spanRef.current.offsetWidth
//       setInputWidth(width)
//     }
//   }, [value, placeholder])

//   return (
//     <div className="relative inline-block">
//       <input
//         type="text"
//         placeholder={placeholder}
//         value={value}
//         onChange={onChange}
//         style={{ width: inputWidth || 'auto' }}
//         className="p-1 text-sm border-none outline-none"
//       />
//       <span
//         ref={spanRef}
//         className="absolute top-0 left-0 p-1 text-sm whitespace-pre invisible"
//       >
//         {value || placeholder}
//       </span>
//     </div>
//   )
// }

// // --- Composant IndicatorComp pour les indicateurs ---
// const rawData = [
//   { date: '18 Oct', collaborateur: 'Alice', technologie: 'React', score: 200, tauxReussite: 75 },
//   { date: '18 Oct', collaborateur: 'Bob', technologie: 'Vue', score: 220, tauxReussite: 80 },
//   { date: '26 Oct', collaborateur: 'Alice', technologie: 'Angular', score: 210, tauxReussite: 85 },
//   { date: '26 Oct', collaborateur: 'Charlie', technologie: 'React', score: 230, tauxReussite: 90 },
//   { date: '02 Nov', collaborateur: 'Bob', technologie: 'React', score: 240, tauxReussite: 95 },
//   { date: '12 Nov', collaborateur: 'Alice', technologie: 'Vue', score: 190, tauxReussite: 70 },
//   { date: '20 Nov', collaborateur: 'Charlie', technologie: 'Angular', score: 225, tauxReussite: 88 },
// ];

// interface IndicatorsProps {
//   collaborateurFilter: string
//   technologieFilter: string
// }

// function IndicatorComp({ currentValue, previousValue, suffix = '', prefix = '' }: { currentValue: number, previousValue: number, suffix?: string, prefix?: string }) {
//   const formatValue = (value: number) => value % 1 === 0 ? value.toString() : value.toFixed(2)
//   const diff = currentValue - previousValue
//   const isUp = diff >= 0
//   const absDiff = Math.abs(diff)
//   const color = isUp ? 'green' : 'red'

//   return (
//     <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
//       <div style={{ fontSize: '15px', fontWeight: 600, color: '#000' }}>
//         {prefix}{formatValue(currentValue)}{suffix}
//       </div>
//       <div style={{ fontSize: '12px', fontWeight: 400, display: 'flex', alignItems: 'center', color }}>
//         {isUp ? <BiSolidUpArrow size={10} color={color} /> : <BiSolidDownArrow size={10} color={color} />}
//         <span style={{ marginLeft: '4px' }}>
//           {prefix}{formatValue(absDiff)}{suffix}
//         </span>
//       </div>
//     </div>
//   )
// }

// function Indicators({ collaborateurFilter, technologieFilter }: IndicatorsProps) {
//   // Filtrer et limiter à 5 tests
//   const filteredData = useMemo(() => {
//     return rawData.filter(item => {
//       const collabMatch = item.collaborateur.toLowerCase().includes(collaborateurFilter.toLowerCase())
//       const techMatch = item.technologie.toLowerCase().includes(technologieFilter.toLowerCase())
//       return collabMatch && techMatch
//     })
//   }, [collaborateurFilter, technologieFilter])

//   const testData = useMemo(() => {
//     const limitedData = filteredData.slice(0, 5)
//     return limitedData.map((item, index) => ({
//       ...item,
//       testId: `Test ${index + 1}`,
//     }))
//   }, [filteredData])

//   // Calcul des moyennes
//   const avgTaux = useMemo(() => {
//     if (testData.length === 0) return null
//     return testData.reduce((acc, t) => acc + t.tauxReussite, 0) / testData.length
//   }, [testData])
//   const prevAvgTaux = useMemo(() => {
//     if (testData.length < 2) return null
//     const sum = testData.slice(0, testData.length - 1).reduce((acc, t) => acc + t.tauxReussite, 0)
//     return sum / (testData.length - 1)
//   }, [testData])

//   const avgScore = useMemo(() => {
//     if (testData.length === 0) return null
//     return testData.reduce((acc, t) => acc + t.score, 0) / testData.length
//   }, [testData])
//   const prevAvgScore = useMemo(() => {
//     if (testData.length < 2) return null
//     const sum = testData.slice(0, testData.length - 1).reduce((acc, t) => acc + t.score, 0)
//     return sum / (testData.length - 1)
//   }, [testData])

//   return (
//     <div className="flex items-center gap-4">
//       {avgTaux !== null && prevAvgTaux !== null && (
//         <IndicatorComp currentValue={avgTaux} previousValue={prevAvgTaux} suffix="%" />
//       )}
//       {avgScore !== null && prevAvgScore !== null && (
//         <IndicatorComp currentValue={avgScore} previousValue={prevAvgScore} suffix="pts" />
//       )}
//     </div>
//   )
// }

// export default function Dashboard() {
//   const [collaborateurFilter, setCollaborateurFilter] = useState('')
//   const [technologieFilter, setTechnologieFilter] = useState('')

//   return (
//     <>
//       {/* ===== Top Heading ===== */}
//       <Header>
//         <TopNav links={topNav} />
//         <div className="ml-auto flex items-center space-x-4">
//           <Search />
//           <ThemeSwitch />
//           <ProfileDropdown />
//         </div>
//       </Header>

//       {/* ===== Main ===== */}
//       <Main>
//         <div className="mb-2 flex items-center justify-between space-y-2">
//           <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
//           <div className="flex items-center space-x-2">
//             <Button>Download</Button>
//           </div>
//         </div>
//         <Tabs orientation="vertical" defaultValue="overview" className="space-y-4">
//           <div className="w-full overflow-x-auto pb-2">
//             <TabsList>
//               <TabsTrigger value="overview">Overview</TabsTrigger>
//               <TabsTrigger value="analytics" disabled>
//                 Analytics
//               </TabsTrigger>
//               <TabsTrigger value="reports" disabled>
//                 Reports
//               </TabsTrigger>
//               <TabsTrigger value="notifications" disabled>
//                 Notifications
//               </TabsTrigger>
//             </TabsList>
//           </div>
//           <TabsContent value="overview" className="space-y-4">
//             <div className="grid grid-cols-1 gap-2 lg:grid-cols-10">
//               <Card className="col-span-1 lg:col-span-3 h-80 !rounded-3xl">
//                 <CardHeader>
//                   <CardTitle>Time spent on test</CardTitle>
//                 </CardHeader>
//                 <CardContent className="flex h-full items-center justify-center">
//                   <TimeSpentRadial timeSpent={30} maxTime={90} />
//                 </CardContent>
//               </Card>
//               {/* Carte Technology Trends avec titre, filtres et indicateurs intégrés */}
//               <Card className="col-span-1 lg:col-span-4 !rounded-3xl">
//                 <CardHeader className="flex flex-row items-center justify-between">
//                   <div className="flex flex-col">
//                     <CardTitle className="font-bold">Technology Trends</CardTitle>
//                     <div className="flex items-center gap-2 mt-1">
//                       <AutoSizeInput
//                         placeholder="collaborator"
//                         value={collaborateurFilter}
//                         onChange={(e) => setCollaborateurFilter(e.target.value)}
//                       />
//                       <AutoSizeInput
//                         placeholder="technology"
//                         value={technologieFilter}
//                         onChange={(e) => setTechnologieFilter(e.target.value)}
//                       />
//                     </div>
//                   </div>
//                   {/* Ici, nous affichons les indicateurs directement dans le header */}
//                   <div style={{ marginTop: '-8px' }}>
//                   <Indicators
//                     collaborateurFilter={collaborateurFilter}
//                     technologieFilter={technologieFilter}
//                   />
//                   </div>
//                 </CardHeader>
//                 <CardContent className="pl-2">
//                   <Test1
//                     collaborateurFilter={collaborateurFilter}
//                     technologieFilter={technologieFilter}
//                   />
//                 </CardContent>
//               </Card>
//               <Card className="col-span-1 lg:col-span-3 h-[290px] !rounded-3xl">
//               <div className="flex h-full items-center justify-center">
//                 <ProfileCard />
//               </div>
//               </Card>
//             </div>
//             {/* Section Pinboard */}
//             <div className="grid grid-cols-1 gap-4">
//               <Card>
//                 <CardHeader>
//                   <CardTitle>Pinboard</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <Pinboard />
//                 </CardContent>
//               </Card>
//             </div>
//           </TabsContent>
//         </Tabs>
//       </Main>
//     </>
//   )
// }

// const topNav = [
//   {
//     title: 'Overview',
//     href: 'dashboard/overview',
//     isActive: true,
//     disabled: false,
//   },
//   {
//     title: 'Customers',
//     href: 'dashboard/customers',
//     isActive: false,
//     disabled: true,
//   },
//   {
//     title: 'Products',
//     href: 'dashboard/products',
//     isActive: false,
//     disabled: true,
//   },
//   {
//     title: 'Settings',
//     href: 'dashboard/settings',
//     isActive: false,
//     disabled: true,
//   },
// ]

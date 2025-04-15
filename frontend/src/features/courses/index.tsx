import { useState, useEffect } from 'react'
import {
  IconAdjustmentsHorizontal,
  IconSortAscendingLetters,
  IconSortDescendingLetters,
  IconChevronDown,
} from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Searchh } from '@/components/searchh'
import { ThemeSwitch } from '@/components/theme-switch'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from "@/components/ui/dropdown-menu"
import { courses as courseData } from './data/courses'

const appText = new Map<string, string>([
  ['all', 'All Apps'],
])

export default function Courses() {
  const [sort, setSort] = useState('ascending')
  const [appType, setAppType] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [courses, setCourses] = useState(courseData)  // <-- Initialisation de courses ici

  const filteredApps = courses
    .sort((a, b) =>
      sort === 'ascending'
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name)
    )
    .filter((app) =>
      appType === 'completed'
        ? app.completed
        : appType === 'notCompleted'
          ? !app.completed
          : true
    )
    .filter((app) => app.name.toLowerCase().includes(searchTerm.toLowerCase()))

  useEffect(() => {
    fetch('http://localhost:5000/api/courses')
      .then(response => response.json())
      .then(data => setCourses(data))
      .catch(error => console.error('Error fetching data:', error));
  }, []); 

  return (
    <>
      {/* ===== Top Heading ===== */}
      <Header>
        <Searchh />
        <div className='rounded-3xl ml-auto flex items-center gap-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      {/* ===== Content ===== */}
      <Main fixed>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>
            My courses
          </h1>
          <p className='text-muted-foreground'>
            Here&apos;s a list of our courses!
          </p>
        </div>
        <div className='my-4 flex items-end justify-between sm:my-0 sm:items-center'>
          <div className='flex flex-col gap-4 sm:my-4 sm:flex-row'>
            <Input
              placeholder='Filter courses...'
              className='rounded-3xl h-9 w-40 lg:w-[250px]'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            {/* All Apps Button */}
            <Select value={appType} onValueChange={setAppType}>
              <SelectTrigger className='rounded-3xl flex items-center justify-center px-4 py-2 bg-[#1a1a1a] text-white font-medium whitespace-nowrap hover:bg-white hover:text-black transition-colors [&>svg]:hidden'>
                <SelectValue>{appText.get(appType)}</SelectValue>
              </SelectTrigger>
            </Select>

            {/* Méthodologie Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger className="px-5 py-1 rounded-3xl bg-white text-black font-medium whitespace-nowrap hover:bg-black hover:text-white transition-colors border border-gray-300 focus-visible:ring-2 focus-visible:ring-gray-400 flex items-center">
                <span>Methodology</span>
                <IconChevronDown size={18} className="ml-3" />
              </DropdownMenuTrigger>

              <DropdownMenuContent>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Agile</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => setAppType("scrum")}>Scrum</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setAppType("kanban")}>Kanban</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setAppType("Lean")}>Lean</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setAppType("SAFe")}>SAFe</DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Classics</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => setAppType("cyclev")}>Cycle en V</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setAppType("waterfall")}>Waterfall</DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuItem onClick={() => setAppType("devops")}>DevOps</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Technology Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger className="px-5 py-1 rounded-full bg-white text-black font-medium whitespace-nowrap hover:bg-black hover:text-white transition-colors border border-gray-300 focus-visible:ring-2 focus-visible:ring-gray-400 flex items-center">
                <span>Technology</span>
                <IconChevronDown size={18} className="ml-3" />
              </DropdownMenuTrigger>

              <DropdownMenuContent>
                {/* Backend Submenu */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Backend</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => setAppType("PHP Laravel")}>PHP Laravel</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setAppType("JavaScript(Node.js)")}>JavaScript (Node.js)</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setAppType("Python")}>Python</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setAppType("Kotlin")}>Kotlin</DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                {/* Frontend Submenu */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Frontend</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => setAppType("JavaScript(JS)")}>JavaScript (JS)</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setAppType("HTML/CSS")}>HTML/CSS</DropdownMenuItem>

                    {/* Framework & Library Submenu */}
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>Framework & Library</DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem onClick={() => setAppType("React.JS")}>React.js</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setAppType("Vue.js")}>Vue.js</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setAppType("Angular")}>Angular</DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuContent>
            </DropdownMenu>

            <button
              className="px-5 py-1 rounded-3xl bg-white text-black font-medium whitespace-nowrap hover:bg-black hover:text-white transition-colors border border-gray-300 focus-visible:ring-2 focus-visible:ring-gray-400 flex items-center justify-center"
            >
              Enrolled Courses
            </button>
            <button
              className="px-5 py-1 rounded-3xl bg-white text-black font-medium whitespace-nowrap hover:bg-black hover:text-white transition-colors border border-gray-300 focus-visible:ring-2 focus-visible:ring-gray-400 flex items-center justify-center"
            >
              News
            </button>

            {/* Sorting Select */}
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className='rounded-3xl w-16 ml-40'>
                <SelectValue>
                  <IconAdjustmentsHorizontal size={18} />
                </SelectValue>
              </SelectTrigger>
              <SelectContent align='end'>
                <SelectItem value='ascending'>
                  <div className='flex items-center gap-4'>
                    <IconSortAscendingLetters size={16} />
                    <span>Ascending</span>
                  </div>
                </SelectItem>
                <SelectItem value='descending'>
                  <div className='flex items-center gap-4'>
                    <IconSortDescendingLetters size={16} />
                    <span>Descending</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator className='shadow' />
        <ul className='rounded-3xl faded-bottom no-scrollbar grid gap-4 overflow-auto pb-16 pt-4 md:grid-cols-2 lg:grid-cols-3'>
          {filteredApps.map((app) => (
            <li
              key={app.name}
              className='rounded-3xl border p-4 hover:shadow-md'
            >
              <div className='rounded-3xl mb-8 flex items-center justify-between'>
                <div className={`rounded-3xl flex size-10 items-center justify-center bg-muted p-2`}>
                  {app.logo}
                </div>
                <Button
                  variant='outline'
                  size='sm'
                  className={`${app.completed ? 'rounded-3xl border border-blue-300 bg-blue-50 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-950 dark:hover:bg-blue-900' : 'rounded-3xl'}`}
                >
                  {app.completed ? 'Completed' : 'Complete'}
                </Button>
              </div>
              <div>
                <h2 className='rounded-3xl mb-2 text-lg font-bold'>{app.name}</h2>
                <p className='text-sm'>{app.desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </Main>
    </>
  )
}

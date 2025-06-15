import { useState } from 'react'
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
import { courses } from './data/courses'
import { Link } from '@tanstack/react-router'; // Importation de Link
import { useNavigate } from '@tanstack/react-router' // tout en haut de ton fichier

const appText = new Map<string, string>([
  ['all', 'All '],
])

export default function Courses() {
  const [sort, setSort] = useState('ascending')
  const [appType, setAppType] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const navigate = useNavigate();

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

  return (
    <>
      {/* ===== Top Heading ===== */}
      <Header>
        <Searchh />
        <div className=' rounded-3xl ml-auto flex items-center gap-4'>
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
              className=' rounded-3xl h-9 w-40 lg:w-[250px]'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            {/* All Apps Button */}
            <Select value={appType} onValueChange={setAppType}>
              <SelectTrigger className=' rounded-3xl flex items-center justify-center px-4 py-2 bg-[#1a1a1a] text-white font-medium whitespace-nowrap hover:bg-white hover:text-black transition-colors [&>svg]:hidden'>
                <SelectValue>{appText.get(appType)}</SelectValue>
              </SelectTrigger>
            </Select>

            {/* Méthodologie Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger className="px-5 py-1 rounded-3xl bg-white text-black font-medium whitespace-nowrap hover:bg-black hover:text-white transition-colors border border-gray-300 focus-visible:ring-2 focus-visible:ring-gray-400 flex items-center">
                <span> Methodology</span>
                <IconChevronDown size={18} className="ml-3" />
              </DropdownMenuTrigger>

              <DropdownMenuContent>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Agile</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => navigate({ to: "/courses/scrum" })}>
    Scrum
  </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate({ to: "/courses/kanban" })}>
   Kanban
  </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate({ to: "/courses/lean" })}>
    Lean
  </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate({ to: "/courses/safe" })}>
    SAFe
  </DropdownMenuItem>

                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Classics</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => navigate({ to: "/courses/cyclev" })}>
   V Cycle
  </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate({ to: "/courses/waterfall" })}>
    Waterfall
  </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuItem onClick={() => navigate({ to: "/courses/devops" })}>
    DevOps
  </DropdownMenuItem>
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
        <DropdownMenuItem onClick={() => navigate({ to: "/courses/laravel" })}>
        PHP Laravel
  </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate({ to: "/courses/node" })}>
        JavaScript (Node.js)
  </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate({ to: "/courses/python" })}>
       Python
  </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate({ to: "/courses/kotlin" })}>
      Kotlin
  </DropdownMenuItem>

      </DropdownMenuSubContent>
    </DropdownMenuSub>

    {/* Frontend Submenu */}
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>Frontend</DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuItem onClick={() => navigate({ to: "/courses/javascript" })}>
        JavaScript (JS)
  </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate({ to: "/courses/htmlcss" })}>
    HTML/CSS
  </DropdownMenuItem>
        {/* Framework & Library Submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Framework & Library</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => navigate({ to: "/courses/react" })}>
   React.js
  </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate({ to: "/courses/vue" })}>
   Vue.js
  </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate({ to: "/courses/angular" })}>
    Angular
  </DropdownMenuItem>          </DropdownMenuSubContent>
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
            <SelectTrigger className=' rounded-3xl w-16 ml-40'>
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
      className='cursor-pointer rounded-3xl border p-4 hover:shadow-md  hover:scale-110 transition-transform duration-200'
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
        <h2 className='rounded-3xl mb-1 font-semibold'>
          {/* Envelopper le nom du cours dans le Link pour le rendre cliquable */}
          {
  app.name === 'Angular' ? (
    <Link to="/courses/angular" className="text-black hover:underline">
      {app.name}
    </Link>
  ) : app.name === 'HTML/CSS' ? (
    <Link to="/courses/htmlcss" className="text-black hover:underline">
      {app.name}
    </Link>
  ) : app.name === 'Kanban' ? (
    <Link to="/courses/kanban" className="text-black hover:underline">
      {app.name}
    </Link>
  ) : app.name === 'Scrum' ? (
    <Link to="/courses/scrum" className="text-black hover:underline">
      {app.name}
    </Link>
  ) : app.name === 'Lean' ? (
    <Link to="/courses/lean" className="text-black hover:underline">
      {app.name}
    </Link>
  ) : app.name === 'SAFe' ? (
    <Link to="/courses/safe" className="text-black hover:underline">
      {app.name}
    </Link>
  ) : app.name === 'V Cycle' ? (
    <Link to="/courses/cyclev" className="text-black hover:underline">
      {app.name}
    </Link>
  ) : app.name === 'Waterfall' ? (
    <Link to="/courses/waterfall" className="text-black hover:underline">
      {app.name}
    </Link>
  ) : app.name === 'DeVops' ? (
    <Link to="/courses/devops" className="text-black hover:underline">
      {app.name}
    </Link>
  ) : app.name === 'Laravel' ? (
    <Link to="/courses/laravel" className="text-black hover:underline">
      {app.name}
    </Link>
  ) : app.name === 'Node.js' ? (
    <Link to="/courses/node" className="text-black hover:underline">
      {app.name}
    </Link>
  ) : app.name === 'Python' ? (
    <Link to="/courses/python" className="text-black hover:underline">
      {app.name}
    </Link>
  ) : app.name === 'Vue.js' ? (
    <Link to="/courses/vue" className="text-black hover:underline">
      {app.name}
    </Link>
  ) : app.name === 'JavaScript' ? (
    <Link to="/courses/javascript" className="text-black hover:underline">
      {app.name}
    </Link>
  ) : app.name === 'React.js' ? (
    <Link to="/courses/react" className="text-black hover:underline">
      {app.name}
    </Link>
  ) : app.name === 'Kotlin' ? (
    <Link to="/courses/kotlin" className="text-black hover:underline">
      {app.name}
    </Link>
  ) : app.name

    
  
}

          
         
         
        </h2>
        <p className='line-clamp-2 text-gray-500'>{app.desc}</p>
      </div>
    </li>
  ))}
</ul>

      </Main>
    </>
  )
}

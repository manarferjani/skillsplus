import {
  IconChartArcs,
  IconBrandAngular,
  IconShield,
  IconLeaf,
  IconBrandKotlin,
  IconBrandHtml5,
  IconBrandNodejs,
  IconBrandLaravel,
  IconClipboardList,
  IconBrandPython,
  IconBrandReact,
  IconBrandVue,
  IconBrandCss3,
  IconLayoutKanban,
  IconStairsUp,
} from '@tabler/icons-react'

export const courses = [
  {
    name: 'React.js',
    logo: <IconBrandReact size={24} color="#61DAFB" />,
    completed: false,
    desc: 'Learn to build interactive user interfaces with React library.',
  },
  {
    name: 'Node.js',
    logo: <IconBrandNodejs color="#339933" />,
    completed: true,
    desc: 'Master JavaScript runtime for building server-side applications.',
  },
  {
    name: 'Angular',
    logo: <IconBrandAngular color="#DD0031" />,
    completed: true,
    desc: 'Develop complete web applications with Angular framework.',
  },
  {
    name: 'HTML/CSS',
    logo: <div className="flex items-center">
      <IconBrandHtml5 color="#E34F26" />
      <IconBrandCss3 color="#1572B6" />
    </div>,
    completed: false,
    desc: 'Fundamentals of web development with HTML and CSS.',
  },
  {
    name: 'Scrum',
    logo: <IconClipboardList color="#87C53B" />,
    completed: false,
    desc: 'Agile framework for effective project management.',
  },
  {
    name: 'Kanban',
    logo: <IconLayoutKanban color="#0052CC" />,
    completed: true,
    desc: 'Visual workflow management methodology.',
  },
  {
    name: 'Python',
    logo: <IconBrandPython color="#3776AB" />,
    completed: false,
    desc: 'Versatile programming with Python language.',
  },
  {
    name: 'Vue.js',
    logo: <IconBrandVue color="#4FC08D" />,
    completed: true,
    desc: 'Progressive JavaScript framework for building UIs.',
  },
  {
    name: 'Kotlin',
    logo: <IconBrandKotlin color="#7F52FF" />,
    completed: false,
    desc: 'Modern programming language for Android development.',
  },
  {
    name: 'Laravel',
    logo: <IconBrandLaravel color="#FF2D20" />,
    completed: false,
    desc: 'PHP framework for elegant web application development.',
  },
  {
    name: 'Lean',
    logo: <IconLeaf color="#00B140" />,
    completed: false,
    desc: 'Methodology for maximizing value while minimizing waste.',
  },
  {
    name: 'SAFe',
    logo: <IconShield color="#FF7900" />,
    completed: false,
    desc: 'Scaled Agile Framework for enterprise development.',
  },
  {
    name: 'V Cycle',
    logo: <IconChartArcs color="#6A1B9A" />,
    completed: false,
    desc: 'linear project management method where each design step is followed by a corresponding validation phase.',
  },
  {
    name: 'JavaScript',
    logo: <IconBrandHtml5 color="#F7DF1E" />, // Jaune JavaScript
    completed: false,
    desc: 'Learn the core programming language of the web: JavaScript.',
  },
  {
    name: 'DeVops',
    logo: <IconClipboardList color="#0E76A8" />, // Icône de gestion/de planification
    completed: false,
    desc: 'Integrate development and operations for faster software delivery.',
  },
  {
    name: 'Waterfall',
    logo: <IconStairsUp color="#1E88E5" />, // une icône qui évoque une progression linéaire par paliers
    completed: false,
    desc: 'Traditional sequential project management methodology.',
  },
  
]

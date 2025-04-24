import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { CardVideo } from "@/components/ui/card-video";
import { Header } from '@/components/layout/header';
import { Searchh } from '@/components/searchh';
import { Button } from '@/components/ui/button';
import { useNavigate } from '@tanstack/react-router';
import { ThemeSwitch } from '@/components/theme-switch';
import { ProfileDropdown } from '@/components/profile-dropdown';

const MOCK_COURSES = [
  {
    id: 1,
    title: "Advanced Components in Angular",
    description: "Dive deeper into Angular components, their lifecycle, and optimization.",
    author: "Julien Lefevre",
    views: 15,
    date: "Il y a 1 semaine",
    duration: "55:20",
    isBookmarked: false,
    image: "/angI.jpg",
  },
  {
    id: 2,
    title: "Angular Forms & Validation",
    description: "Master reactive and template-driven forms with validation techniques.",
    author: "Claire Moreau",
    views: 9,
    date: "Il y a 2 semaines",
    duration: "1:10:00",
    isBookmarked: false,
    image: "/angI.jpg",
  },
  {
    id: 3,
    title: "Angular Routing & Navigation",
    description: "Learn to handle complex routing and guards in Angular applications.",
    author: "Nicolas Laurent",
    views: 6,
    date: "Il y a 3 jours",
    duration: "1:45:30",
    isBookmarked: false,
    image: "/angI.jpg",
  },
];

export default function Angularintermediares() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [courses, setCourses] = useState(MOCK_COURSES);
  const navigate = useNavigate();

  const toggleBookmark = (courseId: number) => {
    setCourses(courses.map(course =>
      course.id === courseId
        ? { ...course, isBookmarked: !course.isBookmarked }
        : course
    ));
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "all" || course.isBookmarked;
    return matchesSearch && matchesTab;
  });

  return (
    <>
      <Header>
        <Searchh />
        <div className="ml-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="flex items-center space-x-1 mb-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate({ to: '/courses/angular' })}
            className="hover:bg-black hover:text-white w-8 h-8"
          >
            <i className="fas fa-chevron-left" />
          </Button>
          <h1 className="text-3xl font-bold">Angular Intermediate</h1>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-8">
          <div className="flex-1">
            <p className="text-gray-700 mb-2">
            A complete course on Angular to create modern and interactive web applications.            </p>

            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
              <div className="relative w-full sm:max-w-xs">
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-4 pr-10 border rounded-3xl focus:outline-none focus:ring-2 focus:ring-gray-200"
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              </div>

              <div className="inline-flex p-1 bg-gray-100 rounded-3xl mt-2 sm:mt-0">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-4  text-sm font-medium rounded-3xl transition-colors duration-200 ${
                    activeTab === 'all'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-gray-500 hover:text-black'
                  }`}
                >
                  All courses
                </button>
                <button
                  onClick={() => setActiveTab('saved')}
                  className={`px-4 text-sm font-medium rounded-3xl transition-colors duration-200 ${
                    activeTab === 'saved'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-gray-500 hover:text-black'
                  }`}
                >
                  Saved courses ({courses.filter(c => c.isBookmarked).length})
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 md:mt-0">
            <button className="bg-black hover:bg-white transition-colors text-white px-4 py-1 rounded-3xl flex items-center gap-2 hover:text-black">
              <Plus className="h-4 w-4" />
              Add courses
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <CardVideo
              key={course.id}
              title={course.title}
              description={course.description}
              author={course.author}
              views={course.views}
              date={course.date}
              duration={course.duration}
              isBookmarked={course.isBookmarked}
              onBookmark={() => toggleBookmark(course.id)}
              image={course.image}
            />
          ))}
        </div>
      </div>
    </>
  );
}

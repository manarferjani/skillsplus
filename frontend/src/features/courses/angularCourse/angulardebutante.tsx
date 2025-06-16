import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { CardVideo } from "@/components/ui/card-video";
import { Header } from '@/components/layout/header';
import { Searchh } from '@/components/searchh';
import { Button } from '@/components/ui/button';
import { useNavigate } from '@tanstack/react-router';
import { ThemeSwitch } from '@/components/theme-switch';
import { ProfileDropdown } from '@/components/profile-dropdown';
import ResourceManagement from './ressources'

// Mock Courses data sans ressources
const MOCK_COURSES = [
  {
    id: 1,
    title: "Introduction to Angular",
    description: "Learn the basics of Angular to create your first websites.",
    author: "",
    views: 12,
    date: "Il y a 2 semaines",
    duration: "45:12",
    isBookmarked: false,
    image: "/angB.webp",
    playlistLink: "",
  },
  {
    id: 2,
    title: "Angular for Beginners",
    description: "A complete course on Angular to create modern and interactive web applications.",
    author: "",
    views: 8,
    date: "Il y a 1 mois",
    duration: "1:22:45",
    isBookmarked: false,
    image: "/angB.webp",
    playlistLink: "",
  },
  {
    id: 3,
    title: "Angular: From Zero to Hero",
    description: "Master Angular to create modern, interactive web applications.",
    author: "",
    views: 2,
    date: "Il y a 3 semaines",
    duration: "2:15:30",
    isBookmarked: false,
    image: "/angB.webp",
    playlistLink: "",
  },
];

export default function Angulardebutante() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [courses, setCourses] = useState(MOCK_COURSES);
  const [showModal, setShowModal] = useState(false);
  const [newCourse, setNewCourse] = useState({ title: "", description: "", playlistLink: "" });
  const navigate = useNavigate();
  const sharedStyle = "h-10 px-4 rounded-3xl text-sm transition-colors duration-200";
  
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

  const handleModalToggle = () => setShowModal(!showModal);

  const handleAddCourse = () => {
    const newCourseData = {
      id: courses.length + 1,
      title: newCourse.title,
      description: newCourse.description,
      author: "Unknown",
      views: 0,
      date: "Just added",
      duration: "0:00",
      isBookmarked: false,
      image: "/an.webp",
      playlistLink: newCourse.playlistLink,
    };
    setCourses([...courses, newCourseData]);
    setNewCourse({ title: "", description: "", playlistLink: "" });
    setShowModal(false);
  };
  
  const handleDeleteCourse = (courseId: number) => {
    const updatedCourses = courses.filter(course => course.id !== courseId);
    setCourses(updatedCourses);
  };

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
        {/* Titre et retour */}
        <div className="flex items-center space-x-1 mb-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate({ to: '/courses/angular' })}
            className="hover:bg-black hover:text-white w-8 h-8"
          >
            <i className="fas fa-chevron-left" />
          </Button>
          <h1 className="text-3xl font-bold">Angular Beginner</h1>
        </div>

        {/* Search, filtres & boutons */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-8">
          <div className="flex-1">
            <p className="text-gray-700 mb-2">Discover and organize your course videos</p>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              {/* Search & Tabs */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 w-full">

                <div className="relative w-full sm:max-w-xs py-4">
                  <input
                    type="text"
                    placeholder="Search courses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full pl-4 pr-10 border focus:outline-none focus:ring-2 focus:ring-gray-200 ${sharedStyle}`}
                  />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                </div>

                <div className="inline-flex p-1 bg-gray-100 rounded-3xl ">
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`px-4 py-1 text-sm font-medium rounded-3xl transition-colors duration-200 ${
                      activeTab === 'all'
                        ? 'bg-white text-black shadow-sm'
                        : 'text-gray-500 hover:text-black'
                    }`}
                  >
                    All courses
                  </button>
                  <button
                    onClick={() => setActiveTab('saved')}
                    className={`px-4 py-1 text-sm font-medium rounded-3xl transition-colors duration-200 ${
                      activeTab === 'saved'
                        ? 'bg-white text-black shadow-sm'
                        : 'text-gray-500 hover:text-black'
                    }`}
                  >
                    Saved courses ({courses.filter(c => c.isBookmarked).length})
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-4 sm:mt-0">
                <button
                  onClick={handleModalToggle}
                  className={`bg-black hover:bg-white text-white hover:text-black flex items-center gap-2 ${sharedStyle}`}
                >
                  <Plus className="h-5 w-5" />
                  Add
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* Modal d’ajout */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-3xl w-96">
              <h2 className="text-xl font-semibold mb-4">Add a New Course</h2>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Course Title"
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                  className="w-full p-2 border rounded-3xl"
                />
                <textarea
                  placeholder="Course Description"
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                  className="w-full p-2 border rounded-3xl"
                />
                <input
                  type="text"
                  placeholder="Playlist Link (URL)"
                  value={newCourse.playlistLink}
                  onChange={(e) => setNewCourse({ ...newCourse, playlistLink: e.target.value })}
                  className="w-full p-2 border rounded-3xl"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleModalToggle}
                    className="bg-red-800 text-white py-2 px-4 rounded-3xl flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddCourse}
                    className="bg-black text-white py-2 px-4 rounded-3xl flex-1"
                  >
                    Add Course
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Grille de cards */}
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
              onDelete={() => handleDeleteCourse(course.id)} // Passer la fonction de suppression
            />
          ))}
        </div>
      </div>

      {/* Section PDF Resources */}
      <ResourceManagement/>
    </>
  );
}

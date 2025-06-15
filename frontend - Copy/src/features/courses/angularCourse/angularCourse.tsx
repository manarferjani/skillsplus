import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from '@tanstack/react-router';
import { Bookmark, BookmarkCheck, MoreVertical} from 'lucide-react';
import { Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';

interface Resource {
  type: 'pdf' | 'link';
  title: string;
  url: string;
}

interface Course {
  id: number;
  title: string;
  description: string;
  progress: number;
  isSaved: boolean;
  resources?: Resource[];
  imageUrl?: string;
  onDelete?: () => void; // Fonction pour supprimer
}

export default function AngularCourse() {
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [newCourse, setNewCourse] = useState<Course>({
    id: 0,
    title: '',
    description: '',
    progress: 0,
    isSaved: false,
  }); // Nouvelle variable pour le cours ajouté
  const [courses, setCourses] = useState<Course[]>([
    {
      id: 1,
      title: 'Angular_Beginner',
      description: 'Learn the basics of Angular to create your first websites.',
      progress: 30,
      isSaved: false,
      imageUrl: '/angB.webp',
    },
    {
      id: 2,
      title: 'Angular_intermediate',
      description: 'A complete course on Angular to create modern and interactive web applications.',
      progress: 50,
      isSaved: false,
      imageUrl: '/angI.jpg',
    },
    {
      id: 3,
      title: 'Angular_advanced',
      description: 'Advanced techniques and best practices for developing professional Angular applications.',
      progress: 0,
      isSaved: true,
      imageUrl: '/angA.jpg',
    },
  ]);

  const toggleSave = (id: number) => {
    setCourses(
      courses.map((course) =>
        course.id === id ? { ...course, isSaved: !course.isSaved } : course
      )
    );
  };

  const handleDeleteCourse = (id: number) => {
    setCourses((prevCourses) => prevCourses.filter(course => course.id !== id));
  };

  const handleAddCourse = () => {
    const newId = courses.length + 1; // Crée un ID unique pour le nouveau cours
    setCourses([...courses, { ...newCourse, id: newId }]);
    setShowModal(false); // Ferme le modal après ajout
    setNewCourse({ id: 0, title: '', description: '', progress: 0, isSaved: false }); // Réinitialise les données du cours
  };

  const filteredCourses = activeTab === 'all' ? courses : courses.filter(course => course.isSaved);

  return (
    <div className="min-h-screen bg-white font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center space-x-1 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate({ to: '/courses' })}
              className="hover:bg-black hover:text-white w-8 h-8"
            >
              <i className="fas fa-chevron-left" />
            </Button>
            <h1 className="text-4xl font-bold mb-2">Angular</h1>
          </div>

          <div className="flex items-center justify-between mt-4">
            <p className="text-lg text-gray-700">
              Develop complete web applications with Angular framework.
            </p>
            
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="inline-flex p-1 bg-gray-100 rounded-3xl mb-6">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-1 text-sm font-medium rounded-3xl transition-colors duration-200 ${activeTab === 'all' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}`}
          >
            All courses
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`px-4 py-1 text-sm font-medium rounded-3xl transition-colors duration-200 ${activeTab === 'saved' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}`}
          >
            Saved courses ({courses.filter(c => c.isSaved).length})
          </button>
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div key={course.id} className="relative bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-lg hover:scale-110 transition-all duration-300">
              {/* Course Image and Options */}
              <div className="relative">
                {course.imageUrl ? (
                  <img src={course.imageUrl} alt={`${course.title} Image`} className="w-full h-48 object-cover" />
                ) : (
                  <img src="https://angular.io/assets/images/logos/angular/angular.svg" alt="Angular Logo" className="w-full h-48 object-cover" />
                )}

                {/* 3 dots menu */}
                <div className=" rounded-3xl absolute top-2 right-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="text-gray-500 hover:text-gray-900 p-2 rounded-full">
                        <MoreVertical size={20} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="rounded-3xl w-32">
  <DropdownMenuItem
    onClick={() => handleDeleteCourse(course.id)}
    className="rounded- text-red-600 focus:bg-white"
  >
    <Trash2 className="h-4 w-4 mr-2" />
    Supprimer
  </DropdownMenuItem>
</DropdownMenuContent>

                  </DropdownMenu>
                </div>
              </div>

              <div className="p-6">
                {/* Course Details */}
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{course.title}</h3>
                  <button
                    onClick={() => toggleSave(course.id)}
                    className="text-gray-500 hover:text-gray-900 transition-colors duration-200"
                    aria-label={course.isSaved ? "Remove from saved courses" : "Save course"}
                  >
                    {course.isSaved ? (
                      <BookmarkCheck size={20} className="text-gray-900" />
                    ) : (
                      <Bookmark size={20} />
                    )}
                  </button>
                </div>
                <p className="text-gray-600 text-sm mb-4">{course.description}</p>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Progression</span>
                    <span className="text-sm font-medium text-gray-900">{course.progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-300" style={{ width: `${course.progress}%` }} />
                  </div>
                </div>

                {/* Start/Continue Button */}
                <div className="mt-4 flex justify-end">
  <button
    onClick={() => {
      if (course.id === 1) navigate({ to: '/courses/angulardebutante' });
      else if (course.id === 2) navigate({ to: '/courses/angularintermediares' });
      else if (course.id === 3) navigate({ to: '/courses/angularadvanced' });
    }}
    className="py-2 px-4 bg-black border border-black rounded-3xl text-white font-medium hover:bg-gray-700 transition-colors duration-200"
    aria-label={course.progress === 0 ? `Start ${course.title} course` : `Continue ${course.title} course`}
  >
    {course.progress === 0 ? 'Start' : 'Continue'}
  </button>
</div>

              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Course Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-lg relative">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-black">
              ✖
            </button>
            <h2 className="text-xl font-semibold mb-4">Add a new course</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Course Title"
                className="w-full border p-2 rounded-3xl"
                value={newCourse.title}
                onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
              />
              <textarea
                placeholder="Course Description"
                className="w-full border p-2 rounded-3xl"
                value={newCourse.description}
                onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
              />
              <input
                type="number"
                placeholder="Progress (%)"
                className="w-full border p-2 rounded-3xl"
                value={newCourse.progress}
                onChange={(e) => setNewCourse({ ...newCourse, progress: parseInt(e.target.value) })}
              />
              <button
                onClick={handleAddCourse}
                className="w-full bg-black text-white py-2 rounded-3xl hover:bg-gray-800"
              >
                Add Course
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

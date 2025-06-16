import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from '@tanstack/react-router';
import { Bookmark, BookmarkCheck, Plus } from 'lucide-react';


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

  
}

export default function DevopsCourse() {
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const [newCourse, setNewCourse] = useState<Course>({
    id: 0, // Start with 0, will be updated after adding course
    title: '',
    description: '',
    progress: 0,
    isSaved: false,
    resources: [],
    imageUrl: '',

  });

  const [courses, setCourses] = useState<Course[]>([
    {
      id: 1,
      title: 'DevOps_Beginner',
      description: 'Learn the basics of DevOps practices to streamline development and operations.',
      progress: 30,
      isSaved: false,
      imageUrl: '/devB.png',
  
      resources: [
        { type: 'pdf', title: 'DevOps Basics', url: '/pdfs/devops-basics.pdf' },
        { type: 'link', title: 'DevOps Overview', url: 'https://www.atlassian.com/devops' },
      ],
    },
    {
      id: 2,
      title: 'DevOps_Intermediate',
      description: 'A comprehensive course on DevOps to automate deployment and improve collaboration between teams.',
      progress: 50,
      isSaved: false,
      imageUrl: '/devI.webp',
  
      resources: [
        { type: 'pdf', title: 'DevOps Intermediate Concepts', url: '/pdfs/devops-intermediate.pdf' },
        { type: 'link', title: 'DevOps Tutorial', url: 'https://www.redhat.com/en/topics/devops/what-is-devops' },
      ],
    },
    {
      id: 3,
      title: 'DevOps_Advanced',
      description: 'Master the advanced DevOps techniques and best practices for large-scale automation and infrastructure management.',
      progress: 0,
      isSaved: true,
      imageUrl: '/devA.jpeg',
  
      resources: [
        { type: 'pdf', title: 'Advanced DevOps Tips', url: '/pdfs/devops-advanced-tips.pdf' },
        { type: 'link', title: 'Best Practices for DevOps', url: 'https://www.devops.com' },
      ],
    },
  ]);
  
  const toggleSave = (id: number) => {
    setCourses(
      courses.map((course) =>
        course.id === id ? { ...course, isSaved: !course.isSaved } : course
      )
    );
  };

  const filteredCourses = activeTab === 'all' 
    ? courses 
    : courses.filter(course => course.isSaved);

  const handleAddCourse = () => {
    setCourses((prevCourses) => {
      const newId = prevCourses.length + 1;
      const newCourseWithId = { ...newCourse, id: newId };
      return [...prevCourses, newCourseWithId];
    });
    setShowModal(false);
    setNewCourse({
      id: 0,
      title: '',
      description: '',
      progress: 0,
      isSaved: false,
      resources: [],
      imageUrl: '',

    });
  };
  
  const handleDeleteCourse = (id: number) => {
    setCourses((prevCourses) => prevCourses.filter(course => course.id !== id));
  };
  
  
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
            <h1 className="text-4xl font-bold mb-2">DevOps</h1>
          </div>
  
          <div className="flex items-center justify-between mt-4">
            <p className="text-lg text-gray-700">
            Integrate development and operations for faster software delivery.            </p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-black text-white hover:bg-slate-700 px-4 py-1 rounded-3xl flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>
        </div>
  
        {/* Tab Navigation */}
        <div className="inline-flex p-1 bg-gray-100 rounded-3xl mb-6">
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
            Saved courses ({courses.filter(c => c.isSaved).length})
          </button>
        </div>
  
        {/* Course Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div key={course.id} className="relative bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="p-0 relative">
            {course.imageUrl ? (
  <img 
    src={course.imageUrl}
    alt={`${course.title} Image`}
    className="w-full h-48 object-cover"  // Fixe la hauteur à 48 unités, ajustez selon vos besoins
  />
) : (
  <img 
    src=""
    alt=""
    className="w-full h-48 object-cover"  // Fixe la hauteur à 48 unités ici aussi
  />
)}

              {/* 3 dots menu */}
              <div className="absolute top-2 right-2">
                <button
                  onClick={() =>
                    setOpenMenuId(openMenuId === course.id ? null : course.id)
                  }
                  className="text-white hover:text-gray-300"
                >
                  <i className="fas fa-ellipsis-h"></i>
                </button>
                {openMenuId === course.id && (
                  <div className="absolute right-0 mt-2 bg-white border rounded shadow-md z-10">
                    <button
                      onClick={() => {
                        handleDeleteCourse(course.id);
                        setOpenMenuId(null);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      Supprimer le cours
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="p-6">
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
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Progression</span>
                  <span className="text-sm font-medium text-gray-900">{course.progress}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${course.progress}%` }}
                  />
                </div>
              </div>
          
              
          
              {/* Start/Continue button */}
              <div className="mt-4">
                <button 
                  onClick={() => {
                    if (course.id === 1) navigate({ to: '/courses/devopsdebutante' });
                    else if (course.id === 2) navigate({ to: '/courses/devopsintermediares' });
                    else if (course.id === 3) navigate({ to: '/courses/devopsadvanced' });
                  }}
                  className="w-full py-2 px-4 bg-white border border-gray-300 rounded-3xl text-gray-700 font-medium hover:bg-gray-100 transition-colors duration-200"
                  aria-label={course.progress === 0 ? `Commencer ${course.title} course` : `Continuer ${course.title} course`}
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
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-black"
            >
              ✖
            </button>
            <h2 className="text-xl font-semibold mb-4">Add a new course</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Course Title"
                className="w-full border p-2 rounded"
                value={newCourse.title}
                onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
              />
              <textarea
                placeholder="Course Description"
                className="w-full border p-2 rounded"
                value={newCourse.description}
                onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
              />
              <input
                type="number"
                placeholder="Progress (%)"
                className="w-full border p-2 rounded"
                value={newCourse.progress}
                onChange={(e) => setNewCourse({ ...newCourse, progress: parseInt(e.target.value) })}
              />
              <input
                type="text"
                placeholder="Resource link (optional)"
                className="w-full border p-2 rounded"
                onChange={(e) =>
                  setNewCourse({
                    ...newCourse,
                    resources: [{ type: 'link', title: 'Custom Resource', url: e.target.value }],
                  })
                }
              />
              <input
                type="text"
                placeholder="PDF Link (optional)"
                className="w-full border p-2 rounded"
                onChange={(e) =>
                  setNewCourse({
                    ...newCourse,
                    resources: [{ type: 'pdf', title: 'Custom PDF', url: e.target.value }],
                  })
                }
              />
              <button
                onClick={handleAddCourse}
                className="w-full bg-black text-white py-2 rounded-xl hover:bg-gray-800"
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
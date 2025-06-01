import { useState, useEffect, useMemo } from 'react';
import {
  IconPlus,
  IconLink,
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconUserPlus,
  IconBookmark,
  IconBookmarkOff,

} from '@tabler/icons-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Header } from '@/components/layout/header';
import { Main } from '@/components/layout/main';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { Searchh } from '@/components/searchh';
import { ThemeSwitch } from '@/components/theme-switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/stores/authStore';
import { Textarea } from '@/components/ui/textarea';
import {
  IconBrandReact,
  IconBrandNodejs,
  IconBrandAngular,
  IconBrandHtml5,
  IconBrandPython,
  IconBrandVue,
  IconBrandKotlin,
  IconBrandLaravel,
  IconClipboardList,
  IconLayoutKanban,
  IconLeaf,
  IconUsers,
  IconShield,
  IconBrandTypescript,
  IconBrandMongodb ,IconBrandRedux ,
  IconBrandFlutter ,IconBrandDjango,
  IconBrandGit,IconBrandSvelte ,
  IconBrandFigma ,IconBrandNextjs ,
  IconBrandSwift ,IconBrandTailwind ,
  IconBrandJavascript,
  IconRocket ,
  IconChartArcs,
  IconBrandDocker,
  IconStairsUp,
} from '@tabler/icons-react';
import toast, { Toaster } from 'react-hot-toast';
import { Link } from '@tanstack/react-router';
import Cookies from 'js-cookie';

type UserRole = 'manager' | 'admin' | 'collaborator';

interface User {
  _id: string;
  name?: string;
  email?: string;
}

interface Course {
  _id: string;
  name: string;
  logo: string;
  completed: boolean;
  desc: string;
  category: 'technology' | 'methodology';
  saved: boolean;
  assignedTo?: User[];
  assignedBy?: User;
}

const appText = new Map<string, string>([
  ['all', 'All'],
  ['completed', 'Completed'],
  ['notCompleted', 'Not Completed'],
  ['methodology', 'Methodology'],
  ['technology', 'Technology'],
  ['saved', 'Courses'],
  ['courseContent', 'Recommended Courses'],
]);

export default function Courses() {
  const {
    accessToken,
    refreshToken,
    setAccessToken,
    setRefreshToken,
    setUser,
    reset,
  } = useAuth();
  const [userRole, setUserRole] = useState<UserRole>('collaborator');
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [appType, setAppType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [savedFilter, setSavedFilter] = useState(false);
  const [recommendedFilter, setRecommendedFilter] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [logoSource, setLogoSource] = useState<'icon' | 'url'>('icon');
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);
  const [assignTo, setAssignTo] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [showNotification, setShowNotification] = useState(
    !localStorage.getItem('hasSeenRecommended')
  );

  const [newCourse, setNewCourse] = useState({
    name: '',
    desc: '',
    logo: '',
    logoUrl: '',
    color: '',
    category: 'technology' as 'technology' | 'methodology',
    completed: false,
    saved: false,
  });

  const [editCourse, setEditCourse] = useState({
    _id: '',
    name: '',
    desc: '',
    logo: '',
    logoUrl: '',
    color: '',
    category: 'technology' as 'technology' | 'methodology',
    completed: false,
    saved: false,
  });

  const filteredApps = useMemo(() => {
    return courses.filter((app) => {
      const matchesType = appType === 'completed' ? app.completed : appType === 'notCompleted' ? !app.completed : true;
      const matchesCategory = app.category === categoryFilter || categoryFilter === 'all';
      const matchesSearch = app.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSaved = savedFilter ? app.saved : true;
      const matchesRecommended = recommendedFilter
        ? (userRole === 'manager' || userRole === 'admin')
          ? app.assignedBy?._id === currentUserId
          : (app.assignedTo || []).some((user) => user._id === currentUserId || user.email === currentUserEmail)
        : true;
      console.log(`Filtering course ${app.name}:`, {
        matchesType,
        matchesCategory,
        matchesSearch,
        matchesSaved,
        matchesRecommended,
        assignedBy: app.assignedBy,
        currentUserId,
      });
      return matchesType && matchesCategory && matchesSearch && matchesSaved && matchesRecommended;
    });
  }, [
    courses,
    appType,
    categoryFilter,
    searchTerm,
    savedFilter,
    recommendedFilter,
    currentUserId,
    currentUserEmail,
    userRole,
  ]);

  const assignedCoursesCount = useMemo(() => {
    const count = courses.filter((course) => {
      if (userRole === 'manager' || userRole === 'admin') {
        return course.assignedBy?._id === currentUserId;
      }
      return (course.assignedTo || []).some((user) => user._id === currentUserId || user.email === currentUserEmail);
    }).length;
    console.log('Assigned Courses Count:', count);
    return count;
  }, [courses, currentUserId, currentUserEmail, userRole]);

  const toggleComplete = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/courses/${id}/toggle-completed`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken || Cookies.get('access_token')}`,
        },
        body: JSON.stringify({ completed: !courses.find(c => c._id === id)?.completed }),
      });

      if (!response.ok) throw new Error(`Failed to update completed status: ${response.statusText}`);

      const updatedCourse = await response.json();
      setCourses((prev) =>
        prev.map((course) => (course._id === id ? { ...course, completed: updatedCourse.course.completed } : course))
      );
      toast.success(updatedCourse.course.completed ? 'Course marked as completed' : 'Course marked as not completed');
    } catch (error) {
      console.error('Error toggling completed status:', error);
      toast.error('Error updating status');
    }
  };

  const toggleSaved = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/courses/${id}/toggle-saved`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken || Cookies.get('access_token')}`,
        },
        body: JSON.stringify({ saved: !courses.find(c => c._id === id)?.saved }),
      });

      if (!response.ok) throw new Error(`Failed to update saved status: ${response.statusText}`);

      const updatedCourse = await response.json();
      setCourses((prev) =>
        prev.map((course) => (course._id === id ? { ...course, saved: updatedCourse.course.saved } : course))
      );
      toast.success(updatedCourse.course.saved ? 'Course saved' : 'Course removed from favorites');
    } catch (error) {
      console.error('Error toggling saved status:', error);
      toast.error('Error updating status');
    }
  };

  const getIconComponent = (iconName: string) => {
    if (iconName.startsWith('http://') || iconName.startsWith('https://')) {
      return <img src={iconName} alt="Course logo" className="w-6 h-6 object-contain" />;
    }
    const key = iconName.trim().toLowerCase();
    switch (key) {
  // Technologies
  case 'react':
    return <IconBrandReact size={24} color="#61DAFB" />;
  case 'node':
    return <IconBrandNodejs size={24} color="#339933" />;
  case 'angular':
    return <IconBrandAngular size={24} color="#DD0031" />;
  case 'htmlcss':
    return <IconBrandHtml5 size={24} color="#E34F26" />;
  case 'python':
    return <IconBrandPython size={24} color="#3776AB" />;
  case 'vue':
    return <IconBrandVue size={24} color="#4FC08D" />;
  case 'kotlin':
    return <IconBrandKotlin size={24} color="#7F52FF" />;
  case 'laravel':
    return <IconBrandLaravel size={24} color="#FF2D20" />;
  case 'javascript':
    return <IconBrandJavascript size={24} color="#F7DF1E" />;
  case 'typescript':
    return <IconBrandTypescript size={24} color="#3178C6" />;
  case 'docker':
    return <IconBrandDocker size={24} color="#2496ED" />;
  case 'mongodb':
    return <IconBrandMongodb size={24} color="#47A248" />;
  case 'redux':
    return <IconBrandRedux size={24} color="#764ABC" />;
  case 'flutter':
    return <IconBrandFlutter size={24} color="#02569B" />;
  case 'django':
    return <IconBrandDjango size={24} color="#092E20" />;
  case 'git':
    return <IconBrandGit size={24} color="#F05032" />;
  case 'svelte':
    return <IconBrandSvelte size={24} color="#FF3E00" />;
  case 'figma':
    return <IconBrandFigma size={24} color="#F24E1E" />;
  case 'nextjs':
    return <IconBrandNextjs size={24} color="#000000" />;
  case 'swift':
    return <IconBrandSwift size={24} color="#F05138" />;
  case 'tailwind':
    return <IconBrandTailwind size={24} color="#38B2AC" />;
  // Methodologies
  case 'scrum':
    return <IconClipboardList size={24} color="#87C53B" />;
  case 'kanban':
    return <IconLayoutKanban size={24} color="#0052CC" />;
  case 'lean':
    return <IconLeaf size={24} color="#00B140" />;
  case 'safe':
    return <IconShield size={24} color="#FF7900" />;
  case 'agile':
    return <IconRocket size={24} color="#F28C38" />;
  case 'devops':
    return <IconClipboardList size={24} color="#0E76A8" />;
  case 'waterfall':
    return <IconStairsUp size={24} color="#1E88E5" />;
  case 'cyclev':
    return <IconChartArcs size={24} color="#6A1B9A" />;
  case 'xp':
    return <IconUsers size={24} color="#FBC02D" />; // Extreme Programming

  

  default:
    return <IconBrandHtml5 size={24} color="#FF7900" />;
}
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewCourse((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditCourse((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddCourse = async () => {
    try {
      const courseData = {
        ...newCourse,
        logo: logoSource === 'icon' ? newCourse.logo : newCourse.logoUrl,
      };
      const response = await fetch('http://localhost:5000/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken || Cookies.get('access_token')}`,
        },
        body: JSON.stringify(courseData),
      });

      if (!response.ok) throw new Error('Failed to add course');

      const addedCourse: Course = await response.json();
      setCourses((prev) => [...prev, addedCourse]);
      setNewCourse({
        name: '',
        desc: '',
        logo: '',
        logoUrl: '',
        color: '',
        category: 'technology',
        completed: false,
        saved: false,
      });
      setIsDialogOpen(false);
      toast.success('Course added');
    } catch (err: any) {
      setError(err.message);
      toast.error('Error adding course');
    }
  };

  const handleDeleteCourse = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/courses/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken || Cookies.get('access_token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete course');

      setCourses((prev) => prev.filter((course) => course._id !== id));
      toast.success('Course deleted');
    } catch (err: any) {
      setError(err.message);
      toast.error('Error deleting course');
    }
  };

  const handleEditCourse = async () => {
    try {
      const courseData = {
        ...editCourse,
        logo: logoSource === 'icon' ? editCourse.logo : editCourse.logoUrl,
      };

      const response = await fetch(`http://localhost:5000/api/courses/${editCourse._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken || Cookies.get('access_token')}`,
        },
        body: JSON.stringify(courseData),
      });

      if (!response.ok) throw new Error('Failed to update course');

      const updatedCourse: Course = await response.json();
      setCourses((prev) =>
        prev.map((course) => (course._id === updatedCourse._id ? updatedCourse : course))
      );
      setIsEditDialogOpen(false);
      toast.success('Course updated');
    } catch (err: any) {
      setError(err.message);
      toast.error('Error updating course');
    }
  };
const handleAssignCourse = async () => {
  try {
    setIsAssigning(true); // Ensure `isAssigning` state is defined
    if (!currentCourse || !currentCourse._id || !assignTo) {
      console.error('Invalid course or email:', { currentCourse, assignTo });
      toast.error('Veuillez sélectionner un cours valide et un email');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(assignTo)) {
      toast.error('Veuillez entrer un email valide');
      return;
    }

    // Validate courseId format (24-character hex string)
    if (!/^[0-9a-fA-F]{24}$/.test(currentCourse._id)) {
      console.error('Invalid course ID format:', currentCourse._id);
      toast.error('Identifiant de cours invalide');
      return;
    }

    const assignUrl = `http://localhost:5000/api/courses/${currentCourse._id}/assign`;
    console.log('Sending assignment request:', { url: assignUrl, assignTo, courseName: currentCourse.name });

    const response = await fetch(assignUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken || Cookies.get('access_token')}`,
      },
      body: JSON.stringify({ assignTo }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Assignment failed:', { status: response.status, message: data.message });
      throw new Error(data.message || 'Échec de l’assignation du cours');
    }

    // Refresh courses
    const updatedCoursesResponse = await fetch('http://localhost:5000/api/courses', {
      headers: {
        'Authorization': `Bearer ${accessToken || Cookies.get('access_token')}`,
      },
    });
    if (!updatedCoursesResponse.ok) {
      throw new Error('Échec de la récupération des cours');
    }
    const updatedCourses: Course[] = await updatedCoursesResponse.json();
    console.log('Updated Courses:', updatedCourses.map((c: Course) => ({
      _id: c._id,
      name: c.name,
      assignedTo: c.assignedTo?.map(u => ({ _id: u._id, email: u.email })),
      assignedBy: c.assignedBy ? { _id: c.assignedBy._id, email: c.assignedBy.email } : null,
    })));
    setCourses(updatedCourses);

    localStorage.removeItem('hasSeenRecommended');
    setShowNotification(true);
    toast.success(data.message || 'Cours assigné avec succès');
    setIsAssignDialogOpen(false);
    setAssignTo('');
    setCurrentCourse(null);
  } catch (err: any) {
    console.error('Erreur lors de l’assignation du cours:', {
      message: err.message,
      stack: err.stack,
      courseId: currentCourse?._id,
      assignTo,
    });
    toast.error(err.message || 'Erreur lors de l’assignation du cours');
  } finally {
    setIsAssigning(false);
  }
};

  const openEditDialog = (course: Course) => {
    setEditCourse({
      _id: course._id,
      name: course.name,
      desc: course.desc,
      logo: course.logo,
      logoUrl: course.logo.startsWith('http://') || course.logo.startsWith('https://') ? course.logo : '',
      color: '',
      category: course.category,
      completed: course.completed,
      saved: course.saved,
    });
    setLogoSource(course.logo.startsWith('http://') || course.logo.startsWith('https://') ? 'url' : 'icon');
    setIsEditDialogOpen(true);
  };

  const openAssignDialog = (course: Course) => {
  if (!course || !course._id || !/^[0-9a-fA-F]{24}$/.test(course._id)) {
    console.error('Invalid course selected for assignment:', course);
    toast.error('Cours invalide sélectionné');
    return;
  }
  console.log('Opening assign dialog for course:', { _id: course._id, name: course.name });
  setCurrentCourse(course);
  setAssignTo('');
  setIsAssignDialogOpen(true);
};
  const canManageCourses = () => {
    return userRole === 'manager' || userRole === 'admin';
  };

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/courses', {
          headers: {
            'Authorization': `Bearer ${accessToken || Cookies.get('access_token')}`,
          },
        });
        if (!response.ok) throw new Error('Failed to fetch courses');
        const data: Course[] = await response.json();
        console.log('Fetched Courses:', data);
        setCourses(data);
        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
        toast.error('Error fetching courses');
      }
    };

    const fetchUserRole = async () => {
      try {
        let token = accessToken || Cookies.get('access_token');
        if (!token) {
          toast.error('Veuillez vous connecter');
          reset();
          window.location.href = '/sign-in-2';
          return;
        }

        let response = await fetch('http://localhost:5000/api/auth/me', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.status === 401) {
          const refreshResponse = await fetch('http://localhost:5000/api/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });
          const refreshData = await refreshResponse.json();
          if (refreshResponse.ok && refreshData.token) {
            setAccessToken(refreshData.token);
            if (refreshData.refreshToken) setRefreshToken(refreshData.refreshToken);
            token = refreshData.token;
            response = await fetch('http://localhost:5000/api/auth/me', {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });
          } else {
            toast.error('Impossible de rafraîchir la session. Veuillez vous reconnecter.');
            reset();
            window.location.href = '/sign-in-2';
            return;
          }
        }

        if (!response.ok) {
          const errorData = await response.json();
          if (response.status === 403) {
            toast.error(`Accès refusé : ${errorData.message || 'Rôle non autorisé.'}`);
            return;
          }
          throw new Error(errorData.message || 'Erreur lors de la récupération du rôle');
        }

        const data = await response.json();
        console.log('User Data:', data);
        setUserRole(data.data.role);
        setCurrentUserId(data.data._id);
        setCurrentUserEmail(data.data.email);
        setUser({
          _id: data.data._id,
          name: data.data.name,
          email: data.data.email,
          role: data.data.role,
        });
      } catch (err: any) {
        console.error('Erreur:', err.message);
        toast.error('Erreur lors de la récupération du rôle');
      }
    };

    fetchCourses();
    fetchUserRole();
  }, [accessToken, refreshToken, setAccessToken, setRefreshToken, setUser, reset]);

  if (loading) return <p className="text-center mt-10">Loading courses...</p>;
  if (error) return <p className="text-center mt-10 text-red-500">{error}</p>;

  return (
    <>
      <Header>
        <Searchh />
        <div className="rounded-3xl ml-auto flex items-center gap-4">
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Courses</h1>
            <p className="text-muted-foreground">Here's a list of your courses!</p>
          </div>
          {canManageCourses() && !recommendedFilter && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-3xl bg-black hover:bg-gray-500 text-white">
                  <IconPlus size={18} className="mr-2" /> Add Course
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Course</DialogTitle>
                  <DialogDescription>
                    Fill in the details to add a new course to your collection.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name
                    </Label>
                    <div className="col-span-3">
                      <Input
                        id="name"
                        name="name"
                        value={newCourse.name}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="category" className="text-right">
                      Category
                    </Label>
                    <div className="col-span-3">
                      <Select
                        value={newCourse.category}
                        onValueChange={(value) =>
                          setNewCourse((prev) => ({ ...prev, category: value as 'technology' | 'methodology' }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="technology">Technology</SelectItem>
                          <SelectItem value="methodology">Methodology</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label className="text-right pt-2">Logo</Label>
                    <div className="col-span-3">
                      <Tabs
                        value={logoSource}
                        onValueChange={(val) => setLogoSource(val as 'icon' | 'url')}
                      >
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="icon" className="flex items-center">
                            <IconBrandHtml5 size={16} className="mr-2" />
                            Icon
                          </TabsTrigger>
                          <TabsTrigger value="url" className="flex items-center">
                            <IconLink size={16} className="mr-2" />
                            URL
                          </TabsTrigger>
                        </TabsList>
                        <TabsContent value="icon" className="mt-2">
                          <Select
                            value={newCourse.logo}
                            onValueChange={(value) =>
                              setNewCourse((prev) => ({ ...prev, logo: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select an icon" />
                            </SelectTrigger>
                           <SelectContent>
  <SelectItem value="react">React</SelectItem>
  <SelectItem value="vue">Vue</SelectItem>
  <SelectItem value="angular">Angular</SelectItem>
  <SelectItem value="node">Node.js</SelectItem>
  <SelectItem value="python">Python</SelectItem>
  <SelectItem value="javascript">JavaScript</SelectItem>
  <SelectItem value="htmlcss">HTML/CSS</SelectItem>
  <SelectItem value="kotlin">Kotlin</SelectItem>
  <SelectItem value="laravel">Laravel</SelectItem>
  <SelectItem value="typescript">TypeScript</SelectItem>
  <SelectItem value="docker">Docker</SelectItem>
  <SelectItem value="mongodb">MongoDB</SelectItem>
  <SelectItem value="redux">Redux</SelectItem>
  <SelectItem value="flutter">Flutter</SelectItem>
  <SelectItem value="django">Django</SelectItem>
  <SelectItem value="git">Git</SelectItem>
  <SelectItem value="svelte">Svelte</SelectItem>
  <SelectItem value="figma">Figma</SelectItem>
  <SelectItem value="nextjs">Next.js</SelectItem>
  <SelectItem value="swift">Swift</SelectItem>
  <SelectItem value="tailwind">Tailwind CSS</SelectItem>
  <SelectItem value="scrum">Scrum</SelectItem>
  <SelectItem value="kanban">Kanban</SelectItem>
  <SelectItem value="lean">Lean</SelectItem>
  <SelectItem value="safe">SAFe</SelectItem>
  <SelectItem value="cyclev">V Cycle</SelectItem>
  <SelectItem value="waterfall">Waterfall</SelectItem>
  <SelectItem value="devops">DevOps</SelectItem>
  <SelectItem value="agile">Agile</SelectItem>
  <SelectItem value="xp">Extreme Programming</SelectItem>
</SelectContent>
                          </Select>
                        </TabsContent>
                        <TabsContent value="url" className="mt-2">
                          <Input
                            id="logoUrl"
                            name="logoUrl"
                            placeholder="https://example.com/logo.png"
                            value={newCourse.logoUrl}
                            onChange={handleInputChange}
                          />
                          {newCourse.logoUrl && (
                            <div className="mt-2 flex justify-center">
                              <img
                                src={newCourse.logoUrl}
                                alt="Logo preview"
                                className="max-h-16 object-contain"
                                onError={(e) => {
                                  e.currentTarget.src = 'https://placehold.co/100x100?text=Error';
                                  toast.error('Error loading logo');
                                }}
                              />
                            </div>
                          )}
                        </TabsContent>
                      </Tabs>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="desc" className="text-right pt-2">
                      Description
                    </Label>
                    <div className="col-span-3">
                      <Textarea
                        id="desc"
                        name="desc"
                        value={newCourse.desc}
                        onChange={handleInputChange}
                        rows={4}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" onClick={handleAddCourse}>
                    Add Course
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="my-4 flex items-end justify-between sm:items-center">
          <div className="flex flex-col gap-4 sm:flex-row">
            <Input
              placeholder="Search courses..."
              className="rounded-3xl h-9 w-40 lg:w-[250px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Select value={appType} onValueChange={setAppType}>
              <SelectTrigger className="rounded-3xl px-4 py-2 bg-[#1a1a1a] text-white hover:bg-white hover:text-black">
                <SelectValue>{appText.get(appType)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="notCompleted">Not Completed</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => {
                setCategoryFilter(categoryFilter === 'methodology' ? 'all' : 'methodology');
                setSavedFilter(false);
                setRecommendedFilter(false);
                setActiveFilter(categoryFilter === 'methodology' ? 'all' : 'methodology');
              }}
              className={`px-5 py-1 rounded-3xl ${
                activeFilter === 'methodology' ? 'bg-black text-white' : 'bg-white text-black'
              } hover:bg-black hover:text-white border`}
            >
              Methodology
            </Button>
            <Button
              onClick={() => {
                setCategoryFilter(categoryFilter === 'technology' ? 'all' : 'technology');
                setSavedFilter(false);
                setRecommendedFilter(false);
                setActiveFilter(categoryFilter === 'technology' ? 'all' : 'technology');
              }}
              className={`px-5 py-1 rounded-3xl ${
                activeFilter === 'technology' ? 'bg-black text-white' : 'bg-white text-black'
              } hover:bg-black hover:text-white border`}
            >
              Technology
            </Button>
            <Button
              onClick={() => {
                setCategoryFilter('all');
                setSavedFilter(!savedFilter);
                setRecommendedFilter(false);
                setActiveFilter(savedFilter ? 'all' : 'saved');
              }}
              className={`px-5 py-1 rounded-3xl ${
                activeFilter === 'saved' ? 'bg-black text-white' : 'bg-white text-black'
              } hover:bg-black hover:text-white border`}
            >
              Saved Courses
            </Button>
            
           {userRole === 'collaborator' && (
  <Button
    onClick={() => {
      setRecommendedFilter(!recommendedFilter);
      setActiveFilter(!recommendedFilter ? 'recommended' : 'all');
      setCategoryFilter('all');
      setSavedFilter(false);
      setShowNotification(false);
      localStorage.setItem('hasSeenRecommended', 'true');
    }}
    className={`relative px-5 py-1 rounded-3xl ${
      activeFilter === 'recommended' ? 'bg-black text-white' : 'bg-white text-black'
    } hover:bg-black hover:text-white border`}
  >
    Recommended Courses
    {showNotification && assignedCoursesCount > 0 && (
      <span className="absolute top-0 right-0 -mt-1 -mr-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
        {assignedCoursesCount}
      </span>
    )}
  </Button>
)}
          </div>
        </div>

        <Separator className="shadow" />

        <ul className="no-scrollbar faded-bottom grid gap-4 overflow-auto rounded-3xl pb-16 pt-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredApps.length === 0 ? (
            <li className="col-span-full text-center text-gray-500">
              {recommendedFilter && (userRole === 'manager' || userRole === 'admin')
                ? 'No courses assigned by you.'
                : 'No courses found.'}
              {canManageCourses() && !recommendedFilter && (
                <Button onClick={() => setIsDialogOpen(true)}>Add a course</Button>
              )}
            </li>
          ) : (
            filteredApps.map((app) => {
              const assignedUserNames = (app.assignedTo || [])
                .map((user) => user.name || user.email || 'Unknown User')
                .join(', ') || 'No users assigned';

              return (
                <li
                  key={app._id}
                  className="group relative cursor-pointer rounded-3xl border p-4 transition-transform duration-200 hover:scale-105 hover:shadow-md"
                >
                  <Link to={`/courses/${app._id}`} className="block">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex size-10 items-center justify-center rounded-3xl bg-muted p-2">
                        {getIconComponent(app.logo)}
                      </div>
                    </div>
                    <h2 className="mb-1 font-semibold">{app.name}</h2>
                    <p className="line-clamp-2 text-gray-500">{app.desc}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="inline-block rounded-3xl bg-gray-200 px-2 py-1 text-xs dark:bg-gray-800">
                        {app.category}
                      </span>
                      {currentUserId && app.assignedTo?.some((user) => user._id === currentUserId) && (
                        <span className="inline-block rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                          Assigned to You
                        </span>
                      )}
                      {canManageCourses() && recommendedFilter && (
                        <span className="inline-block rounded-full bg-yellow-100 px-2 py-1 text-xs text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100">
                          Assigned to: {assignedUserNames}
                        </span>
                      )}
                    </div>
                  </Link>
                  <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        toggleComplete(app._id);
                      }}
                      className={`rounded-3xl ${app.completed ? 'border-blue-300 bg-blue-50' : ''}`}
                      aria-label={app.completed ? 'Mark as not completed' : 'Mark as completed'}
                    >
                      {app.completed ? 'Completed' : 'Mark as Completed'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleSaved(app._id);
                      }}
                      aria-label={app.saved ? 'Remove from favorites' : 'Add to favorites'}
                      className={`h-8 w-8 rounded-full p-0 ${app.saved ? 'border-gray-300 bg-green-50' : 'bg-white/80'}`}
                    >
                      {app.saved ? <IconBookmark size={16} className="fill-current" /> : <IconBookmarkOff size={16} />}
                    </Button>
                    {canManageCourses() && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 rounded-full bg-white/80 p-0"
                            aria-label="More options"
                          >
                            <IconDotsVertical size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(app)}>
                            <IconEdit size={16} className="mr-2" />
                            Edit Course
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteCourse(app._id)} className="text-red-500">
                            <IconTrash size={16} className="mr-2" />
                            Delete Course
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openAssignDialog(app)}>
                            <IconUserPlus size={16} className="mr-2" />
                            Assign Course
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </Main>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
            <DialogDescription>Modify the details of the selected course.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Name
              </Label>
              <div className="col-span-3">
                <Input
                  id="edit-name"
                  name="name"
                  value={editCourse.name}
                  onChange={handleEditInputChange}
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-category" className="text-right">
                Category
              </Label>
              <div className="col-span-3">
                <Select
                  value={editCourse.category}
                  onValueChange={(value) =>
                    setEditCourse((prev) => ({ ...prev, category: value as 'technology' | 'methodology' }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="methodology">Methodology</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">Logo</Label>
              <div className="col-span-3">
                <Tabs
                  value={logoSource}
                  onValueChange={(val) => setLogoSource(val as 'icon' | 'url')}
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="icon" className="flex items-center">
                      <IconBrandHtml5 size={16} />
                      Icon
                    </TabsTrigger>
                    <TabsTrigger value="url" className="flex items-center">
                      <IconLink size={16} className="mr-2" />
                      URL
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="icon" className="mt-2">
                    <Select
                      value={editCourse.logo}
                      onValueChange={(value) =>
                        setEditCourse((prev) => ({ ...prev, logo: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an icon" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="react">React</SelectItem>
                        <SelectItem value="vue">Vue</SelectItem>
                        <SelectItem value="angular">Angular</SelectItem>
                        <SelectItem value="node">Node.js</SelectItem>
                        <SelectItem value="python">Python</SelectItem>
                        <SelectItem value="javascript">JavaScript</SelectItem>
                        <SelectItem value="htmlcss">HTML/CSS</SelectItem>
                        <SelectItem value="kotlin">Kotlin</SelectItem>
                        <SelectItem value="laravel">Laravel</SelectItem>
                        <SelectItem value="scrum">Scrum</SelectItem>
                        <SelectItem value="kanban">Kanban</SelectItem>
                        <SelectItem value="lean">Lean</SelectItem>
                        <SelectItem value="safe">SAFe</SelectItem>
                        <SelectItem value="cyclev">V Cycle</SelectItem>
                        <SelectItem value="waterfall">Waterfall</SelectItem>
                        <SelectItem value="devops">DevOps</SelectItem>
                      </SelectContent>
                    </Select>
                  </TabsContent>
                  <TabsContent value="url" className="mt-2">
                    <Input
                      id="edit-logoUrl"
                      name="logoUrl"
                      placeholder="https://example.com/logo.png"
                      value={editCourse.logoUrl}
                      onChange={handleEditInputChange}
                    />
                    {editCourse.logoUrl && (
                      <div className="mt-2 flex justify-center">
                        <img
                          src={editCourse.logoUrl}
                          alt="Logo preview"
                          className="max-h-16 object-contain"
                          onError={(e) => {
                            e.currentTarget.src = 'https://placehold.co/100x100?text=Error';
                            toast.error('Error loading logo');
                          }}
                        />
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="edit-desc" className="text-right">
                Description
              </Label>
              <div className="col-span-3">
                <Textarea
                  id="edit-desc"
                  name="desc"
                  value={editCourse.desc}
                  onChange={handleEditInputChange}
                  rows={4}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleEditCourse}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Assign Course</DialogTitle>
            <DialogDescription>Assign this course to a user by entering their email address.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="assignTo" className="text-right">
                Email
              </Label>
              <div className="col-span-3">
                <Input
                  id="assignTo"
                  type="email"
                  value={assignTo}
                  onChange={(e) => setAssignTo(e.target.value)}
                  placeholder="Enter user email (e.g., user@example.com)"
                  required
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleAssignCourse}
              disabled={isAssigning || !assignTo.trim()}
            >
              {isAssigning ? 'Assigning...' : 'Assign Course'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </>
  );
}
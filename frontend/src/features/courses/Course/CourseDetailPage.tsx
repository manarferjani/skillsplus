"use client";

import type React from "react";
import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { Header } from "@/components/layout/header";
import { Searchh } from "@/components/searchh";
import { ThemeSwitch } from "@/components/theme-switch";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Link } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconUserPlus,
  IconChevronLeft,
  IconPlus,
  IconBookmark,
  IconStar,
} from "@tabler/icons-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Cookies from "js-cookie";
import { useAuth } from "@/stores/authStore";


interface ApiError {
  message: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
}

interface Support {
  _id: string;
  name: string;
  description: string;
  type: "video" | "pdf" | "link";
  imageUrl: string;
  url: string;
  isSaved: boolean;
  isViewed: boolean;
}

interface Level {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  isSaved: boolean;
  supports: Support[];
  difficultyLevel?: string;
  assignedTo?: string[];
}

interface Course {
  name: string;
  logo: string;
  color: string;
  completed: boolean;
  desc: string;
  levels: Level[];
}

interface CourseDetailPageProps {
  courseId: string;
}

export default function CourseDetailPage({ courseId }: CourseDetailPageProps) {
  const [course, setCourse] = useState<Course | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { setAccessToken, setRefreshToken, setUser, reset } = useAuth();
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isUnassignModalOpen, setIsUnassignModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userRole, setUserRole] = useState<"collaborator" | "manager" | "admin">("collaborator");
  const [editLevel, setEditLevel] = useState<Level | null>(null);
  const [assignTo, setAssignTo] = useState("");
  const [levelToUnassign, setLevelToUnassign] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [, setUsers] = useState<User[]>([]);
  const [, setIsLoadingUsers] = useState(true);
  const [showNotification, setShowNotification] = useState(
    !localStorage.getItem("hasSeenRecommendedLevels")
  );
  const navigate = useNavigate();

  const [newLevel, setNewLevel] = useState({
    title: "",
    description: "",
    difficultyLevel: "",
    imageUrl: "",
  });

  const [savedLevels, setSavedLevels] = useState<string[]>([]);
  const [showSavedLevels, setShowSavedLevels] = useState(false);
  const [showRecommendedLevels, setShowRecommendedLevels] = useState(false);

  // Calculate recommended levels count for notification badge
  const recommendedLevels = useMemo(() => {
  return (
    course?.levels.filter(
      (level) =>
        (currentUserId || currentUserEmail) &&
        (level.assignedTo || []).some(
          (userId) => userId === currentUserId || userId === currentUserEmail
        )
    ) || []
  );
}, [course, currentUserId, currentUserEmail]);

  const recommendedLevelsCount = useMemo(() => recommendedLevels.length, [recommendedLevels]);

  // Fetch course data
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/courses/${courseId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken") || Cookies.get("access_token")}`,
          },
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch course: ${response.status}`);
        }
        const data = await response.json();
        const normalizedData = {
          ...data,
          levels: data.levels.map((level: Level) => ({
            ...level,
            supports: Array.isArray(level.supports) ? level.supports : [],
            assignedTo: Array.isArray(level.assignedTo) ? level.assignedTo : [],
          })),
        };
        setCourse(normalizedData);
        setSavedLevels(normalizedData.levels.filter((level: Level) => level.isSaved).map((level: Level) => level._id));
      } catch (error) {
        console.error("Error fetching course:", error);
        toast.error("Failed to load course data");
      }
    };

    fetchCourse();
  }, [courseId]);

  // Fetch users for assignment (optional, kept for compatibility)
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoadingUsers(true);
        const response = await fetch("http://localhost:5000/api/users/getallUsers", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken") || Cookies.get("access_token")}`,
          },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }
        const result = await response.json();
        if (!result.success) {
          throw new Error(result.message || "Error fetching users");
        }
        setUsers(
          result.data.map((user: any) => ({
            _id: user._id,
            name: user.name,
            email: user.email,
          }))
        );
      } catch (error) {
        console.error("Error fetching users:", error);
        toast.error("Failed to load users");
      } finally {
        setIsLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  // Fetch user role and details
  const fetchUserRole = async () => {
    try {
      let token = localStorage.getItem("authToken") || Cookies.get("access_token");
      if (!token) {
        toast.error("Veuillez vous connecter");
        reset();
        navigate({ to: "/sign-in-2" });
        return;
      }

      let response = await fetch("http://localhost:5000/api/auth/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        const refreshResponse = await fetch("http://localhost:5000/api/auth/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            refreshToken: Cookies.get("refresh_token") || localStorage.getItem("refreshToken"),
          }),
        });
        const refreshData = await refreshResponse.json();
        if (refreshResponse.ok && refreshData.token) {
          setAccessToken(refreshData.token);
          localStorage.setItem("authToken", refreshData.token);
          if (refreshData.refreshToken) {
            setRefreshToken(refreshData.refreshToken);
            Cookies.set("refresh_token", refreshData.refreshToken);
          }
          token = refreshData.token;
          response = await fetch("http://localhost:5000/api/auth/me", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
        } else {
          toast.error("Impossible de rafraîchir la session. Veuillez vous reconnecter.");
          reset();
          navigate({ to: "/sign-in-2" });
          return;
        }
      }

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 403) {
          toast.error(`Accès refusé : ${errorData.message || "Rôle non autorisé."}`);
          return;
        }
        throw new Error(errorData.message || "Erreur lors de la récupération du rôle");
      }

      const data = await response.json();
      console.log("User Data:", data);
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
      console.error("Erreur:", err.message);
      toast.error("Erreur lors de la récupération du rôle");
    }
  };

  useEffect(() => {
    fetchUserRole();
  }, [setAccessToken, setRefreshToken, setUser, reset, navigate]);

  
  // Handle input changes for forms
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    setState: React.Dispatch<React.SetStateAction<any>>
  ) => {
    const { name, value } = e.target;
    setState((prev: any) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle select changes for difficulty level
  const handleSelectChange = (value: string, setState: React.Dispatch<React.SetStateAction<any>>) => {
    setState((prev: any) => ({
      ...prev,
      difficultyLevel: value,
    }));
  };

  // Add new level
  const handleAddSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const levelData = {
        ...newLevel,
        isSaved: false,
        supports: [],
      };

      const response = await fetch(`http://localhost:5000/api/courses/${courseId}/levels`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken") || Cookies.get("access_token")}`,
        },
        body: JSON.stringify(levelData),
      });

      if (response.status === 401 || response.status === 403) {
        navigate({ to: "/sign-in-2" });
        throw new Error("Unauthorized: Please log in again");
      }

      if (!response.ok) {
        throw new Error(`Failed to add level: ${response.status} ${response.statusText}`);
      }

      const updatedCourse = await response.json();
      const newLevelData = {
        ...updatedCourse.levels[updatedCourse.levels.length - 1],
        supports: Array.isArray(updatedCourse.levels[updatedCourse.levels.length - 1].supports)
          ? updatedCourse.levels[updatedCourse.levels.length - 1].supports
          : [],
        assignedTo: Array.isArray(updatedCourse.levels[updatedCourse.levels.length - 1].assignedTo)
          ? updatedCourse.levels[updatedCourse.levels.length - 1].assignedTo
          : [],
      };

      setCourse((prevCourse) =>
        prevCourse
          ? {
              ...prevCourse,
              levels: [...prevCourse.levels, newLevelData],
            }
          : {
              ...updatedCourse,
              levels: updatedCourse.levels.map((level: Level) => ({
                ...level,
                supports: Array.isArray(level.supports) ? level.supports : [],
                assignedTo: Array.isArray(level.assignedTo) ? level.assignedTo : [],
              })),
            }
      );

      setNewLevel({
        title: "",
        description: "",
        difficultyLevel: "",
        imageUrl: "",
      });
      setIsAddModalOpen(false);
      toast.success("Level added successfully");
    } catch (error: any) {
      console.error("Error adding level:", error);
      toast.error(error.message || "Failed to add level");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit existing level
  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editLevel) return;
    setIsSubmitting(true);

    try {
      const response = await fetch(`http://localhost:5000/api/courses/${courseId}/levels/${editLevel._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken") || Cookies.get("access_token")}`,
        },
        body: JSON.stringify(editLevel),
      });

      if (!response.ok) {
        throw new Error("Failed to update level");
      }

      const updatedLevel = await response.json();
      setCourse((prevCourse) =>
        prevCourse
          ? {
              ...prevCourse,
              levels: prevCourse.levels.map((level) => (level._id === updatedLevel._id ? updatedLevel : level)),
            }
          : null
      );

      setEditLevel(null);
      setIsEditModalOpen(false);
      toast.success("Level updated successfully");
    } catch (error) {
      console.error("Error updating level:", error);
      toast.error("Failed to update level");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Assign level to a user
  const handleAssignLevel = async () => {
    try {
      setIsSubmitting(true);
      if (!courseId || !editLevel || !editLevel._id || !assignTo) {
        console.error("Invalid course, level, or email:", { courseId, editLevel, assignTo });
        toast.error("Veuillez sélectionner un niveau valide et un email");
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(assignTo)) {
        toast.error("Veuillez entrer un email valide");
        return;
      }

      if (!/^[0-9a-fA-F]{24}$/.test(editLevel._id)) {
        console.error("Invalid level ID format:", editLevel._id);
        toast.error("Identifiant de niveau invalide");
        return;
      }

      const assignUrl = `http://localhost:5000/api/courses/${courseId}/levels/${editLevel._id}/assign`;
      console.log("Sending level assignment request:", { url: assignUrl, assignTo, levelTitle: editLevel.title });

      const authToken = localStorage.getItem("authToken") || Cookies.get("access_token");
      if (!authToken) {
        navigate({ to: "/sign-in-2" });
        throw new Error("Authentication token is missing. Please log in again.");
      }

      const response = await fetch(assignUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ assignTo }),
      });

      const data = await response.json();
      if (!response.ok) {
        console.error("Assignment failed:", { status: response.status, message: data.message });
        if (response.status === 401 || response.status === 403) {
          navigate({ to: "/sign-in-2" });
          throw new Error("Unauthorized: Please log in again");
        } else if (response.status === 404) {
          throw new Error(data.message || "Course, level, or user not found");
        } else if (response.status === 400) {
          throw new Error(data.message || "Invalid request data");
        }
        throw new Error(data.message || "Échec de l’assignation du niveau");
      }

      // Refresh course data
      const updatedCourseResponse = await fetch(`http://localhost:5000/api/courses/${courseId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (!updatedCourseResponse.ok) {
        throw new Error("Échec de la récupération du cours");
      }
      const updatedCourse = await updatedCourseResponse.json();
      setCourse({
        ...updatedCourse,
        levels: updatedCourse.levels.map((level: Level) => ({
          ...level,
          supports: Array.isArray(level.supports) ? level.supports : [],
          assignedTo: Array.isArray(level.assignedTo) ? level.assignedTo : [],
        })),
      });

      localStorage.removeItem("hasSeenRecommendedLevels");
      setShowNotification(true);
      toast.success(data.message || `Niveau assigné à ${assignTo} avec succès. Un email a été envoyé.`);
      setAssignTo("");
      setEditLevel(null);
      setIsAssignModalOpen(false);
    } catch (error: any) {
      console.error("Erreur lors de l’assignation du niveau:", {
        message: error.message,
        stack: error.stack,
        courseId,
        levelId: editLevel?._id,
        assignTo,
      });
      toast.error(error.message || "Erreur lors de l’assignation du niveau");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Unassign level from current user
  const handleUnassignLevel = async (levelId: string) => {
    if (!currentUserId) {
      toast.error("User not logged in");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/courses/${courseId}/levels/${levelId}/unassign`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken") || Cookies.get("access_token")}`,
          },
          body: JSON.stringify({ userId: currentUserId }),
        }
      );

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        if (response.status === 401 || response.status === 403) {
          navigate({ to: "/sign-in-2" });
          throw new Error("Unauthorized: Please log in again");
        }
        throw new Error(errorData.message || "Failed to unassign level");
      }

      setCourse((prevCourse) =>
        prevCourse
          ? {
              ...prevCourse,
              levels: prevCourse.levels.map((level) =>
                level._id === levelId
                  ? {
                      ...level,
                      assignedTo: level.assignedTo
                        ? level.assignedTo.filter((uid) => uid !== currentUserId)
                        : [],
                    }
                  : level
              ),
            }
          : null
      );

      toast.success("Level unassigned successfully");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to unassign level";
      console.error("Error unassigning level:", error);
      toast.error(errorMessage);
    }
  };

  // Toggle save status for a level
  const toggleSaveLevel = async (levelId: string) => {
    try {
      setSavedLevels((prev) => {
        if (prev.includes(levelId)) {
          return prev.filter((id) => id !== levelId);
        } else {
          return [...prev, levelId];
        }
      });

      setCourse((prevCourse) => {
        if (!prevCourse) return null;
        return {
          ...prevCourse,
          levels: prevCourse.levels.map((level) => {
            if (level._id === levelId) {
              return {
                ...level,
                isSaved: !level.isSaved,
              };
            }
            return level;
          }),
        };
      });

      const response = await fetch(`http://localhost:5000/api/courses/${courseId}/levels/${levelId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken") || Cookies.get("access_token")}`,
        },
        body: JSON.stringify({ isSaved: !course?.levels.find((level) => level._id === levelId)?.isSaved }),
      });

      if (!response.ok) {
        throw new Error("Failed to toggle save status");
      }

      const updatedLevel = await response.json();
      setCourse((prevCourse) =>
        prevCourse
          ? {
              ...prevCourse,
              levels: prevCourse.levels.map((level) =>
                level._id === updatedLevel._id ? updatedLevel : level
              ),
            }
          : null
      );

      toast.success(updatedLevel.isSaved ? "Level saved successfully" : "Level unsaved successfully");
    } catch (error) {
      console.error("Error toggling save status:", error);
      setSavedLevels((prev) => {
        if (prev.includes(levelId)) {
          return [...prev, levelId];
        } else {
          return prev.filter((id) => id !== levelId);
        }
      });

      setCourse((prevCourse) => {
        if (!prevCourse) return null;
        return {
          ...prevCourse,
          levels: prevCourse.levels.map((level) => {
            if (level._id === levelId) {
              return {
                ...level,
                isSaved: !level.isSaved,
              };
            }
            return level;
          }),
        };
      });

      toast.error("Failed to toggle save status");
    }
  };

  // Delete level
  const handleDeleteLevel = async (levelId: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/courses/${courseId}/levels/${levelId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken") || Cookies.get("access_token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete level");
      }

      setCourse((prevCourse) =>
        prevCourse
          ? {
              ...prevCourse,
              levels: prevCourse.levels.filter((level) => level._id !== levelId),
            }
          : null
      );

      setSavedLevels((prev) => prev.filter((id) => id !== levelId));
      toast.success("Level deleted successfully");
    } catch (error) {
      console.error("Error deleting level:", error);
      toast.error("Failed to delete level");
    }
  };

  // Open edit modal
  const openEditModal = (level: Level) => {
    setEditLevel({
      ...level,
      difficultyLevel: level.difficultyLevel || "beginner",
    });
    setIsEditModalOpen(true);
  };

  // Open assign modal
  const openAssignModal = (level: Level) => {
    if (!level || !level._id || !/^[0-9a-fA-F]{24}$/.test(level._id)) {
      console.error("Invalid level selected for assignment:", level);
      toast.error("Niveau invalide sélectionné");
      return;
    }
    console.log("Opening assign dialog for level:", { _id: level._id, title: level.title });
    setEditLevel(level);
    setAssignTo("");
    setIsAssignModalOpen(true);
  };

  // Check if user can manage levels
  const canManageLevels = () => {
    return userRole === "manager" || userRole === "admin";
  };

  if (!course) {
    return <div className="p-6">Loading course...</div>;
  }

  return (
    <>
      <Header>
        <Searchh />
        <div className="ml-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <div className="min-h-screen bg-gradient-to-b bg-[#eff3fa] font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate({ to: "/courses" })}
                className="hover:bg-primary/10 hover:text-primary w-10 h-10 rounded-full"
              >
                <IconChevronLeft size={20} />
              </Button>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">
                  {course.name.charAt(0).toUpperCase() + course.name.slice(1)}
                </h1>
                <p className="text-lg text-gray-600 mt-2">{course.desc}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {userRole === "collaborator" && (
                <Button
                onClick={() => {
  setShowRecommendedLevels(!showRecommendedLevels);
  setShowSavedLevels(false);
  setShowNotification(false);
  localStorage.setItem("hasSeenRecommendedLevels", "true");
}}
                  className="relative bg-white hover:bg-gray-200 text-gray-800 rounded-full px-5 py-2 shadow-sm transition-all duration-300"
                >
                  <IconStar size={18} className="mr-2" /> Recommended Levels
                  {showNotification && recommendedLevelsCount > 0 && (
                    <span className="absolute top-0 right-0 -mt-1 -mr-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                      {recommendedLevelsCount}
                    </span>
                  )}
                </Button>
              )}
              <Button
                onClick={() => setShowSavedLevels(true)}
                className="bg-white hover:bg-gray-200 text-gray-800 rounded-full px-5 py-2 shadow-sm transition-all duration-300"
              >
                <IconBookmark size={18} className="mr-2" /> Saved Levels
              </Button>
              {canManageLevels() && (
                <Button
                  onClick={() => setIsAddModalOpen(true)}
                  className="bg-primary hover:bg-primary/90 text-white rounded-full px-5 py-2 shadow-lg transition-all duration-300 hover:shadow-xl"
                >
                  <IconPlus size={18} className="mr-2" /> Add Level
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
            {course.levels.map((level) => (
              <Link
                key={level._id}
                to={`/courses/${courseId}/levels/${level._id}`}
                className="block"
              >
                <div className="relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 group">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
                    <img
                      src={level.imageUrl || "/placeholder.svg"}
                      alt={`${level.title} Image`}
                      className="w-full h-56 object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                        e.currentTarget.src = "https://via.placeholder.com/150";
                      }}
                    />
                    <div className="absolute top-3 right-3 z-20 flex space-x-2">
                     <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.preventDefault(); // Empêche la navigation
            e.stopPropagation(); // Empêche la propagation au parent
            toggleSaveLevel(level._id);
          }}
          className={`rounded-full p-0 w-8 h-8 ${
            savedLevels.includes(level._id)
              ? "bg-primary text-white"
              : "bg-white/80 text-gray-700"
          } backdrop-blur-sm hover:bg-primary hover:text-white transition-colors`}
        >
          <IconBookmark
            size={18}
            fill={savedLevels.includes(level._id) ? "currentColor" : "none"}
          />
        </Button>
                      {canManageLevels() && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-full p-0 w-8 h-8 bg-white/80 backdrop-blur-sm hover:bg-white"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <IconDotsVertical size={18} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(level);
                              }}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <IconEdit size={16} />
                              Edit Level
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteLevel(level._id);
                              }}
                              className="flex items-center gap-2 cursor-pointer text-red-500 hover:text-red-700"
                            >
                              <IconTrash size={16} />
                              Delete Level
                            </DropdownMenuItem>
                            {Array.isArray(level.assignedTo) &&
                            currentUserId &&
                            level.assignedTo.includes(currentUserId) ? (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLevelToUnassign(level._id);
                                  setIsUnassignModalOpen(true);
                                }}
                                className="flex items-center gap-2 cursor-pointer text-orange-500 hover:text-orange-700"
                              >
                                <IconUserPlus size={16} />
                                Unassign Level
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openAssignModal(level);
                                }}
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <IconUserPlus size={16} />
                                Assign Level
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-5 z-20">
                      <h2 className="text-xl font-bold text-white">{level.title}</h2>
                      {Array.isArray(level.assignedTo) &&
                        (currentUserId || currentUserEmail) &&
                        level.assignedTo.some(
                          (id) => id === currentUserId || id === currentUserEmail
                        ) && (
                          <span className="inline-block rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800 dark:bg-blue-800 dark:text-blue-100 mt-2">
                            Assigned to You
                          </span>
                        )}
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="text-gray-600 text-sm mb-5 line-clamp-2">{level.description}</p>
                    <div className="mt-4">
                      {level.supports.length > 0 ? (
                        <div className="space-y-2">
                          {level.supports
                            .filter((support) => support.type === "video")
                            .map((support) => (
                              <div
                                key={support._id}
                                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                              >
                                <span className="text-sm text-gray-700">{support.name}</span>
                               
                              </div>
                            ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No videos available</p>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {course.levels.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <IconPlus size={32} className="text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No Levels Available</h3>
              <p className="text-gray-600 max-w-md mb-6">
                This course doesn't have any levels yet. Click the button below to add your first level.
              </p>
              {canManageLevels() && (
                <Button
                  onClick={() => setIsAddModalOpen(true)}
                  className="bg-primary hover:bg-primary/90 text-white rounded-full px-5 py-2 shadow-lg"
                >
                  <IconPlus size={18} className="mr-2" /> Add First Level
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Level Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Add New Level</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSubmit}>
            <div className="grid gap-5 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right font-medium">
                  Title
                </Label>
                <Input
                  id="title"
                  name="title"
                  value={newLevel.title}
                  onChange={(e) => handleInputChange(e, setNewLevel)}
                  className="col-span-3 rounded-lg"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="difficultyLevel" className="text-right font-medium">
                  Difficulty
                </Label>
                <Select
                  value={newLevel.difficultyLevel}
                  onValueChange={(value) => handleSelectChange(value, setNewLevel)}
                >
                  <SelectTrigger className="col-span-3 rounded-lg">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right font-medium">
                  Description
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={newLevel.description}
                  onChange={(e) => handleInputChange(e, setNewLevel)}
                  className="col-span-3 rounded-lg"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="imageUrl" className="text-right font-medium">
                  Image URL
                </Label>
                <Input
                  id="imageUrl"
                  name="imageUrl"
                  value={newLevel.imageUrl}
                  onChange={(e) => handleInputChange(e, setNewLevel)}
                  className="col-span-3 rounded-lg"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-lg"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary/90 text-white rounded-lg"
              >
                {isSubmitting ? "Adding..." : "Add Level"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Level Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Edit Level</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="grid gap-5 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right font-medium">
                  Title
                </Label>
                <Input
                  id="title"
                  name="title"
                  value={editLevel?.title || ""}
                  onChange={(e) => handleInputChange(e, setEditLevel)}
                  className="col-span-3 rounded-lg"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="difficultyLevel" className="text-right font-medium">
                  Difficulty
                </Label>
                <Select
                  value={editLevel?.difficultyLevel || ""}
                  onValueChange={(value) => handleSelectChange(value, setEditLevel)}
                >
                  <SelectTrigger className="col-span-3 rounded-lg">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right font-medium">
                  Description
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={editLevel?.description || ""}
                  onChange={(e) => handleInputChange(e, setEditLevel)}
                  className="col-span-3 rounded-lg"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="imageUrl" className="text-right font-medium">
                  Image URL
                </Label>
                <Input
                  id="imageUrl"
                  name="imageUrl"
                  value={editLevel?.imageUrl || ""}
                  onChange={(e) => handleInputChange(e, setEditLevel)}
                  className="col-span-3 rounded-lg"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
                className="rounded-lg"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary/90 text-white rounded-lg"
              >
                {isSubmitting ? "Updating..." : "Update Level"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Level Modal */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Assign Level</DialogTitle>
            <DialogDescription>
              {editLevel && `Assign the level "${editLevel.title}" to a user by entering their email address.`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="assignTo" className="text-right font-medium">
                Email
              </Label>
              <Input
                id="assignTo"
                type="email"
                value={assignTo}
                onChange={(e) => setAssignTo(e.target.value)}
                className="col-span-3 rounded-lg"
                placeholder="Enter user email (e.g., user@example.com)"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAssignModalOpen(false)}
              className="rounded-lg"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAssignLevel}
              disabled={isSubmitting || !assignTo.trim()}
              className="bg-primary hover:bg-primary/90 text-white rounded-lg"
            >
              {isSubmitting ? "Assigning..." : "Assign Level"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unassign Level Modal */}
      <Dialog open={isUnassignModalOpen} onOpenChange={setIsUnassignModalOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Confirm Unassignment</DialogTitle>
            <DialogDescription>
              Are you sure you want to unassign this level? You will no longer have access to it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUnassignModalOpen(false)}
              className="rounded-lg"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (levelToUnassign) {
                  handleUnassignLevel(levelToUnassign);
                  setIsUnassignModalOpen(false);
                  setLevelToUnassign(null);
                }
              }}
              className="bg-primary hover:bg-primary/90 text-white rounded-lg"
            >
              Unassign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Saved Levels Dialog */}
      <Dialog open={showSavedLevels} onOpenChange={setShowSavedLevels}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Saved Levels</DialogTitle>
          </DialogHeader>
          <div className="py-4 max-h-[60vh] overflow-y-auto">
            {savedLevels.length === 0 ? (
              <div className="text-center py-8">
                <IconBookmark size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">You haven't saved any levels yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {course.levels
                  .filter((level) => savedLevels.includes(level._id))
                  .map((level) => (
                    <div
                      key={level._id}
                      className="flex items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <img
                        src={level.imageUrl || "/placeholder.svg"}
                        alt={level.title}
                        className="w-16 h-16 object-cover rounded-lg mr-4"
                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                          e.currentTarget.src = "https://via.placeholder.com/150";
                        }}
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{level.title}</h3>
                        <p className="text-sm text-gray-500 line-clamp-1">{level.description}</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleSaveLevel(level._id)}
                          className="text-gray-500 hover:text-red-500"
                        >
                          <IconBookmark size={18} fill="currentColor" />
                        </Button>
                        <Link
                          to={`/courses/${courseId}/levels/${level._id}`}
                          className="py-1.5 px-3 bg-gray-900 rounded-full text-white text-sm font-medium hover:bg-gray-800 transition-colors"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowSavedLevels(false)} className="rounded-lg">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recommended Levels Dialog */}
      <Dialog open={showRecommendedLevels} onOpenChange={setShowRecommendedLevels}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Recommended Levels</DialogTitle>
          </DialogHeader>
          <div className="py-4 max-h-[60vh] overflow-y-auto">
            {recommendedLevels.length === 0 ? (
              <div className="text-center py-8">
                <IconStar size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No recommended levels available.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recommendedLevels.map((level) => (
                  <div
                    key={level._id}
                    className="flex items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <img
                      src={level.imageUrl || "/placeholder.svg"}
                      alt={level.title}
                      className="w-16 h-16 object-cover rounded-lg mr-4"
                      onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                        e.currentTarget.src = "https://via.placeholder.com/150";
                      }}
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{level.title}</h3>
                      <p className="text-sm text-gray-500 line-clamp-1">{level.description}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSaveLevel(level._id)}
                        className="text-gray-500 hover:text-primary"
                      >
                        <IconBookmark
                          size={18}
                          fill={savedLevels.includes(level._id) ? "currentColor" : "none"}
                        />
                      </Button>
                      <Link
                        to={`/courses/${courseId}/levels/${level._id}`}
                        className="py-1.5 px-3 bg-gray-900 rounded-full text-white text-sm font-medium hover:bg-gray-800 transition-colors"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowRecommendedLevels(false)} className="rounded-lg">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
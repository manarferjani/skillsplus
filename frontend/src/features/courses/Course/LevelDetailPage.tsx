"use client";

import { useEffect, useState } from "react";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  FileText,
  LinkIcon,
  Video,
  ExternalLink,
  Bookmark,
  Eye,
  Plus,
  X,
  PlaySquare,
  MoreVertical,
  Edit,
  Trash2,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { IconChevronLeft } from "@tabler/icons-react";
import { Header } from "@/components/layout/header";
import { Searchh } from "@/components/searchh";
import { ThemeSwitch } from "@/components/theme-switch";
import { ProfileDropdown } from "@/components/profile-dropdown";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useAuth } from "@/stores/authStore";
import toast, { Toaster } from "react-hot-toast";
import Cookies from "js-cookie";

interface Support {
  name: string;
  description: string;
  type: string[];
  imageUrl: string;
  videoUrl?: string;
  pdfFile?: File | string;
  linkUrl?: string;
  isSaved: boolean;
  isViewed: boolean;
  _id: string;
}

interface Level {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  isSaved: boolean;
  supports: Support[];
}

interface LevelDetailPageProps {
  courseId: string;
  levelId: string;
}

// Fonction d'aide pour détecter les URL YouTube
const isYouTubeUrl = (url: string): boolean => {
  if (!url) return false;
  return url.includes("youtube.com") || url.includes("youtu.be");
};

// Fonction d'aide pour vérifier si c'est une playlist YouTube
const isYouTubePlaylist = (url: string): boolean => {
  if (!url) return false;
  return url.includes("youtube.com/playlist") || url.includes("list=");
};

// Fonction d'aide pour convertir une URL YouTube en URL d'intégration
const getYouTubeEmbedUrl = (url: string): string | null => {
  try {
    if (isYouTubePlaylist(url)) {
      let playlistId = "";
      const urlObj = new URL(url);
      if (url.includes("list=")) {
        const params = new URLSearchParams(urlObj.search);
        playlistId = params.get("list") || "";
      }
      if (!playlistId) return null;
      return `https://www.youtube.com/embed/videoseries?list=${playlistId}`;
    }
    let videoId;
    if (url.includes("youtu.be")) {
      videoId = url.split("youtu.be/")[1];
      if (videoId && videoId.includes("?")) {
        videoId = videoId.split("?")[0];
      }
    } else if (url.includes("youtube.com/watch")) {
      const urlParams = new URLSearchParams(url.split("?")[1]);
      videoId = urlParams.get("v");
    } else if (url.includes("youtube.com/embed/")) {
      videoId = url.split("youtube.com/embed/")[1];
    }
    if (!videoId) return null;
    return `https://www.youtube.com/embed/${videoId}`;
  } catch (error) {
    console.error("Error parsing YouTube URL:", error);
    return null;
  }
};

// Create a schema for form validation
const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  type: z.array(z.string()).min(1, { message: "At least one type must be selected." }),
  imageUrl: z.string().url({ message: "Please enter a valid URL for the image." }),
  videoUrl: z
    .string()
    .refine(
      (val) => {
        if (!val) return true;
        if (val.includes("youtube.com") || val.includes("youtu.be")) {
          return true;
        }
        try {
          const url = new URL(val);
          const fileExtension = url.pathname.split(".").pop()?.toLowerCase();
          return ["mp4", "webm", "ogg"].includes(fileExtension || "");
        } catch {
          return false;
        }
      },
      { message: "Please enter a valid video URL (YouTube, YouTube playlist, or direct video file URL)" }
    )
    .optional()
    .or(z.literal("")),
  pdfFile: z.any().optional(),
  linkUrl: z.string().url({ message: "Please enter a valid URL for the link." }).optional().or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

export function LevelDetailPage({ courseId, levelId }: LevelDetailPageProps) {
  const [levelData, setLevelData] = useState<Level | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [userRole, setUserRole] = useState<"collaborator" | "manager" | "admin">("collaborator");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null);
  const [currentSupport, setCurrentSupport] = useState<Support | null>(null);
  const { setAccessToken, setRefreshToken, setUser, reset } = useAuth();
  const navigate = useNavigate();
  const [isVideoPlayerOpen, setIsVideoPlayerOpen] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<{ name: string; url: string } | null>(null);
  const [showSavedOnly,] = useState(false);
const [isSavedDialogOpen, setIsSavedDialogOpen] = useState(false); // Nouvel état pour la pop-up
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      type: [],
      imageUrl: "",
      videoUrl: "",
      pdfFile: undefined,
      linkUrl: "",
    },
  });

  const editForm = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      type: [],
      imageUrl: "",
      videoUrl: "",
      pdfFile: undefined,
      linkUrl: "",
    },
  });

  // Fetch user role
  const fetchUserRole = async () => {
    try {
      let token = localStorage.getItem("authToken") || Cookies.get("access_token");
      if (!token) {
        toast.error("Please log in");
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
          toast.error("Unable to refresh session. Please log in again.");
          reset();
          navigate({ to: "/sign-in-2" });
          return;
        }
      }

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 403) {
          toast.error(`Access denied: ${errorData.message || "Unauthorized role."}`);
          return;
        }
        throw new Error(errorData.message || "Error fetching role");
      }

      const data = await response.json();
      setUserRole(data.data.role);
      setUser({
        id: data.data._id,
        name: data.data.name,
        email: data.data.email,
        role: data.data.role,
      });
    } catch (err: any) {
      console.error("Error:", err.message);
      toast.error("Error fetching role");
    }
  };

  // Fetch level data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("authToken") || Cookies.get("access_token");
        const res = await fetch(`http://localhost:5000/api/courses/${courseId}/levels/${levelId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch level");
        const data: Level = await res.json();
        setLevelData(data);
      } catch (error) {
        console.error("Error fetching level:", error);
        toast.error("Failed to load level data");
      }
    };
    fetchUserRole();
    if (courseId && levelId) {
      fetchData();
    }
  }, [courseId, levelId, setAccessToken, setRefreshToken, setUser, reset, navigate]);

  // Check if user can manage levels
  const canManageLevels = () => {
    return userRole === "manager" || userRole === "admin";
  };

  const handleToggleSaveSupport = async (supportId: string) => {
    try {
      const token = localStorage.getItem("authToken") || Cookies.get("access_token");
      const support = levelData?.supports.find((s) => s._id === supportId);
      const willBeSaved = !support?.isSaved;
      const res = await fetch(`http://localhost:5000/api/courses/${courseId}/levels/${levelId}/supports/${supportId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          isSaved: willBeSaved,
        }),
      });
      if (!res.ok) throw new Error("Failed to update support save status");
      const levelResponse = await fetch(`http://localhost:5000/api/courses/${courseId}/levels/${levelId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (levelResponse.ok) {
        const updatedLevel = await levelResponse.json();
        setLevelData(updatedLevel);
        toast.success(willBeSaved ? "Support saved successfully!" : "Support unsaved successfully!");
      }
    } catch (error) {
      console.error("Error toggling save support:", error);
      toast.error("Failed to save support");
    }
  };

  const handleAddSupport = async (data: FormValues) => {
    try {
      const token = localStorage.getItem("authToken") || Cookies.get("access_token");
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("description", data.description);
      data.type.forEach((type) => formData.append("type", type));
      formData.append("imageUrl", data.imageUrl);
      if (data.videoUrl) formData.append("videoUrl", data.videoUrl);
      if (selectedPdfFile) {
        if (selectedPdfFile.type !== "application/pdf") throw new Error("File must be a PDF");
        formData.append("pdfFile", selectedPdfFile);
      }
      if (data.linkUrl) formData.append("linkUrl", data.linkUrl);

      const response = await fetch(`http://localhost:5000/api/courses/${courseId}/levels/${levelId}/supports`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || "Unknown error";
        } catch {
          errorMessage = errorText || "Unknown error";
        }
        throw new Error(`Failed to add support: ${response.status} - ${errorMessage}`);
      }

      const levelResponse = await fetch(`http://localhost:5000/api/courses/${courseId}/levels/${levelId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (levelResponse.ok) {
        const updatedLevel = await levelResponse.json();
        setLevelData(updatedLevel);
        toast.success("Support added successfully!");
      }

      setSelectedPdfFile(null);
      setIsDialogOpen(false);
      form.reset();
    } catch (error: any) {
      console.error("Error adding support:", error);
      toast.error(`Error adding support: ${error.message}`);
    }
  };

  const openEditDialog = (support: Support) => {
    setCurrentSupport(support);
    editForm.reset({
      name: support.name,
      description: support.description,
      type: support.type,
      imageUrl: support.imageUrl,
      videoUrl: support.videoUrl || "",
      linkUrl: support.linkUrl || "",
      pdfFile: support.pdfFile || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleEditSupport = async (data: FormValues) => {
    if (!currentSupport) return;
    try {
      const token = localStorage.getItem("authToken") || Cookies.get("access_token");
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("description", data.description);
      data.type.forEach((type) => formData.append("type", type));
      formData.append("imageUrl", data.imageUrl);
      if (data.videoUrl) formData.append("videoUrl", data.videoUrl);
      if (selectedPdfFile) formData.append("pdfFile", selectedPdfFile);
      if (data.linkUrl) formData.append("linkUrl", data.linkUrl);

      const response = await fetch(
        `http://localhost:5000/api/courses/${courseId}/levels/${levelId}/supports/${currentSupport._id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update support: ${response.status} - ${errorText}`);
      }

      const levelResponse = await fetch(`http://localhost:5000/api/courses/${courseId}/levels/${levelId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (levelResponse.ok) {
        const updatedLevel = await levelResponse.json();
        setLevelData(updatedLevel);
        toast.success("Support updated successfully!");
      }

      setSelectedPdfFile(null);
      setIsEditDialogOpen(false);
      setCurrentSupport(null);
      editForm.reset();
    } catch (error: any) {
      console.error("Error updating support:", error);
      toast.error(`Error updating support: ${error.message}`);
    }
  };

  const openDeleteDialog = (support: Support) => {
    setCurrentSupport(support);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteSupport = async () => {
    if (!currentSupport) return;
    try {
      const token = localStorage.getItem("authToken") || Cookies.get("access_token");
      const response = await fetch(
        `http://localhost:5000/api/courses/${courseId}/levels/${levelId}/supports/${currentSupport._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) throw new Error(`Failed to delete support: ${response.status}`);
      const levelResponse = await fetch(`http://localhost:5000/api/courses/${courseId}/levels/${levelId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (levelResponse.ok) {
        const updatedLevel = await levelResponse.json();
        setLevelData(updatedLevel);
        toast.success("Support deleted successfully!");
      }
      setIsDeleteDialogOpen(false);
      setCurrentSupport(null);
    } catch (error: any) {
      console.error("Error deleting support:", error);
      toast.error(`Error deleting support: ${error.message}`);
    }
  };

  const handleDownloadPdf = async (url: string, filename: string) => {
    try {
      if (!url) throw new Error("Invalid PDF URL");

      const baseUrl = "http://localhost:5000";
      const normalizedUrl = url.startsWith("/uploads/pdfs/") ? url : `/uploads/pdfs/${url}`;
      const fullUrl = normalizedUrl.startsWith("http") ? normalizedUrl : `${baseUrl}${normalizedUrl}`;

      const response = await fetch(fullUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/pdf",
          Authorization: `Bearer ${localStorage.getItem("authToken") || Cookies.get("access_token")}`,
        },
      });

      if (!response.ok) throw new Error(`Error downloading PDF: ${response.statusText}`);

      const blob = await response.blob();
      if (blob.size === 0) throw new Error("PDF file is empty");

      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename || "download.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(link.href);
      window.open(fullUrl, "_blank");
      toast.success("PDF downloaded successfully!");
    } catch (error: any) {
      console.error("Error downloading PDF:", error);
      toast.error(`Error downloading PDF: ${error.message}`);
    }
  };

  const handleOpenVideo = (name: string, url: string) => {
    setCurrentVideo({ name, url });
    setIsVideoPlayerOpen(true);
  };

  if (!levelData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <div className="h-16 w-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading level content...</p>
        </div>
      </div>
    );
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="h-4 w-4" />;
      case "pdf":
        return <FileText className="h-4 w-4" />;
      case "link":
        return <LinkIcon className="h-4 w-4" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

  const isPlaylistUrl = (url: string) => {
    return isYouTubeUrl(url) && isYouTubePlaylist(url);
  };
  const handleShowSaved = () => {
    setIsSavedDialogOpen(true);
  };

  // Filtrer les supports enregistrés
  const savedSupports = levelData?.supports.filter((support) => support.isSaved) || [];

  const filteredSupports = levelData.supports.filter((support) => {
    const matchesType = activeTab === "all" || support.type.includes(activeTab);
    return matchesType && (showSavedOnly ? support.isSaved : true);
  });

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <Header>
        <Searchh />
        <div className="ml-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>
      {/* Pop-up pour les supports enregistrés */}
      <Dialog open={isSavedDialogOpen} onOpenChange={setIsSavedDialogOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Supports Enregistrés</DialogTitle>
            <DialogDescription>
              Liste des supports marqués comme enregistrés pour ce niveau.
            </DialogDescription>
          </DialogHeader>
          {savedSupports.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">Aucun support enregistré.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {savedSupports.map((support) => (
                <Card key={support._id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{support.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{support.description}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {support.type.map((type) => (
                          <Badge key={type} variant="outline" className="bg-background/80">
                            <span className="flex items-center gap-1">
                              {getTypeIcon(type)}
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </span>
                          </Badge>
                        ))}
                        {support.type.includes("video") && support.videoUrl && isPlaylistUrl(support.videoUrl) && (
                          <Badge variant="outline" className="bg-red-500/20 text-red-300 border-red-500">
                            <PlaySquare className="h-3 w-3 mr-1" />
                            Playlist
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`p-0 w-8 h-8 ${support.isSaved ? "text-primary" : "text-gray-500"}`}
                        onClick={() => handleToggleSaveSupport(support._id)}
                      >
                        <Bookmark className={`h-4 w-4 ${support.isSaved ? "fill-current" : ""}`} />
                      </Button>
                      {canManageLevels() && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="p-0 w-8 h-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(support)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openDeleteDialog(support)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {support.type.includes("video") && support.videoUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                        onClick={() => handleOpenVideo(support.name, support.videoUrl || "")}
                      >
                        {isPlaylistUrl(support.videoUrl) ? (
                          <PlaySquare className="h-4 w-4" />
                        ) : (
                          <Video className="h-4 w-4" />
                        )}
                        {isPlaylistUrl(support.videoUrl) ? "Watch Playlist" : "Watch Video"}
                      </Button>
                    )}
                    {support.type.includes("pdf") && support.pdfFile && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                        onClick={() => {
                          const fileUrl = typeof support.pdfFile === "string" ? support.pdfFile : "";
                          handleDownloadPdf(fileUrl, `${support.name.replace(/\s+/g, "_")}.pdf`);
                        }}
                      >
                        <FileText className="h-4 w-4" />
                        Download PDF
                      </Button>
                    )}
                    {support.type.includes("link") && support.linkUrl && (
                      <Button variant="outline" size="sm" className="flex items-center gap-1" asChild>
                        <a href={support.linkUrl} target="_blank" rel="noopener noreferrer">
                          <LinkIcon className="h-4 w-4" />
                          Visit Link
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSavedDialogOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isVideoPlayerOpen && currentVideo && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-80 flex flex-col">
          <div className="container mx-auto h-full flex flex-col p-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2 text-white">
                <h2 className="text-2xl font-bold">{currentVideo.name}</h2>
                {isPlaylistUrl(currentVideo.url) && (
                  <Badge variant="outline" className="bg-red-500/20 text-red-300 border-red-500">
                    <PlaySquare className="h-3 w-3 mr-1" />
                    Playlist
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsVideoPlayerOpen(false)}
                className="text-white hover:bg-white/20"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
            <div className="flex-grow flex items-center justify-center">
              <div className="w-full max-w-5xl aspect-video bg-black">
                {isYouTubeUrl(currentVideo.url) ? (
                  <iframe
                    src={getYouTubeEmbedUrl(currentVideo.url) || ""}
                    className="w-full h-full"
                    allowFullScreen
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  >
                    Your browser does not support YouTube embeds.
                  </iframe>
                ) : (
                  <video src={currentVideo.url} controls autoPlay className="w-full h-full">
                    Your browser does not support video playback.
                  </video>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Support</DialogTitle>
            <DialogDescription>Modify the details of the support below.</DialogDescription>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(handleEditSupport)} className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <div className="grid grid-cols-1 gap-2">
                <label htmlFor="edit-name" className="text-sm font-medium">
                  Name
                </label>
                <Input id="edit-name" placeholder="Enter support name" {...editForm.register("name")} />
                {editForm.formState.errors.name && (
                  <p className="text-xs text-red-500">{editForm.formState.errors.name.message}</p>
                )}
              </div>
              <div className="grid grid-cols-1 gap-2">
                <label htmlFor="edit-description" className="text-sm font-medium">
                  Description
                </label>
                <Textarea
                  id="edit-description"
                  placeholder="Enter support description"
                  {...editForm.register("description")}
                />
                {editForm.formState.errors.description && (
                  <p className="text-xs text-red-500">{editForm.formState.errors.description.message}</p>
                )}
              </div>
              <div className="grid grid-cols-1 gap-2">
                <label className="text-sm font-medium">Resource Type</label>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-type-video"
                      checked={editForm.watch("type")?.includes("video")}
                      onCheckedChange={(checked) => {
                        const currentTypes = editForm.getValues("type") || [];
                        if (checked) {
                          editForm.setValue("type", [...currentTypes, "video"]);
                        } else {
                          editForm.setValue("type", currentTypes.filter((type) => type !== "video"));
                          editForm.setValue("videoUrl", "");
                        }
                      }}
                    />
                    <label htmlFor="edit-type-video" className="text-sm font-medium">
                      Video
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-type-pdf"
                      checked={editForm.watch("type")?.includes("pdf")}
                      onCheckedChange={(checked) => {
                        const currentTypes = editForm.getValues("type") || [];
                        if (checked) {
                          editForm.setValue("type", [...currentTypes, "pdf"]);
                        } else {
                          editForm.setValue("type", currentTypes.filter((type) => type !== "pdf"));
                          setSelectedPdfFile(null);
                        }
                      }}
                    />
                    <label htmlFor="edit-type-pdf" className="text-sm font-medium">
                      PDF
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-type-link"
                      checked={editForm.watch("type")?.includes("link")}
                      onCheckedChange={(checked) => {
                        const currentTypes = editForm.getValues("type") || [];
                        if (checked) {
                          editForm.setValue("type", [...currentTypes, "link"]);
                        } else {
                          editForm.setValue("type", currentTypes.filter((type) => type !== "link"));
                          editForm.setValue("linkUrl", "");
                        }
                      }}
                    />
                    <label htmlFor="edit-type-link" className="text-sm font-medium">
                      Link
                    </label>
                  </div>
                </div>
                {editForm.formState.errors.type && (
                  <p className="text-xs text-red-500">{editForm.formState.errors.type.message}</p>
                )}
              </div>
              <div className="grid grid-cols-1 gap-2">
                <label htmlFor="edit-imageUrl" className="text-sm font-medium">
                  Image URL
                </label>
                <Input
                  id="edit-imageUrl"
                  placeholder="https://example.com/image.jpg"
                  {...editForm.register("imageUrl")}
                />
                {editForm.formState.errors.imageUrl && (
                  <p className="text-xs text-red-500">{editForm.formState.errors.imageUrl.message}</p>
                )}
              </div>
              {editForm.watch("type")?.includes("video") && (
                <div className="grid grid-cols-1 gap-2">
                  <label htmlFor="edit-videoUrl" className="text-sm font-medium">
                    Video URL
                  </label>
                  <Input
                    id="edit-videoUrl"
                    placeholder="YouTube URL, playlist or direct video file URL"
                    {...editForm.register("videoUrl")}
                  />
                  <p className="text-xs text-muted-foreground">
                    Supports YouTube videos, YouTube playlists, or direct URLs to MP4/WebM/OGG files
                  </p>
                  {editForm.formState.errors.videoUrl && (
                    <p className="text-xs text-red-500">{editForm.formState.errors.videoUrl.message}</p>
                  )}
                </div>
              )}
              {editForm.watch("type")?.includes("pdf") && (
                <div className="space-y-2">
                  <label
                    htmlFor="edit-pdfFile"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Upload PDF File
                  </label>
                  <div className="flex items-center gap-4">
                    <label
                      htmlFor="edit-pdfFile"
                      className="cursor-pointer inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    >
                      {selectedPdfFile ? "Change File" : "Choose File"}
                    </label>
                    <span className="text-sm text-green-600">
                      {selectedPdfFile ? selectedPdfFile.name : "No file selected"}
                    </span>
                  </div>
                  <input
                    id="edit-pdfFile"
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setSelectedPdfFile(file);
                    }}
                  />
                </div>
              )}
              {editForm.watch("type")?.includes("link") && (
                <div className="grid grid-cols-1 gap-2">
                  <label htmlFor="edit-linkUrl" className="text-sm font-medium">
                    Link URL
                  </label>
                  <Input id="edit-linkUrl" placeholder="https://example.com" {...editForm.register("linkUrl")} />
                  {editForm.formState.errors.linkUrl && (
                    <p className="text-xs text-red-500">{editForm.formState.errors.linkUrl.message}</p>
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the support "{currentSupport?.name}" and all
              associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSupport} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="grid grid-cols-1 gap-8">
          <div className="relative rounded-xl overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${levelData.imageUrl})`,
                filter: "blur(8px)",
                opacity: 0.3,
              }}
            />
            <div className="relative bg-gradient-to-r from-background/80 to-background/60 p-8 backdrop-blur-sm">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center space-x-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate({ to: `/courses/${courseId}` })}
                    className="hover:bg-primary/10 hover:text-primary w-10 h-10 rounded-full"
                  >
                    <IconChevronLeft size={20} />
                  </Button>
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">{levelData.title}</h1>
                    <p className="text-muted-foreground mt-2 max-w-2xl">{levelData.description}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
              <div className="flex justify-between items-center mb-4">
                <TabsList className="rounded-3xl">
                  <TabsTrigger value="all" className="rounded-3xl">
                    All Resources
                  </TabsTrigger>
                  <TabsTrigger value="video" className="rounded-3xl">
                    Videos
                  </TabsTrigger>
                  <TabsTrigger value="pdf" className="rounded-3xl">
                    Documents
                  </TabsTrigger>
                  <TabsTrigger value="link" className="rounded-3xl">
                    Links
                  </TabsTrigger>
                </TabsList>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-black hover:bg-gray-500 text-white rounded-3xl gap-1 mr-2"
                    onClick={handleShowSaved} // Remplacer l'ancien comportement
                  >
                    <Bookmark className="h-4 w-4" />
                    Show Saved
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    {filteredSupports.length} resource{filteredSupports.length !== 1 ? "s" : ""}
                  </p>

                  {canManageLevels() && (
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-black hover:bg-gray-500 text-white rounded-3xl px-4 py-2 gap-1"
                        >
                          <Plus className="h-4 w-4" />
                          Add Support
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[550px]">
                        <DialogHeader>
                          <DialogTitle>Add New Support Resource</DialogTitle>
                          <DialogDescription>
                            Fill in the details below to add a new resource to this level.
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={form.handleSubmit(handleAddSupport)} className="space-y-6">
                          <div className="grid grid-cols-1 gap-4">
                            <div className="grid grid-cols-1 gap-2">
                              <label htmlFor="name" className="text-sm font-medium">
                                Name
                              </label>
                              <Input id="name" placeholder="Enter resource name" {...form.register("name")} />
                              {form.formState.errors.name && (
                                <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>
                              )}
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                              <label htmlFor="description" className="text-sm font-medium">
                                Description
                              </label>
                              <Textarea
                                id="description"
                                placeholder="Enter resource description"
                                {...form.register("description")}
                              />
                              {form.formState.errors.description && (
                                <p className="text-xs text-red-500">{form.formState.errors.description.message}</p>
                              )}
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                              <label className="text-sm font-medium">Resource Type</label>
                              <div className="flex flex-wrap gap-4">
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="type-video"
                                    value="video"
                                    onCheckedChange={(checked) => {
                                      const currentTypes = form.getValues("type") || [];
                                      if (checked) {
                                        form.setValue("type", [...currentTypes, "video"]);
                                      } else {
                                        form.setValue("type", currentTypes.filter((type) => type !== "video"));
                                        form.setValue("videoUrl", "");
                                      }
                                    }}
                                  />
                                  <label htmlFor="type-video" className="text-sm font-medium">
                                    Video
                                  </label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="type-pdf"
                                    value="pdf"
                                    onCheckedChange={(checked) => {
                                      const currentTypes = form.getValues("type") || [];
                                      if (checked) {
                                        form.setValue("type", [...currentTypes, "pdf"]);
                                      } else {
                                        form.setValue("type", currentTypes.filter((type) => type !== "pdf"));
                                        setSelectedPdfFile(null);
                                      }
                                    }}
                                  />
                                  <label htmlFor="type-pdf" className="text-sm font-medium">
                                    PDF
                                  </label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="type-link"
                                    value="link"
                                    onCheckedChange={(checked) => {
                                      const currentTypes = form.getValues("type") || [];
                                      if (checked) {
                                        form.setValue("type", [...currentTypes, "link"]);
                                      } else {
                                        form.setValue("type", currentTypes.filter((type) => type !== "link"));
                                        form.setValue("linkUrl", "");
                                      }
                                    }}
                                  />
                                  <label htmlFor="type-link" className="text-sm font-medium">
                                    Link
                                  </label>
                                </div>
                              </div>
                              {form.formState.errors.type && (
                                <p className="text-xs text-red-500">{form.formState.errors.type.message}</p>
                              )}
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                              <label htmlFor="imageUrl" className="text-sm font-medium">
                                Image URL
                              </label>
                              <Input
                                id="imageUrl"
                                placeholder="https://example.com/image.jpg"
                                {...form.register("imageUrl")}
                              />
                              {form.formState.errors.imageUrl && (
                                <p className="text-xs text-red-500">{form.formState.errors.imageUrl.message}</p>
                              )}
                            </div>
                            {form.watch("type")?.includes("video") && (
                              <div className="grid grid-cols-1 gap-2">
                                <label htmlFor="videoUrl" className="text-sm font-medium">
                                  Video URL
                                </label>
                                <Input
                                  id="videoUrl"
                                  placeholder="YouTube URL, playlist URL or direct video file URL"
                                  {...form.register("videoUrl")}
                                />
                                <p className="text-xs text-muted-foreground">
                                  Supports YouTube videos, YouTube playlists, or direct URLs to MP4/WebM/OGG files
                                </p>
                                {form.formState.errors.videoUrl && (
                                  <p className="text-xs text-red-500">{form.formState.errors.videoUrl.message}</p>
                                )}
                              </div>
                            )}
                            {form.watch("type")?.includes("pdf") && (
                              <div className="space-y-2">
                                <label
                                  htmlFor="pdfFile"
                                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                                >
                                  Upload PDF File
                                </label>
                                <div className="flex items-center gap-4">
                                  <label
                                    htmlFor="pdfFile"
                                    className="cursor-pointer inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                  >
                                    {selectedPdfFile ? "Change File" : "Choose File"}
                                  </label>
                                  <span className="text-sm text-green-600">
                                    {selectedPdfFile ? selectedPdfFile.name : "No file selected"}
                                  </span>
                                </div>
                                <input
                                  id="pdfFile"
                                  type="file"
                                  accept=".pdf"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) setSelectedPdfFile(file);
                                  }}
                                />
                              </div>
                            )}
                            {form.watch("type")?.includes("link") && (
                              <div className="grid grid-cols-1 gap-2">
                                <label htmlFor="linkUrl" className="text-sm font-medium">
                                  Link URL
                                </label>
                                <Input
                                  id="linkUrl"
                                  placeholder="https://example.com"
                                  {...form.register("linkUrl")}
                                />
                                {form.formState.errors.linkUrl && (
                                  <p className="text-xs text-red-500">{form.formState.errors.linkUrl.message}</p>
                                )}
                              </div>
                            )}
                          </div>
                          <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button type="submit">Add Resource</Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
              <TabsContent value={activeTab} className="mt-0">
                {filteredSupports.length === 0 ? (
                  <div className="text-center py-12 border rounded-lg bg-muted/30">
                    <BookOpen className="h-12 w-12 mx-auto text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-medium">No resources available</h3>
                    <p className="text-muted-foreground">
                      There are no {activeTab !== "all" ? activeTab : ""} resources for this level yet.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSupports.map((support) => (
                      <Card
                        key={support._id}
                        className="overflow-hidden group hover:shadow-md transition-all duration-300"
                      >
                        <div className="aspect-video relative overflow-hidden">
                          <img
                            src={support.imageUrl || "/placeholder.svg"}
                            alt={support.name}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute top-2 right-2 flex gap-1">
                            {support.isViewed && (
                              <Badge variant="secondary" className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                <span className="text-xs">Viewed</span>
                              </Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`rounded-full p-0 w-8 h-8 ${support.isSaved ? "text-primary" : "text-gray-500"}`}
                              onClick={() => handleToggleSaveSupport(support._id)}
                            >
                              <Bookmark className={`h-4 w-4 ${support.isSaved ? "fill-current" : ""}`} />
                            </Button>
                            {canManageLevels() && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="rounded-full p-0 w-8 h-8">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
                                  <DropdownMenuItem onClick={() => openEditDialog(support)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => openDeleteDialog(support)}
                                    className="text-red-600 focus:text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                          <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
                            {support.type.map((type) => (
                              <Badge key={type} variant="outline" className="bg-background/80 backdrop-blur-sm">
                                <span className="flex items-center gap-1">
                                  {getTypeIcon(type)}
                                  {type.charAt(0).toUpperCase() + type.slice(1)}
                                </span>
                              </Badge>
                            ))}
                            {support.type.includes("video") && support.videoUrl && isPlaylistUrl(support.videoUrl) && (
                              <Badge variant="outline" className="bg-red-500/20 text-red-300 border-red-500">
                                <PlaySquare className="h-3 w-3 mr-1" />
                                Playlist
                              </Badge>
                            )}
                          </div>
                        </div>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">{support.name}</CardTitle>
                          <CardDescription className="line-clamp-2">{support.description}</CardDescription>
                        </CardHeader>
                        <CardFooter className="pt-0 flex flex-wrap gap-2">
                          {support.type.includes("video") && support.videoUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-1"
                              onClick={() => handleOpenVideo(support.name, support.videoUrl || "")}
                            >
                              {isPlaylistUrl(support.videoUrl) ? (
                                <PlaySquare className="h-4 w-4" />
                              ) : (
                                <Video className="h-4 w-4" />
                              )}
                              {isPlaylistUrl(support.videoUrl) ? "Watch Playlist" : "Watch Video"}
                            </Button>
                          )}
                          {support.type.includes("pdf") && support.pdfFile && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-1"
                              onClick={() => {
                                const fileUrl = typeof support.pdfFile === "string" ? support.pdfFile : "";
                                handleDownloadPdf(fileUrl, `${support.name.replace(/\s+/g, "_")}.pdf`);
                              }}
                            >
                              <FileText className="h-4 w-4" />
                              Download PDF
                            </Button>
                          )}
                          {support.type.includes("link") && support.linkUrl && (
                            <Button variant="outline" size="sm" className="flex items-center gap-1" asChild>
                              <a href={support.linkUrl} target="_blank" rel="noopener noreferrer">
                                <LinkIcon className="h-4 w-4" />
                                Visit Link
                                <ExternalLink className="h-3 w-3 ml-1" />
                              </a>
                            </Button>
                          )}
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </>
  );
}
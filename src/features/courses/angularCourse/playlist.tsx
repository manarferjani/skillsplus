// frontend/src/features/courses/angularCourse/playlist.tsx
import { useState } from "react";
import { Header } from '@/components/layout/header';
import { Searchh } from '@/components/searchh';
import { Button } from '@/components/ui/button';
import { useNavigate } from '@tanstack/react-router';
import { ThemeSwitch } from '@/components/theme-switch';
import { ProfileDropdown } from '@/components/profile-dropdown';

// Définition de l'interface pour les vidéos
interface Video {
  title: string;
  description: string;
  url: string; // YouTube embed URL
  thumbnail: string;
}

// Composant Playlist
const Playlist = ({ videos }: { videos: Video[] }) => {
  const [currentVideo, setCurrentVideo] = useState<Video>(videos[0]);

  return (
    <div className="flex flex-col md:flex-row p-4 gap-6">
      {/* Video Player */}
      <div className="flex-1">
        <div className="aspect-video w-full mb-4 rounded-xl overflow-hidden shadow-lg">
          <iframe
            width="100%"
            height="100%"
            src={currentVideo.url}
            title={currentVideo.title}
            allowFullScreen
          ></iframe>
        </div>
        <h2 className="text-xl font-semibold mb-2">{currentVideo.title}</h2>
        <p className="text-gray-600">{currentVideo.description}</p>
      </div>

      {/* Playlist Sidebar */}
      <div className="w-full md:w-1/3">
        <h3 className="text-lg font-semibold mb-3">Playlist</h3>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          {videos.map((video, index) => (
            <div
              key={index}
              onClick={() => setCurrentVideo(video)}
              className={`flex items-start gap-3 cursor-pointer p-2 rounded-xl hover:bg-gray-100 transition ${
                video.url === currentVideo.url ? "bg-gray-200" : ""
              }`}
            >
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-24 h-16 rounded-lg object-cover"
              />
              <div>
                <p className="font-medium text-sm">{video.title}</p>
                <p className="text-xs text-gray-500 line-clamp-2">{video.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Données de vidéos
const videos = [
    {
      title: "Introduction to Angular",
      description: "Get started with Angular and understand its core concepts.",
      url: "https://www.youtube.com/embed/k5E2AVpwsko",
      thumbnail: "https://img.youtube.com/vi/k5E2AVpwsko/mqdefault.jpg",
    },
    {
      title: "Angular Components & Modules",
      description: "Learn about Angular components, templates, and modules.",
      url: "https://www.youtube.com/embed/ng3cX3Cz5lQ",
      thumbnail: "https://img.youtube.com/vi/ng3cX3Cz5lQ/mqdefault.jpg",
    },
    {
      title: "Angular Routing and Navigation",
      description: "Understand how to create navigation using Angular Router.",
      url: "https://www.youtube.com/embed/3qBXWUpoPHo",
      thumbnail: "https://img.youtube.com/vi/3qBXWUpoPHo/mqdefault.jpg",
    },
    {
      title: "Angular Forms Tutorial",
      description: "Learn about Template-driven and Reactive Forms in Angular.",
      url: "https://www.youtube.com/embed/7fE7Ya6YwH0",
      thumbnail: "https://img.youtube.com/vi/7fE7Ya6YwH0/mqdefault.jpg",
    },
  ];
  

// Composant principal qui utilise Playlist
export default function AngularCoursePlaylist() {
    const navigate = useNavigate(); // ✅ DOIT être ici
  
    return (
      <>
        <Header>
          <Searchh />
          <div className="ml-auto flex items-center space-x-4">
            <ThemeSwitch />
            <ProfileDropdown />
          </div>
        </Header>
  
        <div className="container mx-auto p-4">
          <div className="flex items-center space-x-2 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate({ to: '/courses/angulardebutante' })}
              className="hover:bg-black hover:text-white w-8 h-8"
            >
              <i className="fas fa-chevron-left" />
            </Button>
            <h1 className="text-3xl font-bold">AngularVideos</h1>
          </div>
  
          <Playlist videos={videos} />
        </div>
      </>
    );
  }
  

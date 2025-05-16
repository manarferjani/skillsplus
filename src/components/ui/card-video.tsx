import { Bookmark, MoreVertical, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from '@tanstack/react-router'; // TanStack
import { useState } from 'react'; // pour gérer l'état de l'affichage du menu
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'; // Assurez-vous d'utiliser la bonne bibliothèque UI pour Dropdown
import { ArrowRight } from "lucide-react"; // Si tu utilises lucide-react pour les icônes

interface CardVideoProps {
  title: string;
  description: string;
  author: string;
  views: number;
  date: string;
  duration: string;
  imageUrl?: string;
  isBookmarked?: boolean;
  playlistId?: string; // Identifiant unique de la playlist
  onBookmark?: () => void;
  onDelete?: () => void; // Fonction pour supprimer
  className?: string;
  image: string; // <- ajoute cette prop
}

export function CardVideo({
  title,
  description,
  author,
  views,
  date,
  duration,
  isBookmarked,
  onBookmark,
  onDelete, // fonction de suppression
  className,
  image,
  playlistId, // Reçoit l'ID de la playlist
}: CardVideoProps) {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // Utilisation de useState

  // Fonction pour basculer l'état de l'affichage du menu
  const handleDropdownToggle = () => {
    setIsDropdownOpen(prevState => !prevState); // Inverse l'état actuel
  };

  return (
    <div className={cn("bg-white rounded-3xl overflow-hidden shadow-md hover:scale-110 transition-transform duration-200", className)}>
      <div className="relative">
        <div className="aspect-video bg-gray-200">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 text-sm rounded">
          {duration}
        </div>
      </div>
      <div className="p-4">
        <div className="relative flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold">{title}</h3>

          {/* Menu à 3 points */}
          {onDelete && (
            <div className="absolute top-2 right-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    onClick={handleDropdownToggle} // Change l'état pour afficher/masquer le menu
                    className="p-1 hover:bg-gray-100 rounded-full"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                {isDropdownOpen && ( // Affiche le menu uniquement si isDropdownOpen est vrai
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={onDelete}
                      className="text-red-600 focus:bg-red-100"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                )}
              </DropdownMenu>
            </div>
          )}
        </div>
        <p className="text-gray-600 text-sm mb-3">{description}</p>
        <div className="flex flex-col gap-2">
          <p className="text-gray-800 font-medium">{author}</p>
          <p className="text-gray-500 text-sm">
            {views.toLocaleString('fr-FR')} Participants • {date}
          </p>
        </div>

        <div className="flex justify-between items-center mt-4">
          <button
            onClick={onBookmark}
            className="text-gray-500 hover:text-gray-700"
          >
            <Bookmark
              className={cn("h-5 w-5", isBookmarked && "fill-current")}
            />
          </button>

          <button
  onClick={() => {
    // Utilisation de playlistId pour naviguer vers le bon playlist personnalisé
    navigate({ to: `/courses/playlist` });
  }}
  className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-500 transition-colors relative z-10"
>
  <ArrowRight
    className="h-5 w-5 transform -rotate-45"
  />
</button>

        </div>
      </div>
    </div>
  );
}

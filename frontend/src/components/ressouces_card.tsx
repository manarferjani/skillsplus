import React from 'react';
import { Link as LinkIcon, Github, MoreVertical, Trash2, FileText } from 'lucide-react'; // Added FileText for PDF icon
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu";

interface ResourceCardProps {
  title: string;
  subtitle: string;
  type: 'pdf' | 'link';
  url?: string; // Only for links
  pdf?: string | File | null; // Accept string (URL) or File object for PDFs
  onDelete?: () => void;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({ title, subtitle, type, url, pdf, onDelete }) => {
  const isPdf = type === 'pdf';
  const isGitHubLink = url?.includes('github.com');

  const linkIcon = isGitHubLink ? (
    <Github className="h-4 w-4 text-black" />
  ) : (
    <LinkIcon className="h-4 w-4 text-blue-600" />
  );

  // Gérer la logique pour créer l'URL pour le PDF
  const pdfUrl = isPdf && pdf && typeof pdf === 'string' ? pdf : (pdf && pdf instanceof File ? URL.createObjectURL(pdf) : undefined);

  return (
    <div className="relative rounded-3xl bg-white text-black p-5 flex flex-col justify-between transition-transform duration-200 hover:scale-105 hover:bg-black hover:text-white shadow-xl overflow-hidden">
      <div className={`absolute top-2 left-2 px-3 py-1 rounded-full text-xs font-medium 
        ${isPdf ? 'bg-indigo-600 text-white' : 'bg-green-600 text-white'}`}>
        {type.toUpperCase()}
      </div>

      {/* Menu à 3 points */}
      {onDelete && (
        <div className="absolute top-2 right-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 hover:bg-gray-100 rounded-full">
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={onDelete}
                className="text-red-600 focus:bg-red-100"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <div className="mt-6">
        <h3 className="font-semibold text-base">{title}</h3>
        <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
      </div>

      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-black transition"
        >
          {linkIcon}
          Open {isPdf ? 'PDF' : isGitHubLink ? 'GitHub' : 'Link'}
        </a>
      )}

      {isPdf && pdfUrl && (
        <div className="mt-4">
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-black transition"
          >
            <FileText className="h-4 w-4 text-red-600" /> {/* Use FileText icon for PDF */}
            Open PDF
          </a>
        </div>
      )}
    </div>
  );
};

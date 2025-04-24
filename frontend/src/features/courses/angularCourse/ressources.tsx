import { ResourceCard } from "@/components/ressouces_card";
import { useState } from 'react';
import { Plus } from "lucide-react";
const sharedStyle = "h-10 px-4 rounded-3xl text-sm transition-colors duration-200";

// Définir le type de ressource
interface Resource {
  id: number;
  title: string;
  description: string;
  type: 'link' | 'pdf';
  url: string | null;
  pdf: string | null; // Le PDF est une chaîne de caractères représentant l'URL du fichier
}

const initialResources: Resource[] = [
  {
    id: 1,
    title: "Angular: From Zero to Hero",
    description: "Master Angular to create modern, interactive web applications.",
    type: "link",
    url: "https://angular.io/tutorials",
    pdf: null,
  },
  {
    id: 2,
    title: "Angular",
    description: "Dive deeper into Angular concepts and best practices.",
    type: "pdf",
    url: null,
    pdf: "/pdfs/angular.pdf", // Chemin relatif du fichier PDF
  },
  {
    id: 3,
    title: "Angular Best Practices",
    description: "Learn the best practices of Angular development.",
    type: "link",
    url: "https://github.com/angular/angular",
    pdf: null,
  },
  {
    id: 4,
    title: "Angular",
    description: "Dive deeper into  Angular concepts  to create interactive web applications.",
    type: "pdf",
    url: null,
    pdf: "/pdfs/angular2.pdf", // Chemin relatif du fichier PDF
  },
];

const ResourceManagement = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [resources, setResources] = useState<Resource[]>(initialResources);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<'link' | 'pdf'>("link");
  const [url, setUrl] = useState("");
  const [pdf, setPdf] = useState<string | null>(null); // Changer pdf à string (chaîne de caractères)

  const toggleModal = () => setIsModalOpen(!isModalOpen);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const newResource: Resource = {
      id: Date.now(),
      title,
      description: "No description provided", // Description par défaut
      type,
      url: type === "link" ? url : null,
      pdf: type === "pdf" ? pdf : null,
    };

    // Ajouter la nouvelle ressource
    setResources([...resources, newResource]);
    toggleModal(); // Fermer le modal après ajout
  };

  const handleDeleteResource = (resourceId: number) => {
    const updatedResources = resources.filter(resource => resource.id !== resourceId);
    setResources(updatedResources); // Supprimer la ressource par ID
  };

  return (
    <div>
      <div className="mt-10 pl-4 flex justify-between items-center">
        <div className="w-[200px] bg-gray-100 shadow-md rounded-3xl px-4 py-2 mb-6 flex items-center justify-center hover:scale-110 transition-transform duration-200">
          <h2 className="text-2xl font-semibold text-gray-800">Ressources</h2>
        </div>

        <div className="flex items-center gap-4 mt-4 sm:mt-0 mr-4">
          <button
    className={`bg-black hover:bg-white text-white hover:text-black flex items-center gap-2 ${sharedStyle}`}
    onClick={toggleModal}
          >
            <Plus className="h-5 w-5" />
            Add
          </button>
        </div>
      </div>

      {/* Modal d'ajout de ressource */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-700 bg-opacity-50 flex justify-center items-center z-50">
          <div className="w-96 bg-white p-6 rounded-3xl shadow-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Add Resource</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-3xl"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="type" className="rounded-3xl block text-sm font-medium text-gray-700">Type</label>
                <select
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value as 'link' | 'pdf')}
                  className="w-full p-2 border border-gray-300 rounded-3xl"
                >
                  <option value="link">Link</option>
                  <option value="pdf">PDF</option>
                </select>
              </div>

              {type === "link" ? (
                <div className="mb-4">
                  <label htmlFor="url" className="block text-sm font-medium text-gray-700">URL</label>
                  <input
                    type="url"
                    id="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-3xl"
                  />
                </div>
              ) : (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pdf file</label>
                  <label htmlFor="pdf" className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-3xl hover:bg-gray-600 transition">
                    <span>Choose a file</span>
                    <input
                      type="file"
                      id="pdf"
                      accept="application/pdf"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          setPdf(URL.createObjectURL(e.target.files[0])); // Créer une URL locale pour le fichier
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  className="bg-gray-300 text-black py-2 px-4 rounded-3xl"
                  onClick={toggleModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-red-800 text-white py-2 px-4 rounded-3xl"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Affichage des ressources */}
      <div className="grid rounded-3xl grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {resources.map((resource) => (
          <ResourceCard
            key={resource.id}
            title={resource.title}
            subtitle={resource.type}
            type={resource.type}
            url={resource.type === "link" ? (resource.url || undefined) : undefined}
            pdf={resource.type === "pdf" ? resource.pdf : undefined} // Passer pdf uniquement si le type est pdf
            onDelete={() => handleDeleteResource(resource.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default ResourceManagement;

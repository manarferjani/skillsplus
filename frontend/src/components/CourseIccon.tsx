// src/components/icons/OnlineCourseIcon.tsx
export function IconOnlineCourse(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Ecran d'ordinateur */}
        <rect x="2" y="3" width="20" height="14" rx="2" />
        
        {/* Support d'écran */}
        <path d="M8 21h8" />
        <path d="M12 17v4" />
        
        {/* Éléments e-learning */}
        <circle cx="12" cy="10" r="1" /> {/* Point de liste 1 */}
        <circle cx="12" cy="13" r="1" /> {/* Point de liste 2 */}
        <path d="M16 10h-4" /> {/* Texte ligne 1 */}
        <path d="M16 13h-4" /> {/* Texte ligne 2 */}
      </svg>
    )
  }
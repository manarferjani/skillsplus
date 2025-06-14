import {
  SiReact,
  SiAngular,
  SiVuedotjs,
  SiExpress,
  SiLaravel,
  SiNextdotjs,
  SiNestjs,
  SiFlutter,
  SiDjango,
  SiSpring,
} from 'react-icons/si';

export const getTechnologyIcon = (technologie: string, className = 'text-xl') => {
  const props = { className }; // on centralise les props ici

  switch (technologie.toLowerCase()) {
    case 'react':
    case 'react.js':
      return <SiReact {...props} style={{ color: '#61DAFB' }} />;
    case 'angular':
      return <SiAngular {...props} style={{ color: '#DD0031' }} />;
    case 'vue':
    case 'vue.js':
      return <SiVuedotjs {...props} style={{ color: '#42b883' }} />;
    case 'express':
    case 'express.js':
      return <SiExpress {...props} style={{ color: '#000000' }} />;
    case 'laravel':
      return <SiLaravel {...props} style={{ color: '#F9322C' }} />;
    case 'next':
    case 'next.js':
      return <SiNextdotjs {...props} style={{ color: '#000000' }} />;
    case 'nestjs':
      return <SiNestjs {...props} style={{ color: '#E0234E' }} />;
    case 'flutter':
      return <SiFlutter {...props} style={{ color: '#02569B' }} />;
    case 'django':
      return <SiDjango {...props} style={{ color: '#092E20' }} />;
    case 'spring':
    case 'spring boot':
      return <SiSpring {...props} style={{ color: '#6DB33F' }} />;
    default:
      return null;
  }
};

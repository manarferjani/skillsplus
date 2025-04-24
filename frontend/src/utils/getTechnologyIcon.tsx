import { SiReact, SiAngular, SiVuedotjs, SiFlutter, SiNextdotjs } from 'react-icons/si';

export const getTechnologyIcon = (technologie: string) => {
  switch (technologie.toLowerCase()) {
    case 'react':
      return <SiReact />;
    case 'angular':
      return <SiAngular />;
    case 'vue':
    case 'vue.js':
      return <SiVuedotjs />;
    case 'flutter':
      return <SiFlutter />;
    case 'next':
    case 'next.js':
      return <SiNextdotjs />;
    default:
      return null;
  }
};

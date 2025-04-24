// src/services/technologyService.ts

import axios from 'axios';
import { Technology } from '../interfaces/technology.interface.ts'; // Tu peux aussi définir l'interface ici si tu préfères

export const fetchTechnologies = async (): Promise<Technology[]> => {
  const response = await axios.get('/api/technologies');
  return response.data;
};

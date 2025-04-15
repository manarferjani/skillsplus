const API_URL = 'http://localhost:5000/api';

export const fetchCourses = async () => {
  const response = await fetch(`${API_URL}/courses`);
  if (!response.ok) {
    throw new Error('Erreur lors de la récupération des cours');
  }
  return await response.json();
};

export const updateCourse = async (courseId, updates) => {
  const response = await fetch(`${API_URL}/courses/${courseId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });
  
  if (!response.ok) {
    throw new Error('Erreur lors de la mise à jour du cours');
  }
  
  return await response.json();
};

export const createCourse = async (courseData) => {
  const response = await fetch(`${API_URL}/courses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(courseData),
  });
  
  if (!response.ok) {
    throw new Error('Erreur lors de la création du cours');
  }
  
  return await response.json();
};
// src/contexts/SavedCoursesContext.tsx

import { createContext, useContext, useState, ReactNode } from 'react';

type Course = {
  id: string;
  title: string;
  description: string;
  author: string;
  views: number;
  date: string;
  duration: string;
  image: string;
};

type SavedCoursesContextType = {
    savedCourses: Course[];
    addCourse: (course: Course) => void;
    removeCourse: (courseId: string) => void;  // Change to string
  };
  

const SavedCoursesContext = createContext<SavedCoursesContextType | undefined>(undefined);

export function SavedCoursesProvider({ children }: { children: ReactNode }) {
  const [savedCourses, setSavedCourses] = useState<Course[]>([]);

  const addCourse = (course: Course) => {
    // Ne pas ajouter deux fois le même cours
    setSavedCourses((prev) =>
      prev.some(c => c.id === course.id) ? prev : [...prev, course]
    );
  };

  const removeCourse = (courseId: string) => {
    setSavedCourses((prev) => prev.filter(course => course.id !== courseId)); // Compare strings
  };
  return (
    <SavedCoursesContext.Provider value={{ savedCourses, addCourse, removeCourse }}>
      {children}
    </SavedCoursesContext.Provider>
  );
}

export function useSavedCourses() {
  const context = useContext(SavedCoursesContext);
  if (!context) {
    throw new Error('useSavedCourses must be used within a SavedCoursesProvider');
  }
  return context;
}

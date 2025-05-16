 import { createLazyFileRoute } from '@tanstack/react-router'
 import AngularCoursePlaylist from '@/features/courses/angularCourse/playlist'
 
 export const Route = createLazyFileRoute('/_authenticated/courses/playlist')({
   component: AngularCoursePlaylist,
 })
 
  
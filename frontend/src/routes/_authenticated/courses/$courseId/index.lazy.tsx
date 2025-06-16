import { createLazyFileRoute, Outlet } from '@tanstack/react-router';
import CourseDetailPage from '@/features/courses/Course/CourseDetailPage';

export const Route = createLazyFileRoute('/_authenticated/courses/$courseId/')({
  component: CourseDetailRouteComponent,
});

function CourseDetailRouteComponent() {
  const { courseId } = Route.useParams();

  return (
    <div>
      <CourseDetailPage courseId={courseId} />

      {/* Ceci rendra les sous-routes, comme /levels/$levelId */}
      <Outlet />
    </div>
  );
}

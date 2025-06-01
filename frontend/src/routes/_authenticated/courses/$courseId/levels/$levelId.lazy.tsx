import { createLazyFileRoute, Outlet } from '@tanstack/react-router';
import { LevelDetailPage } from '@/features/courses/Course/LevelDetailPage';

export const Route = createLazyFileRoute('/_authenticated/courses/$courseId/levels/$levelId')({
  component: LevelDetailPageRouteComponent,
});

function LevelDetailPageRouteComponent() {
  const { courseId } = Route.useParams();
    const { levelId } = Route.useParams();


  return (
    <div>
      <LevelDetailPage courseId={courseId} levelId={levelId}/>

      {/* Ceci rendra les sous-routes, comme /levels/$levelId */}
      <Outlet />
    </div>
  );
}

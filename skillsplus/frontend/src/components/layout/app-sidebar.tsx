import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';
import { NavGroup as NavGroupComponent } from '@/components/layout/nav-group';
import { NavUser } from '@/components/layout/nav-user';
import { TeamSwitcher } from '@/components/layout/team-switcher';
import { sidebarData } from './data/sidebar-data';
import type { NavGroup, NavItem } from '@/components/layout/types';
import { useAuth } from '@/context/authContext';

// Définition du type pour les props de NavUser
type NavUserProps = React.ComponentProps<typeof NavUser>;

export function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { user, isLoading } = useAuth();

  const filterNavGroups = (navGroups: NavGroup[]): NavGroup[] => {
    if (isLoading) return [];

    return navGroups
      .map((group): NavGroup => ({
        ...group,
        items: group.items.filter((item: NavItem): boolean => {
          // Correction du type pour item.visible
          if (typeof item.visible !== 'undefined') {
            return !!user?.role && item.visible.includes(user.role);
          }
          return true;
        }),
      }))
      .filter(group => group.items.length > 0);
  };

  const filteredNavGroups = filterNavGroups(sidebarData.navGroups);

  if (isLoading) {
    return <div>Chargement des permissions...</div>;
  }

  // Création de l'objet user pour NavUser avec le bon typage
  const navUserData: NavUserProps['user'] = {
    ...sidebarData.user,
    name: user?.name || sidebarData.user.name,
    // On ajoute role seulement si le composant NavUser le supporte
    ...(user?.role ? { role: user.role } : {})
  };

  return (
    <Sidebar
      collapsible="icon"
      variant="floating"
      className="bg-background"
      {...props}
    >
      <SidebarHeader className="bg-background">
        <TeamSwitcher teams={sidebarData.teams} />
      </SidebarHeader>

      <SidebarContent className="bg-background">
        {filteredNavGroups.map((group) => (
          <NavGroupComponent key={group.title} {...group} />
        ))}
      </SidebarContent>

      <SidebarFooter className="bg-background">
        <NavUser user={navUserData} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';
import { useSidebar } from '@/context/SidebarContext';
import { NavGroup as NavGroupComponent } from '@/components/layout/nav-group';
import { NavUser } from '@/components/layout/nav-user';
import { TeamSwitcher } from '@/components/layout/team-switcher';
import { sidebarData } from './data/sidebar-data';
import type { NavGroup, NavItem } from '@/components/layout/types';
import { useAuth } from '@/context/authContext';

type NavUserProps = React.ComponentProps<typeof NavUser>;

export function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { user, isLoading } = useAuth();
  const { unreadCount } = useSidebar();

  // Met à jour le badge sur l'item "Chats"
  const sidebarDataWithBadge = {
    ...sidebarData,
    navGroups: sidebarData.navGroups.map((group) => ({
      ...group,
      items: group.items.map((item) =>
        item.title === 'Chats'
          ? { ...item, badge: unreadCount > 0 ? unreadCount.toString() : '' }
          : item
      ),
    })),
  };

  // Filtre les groupes selon la visibilité et le rôle de l'utilisateur
  const filterNavGroups = (navGroups: NavGroup[]): NavGroup[] => {
    if (isLoading) return [];

    return navGroups
      .map((group): NavGroup => ({
        ...group,
        items: group.items.filter((item: NavItem): boolean => {
          if (typeof item.visible !== 'undefined') {
            return !!user?.role && item.visible.includes(user.role);
          }
          return true;
        }),
      }))
      .filter((group) => group.items.length > 0);
  };

  // Applique le filtre sur la data avec badge
  const filteredNavGroups = filterNavGroups(sidebarDataWithBadge.navGroups);

  if (isLoading) {
    return <div>Chargement des permissions...</div>;
  }

  const navUserData: NavUserProps['user'] = {
    ...sidebarData.user,
    name: user?.name || sidebarData.user.name,
    ...(user?.role ? { role: user.role } : {}),
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

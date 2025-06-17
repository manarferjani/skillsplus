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
import { useMemo } from 'react';

type NavUserProps = React.ComponentProps<typeof NavUser>;

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, isLoading } = useAuth();
  const { unreadCount } = useSidebar();

 const sidebarDataWithBadge = useMemo(() => ({
  ...sidebarData,
  navGroups: sidebarData.navGroups.map((group) => ({
    ...group,
    items: group.items.map((item) => {
      if (item.title === 'Chats') {
        // Appelle la fonction getBadge si elle existe
        const badge = item.getBadge ? item.getBadge(unreadCount) : null;
        return {
          ...item,
          ...(badge ? { badge } : {}),
        };
      }
      return item;
    }),
  })),
}), [unreadCount]);



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
    <Sidebar collapsible="icon" variant="floating" className="bg-background" {...props}>
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
import Calendar from "@/features/calendar/calendar-app/calendar-app"
import { Header } from '@/components/layout/header'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'

const Index = () => {
  return (
    <div className="bg-calendarBg min-h-screen">
      <Header>
        <div className="ml-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>
      <Calendar />
    </div>
  );
};


export default Index;

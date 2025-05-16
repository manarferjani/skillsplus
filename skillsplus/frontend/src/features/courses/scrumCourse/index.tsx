import { Header } from '@/components/layout/header'
import { Searchh } from '@/components/searchh'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'
import ScrumCourse from "./scrumCourse"

const Index = () => {
  return (
    <>
      <Header>
        <Searchh />
        <div className="ml-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>
            <ScrumCourse />
      
    </>
  );
};

export default Index;

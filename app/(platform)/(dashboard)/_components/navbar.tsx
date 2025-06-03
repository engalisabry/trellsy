import { Plus } from 'lucide-react';
import { Logo } from '@/components/logo';
import { OrganizationSwitcher } from '@/components/organizations-switcher';
import { Button } from '@/components/ui/button';
import { UserProfile } from '@/components/user-profile';
import { MobileSidebar } from './mobile-sidebar';

const Navbar = () => {
  return (
    <nav className='fixed top-0 z-50 flex h-14 w-full items-center border-b px-4 shadow-sm'>
      <MobileSidebar />
      <div className='flex items-center gap-x-4'>
        <div className='mr-3'>
          <Logo />
        </div>
      </div>
      <Button
        size='sm'
        className='hidden h-auto rounded-sm px-2 py-1.5 md:block'
      >
        Create
      </Button>
      <Button
        size='sm'
        className='block rounded-sm md:hidden'
      >
        <Plus className='h-4 w-4' />
      </Button>
      <div className='ml-auto flex items-center gap-x-2'>
        <OrganizationSwitcher />
        <UserProfile />
      </div>
    </nav>
  );
};

export default Navbar;

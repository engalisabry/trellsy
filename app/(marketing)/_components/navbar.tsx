import Link from 'next/link';
import { Logo } from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';

export const Navbar = () => {
  return (
    <nav className='fixed top-0 flex h-14 w-full items-center border-b px-4 shadow-sm'>
      <div className='mx-auto flex w-full items-center justify-between md:max-w-screen-2xl'>
        <Logo />
        <div className='flex w-full items-center justify-end gap-3 space-x-4 md:block md:w-auto md:justify-between md:gap-0'>
          <ThemeToggle />
          <Button
            size='sm'
            variant='ghost'
            asChild
          >
            <Link href='/auth/login'>Login</Link>
          </Button>
          <Button
            size='sm'
            asChild
          >
            <Link href='/auth/sign-up'>Get Trellsy for free</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
};

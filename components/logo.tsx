import localFont from 'next/font/local';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const calFontHeading = localFont({
  src: '../public/fonts/CalSans-SemiBold.woff2',
});

const Logo = () => {
  return (
    <div className='w-[35%] gap-x-2 transition hover:opacity-75 md:flex md:w-auto md:items-center'>
      <Link
        href='/'
        className='flex w-fit items-center justify-start gap-2'
      >
        <Image
          src='/logo.svg'
          alt='logo'
          width='35'
          height='35'
          className='scale-150'
        />
        <p className={cn('pb-1 text-lg', calFontHeading.className)}>Trellsy</p>
      </Link>
    </div>
  );
};

export default Logo;

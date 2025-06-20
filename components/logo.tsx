import localFont from 'next/font/local';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils/utils';

const calFontHeading = localFont({
  src: '../public/fonts/CalSans-SemiBold.woff2',
});

export const Logo = () => {
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
          priority
          className='scale-150'
        />
        <p className={cn('relative pb-1 text-lg', calFontHeading.className)}>
          Trellsy
          <span className='absolute right-0 -bottom-1.5 text-xs text-gray-500'>
            BETA
          </span>
        </p>
      </Link>
    </div>
  );
};

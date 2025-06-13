import { Poppins } from 'next/font/google';
import localFont from 'next/font/local';
import Link from 'next/link';
import { Medal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const calFontHeading = localFont({
  src: '../../public/fonts/CalSans-SemiBold.woff2',
});

const poppinsFontText = Poppins({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500'],
});

const Page = () => {
  return (
    <div className='flex flex-col items-center justify-center'>
      <div
        className={cn(
          'flex flex-col items-center justify-between gap-y-3',
          calFontHeading.className,
        )}
      >
        <div className='mb-4 flex items-center rounded-full border p-4 text-amber-700 uppercase shadow-sm'>
          <Medal className='mr-2 h-6 w-6' />
          No 1 task management
        </div>
        <h1 className='mb-10 text-center text-3xl text-[var(--primary)] md:text-6xl'>
          Trellsy helps team move
        </h1>
        <div className='w-fit space-x-10 rounded-md px-4 text-center text-3xl md:text-6xl'>
          Work forward.
          {/* Wavy Line Icon */}
          <svg
            className='-mt-2 ml-[50%] w-[90px] md:ml-[55%] md:w-[180px] md:stroke-3'
            width='180'
            height='20'
            viewBox='0 0 200 20'
            xmlns='http://www.w3.org/2000/svg'
          >
            <path
              d='M 0 10 Q 25 20, 50 10 T 100 10 T 150 10 T 200 10'
              fill='none'
              stroke='#fcbc73'
              strokeWidth='1'
              strokeLinecap='round'
            />
          </svg>
        </div>
      </div>
      <div
        className={cn(
          'mx-auto mt-4 max-w-xs text-center text-sm leading-7 md:max-w-2xl md:text-xl',
          poppinsFontText.className,
        )}
      >
        collaborate, manage projects, and reach new productivity. From high
        rises to the home office, the way your team works is unique - accomplish
        it all with Trellsy.
      </div>

      <Button
        className='mt-6'
        size='lg'
        asChild
      >
        <Link href='/auth/sign-up'>Get Trellsy for free.</Link>
      </Button>
    </div>
  );
};

export default Page;

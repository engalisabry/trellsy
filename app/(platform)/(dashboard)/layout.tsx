import Navbar from './_components/navbar';
import { ProtectedRoute } from '@/components/protected-route';

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <ProtectedRoute>
      <div className='h-full'>
        <Navbar />
        {children}
      </div>
    </ProtectedRoute>
  );
};

export default Layout;

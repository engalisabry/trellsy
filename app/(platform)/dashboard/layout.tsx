import Navbar from './_components/navbar';

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className='flex'>
      <Navbar />
      {children}
    </div>
  );
};

export default Layout;

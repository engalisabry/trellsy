import { OrgControl } from './_components/org-control';

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <OrgControl />
      {children}
    </>
  );
};

export default Layout;

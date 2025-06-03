'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useOrganizationStore } from '@/lib/stores';

export const OrgControl = () => {
  const params = useParams();
  const router = useRouter();
  const { organizations, isLoading, setCurrentOrganization } =
    useOrganizationStore();

  useEffect(() => {
    if (isLoading) return; // Wait for loading to finish

    const orgSlug = params.slug;
    const orgExists = (Array.isArray(organizations) ? organizations : []).some(
      (org) => org.slug === orgSlug,
    );

    if (orgExists) {
      setCurrentOrganization(orgSlug as string);
    } else if (organizations.length > 0) {
      router.push(`/organization/${organizations[0].slug}`);
    }
  }, [params.slug, organizations, isLoading, router, setCurrentOrganization]);

  return null;
};

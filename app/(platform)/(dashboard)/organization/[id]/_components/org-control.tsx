'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useOrganizationStore } from '@/lib/stores';

export const OrgControl = () => {
  const params = useParams();
  const router = useRouter();
  const { organizations } = useOrganizationStore();

  useEffect(() => {
    const orgId = params.id as string;
    const orgExists = organizations.some((org) => org.id === orgId);

    if (!orgExists && organizations.length > 0) {
      router.push(`/organization/${organizations[0].id}`);
    }
  }, [params.id, organizations, router]);

  return null;
};

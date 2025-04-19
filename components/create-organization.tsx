'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { uploadOrganizationLogo } from '@/lib/services/organization.service';
import { useOrganizationStore } from '@/lib/stores';
import { slugify } from '@/lib/utils';

export function CreateOrganization() {
  const router = useRouter();
  const { createOrganization, isLoading } = useOrganizationStore();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [logo, setLogo] = useState<File | null>(null);
  const [localLoading, setLocalLoading] = useState(false);

  // Combine local and store loading states
  const isSubmitting = isLoading || localLoading;

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);

    setSlug(slugify(newName));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !slug) {
      return;
    }
    let logo_url = null;
    if (logo) {
      logo_url = await uploadOrganizationLogo(logo, slug);
    }

    try {
      setLocalLoading(true);
      await createOrganization({ name, slug, logo_url });

      router.push('/organization');
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error creating organization',
      );
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <div className='flex flex-col gap-6'>
      <form
        onSubmit={handleSubmit}
        className='space-y-4 pt-4'
      >
        <div className='space-y-2'>
          <Label htmlFor='name'>Organization Name</Label>
          <Input
            id='name'
            placeholder='Acme Inc.'
            value={name}
            onChange={handleNameChange}
            disabled={isSubmitting}
            required
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='slug'>Slug (URL-friendly name)</Label>
          <Input
            id='slug'
            placeholder='acme-inc'
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            disabled={isSubmitting}
            required
          />
          <p className='text-muted-foreground text-xs'>
            This will be used in URLs: trellsy.com/organization/
            {slug || 'your-slug'}
          </p>
        </div>
        <div className='space-y-2'>
          <Label htmlFor='logo'>Logo</Label>
          <Input
            id='logo'
            type='file'
            onChange={(e) => setLogo(e.target.files?.[0] || null)}
            disabled={isSubmitting}
            required
          />
        </div>

        <Button
          type='submit'
          className='w-full'
          disabled={isSubmitting || !name || !slug}
        >
          {isSubmitting ? 'Creating...' : 'Create Organization'}
        </Button>
      </form>
    </div>
  );
}

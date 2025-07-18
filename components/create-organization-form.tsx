'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  checkSlugAvailabilityAction,
  createOrganizationAction,
} from '@/actions/organization';
import { toast } from 'sonner';
import { slugify } from '@/lib/utils/utils';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Text } from './ui/text';

export function CreateOrganizationForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [logo, setLogo] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSlugAvailable, setIsSlugAvailable] = useState<boolean | undefined>(
    undefined,
  );
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);

  // Check slug availability when it changes
  useEffect(() => {
    const checkSlug = async () => {
      if (!slug || slug.length < 3) {
        setIsSlugAvailable(undefined);
        return;
      }

      setIsCheckingSlug(true);
      try {
        const result = await checkSlugAvailabilityAction(slug);
        if (result.success) {
          setIsSlugAvailable(result.available);
        } else {
          console.error('Error checking slug availability:', result.error);
          setIsSlugAvailable(undefined);
        }
      } catch (error) {
        console.error('Error checking slug availability:', error);
        setIsSlugAvailable(undefined);
      } finally {
        setIsCheckingSlug(false);
      }
    };

    // Use a debounce to avoid too many requests
    const debounceTimer = setTimeout(checkSlug, 500);
    return () => clearTimeout(debounceTimer);
  }, [slug]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    setSlug(slugify(newName));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setLogo(file);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!name.trim()) {
      toast.error('Organization name is required');
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('slug', slug.trim());
      if (logo) {
        formData.append('logo', logo);
      }

      const result = await createOrganizationAction(formData);

      if (result.success) {
        toast.success(`Organization "${name}" created successfully!`);
        router.push('/organization');
      } else {
        toast.error(
          result.error || 'Failed to create organization. Please try again.',
        );
      }
    } catch (error) {
      console.error('Create organization error:', error);
      toast.error(
        'Failed to create organization. Please check your input and try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='mx-auto max-w-md p-6'>
      <form
        onSubmit={handleSubmit}
        className='space-y-4 border'
      >
        <div className='space-y-2'>
          <Label htmlFor='name'>Organization Name</Label>
          <Input
            id='name'
            type='text'
            placeholder='Acme Inc.'
            value={name}
            onChange={handleNameChange}
            disabled={loading}
            required
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='slug'>Slug</Label>
          <Input
            id='slug'
            type='text'
            placeholder='acme-inc'
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            disabled={loading}
            required
            className={isSlugAvailable === false ? 'border-red-500' : undefined}
          />
          {isCheckingSlug && slug.length >= 3 && (
            <Text
              size='sm'
              variant='muted'
            >
              Checking availability...
            </Text>
          )}
          {!isCheckingSlug && isSlugAvailable === false && (
            <Text
              size='sm'
              variant='error'
            >
              This slug is already taken. Please choose another one.
            </Text>
          )}
          {!isCheckingSlug && isSlugAvailable === true && (
            <Text
              size='sm'
              className='text-green-500'
            >
              This slug is available!
            </Text>
          )}
        </div>

        <div className='space-y-2'>
          <Label htmlFor='logo'>Logo (Optional)</Label>
          <Input
            id='logo'
            type='file'
            accept='image/*'
            onChange={handleLogoChange}
            disabled={loading}
          />
        </div>

        <Button
          type='submit'
          disabled={
            loading ||
            !name ||
            !slug ||
            isSlugAvailable === false ||
            (isCheckingSlug && slug.length >= 3)
          }
          className='w-full'
        >
          {loading ? 'Creating...' : 'Create Organization'}
        </Button>
      </form>
    </div>
  );
}

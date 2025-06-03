'use client';

import { FormEvent, useState } from 'react';
import { toast } from 'sonner';
import { createOrganization } from '@/lib/services/organization.service';
import { slugify } from '@/lib/utils';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

export function CreateOrganizationForm() {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [logo, setLogo] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

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
      const result = await createOrganization({
        name: name.trim(),
        slug: slug.trim(),
        logo: logo ?? undefined,
      });

      if (result) {
        toast.success(`Organization "${name}" created successfully!`);
        // Reset form
        setName('');
        setSlug('');
        setLogo(null);
        (e.target as HTMLFormElement).reset();
      }
    } catch (error) {
      toast.error('Failed to create organization');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Organization Name</Label>
          <Input
            id="name"
            type="text"
            placeholder="Acme Inc."
            value={name}
            onChange={handleNameChange}
            disabled={loading}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            type="text"
            placeholder="acme-inc"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="logo">Logo (Optional)</Label>
          <Input
            id="logo"
            type="file"
            accept="image/*"
            onChange={handleLogoChange}
            disabled={loading}
          />
        </div>

        <Button 
          type="submit" 
          disabled={loading || !name || !slug}
          className="w-full"
        >
          {loading ? 'Creating...' : 'Create Organization'}
        </Button>
      </form>
    </div>
  );
}

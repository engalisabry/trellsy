'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';

export function CreateOrganization() {
  const supabase = createClient();
  const router = useRouter();
  const [name, setName] = useState('');
  const [logo, setLogo] = useState<File | null>(null);
  const [role, setRole] = useState<'admin' | 'member'>('admin');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');

      {
        /* Create organization */
      }

      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name,
          slug: name.toLowerCase().replace(/\s+/g, '-'),
        })
        .select()
        .single();

      if (orgError) return toast.error(orgError.message);

      {
        /* Upload Org Logo */
      }
      if (logo) {
        const fileExt = logo.name.split('.').pop();
        const fileName = `${orgData.id}-${Date.now()}.${fileExt}`;
        const filePath = `org-logos/${fileName}`;

        const { data: buckets } = await supabase.storage.listBuckets();
        if (!buckets?.some((b) => b.name === 'organization-logos')) {
          await supabase.storage.createBucket('organization-logos', {
            public: true,
            allowedMimeTypes: ['image/*'],
            fileSizeLimit: 5 * 1024 * 1024, // 5MB
          });
        }

        const { error: uploadError } = await supabase.storage
          .from('organization-logos')
          .upload(filePath, logo);

        if (!uploadError) {
          const {
            data: { publicUrl },
          } = supabase.storage
            .from('organization-logos')
            .getPublicUrl(filePath);

          await supabase
            .from('organizations')
            .update({ logo_url: publicUrl })
            .eq('id', orgData.id);
        }
      }

      // Add current user with selected role
      await supabase.from('organization_members').insert({
        organization_id: orgData.id,
        user_id: session.user.id,
        role: role,
      });

      {
        /* fetch user's organizations */
      }
      const fetchUserOrganizations = async () => {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('organization_members')
          .select(
            `
            organization_id, 
            organizations:organizations!inner(name)
          `,
          )
          .eq('user_id', user.id);

        // if (!error && data) {
        //   console.log('Organizations data:', data);
        //   // @ts-expect-error - Supabase returns correct shape that matches our interface
        //   setOrganizations(data as OrganizationMember[]);
        // }
      };

      toast.success('Organization created successfully!');
      await fetchUserOrganizations();
      router.push(`/organization`);
    } catch (error) {
      console.error('Error:', error);
      toast.error(
        error instanceof Error ? error.message : 'Organization creation failed',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='flex flex-col gap-6'>
      <Card>
        <CardHeader>
          <CardTitle className='text-2xl'>Create Organization</CardTitle>
          <CardDescription>
            Set up your organization to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className='flex flex-col gap-6'>
              <div className='grid gap-2'>
                <Label htmlFor='name'>Organization Name</Label>
                <Input
                  id='name'
                  type='text'
                  placeholder='Acme Inc'
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='logo'>Logo (Optional)</Label>
                <Input
                  id='logo'
                  type='file'
                  accept='image/*'
                  onChange={(e) => setLogo(e.target.files?.[0] || null)}
                />
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='role'>Your Role</Label>
                <Select
                  value={role}
                  onValueChange={(value: 'admin' | 'member') => setRole(value)}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder='Select role' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='admin'>Admin</SelectItem>
                    <SelectItem value='member'>Member</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type='submit'
                className='w-full'
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Organization'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { handleError } from '@/lib/error-handling';
import { useOrganizationStore } from '@/lib/stores';
import { Invitations } from './invitation';
import { Members } from './members';

export const OrganizationProfile = () => {
  const {
    organizations,
    memberships,
    invitations,
    isLoading,
    error,
    fetchOrganizations,
    fetchInvitations,
    inviteMember,
    resendInvitation,
    revokeInvitation,
    isSuccess,
  } = useOrganizationStore();

  const organization = organizations[0];
  const orgId = organization?.id;
  const members = isSuccess
    ? memberships.filter((m) => m.organization_id === orgId)
    : [];

  const [isMounted, setIsMounted] = useState<boolean>(false);

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviteLoading, setInviteLoading] = useState(false);

  useEffect(() => {
    if (orgId) {
      fetchOrganizations();
      fetchInvitations(orgId);
    }
  }, [orgId]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteEmail) return;

    setInviteLoading(true);

    try {
      await inviteMember(orgId, inviteEmail, inviteRole);

      toast.success('Invitation sent!');
      setInviteEmail('');
      setInviteRole('member');
    } catch (error) {
      handleError('unknown', {
        defaultMessage: 'Failed to sent invitation',
        showToast: true,
      });
    } finally {
      setInviteLoading(false);
    }
  };

  const handleResend = async (invitationId: string) => {
    try {
      await resendInvitation(invitationId);
      toast.success('Invitation resent!');
    } catch (error) {
      handleError('unknown', {
        defaultMessage: 'Failed to resend invitation',
        showToast: true,
      });
    }
  };

  const handleRevoke = async (invitationId: string) => {
    try {
      await revokeInvitation(invitationId);
      toast.success('Invitation revoked!');
    } catch (error) {
      handleError('unknown', {
        defaultMessage: 'Failed to revoke invitation',
        showToast: true,
      });
    }
  };

  return (
    <div className='space-y-8'>
      {/* Org Info */}
      <Card className='flex flex-col gap-2 p-6'>
        <div className='flex items-center gap-4'>
          <Avatar className='h-12 w-12'>
            <AvatarImage
              src={organization?.logo_url as string}
              alt={organization?.name}
            />
            <AvatarFallback>
              {organization?.name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className='text-lg font-bold'>{organization?.name}</div>
            <div className='text-muted-foreground text-xs'>
              Slug: {organization?.slug}
            </div>
            <div className='text-muted-foreground text-xs'>
              Created:{' '}
              {organization?.created_at
                ? new Date(organization.created_at).toLocaleDateString()
                : '-'}
            </div>
          </div>
        </div>
      </Card>
      <Separator />

      {/* Members */}
      <div>
        <h2 className='mb-2 text-lg font-semibold'>Members</h2>
        {isLoading ? (
          <Skeleton className='h-32 w-full' />
        ) : (
          <Members members={members} />
        )}
      </div>

      <Separator />

      {/* Invitations */}
      <div>
        <h2 className='mb-2 text-lg font-semibold'>Invitations</h2>
        <form
          onSubmit={handleInvite}
          className='mb-4 flex gap-2'
        >
          <Input
            type='email'
            placeholder='Invite by email'
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
            disabled={inviteLoading}
          />
          <Select
            value={inviteRole}
            onValueChange={setInviteRole}
            disabled={inviteLoading}
          >
            <SelectTrigger className='w-[120px]'>
              <SelectValue placeholder='Role' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='member'>Member</SelectItem>
              <SelectItem value='admin'>Admin</SelectItem>
            </SelectContent>
          </Select>
          <Button
            type='submit'
            disabled={inviteLoading || !inviteEmail}
          >
            {inviteLoading ? 'Inviting...' : 'Invite'}
          </Button>
        </form>
        {isLoading ? (
          <Skeleton className='h-24 w-full' />
        ) : (
          <Invitations
            handleResend={handleResend}
            handleRevoke={handleRevoke}
            invitations={invitations}
          />
        )}
      </div>
      {error && <div className='text-sm text-red-500'>{error.message}</div>}
    </div>
  );
};

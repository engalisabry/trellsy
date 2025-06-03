import { OrganizationInvitation } from '@/types';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

type InvitaionsProps = {
  invitations: OrganizationInvitation[];
  handleResend: (invitationId: string) => void;
  handleRevoke: (invitationId: string) => void;
};

export const Invitations = ({
  invitations,
  handleResend,
  handleRevoke,
}: InvitaionsProps) => {
  if (invitations.length === 0) {
    return <div className='text-muted-foreground'>No invitations yet.</div>;
  }

  return (
    <div className='space-y-2'>
      {(Array.isArray(invitations) ? invitations : []).map((inv) => (
        <Card
          key={inv.id}
          className='flex items-center justify-between p-4'
        >
          <div>
            <div className='font-medium'>{inv.email}</div>
            <div className='text-muted-foreground text-xs'>
              Role: {inv.role}
            </div>
          </div>
          <div className='text-muted-foreground text-xs'>
            Invited:{' '}
            {inv.created_at
              ? new Date(inv.created_at).toLocaleDateString()
              : '-'}
          </div>
          <div className='flex gap-2'>
            {inv.status === 'pending' && (
              <>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => handleResend(inv.id)}
                >
                  Resend
                </Button>
                <Button
                  size='sm'
                  variant='destructive'
                  onClick={() => handleRevoke(inv.id)}
                >
                  Revoke
                </Button>
              </>
            )}
            {inv.status === 'accepted' && (
              <span className='text-xs text-green-600'>Accepted</span>
            )}
            {inv.status === 'revoked' && (
              <span className='text-xs text-red-500'>Revoked</span>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};

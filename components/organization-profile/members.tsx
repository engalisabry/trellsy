import { OrganizationMember } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Card } from '../ui/card';

export const Members = ({ members }: { members: OrganizationMember[] }) => (
  <div className='space-y-2'>
    {members.length === 0 ? (
      <div className='text-muted-foreground'>No members yet.</div>
    ) : (
      members.map((member) => (
        <Card
          key={member.id}
          className='flex items-center justify-between p-4'
        >
          <div className='flex items-center gap-3'>
            <Avatar className='h-8 w-8'>
              <AvatarImage
                src={member.avatar_url || ''}
                alt={member.user_id}
              />
              <AvatarFallback>
                {member.user_id?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className='font-medium'>{member.user_id}</div>
              <div className='text-muted-foreground text-xs'>
                Role: {member.role}
              </div>
            </div>
          </div>
          <div className='text-muted-foreground text-xs'>
            Joined:{' '}
            {member.created_at
              ? new Date(member.created_at).toLocaleDateString()
              : '-'}
          </div>
          {/* Optionally: Add admin actions here */}
        </Card>
      ))
    )}
  </div>
);

import { MobileSidebarProps } from '@/types';
import { create } from 'zustand';

export const useMobileSidebar = create<MobileSidebarProps>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
}));

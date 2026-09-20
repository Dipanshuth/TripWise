import { User } from '../types';

export const mockUser: User = {
  id: 'u1',
  name: 'Dipanshu Thakur',
  email: 'thakurdipanshu047@gmail.com',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80',
  preferences: {
    budgetStyle: 'Balanced',
    preferredLength: 5,
    favouriteTypes: ['Mountains', 'Heritage']
  }
};

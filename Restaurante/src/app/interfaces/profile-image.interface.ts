import { Timestamp } from 'rxjs';

export interface Profile_Photo {
  id: number;
  url: string;
  name: string;
  created_at: Date;
}
export function Profile_Photo(): Profile_Photo {
  return {
    id: 0,
    url: '',
    name: '',
    created_at: new Date(),
  };
}

import { Inngest } from 'inngest';

export const inngest = new Inngest({
  id: 'doc-reader',
  name: 'Documentation Reader',
});

export type Events = {
  'guide/process.requested': {
    data: {
      guideId: string;
      url: string;
      userId: string;
    };
  };
  'guide/process.completed': {
    data: {
      guideId: string;
      success: boolean;
      error?: string;
    };
  };
};

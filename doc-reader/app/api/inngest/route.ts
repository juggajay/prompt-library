import { serve } from 'inngest/next';
import { inngest } from '@/inngest/client';
import { processDocumentation } from '@/inngest/functions/process-documentation';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [processDocumentation],
});

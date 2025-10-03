import { serve } from 'inngest/vercel';
import { inngest } from '../src/inngest/client';
import { processDocumentation } from '../src/inngest/functions/process-documentation';

export default serve({
  client: inngest,
  functions: [processDocumentation],
});

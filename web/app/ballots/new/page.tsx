import { Suspense } from 'react';
export const dynamic = 'force-dynamic';

// Server component wrapper that provides a Suspense boundary for the client component
export default function NewBallotPage(){
  return (
    <Suspense fallback={<p className='text-sm text-muted'>Loading…</p>}>
      {/* Dynamically import to ensure purely client-side rendering */}
      <NewBallotClientWrapper />
    </Suspense>
  );
}

import nextDynamic from 'next/dynamic';
// @ts-ignore - dynamic import resolution
const NewBallotClientWrapper = nextDynamic(()=> import('./NewBallotClient'), { ssr: false, loading: () => <p className='text-sm text-muted'>Loading…</p> });

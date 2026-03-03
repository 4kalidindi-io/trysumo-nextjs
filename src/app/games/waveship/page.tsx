import BackLink from '@/components/layout/BackLink';
import Container from '@/components/shared/Container';

export const metadata = {
  title: 'Wave Ship – TrySumo.App',
  description: 'Wave Ship prototype embedded in TrySumo',
};

export default function WaveShipPage() {
  return (
    <Container className="py-10">
      <BackLink href="/games" label="Back to Games" />
      <div className="mt-6">
        <div className="mb-4 flex items-center gap-3">
          <a href="/games/waveship/index.html" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-4 py-2 rounded-lg bg-cyan-500 text-slate-900 font-semibold">Launch Game</a>
          <span className="text-sm text-slate-500">Opens the game in a new tab (recommended)</span>
        </div>
        <div style={{height: '72vh', borderRadius: 8, overflow: 'hidden', boxShadow: '0 8px 24px rgba(2,6,23,0.6)'}}>
          <iframe src="/games/waveship/index.html" title="Wave Ship" style={{width: '100%', height: '100%', border: '0'}} />
        </div>
      </div>
    </Container>
  );
}

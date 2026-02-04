export default function Stats() {
  return (
    <div className="flex justify-center gap-12 px-6 py-8 pb-4">
      <div className="text-center">
        <div className="text-2xl font-bold text-primary-900 tracking-tight">4</div>
        <div className="text-xs text-primary-400 mt-0.5 font-medium">Categories</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-primary-900 tracking-tight">4</div>
        <div className="text-xs text-primary-400 mt-0.5 font-medium">Apps</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-primary-900 tracking-tight">0</div>
        <div className="text-xs text-primary-400 mt-0.5 font-medium">Downloads needed</div>
      </div>
    </div>
  );
}

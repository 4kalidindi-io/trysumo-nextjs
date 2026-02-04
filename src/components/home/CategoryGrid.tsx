import CategoryCard from '../shared/CategoryCard';

export default function CategoryGrid() {
  return (
    <section className="px-6 pb-22">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-container mx-auto">
        <CategoryCard
          href="/productivity"
          icon="💼"
          title="Productivity"
          description="Focus tools and time management to help you accomplish more."
        />
        <CategoryCard
          href="/games"
          icon="🎮"
          title="Games"
          description="Quick, fun games to take a break and recharge your mind."
        />
        <CategoryCard
          href="/aiagents"
          icon="🤖"
          title="AI Agents"
          description="Intelligent agents powered by AI to simplify your life."
        />
        <CategoryCard
          href="/news"
          icon="📰"
          title="News"
          description="Stay up to date with the latest news and updates."
        />
      </div>
    </section>
  );
}

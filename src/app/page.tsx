import Link from "next/link";

const HomePage = () => {
  return (
    <main className="min-h-[100dvh] flex flex-col items-center justify-center p-4">
      <h1 className="text-xl sm:text-2xl font-bold mb-6 text-center">
        Casa Turner Super Bowl Squares
      </h1>
      <div className="flex flex-col gap-4 w-full max-w-sm">
        <Link
          href="/game/new"
          className="rounded-xl bg-nfl-patriots-accent px-6 py-4 min-h-touch flex items-center justify-center font-medium text-white hover:opacity-90 active:opacity-95 transition-opacity text-center"
          aria-label="Create a new game"
        >
          Create game
        </Link>
        <Link
          href="/join"
          className="rounded-xl border-2 border-gray-500 px-6 py-4 min-h-touch flex items-center justify-center font-medium hover:bg-gray-800 active:bg-gray-700 transition-colors text-center"
          aria-label="Join an existing game"
        >
          Join game
        </Link>
      </div>
    </main>
  );
};

export default HomePage;

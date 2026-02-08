import Link from "next/link";
import Image from "next/image";
import { Pacifico } from "next/font/google";

const pacifico = Pacifico({ weight: "400", subsets: ["latin"] });

const HomePage = () => {
  return (
    <main className="min-h-[100dvh] flex flex-col items-center justify-center p-4">
      <header className="flex flex-col items-center justify-center gap-1 mb-6">
        <Image
          src="/super-bowl-logo.svg"
          alt=""
          width={500}
          height={330}
          className="shrink-0 w-40 h-auto sm:w-52 max-w-full object-contain"
          priority
          aria-hidden
        />
        <h1
          className={`${pacifico.className} mt-[5px] text-xl sm:text-2xl md:text-3xl font-normal text-white text-center`}
        >
          Turner's Super Bowl Squares
        </h1>
      </header>
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

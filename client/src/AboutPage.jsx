// ba-worldcup/client/src/AboutPage.jsx

import { Link } from "react-router-dom";

const AboutPage = () => {
  return (
    <div className="bg-gray-900 min-h-screen text-white flex flex-col items-center">
      <div className="w-full max-w-4xl mx-auto p-4 sm:p-8">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-extrabold text-blue-300">
            About the Student World Cup
          </h1>
          <p className="text-xl text-gray-400 mt-2">
            How your votes shape the global leaderboard.
          </p>
        </header>

        <main className="space-y-12">
          <section>
            <h2 className="text-3xl font-bold mb-4 border-b-2 border-gray-700 pb-2">
              My Goal & Inspiration
            </h2>
            <p className="text-lg text-gray-300 leading-relaxed mb-4">
              As a fan of Blue Archive, I was inspired by large-scale tournament
              platforms like the Korean site{" "}
              <a
                href="https://piku.co.kr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                piku.co.kr
              </a>
              . I enjoyed seeing communities vote for their favorites, but I
              noticed there wasn't a global version available for Blue Archive
              fans to share in the fun.
            </p>
            <p className="text-lg text-gray-300 leading-relaxed">
              That's what motivated me to build this project. My goal was to
              create more than just a simple poll — I wanted to design a fun,
              engaging, and fair platform where the global community could see
              rankings play out in a dynamic, tournament-style format, making
              every single choice matter.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4 border-b-2 border-gray-700 pb-2">
              How It Works
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-semibold text-blue-300 mb-2">
                  1. The Tournament
                </h3>
                <p className="text-lg text-gray-300 leading-relaxed">
                  When you press "Start!", the system generates a unique,
                  single-elimination tournament bracket for you from the full
                  roster of playable students. You vote in each head-to-head
                  matchup by clicking on your choice. The selected student will
                  be highlighted with a green outline before advancing to the
                  next round, continuing until only one winner remains.
                </p>
                <p className="mt-6 text-sm italic text-gray-400">
                  Example screenshot of a matchup:
                </p>
                <img
                  src="https://res.cloudinary.com/doi21aa5i/image/upload/v1753945947/blue_archive_matchup_gss4j3.webp"
                  alt="Screenshot of a tournament matchup"
                  className="mt-2 rounded-lg shadow-xl ring-1 ring-white/10"
                />
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-blue-300 mb-2">
                  2. The Point System
                </h3>
                <p className="text-lg text-gray-300 leading-relaxed">
                  Once you have a winner, your results are awarded points based
                  on performance. The system is designed so that{" "}
                  <strong>every single win matters</strong>. Students earn more
                  points for each round they clear, ensuring that even those who
                  don't make it to the finals are rewarded for their success.
                </p>
                <p className="mt-6 text-sm italic text-gray-400">
                  Example screenshot of the final results screen:
                </p>
                <img
                  src="https://res.cloudinary.com/doi21aa5i/image/upload/v1753945946/blue_archive_result_haywbp.webp"
                  alt="Screenshot of the final results page"
                  className="mt-2 rounded-lg shadow-xl ring-1 ring-white/10"
                />
                <p className="text-lg text-gray-300 leading-relaxed mt-6">
                  The point distribution:
                </p>
                <ul className="list-disc list-inside mt-4 space-y-2 text-lg bg-gray-800/50 p-6 rounded-lg">
                  <li>
                    <strong className="font-semibold text-amber-300">
                      Tournament Winner:
                    </strong>{" "}
                    +25 points
                  </li>
                  <li>
                    <strong className="font-semibold text-gray-300">
                      Runner-Up (2nd):
                    </strong>{" "}
                    +18 points
                  </li>
                  <li>
                    <strong className="font-semibold text-amber-600">
                      Semi-Finalists (3rd-4th):
                    </strong>{" "}
                    +12 points
                  </li>
                  <li>
                    <strong className="font-semibold">
                      Quarter-Finalists (5th-8th):
                    </strong>{" "}
                    +8 points
                  </li>
                  <li>
                    <strong className="font-semibold">
                      Round of 16 (9th-16th):
                    </strong>{" "}
                    +5 points
                  </li>
                  <li>
                    <strong className="font-semibold">
                      Round of 32 (17th-32nd):
                    </strong>{" "}
                    +3 points
                  </li>
                  <li>
                    <strong className="font-semibold">
                      Round of 64 (33rd-64th):
                    </strong>{" "}
                    +1 point
                  </li>
                  <li>
                    <strong className="font-semibold text-gray-500">
                      Round of 128 and Preliminary Round (65th and below):
                    </strong>{" "}
                    +0 points
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-blue-300 mb-2">
                  3. The Global Rankings
                </h3>
                <p className="text-lg text-gray-300 leading-relaxed">
                  After you submit, your points are added to the global total.
                  The "Total Points" you see on the homepage is the sum of all
                  points every character has earned across all tournaments ever
                  submitted by all users. This creates a living, crowd-sourced
                  leaderboard.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4 border-b-2 border-gray-700 pb-2">
              Fairness & Privacy
            </h2>
            <p className="text-lg text-gray-300 leading-relaxed">
              Trust is essential for a community ranking. To keep the results
              fair, your browser is assigned a unique, completely anonymous ID.
              When you submit a tournament, it either creates a new entry for
              you or{" "}
              <strong className="text-red-300">
                overwrites your previous one
              </strong>
              . This prevents anyone from spamming submissions to unfairly boost
              a character's score.
            </p>
            <p className="text-lg text-gray-300 leading-relaxed mt-4">
              I do not track any personal information. The anonymous ID is used
              for one purpose only: to maintain a fair and balanced ranking
              system.
            </p>
          </section>
        </main>

        <footer className="text-center mt-16 mb-12">
          <Link
            to="/"
            className="px-8 py-3 bg-blue-600 text-white rounded-lg text-xl hover:bg-blue-700 transition-colors"
          >
            Back to Rankings
          </Link>
        </footer>
      </div>
    </div>
  );
};

export default AboutPage;

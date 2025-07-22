// ba-worldcup/src/App.jsx
import { useState, useEffect } from "react";
import confetti from "canvas-confetti";

const generateUUID = () => crypto.randomUUID();

const App = () => {
  const [waifus, setWaifus] = useState([]);
  const [contestants, setContestants] = useState([]);
  const [winners, setWinners] = useState([]);
  const [round, setRound] = useState(1);
  const [currentMatch, setCurrentMatch] = useState(0);
  const [tournamentWinner, setTournamentWinner] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [userId, setUserId] = useState(null);
  const [rankings, setRankings] = useState([]);
  const [isLoadingRankings, setIsLoadingRankings] = useState(true);
  const [submissionStatus, setSubmissionStatus] = useState("idle");
  const [lastUpdated, setLastUpdated] = useState("");
  const [tournamentPhase, setTournamentPhase] = useState("setup");
  const [byeContestants, setByeContestants] = useState([]);
  const [selectionFeedback, setSelectionFeedback] = useState({
    winnerId: null,
    loserId: null,
  });

  useEffect(() => {
    if (gameStarted && tournamentPhase === "setup") {
      fetch("http://localhost:3001/api/waifus")
        .then((response) => response.json())
        .then((data) => {
          const shuffledWaifus = shuffleArray(data);
          setWaifus(shuffledWaifus);
          // Call the new setup function instead of directly setting contestants
          setupTournament(shuffledWaifus);
        })
        .catch((error) => console.error("Failed to load waifus:", error));
    }
  }, [gameStarted]);

  // UX-IMPROVEMENT: Celebrate the winner with confetti
  useEffect(() => {
    if (tournamentWinner && typeof confetti === "function") {
      // Fire confetti when a winner is declared
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 },
      });
    }
  }, [tournamentWinner]);

  // UX-IMPROVEMENT: Add keyboard navigation (left/right arrows) for voting
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Ensure this only runs during a match
      if (!gameStarted || tournamentWinner || contestants.length < 2) return;

      if (event.key === "ArrowLeft") {
        handleSelect(contestants[currentMatch * 2]);
      } else if (event.key === "ArrowRight") {
        handleSelect(contestants[currentMatch * 2 + 1]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    // Cleanup function to remove the listener
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
    // Re-bind the event listener if the contestants in the current match change
  }, [gameStarted, tournamentWinner, contestants, currentMatch]);

  useEffect(() => {
    let currentUserId = localStorage.getItem("waifuCupUserId");
    if (!currentUserId) {
      currentUserId = generateUUID();
      localStorage.setItem("waifuCupUserId", currentUserId);
    }
    setUserId(currentUserId);

    fetch("http://localhost:3001/api/rankings")
      .then((res) => res.json())
      .then((data) => {
        setRankings(data.rankings);
        setLastUpdated(data.lastUpdated);
        setIsLoadingRankings(false);
      })
      .catch((error) => {
        console.error("Failed to load rankings:", error);
        setIsLoadingRankings(false);
      });
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (gameStarted && !tournamentWinner) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [gameStarted, tournamentWinner]);

  // A function to check if a number is a power of two
  const isPowerOfTwo = (n) => n > 0 && (n & (n - 1)) === 0;

  const setupTournament = (allCharacters) => {
    const n = allCharacters.length;

    // If the number is already a perfect power of two, no preliminary round is needed.
    if (isPowerOfTwo(n)) {
      setContestants(allCharacters);
      setTournamentPhase("main");
      return;
    }

    // Calculate the bracket
    const p = Math.pow(2, Math.floor(Math.log2(n))); // Largest power of 2 less than n
    const numToEliminate = n - p;
    const numPreliminaryContestants = numToEliminate * 2;

    // The first characters in the shuffled list get a bye
    const byes = allCharacters.slice(0, n - numPreliminaryContestants);
    const prelims = allCharacters.slice(n - numPreliminaryContestants);

    setByeContestants(byes);
    setContestants(prelims); // The contestants for the preliminary round
    setTournamentPhase("preliminary");
  };

  const handleSubmitResult = () => {
    if (tournamentWinner && userId) {
      setSubmissionStatus("submitting");
      fetch("http://localhost:3001/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          waifuId: tournamentWinner.id,
        }),
      })
        .then((response) => {
          if (response.ok) {
            setSubmissionStatus("submitted");
            fetch("http://localhost:3001/api/rankings")
              .then((res) => res.json())
              .then((data) => {
                setRankings(data.rankings);
                setLastUpdated(data.lastUpdated);
              });
          } else {
            setSubmissionStatus("error");
          }
        })
        .catch((error) => {
          console.error("Failed to submit result:", error);
          setSubmissionStatus("error");
        });
    }
  };

  const shuffleArray = (array) => {
    let currentIndex = array.length,
      randomIndex;
    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex],
        array[currentIndex],
      ];
    }
    return array;
  };

  const getRoundName = (currentRound) => {
    // Handle the new preliminary round name
    if (tournamentPhase === "preliminary") {
      return "Preliminary Round";
    }

    // This calculates the round name for the main tournament
    const mainTournamentRounds = Math.log2(contestants.length);
    const roundOf = Math.pow(2, mainTournamentRounds - round + 1);

    if (roundOf === 4) return "Quarter-Finals";
    if (roundOf === 2) return "Finals";
    if (roundOf < 2) return "Winner!";

    return `Round of ${roundOf}`;
  };

  const handleSelect = (winner) => {
    // Prevent multiple clicks while feedback is being shown
    if (selectionFeedback.winnerId) return;

    const waifu1 = contestants[currentMatch * 2];
    const waifu2 = contestants[currentMatch * 2 + 1];
    const loser = winner.id === waifu1.id ? waifu2 : waifu1;

    // UX-IMPROVEMENT: Set the winner/loser for visual feedback
    setSelectionFeedback({ winnerId: winner.id, loserId: loser.id });

    // UX-IMPROVEMENT: Wait a moment before loading the next match
    setTimeout(() => {
      const newWinners = [...winners, winner];
      setWinners(newWinners);
      const nextMatch = currentMatch + 1;

      if (nextMatch * 2 >= contestants.length) {
        // --- THIS IS THE NEW LOGIC ---
        // If the preliminary round just ended
        if (tournamentPhase === "preliminary") {
          // Combine the winners with the 'bye' characters and shuffle them
          const newMainContestants = shuffleArray([
            ...byeContestants,
            ...newWinners,
          ]);
          setContestants(newMainContestants);
          setWinners([]);
          setByeContestants([]); // Clear the byes
          setCurrentMatch(0);
          setRound(1); // Start the main tournament at Round 1
          setTournamentPhase("main"); // Switch to the main phase
        }
        // Logic for the main tournament phase
        else {
          if (newWinners.length === 1) {
            setTournamentWinner(newWinners[0]);
          } else {
            setContestants(newWinners);
            setWinners([]);
            setRound(round + 1);
            setCurrentMatch(0);
          }
        }
      } else {
        setCurrentMatch(nextMatch);
      }
      // Reset feedback for the next round
      setSelectionFeedback({ winnerId: null, loserId: null });
    }, 500); // 500ms delay
  };

  const resetGame = () => {
    // ... (no changes in this function)
    setWaifus([]);
    setContestants([]);
    setWinners([]);
    setRound(1);
    setCurrentMatch(0);
    setTournamentWinner(null);
    setGameStarted(false);
    setSubmissionStatus("idle");
    setTournamentPhase("setup");
    setByeContestants([]);
  };

  // UX-IMPROVEMENT: New handler for the "Home" button
  const handleGoHome = () => {
    // Display a confirmation dialog to the user
    const isConfirmed = window.confirm(
      "Are you sure you want to go home? All tournament progress will be lost."
    );

    // Only reset the game if the user confirms
    if (isConfirmed) {
      resetGame();
    }
  };

  // In the loading screen, use the tournamentPhase state
  if (contestants.length === 0 && gameStarted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white text-2xl">
        {tournamentPhase === "setup"
          ? "Setting up tournament..."
          : "Loading contestants..."}
      </div>
    );
  }

  if (!gameStarted) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-900 text-white">
        <main className="flex-grow flex flex-col items-center justify-center p-4">
          <div
            className="flex flex-col items-center justify-center text-center"
            style={{ minHeight: "50vh" }}
          >
            <h1 className="text-5xl font-bold mb-8">
              Blue Archive Waifu World Cup
            </h1>
            <button
              onClick={() => setGameStarted(true)}
              className="px-8 py-4 bg-blue-600 text-white rounded-lg text-5xl hover:bg-blue-700 transition-colors"
            >
              Start
            </button>
          </div>

          <h2 className="text-3xl font-bold mb-4 mt-4">Global Rankings</h2>
          <div className="w-full max-w-4xl bg-gray-800 rounded-lg shadow-lg overflow-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-700">
                <tr>
                  <th className="p-4">Rank</th>
                  <th className="p-4">Image</th>
                  <th className="p-4">Name</th>
                  {/* UX-IMPROVEMENT: New column for Total Wins */}
                  <th className="p-4">Total Wins</th>
                  <th className="p-4">#1 Ratio</th>
                </tr>
              </thead>
              <tbody>
                {/* UX-IMPROVEMENT: Skeleton loader for rankings */}
                {isLoadingRankings
                  ? [...Array(5)].map((_, i) => (
                      <tr
                        key={i}
                        className="border-b border-gray-700 last:border-b-0"
                      >
                        <td className="p-4 align-middle">
                          <div className="h-6 w-6 bg-gray-700 rounded animate-pulse"></div>
                        </td>
                        <td className="p-2 align-middle">
                          <div className="w-20 h-20 bg-gray-700 rounded-full animate-pulse"></div>
                        </td>
                        <td className="p-2 align-middle">
                          <div className="h-6 w-32 bg-gray-700 rounded animate-pulse"></div>
                        </td>
                        <td className="p-4 align-middle">
                          <div className="h-6 w-12 bg-gray-700 rounded animate-pulse"></div>
                        </td>
                        <td className="p-4 align-middle">
                          <div className="h-6 w-20 bg-gray-700 rounded animate-pulse"></div>
                        </td>
                      </tr>
                    ))
                  : rankings.map((waifu, index) => (
                      <tr
                        key={waifu.id}
                        className="border-b border-gray-700 last:border-b-0 hover:bg-gray-700/50"
                      >
                        <td className="p-4 font-bold text-xl align-middle">
                          {index + 1}
                        </td>
                        <td className="p-2 align-middle">
                          <div className="w-20 h-20 rounded-full overflow-hidden group">
                            <img
                              src={waifu.image}
                              alt={waifu.name}
                              className="w-full h-full object-cover object-top scale-125"
                            />
                          </div>
                        </td>
                        <td className="p-2 text-lg align-middle">
                          {waifu.name}
                        </td>
                        {/* UX-IMPROVEMENT: Display total win count */}
                        <td className="p-4 align-middle">{waifu.winCount}</td>
                        <td className="p-4 align-middle">
                          {waifu.rank1Ratio.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </main>
        <footer className="w-full text-center py-6">
          {lastUpdated && (
            <p className="text-sm text-gray-500">
              Character Roster Updated: {lastUpdated}
            </p>
          )}
        </footer>
      </div>
    );
  }

  if (tournamentWinner) {
    const submitButtonText = {
      idle: "Submit Result",
      submitting: "Submitting...",
      submitted: "Submitted ✓",
      error: "Submission Failed",
    };
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-5xl font-bold mb-4">Tournament Winner!</div>
        <img
          src={tournamentWinner.image}
          alt={tournamentWinner.name}
          className="w-96 h-96 object-cover object-top rounded-lg shadow-lg"
        />
        <div className="text-4xl mt-4 font-bold">{tournamentWinner.name}</div>
        <div className="flex items-center space-x-4 mt-8">
          <button
            onClick={resetGame}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg text-xl hover:bg-gray-700 transition-colors"
          >
            Home
          </button>
          {submissionStatus !== "submitted" && (
            <button
              onClick={handleSubmitResult}
              disabled={submissionStatus === "submitting"}
              className={`px-6 py-3 rounded-lg text-xl transition-colors 
                ${
                  submissionStatus === "submitting"
                    ? "bg-gray-500 cursor-not-allowed"
                    : ""
                }
                ${
                  submissionStatus === "idle"
                    ? "bg-blue-600 hover:bg-blue-700"
                    : ""
                }
                ${
                  submissionStatus === "error"
                    ? "bg-red-600 hover:bg-red-700"
                    : ""
                }`}
            >
              {submitButtonText[submissionStatus]}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (contestants.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white text-2xl">
        Loading contestants...
      </div>
    );
  }

  const waifu1 = contestants[currentMatch * 2];
  const waifu2 = contestants[currentMatch * 2 + 1];

  if (!waifu1 || !waifu2) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white text-2xl">
        Preparing next round...
      </div>
    );
  }

  // UX-IMPROVEMENT: Function to apply feedback styles
  const getFeedbackClasses = (waifuId) => {
    if (!selectionFeedback.winnerId) return "border-transparent"; // Default
    if (waifuId === selectionFeedback.winnerId) return "border-green-500"; // Winner
    if (waifuId === selectionFeedback.loserId) return "border-transparent"; // Loser
    return "border-transparent";
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* The header is where we add the new button */}
      <header className="relative flex items-center justify-center text-center text-4xl font-bold py-4">
        {/* UX-IMPROVEMENT: Add the "Home" button */}
        <button
          onClick={handleGoHome}
          className="absolute left-4 top-1/2 -translate-y-1/2 px-4 py-2 bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors"
        >
          Home
        </button>

        <div>
          {getRoundName(round)} - Match {currentMatch + 1} /{" "}
          {contestants.length / 2}
        </div>
      </header>
      <div className="w-full bg-gray-700 h-4 mb-4">
        <div
          className="bg-blue-500 h-4"
          style={{
            width: `${(currentMatch / (contestants.length / 2)) * 100}%`,
          }}
        ></div>
      </div>
      <div className="flex flex-1 min-h-0 relative">
        {/* UX-IMPROVEMENT: Apply feedback styles to the voting container */}
        <div
          className={`flex-1 flex items-center justify-center cursor-pointer relative group overflow-hidden border-8 transition-all duration-300 ${getFeedbackClasses(
            waifu1.id
          )}`}
          onClick={() => handleSelect(waifu1)}
        >
          <img
            src={waifu1.image}
            alt={waifu1.name}
            className="w-full h-full object-contain transform transition-transform group-hover:scale-105"
          />
          <div className="absolute bottom-10 text-4xl font-bold text-white bg-black bg-opacity-50 p-4 rounded opacity-0 group-hover:opacity-100 transition-opacity">
            {waifu1.name}
          </div>
        </div>
        <div
          className={`flex-1 flex items-center justify-center cursor-pointer relative group overflow-hidden border-8 transition-all duration-300 ${getFeedbackClasses(
            waifu2.id
          )}`}
          onClick={() => handleSelect(waifu2)}
        >
          <img
            src={waifu2.image}
            alt={waifu2.name}
            className="w-full h-full object-contain transform transition-transform group-hover:scale-105"
          />
          <div className="absolute bottom-10 text-4xl font-bold text-white bg-black bg-opacity-50 p-4 rounded opacity-0 group-hover:opacity-100 transition-opacity">
            {waifu2.name}
          </div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="text-8xl font-extrabold text-white"
            style={{
              textShadow: "0 0 10px black, 0 0 20px black, 0 0 30px black",
            }}
          >
            VS
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;

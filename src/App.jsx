// ba-worldcup/src/App.jsx
import { useState, useEffect } from "react";
import confetti from "canvas-confetti";

const generateUUID = () => crypto.randomUUID();

// --- Testing Variables ---
// TEST_ON: Master switch for test mode. (1 = On, 0 = Off)
const TEST_ON = 0;
// TEST_ROUND: Set to 8 for Quarter-Finals, 4 for Semi-Finals, etc.
// This is only active if TEST_ON is 1.
const TEST_ROUND = 8;

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

  const [runnerUp, setRunnerUp] = useState(null);
  const [semiFinalists, setSemiFinalists] = useState([]);
  const [quarterFinalists, setQuarterFinalists] = useState([]);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [modalImage, setModalImage] = useState(null);

  useEffect(() => {
    if (gameStarted && tournamentPhase === "setup") {
      fetch("http://localhost:3001/api/waifus")
        .then((response) => response.json())
        .then((data) => {
          const shuffledWaifus = shuffleArray(data);
          setWaifus(shuffledWaifus);
          setupTournament(shuffledWaifus);
        })
        .catch((error) => console.error("Failed to load waifus:", error));
    }
  }, [gameStarted, tournamentPhase]);

  useEffect(() => {
    if (tournamentWinner && typeof confetti === "function") {
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 },
      });
    }
  }, [tournamentWinner]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (modalImage) {
        if (event.key === "Escape") {
          closeImageModal();
        }
        return;
      }
      if (!gameStarted || tournamentWinner || contestants.length < 2) return;
      if (event.key === "ArrowLeft") {
        handleSelect(contestants[currentMatch * 2]);
      } else if (event.key === "ArrowRight") {
        handleSelect(contestants[currentMatch * 2 + 1]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [gameStarted, tournamentWinner, contestants, currentMatch, modalImage]);

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

  useEffect(() => {
    if (showSuccessPopup) {
      const timer = setTimeout(() => {
        setShowSuccessPopup(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessPopup]);

  const isPowerOfTwo = (n) => n > 0 && (n & (n - 1)) === 0;

  const setupTournament = (allCharacters) => {
    if (TEST_ON && TEST_ROUND && isPowerOfTwo(TEST_ROUND)) {
      console.warn(
        `--- TEST MODE: Starting with ${TEST_ROUND} contestants ---`
      );
      const limitedContestants = allCharacters.slice(0, TEST_ROUND);
      setContestants(limitedContestants);
      setTournamentPhase("main");
      return;
    }

    const n = allCharacters.length;
    if (isPowerOfTwo(n)) {
      setContestants(allCharacters);
      setTournamentPhase("main");
      return;
    }

    const p = Math.pow(2, Math.floor(Math.log2(n)));
    const numToEliminate = n - p;
    const numPreliminaryContestants = numToEliminate * 2;
    const byes = allCharacters.slice(0, n - numPreliminaryContestants);
    const prelims = allCharacters.slice(n - numPreliminaryContestants);
    setByeContestants(byes);
    setContestants(prelims);
    setTournamentPhase("preliminary");
  };

  const handleSubmitResult = () => {
    if (tournamentWinner) {
      setSubmissionStatus("submitting");

      const semiFinalLosers = semiFinalists.filter(
        (sf) => sf.id !== tournamentWinner.id && sf.id !== runnerUp.id
      );

      const semiFinalistIds = semiFinalists.map((sf) => sf.id);
      const quarterFinalLosers = quarterFinalists.filter(
        (qf) => !semiFinalistIds.includes(qf.id)
      );

      const payload = {
        userId: userId,
        winner: tournamentWinner,
        runnerUp: runnerUp,
        semiFinalists: semiFinalLosers,
        quarterFinalists: quarterFinalLosers,
      };

      fetch("http://localhost:3001/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then((response) => {
          if (response.ok) {
            setSubmissionStatus("submitted");
            setShowSuccessPopup(true);
            return fetch("http://localhost:3001/api/rankings");
          } else {
            throw new Error("Submission failed");
          }
        })
        .then((res) => res.json())
        .then((data) => {
          setRankings(data.rankings);
          setLastUpdated(data.lastUpdated);
        })
        .catch((error) => {
          console.error("Failed to submit or refresh:", error);
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

  const getRoundName = () => {
    if (tournamentWinner) return "Winner!";
    if (tournamentPhase === "preliminary") return "Preliminary Round";
    const numContestants = contestants.length;
    if (numContestants === 2) return "Finals";
    if (numContestants === 4) return "Semi-Finals";
    if (numContestants === 8) return "Quarter-Finals";
    if (numContestants > 8 && isPowerOfTwo(numContestants)) {
      return `Round of ${numContestants}`;
    }
    return `Round ${round}`;
  };

  const handleSelect = (winner) => {
    if (selectionFeedback.winnerId) return;
    const waifu1 = contestants[currentMatch * 2];
    const waifu2 = contestants[currentMatch * 2 + 1];
    const loser = winner.id === waifu1.id ? waifu2 : waifu1;
    setSelectionFeedback({ winnerId: winner.id, loserId: loser.id });
    setTimeout(() => {
      const newWinners = [...winners, winner];
      setWinners(newWinners);
      const nextMatch = currentMatch + 1;
      if (nextMatch * 2 >= contestants.length) {
        if (tournamentPhase === "preliminary") {
          const newMainContestants = shuffleArray([
            ...byeContestants,
            ...newWinners,
          ]);
          setContestants(newMainContestants);
          setWinners([]);
          setByeContestants([]);
          setCurrentMatch(0);
          setRound(1);
          setTournamentPhase("main");
        } else {
          if (contestants.length === 8) {
            setQuarterFinalists(contestants);
          }
          if (contestants.length === 4) {
            setSemiFinalists(contestants);
          }
          if (newWinners.length === 1) {
            setTournamentWinner(newWinners[0]);
            if (contestants.length === 2) {
              const finalLoser = contestants.find(
                (c) => c.id !== newWinners[0].id
              );
              setRunnerUp(finalLoser);
            }
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
      setSelectionFeedback({ winnerId: null, loserId: null });
    }, 500);
  };

  const resetGame = () => {
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
    setRunnerUp(null);
    setSemiFinalists([]);
    setQuarterFinalists([]);
  };

  const handleGoHome = () => {
    if (gameStarted && !tournamentWinner) {
      const isConfirmed = window.confirm(
        "Are you sure you want to go home? All tournament progress will be lost."
      );
      if (!isConfirmed) {
        return;
      }
    }
    resetGame();
  };

  const openImageModal = (imageUrl) => {
    setModalImage(imageUrl);
  };

  const closeImageModal = () => {
    setModalImage(null);
  };

  return (
    <>
      {modalImage && (
        <div
          className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 transition-opacity duration-300"
          onClick={closeImageModal}
        >
          <div className="relative p-4" onClick={(e) => e.stopPropagation()}>
            <img
              src={modalImage}
              alt="Full size view"
              className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
            />
            <button
              onClick={closeImageModal}
              className="absolute top-0 right-0 m-1 bg-transparent text-white text-5xl font-bold leading-none hover:text-gray-300"
              aria-label="Close image view"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {!gameStarted ? (
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
                    <th className="p-4">Total Points</th>
                    <th className="p-4">Win Rate</th>
                  </tr>
                </thead>
                <tbody>
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
                            <div
                              className="w-20 h-20 rounded-full overflow-hidden group cursor-pointer"
                              onClick={() => openImageModal(waifu.image)}
                            >
                              <img
                                src={waifu.image}
                                alt={waifu.name}
                                className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-125"
                                style={{ imageRendering: "auto" }}
                              />
                            </div>
                          </td>
                          <td className="p-2 text-lg align-middle">
                            {waifu.name}
                          </td>
                          <td className="p-4 align-middle">
                            {waifu.totalPoints}
                          </td>
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
      ) : tournamentWinner ? (
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
              onClick={handleGoHome}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg text-xl hover:bg-gray-700 transition-colors"
            >
              Home
            </button>
            {submissionStatus !== "submitted" && (
              <button
                onClick={handleSubmitResult}
                disabled={submissionStatus === "submitting"}
                className={`px-6 py-3 rounded-lg text-xl transition-colors ${
                  submissionStatus === "submitting"
                    ? "bg-gray-500 cursor-not-allowed"
                    : ""
                } ${
                  submissionStatus === "idle"
                    ? "bg-blue-600 hover:bg-blue-700"
                    : ""
                } ${
                  submissionStatus === "error"
                    ? "bg-red-600 hover:bg-red-700"
                    : ""
                }`}
              >
                {submissionStatus === "submitting"
                  ? "Submitting..."
                  : "Submit Result"}
              </button>
            )}
          </div>
          <div
            className={`fixed top-10 left-1/2 -translate-x-1/2 bg-green-500 text-white font-bold px-8 py-4 rounded-lg shadow-xl transition-opacity duration-500 ease-in-out ${
              showSuccessPopup ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            Successfully submitted results!
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-screen bg-gray-900 text-white">
          <header className="relative flex items-center justify-center text-center text-4xl font-bold py-4">
            <button
              onClick={handleGoHome}
              className="absolute left-4 top-1/2 -translate-y-1/2 px-4 py-2 bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors"
            >
              Home
            </button>
            <div>
              {getRoundName()} - Match {currentMatch + 1} /{" "}
              {contestants.length / 2}
            </div>
          </header>
          <div className="w-full bg-gray-700 h-4 mb-4">
            <div
              className="bg-blue-500 h-4 transition-all duration-300 ease-in-out"
              style={{
                width: `${
                  ((currentMatch + 1) / (contestants.length / 2)) * 100
                }%`,
              }}
            ></div>
          </div>
          <div className="flex flex-1 min-h-0 relative">
            {contestants[currentMatch * 2] &&
            contestants[currentMatch * 2 + 1] ? (
              <>
                <div
                  className={`flex-1 flex items-center justify-center cursor-pointer relative group overflow-hidden border-8 transition-all duration-300 ${
                    selectionFeedback.winnerId ===
                    contestants[currentMatch * 2].id
                      ? "border-green-500"
                      : "border-transparent"
                  }`}
                  onClick={() => handleSelect(contestants[currentMatch * 2])}
                >
                  <img
                    src={contestants[currentMatch * 2].image}
                    alt={contestants[currentMatch * 2].name}
                    className="w-full h-full object-contain transform transition-transform group-hover:scale-105"
                  />
                  <div className="absolute bottom-10 text-4xl font-bold text-white bg-black bg-opacity-50 p-4 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    {contestants[currentMatch * 2].name}
                  </div>
                </div>
                <div
                  className={`flex-1 flex items-center justify-center cursor-pointer relative group overflow-hidden border-8 transition-all duration-300 ${
                    selectionFeedback.winnerId ===
                    contestants[currentMatch * 2 + 1].id
                      ? "border-green-500"
                      : "border-transparent"
                  }`}
                  onClick={() =>
                    handleSelect(contestants[currentMatch * 2 + 1])
                  }
                >
                  <img
                    src={contestants[currentMatch * 2 + 1].image}
                    alt={contestants[currentMatch * 2 + 1].name}
                    className="w-full h-full object-contain transform transition-transform group-hover:scale-105"
                  />
                  <div className="absolute bottom-10 text-4xl font-bold text-white bg-black bg-opacity-50 p-4 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    {contestants[currentMatch * 2 + 1].name}
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div
                    className="text-8xl font-extrabold text-white"
                    style={{
                      textShadow:
                        "0 0 10px black, 0 0 20px black, 0 0 30px black",
                    }}
                  >
                    VS
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white text-2xl">
                Preparing next round...
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default App;

// ba-worldcup/client/src/App.jsx
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { Tooltip } from "flowbite-react";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const generateUUID = () => crypto.randomUUID();

const POINTS = {
  WINNER: 5,
  RUNNER_UP: 3,
  SEMI_FINALIST: 2,
  QUARTER_FINALIST: 1,
};

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
  const [totalStudents, setTotalStudents] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [rowsToShow, setRowsToShow] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(rankings.length / rowsToShow);
  const startIndex = (currentPage - 1) * rowsToShow;
  const endIndex = startIndex + rowsToShow;
  const currentRankings = rankings.slice(startIndex, endIndex);

  useEffect(() => {
    const savedRows = localStorage.getItem("ba-worldcup-rows");
    if (savedRows) {
      setRowsToShow(Number(savedRows));
    }
    if (gameStarted && tournamentPhase === "setup") {
      fetch(`${API_BASE_URL}/api/waifus`)
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

    fetch(`${API_BASE_URL}/api/rankings`)
      .then((res) => res.json())
      .then((data) => {
        setRankings(data.rankings);
        setLastUpdated(data.lastUpdated);
        setTotalStudents(data.totalStudents);
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

  useEffect(() => {
    // --- PRELOADING LOGIC TO MAKE MATCHES FEEL INSTANT ---
    // Preload images for the *next* matchup to reduce loading lag.
    if (!gameStarted || tournamentWinner) return;

    const nextMatchIndex = currentMatch + 1;
    // Check if a next match actually exists in the current round
    if (nextMatchIndex * 2 < contestants.length) {
      const contestant1_next = contestants[nextMatchIndex * 2];
      const contestant2_next = contestants[nextMatchIndex * 2 + 1];

      // Preload images by creating new Image objects in memory.
      // The browser downloads the image into its cache. When the next match's <img>
      // tags are rendered with the same 'src', they load instantly from the cache.
      if (contestant1_next?.image) {
        const img1 = new Image();
        img1.src = contestant1_next.image;
      }
      if (contestant2_next?.image) {
        const img2 = new Image();
        img2.src = contestant2_next.image;
      }
    }
  }, [currentMatch, contestants, gameStarted, tournamentWinner]); // This effect runs whenever the match changes

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

  const handleRowsChange = (event) => {
    const newRowCount = Number(event.target.value);
    setRowsToShow(newRowCount);
    localStorage.setItem("ba-worldcup-rows", newRowCount);
    setCurrentPage(1);
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

      fetch(`${API_BASE_URL}/api/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then((response) => {
          if (response.ok) {
            setSubmissionStatus("submitted");
            setShowSuccessPopup(true);
            return fetch(`${API_BASE_URL}/api/rankings`);
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

  let semiFinalLosers = [];
  let quarterFinalLosers = [];

  if (tournamentWinner) {
    // Semi-finalists who didn't make the final
    semiFinalLosers = semiFinalists.filter(
      (sf) =>
        sf.id !== tournamentWinner.id && (!runnerUp || sf.id !== runnerUp.id)
    );

    // Quarter-finalists who didn't make the semi-finals
    const semiFinalistIds = semiFinalists.map((sf) => sf.id);
    quarterFinalLosers = quarterFinalists.filter(
      (qf) => !semiFinalistIds.includes(qf.id)
    );
  }

  const handleStartGame = () => {
    // 1. Trigger the fade-out animation
    setIsTransitioning(true);

    // 2. Wait for the animation to complete (500ms in this case)
    setTimeout(() => {
      // 3. After the fade, switch the view to the game
      setGameStarted(true);
      // Optional: Reset the transition state for future use, though not strictly necessary here
      setIsTransitioning(false);
    }, 500); // This duration should match your CSS transition duration
  };

  return (
    <>
      {modalImage && (
        <div
          className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 transition-opacity duration-300"
          onClick={closeImageModal}
        >
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <img
              src={modalImage}
              alt="Full size view"
              className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
            />
            <button
              onClick={closeImageModal}
              className="absolute top-2 right-2 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-4xl font-bold text-white transition-colors hover:bg-black/75"
              aria-label="Close image view"
            >
              {/* The "relative bottom-px" nudges the element up from its original position */}
              <span className="mb-2">×</span>
            </button>
          </div>
        </div>
      )}

      {!gameStarted ? (
        <div
          className={`flex flex-col min-h-screen bg-gray-900 text-white transition-opacity duration-500 ${
            isTransitioning ? "opacity-0" : "opacity-100"
          }`}
          style={{
            backgroundImage: `url('https://res.cloudinary.com/doi21aa5i/image/upload/v1753803197/blue_archive_bg1_gwu4aw.png')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundAttachment: "fixed",
          }}
        >
          <div className="flex flex-col min-h-screen bg-black/90">
            <main className="flex-grow flex flex-col items-center justify-center p-4">
              <div
                className="flex flex-col items-center justify-center text-center"
                style={{ minHeight: "50vh" }}
              >
                <h1 className="text-5xl font-bold mb-8">
                  Blue Archive Waifu World Cup{" "}
                  <span className="text-gray-500">(BETA)</span>
                </h1>
                <p className="text-2xl text-blue-300 mb-8">
                  Playable Students Edition
                </p>
                <button
                  onClick={handleStartGame}
                  className="w-40 h-40 bg-blue-600 text-white rounded-full text-5xl font-bold hover:bg-blue-700 transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-2xl transform hover:scale-110"
                >
                  <span className="mb-2">Start!</span>
                </button>
              </div>
              <div className="w-full max-w-4xl flex justify-between items-center mt-4 mb-4">
                <h2 className="text-3xl font-bold mb-4 mt-4">
                  Global Rankings
                </h2>
                <div className="flex items-center space-x-2">
                  <label
                    htmlFor="rows-select"
                    className="text-sm text-gray-400"
                  >
                    Show:
                  </label>
                  <select
                    id="rows-select"
                    value={rowsToShow}
                    onChange={handleRowsChange}
                    className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2"
                  >
                    <option value="10">10 rows</option>
                    <option value="25">25 rows</option>
                    <option value="50">50 rows</option>
                    <option value="100">100 rows</option>
                  </select>
                </div>
              </div>
              <div className="w-full max-w-4xl bg-gray-800 rounded-lg shadow-lg overflow-auto">
                <table className="w-full text-left table-fixed">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="p-3 w-16 text-left">Rank</th>
                      <th className="p-3 w-24 text-left">Image</th>
                      <th className="p-3 w-32 text-left">Name</th>
                      <th className="p-3 w-20 text-left">
                        <div className="inline-block">
                          <Tooltip
                            content={
                              <div className="text-left">
                                Points are awarded based on final tournament
                                rank:
                                <ul className="mt-2 space-y-1">
                                  <li>
                                    Winner (1st):
                                    <strong className="font-semibold bg-amber-300 px-1.5 py-0.5 rounded-md">
                                      +5 points
                                    </strong>
                                  </li>
                                  <li>
                                    Runner-up (2nd):
                                    <strong className="font-semibold bg-gray-300 px-1.5 py-0.5 rounded-md">
                                      +3 points
                                    </strong>
                                  </li>
                                  <li>
                                    Semi-finalists (3rd-4th):
                                    <strong className="font-semibold bg-amber-600 px-1.5 py-0.5 rounded-md">
                                      +2 points
                                    </strong>
                                  </li>
                                  <li>
                                    Quarter-finalists (5th-8th):
                                    <strong className="font-semibold px-1.5 py-0.5 rounded-md">
                                      +1 point
                                    </strong>
                                  </li>
                                </ul>
                              </div>
                            }
                            style="light"
                          >
                            <span className="cursor-help border-b-2 border-dotted border-gray-400">
                              Total Points
                            </span>
                          </Tooltip>
                        </div>
                      </th>
                      <th className="p-3 w-32 text-left">
                        <div className="inline-block">
                          <Tooltip
                            content={
                              <span>
                                The percentage of tournaments finished in
                                <strong className="font-semibold bg-amber-300 px-1.5 py-0.5 rounded-md">
                                  first place
                                </strong>
                              </span>
                            }
                            style="light"
                          >
                            <span className="cursor-help border-b-2 border-dotted border-gray-400">
                              Win Rate
                            </span>
                          </Tooltip>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingRankings
                      ? [...Array(5)].map((_, i) => (
                          <tr
                            key={i}
                            className="border-b border-gray-700 last:border-b-0"
                          >
                            {/* --- MODIFICATION: Padding and placeholder sizes updated --- */}
                            <td className="p-3 align-middle text-center">
                              <div className="h-6 w-6 bg-gray-700 rounded animate-pulse mx-auto"></div>
                            </td>
                            <td className="p-1 align-middle">
                              <div className="w-24 h-24 bg-gray-700 rounded-full animate-pulse mx-auto"></div>
                            </td>
                            <td className="p-3 align-middle">
                              <div className="h-6 w-32 bg-gray-700 rounded animate-pulse"></div>
                            </td>
                            <td className="p-3 align-middle">
                              <div className="h-6 w-20 bg-gray-700 rounded animate-pulse"></div>
                            </td>
                            <td className="p-3 align-middle">
                              <div className="h-6 w-full bg-gray-700 rounded-full animate-pulse"></div>
                            </td>
                          </tr>
                        ))
                      : currentRankings.map((waifu, index) => (
                          <tr
                            key={waifu.id}
                            className="border-b border-gray-700 last:border-b-0 hover:bg-gray-700/50"
                          >
                            <td className="p-3 font-bold text-xl align-middle">
                              {startIndex + index + 1}
                            </td>
                            <td className="p-1 align-middle">
                              {/* --- MODIFICATION: Image container size increased --- */}
                              <div
                                className="w-24 h-24 rounded-full overflow-hidden group cursor-pointer"
                                onClick={() => openImageModal(waifu.image)}
                              >
                                <div className="transition-transform duration-300 group-hover:scale-125">
                                  <LazyLoadImage
                                    alt={waifu.name} // Alt text for accessibility
                                    src={waifu.image} // The actual image URL
                                    effect="blur" // This adds the nice blur-up effect
                                    className="w-full h-full object-cover object-top"
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="p-3 text-lg align-middle">
                              {waifu.name}
                            </td>
                            <td className="p-3 text-lg align-middle text-amber-300">
                              {waifu.totalPoints}
                            </td>
                            {/* --- MODIFICATION: Replaced text with a progress bar --- */}
                            <td className="p-3 align-middle">
                              <div className="relative w-full bg-gray-700 rounded-full h-6 shadow-inner">
                                {/* Inner progress bar */}
                                <div
                                  className="bg-blue-500 h-6 rounded-full text-center transition-all duration-500"
                                  style={{ width: `${waifu.rank1Ratio}%` }}
                                ></div>
                                {/* Text overlay */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-white text-s font-bold">
                                    {waifu.rank1Ratio.toFixed(2)}%
                                  </span>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-4 mt-6">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-gray-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-gray-400">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-gray-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </main>
            <footer className="w-full text-center py-6 mb-5">
              {totalStudents > 0 && lastUpdated && (
                <p className="text-sm text-gray-500">
                  Featuring a roster of {totalStudents} students. | Roster
                  Updated: {lastUpdated}
                  <span className="mx-2">|</span>
                  <Link to="/about" className="text-blue-400 hover:underline">
                    About / How It Works
                  </Link>
                </p>
              )}
            </footer>
          </div>
        </div>
      ) : tournamentWinner ? (
        <div className="flex flex-col items-center min-h-screen bg-gray-900 text-white px-4 py-16">
          <div className="text-5xl font-bold mb-4 text-center">
            Tournament Winner!
          </div>
          <img
            src={tournamentWinner.image}
            alt={tournamentWinner.name}
            className="w-96 h-96 object-cover object-top rounded-lg shadow-lg"
          />
          <div className="text-4xl mt-4 font-bold">{tournamentWinner.name}</div>
          <p className="mt-2 text-2xl font-bold text-amber-400">
            +{POINTS.WINNER} Points
          </p>
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
          <div className="mt-12 w-full max-w-5xl bg-gray-800/50 p-6 rounded-xl">
            <h2 className="text-3xl font-bold text-center mb-6 border-b border-gray-600 pb-4">
              Full Results
            </h2>
            <div className="space-y-8">
              {/* Runner-Up */}
              {runnerUp && (
                <div>
                  <h3 className="text-2xl font-semibold text-gray-400 mb-4">
                    Runner-Up (2nd)
                  </h3>
                  <div className="flex justify-center">
                    <div className="flex flex-col items-center text-center">
                      <img
                        src={runnerUp.image}
                        alt={runnerUp.name}
                        className="w-32 h-32 rounded-full object-cover object-top border-4 border-gray-500"
                      />
                      <p className="mt-2 text-lg font-semibold">
                        {runnerUp.name}
                      </p>
                      <p className="text-xl font-bold text-blue-400">
                        +{POINTS.RUNNER_UP} Points
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Semi-Finalists */}
              {semiFinalLosers.length > 0 && (
                <div>
                  <h3 className="text-2xl font-semibold text-gray-400 mb-4">
                    Semi-Finalists (3rd & 4th)
                  </h3>
                  <div className="flex justify-center gap-8">
                    {semiFinalLosers.map((char) => (
                      <div
                        key={char.id}
                        className="flex flex-col items-center text-center"
                      >
                        <img
                          src={char.image}
                          alt={char.name}
                          className="w-28 h-28 rounded-full object-cover object-top border-4 border-gray-600"
                        />
                        <p className="mt-2 font-semibold">{char.name}</p>
                        <p className="text-lg font-bold text-blue-400">
                          +{POINTS.SEMI_FINALIST} Points
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quarter-Finalists */}
              {quarterFinalLosers.length > 0 && (
                <div>
                  <h3 className="text-2xl font-semibold text-gray-400 mb-4">
                    Quarter-Finalists (5th - 8th)
                  </h3>
                  <div className="flex justify-center gap-x-6 gap-y-4 flex-wrap">
                    {quarterFinalLosers.map((char) => (
                      <div
                        key={char.id}
                        className="flex flex-col items-center text-center"
                      >
                        <img
                          src={char.image}
                          alt={char.name}
                          className="w-24 h-24 rounded-full object-cover object-top border-4 border-gray-700"
                        />
                        <p className="mt-1 font-medium">{char.name}</p>
                        <p className="text-md font-bold text-blue-400">
                          +{POINTS.QUARTER_FINALIST} Point
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-screen bg-gray-900 text-white">
          <header className="relative flex items-center justify-center text-center text-4xl font-bold py-4">
            <button
              onClick={handleGoHome}
              className="hidden md:inline-block absolute left-4 top-1/2 -translate-y-1/2 px-4 py-2 bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors"
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
                  <div className="absolute bottom-10 text-4xl font-bold text-white bg-[rgba(0,0,0,0.6)] p-4 rounded opacity-0 group-hover:opacity-100 transition-opacity">
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
                  <div className="absolute bottom-10 text-4xl font-bold text-white bg-[rgba(0,0,0,0.6)] p-4 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    {contestants[currentMatch * 2 + 1].name}
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div
                    className="text-6xl md:text-8xl font-extrabold text-white"
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
              <div className="w-full flex items-center justify-center text-white text-2xl">
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

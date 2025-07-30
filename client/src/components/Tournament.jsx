// ba-worldcup/client/src/components/Tournament.jsx
import { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { getWaifus } from "../services/api";
import Results from "./Results";

const POINTS = {
  WINNER: 5,
  RUNNER_UP: 3,
  SEMI_FINALIST: 2,
  QUARTER_FINALIST: 1,
};

const TEST_ON = 0;
const TEST_ROUND = 8;

const Tournament = ({ onGoHome, onSubmission }) => {
  const [contestants, setContestants] = useState([]);
  const [winners, setWinners] = useState([]);
  const [round, setRound] = useState(1);
  const [currentMatch, setCurrentMatch] = useState(0);
  const [tournamentWinner, setTournamentWinner] = useState(null);
  const [tournamentPhase, setTournamentPhase] = useState("setup");
  const [byeContestants, setByeContestants] = useState([]);
  const [selectionFeedback, setSelectionFeedback] = useState({
    winnerId: null,
    loserId: null,
  });
  const [runnerUp, setRunnerUp] = useState(null);
  const [semiFinalists, setSemiFinalists] = useState([]);
  const [quarterFinalists, setQuarterFinalists] = useState([]);

  useEffect(() => {
    if (tournamentPhase === "setup") {
      getWaifus()
        .then((data) => {
          const shuffledWaifus = shuffleArray(data);
          setupTournament(shuffledWaifus);
        })
        .catch((error) => console.error("Failed to load waifus:", error));
    }
  }, [tournamentPhase]);

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
      if (tournamentWinner || contestants.length < 2) return;
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
  }, [tournamentWinner, contestants, currentMatch]);

  useEffect(() => {
    if (!tournamentWinner) return;

    const semiFinalLosers = semiFinalists.filter(
      (sf) => sf.id !== tournamentWinner.id && sf.id !== runnerUp.id
    );

    const semiFinalistIds = semiFinalists.map((sf) => sf.id);
    const quarterFinalLosers = quarterFinalists.filter(
      (qf) => !semiFinalistIds.includes(qf.id)
    );

    onSubmission({
      winner: tournamentWinner,
      runnerUp: runnerUp,
      semiFinalists: semiFinalLosers,
      quarterFinalists: quarterFinalLosers,
    });
  }, [
    tournamentWinner,
    runnerUp,
    semiFinalists,
    quarterFinalists,
    onSubmission,
  ]);

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

  if (tournamentWinner) {
    return (
      <Results
        winner={tournamentWinner}
        runnerUp={runnerUp}
        semiFinalists={semiFinalists}
        quarterFinalists={quarterFinalists}
        onGoHome={onGoHome}
        points={POINTS}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <header className="relative flex items-center justify-center text-center text-4xl font-bold py-4">
        <button
          onClick={onGoHome}
          className="hidden md:inline-block absolute left-4 top-1/2 -translate-y-1/2 px-4 py-2 bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors"
        >
          Home
        </button>
        <div>
          {getRoundName()} - Match {currentMatch + 1} / {contestants.length / 2}
        </div>
      </header>
      <div className="w-full bg-gray-700 h-4 mb-4">
        <div
          className="bg-blue-500 h-4 transition-all duration-300 ease-in-out"
          style={{
            width: `${((currentMatch + 1) / (contestants.length / 2)) * 100}%`,
          }}
        ></div>
      </div>
      <div className="flex flex-1 min-h-0 relative">
        {contestants[currentMatch * 2] && contestants[currentMatch * 2 + 1] ? (
          <>
            <div
              className={`flex-1 flex items-center justify-center cursor-pointer relative group overflow-hidden border-8 transition-all duration-300 ${
                selectionFeedback.winnerId === contestants[currentMatch * 2].id
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
              onClick={() => handleSelect(contestants[currentMatch * 2 + 1])}
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
                  textShadow: "0 0 10px black, 0 0 20px black, 0 0 30px black",
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
  );
};

export default Tournament;

// ba-worldcup/client/src/components/Results.jsx
import { useState } from "react";
import { submitResults } from "../services/api";

const Results = ({
  winner,
  runnerUp,
  semiFinalists,
  quarterFinalists,
  onGoHome,
  points,
}) => {
  const [submissionStatus, setSubmissionStatus] = useState("idle");
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const handleSubmitResult = () => {
    setSubmissionStatus("submitting");

    const semiFinalLosers = semiFinalists.filter(
      (sf) => sf.id !== winner.id && sf.id !== runnerUp.id
    );

    const semiFinalistIds = semiFinalists.map((sf) => sf.id);
    const quarterFinalLosers = quarterFinalists.filter(
      (qf) => !semiFinalistIds.includes(qf.id)
    );

    const payload = {
      userId: localStorage.getItem("waifuCupUserId"),
      winner: winner,
      runnerUp: runnerUp,
      semiFinalists: semiFinalLosers,
      quarterFinalists: quarterFinalLosers,
    };

    submitResults(payload)
      .then((response) => {
        if (response.ok) {
          setSubmissionStatus("submitted");
          setShowSuccessPopup(true);
        } else {
          throw new Error("Submission failed");
        }
      })
      .catch((error) => {
        console.error("Failed to submit or refresh:", error);
        setSubmissionStatus("error");
      });
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-900 text-white px-4 py-16">
      <div className="text-5xl font-bold mb-4 text-center">
        Tournament Winner!
      </div>
      <img
        src={winner.image}
        alt={winner.name}
        className="w-96 h-96 object-cover object-top rounded-lg shadow-lg"
      />
      <div className="text-4xl mt-4 font-bold">{winner.name}</div>
      <p className="mt-2 text-2xl font-bold text-amber-400">
        +{points.WINNER} Points
      </p>
      <div className="flex items-center space-x-4 mt-8">
        <button
          onClick={onGoHome}
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
              submissionStatus === "idle" ? "bg-blue-600 hover:bg-blue-700" : ""
            } ${
              submissionStatus === "error" ? "bg-red-600 hover:bg-red-700" : ""
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
          Full Tournament Results & Points
        </h2>
        <div className="space-y-8">
          {runnerUp && (
            <div>
              <h3 className="text-2xl font-semibold text-gray-400 mb-4">
                Runner-Up (2nd) - Points Awarded
              </h3>
              <div className="flex justify-center">
                <div className="flex flex-col items-center text-center">
                  <img
                    src={runnerUp.image}
                    alt={runnerUp.name}
                    className="w-32 h-32 rounded-full object-cover object-top border-4 border-gray-500"
                  />
                  <p className="mt-2 text-lg font-semibold">{runnerUp.name}</p>
                  <p className="text-xl font-bold text-blue-400">
                    +{points.RUNNER_UP} Points
                  </p>
                </div>
              </div>
            </div>
          )}

          {semiFinalists.length > 0 && (
            <div>
              <h3 className="text-2xl font-semibold text-gray-400 mb-4">
                Semi-Finalists (3rd & 4th) - Points Awarded
              </h3>
              <div className="flex justify-center gap-8">
                {semiFinalists.map((char) => (
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
                      +{points.SEMI_FINALIST} Points
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {quarterFinalists.length > 0 && (
            <div>
              <h3 className="text-2xl font-semibold text-gray-400 mb-4">
                Quarter-Finalists (5th - 8th) - Points Awarded
              </h3>
              <div className="flex justify-center gap-x-6 gap-y-4 flex-wrap">
                {quarterFinalists.map((char) => (
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
                      +{points.QUARTER_FINALIST} Point
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Results;

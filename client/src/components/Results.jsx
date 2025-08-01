// ba-worldcup/client/src/components/Results.jsx
import { useState, useEffect } from "react";
import { submitResults } from "../services/api";

const pointMap = [0, 1, 3, 5, 8, 12, 18, 25];

const Results = ({ winner, losersByRound, allStudents, onGoHome }) => {
  const [submissionStatus, setSubmissionStatus] = useState("idle");
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [placements, setPlacements] = useState([]);

  useEffect(() => {
    // Guard against running before the winner is determined
    if (!winner) return;

    // 1. Map the arrays of student objects to arrays of student IDs.
    //    This gives us the correct sequence of losers from the first round to the runner-up.
    const finalPlacements = losersByRound.map((roundLosers) =>
      roundLosers.map((loser) => loser.id)
    );

    // 2. Add the winner as the final array element.
    finalPlacements.push([winner.id]);

    // 3. Set the state. The result is a clean 8-element array for a 128-person tournament.
    setPlacements(finalPlacements);
  }, [winner, losersByRound]);

  const handleSubmitResult = () => {
    setSubmissionStatus("submitting");

    const payload = {
      userId: localStorage.getItem("studentCupUserId"),
      placements: placements,
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

  const getStudentById = (id) => allStudents.find((s) => s.id === id);

  const renderPlacementGroup = (studentIds, pointIndex, groupTitle) => {
    if (!studentIds || studentIds.length === 0) return null;

    const points = pointMap[pointIndex] ?? 0;

    return (
      <div>
        <h3 className="text-2xl font-semibold text-gray-400 mb-4">
          {groupTitle} - {points} Points
        </h3>
        <div className="flex justify-center gap-x-6 gap-y-4 flex-wrap">
          {studentIds.map((id) => {
            const student = getStudentById(id);
            if (!student) return null;
            return (
              <div
                key={student.id}
                className="flex flex-col items-center text-center"
              >
                <img
                  src={student.image}
                  alt={student.name}
                  className="w-24 h-24 rounded-full object-cover object-top border-4 border-gray-700"
                />
                <p className="mt-1 font-medium">{student.name}</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-900 text-white px-4 py-16">
      <div className="text-5xl font-bold mb-4 text-center">
        Tournament Winner!
      </div>
      {winner && (
        <>
          <img
            src={winner.image}
            alt={winner.name}
            className="w-96 h-96 object-cover object-top rounded-lg shadow-lg"
          />
          <div className="text-4xl mt-4 font-bold">{winner.name}</div>
          <p className="mt-2 text-2xl font-bold text-amber-400">
            +{pointMap[pointMap.length - 1]} Points
          </p>
        </>
      )}
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
          {placements.length > 0 && (
            <>
              {renderPlacementGroup(
                placements[placements.length - 2],
                pointMap.length - 2,
                "Runner-Up"
              )}
              {renderPlacementGroup(
                placements[placements.length - 3],
                pointMap.length - 3,
                "Semi-Finalists"
              )}
              {renderPlacementGroup(
                placements[placements.length - 4],
                pointMap.length - 4,
                "Quarter-Finalists"
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Results;

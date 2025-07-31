// ba-worldcup/client/src/App.jsx
import { useState, useEffect } from "react";
import Tournament from "./components/Tournament";
import Rankings from "./components/Rankings";
import { submitResults } from "./services/api";

const generateUUID = () => crypto.randomUUID();

const App = () => {
  const [gameStarted, setGameStarted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [modalImage, setModalImage] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    let currentUserId = localStorage.getItem("waifuCupUserId");
    if (!currentUserId) {
      currentUserId = generateUUID();
      localStorage.setItem("waifuCupUserId", currentUserId);
    }
    setUserId(currentUserId);

    const handleBeforeUnload = (event) => {
      if (gameStarted) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [gameStarted]);

  const handleStartGame = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setGameStarted(true);
      setIsTransitioning(false);
    }, 500);
  };

  const handleGoHome = () => {
    if (gameStarted) {
      const isConfirmed = window.confirm(
        "Are you sure you want to go home? All tournament progress will be lost."
      );
      if (!isConfirmed) {
        return;
      }
    }
    setGameStarted(false);
  };

  const handleSubmission = (results) => {
    const payload = {
      userId: userId,
      ...results,
    };
    submitResults(payload);
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
                  Blue Archive Character World Cup{" "}
                  <span className="text-gray-500">(BETA)</span>
                </h1>
                <p className="text-2xl text-blue-300 mb-8">
                  Vote For Your Favorite Students
                </p>
                <button
                  onClick={handleStartGame}
                  className="w-40 h-40 bg-blue-600 text-white rounded-full text-5xl font-bold hover:bg-blue-700 transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-2xl transform hover:scale-110"
                >
                  <span className="mb-2">Start!</span>
                </button>
              </div>
              <Rankings onImageClick={openImageModal} />
            </main>
          </div>
        </div>
      ) : (
        <Tournament onGoHome={handleGoHome} onSubmission={handleSubmission} />
      )}
    </>
  );
};

export default App;

// ba-worldcup/client/src/components/Rankings.jsx
import { useState, useEffect, useRef } from "react";
import { Tooltip } from "flowbite-react";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";
import { getRankings } from "../services/api";

const Rankings = ({ onImageClick }) => {
  const [rankings, setRankings] = useState([]);
  const [isLoadingRankings, setIsLoadingRankings] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");
  const [totalStudents, setTotalStudents] = useState(0);
  const [rowsToShow, setRowsToShow] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const footerRef = useRef(null);
  const isInitialMount = useRef(true);

  const totalPages = Math.ceil(rankings.length / rowsToShow);
  const startIndex = (currentPage - 1) * rowsToShow;
  const endIndex = startIndex + rowsToShow;
  const currentRankings = rankings.slice(startIndex, endIndex);

  useEffect(() => {
    const savedRows = localStorage.getItem("ba-worldcup-rows");
    if (savedRows) {
      setRowsToShow(Number(savedRows));
    }

    getRankings()
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
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
    } else {
      footerRef.current?.scrollIntoView({ behavior: "auto" });
    }
  }, [currentPage]);

  const handleRowsChange = (event) => {
    const newRowCount = Number(event.target.value);
    setRowsToShow(newRowCount);
    localStorage.setItem("ba-worldcup-rows", newRowCount);
    setCurrentPage(1);
  };

  return (
    <>
      <div className="w-full max-w-4xl flex justify-between items-center mt-4 mb-4">
        <h2 className="text-3xl font-bold mb-4 mt-4">
          Global Student Rank & Points
        </h2>
        <div className="flex items-center space-x-2">
          <label htmlFor="rows-select" className="text-sm text-gray-400">
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
                        Points are awarded based on final tournament rank:
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
                      <div
                        className="w-24 h-24 rounded-full overflow-hidden group cursor-pointer"
                        onClick={() => onImageClick(waifu.image)}
                      >
                        <div className="transition-transform duration-300 group-hover:scale-125">
                          <LazyLoadImage
                            alt={waifu.name}
                            src={waifu.image}
                            effect="blur"
                            className="w-full h-full object-cover object-top"
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-lg align-middle">{waifu.name}</td>
                    <td className="p-3 text-lg align-middle text-amber-300">
                      {waifu.totalPoints}
                    </td>
                    <td className="p-3 align-middle">
                      <div className="relative w-full bg-gray-700 rounded-full h-6 shadow-inner">
                        <div
                          className="bg-blue-500 h-6 rounded-full text-center transition-all duration-500"
                          style={{ width: `${waifu.rank1Ratio}%` }}
                        ></div>
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
            {"<<"} Prev
          </button>
          <span className="text-gray-400">
            Page {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
          >
            Next {">>"}
          </button>
        </div>
      )}
      <footer ref={footerRef} className="w-full text-center py-6 mb-5">
        {totalStudents > 0 && lastUpdated && (
          <p className="text-sm text-gray-500">
            Featuring a character roster of {totalStudents} students. | Roster
            Updated: {lastUpdated}
            <span className="mx-2">|</span>
            <a href="/about" className="text-blue-400 hover:underline">
              About / How Points Work
            </a>
          </p>
        )}
      </footer>
    </>
  );
};

export default Rankings;

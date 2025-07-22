# Blue Archive Waifu World Cup

This is a full-stack web application that allows users to vote for their favorite Blue Archive character in a dynamic, tournament-style bracket. It features a persistent global ranking system based on user submissions, a Node.js/Express backend, and a responsive React frontend built with Vite and Tailwind CSS.

(To add a screenshot: take a picture of your running application, upload it to a site like Imgur, and replace the URL above with your image link.)

## Core Features

- **Dynamic Tournament Generation:** The application gracefully handles any number of characters. If the character count is not a perfect power of two (e.g., 32, 64, 128), it automatically creates a fair preliminary "play-in" round to establish a perfect bracket.

- **Global Ranking System:** Every completed tournament can be submitted to the backend. The results are aggregated in an SQLite database, and the home page displays a live leaderboard of all characters, ranked by their "#1 Ratio" across all user votes.

- Interactive Voting Experience:

  - Clean, side-by-side matchups.
  - Visual feedback with a green border highlighting the user's selection.
  - Full keyboard navigation using the left and right arrow keys.

- Polished User Experience:
  - Confetti celebration for the tournament winner.
  - Confirmation dialogs for the "Home" button and page reloads to prevent accidental loss of tournament progress.
  - A professional skeleton loader while the ranking data is being fetched.
  - An automatic "Character Roster Updated" date in the footer that reads the file's metadata, requiring zero manual updates.

## Tech Stack

- Frontend: React, Vite, Tailwind CSS
- Backend: Node.js, Express.js
- Database: SQLite

---

## Project Structure

The project is organized into a standard client-server monorepo structure.
Generated code

```bash
/my-waifu-cup-app/
│
├── public/               # Static assets that are publicly served
│   └── images/           # All character images
│
├── src/                  # The main frontend React application source
│   ├── App.jsx           # The core application component and logic
│   ├── main.jsx          # The entry point for the React app
│   └── index.css         # Tailwind CSS directives
│
├── backend/              # The backend Node.js/Express server
│   ├── waifus.json       # The single source of truth for all character data
│   ├── waifus.db         # The SQLite database file (auto-generated)
│   └── server.js         # The Express API server logic
│
├── .gitignore
├── index.html            # The main HTML shell for the application
├── package.json          # Frontend dependencies and scripts
└── vite.config.js        # Vite configuration
```

# How to Run Locally

To run this project on your local machine, you will need to have Node.js installed.

### 1. Clone the Repository

First, clone this project to your local machine.

```bash
git clone <your-repository-url>
cd my-waifu-cup-app
```

### 2. Install Dependencies

You need to install dependencies for both the frontend and the backend separately.

```bash
# Install frontend dependencies (from the root directory)
npm install

# Install backend dependencies
cd backend
npm install
```

### 3. Run the Application

This project requires **two terminals** running at the same time: one for the backend server and one for the frontend development server.

**Terminal 1: Start the Backend**

```bash
# Navigate to the backend folder
cd backend

# Start the Node.js server
node server.js

# You should see: "Server is running on http://localhost:3001"
```

**Terminal 2: Start the Frontend**

```bash
# From the project's root directory (my-waifu-cup-app)
npm run dev

# This will automatically open the application in your browser,
# typically at http://localhost:5173/
```

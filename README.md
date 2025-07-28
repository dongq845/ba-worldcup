# Blue Archive Waifu World Cup (BETA)

A full-stack web application that lets you vote for your favorite Blue Archive character in a dynamic, tournament-style bracket and contributes to a global ranking.

### Try it live at [baworldcup.com!](https://baworldcup.com)

![Screenshot of the application](https://github.com/user-attachments/assets/acb3f604-af66-464e-b8a3-3f86d98db8c8)

## Core Features

- **Dynamic Tournament Generation:** The application gracefully handles any number of characters. If the character count is not a perfect power of two (e.g., 32, 64, 128), it automatically creates a fair preliminary "play-in" round to establish a perfect bracket.
- **Global Point-Based Ranking System:**
  - Rankings are determined by a "Total Points" system. When a user completes a tournament:
    - The Winner receives 5 points.
    - The Runner-up receives 3 points.
    - The Semi-Finalists each receive 2 points.
    - The Quarter-Finalists each receive 1 point.
  - These points are aggregated across all submissions to create a global leaderboard.
- **Fair & Persistent Voting:** Each user has a unique ID stored in their browser. Submitting a new tournament result **overwrites their previous submission**, preventing any user from spamming points and ensuring the rankings remain fair.
- **Interactive Voting Experience:**
  - Clean, side-by-side matchups with a smooth, animated progress bar.
  - Visual feedback with a green border highlighting the user's selection.
  - Full keyboard navigation using the left and right arrow keys for voting.
- **Polished User Experience:**
  - A confetti celebration for the tournament winner.
  - A custom, auto-dismissing pop-up notification confirms a successful result submission.
  - Clicking a character's thumbnail in the rankings opens a full-size image modal with a dimmed background.
  - Confirmation dialogs for the "Home" button and page reloads prevent accidental loss of tournament progress.
  - A professional skeleton loader is shown while the ranking data is being fetched.
  - An automatic "Character Roster Updated" date in the footer that reads the file's metadata, requiring zero manual updates.

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, Flowbite-React
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL

## Project Structure

```bash
/ba-worldcup/
│
├── client/           # React frontend application
│   ├── public/
│   ├── src/
│   │   ├── App.jsx     # Main application component
│   │   └── ...
│   ├── index.html
│   └── package.json
│
├── server/           # Node.js/Express backend API
│   ├── server.js     # Express server and API logic
│   ├── waifus.json   # Source of truth for all character data
│   └── package.json
│
└── README.md
```

## How to Run Locally

To run this project on your local machine, you will need to have Node.js installed.

### 1. Clone the Repository

First, clone this project to your local machine.

```bash
git clone <your-repository-url>
cd ba-worldcup
```

### 2. Install Dependencies

You need to install dependencies for both the frontend and the backend separately.

```bash
# Install frontend dependencies
cd client
npm install

# Install backend dependencies
cd ../server
npm install
```

### 3. Environment Variables

This project requires environment variables to connect the frontend to the backend and the backend to the database.

**Backend Setup:**

In the `/server` folder, create a new file named `.env`. This file will hold the connection string for your database.

```
# /server/.env
DATABASE_URL="postgresql://<user>:<password>@<host>:<port>/<database>"
```

**Frontend Setup:**

In the `/client` folder, you will need to create a file named `.env.development`.

```
# /client/.env.development
VITE_API_URL=http://localhost:3001
```

_(For production, you would also create a `.env.production` file pointing to your deployed server's URL, e.g., `VITE_API_BASE_URL=https://ba-worldcup-server.onrender.com`)_

### 4. Run the Application

This project requires **two terminals** running at the same time: one for the backend server and one for the frontend development server.

**Terminal 1: Start the Backend**

```bash
# Navigate to the backend folder
cd server

# Start the Node.js server
node server.js

# You should see: "Server is running on http://localhost:3001"
# and "Successfully connected to PostgreSQL database."
```

**Terminal 2: Start the Frontend**

```bash
# Navigate to the client folder
cd client

# Start the Vite development server
npm run dev

# This will automatically open the application in your browser,
# typically at http://localhost:5173/
```

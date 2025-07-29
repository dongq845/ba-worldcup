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
  - A skeleton loader is shown while the ranking data is being fetched.
  - An automatic "Character Roster Updated" date in the footer that reads the file's metadata, requiring zero manual updates.

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, Flowbite-React
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL
- **Infrastructure & Deployment:**
  - **Render:** Provides continuous deployment and hosting. The backend runs as a **Web Service**, and the frontend is served as a **Static Site** with a global CDN.
  - **Cloudflare:** Manages the custom domain, DNS records, and provides security services.

## Project Structure

```
/ba-worldcup/
│
├── .gitignore              # Specifies intentionally untracked files to ignore.
├── package-lock.json       # Records the exact version of each installed dependency.
├── README.md               # This file. Contains project overview, setup, and documentation.
├── render.yaml             # Configuration file for deploying the application on Render.
│
├── client/                 # Contains the entire frontend React application.
│   │
│   ├── .env.development    # Environment variables for the frontend in development mode.
│   ├── .env.production     # Environment variables for the frontend in production mode.
│   ├── eslint.config.js    # Configuration for ESLint, a code linter for JavaScript.
│   ├── index.html          # The main HTML file that serves as the entry point for the React app.
│   ├── package-lock.json   # Records the exact version of each frontend dependency.
│   ├── package.json        # Lists the frontend dependencies and scripts.
│   ├── vite.config.js      # Configuration file for Vite, the frontend build tool.
│   │
│   ├── .flowbite-react/    # Configuration files for the Flowbite-React component library.
│   │   ├── .gitignore      # .gitignore file for the Flowbite-React configuration.
│   │   ├── class-list.json # List of classes used by Flowbite-React.
│   │   └── config.json     # Main configuration for Flowbite-React.
│   │
│   ├── public/             # Contains static assets that are publicly accessible.
│   │   ├── favicon.ico     # The icon for the website tab.
│   │   ├── robots.txt      # Instructions for web crawlers.
│   │   └── sitemap.xml     # A map of the website's pages for search engines.
│   │
│   └── src/                # The source code for the React application.
│       ├── App.jsx         # The main application component that routes pages.
│       ├── main.jsx        # The entry point of the React application.
│       ├── NotFoundPage.jsx # The component for the 404 Not Found page.
│       └── style.css       # Global CSS styles for the application.
│
└── server/                 # Contains the entire backend Node.js/Express application.
    │
    ├── .env                # Environment variables for the backend (e.g., database connection string).
    ├── package-lock.json   # Records the exact version of each backend dependency.
    ├── package.json        # Lists the backend dependencies and scripts.
    ├── server.js           # The main entry point for the Express server and all API logic.
    └── waifus.json         # The source of truth for all character data, used to populate the database.
```

## Dependencies

### Frontend (`client/package.json`)

| Dependency                          | Description                                                                                       |
| ----------------------------------- | ------------------------------------------------------------------------------------------------- |
| **@tailwindcss/vite**               | A utility-first CSS framework packed with classes to build any design, directly in your markup.   |
| **canvas-confetti**                 | A lightweight library for creating a celebratory confetti effect on the screen.                   |
| **flowbite**                        | A popular component library built on top of Tailwind CSS for creating modern UIs.                 |
| **flowbite-react**                  | The official React components for the Flowbite library.                                           |
| **react**                           | A JavaScript library for building user interfaces.                                                |
| **react-dom**                       | Serves as the entry point to the DOM and server renderers for React.                              |
| **react-lazy-load-image-component** | A React component to lazy load images and other components/elements.                              |
| **react-router-dom**                | The standard library for routing in React, enabling navigation among views of various components. |

### Backend (`server/package.json`)

| Dependency  | Description                                                                                                                      |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **cors**    | A Node.js package for providing a Connect/Express middleware that can be used to enable CORS with various options.               |
| **dotenv**  | A zero-dependency module that loads environment variables from a `.env` file into `process.env`.                                 |
| **express** | A minimal and flexible Node.js web application framework that provides a robust set of features for web and mobile applications. |
| **pg**      | A non-blocking PostgreSQL client for Node.js.                                                                                    |

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

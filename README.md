# Blue Archive Student World Cup (BETA)

A full-stack web application that lets you vote for your favorite Blue Archive student in a dynamic, tournament-style bracket and contributes to a global ranking.

### Try it live at [baworldcup.com!](https://baworldcup.com)

![Screenshot of the application](https://github.com/user-attachments/assets/18cfde1c-e0c4-46a3-b668-308931a04a73)

## Core Features

The application is divided into three main user-facing pages, each with distinct functionality and API interactions.

### 1. Rankings Page (`/rankings`)

This is the main landing page, displaying the global leaderboard of all students.

![screenshot of rankings page](https://github.com/user-attachments/assets/84ee1cf9-56eb-48f7-b789-a20dadd4a9ec)

**Page Functionality:**

- Displays a ranked list of students based on points accumulated from all user tournament submissions.
- Shows each student's name, portrait, total points, and win rate.
- Includes a "Last Updated" timestamp indicating when the roster was last changed.
- Features a skeleton loader while data is being fetched to improve perceived performance.

**API Interaction:**

- **Endpoint:** `GET /api/rankings`
- **Description:** On page load, the frontend makes a single GET request to this endpoint to retrieve the entire list of ranked students and their stats.
- **Data Transfer (Response):** The server responds with a JSON object containing the rankings and metadata.

  _Example Response (`200 OK`):_

  ```json
  {
    "rankings": [
      {
        "id": 38,
        "name": "Sunaookami Shiroko",
        "image": "https://res.cloudinary.com/doi21aa5i/image/upload/v1753774561/Sunaookami_Shiroko_z9p9q9.png",
        "totalPoints": 525,
        "winCount": 21,
        "rank1Ratio": 21.0
      }
    ],
    "lastUpdated": "August 1, 2025",
    "totalStudents": 128
  }
  ```

### 2. Tournament Page (`/tournament`)

This is where the interactive voting takes place. Users are presented with a series of matchups in a single-elimination bracket.

![Screenshot of tournament page](https://github.com/user-attachments/assets/bf00ae35-5d46-419c-af71-8211b39ed3d4)

**Page Functionality:**

- Dynamically generates a fair tournament bracket. If the number of students is not a power of two, it automatically creates a preliminary "play-in" round.
- Users vote by clicking on a student's image or using the left/right arrow keys.
- A progress bar visualizes the user's position within the current round.
- Upon completion, the user is automatically redirected to the `/results` page.

**API Interaction:**

- **Endpoint:** `GET /api/students`
- **Description:** Before the tournament begins, the frontend fetches the complete list of all participating students. This data is then used to construct the bracket on the client-side.

### 3. Results Page (`/results`)

This page displays the outcome of the user's most recently completed tournament and handles the submission of the results to the backend.

![Screenshot of results page](https://github.com/user-attachments/assets/adfb01bd-c4d1-4491-b45b-62925ef86322)

**Page Functionality:**

- Shows the tournament winner and a detailed breakdown of placements for other students.
- Triggers a confetti animation to celebrate the winner.
- Automatically sends the tournament results to the server to update the global rankings.

**API Interaction:**

- **Endpoint:** `POST /api/submit`
- **Description:** After the final match, the frontend sends a POST request containing the results. The payload includes a unique `userId` (stored in `localStorage`) to ensure that each user's submission overwrites their previous one, preventing point spamming.
- **Data Transfer (Request Body):** The client sends a JSON object with a `userId` and a `placements` array. The `placements` array is ordered by round, containing the IDs of students eliminated in each round, with the winner at the end.

  _Example Payload (`POST /api/submit`):_

  ```json
  {
    "userId": "a-unique-identifier-for-the-user",
    "placements": [
      [65, 66, ...],
      [33, 34, ...],
      [17, 18, ...],
      [9, 10, 11, 12, 13, 14, 15, 16],
      [5, 6, 7, 8],
      [3, 4],
      [2],
      [1]
    ]
  }
  ```

- **Server Logic:** The backend processes this payload, using the index of each array in `placements` to determine the points to award (e.g., index `7` gets 25 points, index `6` gets 18 points, etc.). If the `userId` already exists, it first reverts the points from their previous submission before applying the new ones.

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, Flowbite-React
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL
- **Infrastructure & Deployment:**
  - **Render:** Provides continuous deployment and hosting. The backend runs as a **Web Service**, and the frontend is served as a **Static Site** with a global CDN. Uses `render.yaml` for declarative infrastructure as code.
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
│   │
│   ├── public/             # Contains static assets that are publicly accessible.
│   │
│   └── src/                # The source code for the React application.
│       ├── components/     # Contains reusable React components.
│       │   ├── Tournament.jsx # Manages the tournament logic and view.
│       │   ├── Rankings.jsx   # Displays the global rankings.
│       │   └── Results.jsx    # Shows the tournament results.
│       ├── services/       # Contains modules for API calls.
│       │   └── api.js         # Handles all fetch requests to the backend.
│       ├── App.jsx         # The main application component that routes pages.
│       ├── AboutPage.jsx   # The component for the static '/about' page.
│       ├── main.jsx        # The entry point of the React application.
│       ├── NotFoundPage.jsx # The component for the 404 Not Found page.
│       ├── ScrollToTop.jsx # A component that scrolls the window to the top on route changes.
│       └── style.css       # Global CSS styles for the application.
│
└── server/                 # Contains the entire backend Node.js/Express application.
    │
    ├── .env.development    # Environment variables for backend in development (should be in .gitignore).
    ├── .env.production     # Environment variables for backend in production (should be in .gitignore).
    ├── package-lock.json   # Records the exact version of each backend dependency.
    ├── package.json        # Lists the backend dependencies and scripts.
    ├── server.js           # The main entry point for the Express server.
    ├── students.json       # The source of truth for all character data, used to populate the database.
    │
    ├── db/                 # Contains database-related modules.
    │   └── index.js        # Handles database connection and initialization.
    ├── controllers/        # Contains the business logic for API routes.
    │   ├── studentsController.js # Logic for student and ranking routes.
    │   └── submissionsController.js # Logic for submission routes.
    └── routes/             # Defines the API routes.
        ├── students.js     # Routes for students and rankings.
        └── submissions.js # Routes for submissions.
```

## How to Run Locally

To run this project on your local machine, you will need to have Node.js and PostgreSQL installed.

### 1. Clone the Repository

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

This project uses environment variables to connect the frontend to the backend and the backend to the database. **Backend environment files should never be committed to public Git history and must be added to `.gitignore`.**

**Backend Setup (`/server`):**

1.  In the `/server` folder, create a file named `.env.development`.
2.  Add your local database connection string to this file.

    ```
    # /server/.env.development
    DATABASE_URL="postgresql://postgres:password@localhost:5432/baworldcup"
    ```

**Frontend Setup (`/client`):**

1.  In the `/client` folder, create a file named `.env.development`.
2.  Add the URL for your local backend server.

    ```
    # /client/.env.development
    VITE_API_URL=http://localhost:3001
    ```

    _(For production, the file `.env.production` points to your deployed server's URL, e.g., `https://ba-worldcup-server.onrender.com`. This file is safe and necessary to commit.)_

### 4. Run the Application

This project requires **two terminals** running at the same time.

**Terminal 1: Start the Backend**

```bash
# Navigate to the backend folder
cd server

# For development with auto-restarting on file changes:
npm run dev
```

**Terminal 2: Start the Frontend**

```bash
# Navigate to the client folder
cd client

# Start the Vite development server
npm run dev
```

## API Endpoints

| Method | Endpoint        | Description                                         |
| ------ | --------------- | --------------------------------------------------- |
| `GET`  | `/api/students` | Retrieves the full list of all characters.          |
| `GET`  | `/api/rankings` | Retrieves the global character rankings and points. |
| `POST` | `/api/submit`   | Submits the results of a completed tournament.      |

## Data Schema

### Character Object (`students.json`)

Each character in the `students.json` array and the database follows this structure:

```json
{
  "id": 1,
  "name": "Aikiyo Fuuka",
  "image": "https://res.cloudinary.com/doi21aa5i/image/upload/v1753774561/Aikiyo_Fuuka_rprrll.png"
}
```

### Submission Payload (`POST /api/submit`)

The client sends a JSON payload with the user's ID and an ordered `placements` array. The position of each sub-array determines the points awarded.

```json
{
  "userId": "a-unique-identifier-for-the-user",
  "placements": [
    // Array at index 0: 64 students who lost in the Round of 128 (0 points)
    [65, 66, ...],
    // Array at index 1: 32 students who lost in the Round of 64 (1 point)
    [33, 34, ...],
    // ...and so on...
    // Array at index 6: The Runner-Up (18 points)
    [2],
    // Array at index 7: The Winner (25 points)
    [1]
  ]
}
```

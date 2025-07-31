# Blue Archive Student World Cup (BETA)

A full-stack web application that lets you vote for your favorite Blue Archive student in a dynamic, tournament-style bracket and contributes to a global ranking.

### Try it live at [baworldcup.com!](https://baworldcup.com)

![Screenshot of the application](https://github.com/user-attachments/assets/acb3f604-af66-464e-b8a3-3f86d98db8c8)

## Core Features

The application is divided into three main user-facing pages, each with distinct functionality and API interactions.

### 1. Rankings Page (`/rankings`)

This is the main landing page, displaying the global leaderboard of all students.

**Page Functionality:**
- Displays a ranked list of students based on points accumulated from all user tournament submissions.
- Shows each student's name, portrait, and total points.
- Includes a "Last Updated" timestamp indicating when the rankings were last changed.
- Features a skeleton loader while data is being fetched to improve perceived performance.

**API Interaction:**
- **Endpoint:** `GET /api/rankings`
- **Description:** On page load, the frontend makes a single GET request to this endpoint to retrieve the entire list of ranked students.
- **Data Transfer (Response):** The server responds with a JSON array of student objects, sorted by points in descending order.

  *Example Response (`200 OK`):*
  ```json
  [
    {
      "id": 1,
      "name": "Aikiyo Fuuka",
      "image": "https://res.cloudinary.com/doi21aa5i/image/upload/v1753774561/Aikiyo_Fuuka_rprrll.png",
      "points": 150
    },
    {
      "id": 2,
      "name": "Akeboshi Himari",
      "image": "https://res.cloudinary.com/doi21aa5i/image/upload/v1753774561/Akeboshi_Himari_z2exv3.png",
      "points": 125
    }
  ]
  ```

### 2. Tournament Page (`/tournament`)

This is where the interactive voting takes place. Users are presented with a series of matchups in a single-elimination bracket.

**Page Functionality:**
- Dynamically generates a fair tournament bracket. If the number of students is not a power of two (e.g., 32, 64), it automatically creates a preliminary "play-in" round.
- Users vote by clicking on a student's image or using the left/right arrow keys.
- A progress bar visualizes the user's position within the current round.
- Upon completion, the user is automatically redirected to the `/results` page.

**API Interaction:**
- **Endpoint:** `GET /api/students`
- **Description:** Before the tournament begins, the frontend fetches the complete list of all participating students. This data is then used to construct the bracket on the client-side.
- **Data Transfer (Response):** The server provides a JSON array of all student objects, typically unsorted.

  *Example Response (`200 OK`):*
  ```json
  [
    {
      "id": 1,
      "name": "Aikiyo Fuuka",
      "image": "https://res.cloudinary.com/doi21aa5i/image/upload/v1753774561/Aikiyo_Fuuka_rprrll.png"
    },
    {
      "id": 2,
      "name": "Akeboshi Himari",
      "image": "https://res.cloudinary.com/doi21aa5i/image/upload/v1753774561/Akeboshi_Himari_z2exv3.png"
    }
  ]
  ```

### 3. Results Page (`/results`)

This page displays the outcome of the user's most recently completed tournament and handles the submission of the results to the backend.

**Page Functionality:**
- Shows the tournament winner, runner-up, semi-finalists, and quarter-finalists.
- Triggers a confetti animation to celebrate the winner.
- Automatically sends the tournament results to the server to update the global rankings.

**API Interaction:**
- **Endpoint:** `POST /api/submit`
- **Description:** After the final match, the frontend sends a POST request containing the results. The payload includes a unique `userId` (stored in the user's `localStorage`) to ensure that each user's submission overwrites their previous one, preventing point spamming.
- **Data Transfer (Request Body):** The client sends a JSON object detailing the placements.

  *Example Payload:*
  ```json
  {
    "userId": "a-unique-identifier-for-the-user",
    "winner": { "id": 1 },
    "runnerUp": { "id": 2 },
    "semiFinalists": [{ "id": 3 }, { "id": 4 }],
    "quarterFinalists": [{ "id": 5 }, { "id": 6 }, { "id": 7 }, { "id": 8 }]
  }
  ```
- **Server Logic:** The backend processes this payload, calculates the points for each student (Winner: 5, Runner-up: 3, etc.), and updates the database. If the `userId` already exists in the submissions table, it first reverts the points from their previous submission before applying the new ones.
- **Data Transfer (Response):** The server responds with a success or error message.

  *Example Response (`200 OK`):*
  ```json
  {
    "message": "Results submitted successfully"
  }
  ```

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
    ├── .env                # Environment variables for the backend (e.g., database connection string).
    ├── package-lock.json   # Records the exact version of each backend dependency.
    ├── package.json        # Lists the backend dependencies and scripts.
    ├── server.js           # The main entry point for the Express server.
    ├── students.json         # The source of truth for all character data, used to populate the database.
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

## Development & Testing

To ensure code quality, run the linter for the client-side code:

```bash
# From the /client directory
npm run lint
```

Currently, the project does not have an automated test suite. Future development should include adding unit and integration tests using a framework like Jest or Vitest.

## API Endpoints

The backend server provides the following RESTful API endpoints.

| Method | Endpoint          | Description                                         |
|--------|-------------------|-----------------------------------------------------|
| `GET`  | `/api/students`     | Retrieves the full list of all characters.          |
| `GET`  | `/api/rankings`   | Retrieves the global character rankings and points. |
| `POST` | `/api/submit`     | Submits the results of a completed tournament.      |

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
The client sends the following JSON payload when submitting results:
```json
{
  "userId": "some-unique-user-id",
  "winner": { "id": 1 },
  "runnerUp": { "id": 2 },
  "semiFinalists": [{ "id": 3 }, { "id": 4 }],
  "quarterFinalists": [{ "id": 5 }, { "id": 6 }, { "id": 7 }, { "id": 8 }]
}
```
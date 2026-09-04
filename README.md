# Task Management App

A full-stack productivity application that helps users create, organize and track tasks, priorities and deadlines from a single dashboard.

## Features

- User registration and login
- Password hashing with bcrypt
- JWT-based authentication
- Protected task APIs
- Add, edit, complete and delete tasks
- Task priorities: Low, Medium, High
- Task status: Pending, In Progress, Completed
- Due-date and overdue tracking
- Search and filter tasks
- Dashboard statistics
- Responsive interface for desktop and mobile
- Server-side input validation
- Security headers with Helmet
- Persistent local JSON storage with separate data files

## Tech Stack

- Frontend: HTML5, CSS3, Vanilla JavaScript
- Backend: Node.js, Express.js
- Authentication: JWT + bcryptjs
- Security: Helmet, validation, protected routes
- Storage: JSON file persistence

## Run Locally

1. Install Node.js.
2. Open a terminal in the project folder.
3. Install dependencies:

```bash
npm install
```

4. Start the server:

```bash
npm start
```

5. Open:

```text
http://localhost:3000
```

## Demo Flow

1. Create a new account.
2. Log in.
3. Add tasks with priority and due date.
4. Update status as work progresses.
5. Search or filter tasks.
6. Complete or delete tasks.
7. Use the dashboard to monitor overall progress.

## Project Structure

```text
task-management-app/
├── data/
│   ├── tasks.json
│   └── users.json
├── public/
│   ├── index.html
│   ├── app.js
│   └── styles.css
├── middleware/
│   └── auth.js
├── utils/
│   └── storage.js
├── .gitignore
├── package.json
├── README.md
└── server.js
```

> Note: This project uses JSON files to keep the setup simple for an internship/demo project. For production, the storage layer can be replaced with PostgreSQL or MongoDB without changing the frontend workflow.

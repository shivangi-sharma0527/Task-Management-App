const express = require("express");
const path = require("path");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const helmet = require("helmet");

const { authenticate, JWT_SECRET } = require("./middleware/auth");
const { read, write } = require("./utils/storage");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(express.json({ limit: "50kb" }));
app.use(express.static(path.join(__dirname, "public")));

const allowedPriorities = ["Low", "Medium", "High"];
const allowedStatuses = ["Pending", "In Progress", "Completed"];

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function makeToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email },
    JWT_SECRET,
    { expiresIn: "2h" }
  );
}

function validateTask(body) {
  const title = clean(body.title);
  const description = clean(body.description);
  const priority = clean(body.priority) || "Medium";
  const status = clean(body.status) || "Pending";
  const dueDate = clean(body.dueDate);

  if (title.length < 2 || title.length > 100) {
    return "Task title must contain 2-100 characters.";
  }
  if (description.length > 500) {
    return "Description cannot exceed 500 characters.";
  }
  if (!allowedPriorities.includes(priority)) {
    return "Invalid priority.";
  }
  if (!allowedStatuses.includes(status)) {
    return "Invalid status.";
  }
  if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    return "Invalid due date.";
  }

  return null;
}

app.post("/api/auth/register", async (req, res) => {
  const name = clean(req.body.name);
  const email = clean(req.body.email).toLowerCase();
  const password = typeof req.body.password === "string" ? req.body.password : "";

  if (name.length < 2 || name.length > 60) {
    return res.status(400).json({ message: "Name must contain 2-60 characters." });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: "Enter a valid email address." });
  }

  if (password.length < 6 || password.length > 72) {
    return res.status(400).json({ message: "Password must contain 6-72 characters." });
  }

  const users = read("users.json");
  if (users.some(u => u.email === email)) {
    return res.status(409).json({ message: "An account with this email already exists." });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    id: crypto.randomUUID(),
    name,
    email,
    passwordHash,
    createdAt: new Date().toISOString()
  };

  users.push(user);
  write("users.json", users);

  res.status(201).json({
    message: "Account created successfully.",
    token: makeToken(user),
    user: { id: user.id, name: user.name, email: user.email }
  });
});

app.post("/api/auth/login", async (req, res) => {
  const email = clean(req.body.email).toLowerCase();
  const password = typeof req.body.password === "string" ? req.body.password : "";

  const users = read("users.json");
  const user = users.find(u => u.email === email);

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  res.json({
    message: "Login successful.",
    token: makeToken(user),
    user: { id: user.id, name: user.name, email: user.email }
  });
});

app.get("/api/auth/me", authenticate, (req, res) => {
  res.json({ user: req.user });
});

app.get("/api/tasks", authenticate, (req, res) => {
  const tasks = read("tasks.json")
    .filter(task => task.userId === req.user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json(tasks);
});

app.post("/api/tasks", authenticate, (req, res) => {
  const error = validateTask(req.body);
  if (error) return res.status(400).json({ message: error });

  const tasks = read("tasks.json");
  const now = new Date().toISOString();

  const task = {
    id: crypto.randomUUID(),
    userId: req.user.id,
    title: clean(req.body.title),
    description: clean(req.body.description),
    priority: clean(req.body.priority) || "Medium",
    status: clean(req.body.status) || "Pending",
    dueDate: clean(req.body.dueDate),
    createdAt: now,
    updatedAt: now
  };

  tasks.push(task);
  write("tasks.json", tasks);
  res.status(201).json(task);
});

app.put("/api/tasks/:id", authenticate, (req, res) => {
  const error = validateTask(req.body);
  if (error) return res.status(400).json({ message: error });

  const tasks = read("tasks.json");
  const index = tasks.findIndex(t => t.id === req.params.id && t.userId === req.user.id);

  if (index === -1) {
    return res.status(404).json({ message: "Task not found." });
  }

  tasks[index] = {
    ...tasks[index],
    title: clean(req.body.title),
    description: clean(req.body.description),
    priority: clean(req.body.priority) || "Medium",
    status: clean(req.body.status) || "Pending",
    dueDate: clean(req.body.dueDate),
    updatedAt: new Date().toISOString()
  };

  write("tasks.json", tasks);
  res.json(tasks[index]);
});

app.delete("/api/tasks/:id", authenticate, (req, res) => {
  const tasks = read("tasks.json");
  const exists = tasks.some(t => t.id === req.params.id && t.userId === req.user.id);

  if (!exists) {
    return res.status(404).json({ message: "Task not found." });
  }

  write("tasks.json", tasks.filter(t => !(t.id === req.params.id && t.userId === req.user.id)));
  res.json({ message: "Task deleted successfully." });
});

app.get("/api/dashboard", authenticate, (req, res) => {
  const tasks = read("tasks.json").filter(t => t.userId === req.user.id);
  const today = new Date().toISOString().slice(0, 10);

  const completed = tasks.filter(t => t.status === "Completed").length;
  const pending = tasks.filter(t => t.status !== "Completed").length;
  const overdue = tasks.filter(t => t.dueDate && t.dueDate < today && t.status !== "Completed").length;
  const highPriority = tasks.filter(t => t.priority === "High" && t.status !== "Completed").length;

  res.json({
    total: tasks.length,
    completed,
    pending,
    overdue,
    highPriority,
    completionRate: tasks.length ? Math.round((completed / tasks.length) * 100) : 0
  });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Task Management App running at http://localhost:${PORT}`);
});

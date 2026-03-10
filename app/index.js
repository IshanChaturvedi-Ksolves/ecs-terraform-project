const express = require("express");
const { Pool } = require("pg");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

/* -------------------- DATABASE CONNECTION -------------------- */

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: { rejectUnauthorized: false },
});

/* -------------------- DB INITIALIZATION -------------------- */

(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS todos (
        id SERIAL PRIMARY KEY,
        task TEXT NOT NULL,
        completed BOOLEAN DEFAULT false
      )
    `);

    console.log("Todos table ready");
  } catch (err) {
    console.error("DB Setup Error:", err);
  }
})();

/* -------------------- HEALTH CHECK FOR ALB -------------------- */

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

/* -------------------- API TEST ENDPOINT -------------------- */

app.get("/api", (req, res) => {
  res.json({
    message: "ECS CI/CD Deployment Successful 🚀",
  });
});

/* -------------------- HOME PAGE -------------------- */

app.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM todos ORDER BY id DESC");

    const todosHTML = result.rows
      .map(
        (todo) => `
      <li class="${todo.completed ? "completed" : ""}">
        
        <form method="POST" action="/toggle/${todo.id}" style="display:inline;">
          <input type="checkbox" onchange="this.form.submit()" ${
            todo.completed ? "checked" : ""
          } />
        </form>

        <span>${todo.task}</span>

        <form method="POST" action="/edit/${todo.id}" style="display:inline;">
          <input name="updatedTask" placeholder="Edit task" required />
          <button class="edit-btn">Update</button>
        </form>

        <form method="POST" action="/delete/${todo.id}" style="display:inline;">
          <button class="delete-btn">Delete</button>
        </form>

      </li>
    `
      )
      .join("");

    res.send(`
    <html>
      <head>
        <title>Cloud Todo App</title>

        <style>
          body {
            font-family: Arial;
            background: #f4f6f9;
            padding: 40px;
          }

          .container {
            max-width: 600px;
            margin: auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
          }

          h1 {
            text-align: center;
          }

          input[type="text"], input[name="updatedTask"] {
            padding: 8px;
            margin-right: 5px;
          }

          button {
            padding: 6px 10px;
            border: none;
            cursor: pointer;
          }

          .edit-btn {
            background: #007bff;
            color: white;
          }

          .delete-btn {
            background: #dc3545;
            color: white;
          }

          li {
            margin: 10px 0;
            list-style: none;
          }

          .completed span {
            text-decoration: line-through;
            color: gray;
          }

        </style>
      </head>

      <body>

        <div class="container">

          <h1>Cloud Todo App 🚀</h1>

          <form method="POST" action="/add">
            <input type="text" name="task" placeholder="Enter task" required />
            <button>Add</button>
          </form>

          <ul>
            ${todosHTML}
          </ul>

        </div>

      </body>

    </html>
    `);
  } catch (err) {
    console.error("Database Error:", err);
    res.send("Database connection failed");
  }
});

/* -------------------- ADD TASK -------------------- */

app.post("/add", async (req, res) => {
  try {
    const { task } = req.body;

    await pool.query(
      "INSERT INTO todos (task) VALUES ($1)",
      [task]
    );

    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.send("Failed to add task");
  }
});

/* -------------------- UPDATE TASK -------------------- */

app.post("/edit/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { updatedTask } = req.body;

    await pool.query(
      "UPDATE todos SET task=$1 WHERE id=$2",
      [updatedTask, id]
    );

    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.send("Update failed");
  }
});

/* -------------------- TOGGLE COMPLETION -------------------- */

app.post("/toggle/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      "UPDATE todos SET completed = NOT completed WHERE id=$1",
      [id]
    );

    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.send("Toggle failed");
  }
});

/* -------------------- DELETE TASK -------------------- */

app.post("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      "DELETE FROM todos WHERE id=$1",
      [id]
    );

    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.send("Delete failed");
  }
});

/* -------------------- START SERVER -------------------- */

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
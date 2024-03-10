const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();

app.use(express.json());

const databasePath = path.join(__dirname, "todoApplication.db");

let database = null;

const initializeDBAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running at http://lacalhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperties = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperties = (requestQuery) => {
  return requestQuery.status !== undefined;
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
            SELECT *
            FROM todo
            WHERE 
                todo LIKE '%${search_q}%'
                AND status = '${status}'
                AND priority = '${priority}';`;
      break;
    case hasPriorityProperties(requestQuery):
      getTodosQuery = `
            SELECT
                *
            FROM
                todo
            WHERE todo LIKE '%${search_q}%'
            AND priority = '${priority}';`;
      break;
    case hasStatusProperties(requestQuery):
      getTodosQuery = `
            SELECT
                *
            FROM
                todo
            WHERE todo LIKE '%${search_q}%'
            AND status = '${status}';`;
      break;
    default:
      getTodosQuery = `
            SELECT
                *
            FROM
                todo
            WHERE todo LIKE '%${search_q}%';`;
  }
  data = await database.all(getTodosQuery);
  response.send(data);
});

app.get("/todos/todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
        SELECT *
        FROM todo
        WHERE id = ${todoId};`;
  const todo = await database.get(getTodoQuery);
  response.send(todo);
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.params;
  const postTodoQuery = `
        INSERT INTO
            todo(id, todo, priority, status)
        VALUES
        (${id}, '${todo}', '${priority}', '${status}');`;
  await database.run(postTodoQuery);
  response.send("Todo Successfully Added");
});

app.put("/todos/todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
  }
  const previousTodoQuery = `
    SELECT *
    FROM todo
    WHERE id = ${todoId};`;
  const previousTodo = await database.run(previousTodoQuery);
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;

  const updateTodoQuery = `
    UPDATE
        todo
    SET
        todo='${todo}',
        priority='${priority}',
        status='${status}'
    WHERE
        id = ${todoId};`;

  await database.run(updateTodoQuery);
  response.send(`${updateColumn} 
  
  Updated`);
});

app.delete("/todos/todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
            DELETE 
            FROM todo
            WHERE id = ${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;

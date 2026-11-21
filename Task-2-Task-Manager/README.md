# TaskFlow — Dynamic Task Manager

TaskFlow is a responsive, browser-based task manager and productivity tracker created for the Datheon Full Stack Web Development Internship, Task 2. It uses plain HTML, CSS, and JavaScript. Tasks and the selected theme are saved in the browser on the current device; there is no backend, account, or database.

## Features

- Dashboard counts for total, active, completed, and overdue tasks.
- Create, read, edit, delete, complete, and restore tasks.
- Work, Personal, and Study categories with distinct visual badges.
- Low, Medium, and High priorities.
- Due date labels, due-today reminders, and overdue highlighting.
- Combined status and category filters, plus instant search across titles, descriptions, and categories.
- Native HTML drag-and-drop reordering, including while a filter is active.
- Browser confirmation before deleting a task or clearing completed tasks.
- Dark and light themes; the selection is remembered locally.
- Responsive layout, keyboard search shortcut (`Ctrl/⌘ + K`), focus indicators, and reduced-motion support.
- Safe task rendering through DOM creation and `textContent`.

## Technologies

- HTML5 semantic elements and forms
- CSS3, Flexbox, Grid, responsive media queries, and custom properties
- Vanilla JavaScript (ES6+), DOM manipulation, and event listeners
- Browser `localStorage` for persistence
- Native HTML Drag and Drop API

## Folder structure

```text
Task-2-Task-Manager/
├── index.html
├── style.css
├── script.js
├── README.md
└── assets/
    └── images/
```

The existing Task 1 portfolio remains in the workspace root and was not moved or edited as part of Task 2.

## Run the application

No installation, build step, server, or database is required. Open `index.html` in a modern browser. You can also open this folder in VS Code and use **Open with Live Server** if that extension is already installed.

## How to use TaskFlow

1. Enter a task title, choose a category, set a due date, and select a priority. Description is optional.
2. Press **Add task**. The task appears in the board and the dashboard counters update.
3. Use the checkbox to complete or restore a task. Use the pencil button to edit it.
4. Use the delete button to remove a task. The browser asks you to confirm first.
5. Combine a status chip, category dropdown, and search query to narrow the board.
6. Drag a task card over another card to change its position. Its new order is saved.
7. Use **Clear completed** to remove all completed tasks after confirming.
8. Select the sun/moon button to change themes.

## CRUD and task data

The app keeps a JavaScript array of task objects. A task has this shape:

```js
{
  id: "unique-id",
  title: "Prepare project outline",
  description: "List the main sections",
  category: "Study",
  dueDate: "2026-11-25",
  priority: "Medium",
  completed: false,
  order: 0,
  createdAt: "2026-11-21T10:00:00.000Z"
}
```

- **Create:** `addTask()` validates the form, adds an object to the array, saves, and redraws the board.
- **Read:** `loadFromLocalStorage()` loads and normalizes saved data. `displayTasks()` creates visible task cards from the array.
- **Update:** `editTask()` copies a task into the form; `updateTask()` applies edited values. `toggleTaskCompletion()` updates completion status.
- **Delete:** `deleteTask()` asks for confirmation and removes the selected task. Clearing completed tasks uses the same confirmation pattern.

## localStorage behavior

The task array is serialized with `JSON.stringify()` and saved under `taskflow-tasks-v1` whenever it changes. On startup, `loadFromLocalStorage()` parses and checks the saved values. Empty, malformed, or unavailable storage is handled safely, and the page starts with an empty list if task data cannot be read. Theme preference is stored separately under `taskflow-theme-v1`.

Local storage is specific to the browser profile and device. It is not synced, backed up, or shared between devices. Clearing browser site data also removes saved tasks. Do not use this app to store sensitive information.

## Screenshots

Screenshot placeholder: capture the app in your browser and add an image such as `assets/images/taskflow-screenshot.png`, then embed it here:

```md
![TaskFlow dashboard](assets/images/taskflow-screenshot.png)
```

## Author

**Aathmika Sarveswaran** — Datheon Full Stack Web Development Internship participant.

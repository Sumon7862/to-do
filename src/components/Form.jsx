import React, { useEffect, useRef, useState } from 'react';
import { ToastContainer, toast, Zoom } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getDatabase, ref, set, push, onValue, remove, update } from "firebase/database";
import moment from 'moment';
import { Pencil, Trash2, CheckCircle, Timer, Star } from 'lucide-react';

const Form = () => {
  const [task, setTask] = useState("");
  const [description, setDescription] = useState("");
  const [dueDateInput, setDueDateInput] = useState("");
  const [dueTimeInput, setDueTimeInput] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [taskData, setTaskData] = useState([]);
  const [editId, setEditId] = useState(null);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) return saved === 'true';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const inputRef = useRef(null);
  const [countdowns, setCountdowns] = useState({});

  const notify = (type = 'success', message = 'Done!') => {
    toast[type](message, {
      position: "top-right",
      autoClose: 2000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: true,
      theme: darkMode ? "dark" : "light",
      transition: Zoom,
    });
  };

  useEffect(() => {
    const db = getDatabase();
    const todoRef = ref(db, 'inputs/');
    const unsubscribe = onValue(todoRef, (snapshot) => {
      const Arr = [];
      snapshot.forEach((item) => {
        Arr.push({ value: item.val(), id: item.key });
      });
      setTaskData(Arr.reverse());
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      checkDueTasks();
      updateCountdowns();
    }, 1000);

    checkDueTasks();

    return () => clearInterval(interval);
  }, [taskData]);

  // Update countdowns for all tasks
  const updateCountdowns = () => {
    const now = moment();
    const newCountdowns = {};
    taskData.forEach(({ id, value }) => {
      if (value.dueDate && !value.completed) {
        const due = moment(value.dueDate);
        if (due.isAfter(now)) {
          const diff = moment.duration(due.diff(now));
          const days = Math.floor(diff.asDays());
          const hours = diff.hours();
          const minutes = diff.minutes();
          const seconds = diff.seconds();
          newCountdowns[id] = `${days}d ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
          newCountdowns[id] = "Expired";
        }
      } else {
        newCountdowns[id] = null;
      }
    });
    setCountdowns(newCountdowns);
  };

  // Check and notify due tasks once per minute
  const checkDueTasks = () => {
    const now = moment();
    taskData.forEach(taskItem => {
      const t = taskItem.value;
      if (
        t.dueDate &&
        !t.completed &&
        !t.alarmTriggered &&
        moment(t.dueDate).isSameOrBefore(now)
      ) {
        if (Notification.permission === "granted") {
          new Notification(`Task due: "${t.todoname}"`);
        }
        notify('info', `Task due: "${t.todoname}"`);

        const db = getDatabase();
        update(ref(db, 'inputs/' + taskItem.id), { alarmTriggered: true });
      }
    });
  };

  const handleDelete = (id) => {
    const db = getDatabase();
    remove(ref(db, 'inputs/' + id)).then(() => {
      notify('info', 'Deleted successfully!');
      if (id === editId) {
        setTask('');
        setDescription('');
        setDueDateInput('');
        setDueTimeInput('');
        setDueDate('');
        setEditId(null);
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const db = getDatabase();
    if (!task.trim()) {
      notify("error", "Please enter a task!");
      return;
    }

    const timestamp = moment().format('DD-MM-YYYY hh:mm:ss A');
    const descToSave = description.trim();

    const taskObj = {
      todoname: task,
      description: descToSave,
      completed: false,
      priority: false,
      updatedAt: timestamp,
      alarmTriggered: false,
    };

    if (dueDate) {
      taskObj.dueDate = dueDate;
    }

    if (editId) {
      update(ref(db, 'inputs/' + editId), taskObj).then(() => {
        notify("success", "Updated successfully!");
        setTask('');
        setDescription('');
        setDueDateInput('');
        setDueTimeInput('');
        setDueDate('');
        setEditId(null);
      });
    } else {
      taskObj.createdAt = timestamp;
      set(push(ref(db, 'inputs/')), taskObj).then(() => {
        notify("success", "Task added successfully!");
        setTask('');
        setDescription('');
        setDueDateInput('');
        setDueTimeInput('');
        setDueDate('');
      });
    }
  };

  const handleEdit = (id, value) => {
    setTask(value.todoname);
    setDescription(value.description || '');
    setEditId(id);
    if (value.dueDate) {
      const m = moment(value.dueDate);
      setDueDateInput(m.format('YYYY-MM-DD'));
      setDueTimeInput(m.format('HH:mm'));
      setDueDate(value.dueDate);
    } else {
      setDueDateInput('');
      setDueTimeInput('');
      setDueDate('');
    }
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const length = value.todoname.length;
        inputRef.current.setSelectionRange(length, length);
      }
    }, 0);
  };

  const handleToggleComplete = (id, current) => {
    const db = getDatabase();
    update(ref(db, 'inputs/' + id), { completed: !current }).then(() => {
      notify('success', current ? 'Marked as pending!' : 'Marked as completed!');
    });
  };

  const togglePriority = (id, current) => {
    const db = getDatabase();
    update(ref(db, 'inputs/' + id), { priority: !current }).then(() => {
      notify('info', current ? 'Priority removed' : 'Marked as priority');
    });
  };

  useEffect(() => {
    if (!dueDateInput) {
      setDueDate('');
      return;
    }
    const combinedISO = dueDateInput + (dueTimeInput ? `T${dueTimeInput}:00` : 'T00:00:00');
    setDueDate(moment(combinedISO).toISOString());
  }, [dueDateInput, dueTimeInput]);

  // Filter and search tasks
  let filteredTasks = taskData.filter(item => {
    const nameMatch = item.value.todoname.toLowerCase().includes(search.toLowerCase());
    if (filter === 'Completed') return item.value.completed && nameMatch;
    if (filter === 'Pending') return !item.value.completed && nameMatch;
    return nameMatch;
  });

  // Overdue check helper
  const isOverdue = (task) => {
    if (!task.dueDate || task.completed) return false;
    return moment(task.dueDate).isBefore(moment());
  };

  return (
    <div className={`${darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-100 text-gray-900"} min-h-screen p-4 sm:p-6 md:p-10 transition-colors duration-500`}>
      <ToastContainer />
      <div className={`max-w-5xl mx-auto bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-colors duration-500`}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-center sm:text-left bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-green-500 dark:from-blue-400 dark:to-green-400">
            To-Do List
          </h1>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`px-5 py-2 rounded-lg font-semibold transition-colors duration-300
              ${darkMode ? "bg-yellow-400 text-gray-900 hover:bg-yellow-300" : "bg-gray-800 text-white hover:bg-gray-700"}`}
            aria-label="Toggle dark mode"
          >
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          aria-label="Add or edit task form"
        >
          <input
            ref={inputRef}
            value={task}
            onChange={(e) => setTask(e.target.value)}
            type="text"
            placeholder="Write your task title here..."
            className={`col-span-1 sm:col-span-2 p-3 rounded-lg border
              ${darkMode ? "border-gray-600 bg-gray-700 text-white placeholder-gray-400" : "border-gray-300 bg-white text-gray-900 placeholder-gray-500"}
              focus:outline-none focus:ring-2 focus:ring-blue-400`}
            aria-label="Task title"
            required
          />

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Write task description here..."
            rows={3}
            className={`col-span-1 sm:col-span-2 p-3 rounded-lg border resize-none
              ${darkMode ? "border-gray-600 bg-gray-700 text-white placeholder-gray-400" : "border-gray-300 bg-white text-gray-900 placeholder-gray-500"}
              focus:outline-none focus:ring-2 focus:ring-blue-400`}
            aria-label="Task description"
          />

          <input
            id="dueDate"
            type="date"
            value={dueDateInput}
            onChange={(e) => setDueDateInput(e.target.value)}
            className={`p-3 rounded-lg border
              ${darkMode ? "border-gray-600 bg-gray-700 text-white" : "border-gray-300 bg-white text-gray-900"}
              focus:outline-none focus:ring-2 focus:ring-blue-400`}
            aria-label="Due date"
          />
          <input
            id="dueTime"
            type="time"
            value={dueTimeInput}
            onChange={(e) => setDueTimeInput(e.target.value)}
            className={`p-3 rounded-lg border
              ${darkMode ? "border-gray-600 bg-gray-700 text-white" : "border-gray-300 bg-white text-gray-900"}
              focus:outline-none focus:ring-2 focus:ring-blue-400`}
            aria-label="Due time"
          />

          <button
            type="submit"
            className={`col-span-1 sm:col-span-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors duration-300`}
          >
            {editId ? 'Update Task' : 'Add Task'}
          </button>
        </form>

        {/* Filter & Search */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
          <div className="flex flex-wrap gap-2">
            {['All', 'Completed', 'Pending'].map(opt => (
              <button
                key={opt}
                onClick={() => setFilter(opt)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-300
                  ${filter === opt
                    ? 'bg-blue-600 text-white'
                    : darkMode
                      ? 'bg-gray-600 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                aria-pressed={filter === opt}
              >
                {opt}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className={`p-2 rounded-lg border w-full max-w-xs
              ${darkMode ? "border-gray-600 bg-gray-700 text-white placeholder-gray-400" : "border-gray-300 bg-white text-gray-900 placeholder-gray-500"}
              focus:outline-none focus:ring-2 focus:ring-blue-400`}
            aria-label="Search tasks"
          />
        </div>

        {/* Recent 3 Tasks */}
        {filteredTasks.length > 0 && (
          <div className="mt-10">
            <div className="flex items-center gap-2 mb-4">
              <Timer size={18} className="text-blue-400" />
              <h2 className="text-lg font-semibold">Recent 3 Tasks</h2>
            </div>
            <ul className="list-disc list-inside text-sm text-gray-500 dark:text-gray-400 mb-6">
              {filteredTasks.slice(0, 3).map(t => (
                <li key={t.id}>{t.value.todoname}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Task List */}
        {filteredTasks.length > 0 ? (
          <div className="space-y-4">
            {filteredTasks.map((item) => {
              const overdue = isOverdue(item.value);
              return (
                <div
                  key={item.id}
                  className={`${darkMode ? 'bg-gray-700' : 'bg-white'} rounded-lg shadow p-4 space-y-2 transition-all border
                    ${overdue ? 'border-red-500' : 'border-transparent'}`}
                >
                  <div className="flex flex-wrap justify-between items-start gap-4">
                    <div className={`text-lg font-medium break-all flex flex-wrap items-center gap-2
                      ${item.value.completed ? 'line-through text-gray-400' : ''}`}>
                      {item.value.priority && <Star size={16} className="text-yellow-400" />}
                      {item.value.todoname}
                      {countdowns[item.id] && !item.value.completed && (
                        <span
                          className={`ml-2 font-mono text-sm px-2 py-1 rounded cursor-default select-none
                            ${darkMode
                              ? 'bg-red-700 text-red-300 border border-red-500'
                              : 'bg-red-100 text-red-700 border border-red-300'
                            }`}
                          aria-label="Countdown timer"
                        >
                          {countdowns[item.id]}
                        </span>
                      )}
                      {overdue && (
                        <span className="ml-2 text-red-400 font-semibold text-sm italic">(Overdue)</span>
                      )}
                    </div>

                    <div className="flex gap-2 flex-wrap flex-shrink-0">
                      <button
                        onClick={() => handleToggleComplete(item.id, item.value.completed)}
                        className={`border px-2 py-1 rounded
                          ${item.value.completed ? 'bg-green-500 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                        aria-label={item.value.completed ? "Mark as pending" : "Mark as completed"}
                      >
                        <CheckCircle size={18} />
                      </button>
                      <button
                        onClick={() => handleEdit(item.id, item.value)}
                        className="border px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                        aria-label="Edit task"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => togglePriority(item.id, item.value.priority)}
                        className={`border px-2 py-1 rounded
                          ${item.value.priority ? 'bg-yellow-500 text-white' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'}`}
                        aria-label={item.value.priority ? "Remove priority" : "Mark as priority"}
                      >
                        <Star size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="border px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
                        aria-label="Delete task"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {item.value.description && (
                    <p
                      className={`text-sm text-justify max-w-full ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
                      style={{ whiteSpace: 'pre-wrap' }}
                    >
                      {expanded === item.id
                        ? item.value.description
                        : item.value.description.length > 70
                          ? item.value.description.slice(0, 70) + '...'
                          : item.value.description}
                      {item.value.description.length > 70 && (
                        <button
                          onClick={() =>
                            setExpanded(expanded === item.id ? null : item.id)
                          }
                          className="ml-2 text-blue-500 underline hover:text-blue-700"
                          aria-expanded={expanded === item.id}
                        >
                          {expanded === item.id ? 'See less' : 'See more'}
                        </button>
                      )}
                    </p>
                  )}

                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Created: {item.value.createdAt || 'N/A'}</span>
                    <span>Updated: {item.value.updatedAt || 'N/A'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-center mt-10 text-gray-500 dark:text-gray-400">No tasks found.</p>
        )}
      </div>
    </div>
  );
};

export default Form;

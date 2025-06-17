import React, { useEffect, useRef, useState } from 'react';
import { ToastContainer, toast, Zoom } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getDatabase, ref, set, push, onValue, remove, update } from "firebase/database";
import moment from 'moment';
import { Pencil, Trash2, CheckCircle } from 'lucide-react';

const Form = () => {
  const [task, setTask] = useState("");
  const [description, setDescription] = useState("");
  const [taskData, setTaskData] = useState([]);
  const [editId, setEditId] = useState(null);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved === 'true' ? true : false;
  });
  const inputRef = useRef(null);

  const notify = (type = 'success', message = 'Done!') => {
    toast[type](message, {
      position: "top-right",
      autoClose: 1000,
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
    onValue(todoRef, (snapshot) => {
      const Arr = [];
      snapshot.forEach((item) => {
        Arr.push({ value: item.val(), id: item.key });
      });
      setTaskData(Arr.reverse());
    });
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  const handleDelete = (id) => {
    const db = getDatabase();
    remove(ref(db, 'inputs/' + id)).then(() => {
      notify('info', 'Deleted successfully!');
      if (id === editId) {
        setTask('');
        setDescription('');
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
    const descToSave = description.trim() === "" ? "No description" : description;

    const taskObj = {
      todoname: task,
      description: descToSave,
      completed: false,
      updatedAt: timestamp
    };

    if (editId) {
      update(ref(db, 'inputs/' + editId), taskObj).then(() => {
        notify("success", "Updated successfully!");
        setTask('');
        setDescription('');
        setEditId(null);
      });
    } else {
      taskObj.createdAt = timestamp;
      set(push(ref(db, 'inputs/')), taskObj).then(() => {
        notify("success", "Task added successfully!");
        setTask('');
        setDescription('');
      });
    }
  };

  const handleEdit = (id, value) => {
    setTask(value.todoname);
    setDescription(value.description || '');
    setEditId(id);
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

  let filteredTasks = taskData.filter(item => {
    const nameMatch = item.value.todoname.toLowerCase().includes(search.toLowerCase());
    if (filter === 'Completed') return item.value.completed && nameMatch;
    if (filter === 'Pending') return !item.value.completed && nameMatch;
    return nameMatch;
  });

  if (filter === 'All') {
    filteredTasks = filteredTasks.sort((a, b) => {
      if (a.value.completed === b.value.completed) return 0;
      if (a.value.completed) return 1;
      return -1;
    });
  }

  return (
    <div className={`${darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-100 text-gray-900"} min-h-screen p-4 transition-colors duration-500`}>
      <ToastContainer />
      <div className={`${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-300"} max-w-3xl mx-auto my-10 p-8 rounded-xl shadow-md border transition-colors duration-500`}>
        <div className="flex justify-between items-center relative">
          <h1
            className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-500 dark:from-blue-400 dark:to-green-400 animate-fade-in absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none"
            aria-hidden="true"
          >
            To-Do List
          </h1>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors duration-300 z-10 ${
              darkMode ? "bg-yellow-400 text-gray-900 hover:bg-yellow-300" : "bg-gray-800 text-white hover:bg-gray-700"
            }`}
            aria-label="Toggle Dark Mode"
          >
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4 animate-slide-in">
          <input
            ref={inputRef}
            value={task}
            onChange={(e) => setTask(e.target.value)}
            type="text"
            placeholder={darkMode ? "Write your task title here..." : "Write your task title here..."}
            className={`w-full p-3 rounded-lg border ${
              darkMode ? "border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:ring-blue-400" :
                "border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:ring-blue-400"
            } focus:outline-none focus:ring-2`}
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={darkMode ? "Write task description here..." : "Write task description here..."}
            className={`w-full p-3 rounded-lg border ${
              darkMode ? "border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:ring-blue-400" :
                "border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:ring-blue-400"
            } resize-none focus:outline-none focus:ring-2`}
            rows={3}
          />
          <button
            type="submit"
            className={`w-full max-w-xs mx-auto block px-6 py-3 rounded-lg text-white font-semibold ${
              editId ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
            } transition-colors duration-300`}
          >
            {editId ? 'Update' : 'Submit'}
          </button>
        </form>

        <div className="mt-6 flex justify-between gap-2 items-center">
          <div className="flex gap-2">
            {['All', 'Completed', 'Pending'].map(opt => (
              <button
                key={opt}
                onClick={() => setFilter(opt)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-300 ${
                  filter === opt
                    ? 'bg-blue-600 text-white'
                    : darkMode
                      ? 'bg-gray-600 text-white'
                      : 'bg-gray-200 text-gray-700'
                }`}
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
            className={`p-2 rounded border focus:outline-none focus:ring-2 transition-colors duration-300 ${
              darkMode ? "border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:ring-blue-400" :
                "border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:ring-blue-400"
            }`}
          />
        </div>

        {filteredTasks.length > 0 ? (
          <div className="mt-10 space-y-4 animate-fade-in">
            {filteredTasks.map((item) => (
              <div
                key={item.id}
                className={`
                  relative p-4 rounded-lg transition-all duration-300 ease-in-out
                  ${item.value.completed ? 'opacity-60 line-through' : ''}
                  ${darkMode
                    ? 'bg-gray-700 shadow-lg shadow-black/50'
                    : 'bg-white shadow-lg shadow-gray-400/40'}
                `}
              >
                {/* Flex row: task title + buttons */}
                <div className="flex justify-between items-center">
                  <p className={`${darkMode ? "text-white" : "text-gray-800"} text-lg font-medium`}>
                    {item.value.todoname}
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleComplete(item.id, item.value.completed)}
                      className={`p-1 rounded border transition-colors duration-300
                        ${darkMode ? 'border-green-400 text-green-400 hover:bg-green-400 hover:text-gray-900' : 'border-green-600 text-green-600 hover:bg-green-600 hover:text-white'}`}
                      aria-label="Toggle Complete"
                      title={item.value.completed ? "Mark as Pending" : "Mark as Completed"}
                    >
                      <CheckCircle size={24} />
                    </button>
                    <button
                      onClick={() => handleEdit(item.id, item.value)}
                      className={`p-1 rounded border transition-colors duration-300
                        ${darkMode ? 'border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-gray-900' : 'border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white'}`}
                      aria-label="Edit Task"
                      title="Edit Task"
                    >
                      <Pencil size={24} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className={`p-1 rounded border transition-colors duration-300
                        ${darkMode ? 'border-red-400 text-red-400 hover:bg-red-400 hover:text-gray-900' : 'border-red-600 text-red-600 hover:bg-red-600 hover:text-white'}`}
                      aria-label="Delete Task"
                      title="Delete Task"
                    >
                      <Trash2 size={24} />
                    </button>
                  </div>
                </div>
                {/* Description full width below */}
                <p className={`${darkMode ? "text-gray-300 mt-2" : "text-gray-500 mt-2"} text-justify whitespace-pre-wrap`}>
                  {item.value.description}
                </p>
                {/* Updated timestamp below description */}
                <p className={`${darkMode ? "text-gray-400 italic mt-2" : "text-gray-500 italic mt-2"} text-sm`}>
                  {item.value.updatedAt ? `Updated: ${item.value.updatedAt}` : `Created: ${item.value.createdAt}`}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className={`${darkMode ? "text-gray-300" : "text-gray-500"} mt-10 text-center text-lg animate-fade-in`}>
            No tasks found in "{filter}" filter.
          </div>
        )}
      </div>
    </div>
  );
};

export default Form;

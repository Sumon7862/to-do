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
  const [expanded, setExpanded] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved === 'true';
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
    const descToSave = description.trim();

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
    setDescription(value.description);
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
    filteredTasks = filteredTasks.sort((a, b) => a.value.completed - b.value.completed);
  }

  return (
    <div className={`${darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-100 text-gray-900"} min-h-screen p-4 transition-colors duration-500`}>
      <ToastContainer />
      <div className={`${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-300"} max-w-3xl mx-auto my-10 p-6 sm:p-8 rounded-xl shadow-md border transition-colors duration-500`}>

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-500 dark:from-blue-400 dark:to-green-400">
            To-Do List
          </h1>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors duration-300 ${darkMode ? "bg-yellow-400 text-gray-900 hover:bg-yellow-300" : "bg-gray-800 text-white hover:bg-gray-700"}`}
          >
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            ref={inputRef}
            value={task}
            onChange={(e) => setTask(e.target.value)}
            type="text"
            placeholder="Write your task title here..."
            className={`w-full p-3 rounded-lg border ${darkMode ? "border-gray-600 bg-gray-700 text-white placeholder-gray-400" : "border-gray-300 bg-white text-gray-900 placeholder-gray-500"} focus:outline-none focus:ring-2 focus:ring-blue-400`}
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Write task description here..."
            className={`w-full p-3 rounded-lg border ${darkMode ? "border-gray-600 bg-gray-700 text-white placeholder-gray-400" : "border-gray-300 bg-white text-gray-900 placeholder-gray-500"} resize-none focus:outline-none focus:ring-2 focus:ring-blue-400`}
            rows={3}
          />
          <button
            type="submit"
            className={`w-full sm:w-1/2 mx-auto block px-6 py-3 rounded-lg text-white font-semibold ${editId ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} transition-colors duration-300`}
          >
            {editId ? 'Update' : 'Submit'}
          </button>
        </form>

        <div className="mt-6 flex flex-col sm:flex-row justify-between gap-4 items-center">
          <div className="flex gap-2 flex-wrap">
            {['All', 'Completed', 'Pending'].map(opt => (
              <button
                key={opt}
                onClick={() => setFilter(opt)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-300 ${filter === opt ? 'bg-blue-600 text-white' : darkMode ? 'bg-gray-600 text-white' : 'bg-gray-200 text-gray-700'}`}
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
            className={`p-2 rounded border focus:outline-none focus:ring-2 transition-colors duration-300 ${darkMode ? "border-gray-600 bg-gray-700 text-white placeholder-gray-400" : "border-gray-300 bg-white text-gray-900 placeholder-gray-500"}`}
          />
        </div>

        {filteredTasks.length > 0 ? (
          <div className="mt-10 space-y-4">
            {filteredTasks.map((item) => (
              <div key={item.id} className={`${darkMode ? 'bg-gray-700' : 'bg-white'} rounded-lg shadow p-4 space-y-2 transition-all`}>
                <div className="flex justify-between items-start">
                  <div className="text-lg font-medium break-all w-3/4">{item.value.todoname}</div>
                  <div className="flex gap-2">
                    <button onClick={() => handleToggleComplete(item.id, item.value.completed)} className="border px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200">
                      <CheckCircle size={18} />
                    </button>
                    <button onClick={() => handleEdit(item.id, item.value)} className="border px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200">
                      <Pencil size={18} />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="border px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <div className={`${darkMode ? "text-gray-300" : "text-gray-700"} text-sm text-justify whitespace-pre-wrap break-words w-full`}>
                  {item.value.description && item.value.description.length > 100 && expanded !== item.id ? (
                    <>
                      {item.value.description.slice(0, 100)}...
                      <button
                        onClick={() => setExpanded(item.id)}
                        className={`ml-2 underline text-sm font-medium transition-colors ${darkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-800"}`}
                      >
                        See more
                      </button>
                    </>
                  ) : item.value.description && expanded === item.id ? (
                    <>
                      {item.value.description}
                      <button
                        onClick={() => setExpanded(null)}
                        className={`ml-2 underline text-sm font-medium transition-colors ${darkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-800"}`}
                      >
                        See less
                      </button>
                    </>
                  ) : (
                    item.value.description || 'No description'
                  )}
                </div>
                <div className="text-xs italic text-right text-gray-400">
                  {item.value.updatedAt ? `Updated: ${item.value.updatedAt}` : `Created: ${item.value.createdAt}`}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center mt-10 text-gray-400 text-lg">No tasks found in "{filter}" filter.</div>
        )}
      </div>
    </div>
  );
};

export default Form;

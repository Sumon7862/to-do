import React, { useEffect, useState } from 'react'
import { ToastContainer, toast, Zoom } from 'react-toastify';
import { getDatabase, ref, set, push, onValue } from "firebase/database";

const Form = () => {

    const [task, setTask] = useState("");
    const [taskData, setTaskData] = useState([])

    const notify = () => {
        task == "" ?
            toast.error('Write your comments !', {
                position: "bottom-right",
                autoClose: 2000,
                hideProgressBar: false,
                closeOnClick: false,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "dark",
                transition: Zoom,
            }) :
            toast.success('Successfully Done !', {
                position: "bottom-right",
                autoClose: 2000,
                hideProgressBar: false,
                closeOnClick: false,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "dark",
                transition: Zoom,
            });
    }

    useEffect(() => {
        const db = getDatabase();
        const todoRef = ref(db, 'inputs/');
        onValue(todoRef, (snapshot) => {
            const data = snapshot.val();
            const Arr = []
            snapshot.forEach((item) => {
                Arr.push(item.val())
                setTaskData(Arr)
            })
        });
    }, [])

    const handleChange = (e) => {
        setTask(e.target.value);
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!task) {
            notify();
        } else {
            const db = getDatabase();
            set(push(ref(db, 'inputs/')), {
                todoname: task,
            }).then(() => {
                notify();
            })
        }
        
    }

    return (
        <>
            <form className="bg-cyan-100 max-w-sm mx-auto mt-10 shadow-xl/20 p-10" onSubmit={handleSubmit}>
                <ToastContainer
                    position="bottom-right"
                    autoClose={2000}
                    hideProgressBar={false}
                    newestOnTop={false}
                    closeOnClick={false}
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                    theme="dark"
                    transition={Zoom}
                />
                <ToastContainer
                    position="bottom-right"
                    autoClose={2000}
                    hideProgressBar={false}
                    newestOnTop={false}
                    closeOnClick={false}
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                    theme="dark"
                    transition={Zoom}
                />
                <h1 className='text-center font-bold text-3xl text-green-900'>To-Do Project</h1>
                <hr className='mt-2 text-green-600' />
                <div className="mb-2 mt-5">
                    <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Your Comments</label>
                    <input
                        onChange={handleChange}
                        type="text"
                        id="email" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Write your comments . . ." />
                </div>
                <div className='block text-center mt-5'>
                    <button type="submit" className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Submit</button>
                </div>
            </form>

            <div className='flex flex-wrap justify-center gap-x-5 gap-y-5 mt-10 mb-10 mx-auto p-10 w-[90%] text-justify text-sm font-medium text-gray-900 bg-green-900 border-gray-200 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white'>
                    {
                        taskData.map((item) =>{
                            return (
                                <p className='bg-blue-200 w-[18%] font-medium italic px-4 py-2 border border-gray-900 rounded-lg dark:border-gray-600'>
                                    {item.todoname}
                                </p>
                            )
                        })
                    }
            </div>
        </>
    )
}

export default Form

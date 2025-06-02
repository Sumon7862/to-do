import React from 'react'
import react_logo from '../assets/react.svg'

const Navbar = () => {
    return (
        <>
            <nav className='flex bg-black text-white items-center justify-between px-10 h-15'>
                <div>
                    <img src={react_logo} alt="#" />
                </div>
                <div>
                    <ul className='flex gap-10 font-medium'>
                        <li className='hover:text-red-600'><a href="#">Home</a></li>
                        <li className='hover:text-red-600'><a href="#">Blog</a></li>
                        <li className='hover:text-red-600'><a href="#">Service</a></li>
                        <li className='hover:text-red-600'><a href="#">About</a></li>
                    </ul>
                </div>
                <div>
                    <button className='bg-white text-black px-3 rounded-lg font-medium hover:bg-red-500 hover:text-white cursor-pointer'>Click</button>
                </div>
            </nav>

        </>
    )
}

export default Navbar

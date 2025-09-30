import React from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login', { replace: true });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-100 to-blue-200 flex flex-col items-center justify-center p-4">
            <div className="max-w-xl w-full bg-white p-8 rounded-xl shadow-2xl border border-green-200 text-center">
                <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Welcome to Your Dashboard!</h1>
                <p className="text-lg text-gray-700 mb-6">
                    You have successfully logged in and reached the protected area.
                </p>
                <p className="text-md text-gray-600 mb-8">
                    This is your main application page where you can manage your tasks, profile, or other features.
                </p>
                <button
                    onClick={handleLogout}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75"
                >
                    Logout
                </button>
            </div>
        </div>
    );
};

export default HomePage;
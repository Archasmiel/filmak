import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api.js';
import { toast } from 'react-toastify';
import { ThumbsUp, ThumbsDown, LogOut } from 'lucide-react';

const HomePage = () => {
    const navigate = useNavigate();
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMovies = async () => {
            try {
                setLoading(true);
                const response = await api.get('/movies');
                setMovies(response.data);
                setError(null);
            } catch (err) {
                console.error("Error fetching movies:", err);
                setError("Failed to load movies. Please check API server.");
                toast.error("Failed to fetch movie list.");
            } finally {
                setLoading(false);
            }
        };

        fetchMovies();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login', { replace: true });
    };

    const MovieCard = ({ movie }) => (
        <Link 
            to={`/movies/${movie.id}`} 
            className="block bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 overflow-hidden group border border-gray-200"
        >
            <div className="relative h-64 w-full">
                <img
                    src={movie.poster_path || 'https://placehold.co/500x750/1e293b/ffffff?text=No+Poster'}
                    alt={movie.title}
                    className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-90"
                    onError={(e) => e.currentTarget.src = 'https://placehold.co/500x750/1e293b/ffffff?text=No+Poster'}
                />
            </div>
            <div className="p-4">
                <h2 className="text-lg font-bold text-gray-900 truncate mb-2">{movie.title}</h2>
                <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center text-green-600 font-semibold">
                        <ThumbsUp className="w-4 h-4 mr-1" />
                        {movie.likes_count || 0}
                    </div>
                    <div className="flex items-center text-red-600 font-semibold">
                        <ThumbsDown className="w-4 h-4 mr-1" />
                        {movie.dislikes_count || 0}
                    </div>
                </div>
            </div>
        </Link>
    );

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col p-4 sm:p-8">
            <header className="w-full max-w-7xl mx-auto flex justify-between items-center py-4 px-4 bg-white rounded-xl shadow-lg border border-gray-100 mb-6">
                <h1 className="text-3xl font-extrabold text-gray-900">Movie Dashboard</h1>
                <button
                    onClick={handleLogout}
                    className="flex items-center bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75"
                >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                </button>
            </header>

            <main className="w-full max-w-7xl mx-auto flex-grow">
                {loading && (
                    <div className="text-center p-10">
                        <svg className="animate-spin h-8 w-8 text-blue-500 mx-auto" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="mt-2 text-gray-600">Loading movies...</p>
                    </div>
                )}

                {error && (
                    <div className="text-center p-10 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                        <p className="font-semibold">{error}</p>
                    </div>
                )}

                {!loading && movies.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                        {movies.map((movie) => (
                            <MovieCard key={movie.id} movie={movie} />
                        ))}
                    </div>
                )}
                
                {!loading && !error && movies.length === 0 && (
                    <div className="text-center p-10 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg">
                        <p className="font-semibold text-lg">No movies found. Please check the backend service's database population.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default HomePage;

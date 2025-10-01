import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api.js';
import { toast } from 'react-toastify';
import { ThumbsUp, ThumbsDown, MessageSquare, CornerUpLeft, Trash2, Edit } from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

const getCurrentUserIdPlaceholder = () => {
    return 'current_user_id_placeholder'; 
};


const MovieDetailPage = () => {
    const { movieId } = useParams();
    const navigate = useNavigate();
    const [movie, setMovie] = useState(null);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userReaction, setUserReaction] = useState(null);
    const [newCommentContent, setNewCommentContent] = useState(''); // For new comment input
    const [isPosting, setIsPosting] = useState(false); // To prevent multiple submissions
    
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editingContent, setEditingContent] = useState('');
    
    const currentUserId = getCurrentUserIdPlaceholder();

    const fetchMovieData = useCallback(async () => {
        try {
            setLoading(true);
            const [movieRes, commentsRes] = await Promise.all([
                api.get(`/movies/${movieId}`),
                api.get(`/movies/${movieId}/comments`),
            ]);

            setMovie(movieRes.data);
            setComments(commentsRes.data);
            
            setError(null);
        } catch (err) {
            console.error("Error fetching movie data:", err);
            setError("Failed to load movie details or comments.");
            if (err.response && err.response.status === 404) {
                toast.error("Movie not found.");
                navigate('/', { replace: true });
            } else {
                toast.error("Error loading data.");
            }
        } finally {
            setLoading(false);
        }
    }, [movieId, navigate]);
    
    useEffect(() => {
        fetchMovieData();
    }, [fetchMovieData]);


    const handleReaction = async (type) => {
        try {
            await api.post(`/movies/${movieId}/reaction`, { type });
            toast.success(`Reaction ${type === 'remove' ? 'removed' : 'set'}!`);
            
            if (type === userReaction) {
                setUserReaction(null);
            } else {
                setUserReaction(type);
            }
            
            await fetchMovieData(); 

        } catch (err) {
            console.error("Error setting reaction:", err);
            toast.error("Failed to update reaction.");
        }
    };
    
    const handleAddComment = async (e) => {
        e.preventDefault();
        if (newCommentContent.trim().length === 0) {
            toast.warn("Comment cannot be empty.");
            return;
        }

        setIsPosting(true);
        try {
            await api.post(`/movies/${movieId}/comments`, { content: newCommentContent.trim() });
            setNewCommentContent('');
            toast.success("Comment added!");
            
            await fetchMovieData();

        } catch (err) {
            console.error("Error adding comment:", err);
            toast.error("Failed to add comment.");
        } finally {
            setIsPosting(false);
        }
    };

    const handleDeleteComment = async (commentId) => {        
        try {
            await api.delete(`/movies/${movieId}/comments/${commentId}`);
            toast.success("Comment deleted.");
            await fetchMovieData();

        } catch (err) {
            console.error("Error deleting comment:", err);
            toast.error("Failed to delete comment or unauthorized.");
        }
    };

    const handleUpdateComment = async (e) => {
        e.preventDefault();
        if (editingContent.trim().length === 0) {
            toast.warn("Comment cannot be empty.");
            return;
        }
        
        try {
            await api.put(`/movies/${movieId}/comments/${editingCommentId}`, { content: editingContent.trim() });
            toast.success("Comment updated.");
            setEditingCommentId(null);
            setEditingContent('');
            await fetchMovieData();

        } catch (err) {
            console.error("Error updating comment:", err);
            toast.error("Failed to update comment or unauthorized.");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <svg className="animate-spin h-10 w-10 text-blue-500" viewBox="0 0 24 24"></svg>
                <p className="ml-3 text-lg text-gray-700">Loading movie details...</p>
            </div>
        );
    }

    if (error || !movie) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-red-50 text-red-700 p-8">
                <p className="text-xl font-semibold">{error || "Movie data is missing."}</p>
            </div>
        );
    }
    
    const formatUserId = (userId) => {
        if (userId === null || userId === undefined) {
            return 'Unknown User';
        }
        const idString = String(userId);
        if (idString.length < 8) {
            return idString;
        }
        return idString.substring(0, 8) + '...';
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
            <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-2xl border border-gray-100">
                
                <header className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between">
                    <button 
                        onClick={() => navigate('/')}
                        className="flex items-center text-blue-600 hover:text-blue-800 transition duration-150"
                    >
                        <CornerUpLeft className="w-5 h-5 mr-2" />
                        Back to List
                    </button>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 truncate max-w-[70%]">{movie.title}</h1>
                    <div></div> 
                </header>

                <div className="p-6 sm:p-8 flex flex-col md:flex-row gap-6">
                    <div className="md:w-1/3 flex-shrink-0">
                        <img 
                            src={movie.poster_path || 'https://placehold.co/500x750/1e293b/ffffff?text=No+Poster'}
                            alt={movie.title} 
                            className="w-full h-auto rounded-lg shadow-xl"
                            onError={(e) => e.currentTarget.src = 'https://placehold.co/500x750/1e293b/ffffff?text=No+Poster'}
                        />
                    </div>

                    <div className="md:w-2/3">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">{movie.title}</h2>
                        
                        <p className="text-gray-700 mb-6 leading-relaxed">{movie.overview}</p>

                        <div className="flex items-center space-x-6 mb-8 border-t border-b py-4">
                            <div className="flex items-center text-green-600 font-semibold text-xl">
                                <ThumbsUp className="w-6 h-6 mr-2" />
                                <span>{movie.likes_count} Likes</span>
                            </div>
                            <div className="flex items-center text-red-600 font-semibold text-xl">
                                <ThumbsDown className="w-6 h-6 mr-2" />
                                <span>{movie.dislikes_count} Dislikes</span>
                            </div>
                             <div className="flex items-center text-blue-600 font-semibold text-xl">
                                <MessageSquare className="w-6 h-6 mr-2" />
                                <span>{movie.comments_count} Comments</span>
                            </div>
                        </div>
                        
                        <div className="mb-8">
                            <h3 className="text-lg font-semibold text-gray-700 mb-3">Your Reaction:</h3>
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => handleReaction(userReaction === 'like' ? 'remove' : 'like')}
                                    className={`flex items-center py-2 px-4 rounded-full font-bold transition duration-200 ${
                                        userReaction === 'like'
                                            ? 'bg-green-600 text-white hover:bg-green-700 shadow-md'
                                            : 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-300'
                                    }`}
                                >
                                    <ThumbsUp className="w-5 h-5 mr-2" />
                                    {userReaction === 'like' ? 'Liked!' : 'Like'}
                                </button>

                                <button
                                    onClick={() => handleReaction(userReaction === 'dislike' ? 'remove' : 'dislike')}
                                    className={`flex items-center py-2 px-4 rounded-full font-bold transition duration-200 ${
                                        userReaction === 'dislike'
                                            ? 'bg-red-600 text-white hover:bg-red-700 shadow-md'
                                            : 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-300'
                                    }`}
                                >
                                    <ThumbsDown className="w-5 h-5 mr-2" />
                                    {userReaction === 'dislike' ? 'Disliked!' : 'Dislike'}
                                </button>
                                
                                {userReaction && (
                                    <button
                                        onClick={() => handleReaction('remove')}
                                        className="py-2 px-4 rounded-full font-bold transition duration-200 bg-gray-200 text-gray-700 hover:bg-gray-300"
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 sm:p-8 border-t border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Comments ({comments.length})</h2>

                    <form onSubmit={handleAddComment} className="mb-8 bg-gray-50 p-4 rounded-lg shadow-inner">
                        <textarea
                            value={newCommentContent}
                            onChange={(e) => setNewCommentContent(e.target.value)}
                            placeholder="Write your comment..."
                            rows="3"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 resize-none mb-3"
                            required
                            disabled={isPosting}
                        ></textarea>
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={isPosting || newCommentContent.trim().length === 0}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-lg transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isPosting ? 'Posting...' : 'Post Comment'}
                            </button>
                        </div>
                    </form>

                    <div className="space-y-4">
                        {comments.length === 0 ? (
                            <p className="text-gray-500 italic">Be the first to comment!</p>
                        ) : (
                            comments.map((comment) => (
                                <div key={comment.id} className="border-b border-gray-100 pb-4 last:border-b-0">
                                    {editingCommentId === comment.id ? (
                                        <form onSubmit={handleUpdateComment} className="bg-yellow-50 p-3 rounded-lg">
                                            <textarea
                                                value={editingContent}
                                                onChange={(e) => setEditingContent(e.target.value)}
                                                rows="2"
                                                className="w-full p-2 border border-yellow-300 rounded-lg resize-none mb-2"
                                                required
                                            ></textarea>
                                            <div className="flex justify-end space-x-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setEditingCommentId(null)}
                                                    className="text-gray-600 hover:text-gray-800 font-medium text-sm"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="submit"
                                                    className="bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-1 px-3 rounded-lg text-sm"
                                                >
                                                    Save
                                                </button>
                                            </div>
                                        </form>
                                    ) : (
                                        <>
                                            <div className="flex justify-between items-start">
                                                <p className="font-semibold text-gray-800 text-sm">
                                                    User: {formatUserId(comment.user_id)} 
                                                </p>
                                                <div className="text-xs text-gray-500 flex space-x-2">
                                                    {comment.updated_at && comment.created_at !== comment.updated_at ? (
                                                        <span>(Edited {dayjs(comment.updated_at).fromNow()})</span>
                                                    ) : (
                                                        <span>{dayjs(comment.created_at).fromNow()}</span>
                                                    )}
                                                    
                                                    <button
                                                        onClick={() => {
                                                            setEditingCommentId(comment.id);
                                                            setEditingContent(comment.content);
                                                        }}
                                                        className="text-blue-500 hover:text-blue-700"
                                                        title="Edit Comment"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteComment(comment.id)}
                                                        className="text-red-500 hover:text-red-700"
                                                        title="Delete Comment"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="mt-1 text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                                        </>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default MovieDetailPage;

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../Supabaseclient';

type Props = {
    CurrentUserId: string;
};

type FollowData = {
    user_id: string;
    created_at: string;
    followers: string[];
    following: string[];
    id: number;
};

type UserData = {
    id: string;
    username: string;
    profile_picture: string;
    bio: string;
};

const Network = ({ CurrentUserId }: Props) => {
    const [followsData, setFollowsData] = useState<FollowData[]>([]);
    const [usersData, setUsersData] = useState<Map<string, UserData>>(new Map());
    const [loading, setLoading] = useState(true);

    const fetchFollowsData = useCallback(async () => {
        const { data, error } = await supabase.from('follows').select('*');
        if (data) setFollowsData(data);
        if (error) console.error(error);
    }, []);

    const fetchUsersData = useCallback(async () => {
        const { data, error } = await supabase.from('users').select('id, username, profile_picture, bio');
        if (data) {
            const usersMap = new Map(data.map(user => [user.id, user]));
            setUsersData(usersMap);
        }
        if (error) console.error(error);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchFollowsData();
        fetchUsersData();
    }, [fetchFollowsData, fetchUsersData]);

    const getUserData = (userId: string) => usersData.get(userId);

    const updateFollowData = async (updatedFollowing: string[], action: 'follow' | 'unfollow', userId: string) => {
        const existingFollow = followsData.find(follow => follow.user_id === CurrentUserId);
        
        if (existingFollow) {
            const updatedFollowingList = action === 'follow' ? [...existingFollow.following, userId] : existingFollow.following.filter(id => id !== userId);
            
            setFollowsData(prev =>
                prev.map(follow =>
                    follow.user_id === CurrentUserId
                        ? { ...follow, following: updatedFollowingList }
                        : follow
                )
            );

            const { error } = await supabase
                .from('follows')
                .update({ following: updatedFollowingList })
                .eq('user_id', CurrentUserId);

            if (error) console.error(error);
        }
    };

    const handleFollow = async (userId: string) => {
        await updateFollowData([], 'follow', userId);
    };

    const handleUnfollow = async (userId: string) => {
        await updateFollowData([], 'unfollow', userId);
    };

    const handleRemoveFollower = async (followerId: string) => {
        const existingFollow = followsData.find(follow => follow.user_id === CurrentUserId);

        if (existingFollow) {
            const updatedFollowers = existingFollow.followers.filter(id => id !== followerId);

            setFollowsData(prev =>
                prev.map(follow =>
                    follow.user_id === CurrentUserId
                        ? { ...follow, followers: updatedFollowers }
                        : follow
                )
            );

            const { error } = await supabase
                .from('follows')
                .update({ followers: updatedFollowers })
                .eq('user_id', CurrentUserId);

            if (error) console.error('Error updating followers in Supabase:', error);
        }
    };

    const getSuggestedUsers = () => {
        const currentUserFollowData = followsData.find(follow => follow.user_id === CurrentUserId);
        return usersData && Array.from(usersData.values()).filter(
            user => user.id !== CurrentUserId && !currentUserFollowData?.following.includes(user.id)
        );
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <div className="loader">Loading...</div> {/* Replace with a spinner */}
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-6 bg-gradient-to-r from-blue-200 to-blue-500 shadow-2xl rounded-2xl mt-6">
            <h2 className="text-4xl font-bold mb-6 text-center text-white">Network</h2>

            {/* Followers Section */}
            <div className="mb-8">
                <h3 className="text-2xl font-semibold mb-4 text-white">Followers</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {followsData
                        .filter(follow => follow.user_id === CurrentUserId)
                        .flatMap(follow => follow.followers)
                        .map(followerId => {
                            const follower = getUserData(followerId);
                            return follower ? (
                                <div key={follower.id} className="bg-white p-6 rounded-xl shadow-lg flex flex-col justify-between">
                                    <div>
                                        <img
                                            src={follower.profile_picture || '/default-avatar.png'}
                                            alt={follower.username}
                                            className="w-24 h-24 rounded-full mx-auto mb-4"
                                        />
                                        <h4 className="text-center text-gray-800 font-bold">{follower.username}</h4>
                                        <p className="text-center text-gray-600 text-sm">{follower.bio}</p>
                                    </div>
                                    <div className="text-center mt-4">
                                        <button
                                            onClick={() => handleRemoveFollower(follower.id)}
                                            className="bg-red-500 text-white px-4 py-2 rounded-full hover:bg-red-600 transition-colors"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ) : null;
                        })}
                </div>
            </div>

            {/* Following Section */}
            <div className="mb-8">
                <h3 className="text-2xl font-semibold mb-4 text-white">Following</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {followsData
                        .filter(follow => follow.user_id === CurrentUserId)
                        .flatMap(follow => follow.following)
                        .map(followingId => {
                            const following = getUserData(followingId);
                            return following ? (
                                <div key={following.id} className="bg-white p-6 rounded-xl shadow-lg flex flex-col justify-between">
                                    <div>
                                        <img
                                            src={following.profile_picture || '/default-avatar.png'}
                                            alt={following.username}
                                            className="w-24 h-24 rounded-full mx-auto mb-4"
                                        />
                                        <h4 className="text-center text-gray-800 font-bold">{following.username}</h4>
                                        <p className="text-center text-gray-600 text-sm">{following.bio}</p>
                                    </div>
                                    <div className="text-center mt-4">
                                        <button
                                            onClick={() => handleUnfollow(following.id)}
                                            className="bg-red-500 text-white px-4 py-2 rounded-full hover:bg-red-600 transition-colors"
                                        >
                                            Unfollow
                                        </button>
                                    </div>
                                </div>
                            ) : null;
                        })}
                </div>
            </div>

            {/* Suggested Users Section */}
            <div>
                <h3 className="text-2xl font-semibold mb-4 text-white">Suggested Users to Follow</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {getSuggestedUsers().map(user => (
                        <div key={user.id} className="bg-white p-6 rounded-xl shadow-lg flex flex-col justify-between">
                            <div>
                                <img
                                    src={user.profile_picture || '/default-avatar.png'}
                                    alt={user.username}
                                    className="w-24 h-24 rounded-full mx-auto mb-4"
                                />
                                <h4 className="text-center text-gray-800 font-bold">{user.username}</h4>
                                <p className="text-center text-gray-600 text-sm">{user.bio}</p>
                            </div>
                            <div className="text-center mt-4">
                                <button
                                    onClick={() => handleFollow(user.id)}
                                    className="bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600 transition-colors"
                                >
                                    Follow
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Network;

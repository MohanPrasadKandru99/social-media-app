import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "../../Supabaseclient";
import { FaUserCircle, FaHeart, FaPaperPlane } from "react-icons/fa";
import { formatDistanceToNow } from 'date-fns';
import { v4 } from "uuid";

// Types
interface Post {
  id: number;
  user_id: string;
  username: string;
  profile_picture: string;
  content: string;
  image_url?: string[];
  created_at: string;
}

interface NewsFeedProps {
  currentUserId: string;
}

// Custom Hook to handle fetching paginated posts
const useFetchNewsFeed = (currentUserId: string, page: number) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEndReached, setIsEndReached] = useState(false);

  const fetchPosts = useCallback(async () => {
    if (isEndReached) return; // Stop fetching if end is reached

    setLoading(true);
    setError(null);
    try {
      const { data: followsData, error: followsError } = await supabase
        .from("follows")
        .select("following")
        .eq("user_id", currentUserId)
        .single();

      if (followsError) throw followsError;

      const followingUsers = followsData?.following || [];
      const usersToFetchPostsFor = [...followingUsers, currentUserId];

      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select(`
          id,
          user_id,
          content,
          image_url,
          created_at,
          users!posts_user_id_fkey ( username, profile_picture )
        `)
        .in("user_id", usersToFetchPostsFor)
        .order("created_at", { ascending: false })
        .range((page - 1) * 10, page * 10 - 1); // Pagination

      if (postsError) throw postsError;

      // If no more posts are returned, set end reached
      if (postsData.length === 0) {
        setIsEndReached(true);
      } else {
        const formattedPosts = postsData.map((post: any) => ({
          id: post.id,
          user_id: post.user_id,
          content: post.content,
          image_url: post.image_url,
          created_at: post.created_at,
          username: post.users?.username || "Unknown",
          profile_picture: post.users?.profile_picture || "",
        }));
        setPosts((prevPosts) => [...prevPosts, ...formattedPosts]);
      }
    } catch (error) {
      setError("Error fetching news feed");
      console.error("Error fetching news feed:", error);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, page, isEndReached]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return { posts, loading, error, isEndReached };
};


// Main NewsFeed Component
const NewsFeed: React.FC<NewsFeedProps> = ({ currentUserId }) => {
  const [page, setPage] = useState(1);
  const { posts, loading, error, isEndReached } = useFetchNewsFeed(currentUserId, page);
  const observer = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Intersection Observer to load more posts on scroll
  useEffect(() => {
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && !isEndReached) {
          setPage((prevPage) => prevPage + 1);
        }
      },
      { threshold: 0.5 }
    );
    if (loadMoreRef.current) observer.current.observe(loadMoreRef.current);
  }, [loading, isEndReached]);

  return (
    <div className="news-feed mx-auto max-w-xl p-8"> {/* Added padding */}
      {posts.map((post) => (
        <div key={post.id} className="post-card bg-white p-4 mb-4 border rounded-lg shadow-lg">
          <div className="flex items-center mb-4">
            {post.profile_picture ? (
              <img
                src={post.profile_picture}
                alt={`${post.username}'s profile`}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <FaUserCircle className="w-10 h-10 text-gray-400" />
            )}
            <div className="ml-3">
              <p className="font-bold">{post.username}</p>
              <p className="text-xs text-gray-400">
                {formatDistanceToNow(new Date(post.created_at))} ago
              </p>
            </div>
          </div>
          <p className="mb-3 text-gray-700">{post.content}</p>
          {post.image_url && post.image_url.length > 0 && (
            <div className="image-gallery grid grid-cols-1 gap-2">
              {post.image_url.map((url, index) => (
                <img
                  key={index}
                  src={url}
                  alt={`Postimage ${index + 1 + v4()}`}
                  className="rounded-lg max-h-60 w-full object-cover"
                />
              ))}
            </div>
          )}
          <div className="flex justify-between mt-4 text-gray-500">
            <button className="flex items-center hover:text-pink-600">
              <FaHeart className="mr-2" />
              <span>Like</span>
            </button>
            <button className="flex items-center hover:text-blue-500">
              <FaPaperPlane className="mr-2" />
              <span>Share</span>
            </button>
          </div>
        </div>
      ))}
      {loading && <p className="text-center text-gray-500">Loading...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}
      {isEndReached && <p className="text-center text-gray-500">No more posts to load</p>}
      <div ref={loadMoreRef} className="load-more" />
    </div>
  );
};

export default NewsFeed;

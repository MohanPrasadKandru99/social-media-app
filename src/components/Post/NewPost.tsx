import React, { useState, ChangeEvent, FormEvent, useEffect } from "react";
import { AiOutlineCamera } from "react-icons/ai";
import { FiSend, FiX } from "react-icons/fi";
import { supabase } from "../../Supabaseclient";
import { useUser } from "@supabase/auth-helpers-react";

const maxChars = 300;

const NewPost: React.FC = () => {
  const authenticated_user = useUser();
  const [content, setContent] = useState<string>("");
  const [images, setImages] = useState<File[]>([]);
  const [mentions, setMentions] = useState<string[]>([]);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [recentPosts, setRecentPosts] = useState<any[]>([]);

  const fetchPosts = async () => {
    const user = authenticated_user;
    if (!user) return;

    const { data, error } = await supabase
      .from("posts")
      .select("id, content, image_url, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5); // Fetch the 5 most recent posts

    if (error) {
      console.error("Error fetching posts:", error);
    } else {
      setRecentPosts(data || []);
    }
  };

  useEffect(() => {
    fetchPosts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated_user]);

  const handleContentChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const inputText = e.target.value;
    setContent(inputText);

    const mentionMatches = inputText.match(/@\w+/g) || [];
    const hashtagMatches = inputText.match(/#\w+/g) || [];

    setMentions(mentionMatches);
    setHashtags(hashtagMatches);
  };

  const handleMediaUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const validImageTypes = ["image/jpeg", "image/png", "image/gif"];
      const validVideoTypes = ["video/mp4", "video/avi", "video/mkv"];

      files.forEach((file) => {
        if (validImageTypes.includes(file.type)) {
          setImages((prev) => [...prev, file]);
        } else if (validVideoTypes.includes(file.type)) {
          // Handle video upload
          setImages((prev) => [...prev, file]);
        } else {
          alert("Unsupported file type");
        }
      });
    }
  };

  const handlePostSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (content.trim() === "") {
      setErrorMessage("Post content cannot be empty.");
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    for (const image of images) {
      if (image.size > maxSize) {
        alert("Image size must be less than 5MB");
        return;
      }
    }

    const user = authenticated_user;
    if (!user) {
      console.error("User not authenticated");
      return;
    }

    setUploading(true);

    const imageUrls: string[] = await Promise.all(
      images.map(async (image) => {
        const imagePath = `images/${Date.now()}_${image.name}`;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { data, error } = await supabase.storage
          .from("post-images")
          .upload(imagePath, image);

        if (error) {
          console.error("Image upload error:", error);
          return "";
        }

        const { data: url } = await supabase.storage
          .from("post-images")
          .getPublicUrl(imagePath);
        return url.publicUrl;
      })
    );

    const { error } = await supabase.from("posts").insert([{
      user_id: user.id,
      content,
      image_url: imageUrls,
    }]);

    setUploading(false);

    if (error) {
      setErrorMessage("Post submission failed. Please try again.");
    } else {
      setContent("");
      setImages([]);
      setMentions([]);
      setHashtags([]);
      setErrorMessage("");
      setShowSuccessAlert(true);
      setTimeout(() => setShowSuccessAlert(false), 3000); // Hide after 3 seconds
      fetchPosts();
    }
  };

  const removeImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);
    for (const x in images) {
      URL.revokeObjectURL(x);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-100">
      {/* New Post Section */}
      <div className="md:w-1/3 p-6 bg-white rounded-lg shadow-lg m-4">
        {errorMessage && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-2 rounded-md shadow-lg">
            {errorMessage}
          </div>
        )}
        {showSuccessAlert && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-2 rounded-md shadow-lg">
            Post successfully created!
          </div>
        )}

        <form onSubmit={handlePostSubmit}>
          <textarea
            value={content}
            onChange={handleContentChange}
            placeholder="What's on your mind?"
            className="w-full p-4 border-2 border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            rows={4}
          />
          <div className="text-right text-gray-500 text-sm">
            {content.length}/{maxChars} characters
          </div>

          {images.length > 0 && (
            <div className="mt-4 flex gap-3 flex-wrap">
              {images.map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={URL.createObjectURL(image)}
                    alt="Selected"
                    className="h-32 w-32 object-cover rounded-lg shadow-md"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-0 right-0 text-white bg-red-500 p-1 rounded-full"
                  >
                    <FiX size={20} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 text-sm text-gray-600">
            {mentions.length > 0 && (
              <p>
                Mentions:{" "}
                {mentions.map((m, i) => (
                  <span key={i} className="text-blue-500">{m} </span>
                ))}
              </p>
            )}
            {hashtags.length > 0 && (
              <p>
                Tags:{" "}
                {hashtags.map((h, i) => (
                  <span key={i} className="text-green-500">{h} </span>
                ))}
              </p>
            )}
          </div>

          <div className="flex items-center mt-6 gap-6">
            <label className="flex items-center cursor-pointer">
              <AiOutlineCamera className="text-xl text-blue-500" />
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleMediaUpload}
              />
            </label>
            <button
              type="submit"
              className={`flex items-center bg-blue-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-600 focus:outline-none transition-all ${
                content.length > maxChars ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={content.length > maxChars || uploading}
            >
              {uploading ? (
                <span>Uploading...</span>
              ) : (
                <>
                  <FiSend className="mr-2" /> Post
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Recent Posts Section */}
      <div className="md:w-2/3 p-6">
        <h2 className="text-2xl font-bold mb-4">Recent Posts</h2>
        {recentPosts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <p className="text-gray-600">No recent posts to show.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentPosts.map((post) => (
              <div key={post.id} className="bg-white p-4 rounded-lg shadow-lg">
                <p className="text-gray-800">{post.content}</p>
                {post.image_url.length > 0 && (
                  <div className="mt-4">
                    {post.image_url.map((url:any, index:any) => (
                      <img
                        key={index}
                        src={url}
                        alt="Post"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                )}
                <p className="text-gray-500 text-sm mt-2">{post.created_at}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NewPost;

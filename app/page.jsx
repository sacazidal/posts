"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/app/utils/supabase/client";

async function fetchPosts() {
  const res = await fetch("/api/posts");
  const result = await res.json();
  return result;
}

async function createPost({ username, desc, date, authorId }) {
  const res = await fetch("/api/posts/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, desc, date, authorId }),
  });
  return await res.json();
}

export default function Home() {
  const [username, setUsername] = useState("");
  const [desc, setDesc] = useState("");
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const myUserId = "user1-id"; // Ваш ID (можно получать из контекста или состояния)

  const supabase = createClient();

  useEffect(() => {
    const loadPosts = async () => {
      try {
        setLoading(true);
        const data = await fetchPosts();
        setPosts(data);
      } catch (error) {
        setError("Ошибка при загрузке постов");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("realtime posts")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "posts",
        },
        (payload) => {
          if (!posts.some((post) => post.id === payload.new.id)) {
            setPosts((prevPosts) => [payload.new, ...prevPosts]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, posts]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;
    setIsSubmitting(true);

    const date = new Date();

    const localPost = {
      id: Date.now(),
      username,
      desc,
      date,
      authorId: myUserId, // Добавляем authorId
      isLocal: true,
    };

    setPosts((prevPosts) => [localPost, ...prevPosts]);

    try {
      const newPost = await createPost({
        username,
        desc,
        date,
        authorId: myUserId,
      });

      setPosts((prevPosts) => [
        { ...newPost, isLocal: false }, // Сохраняем authorId из ответа сервера
        ...prevPosts.filter((post) => post.id !== localPost.id),
      ]);

      setDesc("");
      setError("");
    } catch (err) {
      // Откатываем изменения в случае ошибки
      setPosts((prevPosts) =>
        prevPosts.filter((post) => post.id !== localPost.id)
      );
      setError("Ошибка при создании поста");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="h-full container mx-auto py-10 flex justify-center px-2">
      <form onSubmit={handleSubmit} className="flex flex-col max-w-md w-full">
        <input
          type="text"
          placeholder="Имя пользователя"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="p-2 border border-gray-300 rounded"
          required
        />

        <textarea
          placeholder="Описание"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          className="p-2 border border-gray-300 rounded"
          required
        />

        <button
          type="submit"
          className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Отправка..." : "Опубликовать"}
        </button>

        {error && <p className="text-red-500">{error}</p>}

        <div className="mt-6 space-y-4">
          {loading ? (
            <p className="text-center text-2xl">Загрузка...</p>
          ) : (
            <>
              {posts.map((post) => (
                <div
                  key={post.isLocal ? `local-${post.id}` : `server-${post.id}`}
                  className={`flex ${
                    post.authorId === myUserId ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`p-4 rounded-lg max-w-[70%] ${
                      post.authorId === myUserId
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-800"
                    }`}
                  >
                    <h2 className="text-2xl font-bold">{post.username}</h2>
                    <p className="text-gray-600">{post.desc}</p>
                    <p className="text-gray-400">
                      Опубликовано: {new Date(post.date).toLocaleString()}
                    </p>
                    {post.isLocal && (
                      <p className="text-sm text-yellow-500">Отправка...</p>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </form>
    </main>
  );
}

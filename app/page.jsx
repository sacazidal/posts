"use client";

import { useEffect, useState } from "react";

async function fetchPosts() {
  const res = await fetch("/api/posts");
  const result = await res.json();
  return result;
}

async function createPost({ username, desc, date }) {
  const res = await fetch("/api/posts/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, desc, date }),
  });
  return await res.json();
}

export default function Home() {
  const [username, setUsername] = useState("");
  const [desc, setDesc] = useState("");
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        setLoading(true);
        const data = await fetchPosts();
        setPosts(data);
      } catch (error) {
        setError("Ошибка при загрузке постов");
        console.error(error);
        setLoading(false);
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const date = new Date();
    setLoading(true);
    try {
      // Отправляем новый пост на сервер
      const newPost = await createPost({ username, desc, date });

      // Обновляем состояние с постами, добавляя новый пост
      setPosts((prevPosts) => [newPost, ...prevPosts]);

      // Очищаем поля формы
      setUsername("");

      setDesc("");
      setError("");
    } catch (err) {
      setLoading(false);
      setError("Ошибка при создании поста");
      console.error(err);
    } finally {
      setLoading(false);
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

        {/* Поле для ввода описания */}
        <textarea
          placeholder="Описание"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          className="p-2 border border-gray-300 rounded"
          required
        />

        {/* Кнопка отправки */}
        <button
          type="submit"
          className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Опубликовать
        </button>

        {error && <p className="text-red-500">{error}</p>}

        <div className="mt-6 space-y-4">
          {loading ? (
            <p className="text-center text-2xl">Загрузка...</p>
          ) : (
            <>
              {posts.map((post, index) => (
                <div
                  key={index}
                  className="p-4 border border-gray-200 rounded-lg"
                >
                  <h2 className="text-2xl font-bold">{post.username}</h2>
                  <p className="text-gray-600">{post.desc}</p>
                  <p className="text-gray-400">
                    Опубликовано: {new Date(post.date).toLocaleString()}
                  </p>
                </div>
              ))}
            </>
          )}
        </div>
      </form>
    </main>
  );
}

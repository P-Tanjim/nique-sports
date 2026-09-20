'use server'

const API = process.env.API;

export const serverFetch = async (path) => {
  try {
    const res = await fetch(`${API}${path}`);
    if (!res.ok) {
      return null;
    }
    const data = await res.json();
    return data;

  } catch (error) {
    console.log("Server thows a error with", error)
    return null;
  }
}
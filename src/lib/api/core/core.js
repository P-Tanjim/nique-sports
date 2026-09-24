'use server'

const API = process.env.API;

export const serverFetch = async (path, other={}) => {
  try {
    const res = await fetch(`${API}${path}`, other);
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

// POST counterpart to serverFetch — same base URL, JSON body, normalized
// {success, data|error} shape so callers don't need their own try/catch.
export const serverPost = async (path, body) => {
  try {
    const res = await fetch(`${API}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
 
    const data = await res.json();
 
    if (!res.ok) {
      return { success: false, error: data?.error || 'Request failed.' };
    }
 
    return { success: true, data: data.data };
  } catch (error) {
    console.log("Server thows a error with", error)
    return { success: false, error: 'Network error. Please try again.' };
  }
}
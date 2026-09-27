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

async function serverMutation(method, path, body) {
  try {
    const res = await fetch(`${API}${path}`, {
      method,
      ...(body === undefined
        ? {}
        : {
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          }),
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

// Mutation helpers share the same normalized {success, data|error} response.
export const serverPost = async (path, body) => serverMutation('POST', path, body);
export const serverPut = async (path, body) => serverMutation('PUT', path, body);
export const serverDelete = async (path) => serverMutation('DELETE', path);
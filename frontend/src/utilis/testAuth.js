export const testProtectedRoute = async () => {

  const token = localStorage.getItem("token");

  if (!token) {
    console.log("No token found. Login first.");
    return;
  }

  try {

    const response = await fetch("http://localhost:5000/api/assets", {

      method: "GET",

      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token,
      },

    });

    const data = await response.json();

    console.log("Protected route response:", data);

  }
  catch (error) {

    console.error("Error:", error);

  }

};

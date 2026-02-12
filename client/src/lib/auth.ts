export const handleLogout = () => {
    // This removes the token, userRole, and any other cached data
    localStorage.clear();

    // Redirect to login to ensure the app state resets
    window.location.href = "/login";
};

// You can also add a helper to check if the user is logged in
export const isAuthenticated = () => {
    return !!localStorage.getItem("token");
};
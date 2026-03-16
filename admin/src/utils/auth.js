export const MOCK_ADMIN = {
  email: "admin@autiva.com",
  password: "admin123",
};

const AUTH_KEY = "autiva_admin_logged_in";

export function loginAdmin(email, password) {
  if (email === MOCK_ADMIN.email && password === MOCK_ADMIN.password) {
    localStorage.setItem(AUTH_KEY, "true");
    return { success: true };
  }

  return {
    success: false,
    message: "Invalid admin email or password.",
  };
}

export function logoutAdmin() {
  localStorage.removeItem(AUTH_KEY);
}

export function isAdminLoggedIn() {
  return localStorage.getItem(AUTH_KEY) === "true";
}
import httpStatus from "http-status";


const registerUser = async (data: any): Promise<any> => {
  return null;
};

const loginUser = async (data: any): Promise<any> => {
  return { refreshToken: "", accessToken: "" };
};

const refreshToken = async (token: string): Promise<any> => {
  return { accessToken: "" };
};

const changePassword = async (userId: string, data: any): Promise<any> => {
  return null;
};

const forgotPassword = async (email: string): Promise<any> => {
  return null;
};

const resetPassword = async (token: string, newPassword: string): Promise<any> => {
  return null;
};

export const AuthService = {
  registerUser,
  loginUser,
  refreshToken,
  changePassword,
  forgotPassword,
  resetPassword,
};

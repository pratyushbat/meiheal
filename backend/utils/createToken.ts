import jwt from "jsonwebtoken";

export const createOtpToken = async (payload: string) => {
  let jwtkey = process.env.JWT_KEY || "";
  const token = jwt.sign({ phoneNumber: payload }, jwtkey, {
    expiresIn: "5m",
  });
  return token;
};

export const createLoginToken = async (payload: any) => {
  let jwtkey = process.env.JWT_KEY || "";
  const token = jwt.sign(payload, jwtkey, {
    expiresIn: "2h",
  });
  return token;
};

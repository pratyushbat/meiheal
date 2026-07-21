import { API_URL } from './constants';
import mongoose from "mongoose";

// Register once — these fire for the lifetime of the app, not just at initial connect
mongoose.connection.on('disconnected', () => console.error('Mongo disconnected'));
mongoose.connection.on('error', (err) => console.error('Mongo runtime error:', err));

const configDb = async () => {
  try {
    console.log("Does DB_URI exist?", !!process.env.DB_URI);
    console.log(" API_URL ?", process.env.API_URL);
    const connectionString: string = process.env.DB_URI || "";
    await mongoose.connect(connectionString, { serverSelectionTimeoutMS: 8000 });
    console.log(`Database configurations success 🗳`);
  } catch (error: any) {
    console.log("failed to Database Configurations 😞", error);
  }
};

export default configDb;

import multer from "multer";
import mongoose from "mongoose";

const storage = multer.memoryStorage(); 
const upload = multer({ storage });

export default upload;
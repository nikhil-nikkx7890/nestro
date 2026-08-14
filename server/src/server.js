import "dotenv/config";
import app from "./app.js";
import connectDB from "./config/db.js";
import { validateEnv } from "./utils/validateEnv.js";

const env = validateEnv();

connectDB();

app.listen(env.PORT, () => {
  console.log(`Server is running on http://localhost:${env.PORT}`);
});

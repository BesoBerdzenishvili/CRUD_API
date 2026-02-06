import dotenv from "dotenv";
import { createServer } from "./server";
dotenv.config();

const PORT = process.env.PORT || 4000;

const app = createServer();

app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});

import * as http from "http";
import { database } from "./db/db";
import { CreateUserDto } from "./types/user";
import { isValidUUID, validateCreateUserDto } from "./utils/validators";

const sendResponse = (
  res: http.ServerResponse,
  statusCode: number,
  data?: any
): void => {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(data ? JSON.stringify(data) : "");
};

const bodyParse = (req: http.IncomingMessage): Promise<any> => {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
};

export const createServer = () => {
  return http.createServer(async (req, res) => {
    const { method, url } = req;

    try {
      if (method === "GET" && url === "/api/users") {
        const users = await database.getAllUsers();
        sendResponse(res, 200, users);
        return;
      }

      if (method === "GET" && url?.startsWith("/api/users/")) {
        const id = url.split("/")[3];

        if (!isValidUUID(id)) {
          sendResponse(res, 400, { message: "Invalid userId (not UUID)" });
          return;
        }

        const user = await database.getUserById(id);
        if (!user) {
          sendResponse(res, 404, { message: "User not found" });
          return;
        }

        sendResponse(res, 200, user);
        return;
      }

      if (method === "POST" && url === "/api/users") {
        const body = await bodyParse(req);

        if (!validateCreateUserDto(body)) {
          sendResponse(res, 400, {
            message:
              "Request body does not contain required fields or fields are invalid",
          });
          return;
        }

        const newUser = await database.createUser(body as CreateUserDto);
        sendResponse(res, 201, newUser);
        return;
      }

      if (method === "PUT" && url?.startsWith("/api/users/")) {
        const id = url.split("/")[3];

        if (!isValidUUID(id)) {
          sendResponse(res, 400, { message: "Invalid userId (not UUID)" });
          return;
        }

        const body = await bodyParse(req);

        const existingUser = await database.getUserById(id);
        if (!existingUser) {
          sendResponse(res, 404, { message: "User not found" });
          return;
        }

        const updatedUser = await database.updateUser(id, body);
        sendResponse(res, 200, updatedUser);
        return;
      }

      if (method === "DELETE" && url?.startsWith("/api/users/")) {
        const id = url.split("/")[3];

        if (!isValidUUID(id)) {
          sendResponse(res, 400, { message: "Invalid userId" });
          return;
        }

        const deleted = await database.deleteUser(id);
        if (!deleted) {
          sendResponse(res, 404, { message: "User not found" });
          return;
        }

        sendResponse(res, 204);
        return;
      }

      sendResponse(res, 404, {
        message: "Endpoint not found",
      });
    } catch (error) {
      console.error("Server error:", error);
      sendResponse(res, 500, {
        message: "Internal server error",
      });
    }
  });
};

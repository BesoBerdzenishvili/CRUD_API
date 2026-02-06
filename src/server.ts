import * as http from "http";
import { database } from "./db/db";
import { Message } from "./types/messages";
import { CreateUserDto } from "./types/user";
import { Status } from "./types/statusCodes";
import { isValidUUID, validateCreateUserDto } from "./utils/validators";

const sendResponse = <T>(
  res: http.ServerResponse,
  statusCode: number,
  data?: T
): void => {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(data ? JSON.stringify(data) : "");
};

const bodyParse = <T>(req: http.IncomingMessage): Promise<T> => {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : ({} as T));
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
        sendResponse(res, Status.OK, users);
        return;
      }

      if (method === "GET" && url?.startsWith("/api/users/")) {
        const id = url.split("/")[3];

        if (!isValidUUID(id)) {
          sendResponse(res, Status.INVALID_REQUEST, {
            message: Message.INVALID_ID,
          });
          return;
        }

        const user = await database.getUserById(id);
        if (!user) {
          sendResponse(res, Status.NOT_FOUND, {
            message: Message.USER_NOT_FOUND,
          });
          return;
        }

        sendResponse(res, Status.OK, user);
        return;
      }

      if (method === "POST" && url === "/api/users") {
        const body = await bodyParse<CreateUserDto>(req);

        if (!validateCreateUserDto(body)) {
          sendResponse(res, Status.INVALID_REQUEST, {
            message: Message.INVALID_BODY,
          });
          return;
        }

        const newUser = await database.createUser(body as CreateUserDto);
        sendResponse(res, Status.CREATED, newUser);
        return;
      }

      if (method === "PUT" && url?.startsWith("/api/users/")) {
        const id = url.split("/")[3];

        if (!isValidUUID(id)) {
          sendResponse(res, Status.INVALID_REQUEST, {
            message: Message.INVALID_ID,
          });
          return;
        }

        const body = await bodyParse<CreateUserDto>(req);

        const existingUser = await database.getUserById(id);
        if (!existingUser) {
          sendResponse(res, Status.NOT_FOUND, {
            message: Message.USER_NOT_FOUND,
          });
          return;
        }

        const updatedUser = await database.updateUser(id, body);
        sendResponse(res, Status.OK, updatedUser);
        return;
      }

      if (method === "DELETE" && url?.startsWith("/api/users/")) {
        const id = url.split("/")[3];

        if (!isValidUUID(id)) {
          sendResponse(res, Status.INVALID_REQUEST, {
            message: Message.INVALID_ID,
          });
          return;
        }

        const deleted = await database.deleteUser(id);
        if (!deleted) {
          sendResponse(res, Status.NOT_FOUND, {
            message: Message.USER_NOT_FOUND,
          });
          return;
        }

        sendResponse(res, Status.NO_CONTENT);
        return;
      }

      sendResponse(res, Status.NOT_FOUND, {
        message: Message.ENDPOINT_NOT_FOUND,
      });
    } catch (error) {
      console.error(`${Message.INTERNAL_SERVER_ERROR}: `, error);
      sendResponse(res, Status.INTERNAL_SERVER_ERROR, {
        message: Message.INTERNAL_SERVER_ERROR,
      });
    }
  });
};

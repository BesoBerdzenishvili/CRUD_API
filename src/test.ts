import * as http from "http";
import { database } from "./db/db";
import { createServer } from "./server";
import { Status } from "./types/statusCodes";

const request = (
  server: http.Server,
  method: string,
  path: string,
  body?: any
): Promise<{ statusCode: number; body: any }> => {
  return new Promise((resolve, reject) => {
    const port = (server.address() as any).port;
    const options = {
      hostname: "localhost",
      port,
      path,
      method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        resolve({
          statusCode: res.statusCode || Status.INTERNAL_SERVER_ERROR,
          body: data ? JSON.parse(data) : null,
        });
      });
    });

    req.on("error", reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
};

describe("CRUD API Tests", () => {
  let server: http.Server;

  beforeAll(() => {
    server = createServer();
    server.listen(0);
  });

  afterAll(() => {
    server.close();
  });

  beforeEach(() => {
    database.clear();
  });

  describe("Scenario 1: Complete CRUD operations", () => {
    test("should perform complete CRUD cycle", async () => {
      let response = await request(server, "GET", "/api/users");
      expect(response.statusCode).toBe(Status.OK);
      expect(response.body).toEqual([]);

      const newUser = {
        username: "John Doe",
        age: 30,
        hobbies: ["reading", "gaming"],
      };
      response = await request(server, "POST", "/api/users", newUser);
      expect(response.statusCode).toBe(Status.CREATED);
      expect(response.body).toMatchObject(newUser);
      expect(response.body.id).toBeDefined();
      const userId = response.body.id;

      response = await request(server, "GET", `/api/users/${userId}`);
      expect(response.statusCode).toBe(Status.OK);
      expect(response.body).toMatchObject(newUser);
      expect(response.body.id).toBe(userId);

      const updatedData = {
        username: "Jane Doe",
        age: 31,
        hobbies: ["writing", "cooking"],
      };
      response = await request(
        server,
        "PUT",
        `/api/users/${userId}`,
        updatedData
      );
      expect(response.statusCode).toBe(Status.OK);
      expect(response.body).toMatchObject(updatedData);
      expect(response.body.id).toBe(userId);

      response = await request(server, "DELETE", `/api/users/${userId}`);
      expect(response.statusCode).toBe(Status.NO_CONTENT);

      response = await request(server, "GET", `/api/users/${userId}`);
      expect(response.statusCode).toBe(Status.NOT_FOUND);
      expect(response.body.message).toBe("User not found");
    });
  });

  describe("Scenario 2: Validation tests", () => {
    test("should return 400 for invalid UUID", async () => {
      const response = await request(server, "GET", "/api/users/invalid-id");
      expect(response.statusCode).toBe(Status.INVALID_REQUEST);
      expect(response.body.message).toContain("Invalid userId");
    });

    test("should return 400 for missing required fields", async () => {
      const invalidUser = {
        username: "Test User",
      };
      const response = await request(server, "POST", "/api/users", invalidUser);
      expect(response.statusCode).toBe(Status.INVALID_REQUEST);
      expect(response.body.message).toContain("required fields");
    });

    test("should return 404 for non-existent user", async () => {
      const response = await request(
        server,
        "GET",
        "/api/users/123e4567-e89b-12d3-a456-426614174000"
      );
      expect(response.statusCode).toBe(Status.NOT_FOUND);
    });
  });

  describe("Scenario 3: Multiple users management", () => {
    test("should handle multiple users correctly", async () => {
      const user1 = {
        username: "Alice",
        age: 25,
        hobbies: ["swimming"],
      };
      let response = await request(server, "POST", "/api/users", user1);
      expect(response.statusCode).toBe(Status.CREATED);
      const userId1 = response.body.id;

      const user2 = {
        username: "Bob",
        age: 28,
        hobbies: ["cycling"],
      };
      response = await request(server, "POST", "/api/users", user2);
      expect(response.statusCode).toBe(Status.CREATED);
      const userId2 = response.body.id;

      response = await request(server, "GET", "/api/users");
      expect(response.statusCode).toBe(Status.OK);
      expect(response.body).toHaveLength(2);

      response = await request(server, "DELETE", `/api/users/${userId1}`);
      expect(response.statusCode).toBe(Status.NO_CONTENT);

      response = await request(server, "GET", "/api/users");
      expect(response.statusCode).toBe(Status.OK);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe(userId2);
    });
  });

  describe("Scenario 4: Error handling", () => {
    test("should return 404 for non-existing endpoint", async () => {
      const response = await request(server, "GET", "/api/non-existing");
      expect(response.statusCode).toBe(Status.NOT_FOUND);
      expect(response.body.message).toContain("Endpoint not found");
    });
  });
});

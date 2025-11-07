import { validate as uuidValidate } from "uuid";
import { CreateUserDto } from "../types/user";

export const isValidUUID = (id: string): boolean => {
  return uuidValidate(id);
};

export const validateCreateUserDto = (
  body: CreateUserDto
): body is CreateUserDto => {
  if (!body || typeof body !== "object") {
    return false;
  }

  if (typeof body.username !== "string" || body.username.trim() === "") {
    return false;
  }

  if (typeof body.age !== "number" || body.age < 0) {
    return false;
  }

  if (!Array.isArray(body.hobbies)) {
    return false;
  }

  if (!body.hobbies.every((hobby: string) => typeof hobby === "string")) {
    return false;
  }

  return true;
};

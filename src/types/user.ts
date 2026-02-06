export interface User {
  id: string;
  username: string;
  age: number;
  hobbies: string[];
}

export type CreateUserDto = Omit<User, "id">;
export type UpdateUserDto = Partial<CreateUserDto>;

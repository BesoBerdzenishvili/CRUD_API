import { v4 as uuidv4 } from "uuid";
import { User, CreateUserDto } from "../types/user";

class Database {
  private users: Map<string, User> = new Map();

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async createUser(userData: CreateUserDto): Promise<User> {
    const newUser: User = {
      id: uuidv4(),
      ...userData,
    };
    this.users.set(newUser.id, newUser);
    return newUser;
  }

  async updateUser(
    id: string,
    userData: Partial<CreateUserDto>
  ): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) {
      return undefined;
    }
    const updatedUser: User = {
      ...user,
      ...userData,
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  getState(): Record<string, User> {
    return Object.fromEntries(this.users);
  }

  setState(state: Record<string, User>): void {
    this.users = new Map(Object.entries(state));
  }
}

export const database = new Database();

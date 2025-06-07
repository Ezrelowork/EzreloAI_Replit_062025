import { 
  users, 
  movingProjects, 
  projectTasks, 
  movingCommunications,
  type User, 
  type InsertUser, 
  type MovingProject, 
  type InsertMovingProject,
  type ProjectTask,
  type InsertProjectTask,
  type MovingCommunication,
  type InsertMovingCommunication
} from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Moving project operations
  createMovingProject(project: InsertMovingProject): Promise<MovingProject>;
  getMovingProject(userId: number, fromAddress: string, toAddress: string): Promise<MovingProject | undefined>;
  updateMovingProject(projectId: number, updates: Partial<InsertMovingProject>): Promise<MovingProject>;
  
  // Project task operations
  createProjectTask(task: InsertProjectTask): Promise<ProjectTask>;
  getProjectTasks(projectId: number): Promise<ProjectTask[]>;
  updateTaskStatus(taskId: number, status: string): Promise<ProjectTask>;
  
  // Communication operations
  createCommunication(communication: InsertMovingCommunication): Promise<MovingCommunication>;
  getProjectCommunications(projectId: number): Promise<MovingCommunication[]>;
}

import { db } from "./db";
import { eq, and } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Moving project operations
  async createMovingProject(project: InsertMovingProject): Promise<MovingProject> {
    const [newProject] = await db
      .insert(movingProjects)
      .values(project)
      .returning();
    return newProject;
  }

  async getMovingProject(userId: number, fromAddress?: string, toAddress?: string): Promise<MovingProject | undefined>;
  async getMovingProject(projectId: number): Promise<MovingProject | undefined>;
  async getMovingProject(userIdOrProjectId: number, fromAddress?: string, toAddress?: string): Promise<MovingProject | undefined> {
    if (fromAddress && toAddress) {
      // Query by userId, fromAddress, toAddress
      const [project] = await db
        .select()
        .from(movingProjects)
        .where(and(
          eq(movingProjects.userId, userIdOrProjectId),
          eq(movingProjects.fromAddress, fromAddress),
          eq(movingProjects.toAddress, toAddress)
        ));
      return project;
    } else {
      // Query by projectId
      const [project] = await db
        .select()
        .from(movingProjects)
        .where(eq(movingProjects.id, userIdOrProjectId));
      return project;
    }
  }

  async updateMovingProject(projectId: number, updates: Partial<InsertMovingProject>): Promise<MovingProject> {
    const [updatedProject] = await db
      .update(movingProjects)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(movingProjects.id, projectId))
      .returning();
    return updatedProject;
  }

  // Project task operations
  async createProjectTask(task: InsertProjectTask): Promise<ProjectTask> {
    const [newTask] = await db
      .insert(projectTasks)
      .values(task)
      .returning();
    return newTask;
  }

  async getProjectTasks(projectId: number): Promise<ProjectTask[]> {
    return await db
      .select()
      .from(projectTasks)
      .where(eq(projectTasks.projectId, projectId));
  }

  async updateTaskStatus(taskId: number, status: string): Promise<ProjectTask> {
    const [updatedTask] = await db
      .update(projectTasks)
      .set({ status, completedAt: status === 'completed' ? new Date() : null })
      .where(eq(projectTasks.id, taskId))
      .returning();
    return updatedTask;
  }

  // Communication operations
  async createCommunication(communication: InsertMovingCommunication): Promise<MovingCommunication> {
    const [newCommunication] = await db
      .insert(movingCommunications)
      .values(communication)
      .returning();
    return newCommunication;
  }

  async getProjectCommunications(projectId: number): Promise<MovingCommunication[]> {
    return await db
      .select()
      .from(movingCommunications)
      .where(eq(movingCommunications.projectId, projectId));
  }
}

export const storage = new DatabaseStorage();

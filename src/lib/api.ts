import { Client, Databases, Storage, ID, Query } from "appwrite";

const client = new Client()
  .setEndpoint("https://nyc.cloud.appwrite.io/v1")
  .setProject("69ae895200286678d491");

const databases = new Databases(client);
const storage = new Storage(client);

const DATABASE_ID = "69ae89d3001994e32d91";
const TASK_COLLECTION = "task";
const EMPLOYEE_COLLECTION = "employees";
const BUCKET_ID = "task_attachments";


/* -------------------------
   GET TASKS
--------------------------*/
export async function getTasks() {

  const res = await databases.listDocuments(
    DATABASE_ID,
    TASK_COLLECTION,
    [
      Query.orderDesc("$createdAt"),
      Query.limit(100)
    ]
  );

  return res.documents;
}



/* -------------------------
   CREATE TASK (WITH IMAGE)
--------------------------*/
export async function createTask(taskData: any, file?: File) {

  let fileUrl = null;

  if (file) {

    const uploaded = await storage.createFile(
      BUCKET_ID,
      ID.unique(),
      file
    );

    fileUrl =
      `https://nyc.cloud.appwrite.io/v1/storage/buckets/${BUCKET_ID}/files/${uploaded.$id}/view?project=69ae895200286678d491`;
  }

  const task = await databases.createDocument(
    DATABASE_ID,
    TASK_COLLECTION,
    ID.unique(),
    {
      title: taskData.title,
      description: taskData.description,
      employee_name: taskData.employee_name,
      priority: taskData.priority,
      deadline: taskData.deadline,
      status: "ongoing",
      url: fileUrl || ""
    }
  );

  return task;
}



/* -------------------------
   GET TEAM MEMBERS
--------------------------*/
export async function getTeam() {

  const res = await databases.listDocuments(
    DATABASE_ID,
    EMPLOYEE_COLLECTION
  );

  return res.documents;
}



/* -------------------------
   CREATE EMPLOYEE
--------------------------*/
export async function createEmployee(data: any) {

  const employee = await databases.createDocument(
    DATABASE_ID,
    EMPLOYEE_COLLECTION,
    ID.unique(),
    {
      name: data.name,
      email: data.email || "",
      department: data.department || "",
      status: "online"
    }
  );

  return employee;
}



/* -------------------------
   GET EMPLOYEE PROFILE
--------------------------*/
export async function getEmployeeProfile(name: string) {

  const employees = await databases.listDocuments(
    DATABASE_ID,
    EMPLOYEE_COLLECTION
  );

  const employee = employees.documents.find(
    (e: any) => e.name === name
  );

  if (!employee) {
    throw new Error("Employee not found");
  }

  const tasks = await databases.listDocuments(
    DATABASE_ID,
    TASK_COLLECTION
  );

  const ongoing = tasks.documents.filter(
    (t: any) =>
      t.employee_name === name &&
      t.status !== "completed"
  );

  const completed = tasks.documents.filter(
    (t: any) =>
      t.employee_name === name &&
      t.status === "completed"
  );

  return {
    name: employee.name,
    email: employee.email,
    department: employee.department,
    assigned_tasks: ongoing.length,
    completed_tasks: completed.length,
    ongoing,
    completed
  };
}



/* -------------------------
   START WORKING ON TASK
--------------------------*/
export async function startWorking(taskId: string, personEmail: string) {

  const updated = await databases.updateDocument(
    DATABASE_ID,
    TASK_COLLECTION,
    taskId,
    {
      status: `taken|${personEmail}`
    }
  );

  return updated;
}



/* -------------------------
   COMPLETE TASK
--------------------------*/
export async function completeTask(taskId: string) {

  const updated = await databases.updateDocument(
    DATABASE_ID,
    TASK_COLLECTION,
    taskId,
    {
      status: "completed"
    }
  );

  return updated;
}
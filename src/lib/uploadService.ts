import { storage, databases, ID } from './appwrite';

const BUCKET_ID = 'task_attachments';          // Your storage bucket ID
const DATABASE_ID = '69ae89d3001994e32d91';    // Your database ID
const COLLECTION_ID = 'task';                   // Your collection ID

// 1. Upload file and get URL
async function uploadFile(file) {
  try {
    const uploadedFile = await storage.createFile(
      BUCKET_ID,
      ID.unique(),
      file
    );
    
    // Generate the public URL
    const fileUrl = `https://nyc.cloud.appwrite.io/v1/storage/buckets/${BUCKET_ID}/files/${uploadedFile.$id}/view?project=69ae895200286678d491`;
    
    console.log('✅ File uploaded, URL:', fileUrl);
    return fileUrl;
  } catch (error) {
    console.error('❌ Upload failed:', error);
    throw error;
  }
}

// 2. Create task with the URL
export async function createTaskWithFile(taskData, file) {
  try {
    // Step A: Upload file to get URL
    const fileUrl = await uploadFile(file);
    
    // Step B: Create database entry with the URL
    const task = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID,
      ID.unique(),
      {
        title: taskData.title,
        employee_name: taskData.employee_name,
        description: taskData.description || taskData.title,
        priority: taskData.priority,
        deadline: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
        status: 'ongoing',
        url: fileUrl  // 🔑 The URL is saved here
      }
    );
    
    console.log('✅ Task created with URL:', task);
    return task;
  } catch (error) {
    console.error('❌ Failed:', error);
    throw error;
  }
}

// For text-only tasks
export async function createTextTask(taskData) {
  try {
    const task = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID,
      ID.unique(),
      {
        title: taskData.title,
        employee_name: taskData.employee_name,
        description: taskData.description || taskData.title,
        priority: taskData.priority,
        deadline: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
        status: 'ongoing',
        url: ''  // Empty URL for text tasks
      }
    );
    return task;
  } catch (error) {
    console.error('❌ Failed:', error);
    throw error;
  }
}

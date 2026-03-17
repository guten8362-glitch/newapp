import { Client, Account, Databases, Storage, ID } from 'appwrite';

const client = new Client()
    .setEndpoint('https://nyc.cloud.appwrite.io/v1')
    .setProject('69ae895200286678d491');

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

export { ID };


// Login function
export async function loginUser(email: string, password: string) {
    try {
        console.log("Attempting login with:", email);

        try {
            await account.deleteSession('current');
        } catch {}

        const session = await account.createEmailPasswordSession(email, password);

        const user = await account.get();
        console.log("User logged in:", user.email);

        return user;

    } catch (error: any) {

        if (error.code === 401) {
            throw new Error("Invalid email or password");
        }

        throw new Error(error.message || "Login failed");
    }
}


// Check current user
export async function getCurrentUser() {
    try {
        const user = await account.get();
        return user;
    } catch {
        return null;
    }
}


// Logout function
export async function logoutUser() {
    try {
        await account.deleteSession('current');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userName');
    } catch (error) {
        console.error('Logout error:', error);
    }
}
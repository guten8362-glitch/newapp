import { Client, Account, Databases, Storage, ID, Teams } from 'appwrite';

const client = new Client()
    .setEndpoint('https://nyc.cloud.appwrite.io/v1')
    .setProject('69ae895200286678d491');

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
const teams = new Teams(client);

export { ID };

const TEAM_ID = "69ba48a2003adaf41f68";

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

// Login with Google
export async function loginWithGoogle() {
    try {
        const origin = window.location.origin;
        await account.createOAuth2Session(
            'google' as any,
            `${origin}/login`,
            `${origin}/login`
        );
    } catch (error) {
        console.error('Google login error:', error);
        throw error;
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

// Get user role from team
export async function getUserRole() {
    try {
        const user = await account.get();
        
        try {
            const memberships = await teams.listMemberships(TEAM_ID);
            
            const member = memberships.memberships.find(
                (m: any) => m.userId === user.$id
            );

            // If user is in team and has roles
            if (member && member.roles && member.roles.length > 0) {
                return member.roles[0]; // Returns "admin" or "employee"
            }
        } catch (teamError) {
            console.log("User not in team or team error:", teamError);
        }
        
        // Default to employee for all users (including new ones)
        return "employee";
        
    } catch (error) {
        console.error("Error getting user role:", error);
        return null;
    }
}
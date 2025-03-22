import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import app from '../firebase.ts';
import { UserData, UserType } from '../../interfaces/UserData.ts';

// Firestore instance
const db = getFirestore(app);

export const createUserDocument = async (userId: string, userData: UserData) => {
    try {
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, {
            ...userData,
            uid: userId,
            userType: userData.userType || UserType.CUSTOMER,
            createdAt: new Date()
        });
        console.log('User document created successfully');
    } catch (error) {
        console.error('Error creating user document:', error);
        throw error;
    }
};

export const getUserData = async (userId: string) => {
    try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
            return userDoc.data() as UserData;
        } else {
            throw new Error('User document not found');
        }
    } catch (error) {
        console.error('Error getting user data:', error);
        throw error;
    }
};

export const updateUserData = async (userId: string, updates: Partial<UserData>) => {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, updates);
        console.log('User data updated successfully');
    } catch (error) {
        console.error('Error updating user data:', error);
        throw error;
    }
};

// Function to fetch users collection from Firestore
export const fetchUsers = async (): Promise<UserData[]> => {
    try {
        const querySnapshot = await getDocs(collection(db, "users"));
        return querySnapshot.docs.map((doc) => ({
            uid: doc.id,
            ...(doc.data() as Omit<UserData, "uid">),
        }));
    } catch (error) {
        console.error("Error fetching Firestore data:", error);
        throw error;
    }
}; 
import User from '../models/UserModal'

async function createUser(user: IUser) {
    try {
        const result = await User.create(user);

        return result
    } catch (error) {
        console.error("Error:", error);
        throw error; // Rethrow the error if needed
    }
}

async function getAllUsers() {
    try {
        const result = await User.find();
        return result
    } catch (error) {
        console.error("Error:", error);
        throw error; // Rethrow the error if needed
    }
}

async function getUserById(userId: string) {
    try {
        const result = await User.find({ id: userId });
        return result
    } catch (error) {
        console.error("Error:", error);
        throw error; // Rethrow the error if needed
    }
}

async function updateUser(userId: string, update: Partial<IUser>) {
    try {
        const result = await User.updateOne({ $set: update }).where('id').equals(userId);
        return result
    } catch (error) {
        console.error("Error:", error);
        // throw error; // Rethrow the error if needed
    }
}

async function deleteUser(userId: string) {
    try {
        const result = await User.deleteOne({ id: userId });
        return result
    } catch (error) {
        console.error("Error:", error);
        throw error; // Rethrow the error if needed
    }
}

export default {
    createUser,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
}


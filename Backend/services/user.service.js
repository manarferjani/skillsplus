import User from '../models/user.js';

class UserService {
    async addUser(data) {
        try {
            const user = new User(data);
            return await user.save();
        } catch (error) {
            throw new Error(error.message);
        }
    }

    async getAllUsers() {
        try {
            return await User.find({});
        } catch (error) {
            throw new Error(error.message);
        }
    }

    async getUserById(id) {
        if (!id) {
            throw new Error("L'identifiant de l'utilisateur est requis");
        }

        try {
            return await User.findById(id);
        } catch (error) {
            throw new Error(error.message);
        }
    }

    async updateUser(id, data) {
        if (!id) {
            throw new Error("L'identifiant de l'utilisateur est requis");
        }

        try {
            return await User.findByIdAndUpdate(id, data, { new: true });
        } catch (error) {
            throw new Error(error.message);
        }
    }
    
    async deleteUser(id) {
        if (!id) {
            throw new Error("L'identifiant de l'utilisateur est requis");
        }   

        try {
            return await User.findByIdAndDelete(id);
        } catch (error) {
            throw new Error(error.message);
        }
    }

    async join_Test(testId, date) {
        // Implémentez votre logique ici
        throw new Error("Not implemented yet");
    }
}

export default new UserService(); // Notez l'instanciation ici
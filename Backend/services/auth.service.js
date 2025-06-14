// services/auth.service.js
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/user.js";

class AuthService {
  /**
   * Enregistre un nouvel utilisateur.
   * @param {Object} data - Les données de l'utilisateur (name, email, password, role, clerkId).
   * @returns {Promise<Object>} Un objet contenant success, tokens et les données de l'utilisateur.
   * @throws {Error} Si l'utilisateur existe déjà ou en cas d'erreur lors de la sauvegarde.
   */
  async signup(data) {
    // Vérifier l'existence d'un utilisateur avec le même email
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Création du nouvel utilisateur
    const user = new User({
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role || "unspecified",
      jobPosition: data.jobPosition || "unspecified",
      gender: data.gender || "unspecified",
      level: data.level || "junior", // si tu veux une valeur par défaut
      bio: data.bio || "",
      profileImage:
        data.gender === "Female"
          ? "/images/default_female.png"
          : "/images/default_male.png",
    });

    const savedUser = await user.save();
    const tokens = this.generateTokens(savedUser);
    savedUser.refreshToken = tokens.refreshToken;
    await savedUser.save();

    return {
      success: true,
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: savedUser._id,
        name: savedUser.name,
        username: user.username,
        email: savedUser.email,
        role: savedUser.role,
        level: user.level,
        profileImage: user.profileImage,
      },
    };
  }

  /**
   * Authentifie un utilisateur via email et password.
   * @param {Object} data - Contient email et password.
   * @returns {Promise<Object>} Un objet avec success, tokens et les données de l'utilisateur.
   * @throws {Error} Si les identifiants sont incorrects.
   */
  async signin(data) {
    const { email, password } = data;
    console.log("Tentative de connexion pour", email);

    // Trouver l'utilisateur et inclure le mot de passe (select +password)
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      console.log("Utilisateur non trouvé pour", email);
      throw new Error("Invalid credentials");
    }

    // Vérifier que le mot de passe correspond au hash stocké
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log("Mot de passe incorrect pour", email);
      throw new Error("Invalid credentials");
    }

    // Générer les tokens JWT
    const tokens = this.generateTokens(user);

    // Sauvegarder le refresh token dans la base (pour gestion logout, refresh)
    user.refreshToken = tokens.refreshToken;
    await user.save();

    // Retourner réponse sans mot de passe
    return {
      success: true,
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        level: user.level,
        profileImage: user.profileImage,
      },
    };
  }

  /**
   * Authentification via Clerk.
   * @param {Object} data - Contient email, clerkId et optionnellement name.
   * @returns {Promise<Object>} Un objet avec les tokens et les données de l'utilisateur.
   * @throws {Error} Si email ou clerkId manquent.
   */
  async clerk(data) {
    const { email, name, clerkId } = data;
    if (!email || !clerkId) {
      throw new Error("Email and clerkId are required");
    }
    let user = await User.findOne({ clerkId });
    if (!user) {
      user = await User.findOne({ email });
      if (user) {
        user.clerkId = clerkId;
        await user.save();
      } else {
        user = new User({
          name: name || email.split("@")[0],
          email: email,
          // Génère un mot de passe aléatoire pour un login via Clerk
          password:
            Math.random().toString(36).slice(-12) +
            Math.random().toString(36).slice(-12),
          clerkId,
          role: 3,
        });
        await user.save();
      }
    }
    const tokens = this.generateTokens(user);
    return {
      success: true,
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        roleName: user.getRoleName(),
        clerkId: user.clerkId,
      },
    };
  }

  /**
   * Rafraîchit le token d'accès à l'aide d'un refresh token.
   * @param {string} refreshToken - Le refresh token.
   * @returns {Promise<Object>} Un objet avec success et le nouveau token.
   * @throws {Error} Si le refresh token est invalide.
   */
  async refreshToken(oldRefreshToken) {
    if (!oldRefreshToken) {
      throw new Error("Refresh token is required");
    }

    try {
      const decoded = jwt.verify(
        oldRefreshToken,
        process.env.JWT_REFRESH_SECRET ||
          "skills_plus_refresh_token_secret_key_2024"
      );

      const user = await User.findById(decoded.id).select("+refreshToken");

      if (!user || user.refreshToken !== oldRefreshToken) {
        throw new Error("Invalid refresh token");
      }

      // Générer un nouveau refresh token
      const newRefreshToken = jwt.sign(
        { id: user._id },
        process.env.JWT_REFRESH_SECRET ||
          "skills_plus_refresh_token_secret_key_2024",
        { expiresIn: "7d" }
      );

      // Générer un nouvel access token
      const newAccessToken = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET || "skills_plus_super_secret_jwt_key_2024",
        { expiresIn: "1h" }
      );

      // Sauvegarder le nouveau refresh token dans la base
      user.refreshToken = newRefreshToken;
      await user.save();

      return {
        success: true,
        token: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw new Error("Invalid or expired refresh token");
    }
  }

  /**
   * Génère un token d'accès et un refresh token pour un utilisateur donné.
   * @param {Object} user - L'utilisateur pour lequel générer les tokens.
   * @returns {Object} Un objet contenant accessToken et refreshToken.
   */
  generateTokens(user) {
    const payload = {
      id: user._id,
      name: user.name,
      role: user.role,
      email: user.email,
      profileImage: user.profileImage,
      level: user.level,
    };
    //console.log("JWT Payload:", payload);

    const accessToken = jwt.sign(
      payload,
      process.env.JWT_SECRET || "skills_plus_super_secret_jwt_key_2024",
      { expiresIn: "8h" }
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET || "skills_plus_super_secret_jwt_key_2024",
      { expiresIn: "7d" }
    );

    return { accessToken, refreshToken };
  }

  /**
   * Demande un reset de mot de passe en générant un token.
   * @param {string} email - L'email de l'utilisateur.
   * @returns {Promise<Object>} Un objet contenant success, message et resetToken.
   * @throws {Error} Si l'utilisateur n'existe pas.
   */
  async forgotPassword(email) {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error("User with this email does not exist");
    }
    const resetToken = crypto.randomBytes(20).toString("hex");
    const resetTokenExpiry = Date.now() + 3600000; // 1 heure
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();
    // En production, vous envoyez ce token par email.
    return {
      success: true,
      message: "Password reset token generated",
      resetToken,
    };
  }

  /**
   * Réinitialise le mot de passe de l'utilisateur à l'aide d'un reset token.
   * @param {string} resetToken - Le token de réinitialisation.
   * @param {string} newPassword - Le nouveau mot de passe.
   * @returns {Promise<Object>} Un objet indiquant le succès de l'opération.
   * @throws {Error} Si le token est invalide ou expiré.
   */
  async resetPassword(resetToken, newPassword) {
    const user = await User.findOne({
      resetPasswordToken: resetToken,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) {
      throw new Error("Password reset token is invalid or has expired");
    }
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    return {
      success: true,
      message: "Password has been reset",
    };
  }

  /**
   * Renvoie le profil de l'utilisateur authentifié.
   * @param {Object} user - L'utilisateur (généralement injecté par le middleware auth).
   * @returns {Object} Un objet contenant les données du profil.
   */
  getProfile(user) {
    return {
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,

        createdAt: user.createdAt,
      },
    };
  }

  /**
   * Met à jour le profil de l'utilisateur.
   * @param {Object} user - L'utilisateur actuel.
   * @param {Object} data - Les données de mise à jour (par exemple, name).
   * @returns {Promise<Object>} Un objet avec success et l'utilisateur mis à jour.
   * @throws {Error} En cas d'erreur lors de l'enregistrement.
   */
  async updateProfile(user, data) {
    if (data.name) {
      user.name = data.name;
    }
    await user.save();
    return {
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  /**
   * Change le mot de passe de l'utilisateur.
   * @param {Object} user - L'utilisateur actuellement authentifié.
   * @param {string} currentPassword - Le mot de passe actuel.
   * @param {string} newPassword - Le nouveau mot de passe.
   * @returns {Promise<Object>} Un objet indiquant le succès de l'opération.
   * @throws {Error} Si le mot de passe actuel est incorrect.
   */
  async changePassword(user, currentPassword, newPassword) {
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new Error("Current password is incorrect");
    }
    user.password = newPassword;
    await user.save();
    return {
      success: true,
      message: "Password changed successfully",
    };
  }

  /**
   * Logout: Invalidate refresh token server-side and advise client to remove tokens.
   * @param {string} userId - ID of the user to logout
   * @returns {Object} Confirmation of logout.
   */
  async logout(userId) {
    const user = await User.findById(userId);

    if (user) {
      user.refreshToken = null; // Or optionally: delete user.refreshToken;
      await user.save();
    }

    return {
      success: true,
      message: "Logout successful. Please remove tokens from client storage.",
    };
  }
}

export default new AuthService();
